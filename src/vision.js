// Camera + MediaPipe HandLandmarker (Tasks API).
// Every failure carries { step, hint } so the UI can say exactly what broke instead of silently
// falling back to demo mode. Model order: file you picked -> /mediapipe (bundled) -> CDN.
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const BASE = import.meta.env.BASE_URL || '/';
const LOCAL_WASM = `${BASE}mediapipe/wasm`;
const LOCAL_MODEL = `${BASE}mediapipe/hand_landmarker.task`;
const CDN_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';
export const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const fail = (step, message, hint, cause) => Object.assign(new Error(message), { step, hint, cause });

async function reachable(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return r.ok && !(r.headers.get('content-type') || '').includes('text/html');
  } catch { return false; }
}

export function environmentReport() {
  const secure = window.isSecureContext;
  const hasCam = !!navigator.mediaDevices?.getUserMedia;
  return { secure, hasCam, ok: secure && hasCam,
    hint: !secure ? 'Camera needs HTTPS or localhost. Open http://localhost:5173 (not a LAN IP or file://).' : !hasCam ? 'This browser has no camera API. Use a current Chrome, Edge or Safari.' : '' };
}

export async function startCamera(video) {
  const env = environmentReport();
  if (!env.ok) throw fail('camera', 'Camera API unavailable', env.hint);
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false });
  } catch (e) {
    const hints = {
      NotAllowedError: 'Camera permission was blocked. Click the camera icon in the address bar, choose Allow, then try again.',
      NotFoundError: 'No camera was found. Plug one in or check that it is enabled.',
      NotReadableError: 'Another app is using the camera (Zoom, Teams, another tab). Close it and try again.',
      OverconstrainedError: 'The camera cannot provide the requested size.',
    };
    throw fail('camera', `${e.name}: ${e.message}`, hints[e.name] || 'The browser could not open the camera.', e);
  }
  video.srcObject = stream;
  try { await video.play(); } catch (e) { throw fail('camera', 'Video would not start', 'Click the page once, then try again.', e); }
  return stream;
}

async function loadModelBytes(onStep, picked) {
  if (picked) { onStep('model', 'Using the model file you picked'); return { bytes: new Uint8Array(picked), source: 'file' }; }
  if (await reachable(LOCAL_MODEL)) {
    onStep('model', 'Loading bundled model');
    const r = await fetch(LOCAL_MODEL);
    return { bytes: new Uint8Array(await r.arrayBuffer()), source: 'bundled' };
  }
  onStep('model', 'Downloading hand model (about 8 MB)');
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 30000);
    const r = await fetch(MODEL_URL, { signal: ctl.signal }); clearTimeout(t);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return { bytes: new Uint8Array(await r.arrayBuffer()), source: 'cdn' };
  } catch (e) {
    throw fail('model', `Model download failed (${e.message})`,
      'This network blocks Google storage. Download hand_landmarker.task on another network (button below), then pick the file here, or put it in public/mediapipe/ and rebuild.', e);
  }
}

export async function createLandmarker({ onStep = () => {}, pickedModel = null } = {}) {
  onStep('runtime', 'Loading hand-tracking runtime');
  const localRuntime = await reachable(`${LOCAL_WASM}/vision_wasm_internal.wasm`);
  let vision;
  try { vision = await FilesetResolver.forVisionTasks(localRuntime ? LOCAL_WASM : CDN_WASM); }
  catch (e) { throw fail('runtime', `Runtime failed to load (${e.message})`, 'The WebAssembly runtime could not be fetched. Run npm run assets so it ships with the app, or check your connection.', e); }

  const { bytes, source } = await loadModelBytes(onStep, pickedModel);
  const opts = (delegate) => ({ baseOptions: { modelAssetBuffer: bytes, delegate }, runningMode: 'VIDEO', numHands: 1,
    minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
  onStep('init', 'Starting hand tracker');
  let lm, delegate = 'GPU';
  try { lm = await HandLandmarker.createFromOptions(vision, opts('GPU')); }
  catch (gpuErr) {
    delegate = 'CPU';
    try { lm = await HandLandmarker.createFromOptions(vision, opts('CPU')); }
    catch (e) { throw fail('init', `Tracker failed to start (${e.message})`, 'Root cause: see console. The model may be corrupt - re-download hand_landmarker.task and pick it again.', e); }
  }
  return { lm, offline: localRuntime && source !== 'cdn', delegate, source };
}

let lastTs = 0;
// Returns {landmarks, world, label, conf} or null. Timestamps are strictly increasing.
export function detect(lm, video) {
  const ts = Math.max(performance.now(), lastTs + 1); lastTs = ts;
  const res = lm.detectForVideo(video, ts);
  if (!res.landmarks || !res.landmarks.length) return null;
  const h = (res.handedness || res.handednesses || [[]])[0]?.[0];
  return { landmarks: res.landmarks[0], world: res.worldLandmarks[0], label: h?.categoryName || 'Right', conf: h?.score ?? 0.9 };
}
