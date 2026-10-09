# SignSense

Stack: Next.js App Router + React + Tailwind v4 + shadcn-style components (`src/components`) + MediaPipe. The real-time tracking core is plain JS (`src/app/core.js`) mounted by the React client shell in `src/app/App.jsx`.

Real-time ASL fingerspelling coach (A B C D F I K L O S U V W X Y). Landing story at `/`, practice app at `/practice`.

## Run locally
```
npm install          # installs Next.js and copies the MediaPipe runtime into public/
npm run assets       # downloads the hand model (needs access to storage.googleapis.com)
npm run dev          # open http://localhost:3000  (camera needs localhost or HTTPS)
npm run selftest     # geometry/engine regression
```
If your network blocks the model download: get `hand_landmarker.task` from
https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
and either save it to `public/mediapipe/` or pick it with the "Select hand_landmarker.task" button the app shows when the model can't load.

## AI features (optional)
With `GROQ_API_KEY` set the app offers: Why not X? (explains a rejected attempt from the engine's numbers and a photo), Reword (friendlier version of the built-in correction), Check any letter A-Z (engine data is attached only for the 15 letters it covers; others are AI-only and labeled), Word note, Recap + plan, and Family mode (plain words for hearing relatives). Spoken coaching uses the browser's speech synthesis (no network). Daily goal (10 clean letters) and day streak are stored in this browser.

## Optional AI setup (Ask Senso)
Server-side only. Copy `.env.example` to `.env.local` and set `GROQ_API_KEY` (model defaults to `qwen/qwen3.8-27b`, override with `GROQ_MODEL`). The key never reaches the browser. Without a key the button shows a polite message and everything else works. The Next.js route handler serves `/api/senso`.

## Deploy (Vercel, ~3 minutes)
1. Push this folder to a GitHub repo (`.env.local` and `node_modules` are git-ignored).
2. vercel.com -> Add New Project -> import the repo. Vercel detects Next.js and uses `npm run build`.
3. Settings -> Environment Variables: add `GROQ_API_KEY`. Deploy.
4. Open the https URL, allow the camera. The build downloads the model; if the build log says it could not, add the file to `public/mediapipe/` and redeploy.

## Notes
- `_archive/` holds old experiments; safe to delete.
- Mascot PNGs have leftover checkerboard in tentacle gaps. Re-export Senso with real transparency into `public/mascot/`.
- Privacy: hand tracking is on-device. Pressing "Ask Senso" sends one cropped 384px photo to your server function, which forwards it to Groq.

## Letters
15 static letters are checked by the geometry engine. Not yet: E, G, H, M, N, P, Q, R, T (need hand orientation or finer thumb features) and J, Z (they move). Add a letter by adding a pose in `src/pose.js` (SPEC) and constraints in `src/letters.js`, then run `npm run selftest`.
