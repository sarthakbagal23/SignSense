// Copies the MediaPipe WASM runtime into public/ and (unless --wasm-only) downloads the
// hand_landmarker.task model, so the app runs fully offline (design doc §2, gotcha #2).
import { cpSync, mkdirSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'mediapipe');
mkdirSync(out, { recursive: true });

const wasmSrc = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
if (existsSync(wasmSrc)) {
  cpSync(wasmSrc, join(out, 'wasm'), { recursive: true });
  console.log('[assets] copied MediaPipe wasm -> public/mediapipe/wasm');
} else {
  console.log('[assets] wasm source not found yet (run npm install first)');
}

if (!process.argv.includes('--wasm-only')) {
  const modelPath = join(out, 'hand_landmarker.task');
  if (existsSync(modelPath) && statSync(modelPath).size > 1e6) {
    console.log('[assets] model already present');
  } else {
    const url = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      writeFileSync(modelPath, Buffer.from(await r.arrayBuffer()));
      console.log('[assets] downloaded model -> public/mediapipe/hand_landmarker.task');
    } catch (e) {
      console.log('[assets] could not download model (' + e.message + ').');
      console.log('         Download it manually from:\n         ' + url + '\n         and save it as public/mediapipe/hand_landmarker.task');
    }
  }
}
