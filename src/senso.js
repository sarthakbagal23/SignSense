// Senso Mascot state manager
const POSES = {
  idle: '/mascot/sleeping-small.png',
  ok: '/mascot/excited-small.png',
  fix: '/mascot/pointing-small.png',
  amb: '/mascot/thinking-small.png',
  wave: '/mascot/wave-small.png',
  thumbs: '/mascot/thumbsup-small.png'
};

export function setSensoPose(imgNode, kind, fbKey) {
  if (!imgNode) return;
  let target = POSES[kind] || POSES.idle;

  if (kind === 'ok') target = POSES.ok;
  else if (kind === 'fix') target = POSES.fix;
  else if (kind === 'amb') target = POSES.amb;
  else if (kind === 'idle') target = POSES.idle;

  if (imgNode.getAttribute('src') !== target) {
    imgNode.style.transform = 'scale(0.8)';
    setTimeout(() => {
      imgNode.src = target;
      imgNode.style.transform = 'scale(1)';
    }, 150);
  }
}