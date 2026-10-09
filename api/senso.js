// Serverless proxy for the optional Senso AI features (Vercel Node function, also mounted by vite dev).
// The Groq key lives ONLY in the GROQ_API_KEY environment variable and is never sent to the browser.
// Model: qwen/qwen3.8-27b (Groq's documented vision model). Override with GROQ_MODEL.

const MODEL = () => process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
const BASE = () => process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const MAX_BODY = 1_800_000;
const hits = new Map();

function limited(ip) {
  const now = Date.now(), win = 60_000, max = 14;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now); hits.set(ip, arr);
  return arr.length > max;
}

// Reference descriptions so the model is grounded instead of recalling handshapes from memory.
const REF = {
  A: 'fist, thumb resting along the side of the index finger', B: 'flat hand, fingers together and up, thumb folded across the palm',
  C: 'curved hand like holding a cup', D: 'index finger up, other fingers curve to touch the thumb',
  E: 'fingers bent down tightly over a tucked thumb', F: 'thumb and index touch in a circle, other three fingers up',
  G: 'index finger and thumb point sideways, parallel', H: 'index and middle fingers point sideways together',
  I: 'pinky up, other fingers in a fist, thumb across them', J: 'like I, then the pinky draws a J in the air (moves)',
  K: 'index and middle up in a V, thumb resting against the middle finger', L: 'index up, thumb out, forming an L',
  M: 'thumb tucked under the first three fingers in a fist', N: 'thumb tucked under the first two fingers in a fist',
  O: 'fingers curve to meet the thumb in a circle', P: 'like K but pointing downward', Q: 'like G but pointing downward',
  R: 'index and middle fingers crossed', S: 'fist, thumb wrapped across the front of the fingers',
  T: 'fist with the thumb poking between index and middle fingers', U: 'index and middle up, together',
  V: 'index and middle up, spread apart', W: 'three fingers up and fanned, thumb on the pinky',
  X: 'index finger bent like a hook, other fingers in a fist', Y: 'thumb and pinky out, other fingers curled',
  Z: 'index finger draws a Z in the air (moves)',
};

const SYSTEM = (family) => `You are Senso, a friendly, concise ASL fingerspelling practice coach for hearing learners.
Rules: describe only what is visible or what the measurements say; if a photo is unclear, say so instead of guessing; never claim certainty; no emojis; plain text only.
You are a practice aid, not a substitute for Deaf teachers. Fingerspelling is only a small part of ASL.
Keep answers to at most three short sentences unless asked for a plan.${family ? '\nThe reader is a hearing parent or relative of a Deaf child who is brand new to signing. Use simple everyday words, be warm and encouraging, and avoid jargon.' : ''}`;

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > MAX_BODY) throw Object.assign(new Error('too large'), { code: 413 }); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').slice(0, n);
const JPEG = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;

export default async function handler(req, res) {
  const send = (code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); };
  if (req.method !== 'POST') return send(405, { error: 'POST only' });
  if (!process.env.GROQ_API_KEY) return send(503, { error: 'AI features are not configured on this server (missing GROQ_API_KEY).' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'ip').split(',')[0].trim();
  if (limited(ip)) return send(429, { error: 'Easy there. Try again in a minute.' });

  let b;
  try { b = await readJson(req); } catch (e) { return send(e.code === 413 ? 413 : 400, { error: e.code === 413 ? 'Image too large.' : 'Bad request.' }); }
  const kind = ['hand', 'why', 'rephrase', 'summary', 'name'].includes(b.kind) ? b.kind : 'hand';
  const family = b.audience === 'family';
  const target = clean(b.target, 1).toUpperCase();
  const needTarget = kind === 'hand' || kind === 'why' || kind === 'rephrase';
  if (needTarget && !/^[A-Z]$/.test(target)) return send(400, { error: 'Missing target letter.' });

  const content = []; let text; let maxTokens = 200;
  const ref = REF[target] ? `Reference for ${target}: ${REF[target]}.` : '';
  if (kind === 'hand' || kind === 'why') {
    const img = String(b.image || '');
    if (kind === 'hand' && !JPEG.test(img)) return send(400, { error: 'Send one JPEG data URL.' });
    if (img && (!JPEG.test(img) || img.length > MAX_BODY)) return send(400, { error: 'Send one JPEG data URL.' });
    const notes = clean(b.notes, 600) || 'none';
    if (kind === 'hand') {
      text = `Target letter: ${target}. ${ref}\nGeometry engine (may be absent for letters it does not cover): ${notes}\nDoes the hand match the target? Give the single most useful fix. If the letter involves motion or hand direction, say a still photo cannot confirm it.`;
    } else {
      const reading = clean(b.reading, 20) || 'unknown';
      text = `The learner is trying to sign ${target}. ${ref}\nThe geometry engine rejected it. Engine reading: ${reading}. Measurements: ${notes}\nIn plain words, explain why this attempt did not count as ${target} and what to change. Name the specific finger or thumb.`;
    }
    content.push({ type: 'text', text });
    if (img) content.push({ type: 'image_url', image_url: { url: img } });
  } else if (kind === 'rephrase') {
    text = `Target letter: ${target}. ${ref}\nThe app's built-in correction is: "${clean(b.message, 300)}"\nSay the same correction in a warmer, more vivid way, with one simple image or comparison that helps the learner remember it. Do not change what to fix.`;
    content.push({ type: 'text', text });
  } else if (kind === 'name') {
    const word = clean(b.word, 20).toUpperCase().replace(/[^A-Z]/g, '');
    if (!word) return send(400, { error: 'Missing word.' });
    const stats = clean(JSON.stringify(b.stats || {}), 600);
    text = `The learner will fingerspell "${word}". Their clean successes so far by letter: ${stats}. Letters this app can check: A B C D F I K L O S U V W X Y.\nWrite a short practice note: which letters in this word will be hardest and why (use the look-alike pairs A/S, U/V, K/V, C/O, D/O, I/Y), and how to warm up. Mention that J and Z move, and that letters the app can't check still deserve practice with a teacher or video.`;
    content.push({ type: 'text', text });
  } else {
    const stats = clean(JSON.stringify(b.stats || {}), 1400);
    maxTokens = 320;
    text = `Session stats: ${stats}.\nWrite a warm recap in two sentences, then a "Plan for next time" with exactly three short bullet lines starting with "- ". Base the plan on the weakest letters and look-alike pairs. No emojis.`;
    content.push({ type: 'text', text });
  }

  try {
    const r = await fetch(`${BASE()}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: MODEL(), temperature: 0.3, max_tokens: maxTokens, messages: [{ role: 'system', content: SYSTEM(family) }, { role: 'user', content }] }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return send(502, { error: j?.error?.message ? `AI service: ${j.error.message}`.slice(0, 200) : `AI service error (${r.status}).` });
    const out = String(j?.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    return send(200, { text: out || 'No answer came back. Try again.', model: MODEL(), kind });
  } catch {
    return send(502, { error: 'Could not reach the AI service.' });
  }
}
