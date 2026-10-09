import { aurora, spotlight } from '../fx.js';
import { LETTER_SET, buildHand, poseParams, lerpParams } from '../pose.js';
import { toPalmFrame, computeFeatures, FEATURE_LABELS } from '../geometry.js';
import { classify, scoreLetter, feedback } from '../engine.js';
import { DESCRIPTIONS, CURRICULUM, CONSTRAINTS } from '../letters.js';
import { ScoreSmoother, Hysteresis, Coach } from '../temporal.js';
import { startCamera, createLandmarker, detect, environmentReport } from '../vision.js';
import { DemoHand } from '../demo.js';
import * as hud from '../hud.js';
import { setSensoPose } from '../senso.js';
import { mastery, daily, practiceHistory } from '../progress.js';

const $ = (id) => document.getElementById(id);
const el = Object.fromEntries([
  'senso-img', 'b-mastery', 'mastery-modal', 'mastery-grid', 'mastery-close',
  'report-modal', 'report-title', 'report-body', 'report-share', 'report-close',
  'stage', 'stage-placeholder', 'video', 'hud', 'fx', 'view3d', 'ghost', 'radar', 'glyph', 'desc', 'gauge', 'gaugev',
  'coach', 'coach-ico', 'coach-msg', 'reading', 'meters', 'word', 'pop', 'streak', 'modepill',
  'tol', 'tolv', 'custom', 'custom-start', 'custom-word', 'debug-output', 'dbgcard', 'start', 'start-note', 'help', 'b-offline', 'b-fps',
  'b-track', 'ai-btn', 'ai-sum', 'ai-out', 'ai-name', 'ai-letter', 'family', 'go-family', 'go-family2', 'b-goal', 'c-why', 'c-simple', 'c-speak', 'coach-ai', 'diag', 'diag-title', 'diag-hint', 'retry-cam', 'pick-model-wrap', 'model-file', 'model-link', 'intro', 'intro-skip', 'intro-status', 'welcome-video', 'b-snd', 'b-cam', 'b-flip', 'b-dbg', 'b-help', 'go-cam', 'help-close'
].map((k) => [k, $(k)]));

const WORDS = ['BOLD', 'CLOUD', 'SOLID', 'VISUAL', 'WILD', 'BASIC', 'DAILY', 'LOUD'];
const K = ['curlI', 'curlM', 'curlR', 'curlP'];
const THUMB_MAP = { thumbSide: [-0.5, 0.9, 'sideways'], thumbSN: [-0.3, 0.6, 'depth'], thumbIndexSide: [0, 0.55, 'beside index'], dTI: [0, 1.6, 'to index'], dTM: [0, 1.6, 'to middle'], dTR: [0, 1.6, 'to ring'], dTP: [0, 1.6, 'to pinky'] };
const qs = new URLSearchParams(location.search);
const EMBEDDED_DEMO = qs.get('demo') === '1' || qs.get('muted') === '1';

const S = {
  log: [], t0: performance.now(), pickedModel: null,
  mode: 'practice', seq: [], idx: 0, target: 'A', tol: 1, flip: false, votes: 0, source: null, stream: null, lm: null,
  frameState: {}, smooth: new ScoreSmoother(), hyst: new Hysteresis(0.8, 0.65), coach: new Coach(1500),
  hold: 0, cool: 0, streak: 0, view: null, det: null, lastSeen: 0, lastProc: 0, frames: 0, fpsT: 0, fps: 0,
  ghostFrom: poseParams('A'), ghostTo: poseParams('A'), ghostCur: poseParams('A'), ghostT: 1,
  trails: {}, v3: { yaw: 0.6, pitch: 0.28, drag: false, manual: false }, muted: EMBEDDED_DEMO, wordIdx: 0, custom: false, wordStart: 0, demo: new DemoHand(), demoAcc: 0, lastT: 0, uiT: 0, dbgOn: false, pendingFamily: false,
};
const confetti = new hud.Confetti();

// ---------- sequence / target management ----------
function syncModeUrl(mode, word) {
  const params = new URLSearchParams(location.search);
  if (mode === 'practice') { params.delete('mode'); params.delete('word'); }
  else {
    params.set('mode', mode);
    if (mode === 'spell' && word) params.set('word', word); else params.delete('word');
  }
  const query = params.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
}
function setSeqPractice() { S.mode = 'practice'; S.custom = false; S.seq = CURRICULUM.map((ch) => ({ ch })); S.idx = 0; syncModeUrl('practice'); applyTarget(); chips(); tabs(); }
function setWeakWarmup() {
  S.mode = 'warmup'; S.custom = false;
  S.seq = practiceHistory.weakest(LETTER_SET, 5).map((ch) => ({ ch })); S.idx = 0;
  syncModeUrl('warmup');
  applyTarget(); chips(); tabs();
  toast(practiceHistory.hasAttempts(LETTER_SET) ? 'Warm-up: letters you have found tricky.' : 'Warm-up: start with five letters. Misses will shape your next round.');
}
function setWord(w, custom = false) {
  S.mode = 'spell'; S.custom = custom;
  const chars = [...w.toUpperCase().replace(/[^A-Z]/g, '')];
  S.seq = chars.map((ch) => ({ ch, skip: !LETTER_SET.includes(ch) }));
  S.idx = S.seq.findIndex((s) => !s.skip);
  if (S.idx < 0) { S.seq = [...'BOLD'].map((ch) => ({ ch })); S.idx = 0; toast('None of those letters are in this build yet - try A B C D F I K L O S U V W X Y'); }
  S.wordStart = performance.now(); syncModeUrl('spell', chars.join('')); applyTarget(); chips(); tabs();
}
function tabs() { document.querySelectorAll('.tabs button').forEach((b) => { const active = b.dataset.mode === S.mode; b.classList.toggle('on', active); b.setAttribute('aria-pressed', String(active)); }); el.modepill.textContent = S.mode === 'practice' ? 'PRACTICE · LOOK-ALIKE LETTERS' : S.mode === 'warmup' ? 'WARMUP · YOUR TRICKIEST LETTERS' : 'SPELL · ' + S.seq.map((s) => s.ch).join(''); el['custom-word'].hidden = S.mode !== 'spell'; }
function applyTarget() {
  const l = S.seq[S.idx].ch; S.target = l;
  S.coach.cur = null; S.lastKey = null;
  S.ghostFrom = S.ghostCur; S.ghostTo = poseParams(l); S.ghostT = 0;
  el.glyph.textContent = l; el.desc.textContent = DESCRIPTIONS[l] || '';
  S.hyst.reset(); S.hold = 0; S.demo.setTarget(l); buildMeterBands(); chips();
}
function chips() {
  el.word.innerHTML = '';
  const mk = (txt, cls) => { const d = document.createElement('div'); d.className = 'chip ' + cls; d.textContent = txt; el.word.appendChild(d); };
  if (S.mode === 'spell' || S.mode === 'warmup') S.seq.forEach((s, i) => mk(s.ch, s.skip ? 'skip' : i < S.idx ? 'done' : i === S.idx ? 'cur' : ''));
  else for (let i = 0; i < 9; i++) mk(S.seq[(S.idx + i) % S.seq.length].ch, i === 0 ? 'cur' : 'next');
  const skipped = S.seq.filter((s) => s.skip).map((s) => s.ch);
  const note = document.createElement('span'); note.className = 'chip-note';
  note.textContent = S.mode === 'practice' ? 'Look-alike practice: A vs S, U vs V, C vs O, I vs Y.' : S.mode === 'warmup' ? (practiceHistory.hasAttempts(LETTER_SET) ? 'Picked from your saved practice history.' : 'Your next warm-up will adapt to your practice history.') : skipped.length ? 'Not included in this practice set: ' + [...new Set(skipped)].join(' ') : '';
  el.word.appendChild(note);
}
function advance() {
  do { S.idx++; } while (S.seq[S.idx]?.skip);
  if (S.idx >= S.seq.length) {
    if (S.mode === 'spell') {
      const secs = ((performance.now() - S.wordStart) / 1000).toFixed(1);
      popText(`WORD! ${secs}s`, true); const r = el.stage.getBoundingClientRect(); confetti.burst(r.width / 2, r.height / 2, 220, 14); chime(7);
      S.idx = S.seq.length - 1; chips();
      showReport(S.seq.map(s => s.ch).join(""), secs);
      setTimeout(() => { if (S.mode !== 'spell') return; if (S.custom) setSeqPractice(); else { S.wordIdx = (S.wordIdx + 1) % WORDS.length; setWord(WORDS[S.wordIdx]); } }, 2400);
      S.cool = 3; return;
    }
    if (S.mode === 'warmup') { popText('WARMUP DONE', true); chime(7); setTimeout(() => { if (S.mode === 'warmup') setSeqPractice(); }, 1200); return; }
    S.idx = 0;
  }
  applyTarget();
}
function success(px) {
  mastery.hit(S.target); S.log.push(S.target); bump(S.stats.ok, S.target);
  if (daily.add()) { setTimeout(() => { popText('Daily goal!', true); const r = el.stage.getBoundingClientRect(); confetti.burst(r.width / 2, r.height / 2, 200, 13); chime(7); say('Daily goal reached. Nice work.', true); }, 900); }
  renderGoal();
  S.cool = 1.2; S.streak++; el.streak.textContent = 'STREAK ' + S.streak;
  popText(S.target); if (px) confetti.burst(px[0], px[1], 70, 9); chime(S.idx);
  if (S.mode === 'spell') { S.seq[S.idx].done = true; }
  setTimeout(advance, 800);
}

// ---------- small UI helpers ----------
let toastT; function toast(msg) { el['start-note'].textContent = msg; const c = el.coach; c.dataset.kind = 'amb'; el['coach-ico'].textContent = 'i'; el['coach-msg'].textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => { S.coach.cur = null; }, 3500); }
function popText(t, big) { const p = el.pop; p.textContent = t; p.classList.toggle('big', !!big); p.classList.remove('show'); void p.offsetWidth; p.classList.add('show'); }
let actx; function chime(i) {
  if (S.muted) return; try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = 523.25 * Math.pow(2, (([0, 2, 4, 7, 9, 12, 14, 16][i % 8]) / 12)); g.gain.setValueAtTime(0.0001, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.18, actx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.35);
    o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.4);
  } catch { /* audio is optional */ }
}
function setBadge(node, text, cls) { node.textContent = text; node.className = 'badge ' + (cls || ''); }

// ---------- meters ("show your work") ----------
const NAMES = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
const meters = NAMES.map((n) => {
  const d = document.createElement('div'); d.className = 'meter'; d.dataset.ok = '';
  d.innerHTML = '<div class="m-track"><div class="m-band"></div><div class="m-fill"></div><div class="m-mark"></div></div><div class="m-ico">-</div><div class="m-name"></div>';
  el.meters.appendChild(d); return { d, band: d.querySelector('.m-band'), fill: d.querySelector('.m-fill'), mark: d.querySelector('.m-mark'), ico: d.querySelector('.m-ico'), name: d.querySelector('.m-name'), c: null, lo: 0, rng: 1 };
});
function meterConstraint(i) { const cs = CONSTRAINTS[S.target]; return i === 0 ? cs.find((c) => THUMB_MAP[c.feature]) : cs.find((c) => c.feature === K[i - 1]); }
function buildMeterBands() {
  meters.forEach((m, i) => {
    const c = meterConstraint(i); m.c = c;
    if (!c) { m.band.style.display = 'none'; m.name.textContent = NAMES[i]; return; }
    const [mn, mx, lab] = i === 0 ? THUMB_MAP[c.feature] : [0, 1]; m.lo = mn; m.rng = mx - mn;
    const lo = Math.max(0, (c.lo - mn) / m.rng), hi = Math.min(1, (c.hi - mn) / m.rng);
    m.band.style.display = ''; m.band.style.bottom = lo * 100 + '%'; m.band.style.height = Math.max(3, (hi - lo) * 100) + '%';
    m.name.textContent = i === 0 ? `Thumb\n${lab}` : NAMES[i]; m.name.style.whiteSpace = 'pre-line';
  });
}
function updateMeters() {
  const v = S.view;
  meters.forEach((m) => {
    if (!m.c || !v) { m.fill.style.height = '0%'; m.mark.style.bottom = '0%'; m.d.dataset.ok = ''; m.ico.textContent = '-'; return; }
    const x = (v.F[m.c.feature] - m.lo) / m.rng, p = Math.max(0, Math.min(1, x));
    m.fill.style.height = p * 100 + '%'; m.mark.style.bottom = `calc(${p * 100}% - 1px)`;
    const part = v.targetRes.parts.find((q) => q.c.id === m.c.id), ok = part && part.s >= 0.85;
    m.d.dataset.ok = ok ? '1' : '0'; m.ico.textContent = ok ? 'ok' : 'x';
    m.d.setAttribute('aria-label', `${m.name.textContent.replace('\n', ' ')}: ${ok ? 'correct' : 'needs adjusting'}`);
  });
}

// ---------- the per-frame pipeline ----------
function process(det, now) {
  S.frames++; S.det = det;
  if (!det) { S.view = null; if (now - S.lastSeen > 500) { S.smooth.reset(); S.hyst.reset(); S.hold = Math.max(0, S.hold - 0.1); } coachUpdate(now, null); return; }
  S.lastSeen = now; const dt = Math.min(0.1, (now - (S.lastProc || now)) / 1000); S.lastProc = now;
  const mirror = (det.label === 'Left') !== S.flip;
  const fr = toPalmFrame(det.world, mirror, S.frameState);
  const F = computeFeatures(fr.pts, fr);
  if (F.curlMean > 0.6) {
    if (F.tipSide < -0.04) S.votes++; else if (F.tipSide > 0.04) S.votes = Math.max(0, S.votes - 1);
    if (S.votes >= 8) { S.flip = !S.flip; S.frameState.basis = null; S.smooth.reset(); flashFlip(); return; }
  }
  const res = classify(F, S.tol); S.smooth.push(res.ranked);
  const targetRes = scoreLetter(S.target, F, S.tol), sm = S.smooth.v[S.target] ?? 0;
  const critOk = targetRes.parts.every((p) => !p.c.critical || p.s >= 0.5);
  const matched = S.hyst.update(sm) && critOk && S.cool <= 0;
  const fb = feedback(targetRes);
  if (S.cool > 0) S.cool -= dt;
  if (matched) { S.hold += dt; } else S.hold = Math.max(0, S.hold - dt * 2);
  S.view = { fr, F, res, targetRes, fb, matched, sm };
  if (S.hold >= 0.5 && S.cool <= 0) { S.hold = 0; success(det._wristPx); }
  coachUpdate(now, S.view);
}
function flashFlip() { toast('Handedness convention auto-corrected'); }

function coachUpdate(now, v) {
  let cand;
  if (!v) cand = { kind: 'idle', key: 'idle', icon: '👋', text: 'Show your hand to the camera.' };
  else if (v.matched || S.cool > 0) cand = { kind: 'ok', key: 'ok', icon: 'ok', text: `Clean ${S.target}! Hold it…` };
  else {
    const top = v.res.top, amb = v.res.ambiguous;
    if (amb && amb.pair.includes(S.target)) cand = { kind: 'amb', key: 'amb' + amb.pair.join(''), icon: '≈', text: amb.msg };
    else if (v.fb) cand = { kind: 'fix', key: v.fb.key, icon: '→', text: v.fb.msg };
    else cand = { kind: 'fix', key: 'near', icon: '…', text: 'I’m checking the shape. Hold steady for a moment.' };
    if (top.accepted && top.letter !== S.target && !v.fb) cand = { kind: 'fix', key: 'other' + top.letter, icon: '→', text: `That reads as ${top.letter}. Aim for ${S.target}.` };
  }
  const c = S.coach.update(now, cand);
  if (c.key !== S.lastKey) {
    S.lastKey = c.key;
    if (c.kind === 'fix' || c.kind === 'amb') { bump(S.stats.miss, S.target); practiceHistory.miss(S.target); if (c.key.startsWith('other')) bump(S.stats.confused, `${S.target}->${c.key.slice(5)}`); say(c.text); }
    const attempt = c.kind === 'fix' || c.kind === 'amb'; el['c-why'].hidden = !attempt; el['c-simple'].hidden = !attempt || c.key === 'near';
    if (attempt) el['c-why'].textContent = `Why not ${S.target}?`;
  }
  if (el.coach.dataset.kind !== c.kind) el.coach.dataset.kind = c.kind;
  if (el['coach-msg'].textContent !== c.text) { el['coach-msg'].textContent = c.text; }
  setSensoPose(el['senso-img'], c.kind, c.key);
}

// ---------- rendering ----------
function renderStage(t) {
  const { ctx, w, h } = hud.fitCanvas(el.hud); const demo = S.source === 'demo';
  if (demo) hud.drawBackdrop(ctx, w, h, t); else ctx.clearRect(0, 0, w, h);
  hud.scanline(ctx, w, h, t);
  const v = S.view, det = S.det;
  if (v && det) {
    const vw = demo ? 1280 : el.video.videoWidth || 1280, vh = demo ? 720 : el.video.videoHeight || 720;
    const px = det.landmarks.map(hud.makeMapper(w, h, vw, vh)); det._wristPx = px[0];
    const canon = buildHand(S.ghostCur);
    hud.drawGhostOverlay(ctx, canon, px, 0.75 * (1 - Math.min(1, v.sm) * 0.75), t);
    [4, 8, 12, 16, 20].forEach((i) => { const tr = (S.trails[i] = S.trails[i] || []); tr.push(px[i]); if (tr.length > 14) tr.shift(); });
    const top = v.res.top, sm = S.smooth.v[top.letter] ?? 0;
    const focus = !v.matched && v.fb ? v.fb.part.c.focus.map((id, k) => ({ id, label: k === 0 ? v.fb.part.c.label : '' })) : [];
    hud.drawHand(ctx, px, { score: v.sm, t, focus, trails: S.trails, badge: sm > 0.55 ? `${top.letter}  ${Math.round(sm * 100)}%` : 'READING…' });
  } else S.trails = {};
  const f = hud.fitCanvas(el.fx); confetti.draw(f.ctx, f.w, f.h);
}
function renderSide(t, dt) {
  if (S.ghostT < 1) { S.ghostT = Math.min(1, S.ghostT + dt / 0.5); const e = S.ghostT * S.ghostT * (3 - 2 * S.ghostT); S.ghostCur = lerpParams(S.ghostFrom, S.ghostTo, e); }
  const g = hud.fitCanvas(el.ghost); hud.drawGhostCard(g.ctx, g.w, g.h, buildHand(S.ghostCur), t);
  const v = S.view, sc = S.smooth.v;
  if (Math.min(el.radar.clientWidth, el.radar.clientHeight) > 44) {
    const r = hud.fitCanvas(el.radar);
    const ranked = Object.entries(sc).sort((a, b) => b[1] - a[1]);
    hud.drawRadar(r.ctx, r.w, r.h, LETTER_SET, sc, { target: S.target, top: ranked[0]?.[0], topScore: ranked[0]?.[1], live: !!v });
  }
  const p = hud.fitCanvas(el.view3d);
  if (!S.v3.manual) S.v3.yaw = 0.55 + Math.sin(t * 0.45) * 0.55;
  hud.draw3D(p.ctx, p.w, p.h, v ? v.fr.pts : null, S.v3);
  updateMeters();
  const pct = Math.round((S.smooth.v[S.target] ?? 0) * 100) * (v ? 1 : 0);
  el.gauge.style.setProperty('--p', pct); el.gaugev.textContent = pct + '%';
}
function renderSlow(t) {
  const now = performance.now(); S.fps = S.frames; S.frames = 0;
  setBadge(el['b-fps'], S.fps + ' fps', S.fps >= 24 ? 'ok' : S.fps >= 12 ? 'warn' : 'bad');
  const conf = S.det?.conf ?? 0, q = !S.det ? ['Tracking: no hand', ''] : conf > 0.9 ? ['Tracking: good', 'ok'] : conf > 0.7 ? ['Tracking: ok', 'warn'] : ['Tracking: weak - add light', 'bad'];
  setBadge(el['b-track'], q[0], q[1]);
  const v = S.view;
  if (v) {
    const [a, b] = v.res.ranked; const f = (x) => Math.round(x.score * 100) + '%';
    el.reading.textContent = `Reading: ${a.letter} ${f(a)}  ·  next: ${b.letter} ${f(b)}` + (v.res.ambiguous ? '  ·  ambiguous' : '');
  } else el.reading.textContent = '';
  if (S.dbgOn && v) {
    const lines = ['FEATURES (palm frame)']; for (const [k, lab] of Object.entries(FEATURE_LABELS)) if (v.F[k] != null) lines.push(lab.padEnd(22) + v.F[k].toFixed(2).padStart(7));
    lines.push('', `TARGET ${S.target} · score ${v.targetRes.score.toFixed(2)} · flip=${S.flip}`);
    v.targetRes.parts.forEach((p) => lines.push(`${p.s >= 0.85 ? 'ok' : 'x'} ${p.c.label.padEnd(22)} s=${p.s.toFixed(2)}  x=${p.x.toFixed(2)} [${p.c.lo}…${p.c.hi}]`));
    el['debug-output'].textContent = lines.join('\n');
  }
}
function frame(ms) {
  const t = ms / 1000, dt = Math.min(0.05, t - S.lastT || 0.016); S.lastT = t;
  if (S.source === 'demo') {
    S.demoAcc += dt;
    while (S.demoAcc >= 1 / 30) { S.demoAcc -= 1 / 30; S.demo.step(1 / 30); process(S.demo.sample(el.stage.clientWidth / el.stage.clientHeight), performance.now()); }
  }
  renderStage(t); renderSide(t, dt);
  if (t - S.uiT > 1) { S.uiT = t; renderSlow(t); } else if (S.dbgOn && Math.floor(t * 8) !== Math.floor((t - dt) * 8)) renderSlow(t);
  requestAnimationFrame(frame);
}

// ---------- sources ----------
function useDemo() {
  S.source = 'demo'; el.video.style.visibility = 'hidden'; el['stage-placeholder'].hidden = true; S.demo.setTarget(S.target); S.demo.phase = 0;
  setBadge(el['b-offline'], '● On-device · demo hand', 'ok'); el['b-cam'].classList.remove('on'); el.start.hidden = true;
}
function showDiag(e) {
  el.start.hidden = false; el.diag.hidden = false;
  el['diag-title'].textContent = e.step === 'model' ? 'Hand model not available' : e.step === 'runtime' ? 'Tracking runtime did not load' : e.step === 'init' ? 'Tracker failed to start' : 'Camera did not start';
  el['diag-hint'].textContent = `${e.hint || 'Something went wrong.'} (${e.message})`;
  const m = e.step === 'model' || e.step === 'init'; el['pick-model-wrap'].hidden = !m; el['model-link'].hidden = !m;
  el['start-note'].textContent = '';
}
let camBusy = false;
async function useCamera() {
  if (camBusy) return; camBusy = true; el.diag.hidden = true; el.start.hidden = false;
  el['go-cam'].disabled = true; el['b-cam'].disabled = true;
  try {
    el['start-note'].textContent = 'Requesting camera - choose Allow when your browser asks...';
    if (!S.stream) S.stream = await startCamera(el.video);
    if (!S.lm) { const r = await createLandmarker({ onStep: (_k, msg) => { el['start-note'].textContent = msg + '...'; }, pickedModel: S.pickedModel }); S.lm = r.lm; S.offline = r.offline; S.delegate = r.delegate; }
    S.source = 'camera'; el.video.style.visibility = ''; el['stage-placeholder'].hidden = true; el.start.hidden = true;
    setBadge(el['b-offline'], S.offline ? `On-device · ${S.delegate}` : `On-device · model from CDN · ${S.delegate}`, S.offline ? 'ok' : 'warn');
    el['b-cam'].classList.add('on');
    if (S.pendingFamily) { S.pendingFamily = false; el.start.hidden = true; setWord('ILY', true); toast('I-L-Y: three letters that combine into the sign for “I love you”.'); }
    const cb = () => { if (S.source !== 'camera') return; let det = null; try { det = detect(S.lm, el.video); } catch (e) { console.warn(e); } process(det, performance.now()); el.video.requestVideoFrameCallback ? el.video.requestVideoFrameCallback(cb) : requestAnimationFrame(cb); };
    el.video.requestVideoFrameCallback ? el.video.requestVideoFrameCallback(cb) : requestAnimationFrame(cb);
  } catch (e) {
    console.warn(e); showDiag(e.step ? e : Object.assign(e, { step: 'camera', hint: 'Unexpected error.' }));
  } finally { camBusy = false; el['go-cam'].disabled = false; el['b-cam'].disabled = false; }
}
el['retry-cam'].onclick = useCamera;
el['model-file'].onchange = async () => { const f = el['model-file'].files[0]; if (!f) return; S.pickedModel = await f.arrayBuffer(); S.lm = null; useCamera(); };
const startCustomWord = () => { const word = el.custom.value.trim(); if (word) setWord(word, true); };
el['custom-start'].onclick = startCustomWord;

// ---------- optional AI features (server proxy; nothing is sent until a button is pressed) ----------
const store = { get(k, d) { try { const v = localStorage.getItem('signsense:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem('signsense:' + k, JSON.stringify(v)); } catch { /* ignore */ } } };
S.family = !!store.get('family', false); S.speak = !!store.get('speak', false);
S.stats = { ok: {}, miss: {}, confused: {} };
const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };
const NOTE_KEYS = ['curlI', 'curlM', 'curlR', 'curlP', 'thumbSide', 'thumbSN', 'spreadIM', 'dTI'];
const featureNotes = () => {
  const F = S.view?.F; if (!F) return '';
  return NOTE_KEYS.filter((k) => typeof F[k] === 'number').map((k) => `${k}=${F[k].toFixed(2)}`).join(', ');
};
const engineNotes = (letter) => {
  if (!LETTER_SET.includes(letter) || !S.view) return 'no engine data for this letter';
  const sc = S.smooth.v?.[letter]; const fb = letter === S.target ? S.view.fb?.msg : '';
  return `engine match for ${letter}: ${sc != null ? Math.round(sc * 100) + '%' : 'unknown'}${fb ? '; suggested fix: ' + fb : ''}; ${featureNotes()}`;
};
function aiShow(node, text, err) { node.hidden = false; node.className = 'ai-out' + (err ? ' err' : ''); node.textContent = text; }
let aiBusy = false;
async function aiCall(payload, node, busyBtn) {
  if (aiBusy) return; aiBusy = true; payload.audience = S.family ? 'family' : 'standard';
  aiShow(node, 'Senso is thinking...'); const btns = document.querySelectorAll('#ai button, .coach-actions button'); btns.forEach((x) => (x.disabled = true));
  try {
    const r = await fetch('/api/senso', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
    aiShow(node, j.text); if (S.speak) say(j.text, true);
  } catch (e) { aiShow(node, e.message || 'AI is unavailable. The coach still works without it.', true); }
  finally { aiBusy = false; btns.forEach((x) => (x.disabled = false)); }
}
function captureHand() {
  const c = document.createElement('canvas'); const out = 384; c.width = c.height = out; const g = c.getContext('2d');
  const d = S.det;
  if (S.source === 'camera' && el.video.videoWidth && d) {
    const vw = el.video.videoWidth, vh = el.video.videoHeight;
    const xs = d.landmarks.map((p) => p.x * vw), ys = d.landmarks.map((p) => p.y * vh);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const side = Math.min(Math.max(x1 - x0, y1 - y0) * 1.5, vw, vh), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const sx = Math.max(0, Math.min(vw - side, cx - side / 2)), sy = Math.max(0, Math.min(vh - side, cy - side / 2));
    g.drawImage(el.video, sx, sy, side, side, 0, 0, out, out);
  } else if (S.source === 'demo') {
    const h = el.hud, side = Math.min(h.width, h.height); g.fillStyle = '#05080c'; g.fillRect(0, 0, out, out);
    g.drawImage(h, (h.width - side) / 2, (h.height - side) / 2, side, side, 0, 0, out, out);
  } else return null;
  return c.toDataURL('image/jpeg', 0.8);
}
const NEED_HAND = 'Start the camera and hold your hand in view first.';
// Check any letter A-Z (engine data is attached when the engine covers it; otherwise the AI works from the photo alone).
el['ai-btn'].onclick = () => {
  const L = el['ai-letter'].value || S.target; const img = captureHand();
  if (!img) return aiShow(el['ai-out'], NEED_HAND, true);
  aiCall({ kind: 'hand', target: L, image: img, notes: engineNotes(L) }, el['ai-out']);
};
el['ai-sum'].onclick = () => {
  const mins = +((performance.now() - S.t0) / 60000).toFixed(1); const dl = daily.state();
  const weakest = Object.entries(S.stats.miss).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([l, n]) => `${l}:${n}`);
  aiCall({ kind: 'summary', stats: { cleanByLetter: S.stats.ok, missesByLetter: S.stats.miss, lookAlikeConfusions: S.stats.confused, weakest, totalClean: S.log.length, bestStreak: S.streak, minutes: mins, todayCount: dl.count, dailyGoal: dl.goal, dayStreak: dl.streak } }, el['ai-out']);
};
el['ai-name'].onclick = () => {
  const typed = el.custom.value.trim(); const word = typed || (S.mode === 'spell' ? S.seq.map((x) => x.ch).join('') : WORDS[S.wordIdx]);
  const m = {}; LETTER_SET.forEach((l) => { m[l] = mastery.get(l); });
  aiCall({ kind: 'name', word, stats: m }, el['ai-out']);
};
// Coach card helpers: "Why not X?" and "Say it differently".
el['c-why'].onclick = () => {
  const top = S.view?.res?.top; const img = captureHand();
  aiCall({ kind: 'why', target: S.target, reading: top ? `${top.letter} (${Math.round(top.score * 100)}%)` : 'unclear', notes: engineNotes(S.target), image: img || undefined }, el['coach-ai']);
};
el['c-simple'].onclick = () => aiCall({ kind: 'rephrase', target: S.target, message: el['coach-msg'].textContent }, el['coach-ai']);
// Family mode + I-L-Y drill.
el.family.checked = S.family; el.family.onchange = () => { S.family = el.family.checked; store.set('family', S.family); toast(S.family ? 'Family mode on: AI uses plain words' : 'Family mode off'); };
const familyStart = () => {
  S.family = true; el.family.checked = true; store.set('family', true);
  if (S.source !== 'camera') {
    S.pendingFamily = true; el.start.hidden = false; el.diag.hidden = true;
    el['start-note'].textContent = 'Start the camera first, then your I-L-Y round will begin.';
    return;
  }
  setWord('ILY', true); toast('I-L-Y: three letters that combine into the sign for “I love you”.');
};
el['go-family'].onclick = familyStart; el['go-family2'].onclick = familyStart;
// Spoken coaching (browser speech synthesis; nothing leaves the device).
const canSpeak = 'speechSynthesis' in window;
if (!canSpeak) el['c-speak'].hidden = true;
let lastSay = 0;
function say(text, force) {
  if (!canSpeak || S.muted || !S.speak || !text) return; const now = performance.now();
  if (!force && now - lastSay < 2500) return; lastSay = now;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/[->=]/g, ' ')); u.rate = 0.98; speechSynthesis.speak(u); } catch { /* optional */ }
}
const syncSpeak = () => { el['c-speak'].setAttribute('aria-pressed', String(S.speak)); el['c-speak'].dataset.on = String(S.speak); };
el['c-speak'].onclick = () => { S.speak = !S.speak; store.set('speak', S.speak); syncSpeak(); if (S.speak) say('Coach voice is on.', true); else try { speechSynthesis.cancel(); } catch { /* */ } };
syncSpeak();
// Daily goal chip.
function renderGoal() { const d = daily.state(); el['b-goal'].textContent = `Today ${Math.min(d.count, d.goal)}/${d.goal}${d.streak ? ` · ${d.streak}-day streak` : ''}`; el['b-goal'].classList.toggle('hit', d.hit); }
el['b-goal'].onclick = () => { const d = daily.state(); toast(d.hit ? `Goal reached today. ${d.streak}-day streak, come back tomorrow.` : `${d.goal - d.count} more clean letters to reach today's goal.`); };
renderGoal();
// Letter picker: all 26, marking which ones the engine covers.
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((l) => { const o = document.createElement('option'); o.value = l; o.textContent = l + (LETTER_SET.includes(l) ? '' : ('JZ'.includes(l) ? '  (moves, AI only)' : '  (AI only)')); el['ai-letter'].appendChild(o); });

// ---------- events ----------
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.mode === 'practice') setSeqPractice();
  else if (b.dataset.mode === 'warmup') setWeakWarmup();
  else setWord(WORDS[S.wordIdx]);
}));
el['go-cam'].onclick = useCamera; el['b-cam'].onclick = useCamera;
el['b-flip'].onclick = () => { S.flip = !S.flip; S.frameState.basis = null; S.smooth.reset(); toast('Handedness flipped'); };
const syncSound = () => { el['b-snd'].dataset.off = String(S.muted); el['b-snd'].title = S.muted ? 'Sound off (M)' : 'Sound on (M)'; el['b-snd'].setAttribute('aria-pressed', String(S.muted)); };
if (EMBEDDED_DEMO) el['b-snd'].hidden = true;
syncSound();
el['b-snd'].onclick = () => { if (EMBEDDED_DEMO) return; S.muted = !S.muted; syncSound(); };
el['b-dbg'].onclick = () => { S.dbgOn = !S.dbgOn; el.dbgcard.hidden = !S.dbgOn; el['b-dbg'].classList.toggle('on', S.dbgOn); };
el['b-help'].onclick = () => (el.help.hidden = false); el['help-close'].onclick = () => (el.help.hidden = true);
el.tol.oninput = () => { S.tol = +el.tol.value; el.tolv.textContent = 'x' + S.tol.toFixed(2); };
el.custom.addEventListener('keydown', (e) => { if (e.key === 'Enter') { startCustomWord(); el.custom.blur(); } e.stopPropagation(); });
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { do { S.idx = (S.idx + 1) % S.seq.length; } while (S.seq[S.idx].skip); applyTarget(); }
  else if (e.key === 'ArrowLeft') { do { S.idx = (S.idx - 1 + S.seq.length) % S.seq.length; } while (S.seq[S.idx].skip); applyTarget(); }
  else if (e.key === '1') setSeqPractice(); else if (e.key === '2') setWord(WORDS[S.wordIdx]);
  else if (e.key.toLowerCase() === 'h') el['b-flip'].click();
  else if (e.key.toLowerCase() === 'm') el['b-snd'].click(); else if (e.key.toLowerCase() === 'g') el['b-dbg'].click();
  else if (e.key === '?') el.help.hidden = false; else if (e.key === 'Escape') { el.help.hidden = true; }
});
el.view3d.addEventListener('pointerdown', (e) => { S.v3.drag = true; S.v3.manual = true; S.v3.lx = e.clientX; S.v3.ly = e.clientY; el.view3d.setPointerCapture(e.pointerId); });
el.view3d.addEventListener('pointermove', (e) => { if (!S.v3.drag) return; S.v3.yaw += (e.clientX - S.v3.lx) * 0.01; S.v3.pitch = Math.max(-1.2, Math.min(1.2, S.v3.pitch + (e.clientY - S.v3.ly) * 0.01)); S.v3.lx = e.clientX; S.v3.ly = e.clientY; });
el.view3d.addEventListener('pointerup', () => (S.v3.drag = false));
el.view3d.addEventListener('dblclick', () => (S.v3.manual = false));
el.view3d.addEventListener('keydown', (e) => {
  const step = e.shiftKey ? 0.14 : 0.07;
  if (e.key === 'ArrowLeft') S.v3.yaw -= step;
  else if (e.key === 'ArrowRight') S.v3.yaw += step;
  else if (e.key === 'ArrowUp') S.v3.pitch = Math.max(-1.2, S.v3.pitch - step);
  else if (e.key === 'ArrowDown') S.v3.pitch = Math.min(1.2, S.v3.pitch + step);
  else if (e.key === 'Escape') S.v3.manual = false;
  else return;
  S.v3.manual = true; e.preventDefault(); e.stopPropagation();
});

// ---------- Mastery Map & Report Card ----------
function showMastery() {
  const grid = el['mastery-grid'];
  grid.innerHTML = '';
  LETTER_SET.forEach(l => {
    const hits = mastery.get(l);
    const cell = document.createElement('div');
    cell.className = 'mastery-cell ' + (hits > 0 ? 'done' : '');
    cell.innerHTML = `<div class="m-glyph">${l}</div><div class="m-score">${hits > 0 ? hits + ' clean' : 'Locked'}</div>`;
    grid.appendChild(cell);
  });
  el['mastery-modal'].hidden = false;
}
if (el['b-mastery']) el['b-mastery'].onclick = showMastery;
if (el['mastery-close']) el['mastery-close'].onclick = () => el['mastery-modal'].hidden = true;
function showReport(word, durationSecs) {
  el['report-title'].textContent = `Word Completed: ${word}`;
  const count = word.length;
  const speed = (count / (durationSecs / 60)).toFixed(1);
  el['report-body'].innerHTML = `\n    <div><b>Letters Signed:</b> ${word}</div>\n    <div><b>Time Taken:</b> ${durationSecs}s (${speed} letters/min)</div>\n    <div><b>Current Streak:</b> ${S.streak}</div>\n    <div><b>Coach Rating:</b> <span style="color:var(--lime)">EXCELLENT</span></div>\n  `;
  el['report-modal'].hidden = false;
}
if (el['report-close']) el['report-close'].onclick = () => el['report-modal'].hidden = true;
if (el['report-share']) el['report-share'].onclick = () => {
  const text = `I just mastered "${S.seq.map(s => s.ch).join('')}" on SignSense in ${S.streak} streak! Practice ASL in your browser with real-time AI feedback.`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    alert('Share text copied to clipboard!');
  } else alert(text);
};

// ---------- boot ----------
setSeqPractice();
if (qs.get('mode') === 'spell') setWord(qs.get('word') || WORDS[0], !!qs.get('word'));
else if (qs.get('mode') === 'warmup') setWeakWarmup();
if (qs.get('inspector')) el['b-dbg'].click();
requestAnimationFrame(frame);

function finishIntro() {
  const i = el.intro; if (i.hidden) return;
  try { sessionStorage.setItem('ss:intro', '1'); } catch {}
  i.classList.add('out'); el.start.hidden = !!qs.get('demo');
  setTimeout(() => {
    i.hidden = true; i.classList.remove('out');
    if (!el.start.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches) el['welcome-video'].play().catch(() => {});
  }, 520);
}
if (qs.get('demo')) { useDemo(); }
else {
  let seen = false; try { seen = !!sessionStorage.getItem('ss:intro'); } catch {}
  const env = environmentReport();
  if (qs.get('nointro') || (seen && !qs.get('welcome')) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.start.hidden = false;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) el['welcome-video'].play().catch(() => {});
  }
  else {
    el.intro.hidden = false;
    let settled = false;
    const complete = () => { if (settled) return; settled = true; finishIntro(); };
    el['intro-skip'].onclick = complete;
    setTimeout(complete, 6000);
  }
  if (!env.ok) { el['start-note'].textContent = env.hint; }
}
window.__S = S;
spotlight();
document.querySelectorAll('.overlay').forEach((o) => { const h = document.createElement('div'); h.className = 'aurora'; o.prepend(h); if (o.id === 'start') aurora(h, { stops: ['#2fb7c4', '#5a4bff', '#2fb7c4'], amplitude: 0.9 }); });

// Keep focus inside the active practice dialog and return it to the trigger when the dialog closes.
let dialogReturnFocus = null;
const focusableIn = (root) => root.querySelector('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),summary,[tabindex]:not([tabindex="-1"])');
const dialogObserver = new MutationObserver((records) => records.forEach(({ target }) => {
  if (!target.hidden) {
    dialogReturnFocus = document.activeElement;
    focusableIn(target)?.focus({ preventScroll: true });
  } else if (dialogReturnFocus?.isConnected && !dialogReturnFocus.closest('[hidden]')) {
    dialogReturnFocus.focus({ preventScroll: true }); dialogReturnFocus = null;
  }
}));
document.querySelectorAll('.overlay').forEach((dialog) => {
  dialogObserver.observe(dialog, { attributes: true, attributeFilter: ['hidden'] });
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const items = [...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')]
      .filter((item) => !item.hidden && item.getClientRects().length);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
});
requestAnimationFrame(() => {
  const currentDialog = [...document.querySelectorAll('.overlay')].find((dialog) => !dialog.hidden);
  if (currentDialog) focusableIn(currentDialog)?.focus({ preventScroll: true });
});
