// Modelos dos capítulos 2 a 7: burrinho, boi, manjedoura com o Menino Jesus, estábulo, fogueira e objetos de missão.
import * as THREE from 'three';
import { smat, eye, compact, puffyStarGeometry } from './art.js';
import { glow, plankMat, RB, terrainHeight } from './world.js';

const M = (geo, material, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); return m; };

// ---------- Bichos (quatro patas, cabeça grande e fofa) ----------
function quad({ fur, light, dark = '#3a2a22', size = 1, ears = 'donkey', horns = false, mane = null, eyeC = '#4a2c1a' }) {
  const g = new THREE.Group();
  const furM = smat(fur, { roughness: 0.75 }), lightM = smat(light, { roughness: 0.75 }), darkM = smat(dark, { roughness: 0.4 });
  const body = M(new THREE.SphereGeometry(0.42, 26, 18), furM, 0, 0.78, 0); body.scale.set(0.85, 0.8, 1.35); g.add(body);
  const belly = M(new THREE.SphereGeometry(0.32, 20, 14), lightM, 0, 0.68, 0.05); belly.scale.set(0.8, 0.7, 1.25); g.add(belly);
  const legs = [];
  for (const [x, z] of [[-0.17, 0.3], [0.17, 0.3], [-0.17, -0.32], [0.17, -0.32]]) {
    const leg = new THREE.Group(); leg.position.set(x, 0.62, z);
    leg.add(M(new THREE.CapsuleGeometry(0.075, 0.42, 4, 10), furM, 0, -0.28, 0));
    leg.add(M(new THREE.CylinderGeometry(0.075, 0.085, 0.09, 12), darkM, 0, -0.56, 0));
    g.add(leg); legs.push(leg);
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.92, -0.55); tail.rotation.x = 0.5; g.add(tail);
  tail.add(M(new THREE.CapsuleGeometry(0.025, 0.32, 3, 6), furM, 0, -0.18, 0));
  tail.add(M(new THREE.SphereGeometry(0.06, 10, 8), darkM, 0, -0.38, 0));
  const neck = M(new THREE.CapsuleGeometry(0.15, 0.26, 4, 12), furM, 0, 1.08, 0.38); neck.rotation.x = 0.55; g.add(neck);
  if (mane) { const mn = M(new THREE.CapsuleGeometry(0.05, 0.36, 4, 8), smat(mane, { roughness: 0.8 }), 0, 1.2, 0.3); mn.rotation.x = 0.55; g.add(mn); }
  const head = new THREE.Group(); head.position.set(0, 1.38, 0.55); g.add(head);
  const R = 0.3;
  const skull = M(new THREE.SphereGeometry(R, 28, 20), furM); skull.scale.set(0.95, 0.95, 1); head.add(skull);
  const muz = M(new THREE.SphereGeometry(R * 0.66, 22, 16), lightM, 0, -R * 0.38, R * 0.62); muz.scale.set(1.05, 0.85, 1); head.add(muz);
  for (const sx of [-1, 1]) head.add(M(new THREE.SphereGeometry(R * 0.07, 10, 8), darkM, sx * R * 0.22, -R * 0.32, R * 1.18));
  const smile = M(new THREE.TorusGeometry(R * 0.16, R * 0.03, 6, 14, Math.PI), smat('#5a2f2a'), 0, -R * 0.6, R * 1.08); smile.rotation.z = Math.PI; head.add(smile);
  const eyes = [];
  for (const sx of [-1, 1]) { const e = eye(R, sx, eyeC, R * 0.2, { lashes: true }); head.add(e.g); eyes.push(e.inner); }
  const cheek = new THREE.MeshStandardMaterial({ color: '#ff9a8f', transparent: true, opacity: 0.35, depthWrite: false });
  for (const sx of [-1, 1]) { const c = M(new THREE.SphereGeometry(R * 0.16, 10, 8), cheek, sx * R * 0.6, -R * 0.25, R * 0.72); c.scale.z = 0.4; head.add(c); }
  for (const sx of [-1, 1]) {
    const ear = new THREE.Group();
    if (ears === 'donkey') { ear.position.set(sx * R * 0.45, R * 0.75, -R * 0.1); ear.rotation.set(-0.15, 0, -sx * 0.32); }
    else { ear.position.set(sx * R * 0.95, R * 0.25, -R * 0.1); ear.rotation.z = -sx * 1.35; }
    const len = ears === 'donkey' ? 0.32 : 0.16;
    const e1 = M(new THREE.SphereGeometry(1, 14, 10), furM, 0, len, 0); e1.scale.set(0.075, len, 0.04); ear.add(e1);
    const e2 = M(new THREE.SphereGeometry(1, 12, 8), smat('#e9b3ab'), 0, len, 0.02); e2.scale.set(0.045, len * 0.8, 0.025); ear.add(e2);
    if (ears === 'donkey') { const tip = M(new THREE.SphereGeometry(0.05, 10, 8), darkM, 0, len * 1.85, 0); tip.scale.set(1, 0.9, 0.6); ear.add(tip); }
    head.add(ear);
  }
  if (horns) for (const sx of [-1, 1]) {
    const h = M(new THREE.TorusGeometry(0.11, 0.035, 8, 14, Math.PI * 0.7), smat('#f1e2c0', { roughness: 0.4 }), sx * R * 0.55, R * 0.72, -R * 0.05);
    h.rotation.set(0, 0, sx > 0 ? -0.3 : Math.PI + 0.3); head.add(h);
  }
  if (mane) { const tuft = M(new THREE.SphereGeometry(R * 0.32, 12, 10), smat(mane, { roughness: 0.8 }), 0, R * 0.95, R * 0.25); tuft.scale.set(1, 0.6, 1.2); head.add(tuft); }
  g.scale.setScalar(size);
  g.userData = { head, legs, tail, eyes, blink: 0, next: 2 };
  return g;
}
export const donkeyModel = () => quad({ fur: '#9b9aa6', light: '#e8e4e0', dark: '#3c3a44', ears: 'donkey', mane: '#4a4652', size: 0.95 });
export const oxModel = () => quad({ fur: '#a8683f', light: '#f2dfc4', dark: '#4a2e20', ears: 'ox', horns: true, size: 1.2 });

// Anima bicho: andar, piscar, balançar a cabeça e o rabo
export function animateQuad(g, t, dt, speed = 0) {
  const u = g.userData; const k = Math.min(1, speed / 3);
  u.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 10 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.55 * k; });
  u.head.rotation.x = Math.sin(t * 1.7) * 0.06 + k * Math.sin(t * 10) * 0.05;
  u.head.rotation.z = Math.sin(t * 0.9) * 0.07 * (1 - k);
  u.tail.rotation.z = Math.sin(t * 3.1) * 0.35;
  u.next -= dt;
  if (u.next <= 0) { u.blink = 0.16; u.next = 2 + Math.random() * 3; }
  let bk = 0; if (u.blink > 0) { u.blink -= dt; bk = Math.sin(Math.max(0, u.blink) / 0.16 * Math.PI); }
  for (const e of u.eyes) e.scale.y = 1 - 0.88 * bk;
}

// ---------- Manjedoura e o Menino Jesus ----------
export function babyModel() {
  const g = new THREE.Group();
  const cloth = smat('#fbf7ee', { roughness: 0.85 }), skin = smat('#f3c9a6', { roughness: 0.6, envMapIntensity: 0.3 });
  const wrap = M(new THREE.CapsuleGeometry(0.13, 0.3, 6, 16), cloth, 0, 0.13, -0.05); wrap.rotation.x = Math.PI / 2; g.add(wrap);
  for (const z of [-0.12, 0.0, 0.1]) g.add(M(new THREE.TorusGeometry(0.135, 0.012, 6, 20), smat('#e9dcc0'), 0, 0.13, z - 0.03));
  g.add(M(new THREE.SphereGeometry(0.13, 22, 16), skin, 0, 0.2, 0.22));
  const hood = M(new THREE.SphereGeometry(0.15, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), cloth, 0, 0.2, 0.2); hood.rotation.x = -1.2; g.add(hood);
  // olhinhos fechados (dormindo) e sorriso
  for (const sx of [-1, 1]) { const e = M(new THREE.TorusGeometry(0.025, 0.006, 6, 10, Math.PI), smat('#4a2c22'), sx * 0.045, 0.31, 0.25); e.rotation.x = -1.35; e.rotation.z = Math.PI; g.add(e); }
  const sm = M(new THREE.TorusGeometry(0.022, 0.006, 6, 10, Math.PI), smat('#b5545e'), 0, 0.3, 0.17); sm.rotation.x = -1.35; sm.rotation.z = Math.PI; g.add(sm);
  const ch = new THREE.MeshStandardMaterial({ color: '#ff9a8f', transparent: true, opacity: 0.4, depthWrite: false });
  for (const sx of [-1, 1]) { const c = M(new THREE.SphereGeometry(0.03, 8, 6), ch, sx * 0.075, 0.3, 0.2); c.scale.y = 0.4; g.add(c); }
  const halo = M(new THREE.TorusGeometry(0.14, 0.018, 8, 28), smat('#ffd75e', { emissive: '#ffbf2e', emissiveIntensity: 1.6, metalness: 0.5, roughness: 0.3 }), 0, 0.22, 0.4);
  halo.rotation.x = -0.25; g.add(halo);
  return g;
}
export function mangerModel(withBaby = false) {
  const g = new THREE.Group();
  const wood = plankMat('#9a6538'), dark = smat('#6b4529');
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) { const l = M(RB(0.08, 0.75, 0.08, 0.02), dark, sx * 0.32, 0.33, sz * 0.5); l.rotation.x = sz * 0.25 * sx; g.add(l); }
  for (const sx of [-1, 1]) { const s = M(RB(0.06, 0.32, 1.25, 0.02), wood, sx * 0.34, 0.66, 0); s.rotation.z = sx * 0.35; g.add(s); }
  g.add(M(RB(0.5, 0.06, 1.2, 0.02), wood, 0, 0.53, 0));
  for (const sz of [-1, 1]) g.add(M(RB(0.78, 0.3, 0.06, 0.02), wood, 0, 0.66, sz * 0.62));
  const hay = M(new THREE.SphereGeometry(0.42, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), smat('#e8c25a', { roughness: 0.95 }), 0, 0.6, 0); hay.scale.set(0.95, 0.42, 1.45); g.add(hay);
  for (let i = 0; i < 14; i++) { const s = M(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 4), smat('#f0d27a'), Math.sin(i * 2.3) * 0.35, 0.75, Math.cos(i * 1.7) * 0.55); s.rotation.set(i * 0.7, 0, i * 1.3); g.add(s); }
  compact(g);
  if (withBaby) { const b = babyModel(); b.position.set(0, 0.68, -0.15); g.add(b); g.userData.baby = b; const gl = glow('#fff1c4', 3.2, 0.55); gl.position.set(0, 1.0, 0); g.add(gl); }
  return g;
}

// ---------- Estábulo (pedra e madeira), aberto na frente (+z local) ----------
export function stableModel(world, x, z, rot = 0) {
  const g = new THREE.Group(); const y0 = terrainHeight(x, z); g.position.set(x, y0, z); g.rotation.y = rot;
  const W = 7, D = 5, Hh = 3.2;
  const stone = smat('#8f8a99', { roughness: 0.9 }), dark = smat('#5a3a24'), snowM = smat('#f4f7ff', { roughness: 0.85 });
  for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) {
    const b = M(new THREE.SphereGeometry(0.55, 10, 8), stone, -W / 2 + 0.4 + i * (W - 0.8) / 8 + (j % 2) * 0.2, 0.4 + j * 0.75, -D / 2); b.scale.set(1, 0.75, 0.7); g.add(b);
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { const b = M(new THREE.SphereGeometry(0.48, 10, 8), stone, sx * W / 2, 0.35 + j * 0.65, -D / 2 + 0.4 + i * 0.85); b.scale.set(0.7, 0.75, 1); g.add(b); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(M(new THREE.CylinderGeometry(0.12, 0.14, Hh + 0.4, 10), dark, sx * (W / 2 - 0.1), (Hh + 0.4) / 2, sz * (D / 2 - 0.1)));
  g.add(M(RB(W + 0.4, 0.2, 0.25, 0.05), dark, 0, Hh + 0.3, D / 2 - 0.1));
  for (const s of [-1, 1]) {
    const r = M(RB(W + 1.2, 0.35, D / 2 + 0.9, 0.12), smat('#c9a25a', { roughness: 1 }), 0, Hh + 1.0, s * (D / 4 + 0.2)); r.rotation.x = s * 0.42; g.add(r);
    const sn = M(RB(W + 1.3, 0.3, D / 2 + 0.6, 0.15), snowM, 0, Hh + 1.27, s * (D / 4 + 0.1)); sn.rotation.x = s * 0.42; g.add(sn);
  }
  const floor = M(new THREE.CylinderGeometry(2.8, 3, 0.12, 24), smat('#d9b45a', { roughness: 1 }), 0, 0.05, 0); floor.scale.z = 0.75; g.add(floor);
  world.static.add(g); g.updateMatrixWorld(true);
  const toW = (lx, ly, lz) => new THREE.Vector3(lx, ly, lz).applyMatrix4(g.matrixWorld);
  const swap = Math.abs(Math.sin(rot)) > 0.5;
  const back = toW(0, 0, -D / 2);
  world.addBox(back.x, back.z, swap ? 0.5 : W / 2 + 0.4, swap ? W / 2 + 0.4 : 0.5, y0 + 2.6);
  for (const sx of [-1, 1]) { const p = toW(sx * W / 2, 0, 0); world.addBox(p.x, p.z, swap ? D / 2 : 0.45, swap ? 0.45 : D / 2, y0 + 1.3); }
  for (const sx of [-1, 1]) { const p = toW(sx * (W / 2 - 0.1), 0, D / 2 - 0.1); world.addCircle(p.x, p.z, 0.2); }
  g.userData = { roofTop: y0 + Hh + 1.9, y0, toW, inside: toW(0, 0, 0.2), front: toW(0, 0, D / 2 + 2.2), lantern: toW(W / 2 - 0.4, Hh - 0.3, D / 2 + 0.05) };
  return g;
}

// ---------- Fogueira ----------
export function campfireModel() {
  const g = new THREE.Group();
  const stone = smat('#8a8698', { roughness: 0.9 });
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; const s = M(new THREE.SphereGeometry(0.17, 10, 8), stone, Math.cos(a) * 0.55, 0.08, Math.sin(a) * 0.55); s.scale.y = 0.7; g.add(s); }
  for (let i = 0; i < 4; i++) { const l = M(new THREE.CylinderGeometry(0.06, 0.07, 0.8, 8), smat('#6b4529'), 0, 0.15, 0); l.rotation.set(Math.PI / 2 - 0.35, i * Math.PI / 4, 0, 'YXZ'); g.add(l); }
  const flame = new THREE.Group(); flame.visible = false; g.add(flame);
  const fm1 = M(new THREE.ConeGeometry(0.28, 0.75, 14), smat('#ffb02e', { emissive: '#ff8a1a', emissiveIntensity: 2.2 }), 0, 0.5, 0); flame.add(fm1);
  const fm2 = M(new THREE.ConeGeometry(0.15, 0.5, 12), smat('#fff1a8', { emissive: '#ffe066', emissiveIntensity: 2.4 }), 0, 0.42, 0.02); flame.add(fm2);
  const gl = glow('#ffa64a', 4.5, 0.75); gl.position.y = 0.6; flame.add(gl);
  const light = new THREE.PointLight('#ffad5a', 0, 14, 1.6); light.position.y = 1.0; g.add(light);
  g.userData = { flame, light, fm1, fm2 };
  return g;
}
export function lightFire(f) { f.userData.flame.visible = true; f.userData.light.intensity = 14; }
export function animateFire(f, t) {
  const u = f.userData; if (!u.flame.visible) return;
  u.fm1.scale.set(1 + Math.sin(t * 13) * 0.08, 1 + Math.sin(t * 9) * 0.15, 1); u.fm2.scale.y = 1 + Math.sin(t * 15 + 1) * 0.2;
  u.light.intensity = 12 + Math.sin(t * 17) * 2;
}

// ---------- Objetos de missão (brilham para serem achados) ----------
export function itemModel(kind) {
  const g = new THREE.Group();
  if (kind === 'plank') {
    const w = plankMat('#c08a55');
    for (let i = 0; i < 3; i++) { const p = M(RB(1.3, 0.09, 0.28, 0.03), w, 0, 0.12 + i * 0.1, (i - 1) * 0.06); p.rotation.y = (i - 1) * 0.15; g.add(p); }
    const rope = M(new THREE.TorusGeometry(0.17, 0.025, 6, 14), smat('#d6b27a'), 0, 0.22, 0); rope.rotation.y = Math.PI / 2; g.add(rope);
  } else if (kind === 'bread') {
    const b = smat('#d39a52', { roughness: 0.6 }); g.add(M(RB(0.5, 0.2, 0.4, 0.06), plankMat('#b98a55'), 0, 0.1, 0));
    for (const [x, z] of [[-0.1, -0.05], [0.12, 0.06], [0, 0.1]]) { const l = M(new THREE.SphereGeometry(0.14, 14, 10), b, x, 0.28, z); l.scale.set(1.2, 0.7, 0.9); g.add(l); }
  } else if (kind === 'jar') {
    const prof = [[0, 0], [0.16, 0.02], [0.22, 0.2], [0.2, 0.42], [0.09, 0.55], [0.08, 0.68], [0.11, 0.72], [0, 0.73]].map(([a, b]) => new THREE.Vector2(a, b));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 20), smat('#c9764a', { roughness: 0.7 })));
    const st = M(new THREE.TorusGeometry(0.21, 0.02, 6, 20), smat('#f0d9b0'), 0, 0.3, 0); st.rotation.x = Math.PI / 2; g.add(st);
  } else if (kind === 'blanket') {
    const c = smat('#b8453a', { roughness: 0.9 }), s = smat('#f0d9b0', { roughness: 0.9 });
    const r = M(new THREE.CylinderGeometry(0.17, 0.17, 0.8, 16), c, 0, 0.18, 0); r.rotation.z = Math.PI / 2; g.add(r);
    for (const x of [-0.25, 0.25]) { const b = M(new THREE.CylinderGeometry(0.175, 0.175, 0.07, 16), s, x, 0.18, 0); b.rotation.z = Math.PI / 2; g.add(b); }
  } else if (kind === 'hay') {
    g.add(M(RB(0.9, 0.5, 0.55, 0.12), smat('#e3bf55', { roughness: 1 }), 0, 0.25, 0));
    for (const x of [-0.25, 0.25]) g.add(M(RB(0.05, 0.52, 0.57, 0.02), smat('#8a5a3b'), x, 0.25, 0));
  } else if (kind === 'lantern') {
    g.add(M(RB(0.3, 0.4, 0.3, 0.05), smat('#ffe6a8', { emissive: '#ffb84d', emissiveIntensity: 1.6 }), 0, 0.25, 0));
    const cap = M(new THREE.ConeGeometry(0.24, 0.18, 4), smat('#3a2f2a'), 0, 0.54, 0); cap.rotation.y = Math.PI / 4; g.add(cap);
  }
  compact(g);
  const gl = glow('#fff1c4', 2.2, 0.6); gl.position.y = 0.45; g.add(gl);
  return g;
}

// Obstáculo na estrada: monte de pedras ou tronco caído com neve
export function obstacleModel(kind = 'rocks') {
  const g = new THREE.Group();
  if (kind === 'rocks') {
    const st = smat('#8e93ad', { roughness: 0.85 });
    for (const [x, y, z, r] of [[-0.6, 0.35, 0, 0.55], [0.5, 0.3, 0.2, 0.5], [0, 0.75, 0, 0.45], [0.1, 0.3, -0.5, 0.42], [-0.2, 0.25, 0.6, 0.35]]) { const b = M(new THREE.IcosahedronGeometry(r, 1), st, x, y, z); b.scale.y = 0.8; g.add(b); }
    const sn = M(new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), smat('#f4f7ff'), 0, 1.0, 0); sn.scale.y = 0.4; g.add(sn);
  } else {
    const w = smat('#6b4529');
    const t = M(new THREE.CylinderGeometry(0.22, 0.28, 3.4, 12), w, 0, 0.3, 0); t.rotation.z = Math.PI / 2; g.add(t);
    for (const [x, a] of [[-0.8, 0.7], [0.4, -0.6], [1.1, 0.5]]) { const b = M(new THREE.CylinderGeometry(0.06, 0.09, 1.0, 8), w, x, 0.6, 0.1); b.rotation.z = a; g.add(b); }
    g.add(M(RB(3.2, 0.12, 0.45, 0.05), smat('#f4f7ff'), 0, 0.55, 0));
    for (const [x, z] of [[-1.2, 0.3], [0.9, -0.3]]) g.add(M(new THREE.SphereGeometry(0.3, 10, 8), smat('#2c6e43'), x, 0.6, z));
  }
  return compact(g);
}

// A Estrela de Belém, grande, no céu
export function bigStarModel() {
  const g = new THREE.Group();
  const s = M(puffyStarGeometry(), smat('#fff3c4', { emissive: '#ffd36b', emissiveIntensity: 2.5 }), 0, 0, 0); s.scale.setScalar(3.4); g.add(s);
  const a = glow('#fff1c4', 26, 0.9), b = glow('#ffd36b', 60, 0.35); g.add(a, b);
  g.userData.star = s;
  return g;
}
// Raio de luz que desce da estrela
export function lightBeam(h = 40, r0 = 0.8, r1 = 3) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: '#ffe9b0', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
}
