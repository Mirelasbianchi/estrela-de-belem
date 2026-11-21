// Teclado, mouse e toque (joystick virtual + botões).
export const input = {
  move: { x: 0, y: 0 }, joy: { x: 0, y: 0 }, keys: new Set(),
  jumpPressed: false, jumpHeld: false, actPressed: false, escPressed: false,
  camDX: 0, camDY: 0, lastCamTouch: 0,
  touch: matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window,
};

export function initInput(canvas) {
  if (input.touch) document.body.classList.add('touch');
  addEventListener('keydown', e => {
    const k = e.code; input.keys.add(k);
    if (k === 'Space' || k === 'Enter') { if (!e.repeat) input.jumpPressed = true; input.jumpHeld = true; e.preventDefault(); }
    if (k === 'KeyE' && !e.repeat) input.actPressed = true;
    if (k === 'Escape' || k === 'KeyP') input.escPressed = true;
    if (k.startsWith('Arrow')) e.preventDefault();
  });
  addEventListener('keyup', e => { input.keys.delete(e.code); if (e.code === 'Space' || e.code === 'Enter') input.jumpHeld = false; });
  addEventListener('blur', () => { input.keys.clear(); input.jumpHeld = false; });

  const joy = document.getElementById('joy'), knob = document.getElementById('knob');
  let camId = null, joyId = null, last = null, origin = null;
  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') {
      input.touch = true; document.body.classList.add('touch');
      if (e.clientX < innerWidth * 0.45 && joyId === null) {
        joyId = e.pointerId; origin = { x: e.clientX, y: e.clientY };
        joy.style.left = origin.x + 'px'; joy.style.top = origin.y + 'px'; joy.classList.add('on');
        knob.style.transform = 'translate(0,0)';
      } else if (camId === null) { camId = e.pointerId; last = { x: e.clientX, y: e.clientY }; }
    } else { camId = e.pointerId; last = { x: e.clientX, y: e.clientY }; }
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId === joyId) {
      let dx = e.clientX - origin.x, dy = e.clientY - origin.y; const max = 55, l = Math.hypot(dx, dy);
      if (l > max) { dx *= max / l; dy *= max / l; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      input.joy.x = dx / max; input.joy.y = -dy / max;
    } else if (e.pointerId === camId) {
      input.camDX += e.clientX - last.x; input.camDY += e.clientY - last.y; last = { x: e.clientX, y: e.clientY };
      if (e.pointerType === 'touch') input.lastCamTouch = performance.now();
    }
  });
  const end = e => {
    if (e.pointerId === joyId) { joyId = null; input.joy.x = input.joy.y = 0; joy.classList.remove('on'); }
    if (e.pointerId === camId) camId = null;
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  const bj = document.getElementById('btnJump'), ba = document.getElementById('btnAct');
  bj.addEventListener('pointerdown', e => { e.preventDefault(); input.jumpPressed = true; input.jumpHeld = true; });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) bj.addEventListener(ev, () => { input.jumpHeld = false; });
  ba.addEventListener('pointerdown', e => { e.preventDefault(); input.actPressed = true; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
}

export function pollInput() {
  const k = input.keys; let x = 0, y = 0;
  if (k.has('KeyW') || k.has('ArrowUp')) y += 1;
  if (k.has('KeyS') || k.has('ArrowDown')) y -= 1;
  if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
  if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
  x += input.joy.x; y += input.joy.y;
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  input.move.x = x; input.move.y = y;
}
export function consume() {
  input.jumpPressed = false; input.actPressed = false; input.escPressed = false; input.camDX = 0; input.camDY = 0;
}
