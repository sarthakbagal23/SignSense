// Vanilla ports of a few React Bits effects (reactbits.dev, MIT + Commons Clause): Aurora (WebGL2 shader), Spotlight Card, Shiny Text, Magnet.
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

const VERT = `#version 300 es
in vec2 position; void main(){ gl_Position = vec4(position,0.0,1.0); }`;
const FRAG = `#version 300 es
precision highp float;
uniform float uTime, uAmplitude, uBlend; uniform vec3 uColorStops[3]; uniform vec2 uResolution; out vec4 fragColor;
vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x,289.0); }
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod(i,289.0);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0); m=m*m; m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.0*dot(m,g);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uResolution;
  float f=uv.x; vec3 ramp = f<0.5 ? mix(uColorStops[0],uColorStops[1],f/0.5) : mix(uColorStops[1],uColorStops[2],(f-0.5)/0.5);
  float height=snoise(vec2(uv.x*2.0+uTime*0.1,uTime*0.25))*0.5*uAmplitude; height=exp(height);
  height=(uv.y*2.0-height+0.2); float intensity=0.6*height;
  float a=smoothstep(0.2-uBlend*0.5,0.2+uBlend*0.5,intensity);
  fragColor=vec4(intensity*ramp*a,a);
}`;

export function aurora(host, { stops = ['#5fd4e0', '#6a5cff', '#5fd4e0'], amplitude = 1, blend = 0.6, speed = 0.5 } = {}) {
  const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true });
  if (!gl) return () => {};
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return () => {};
  gl.useProgram(pr); host.prepend(canvas);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'position'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const U = (n) => gl.getUniformLocation(pr, n);
  gl.uniform3fv(U('uColorStops'), new Float32Array(stops.flatMap(hex))); gl.uniform1f(U('uAmplitude'), amplitude); gl.uniform1f(U('uBlend'), blend);
  const resize = () => { const d = Math.min(devicePixelRatio || 1, 1.5), w = host.clientWidth, h = host.clientHeight; canvas.width = w * d; canvas.height = h * d; gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(U('uResolution'), canvas.width, canvas.height); };
  new ResizeObserver(resize).observe(host); resize();
  let raf = 0, visible = true, t0 = performance.now();
  const draw = (t) => { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform1f(U('uTime'), (t - t0) * 0.001 * speed + 3); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  const loop = (t) => { if (!visible || document.hidden) { raf = 0; return; } draw(t); raf = requestAnimationFrame(loop); };
  if (calm()) { draw(t0); return () => {}; }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(host);
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

// Spotlight Card: any element with .spot follows the pointer with a soft radial highlight (CSS reads --mx/--my).
export function spotlight(root = document) {
  root.addEventListener('pointermove', (e) => {
    const c = e.target.closest?.('.spot'); if (!c) return; const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`); c.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
}

// Magnet: element leans toward the cursor.
export function magnet(selector, strength = 0.25) {
  if (calm()) return;
  document.querySelectorAll(selector).forEach((n) => {
    n.addEventListener('pointermove', (e) => { const r = n.getBoundingClientRect(); n.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * strength}px,${(e.clientY - r.top - r.height / 2) * strength}px)`; });
    n.addEventListener('pointerleave', () => { n.style.transform = ''; });
  });
}
