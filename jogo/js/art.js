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

// Olho grande e brilhante, posicionado na superfície da cabeça
function eye(R, sx, iris, size = 0.088, lashes = false) {
  const g = new THREE.Group();
  const dir = new THREE.Vector3(sx * Math.sin(0.36), 0.0, Math.cos(0.36)).normalize();
  g.position.copy(dir).multiplyScalar(R * 0.93); g.position.y = 0.0;
  g.lookAt(g.position.clone().multiplyScalar(2));
  const white = M(new THREE.SphereGeometry(size, 20, 14), smat('#ffffff', { roughness: 0.25 })); white.scale.set(1, 1.12, 0.55); g.add(white);
  const ir = M(new THREE.SphereGeometry(size * 0.72, 20, 14), smat(iris, { roughness: 0.2 }), 0, -size * 0.06, size * 0.3); ir.scale.set(1, 1.1, 0.4); g.add(ir);
  const pu = M(new THREE.SphereGeometry(size * 0.4, 16, 10), smat('#120c08', { roughness: 0.15 }), 0, -size * 0.06, size * 0.42); pu.scale.set(1, 1.1, 0.35); g.add(pu);
  g.add(M(new THREE.SphereGeometry(size * 0.2, 10, 8), smat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.8 }), size * 0.3 * sx, size * 0.32, size * 0.52));
  g.add(M(new THREE.SphereGeometry(size * 0.1, 8, 6), smat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.8 }), -size * 0.25 * sx, -size * 0.35, size * 0.5));
  if (lashes) {
    const l = M(new THREE.CapsuleGeometry(size * 0.12, size * 0.9, 3, 6), smat('#2a1a12'), sx * size * 0.15, size * 1.02, size * 0.25);
    l.rotation.z = Math.PI / 2 + sx * 0.25; g.add(l);
    const tip = M(new THREE.CapsuleGeometry(size * 0.08, size * 0.35, 3, 6), smat('#2a1a12'), sx * size * 0.95, size * 0.9, size * 0.2);
    tip.rotation.z = Math.PI / 2 + sx * 0.9; g.add(tip);
  }
  return g;
}

function headParts(R, o) {
  const { skin, eyes, lashes, hair, veil, beard, old } = o;
  const h = new THREE.Group();
  h.add(M(new THREE.SphereGeometry(R, 36, 26), smat(skin, { roughness: 0.55 })));
  for (const sx of [-1, 1]) h.add(M(new THREE.SphereGeometry(R * 0.2, 12, 10), smat(skin), sx * R * 0.96, -R * 0.06, -R * 0.02));
  for (const sx of [-1, 1]) h.add(eye(R, sx, eyes, R * 0.24, lashes));
  // sobrancelhas
  const browC = hair ? new THREE.Color(hair.color).multiplyScalar(0.7).getStyle() : '#5a3a22';
  for (const sx of [-1, 1]) {
    const b = M(new THREE.CapsuleGeometry(R * 0.03, R * 0.17, 3, 6), smat(browC), sx * R * 0.34, R * 0.36, R * 0.87);
    b.rotation.z = Math.PI / 2 + sx * 0.12; b.rotation.y = sx * 0.35; h.add(b);
  }
  // nariz, boca, bochechas
  h.add(M(new THREE.SphereGeometry(R * 0.075, 12, 10), smat(new THREE.Color(skin).multiplyScalar(0.92).getStyle()), 0, -R * 0.14, R * 0.98));
  const smile = M(new THREE.TorusGeometry(R * 0.14, R * 0.025, 6, 18, Math.PI), smat('#a14b55'), 0, -R * 0.3, R * 0.93);
  smile.rotation.z = Math.PI; smile.rotation.x = -0.25; h.add(smile);
  const cheek = new THREE.MeshStandardMaterial({ color: '#ff8f8f', transparent: true, opacity: 0.45, depthWrite: false, roughness: 0.8 });
  for (const sx of [-1, 1]) { const c = M(new THREE.SphereGeometry(R * 0.16, 14, 10), cheek, sx * R * 0.52, -R * 0.24, R * 0.8); c.scale.z = 0.35; c.lookAt(c.position.clone().multiplyScalar(2)); h.add(c); }
  if (old) for (const sx of [-1, 1]) { const w = M(new THREE.TorusGeometry(R * 0.06, R * 0.008, 4, 8, Math.PI), smat('#b07a5a'), sx * R * 0.6, -R * 0.02, R * 0.78); w.rotation.y = sx * 0.6; h.add(w); }

  const F = Math.PI / 2; // frente (phi da SphereGeometry)
  if (hair) {
    const hm = smat(hair.color, { roughness: 0.45 });
    const style = hair.style || 'short';
    const backLen = style === 'short' ? 0.62 : 0.86;
    const gap = style === 'short' ? 0.5 : 0.62;
    h.add(M(new THREE.SphereGeometry(R * 1.1, 36, 22, F + gap, Math.PI * 2 - gap * 2, 0, Math.PI * backLen), hm));
    h.add(M(new THREE.SphereGeometry(R * 1.12, 36, 16, 0, Math.PI * 2, 0, Math.PI * 0.33), hm));
    // franja com volume
    const bangs = style === 'short' ? [[-0.35, 0.3], [0.05, 0.27], [0.4, 0.3]] : [[-0.5, 0.3], [-0.12, 0.27], [0.28, 0.26], [0.58, 0.31]];
    for (const [dp, th] of bangs) {
      const phi = F + dp, t = Math.PI * th;
      const p = new THREE.Vector3(-Math.cos(phi) * Math.sin(t), Math.cos(t), Math.sin(phi) * Math.sin(t)).multiplyScalar(R * 1.05);
      const s = M(new THREE.SphereGeometry(R * 0.24, 16, 12), hm, p.x, p.y, p.z); s.scale.set(1.25, 0.75, 0.6); s.lookAt(p.clone().multiplyScalar(2)); h.add(s);
    }
    if (style !== 'short') {
      // cortina de cabelo longo e ondulado (aberta na frente para mostrar o rosto)
      const L = style === 'bob' ? 1.7 : 2.6;
      const prof = [[1.06, 0.35], [1.13, 0.0], [1.12, -0.4], [1.05, -0.8], [1.12, -1.2], [1.25, -1.6], [1.32, -2.0], [1.3, -L + 0.25], [1.18, -L], [1.0, -L + 0.08]]
        .filter(([, y]) => y >= -L - 0.01).map(([x, y]) => new THREE.Vector2(x * R, y * R));
      const gap = 0.85;
      const hg = new THREE.LatheGeometry(prof, 64, gap, Math.PI * 2 - gap * 2);
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
      for (const [x, y, z] of [[0.15, 1.02, 0.1], [-0.2, 1.0, -0.05], [0.0, 0.98, -0.3]]) h.add(M(new THREE.SphereGeometry(R * 0.25, 12, 10), hm, x * R, y * R, z * R));
    }
  }
  if (o.hat) h.add(santaHat(R));
  if (veil) {
    const vm = smat(veil, { side: THREE.DoubleSide, roughness: 0.7 });
    h.add(M(new THREE.SphereGeometry(R * 1.17, 36, 22, F + 0.78, Math.PI * 2 - 1.56, 0, Math.PI * 0.82), vm));
    h.add(M(new THREE.SphereGeometry(R * 1.18, 36, 16, 0, Math.PI * 2, 0, Math.PI * 0.27), vm));
    const drape = M(new THREE.CylinderGeometry(R * 1.0, R * 1.35, R * 1.4, 28, 1, true, 0.75, Math.PI * 2 - 1.5), vm, 0, -R * 1.05, -R * 0.05);
    h.add(drape);
  }
  if (beard) {
    const bm = smat(beard, { roughness: 0.6 });
    h.add(M(new THREE.SphereGeometry(R * 1.04, 32, 16, F - 1.25, 2.5, Math.PI * 0.6, Math.PI * 0.32), bm));
    for (const sx of [-1, 1]) { const m = M(new THREE.CapsuleGeometry(R * 0.05, R * 0.14, 3, 6), bm, sx * R * 0.1, -R * 0.24, R * 0.97); m.rotation.z = Math.PI / 2 + sx * 0.3; h.add(m); }
  }
  return h;
}

/**
 * Personagem estilo animação (boneca): pernas com botinhas, saia rodada, cintura, braços, cabeça delicada.
 * Opções: color, trim, fur, belt, sash, skin, eyes, hair{color,style}, veil, mantle, beard, hat,
 * s (escala), kneel, pray, long (veste até o chão), boots, tights, emissive, old, staff, lashes
 */
export function chibi(o = {}) {
  const { color = '#8b5a3c', trim = null, fur = null, belt = null, sash = null, skin = '#f6cfb0', mantle = null, s = 1,
    kneel = false, pray = false, long = false, boots = '#7a4a2b', tights = '#f4efe8', emissive = null, staff = false, collar = null } = o;
  const g = new THREE.Group();
  const em = emissive ? { emissive, emissiveIntensity: 0.22 } : {};
  const dressM = smat(color, em);
  const showLegs = !long && !kneel;
  const waistY = kneel ? 0.6 : 1.0;
  const hemY = long || kneel ? 0.0 : 0.47;
  const hemR = kneel ? 0.52 : long ? 0.38 : 0.44;
  // pernas e botinhas
  if (showLegs) for (const sx of [-1, 1]) {
    g.add(M(new THREE.CapsuleGeometry(0.058, 0.36, 4, 10), smat(tights), sx * 0.09, 0.36, 0));
    g.add(M(new THREE.CapsuleGeometry(0.075, 0.1, 4, 12), smat(boots, { roughness: 0.4 }), sx * 0.09, 0.1, 0.02));
    const toe = M(new THREE.SphereGeometry(0.075, 14, 10), smat(boots, { roughness: 0.4 }), sx * 0.09, 0.05, 0.08); toe.scale.set(1, 0.7, 1.3); g.add(toe);
    if (fur) { const c = M(new THREE.TorusGeometry(0.08, 0.035, 10, 20), smat(fur, { roughness: 0.95 }), sx * 0.09, 0.22, 0.01); c.rotation.x = Math.PI / 2; g.add(c); }
  } else if (!kneel) for (const sx of [-1, 1]) { const f = M(new THREE.SphereGeometry(0.075, 14, 10), smat(boots, { roughness: 0.4 }), sx * 0.1, 0.035, 0.14); f.scale.set(1, 0.6, 1.4); g.add(f); }
  // saia rodada com barra ondulada
  const prof = [[0, hemY], [hemR * 0.97, hemY], [hemR, hemY + 0.04], [hemR * 0.9, hemY + (waistY - hemY) * 0.25], [hemR * 0.62, hemY + (waistY - hemY) * 0.6], [0.2, waistY - 0.05], [0.16, waistY], [0, waistY + 0.01]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const skirt = new THREE.LatheGeometry(prof, 48);
  {
    const p = skirt.attributes.position, half = (waistY - hemY) * 0.5;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i), r = Math.hypot(x, z);
      if (r > 0.05 && y < hemY + half) { const th = Math.atan2(x, z), k = 1 + 0.045 * Math.sin(th * 11) * (1 - (y - hemY) / half); p.setX(i, x * k); p.setZ(i, z * k); }
    }
    skirt.computeVertexNormals();
  }
  g.add(new THREE.Mesh(skirt, dressM));
  const hemC = fur || trim;
  if (hemC) { const t = M(new THREE.TorusGeometry(hemR, fur ? 0.06 : 0.025, 12, 48), smat(hemC, fur ? { roughness: 0.95 } : { metalness: 0.4, roughness: 0.35 }), 0, hemY + 0.04, 0); t.rotation.x = Math.PI / 2; g.add(t); }
  // tronco
  const torso = M(new THREE.CapsuleGeometry(0.15, 0.2, 6, 16), dressM, 0, waistY + 0.2, 0); torso.scale.set(1.05, 1, 0.78); g.add(torso);
  const beltC = belt || sash;
  if (beltC) {
    const b = M(new THREE.TorusGeometry(0.165, 0.032, 10, 30), smat(beltC, { roughness: 0.4, metalness: belt ? 0.1 : 0.4 }), 0, waistY + 0.02, 0); b.rotation.x = Math.PI / 2; b.scale.set(1.02, 0.8, 1); g.add(b);
    if (belt) { const bk = M(new THREE.TorusGeometry(0.035, 0.012, 6, 4), smat('#e8bf55', { metalness: 0.7, roughness: 0.25 }), 0, waistY + 0.02, 0.135); bk.rotation.z = Math.PI / 4; g.add(bk); }
  }
  const colC = fur || collar || trim;
  if (colC) { const c = M(new THREE.TorusGeometry(0.1, fur ? 0.045 : 0.025, 10, 24), smat(colC, fur ? { roughness: 0.95 } : { metalness: 0.4, roughness: 0.35 }), 0, waistY + 0.37, 0.01); c.rotation.x = Math.PI / 2 - 0.15; g.add(c); }
  if (fur) g.add(M(new THREE.CapsuleGeometry(0.03, 0.22, 4, 8), smat(fur, { roughness: 0.95 }), 0, waistY + 0.2, 0.12));
  if (mantle) {
    const mp = [[0, 0.0], [0.42, 0.0], [0.45, 0.04], [0.42, 0.3], [0.32, waistY * 0.75], [0.22, waistY + 0.3], [0.13, waistY + 0.4]].map(([x, y]) => new THREE.Vector2(x + 0.02, y));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(mp, 36, 0.6, Math.PI * 2 - 1.2), smat(mantle, { side: THREE.DoubleSide })));
  }
  // braços
  const sleeve = smat(mantle || color, em);
  for (const sx of [-1, 1]) {
    const S = new THREE.Vector3(sx * 0.17, waistY + 0.32, 0);
    const Hp = pray ? new THREE.Vector3(sx * 0.03, waistY + 0.13, 0.2) : new THREE.Vector3(sx * 0.27, waistY - 0.1, 0.05);
    g.add(limb(S, Hp, 0.048, sleeve));
    if (fur) {
      const c = M(new THREE.TorusGeometry(0.055, 0.03, 8, 16), smat(fur, { roughness: 0.95 }));
      c.position.copy(S).lerp(Hp, 0.82); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), Hp.clone().sub(S).normalize()); g.add(c);
    }
    const hand = M(new THREE.SphereGeometry(0.048, 14, 10), smat(skin), Hp.x, Hp.y + (pray ? 0.03 : -0.03), Hp.z + (pray ? 0.02 : 0));
    hand.scale.set(pray ? 0.6 : 0.9, 1.3, 0.9); g.add(hand);
  }
  if (staff) {
    g.add(M(new THREE.CylinderGeometry(0.022, 0.028, 1.75, 8), smat('#7a5233'), 0.3, 0.87, 0.06));
    g.add(M(new THREE.TorusGeometry(0.09, 0.022, 6, 14, Math.PI * 1.3), smat('#7a5233'), 0.39, 1.74, 0.06));
  }
  g.add(M(new THREE.CylinderGeometry(0.045, 0.055, 0.12, 12), smat(skin), 0, waistY + 0.42, 0));
  const R = 0.25;
  const head = headParts(R, o); head.position.y = waistY + 0.42 + R * 0.92; g.add(head);
  g.userData.head = head; g.userData.headY = head.position.y; g.userData.backY = waistY + 0.28;
  compact(g);
  g.scale.setScalar(s);
  return g;
}

// Junta as peças de um modelo em uma malha por material (muito menos chamadas de desenho)
export function compact(g) {
  g.updateMatrixWorld(true);
  const inv = g.matrixWorld.clone().invert(), groups = new Map(), remove = [], m4 = new THREE.Matrix4();
  g.traverse(o => {
    if (!o.isMesh || o === g || Array.isArray(o.material) || o.material.transparent) return;
    let geo = o.geometry.clone(); if (geo.index) geo = geo.toNonIndexed();
    geo.applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld));
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    geo.morphAttributes = {}; geo.clearGroups();
    const k = o.material.uuid; if (!groups.has(k)) groups.set(k, { m: o.material, list: [] });
    groups.get(k).list.push(geo); remove.push(o);
  });
  for (const o of remove) o.parent.remove(o);
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
    color: '#9ccbee', trim: '#e8bf55', fur: null, collar: '#ffffff', belt: '#e8bf55', skin: '#f7d2b6', eyes: '#3f9a58', lashes: true, pray: true,
    hair: { color: '#c39448', style: 'long' }, boots: '#e8bf55', tights: '#ffffff',
  });
  g.add(halo(0.19, g.userData.headY + 0.36));
  const [L, R] = makeWings(1.0);
  const by = g.userData.backY;
  L.position.set(-0.05, by, -0.13); R.position.set(0.05, by, -0.13);
  L.rotation.x = R.rotation.x = 0.1; g.add(L, R);
  g.userData.wings = [L, R];
  if (glowFn) { const gl = glowFn('#ffe3a3', 2.6, 0.28); gl.position.y = 1.1; g.add(gl); }
  return g;
}

export function gabrielModel(glowFn, lilyFn) {
  const g = chibi({
    color: '#fffaf0', trim: '#f0c54e', belt: null, sash: '#f0c54e', skin: '#f6d0b3', eyes: '#4f9ad8', emissive: '#fff1c9', long: true,
    hair: { color: '#e9bb5c', style: 'long' }, boots: '#f0c54e', s: 1.3,
  });
  g.add(halo(0.2, g.userData.headY + 0.35));
  const [L, R] = makeWings(1.7, 0.35);
  const by = g.userData.backY;
  L.position.set(-0.05, by, -0.14); R.position.set(0.05, by, -0.14); g.add(L, R);
  g.userData.wings = [L, R];
  if (lilyFn) { const lily = lilyFn(false); lily.scale.setScalar(0.7); lily.position.set(0.3, 0.55, 0.1); g.add(lily); }
  if (glowFn) { const gl = glowFn('#fff0c0', 5.5, 0.5); gl.position.y = 1.2; g.add(gl); }
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
  for (const sx of [-1, 1]) head.add(eye(0.26, sx, '#6b3d1e', 0.068, true));
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
