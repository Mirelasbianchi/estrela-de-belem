// Personagens no estilo animação 3D: cabeças grandes, olhos expressivos, formas arredondadas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const cache = new Map();
export function smat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, envMapIntensity: 0.55, ...opts }));
  return cache.get(key);
}
const M = (geo, material, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); return m; };
const UP = new THREE.Vector3(0, 1, 0);

// Liga dois pontos com uma cápsula (braços, pernas)
function limb(a, b, r, material) {
  const d = new THREE.Vector3().subVectors(b, a); const len = d.length();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.01, len - r), 4, 10), material);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  return m;
}

// ---------- Olhos no estilo filme de animação ----------
const irisTex = new Map();
function irisTexture(color) {
  if (irisTex.has(color)) return irisTex.get(color);
  const c = document.createElement('canvas'); c.width = 8; c.height = 128; const g = c.getContext('2d');
  const base = new THREE.Color(color), light = base.clone().lerp(new THREE.Color('#ffffff'), 0.35), dark = base.clone().multiplyScalar(0.45);
  // v=1 (topo da imagem) é o centro da calota; v=0 é a borda
  const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0.0, '#080504'); gr.addColorStop(0.3, '#0b0706'); gr.addColorStop(0.35, dark.getStyle());
  gr.addColorStop(0.55, base.getStyle()); gr.addColorStop(0.75, light.getStyle()); gr.addColorStop(0.9, base.getStyle());
  gr.addColorStop(0.97, dark.multiplyScalar(0.6).getStyle()); gr.addColorStop(1, '#1a1210');
  g.fillStyle = gr; g.fillRect(0, 0, 8, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; irisTex.set(color, t); return t;
}
// Olhinho de brinquedo: oval escuro com brilhos (estilo fofo, nada de olho "realista")
export function eye(R, sx, iris, size, o) {
  const g = new THREE.Group();
  const dir = new THREE.Vector3(sx * Math.sin(0.4), -0.1, Math.cos(0.4)).normalize();
  g.position.copy(dir).multiplyScalar(R * 0.96);
  g.lookAt(g.position.clone().multiplyScalar(2));
  const inner = new THREE.Group(); g.add(inner);
  const dark = new THREE.Color(iris).lerp(new THREE.Color('#160c0c'), 0.72).getStyle();
  const ball = M(new THREE.SphereGeometry(size, 20, 16), smat(dark, { roughness: 0.18, envMapIntensity: 0.9 })); ball.scale.set(0.8, 1, 0.42); inner.add(ball);
  const hl = smat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 1 });
  const h1 = M(new THREE.SphereGeometry(size * 0.3, 12, 8), hl, size * 0.24, size * 0.36, size * 0.36); h1.scale.z = 0.4; inner.add(h1);
  const h2 = M(new THREE.SphereGeometry(size * 0.13, 10, 6), hl, -size * 0.22, -size * 0.36, size * 0.34); h2.scale.z = 0.4; inner.add(h2);
  if (o.lashes) for (const k of [0, 1]) {
    const l = M(new THREE.CapsuleGeometry(size * 0.07, size * 0.3, 3, 6), smat(dark), sx * size * (0.68 + k * 0.2), size * (0.82 - k * 0.3), 0);
    l.rotation.z = sx * (-0.9 - k * 0.5); inner.add(l);
  }
  compact(inner); inner.userData.keep = true; inner.userData.sy = 1;
  return { g, inner };
}
const LID_OPEN = -1.08, LID_SHUT = 1.15;

// Cabeça com formato de rosto (crânio maior, bochechas, queixo), não uma bola perfeita
function headGeometry(R, male) {
  const prof = male
    ? [[0, 1.0], [0.45, 0.93], [0.78, 0.7], [0.96, 0.38], [1.0, 0.06], [1.0, -0.22], [0.95, -0.48], [0.82, -0.72], [0.56, -0.9], [0, -0.96]]
    : [[0, 1.0], [0.45, 0.93], [0.78, 0.7], [0.96, 0.38], [1.0, 0.06], [1.01, -0.2], [0.96, -0.45], [0.8, -0.68], [0.5, -0.86], [0, -0.92]];
  // de baixo para cima: assim as faces apontam para fora (senão o rosto fica "transparente")
  const g = new THREE.LatheGeometry(prof.slice().reverse().map(([x, y]) => new THREE.Vector2(x * R, y * R)), 48);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    // bochechas cheinhas na frente e rosto um pouco achatado dos lados
    const front = Math.max(0, z / R), low = Math.max(0, Math.min(1, (-y / R + 0.05) / 0.6));
    p.setX(i, x * 0.97); p.setZ(i, z * (0.96 + 0.09 * front * low)); if (y < 0) p.setY(i, y * 0.88);
  }
  g.computeVertexNormals();
  return g;
}

function headParts(R, o) {
  const { skin, eyes, lashes, hair, veil, beard, old, male } = o;
  const h = new THREE.Group();
  const skinM = smat(skin, { roughness: 0.6, envMapIntensity: 0.3 });
  h.add(new THREE.Mesh(headGeometry(R, male), skinM));
  for (const sx of [-1, 1]) { const e = M(new THREE.SphereGeometry(R * 0.19, 12, 10), skinM, sx * R * 0.92, -R * 0.08, -R * 0.04); e.scale.set(0.6, 1, 0.9); h.add(e); }
  const eyeSize = male ? R * 0.125 : R * 0.14;
  const ey = [-1, 1].map(sx => eye(R, sx, eyes, eyeSize, { skin, lashes }));
  ey.forEach(e => h.add(e.g));
  // sobrancelhas em arco, macias
  const browC = hair ? new THREE.Color(hair.color).multiplyScalar(0.62).getStyle() : '#5a3a22';
  const brows = [];
  for (const sx of [-1, 1]) {
    const b = M(new THREE.TorusGeometry(R * 0.12, R * (male ? 0.03 : 0.02), 6, 14, Math.PI * 0.45), smat(browC, { roughness: 0.7 }), sx * R * 0.36, R * 0.1, R * 0.88);
    b.rotation.order = 'YXZ'; b.rotation.y = sx * 0.4; b.rotation.z = Math.PI / 2 - Math.PI * 0.225 - sx * 0.1; b.scale.y = 0.7;
    b.userData.keep = true; h.add(b); brows.push(b);
  }
  // narizinho arrebitado
  const nose = M(new THREE.SphereGeometry(R * 0.055, 16, 12), smat(new THREE.Color(skin).lerp(new THREE.Color('#e79a86'), 0.18).getStyle(), { roughness: 0.55, envMapIntensity: 0.3 }), 0, -R * 0.27, R * 0.97);
  nose.scale.set(1.25, 0.85, 0.7); h.add(nose);
  // boca: sorriso suave com lábio
  const mouth = new THREE.Group(); mouth.position.set(0, -R * 0.42, R * 0.9); mouth.rotation.x = -0.4; mouth.userData.keep = true; h.add(mouth);
  const smile = M(new THREE.TorusGeometry(R * 0.075, R * 0.018, 6, 16, Math.PI * 0.8), smat('#8a3a44'), 0, R * 0.05, 0);
  smile.rotation.z = Math.PI + Math.PI * 0.1; mouth.add(smile);
  const open = M(new THREE.SphereGeometry(R * 0.08, 14, 10), smat('#5a1f2a'), 0, -R * 0.0, -R * 0.02); open.scale.set(1.1, 0.01, 0.5); mouth.add(open);
  const lip = M(new THREE.SphereGeometry(R * 0.05, 10, 8), smat(new THREE.Color(skin).lerp(new THREE.Color('#d9707a'), 0.35).getStyle()), 0, -R * 0.07, -R * 0.01);
  lip.scale.set(1.1, 0.5, 0.65); lip.position.y = -R * 0.05;
  const cheek = new THREE.MeshStandardMaterial({ color: '#ff8f8f', transparent: true, opacity: male ? 0.22 : 0.45, depthWrite: false, roughness: 0.8 });
  for (const sx of [-1, 1]) { const c = M(new THREE.SphereGeometry(R * 0.14, 14, 10), cheek, sx * R * 0.55, -R * 0.3, R * 0.8); c.scale.z = 0.35; c.lookAt(c.position.clone().multiplyScalar(2)); h.add(c); }
  if (old) for (const sx of [-1, 1]) { const w = M(new THREE.TorusGeometry(R * 0.06, R * 0.008, 4, 8, Math.PI), smat('#b07a5a'), sx * R * 0.6, -R * 0.06, R * 0.74); w.rotation.y = sx * 0.6; h.add(w); }

  const F = Math.PI / 2;
  if (hair) {
    const hm = smat(hair.color, { roughness: 0.45 });
    const style = hair.style || 'short';
    const backLen = style === 'short' ? 0.55 : 0.86;
    const gap = style === 'short' ? 0.8 : 0.62;
    h.add(M(new THREE.SphereGeometry(R * 1.08, 36, 22, F + gap, Math.PI * 2 - gap * 2, 0, Math.PI * backLen), hm));
    h.add(M(new THREE.SphereGeometry(R * 1.1, 36, 16, 0, Math.PI * 2, 0, Math.PI * 0.37), hm));
    // franja em mechas (gotas alongadas), não bolinhas
    const bangs = style === 'short' ? [[-0.42, 0.35, 0.5], [-0.1, 0.33, -0.2], [0.22, 0.33, 0.3], [0.5, 0.36, -0.5]] : [[-0.58, 0.38, 0.6], [-0.26, 0.34, 0.3], [0.06, 0.33, -0.15], [0.36, 0.34, -0.45], [0.64, 0.39, -0.7]];
    for (const [dp, th, tilt] of bangs) {
      const phi = F + dp, t = Math.PI * th;
      const p = new THREE.Vector3(-Math.cos(phi) * Math.sin(t), Math.cos(t), Math.sin(phi) * Math.sin(t)).multiplyScalar(R * 1.03);
      const s = M(new THREE.SphereGeometry(R * 0.22, 16, 12), hm, p.x, p.y, p.z);
      s.lookAt(p.clone().multiplyScalar(2)); s.rotateZ(tilt); s.scale.set(0.85, 1.35, 0.32); h.add(s);
    }
    if (style !== 'short') {
      const L = style === 'bob' ? 1.7 : 2.6;
      const prof = [[1.04, 0.35], [1.11, 0.0], [1.1, -0.4], [1.04, -0.8], [1.1, -1.2], [1.22, -1.6], [1.28, -2.0], [1.26, -L + 0.25], [1.14, -L], [0.98, -L + 0.08]]
        .filter(([, y]) => y >= -L - 0.01).map(([x, y]) => new THREE.Vector2(x * R, y * R));
      const gp = 0.85;
      const hg = new THREE.LatheGeometry(prof, 64, gp, Math.PI * 2 - gp * 2);
      const pp = hg.attributes.position;
      for (let i = 0; i < pp.count; i++) {
        const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i), ph = Math.atan2(x, z);
        const below = Math.max(0, -y / R - 0.3);
        const k = 1 + (0.035 + 0.03 * below) * Math.sin(ph * 10 + y / R * 2.2);
        pp.setX(i, x * k); pp.setZ(i, z * k);
        if (y < -(L - 0.3) * R) pp.setY(i, y + Math.sin(ph * 7) * R * 0.12);
      }
      hg.computeVertexNormals();
      h.add(new THREE.Mesh(hg, smat(hair.color, { roughness: 0.45, side: THREE.DoubleSide })));
    } else {
      // topete com cachinhos
      for (const [x, y, z, r] of [[0.2, 1.0, 0.25, 0.26], [-0.22, 1.0, 0.18, 0.25], [0.02, 1.04, -0.05, 0.27], [-0.35, 0.86, -0.4, 0.24], [0.38, 0.86, -0.38, 0.24], [0, 0.8, -0.65, 0.26]])
        h.add(M(new THREE.SphereGeometry(R * r, 14, 10), hm, x * R, y * R, z * R));
    }
  }
  if (o.hat) h.add(santaHat(R));
  if (veil) {
    const vm = smat(veil, { side: THREE.DoubleSide, roughness: 0.7 });
    h.add(M(new THREE.SphereGeometry(R * 1.15, 36, 22, F + 0.78, Math.PI * 2 - 1.56, 0, Math.PI * 0.82), vm));
    h.add(M(new THREE.SphereGeometry(R * 1.16, 36, 16, 0, Math.PI * 2, 0, Math.PI * 0.27), vm));
    h.add(M(new THREE.CylinderGeometry(R * 1.0, R * 1.35, R * 1.4, 28, 1, true, 0.75, Math.PI * 2 - 1.5), vm, 0, -R * 1.05, -R * 0.05));
  }
  if (beard) {
    const bm = smat(beard, { roughness: 0.6 });
    const bg = M(new THREE.SphereGeometry(R * 1.07, 32, 16, F - 1.35, 2.7, Math.PI * 0.7, Math.PI * 0.27), bm, 0, -R * 0.02, R * 0.0); bg.scale.set(0.99, 0.95, 1); h.add(bg);
    for (const sx of [-1, 1]) { const sb = M(new THREE.SphereGeometry(R * 0.17, 12, 10), bm, sx * R * 0.74, -R * 0.5, R * 0.42); sb.scale.set(0.6, 1.3, 0.9); h.add(sb); }
    for (const sx of [-1, 1]) { const m = M(new THREE.CapsuleGeometry(R * 0.04, R * 0.13, 3, 8), bm, sx * R * 0.09, -R * 0.34, R * 0.94); m.rotation.z = Math.PI / 2 - sx * 0.25; h.add(m); }
  }
  h.userData.rig = { eyes: ey.map(e => e.inner), mouth: open, brows };
  return h;
}

/**
 * Personagem estilo filme de animação: corpo com articulações (pernas, braços, cabeça) para andar, piscar e respirar.
 * Opções: color, trim, fur, belt, sash, skin, eyes, hair{color,style}, veil, mantle, beard, hat, male,
 * s (escala), kneel, pray, long (veste até o chão), boots, tights, emissive, old, staff, lashes
 */
export function chibi(o = {}) {
  const { color = '#8b5a3c', trim = null, fur = null, belt = null, sash = null, skin = '#f6cfb0', mantle = null, s = 1,
    kneel = false, pray = false, long = false, boots = '#7a4a2b', tights = '#f4efe8', emissive = null, staff = false, collar = null, male = false } = o;
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const em = emissive ? { emissive, emissiveIntensity: 0.22 } : {};
  const dressM = smat(color, em);
  const showLegs = !long && !kneel;
  const waistY = kneel ? 0.6 : 1.0;
  const hemY = long || kneel ? 0.0 : 0.47;
  const hemR = kneel ? 0.52 : long ? (male ? 0.36 : 0.38) : 0.44;
  const sw = male ? 1.22 : 1; // largura dos ombros
  // pernas articuladas no quadril
  const legs = [];
  if (showLegs) for (const sx of [-1, 1]) {
    const L = new THREE.Group(); L.position.set(sx * 0.09, 0.58, 0); g.add(L);
    L.add(M(new THREE.CapsuleGeometry(0.058, 0.36, 4, 10), smat(tights), 0, -0.22, 0));
    L.add(M(new THREE.CapsuleGeometry(0.075, 0.1, 4, 12), smat(boots, { roughness: 0.4 }), 0, -0.48, 0.02));
    const toe = M(new THREE.SphereGeometry(0.075, 14, 10), smat(boots, { roughness: 0.4 }), 0, -0.53, 0.08); toe.scale.set(1, 0.7, 1.3); L.add(toe);
    if (fur) { const c = M(new THREE.TorusGeometry(0.08, 0.035, 10, 20), smat(fur, { roughness: 0.95 }), 0, -0.36, 0.01); c.rotation.x = Math.PI / 2; L.add(c); }
    legs.push(L);
  } else if (!kneel) for (const sx of [-1, 1]) {
    const L = new THREE.Group(); L.position.set(sx * 0.1, 0.05, 0.08); g.add(L);
    const f = M(new THREE.SphereGeometry(0.075, 14, 10), smat(boots, { roughness: 0.4 }), 0, -0.015, 0.06); f.scale.set(1, 0.6, 1.4); L.add(f);
    legs.push(L);
  }
  // saia/túnica rodada com barra ondulada
  const wr = male ? 0.19 : 0.16;
  const prof = [[0, hemY], [hemR * 0.97, hemY], [hemR, hemY + 0.04], [hemR * 0.9, hemY + (waistY - hemY) * 0.25], [hemR * (male ? 0.75 : 0.62), hemY + (waistY - hemY) * 0.6], [wr + 0.04, waistY - 0.05], [wr, waistY], [0, waistY + 0.01]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const skirt = new THREE.LatheGeometry(prof, 48);
  {
    const p = skirt.attributes.position, half = (waistY - hemY) * 0.5;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i), r = Math.hypot(x, z);
      if (r > 0.05 && y < hemY + half) { const th = Math.atan2(x, z), k = 1 + (male ? 0.025 : 0.045) * Math.sin(th * 11) * (1 - (y - hemY) / half); p.setX(i, x * k); p.setZ(i, z * k); }
    }
    skirt.computeVertexNormals();
  }
  body.add(new THREE.Mesh(skirt, dressM));
  const hemC = fur || trim;
  if (hemC) { const t = M(new THREE.TorusGeometry(hemR, fur ? 0.06 : 0.025, 12, 48), smat(hemC, fur ? { roughness: 0.95 } : { metalness: 0.4, roughness: 0.35 }), 0, hemY + 0.04, 0); t.rotation.x = Math.PI / 2; body.add(t); }
  const torso = M(new THREE.CapsuleGeometry(0.15, 0.2, 6, 16), dressM, 0, waistY + 0.2, 0); torso.scale.set(1.05 * sw, 1, 0.78 * (male ? 1.1 : 1)); body.add(torso);
  const beltC = belt || sash;
  if (beltC) {
    const b = M(new THREE.TorusGeometry(wr + 0.005, 0.032, 10, 30), smat(beltC, { roughness: 0.4, metalness: belt ? 0.1 : 0.4 }), 0, waistY + 0.02, 0); b.rotation.x = Math.PI / 2; b.scale.set(1.02, 0.8, 1); body.add(b);
    if (belt) { const bk = M(new THREE.TorusGeometry(0.035, 0.012, 6, 4), smat('#e8bf55', { metalness: 0.7, roughness: 0.25 }), 0, waistY + 0.02, wr - 0.03); bk.rotation.z = Math.PI / 4; body.add(bk); }
  }
  const colC = fur || collar || trim;
  if (colC) { const c = M(new THREE.TorusGeometry(0.1, fur ? 0.045 : 0.025, 10, 24), smat(colC, fur ? { roughness: 0.95 } : { metalness: 0.4, roughness: 0.35 }), 0, waistY + 0.37, 0.01); c.rotation.x = Math.PI / 2 - 0.15; body.add(c); }
  if (mantle) {
    const mp = [[0, 0.0], [0.42, 0.0], [0.45, 0.04], [0.42, 0.3], [0.32, waistY * 0.75], [0.22, waistY + 0.3], [0.13, waistY + 0.4]].map(([x, y]) => new THREE.Vector2(x + 0.02, y));
    body.add(new THREE.Mesh(new THREE.LatheGeometry(mp, 36, 0.6, Math.PI * 2 - 1.2), smat(mantle, { side: THREE.DoubleSide })));
  }
  body.add(M(new THREE.CylinderGeometry(0.045, 0.055, 0.12, 12), smat(skin), 0, waistY + 0.42, 0));
  // braços articulados no ombro
  const sleeve = smat(mantle || color, em), arms = [];
  for (const sx of [-1, 1]) {
    const S = new THREE.Vector3(sx * 0.17 * sw, waistY + 0.32, 0);
    const A = new THREE.Group(); A.position.copy(S); g.add(A);
    const Hp = (pray ? new THREE.Vector3(sx * 0.03, waistY + 0.13, 0.2) : new THREE.Vector3(sx * 0.27 * sw, waistY - 0.1, 0.05)).sub(S);
    A.add(limb(new THREE.Vector3(), Hp, male ? 0.056 : 0.048, sleeve));
    if (fur) {
      const c = M(new THREE.TorusGeometry(0.055, 0.03, 8, 16), smat(fur, { roughness: 0.95 }));
      c.position.copy(Hp).multiplyScalar(0.82); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), Hp.clone().normalize()); A.add(c);
    }
    const hand = M(new THREE.SphereGeometry(male ? 0.055 : 0.048, 14, 10), smat(skin), Hp.x, Hp.y + (pray ? 0.03 : -0.03), Hp.z + (pray ? 0.02 : 0));
    hand.scale.set(pray ? 0.6 : 0.9, 1.3, 0.9); A.add(hand);
    if (staff && sx > 0) {
      A.add(M(new THREE.CylinderGeometry(0.022, 0.028, 1.75, 8), smat('#7a5233'), Hp.x + 0.03, Hp.y + 0.1, Hp.z + 0.01));
      A.add(M(new THREE.TorusGeometry(0.09, 0.022, 6, 14, Math.PI * 1.3), smat('#7a5233'), Hp.x + 0.12, Hp.y + 0.97, Hp.z + 0.01));
    }
    arms.push(A);
  }
  const R = male ? 0.24 : 0.25;
  const head = headParts(R, o); head.position.y = waistY + 0.42 + R * 0.76; g.add(head);
  [body, head, ...legs, ...arms].forEach(compact);
  g.userData.head = head; g.userData.headY = head.position.y; g.userData.backY = waistY + 0.28;
  g.userData.rig = { body, head, legs, arms, pray, kneel, ...head.userData.rig, blink: 0, next: 1 + Math.random() * 3, seed: Math.random() * 10, headY: head.position.y };
  g.scale.setScalar(s);
  return g;
}

/**
 * Anima um personagem: piscar, respirar, cabeça viva, pernas e braços ao andar.
 * opts: speed (m/s), phase (passo), air (no ar), talk (falando), look (yaw da cabeça, rad)
 */
export function animateChar(g, t, dt, opts = {}) {
  const r = g.userData.rig; if (!r) return;
  const { speed = 0, phase = t * 2, air = false, talk = false, look = 0 } = opts;
  const t2 = t + r.seed;
  // piscar
  r.next -= dt;
  if (r.next <= 0) { r.blink = 0.16; r.next = 1.8 + Math.random() * 3.2; if (Math.random() < 0.15) r.next = 0.25; }
  let bk = 0;
  if (r.blink > 0) { r.blink -= dt; bk = Math.sin(Math.max(0, r.blink) / 0.16 * Math.PI); }
  for (const e of r.eyes) e.scale.y = 1 - 0.88 * bk;
  // olhos passeiam um pouquinho
  const ex = Math.sin(t2 * 0.37) * 0.06 + Math.sin(t2 * 1.3) * 0.02, eyy = Math.sin(t2 * 0.29) * 0.03;
  for (const e of r.eyes) { e.position.x = ex * 0.004; e.position.y = eyy * 0.004; }
  // respiração e corpo
  const walk = Math.min(1, speed / 5);
  r.body.scale.y = 1 + Math.sin(t2 * 2.2) * 0.012;
  r.body.position.y = walk * Math.abs(Math.sin(phase)) * 0.04;
  r.head.position.y = r.headY + Math.sin(t2 * 2.2) * 0.006 + walk * Math.abs(Math.sin(phase)) * 0.04;
  r.head.rotation.z = Math.sin(t2 * 0.8) * 0.05 + walk * Math.sin(phase) * 0.04;
  r.head.rotation.x = Math.sin(t2 * 0.55) * 0.04 + (talk ? Math.sin(t2 * 7) * 0.035 : 0);
  r.head.rotation.y += (Math.max(-0.9, Math.min(0.9, look)) - r.head.rotation.y) * Math.min(1, dt * 5);
  for (const b of r.brows) { if (b.userData.y0 === undefined) b.userData.y0 = b.position.y; b.position.y = b.userData.y0 + (talk ? Math.max(0, Math.sin(t2 * 3)) * 0.012 : 0); }
  r.mouth.scale.y = talk ? 0.12 + Math.abs(Math.sin(t2 * 11)) * 0.5 : 0.01;
  // pernas
  r.legs.forEach((L, i) => {
    const sx = i ? 1 : -1;
    const target = air ? 0.35 + Math.sin(t2 * 3 + i) * 0.12 : walk * Math.sin(phase + (i ? Math.PI : 0)) * 0.7;
    L.rotation.x += (target - L.rotation.x) * Math.min(1, dt * 14);
    L.rotation.z = sx * 0.03;
  });
  // braços
  r.arms.forEach((A, i) => {
    const sx = i ? 1 : -1;
    let tx = r.pray ? 0 : -walk * Math.sin(phase + (i ? Math.PI : 0)) * 0.55, tz = Math.sin(t2 * 2.2) * 0.02 * sx;
    if (air && !r.pray) { tx = -0.25; tz = sx * 0.55; }
    A.rotation.x += (tx - A.rotation.x) * Math.min(1, dt * 12);
    A.rotation.z += (tz - A.rotation.z) * Math.min(1, dt * 8);
  });
}

// Junta as peças de um modelo em uma malha por material (muito menos chamadas de desenho).
// Partes marcadas com userData.keep continuam separadas (pálpebras, boca...).
export function compact(g) {
  g.updateMatrixWorld(true);
  const inv = g.matrixWorld.clone().invert(), groups = new Map(), remove = [], m4 = new THREE.Matrix4();
  const visit = o => {
    for (const c of o.children) {
      if (c.userData.keep) continue;
      if (c.isMesh && !Array.isArray(c.material) && !c.material.transparent) {
        let geo = c.geometry.clone(); if (geo.index) geo = geo.toNonIndexed();
        geo.applyMatrix4(m4.multiplyMatrices(inv, c.matrixWorld));
        for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
        if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
        geo.morphAttributes = {}; geo.clearGroups();
        const k = c.material.uuid; if (!groups.has(k)) groups.set(k, { m: c.material, list: [] });
        groups.get(k).list.push(geo); remove.push(c);
      }
      visit(c);
    }
  };
  visit(g);
  for (const o of remove) { o.parent.remove(o); }
  for (const { m, list } of groups.values()) { const geo = mergeGeometries(list); if (geo) g.add(new THREE.Mesh(geo, m)); }
  return g;
}

function santaHat(R) {
  const hat = new THREE.Group(); hat.position.set(0, R * 0.62, -R * 0.05); hat.rotation.x = -0.25;
  const geo = new THREE.ConeGeometry(R * 1.02, R * 1.7, 28, 6);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = (y + R * 0.85) / (R * 1.7); p.setX(i, p.getX(i) + k * k * R * 0.9); p.setY(i, y - k * k * R * 0.5); }
  geo.computeVertexNormals();
  hat.add(M(geo, smat('#d42f3a', { roughness: 0.8 }), 0, R * 0.75, 0));
  const brim = M(new THREE.TorusGeometry(R * 1.02, R * 0.2, 12, 32), smat('#ffffff', { roughness: 0.95 }), 0, R * 0.05, 0); brim.rotation.x = Math.PI / 2; hat.add(brim);
  hat.add(M(new THREE.SphereGeometry(R * 0.26, 14, 10), smat('#ffffff', { roughness: 0.95 }), R * 0.95, R * 1.0, 0));
  return hat;
}

// ---------- Asas de penas ----------
function wingGeometry() {
  const parts = [];
  const A = t => new THREE.Vector3(0.06 + 0.52 * t, 0.08 + 0.36 * t - 0.14 * t * t, 0);
  const feather = (anchor, ang, len, wid, z) => {
    const g = new THREE.SphereGeometry(1, 14, 10); g.scale(len / 2, wid, 0.035);
    g.rotateZ(ang); g.translate(anchor.x + Math.cos(ang) * len / 2, anchor.y + Math.sin(ang) * len / 2, z);
    return g;
  };
  for (let k = 0; k < 7; k++) { const t = k / 6; parts.push(feather(A(t), -1.45 + 1.4 * t, 0.36 + 0.3 * t, 0.075, -0.02)); }
  for (let k = 0; k < 6; k++) { const t = k / 5; parts.push(feather(A(t).add(new THREE.Vector3(0, 0.03, 0)), -1.3 + 1.35 * t, 0.22 + 0.18 * t, 0.07, 0.01)); }
  for (let k = 0; k < 6; k++) { const t = k / 5; const p = A(t); const g = new THREE.SphereGeometry(0.08 + 0.02 * (1 - t), 12, 10); g.scale(1, 0.85, 0.45); g.translate(p.x, p.y + 0.02, 0.03); parts.push(g); }
  return mergeGeometries(parts);
}
let _wingGeo;
export function makeWings(scale, glowI = 0.15) {
  _wingGeo = _wingGeo || wingGeometry();
  const m = smat('#ffffff', { emissive: '#fff4dd', emissiveIntensity: glowI, roughness: 0.5 });
  const L = new THREE.Group(), R = new THREE.Group();
  const wl = new THREE.Mesh(_wingGeo, m); wl.scale.set(-scale, scale, scale); L.add(wl);
  const wr = new THREE.Mesh(_wingGeo, m); wr.scale.set(scale, scale, scale); R.add(wr);
  return [L, R];
}
export function setWings(model, a) {
  const [L, R] = model.userData.wings;
  R.rotation.y = a; L.rotation.y = -a;
}
function halo(r, y) {
  const h = M(new THREE.TorusGeometry(r, r * 0.16, 10, 36), smat('#ffd75e', { emissive: '#ffbf2e', emissiveIntensity: 1.5, metalness: 0.5, roughness: 0.3 }), 0, y, -0.06);
  h.rotation.x = Math.PI / 2 - 0.3; return h;
}

// A anjinha mensageira (jogadora)
export function angelModel(glowFn) {
  const g = chibi({
    color: '#9ccbee', trim: '#e8bf55', fur: null, collar: '#ffffff', belt: '#e8bf55', skin: '#eab28e', eyes: '#3f9a58', lashes: true,
    hair: { color: '#c39448', style: 'long' }, boots: '#e8bf55', tights: '#ffffff',
  });
  g.add(halo(0.19, g.userData.headY + 0.36));
  const [L, R] = makeWings(1.0);
  const by = g.userData.backY;
  L.position.set(-0.05, by, -0.13); R.position.set(0.05, by, -0.13);
  L.rotation.x = R.rotation.x = 0.1; g.add(L, R);
  g.userData.wings = [L, R];
  if (glowFn) { const gl = glowFn('#ffe3a3', 2.6, 0.24); gl.position.set(0, 1.0, -0.35); g.add(gl); }
  return g;
}

export function gabrielModel(glowFn, lilyFn) {
  const g = chibi({
    color: '#fffaf0', trim: '#f0c54e', belt: null, sash: '#f0c54e', skin: '#eec3a0', eyes: '#3f7fc4', emissive: '#fff1c9', long: true, male: true,
    hair: { color: '#d9a441', style: 'short' }, boots: '#f0c54e', s: 1.4,
  });
  g.add(halo(0.2, g.userData.headY + 0.35));
  const [L, R] = makeWings(1.7, 0.35);
  const by = g.userData.backY;
  L.position.set(-0.05, by, -0.14); R.position.set(0.05, by, -0.14); g.add(L, R);
  g.userData.wings = [L, R];
  if (lilyFn) { const lily = lilyFn(false); lily.scale.setScalar(0.7); lily.position.set(0.3, 0.55, 0.1); g.add(lily); }
  if (glowFn) { const gl = glowFn('#fff0c0', 5.5, 0.45); gl.position.set(0, 1.1, -0.6); g.add(gl); }
  return g;
}

// ---------- Renas ----------
export function reindeerModel() {
  const g = new THREE.Group();
  const fur = smat('#a96c3e', { roughness: 0.7 }), light = smat('#f3dcbd', { roughness: 0.7 }), dark = smat('#3a2a22', { roughness: 0.35 });
  const body = M(new THREE.SphereGeometry(0.3, 24, 18), fur, 0, 0.55, 0); body.scale.set(0.85, 0.8, 1.3); g.add(body);
  const chest = M(new THREE.SphereGeometry(0.2, 18, 14), light, 0, 0.55, 0.24); chest.scale.set(0.9, 1, 0.7); g.add(chest);
  const legs = [];
  for (const [x, z] of [[-0.13, 0.2], [0.13, 0.2], [-0.13, -0.22], [0.13, -0.22]]) {
    const leg = new THREE.Group(); leg.position.set(x, 0.45, z);
    leg.add(M(new THREE.CapsuleGeometry(0.055, 0.3, 4, 8), fur, 0, -0.2, 0));
    leg.add(M(new THREE.SphereGeometry(0.06, 10, 8), dark, 0, -0.4, 0.01));
    g.add(leg); legs.push(leg);
  }
  g.add(M(new THREE.SphereGeometry(0.07, 10, 8), light, 0, 0.66, -0.4));
  const neck = M(new THREE.CapsuleGeometry(0.1, 0.16, 4, 10), fur, 0, 0.82, 0.22); neck.rotation.x = 0.4; g.add(neck);
  const head = new THREE.Group(); head.position.set(0, 1.1, 0.3); g.add(head);
  head.add(M(new THREE.SphereGeometry(0.26, 26, 20), fur));
  const muz = M(new THREE.SphereGeometry(0.15, 18, 14), light, 0, -0.1, 0.18); muz.scale.set(1.05, 0.8, 1); head.add(muz);
  head.add(M(new THREE.SphereGeometry(0.06, 14, 10), dark, 0, -0.05, 0.33));
  head.add(M(new THREE.SphereGeometry(0.018, 8, 6), smat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 }), 0.02, -0.02, 0.385));
  for (const sx of [-1, 1]) head.add(eye(0.26, sx, '#6b3d1e', 0.07, { skin: '#a96c3e', lashes: true }).g);
  const smile = M(new THREE.TorusGeometry(0.045, 0.01, 6, 14, Math.PI), smat('#5a2f2a'), 0, -0.15, 0.3); smile.rotation.z = Math.PI; head.add(smile);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Group(); ear.position.set(sx * 0.22, 0.12, -0.03); ear.rotation.z = -sx * 0.9;
    const e1 = M(new THREE.SphereGeometry(0.1, 14, 10), fur); e1.scale.set(0.55, 1.3, 0.3); ear.add(e1);
    const e2 = M(new THREE.SphereGeometry(0.07, 12, 8), smat('#f2b6b0'), 0, 0, 0.02); e2.scale.set(0.5, 1.15, 0.25); ear.add(e2);
    head.add(ear);
    const nub = M(new THREE.CapsuleGeometry(0.025, 0.08, 3, 6), smat('#d9b98c'), sx * 0.1, 0.24, -0.04); nub.rotation.z = -sx * 0.3; head.add(nub);
  }
  const cheek = new THREE.MeshStandardMaterial({ color: '#ff9a8f', transparent: true, opacity: 0.4, depthWrite: false });
  for (const sx of [-1, 1]) { const c = M(new THREE.SphereGeometry(0.045, 10, 8), cheek, sx * 0.15, -0.07, 0.2); c.scale.z = 0.4; head.add(c); }
  // gorro de Papai Noel
  const hat = new THREE.Group(); hat.position.set(0.02, 0.17, -0.02); hat.rotation.set(-0.35, 0, -0.25);
  const cone = M(new THREE.ConeGeometry(0.21, 0.38, 24), smat('#d42f3a', { roughness: 0.75 }), 0, 0.2, 0); cone.rotation.z = -0.25; hat.add(cone);
  const brim = M(new THREE.TorusGeometry(0.2, 0.055, 12, 28), smat('#ffffff', { roughness: 0.95 }), 0, 0.02, 0); brim.rotation.x = Math.PI / 2; hat.add(brim);
  hat.add(M(new THREE.SphereGeometry(0.065, 14, 10), smat('#ffffff', { roughness: 0.95 }), 0.1, 0.38, 0));
  head.add(hat);
  g.userData = { head, legs };
  return g;
}
export function animateReindeer(r, t, speed) {
  const { legs, head } = r.userData; const k = Math.min(1, speed / 3);
  legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 12 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.6 * k; });
  head.rotation.z = Math.sin(t * 1.3) * 0.08 * (1 - k);
  head.rotation.x = Math.sin(t * 2) * 0.05;
}

// ---------- Estrela gordinha ----------
export function puffyStarGeometry(outer = 0.46, inner = 0.23) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const r = i % 2 ? inner : outer, a = i / 10 * Math.PI * 2 + Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r)); }
  const s = new THREE.Shape();
  pts.forEach((v, i) => {
    const prev = pts[(i + 9) % 10], next = pts[(i + 1) % 10], k = i % 2 ? 0.18 : 0.28;
    const a = v.clone().lerp(prev, k), b = v.clone().lerp(next, k);
    i === 0 ? s.moveTo(a.x, a.y) : s.lineTo(a.x, a.y);
    s.quadraticCurveTo(v.x, v.y, b.x, b.y);
  });
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelSize: 0.09, bevelThickness: 0.13, bevelSegments: 6, curveSegments: 10 });
  g.center(); g.computeVertexNormals(); return g;
}
