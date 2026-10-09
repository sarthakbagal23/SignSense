// All canvas drawing: skeleton HUD, ghost hand, convergence lines, radar, 3D palm-frame view, confetti.
import { buildHand } from './pose.js';

export const CONN = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
const FING_CHAINS = [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]];
const STOPS = [[0,[255,79,216]],[0.45,[255,200,87]],[0.8,[182,255,92]],[1,[110,255,170]]];

export function scoreRGB(s) {
  s = Math.max(0, Math.min(1, s));
  for (let i = 1; i < STOPS.length; i++) if (s <= STOPS[i][0]) {
    const [a, A] = STOPS[i - 1], [b, B] = STOPS[i], t = (s - a) / (b - a);
    return A.map((v, k) => Math.round(v + (B[k] - v) * t));
  }
  return STOPS[STOPS.length - 1][1];
}
export const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export function fitCanvas(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(2, Math.round(cv.clientWidth * dpr)), h = Math.max(2, Math.round(cv.clientHeight * dpr));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: cv.clientWidth, h: cv.clientHeight };
}

export function makeMapper(W, H, vw, vh) {
  const sc = Math.max(W / vw, H / vh), dx = (W - vw * sc) / 2, dy = (H - vh * sc) / 2;
  return (p) => [W - (p.x * vw * sc + dx), p.y * vh * sc + dy]; // mirrored selfie view
}

export function drawBackdrop(ctx, W, H, t) {
  const g = ctx.createRadialGradient(W / 2, H * 0.55, 10, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, '#0d1230'); g.addColorStop(1, '#04060d'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(94,242,255,.07)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.font = '700 11px ui-monospace,Menlo,monospace';
  ctx.fillText('DEMO MODE · SYNTHETIC HAND · same pipeline as the camera', 16, H - 16);
}

export function scanline(ctx, W, H, t) {
  const y = ((t * 110) % (H + 80)) - 40;
  const g = ctx.createLinearGradient(0, y - 40, 0, y + 40);
  g.addColorStop(0, 'rgba(94,242,255,0)'); g.addColorStop(0.5, 'rgba(94,242,255,.07)'); g.addColorStop(1, 'rgba(94,242,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, y - 40, W, 80);
}

function pill(ctx, x, y, text, color, size = 12) {
  ctx.font = `700 ${size}px ui-monospace,Menlo,monospace`;
  const w = ctx.measureText(text).width + 16, h = size + 12;
  ctx.fillStyle = 'rgba(5,7,16,.78)'; ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.fillText(text, x + 8, y + h / 2 + 1); ctx.textBaseline = 'alphabetic';
  return w;
}

export function drawHand(ctx, px, o) {
  const { score, t, focus = [], trails, badge } = o;
  const col = scoreRGB(score), c = rgba(col), cs = rgba(col, 0.9);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // palm fill
  ctx.beginPath(); [0,1,5,9,13,17].forEach((i, k) => (k ? ctx.lineTo(...px[i]) : ctx.moveTo(...px[i]))); ctx.closePath();
  ctx.fillStyle = rgba(col, 0.09); ctx.fill();
  // fingertip trails (additive)
  ctx.globalCompositeOperation = 'lighter';
  for (const id of Object.keys(trails)) {
    const tr = trails[id]; if (tr.length < 2) continue;
    for (let i = 1; i < tr.length; i++) { ctx.strokeStyle = rgba(col, (i / tr.length) * 0.55); ctx.lineWidth = 1 + (i / tr.length) * 5; ctx.beginPath(); ctx.moveTo(...tr[i - 1]); ctx.lineTo(...tr[i]); ctx.stroke(); }
  }
  ctx.globalCompositeOperation = 'source-over';
  // glow bones
  ctx.shadowColor = c; ctx.shadowBlur = 16; ctx.strokeStyle = cs; ctx.lineWidth = 3.2;
  for (const [a, b] of CONN) { ctx.beginPath(); ctx.moveTo(...px[a]); ctx.lineTo(...px[b]); ctx.stroke(); }
  ctx.shadowBlur = 10;
  px.forEach((p, i) => { const tip = i % 4 === 0 && i > 0; ctx.fillStyle = tip ? '#fff' : c; ctx.beginPath(); ctx.arc(p[0], p[1], tip ? 5.2 : 3.4, 0, 7); ctx.fill(); });
  ctx.shadowBlur = 0;
  // corner brackets
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; px.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  const pad = 26 + 3 * Math.sin(t * 5), L = 24; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  ctx.strokeStyle = c; ctx.lineWidth = 2.2;
  [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, sx, sy]) => { ctx.beginPath(); ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke(); });
  if (badge) pill(ctx, x0, y0 - 30, badge, c, 13);
  // focus rings + leader labels for the failing constraint
  focus.forEach((f, k) => {
    const p = px[f.id], r = 15 + 4 * Math.sin(t * 8);
    ctx.strokeStyle = '#ffc857'; ctx.lineWidth = 2.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    if (k === 0 && f.label) {
      const lx = Math.min(ctx.canvas.clientWidth - 190, p[0] + 46), ly = Math.max(24, p[1] - 52);
      ctx.strokeStyle = 'rgba(255,200,87,.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(p[0] + r * 0.7, p[1] - r * 0.7); ctx.lineTo(lx, ly + 12); ctx.stroke();
      pill(ctx, lx, ly, '⚠ ' + f.label, '#ffc857', 12);
    }
  });
  ctx.restore();
}

// Canonical ghost hand projected onto the user's hand (position, scale and roll follow the user).
export function drawGhostOverlay(ctx, canon, px, alpha, t) {
  const w = px[0], m = px[9]; let ux = m[0] - w[0], uy = m[1] - w[1]; const s = Math.hypot(ux, uy) || 1; ux /= s; uy /= s;
  let rx = -uy, ry = ux; if ((px[17][0] - px[5][0]) * rx + (px[17][1] - px[5][1]) * ry < 0) { rx = -rx; ry = -ry; }
  const G = canon.map((p) => [w[0] + ux * p[1] * s + rx * p[0] * s, w[1] + uy * p[1] * s + ry * p[0] * s]);
  ctx.save(); ctx.setLineDash([7, 6]); ctx.lineDashOffset = -t * 18; ctx.strokeStyle = `rgba(94,242,255,${alpha})`; ctx.lineWidth = 2.2; ctx.shadowColor = '#5ef2ff'; ctx.shadowBlur = 12;
  for (const [a, b] of CONN) { ctx.beginPath(); ctx.moveTo(...G[a]); ctx.lineTo(...G[b]); ctx.stroke(); }
  ctx.setLineDash([]);
  [4, 8, 12, 16, 20].forEach((i) => {
    const d = Math.hypot(G[i][0] - px[i][0], G[i][1] - px[i][1]) / s, a = Math.min(1, d * 2.2);
    ctx.fillStyle = 'rgba(94,242,255,.95)'; ctx.beginPath(); ctx.arc(G[i][0], G[i][1], 4.5, 0, 7); ctx.fill();
    if (a > 0.12) { ctx.strokeStyle = `rgba(255,200,87,${a * 0.85})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(...px[i]); ctx.lineTo(...G[i]); ctx.stroke(); }
  });
  ctx.restore();
}

// Target-card ghost: gently swaying 3D-ish turntable of the canonical pose.
export function drawGhostCard(ctx, W, H, canon, t) {
  ctx.clearRect(0, 0, W, H);
  const a = Math.sin(t * 0.9) * 0.55, ca = Math.cos(a), sa = Math.sin(a), sc = H * 0.4, cx = W / 2, cy = H * 0.9;
  const P = canon.map((p) => { const x = p[0] * ca + p[2] * sa, z = -p[0] * sa + p[2] * ca; return [cx + x * sc * 1.15, cy - p[1] * sc * 1.05 + z * 8, z]; });
  ctx.lineCap = 'round'; ctx.shadowColor = '#5ef2ff'; ctx.shadowBlur = 12;
  FING_CHAINS.concat([[0, 5], [5, 9], [9, 13], [13, 17], [0, 17], [0, 1]]).forEach((ch) => {
    ctx.strokeStyle = 'rgba(94,242,255,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ch.forEach((i, k) => (k ? ctx.lineTo(P[i][0], P[i][1]) : ctx.moveTo(P[i][0], P[i][1]))); ctx.stroke();
  });
  ctx.shadowBlur = 8; P.forEach((p, i) => { ctx.fillStyle = i % 4 === 0 && i ? '#fff' : '#9b7bff'; ctx.beginPath(); ctx.arc(p[0], p[1], i % 4 === 0 && i ? 4.5 : 3, 0, 7); ctx.fill(); });
  ctx.shadowBlur = 0;
}

export function drawRadar(ctx, W, H, letters, scores, o) {
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2 + 2, R = Math.min(W, H) / 2 - 22, n = letters.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  ctx.strokeStyle = 'rgba(255,255,255,.09)'; ctx.lineWidth = 1;
  [0.25, 0.5, 0.75, 1].forEach((r) => { ctx.beginPath(); letters.forEach((_, i) => { const x = cx + Math.cos(ang(i)) * R * r, y = cy + Math.sin(ang(i)) * R * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.stroke(); });
  letters.forEach((_, i) => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang(i)) * R, cy + Math.sin(ang(i)) * R); ctx.stroke(); });
  // accept threshold ring
  ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(182,255,92,.4)'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.75, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  const has = scores && Object.keys(scores).length && o.live;
  if (has) {
    const col = scoreRGB(o.topScore ?? 0);
    ctx.beginPath(); letters.forEach((l, i) => { const v = Math.max(0.03, scores[l] ?? 0); const x = cx + Math.cos(ang(i)) * R * v, y = cy + Math.sin(ang(i)) * R * v; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
    ctx.fillStyle = rgba(col, 0.2); ctx.fill(); ctx.shadowColor = rgba(col); ctx.shadowBlur = 14; ctx.strokeStyle = rgba(col, 0.95); ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0;
    letters.forEach((l, i) => { const v = Math.max(0.03, scores[l] ?? 0); ctx.fillStyle = l === o.top ? '#fff' : rgba(col, 0.9); ctx.beginPath(); ctx.arc(cx + Math.cos(ang(i)) * R * v, cy + Math.sin(ang(i)) * R * v, l === o.top ? 4.5 : 2.5, 0, 7); ctx.fill(); });
  }
  ctx.font = '800 13px ui-monospace,Menlo,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  letters.forEach((l, i) => {
    const x = cx + Math.cos(ang(i)) * (R + 13), y = cy + Math.sin(ang(i)) * (R + 13);
    ctx.fillStyle = l === o.target ? '#5ef2ff' : l === o.top && has ? '#fff' : '#7f88ad';
    if (l === o.target) { ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fillStyle = 'rgba(94,242,255,.18)'; ctx.fill(); ctx.fillStyle = '#5ef2ff'; }
    ctx.fillText(l, x, y + 1);
  });
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

export function draw3D(ctx, W, H, pts, v) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(155,123,255,.9)'; ctx.font = '700 9.5px ui-monospace,Menlo,monospace'; ctx.fillText('PALM FRAME · PCA PLANE', 10, 15);
  if (!pts) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillText('no hand', 10, H - 10); return; }
  const cy = Math.cos(v.yaw), sy = Math.sin(v.yaw), cp = Math.cos(v.pitch), sp = Math.sin(v.pitch), sc = H * 0.34, ox = W / 2, oy = H * 0.57;
  const proj = (p) => { let x = p[0], y = p[1] - 0.5, z = p[2]; const x1 = x * cy + z * sy, z1 = -x * sy + z * cy; const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp; const f = 1 / (1 - z2 * 0.18); return [ox + x1 * sc * f, oy - y2 * sc * f, z2]; };
  const quad = [[-0.55, -0.02, 0], [0.55, -0.02, 0], [0.55, 1.12, 0], [-0.55, 1.12, 0]].map(proj);
  ctx.beginPath(); quad.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath();
  ctx.fillStyle = 'rgba(94,242,255,.10)'; ctx.fill(); ctx.strokeStyle = 'rgba(94,242,255,.55)'; ctx.lineWidth = 1; ctx.stroke();
  const a = proj([0, 0.55, 0]), b = proj([0, 0.55, 0.62]);
  ctx.strokeStyle = '#b6ff5c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  ctx.fillStyle = '#b6ff5c'; ctx.beginPath(); ctx.arc(b[0], b[1], 3.5, 0, 7); ctx.fill(); ctx.fillText('w', b[0] + 6, b[1] - 4);
  const P = pts.map(proj); ctx.lineCap = 'round';
  CONN.forEach(([i, j]) => { const d = (P[i][2] + P[j][2]) / 2; ctx.strokeStyle = `rgba(190,170,255,${0.45 + 0.4 * Math.max(-1, Math.min(1, d + 0.3))})`; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke(); });
  P.forEach((p, i) => { ctx.fillStyle = i % 4 === 0 && i ? '#fff' : '#9b7bff'; ctx.beginPath(); ctx.arc(p[0], p[1], i % 4 === 0 && i ? 3 : 2, 0, 7); ctx.fill(); });
}

export class Confetti {
  constructor() { this.p = []; }
  burst(x, y, n = 90, power = 9) {
    const cols = ['#5ef2ff', '#9b7bff', '#ff4fd8', '#b6ff5c', '#ffc857'];
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = (0.35 + Math.random()) * power; this.p.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - power * 0.5, r: 3 + Math.random() * 4, c: cols[i % 5], life: 1, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4 }); }
  }
  draw(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    this.p = this.p.filter((q) => q.life > 0 && q.y < H + 20);
    for (const q of this.p) { q.x += q.vx; q.y += q.vy; q.vy += 0.28; q.vx *= 0.992; q.life -= 0.011; q.rot += q.vr; ctx.save(); ctx.globalAlpha = Math.max(0, q.life); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillStyle = q.c; ctx.fillRect(-q.r, -q.r / 2, q.r * 2, q.r); ctx.restore(); }
  }
}
