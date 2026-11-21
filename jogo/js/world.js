// Mundo 3D estilo animação: terreno, céu, cabanas de madeira, pinheiros, itens.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as ART from './art.js';

export { setWings, reindeerModel, animateReindeer, animateChar } from './art.js';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export function rng(seed = 1) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------- Terreno ----------
// Cada capítulo pode mudar as colinas (hills: [x, z, altura, largura²]), o raio da parte plana e o anel de montanhas.
const TDEF = { hills: [[36, 18, 5.5, 150]], flat: 12, ring: 58, bumps: 1 };
let T = TDEF;
export function setTerrain(o = {}) { T = { ...TDEF, ...o }; }
export function terrainHeight(x, z) {
  const r = Math.hypot(x, z);
  let h = (0.8 * Math.sin(x * 0.07) * Math.cos(z * 0.06) + 0.4 * Math.sin(x * 0.19 + 1.3) * Math.sin(z * 0.15 + 0.4)) * T.bumps;
  h *= 0.25 + 0.75 * smooth(T.flat, T.flat + 18, r);
  for (const [hx, hz, hh, w] of T.hills) h += hh * Math.exp(-((x - hx) ** 2 + (z - hz) ** 2) / w);
  h += smooth(T.ring, T.ring + 34, r) * 11;
  return h;
}

// ---------- Materiais e texturas ----------
export const mat = ART.smat;
const RB = (w, h, d, r = 0.08, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));

let _glowTex;
export function glowTex() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.75)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0.2)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  _glowTex = new THREE.CanvasTexture(c); _glowTex.colorSpace = THREE.SRGBColorSpace;
  return _glowTex;
}
let _plank;
function plankTex() {
  if (_plank) return _plank;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const R = rng(9);
  for (let i = 0; i < 8; i++) {
    const y = i * 32, l = 205 + Math.floor(R() * 40);
    g.fillStyle = `rgb(${l},${l},${l})`; g.fillRect(0, y, 256, 32);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, y + 2, 256, 3);
    g.fillStyle = 'rgba(0,0,0,.08)'; for (let k = 0; k < 3; k++) g.fillRect(0, y + 10 + k * 7 + R() * 3, 256, 1);
    g.fillStyle = 'rgba(60,40,30,.55)'; g.fillRect(0, y + 28, 256, 4);
    const jx = R() * 256; g.fillRect(jx, y, 3, 30);
  }
  _plank = new THREE.CanvasTexture(c); _plank.colorSpace = THREE.SRGBColorSpace; _plank.anisotropy = 4;
  return _plank;
}
const plankMats = new Map();
function plankMat(color) {
  if (!plankMats.has(color)) plankMats.set(color, new THREE.MeshStandardMaterial({ color, map: plankTex(), roughness: 0.75, envMapIntensity: 0.4 }));
  return plankMats.get(color);
}

function canvasTex(draw, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
let _stone, _plaster, _candy;
const matCache = new Map();
const texMat = (key, color, texFn, o = {}) => { const k = key + color; if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, map: texFn(), roughness: 0.85, envMapIntensity: 0.4, ...o })); return matCache.get(k); };
function stoneTex() {
  return _stone || (_stone = canvasTex((g, S) => {
    const R = rng(21); g.fillStyle = '#8c8794'; g.fillRect(0, 0, S, S);
    const rows = 7, rh = S / rows;
    for (let r = 0; r < rows; r++) {
      let x = r % 2 ? -rh * 0.6 : 0;
      while (x < S) {
        const w = rh * (1.1 + R() * 0.9), l = 200 + Math.floor(R() * 45);
        g.fillStyle = `rgb(${l},${l - 4},${l - 2})`;
        g.beginPath(); g.roundRect(x + 3, r * rh + 3, w - 6, rh - 6, 9); g.fill();
        g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 8, r * rh + 6, w - 18, 4);
        x += w;
      }
    }
  }));
}
function plasterTex() {
  return _plaster || (_plaster = canvasTex((g, S) => {
    const R = rng(33); g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 900; i++) { const l = 225 + Math.floor(R() * 30); g.fillStyle = `rgba(${l},${l},${l},.5)`; g.fillRect(R() * S, R() * S, 2 + R() * 5, 2 + R() * 5); }
  }));
}
function candyTex() {
  return _candy || (_candy = canvasTex((g, S) => {
    g.fillStyle = '#fbf6ef'; g.fillRect(0, 0, S, S); g.fillStyle = '#d6303d';
    for (let i = -4; i < 8; i++) { g.beginPath(); g.moveTo(i * S / 4, 0); g.lineTo(i * S / 4 + S / 8, 0); g.lineTo(i * S / 4 + S / 8 + S, S); g.lineTo(i * S / 4 + S, S); g.fill(); }
  }));
}
const stoneMat = c => texMat('stone', c, stoneTex);
const plasterMat = c => texMat('plaster', c, plasterTex, { roughness: 0.9 });
const candyMat = () => texMat('candy', '#ffffff', candyTex, { roughness: 0.4 });

export function glow(color = '#ffd27a', size = 2, opacity = 0.8) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.scale.set(size, size, 1); return s;
}
export function decal(color = '#ffbf5e', size = 5, opacity = 0.45) {
  const g = new THREE.PlaneGeometry(size, size); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: glowTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.renderOrder = 1; return m;
}

function paint(g, color) {
  const c = new THREE.Color(color); const n = g.attributes.position.count; const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}
function paintY(g, low, high, y0, soft = 0) {
  const A = new THREE.Color(low), B = new THREE.Color(high), C = new THREE.Color(); const p = g.attributes.position; const a = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const k = soft ? smooth(y0 - soft, y0 + soft, p.getY(i)) : (p.getY(i) > y0 ? 1 : 0);
    C.copy(A).lerp(B, k); a[i * 3] = C.r; a[i * 3 + 1] = C.g; a[i * 3 + 2] = C.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}
const ni = g => (g.index ? g.toNonIndexed() : g);
const merge = parts => mergeGeometries(parts.map(ni));
const M = (geo, material, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); return m; };

// ---------- Geometrias de cenário ----------
function pineGeometry() {
  const parts = [];
  const t = new THREE.CylinderGeometry(0.18, 0.26, 1, 10); t.translate(0, 0.5, 0); parts.push(paint(t, '#6b4529'));
  const tiers = [[1.65, 1.5, 0.7], [1.3, 1.35, 1.55], [0.95, 1.2, 2.35], [0.6, 1.0, 3.05]];
  const dark = new THREE.Color('#1d6a3c'), lite = new THREE.Color('#47b05f'), C = new THREE.Color();
  tiers.forEach(([r, h, y], ti) => {
    const c = new THREE.ConeGeometry(r, h, 28, 3);
    const p = c.attributes.position; const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), yy = p.getY(i), z = p.getZ(i), rr = Math.hypot(x, z);
      const th = Math.atan2(x, z);
      if (rr > 1e-4) {
        const bottom = yy < -h / 2 + 1e-3;
        const k = bottom ? 1 : (yy < 0 ? 0.35 : 0);
        const sc = 1 + 0.12 * Math.sin(th * 9) * k;
        p.setX(i, x * sc); p.setZ(i, z * sc);
        if (bottom) p.setY(i, yy - 0.16 * (0.5 + 0.5 * Math.cos(th * 9)));
      }
      const lt = (yy + h / 2) / h * 0.6 + ti * 0.12;
      C.copy(dark).lerp(lite, clamp(lt, 0, 1));
      if (ti === 3 && yy > h * 0.2) C.lerp(new THREE.Color('#f1f6ff'), 0.85);
      col[i * 3] = C.r; col[i * 3 + 1] = C.g; col[i * 3 + 2] = C.b;
    }
    c.setAttribute('color', new THREE.BufferAttribute(col, 3));
    c.computeVertexNormals(); c.translate(0, y + h / 2, 0); parts.push(c);
  });
  return merge(parts);
}
function oliveGeometry() {
  const parts = [];
  const t = new THREE.CylinderGeometry(0.14, 0.26, 1.5, 8); t.translate(0, 0.75, 0); t.rotateZ(0.08); parts.push(paint(t, '#6b4a33'));
  for (const [x, y, z, r] of [[0, 1.9, 0, 0.95], [0.65, 1.6, 0.3, 0.68], [-0.55, 1.7, -0.25, 0.72], [0.1, 2.35, -0.3, 0.6]]) {
    const b = new THREE.IcosahedronGeometry(r, 2); b.translate(x, y, z); paintY(b, '#5f8f63', '#eef4ff', y + r * 0.55, 0.12); parts.push(b);
  }
  const g = merge(parts); g.computeVertexNormals(); return g;
}
function rockGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 2); g.scale(1, 0.6, 0.85);
  const p = g.attributes.position; const R = rng(4);
  for (let i = 0; i < p.count; i++) { const s = 0.9 + R() * 0.15; p.setXYZ(i, p.getX(i) * s, p.getY(i) * s, p.getZ(i) * s); }
  return paintY(g, '#7e86a3', '#f0f4ff', 0.25, 0.1);
}

// ---------- Itens e bichinhos ----------
function flowerHead(s = 1) {
  const f = new THREE.Group();
  const pm = mat('#ffffff', { emissive: '#fff6d8', emissiveIntensity: 0.45 });
  for (let i = 0; i < 6; i++) {
    const p = M(new THREE.SphereGeometry(0.1 * s, 12, 8), pm); p.geometry.scale(0.55, 1.8, 0.35); p.geometry.translate(0, 0.17 * s, 0);
    p.rotation.set(0.95, i / 6 * Math.PI * 2, 0, 'YXZ'); f.add(p);
  }
  f.add(M(new THREE.SphereGeometry(0.05 * s, 10, 8), mat('#ffcc33', { emissive: '#ffaa00', emissiveIntensity: 0.6 })));
  return f;
}
export function lilyModel(withGlow = true) {
  const g = new THREE.Group();
  g.add(M(new THREE.CylinderGeometry(0.03, 0.04, 0.8, 8), mat('#4f8a4a'), 0, 0.4, 0));
  for (const sx of [-1, 1]) { const l = M(new THREE.SphereGeometry(0.08, 10, 8), mat('#5d9a52')); l.geometry.scale(0.6, 2.6, 0.3); l.position.set(sx * 0.08, 0.25, 0); l.rotation.z = -sx * 0.6; g.add(l); }
  const f = flowerHead(1); f.position.y = 0.82; g.add(f);
  if (withGlow) { const gl = glow('#fff4cf', 2.6, 0.8); gl.position.y = 0.8; g.add(gl); g.userData.glow = gl; }
  return ART.compact(g);
}
export const person = o => ART.chibi(o);
export const angelModel = () => ART.angelModel(glow);
export const gabrielModel = () => ART.gabrielModel(glow, lilyModel);

export function doveModel() {
  const g = new THREE.Group();
  const w = mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 });
  const b = M(new THREE.SphereGeometry(0.22, 18, 14), w); b.scale.set(0.8, 0.7, 1.4); g.add(b);
  g.add(M(new THREE.SphereGeometry(0.12, 14, 10), w, 0, 0.12, 0.28));
  const beak = M(new THREE.ConeGeometry(0.03, 0.08, 8), mat('#f2a83a'), 0, 0.11, 0.42); beak.rotation.x = Math.PI / 2; g.add(beak);
  const [L, R] = ART.makeWings(0.5, 0.6);
  L.rotation.x = R.rotation.x = -Math.PI / 2;
  L.position.set(-0.05, 0.08, 0.1); R.position.set(0.05, 0.08, 0.1); g.add(L, R);
  g.userData.wings = [L, R];
  g.add(glow('#ffffff', 4, 0.9));
  return g;
}
export function sheepModel() {
  const g = new THREE.Group();
  const woolM = mat('#f6f2ea', { roughness: 0.95 });
  const body = new THREE.Group(); body.position.y = 0.62; g.add(body);
  for (const [x, y, z, r] of [[0, 0, 0, 0.38], [0.2, 0.08, 0.2, 0.25], [-0.2, 0.08, 0.2, 0.25], [0.2, 0.08, -0.22, 0.25], [-0.2, 0.08, -0.22, 0.25], [0, 0.2, 0, 0.27], [0, 0.05, 0.32, 0.24], [0, 0.05, -0.34, 0.24]]) body.add(M(new THREE.SphereGeometry(r, 16, 12), woolM, x, y, z));
  const head = M(new THREE.SphereGeometry(0.19, 18, 14), mat('#4a3f3a'), 0, 0.82, 0.55); head.scale.set(0.9, 1, 1.1); g.add(head);
  g.add(M(new THREE.SphereGeometry(0.13, 12, 10), woolM, 0, 0.98, 0.52));
  for (const sx of [-1, 1]) {
    g.add(M(new THREE.SphereGeometry(0.035, 10, 8), mat('#ffffff'), sx * 0.08, 0.86, 0.72));
    g.add(M(new THREE.SphereGeometry(0.02, 8, 6), mat('#111111'), sx * 0.08, 0.86, 0.75));
    const ear = M(new THREE.SphereGeometry(0.07, 10, 8), mat('#4a3f3a'), sx * 0.19, 0.85, 0.5); ear.scale.set(1.4, 0.5, 0.7); g.add(ear);
  }
  for (const [x, z] of [[-0.2, -0.25], [0.2, -0.25], [-0.2, 0.25], [0.2, 0.25]]) g.add(M(new THREE.CapsuleGeometry(0.05, 0.3, 4, 8), mat('#4a3f3a'), x, 0.2, z));
  return ART.compact(g);
}

// Céus: entardecer (capítulo 1), dia claro e noite estrelada
const SKIES = {
  dusk: { bg: '#2b3b78', fog: '#5a6eae', fogNear: 38, fogFar: 220, top: '#0b1745', mid: '#3f62b3', warm: '#f7ab6c', cool: '#86a0d8', sun: [-0.75, 0.12, -0.65], sunC: '#ff9e52',
    hemi: ['#c3d3ff', '#545a96', 1.5], sunL: ['#ffbf86', 2.3], fill: 0.9, stars: 0.9, starSize: 1.8, mount: '#4a5c99' },
  day: { bg: '#8fb6ea', fog: '#c4d6f2', fogNear: 45, fogFar: 240, top: '#2c68c9', mid: '#78aaea', warm: '#fff1d6', cool: '#cfe0f7', sun: [-0.45, 0.55, -0.55], sunC: '#fff2c4',
    hemi: ['#e8f0ff', '#7a86b0', 1.75], sunL: ['#fff0da', 2.7], fill: 0.8, stars: 0, starSize: 1.8, mount: '#6a7fb8' },
  night: { bg: '#0b1435', fog: '#1d2b5e', fogNear: 30, fogFar: 180, top: '#02061a', mid: '#0e1c4f', warm: '#33407e', cool: '#1f2c66', sun: [0.35, 0.3, -0.88], sunC: '#c9d6ff',
    hemi: ['#8ea3e6', '#232a5a', 0.85], sunL: ['#b4c4ff', 1.0], fill: 0.35, stars: 1, starSize: 2.2, mount: '#2c3a72' },
};

// ---------- Mundo ----------
export class World {
  constructor(scene) {
    this.scene = scene; this.static = new THREE.Group(); scene.add(this.static); this.boxes = []; this.circles = []; this.bulbs = []; this.icicles = []; this.anims = []; this.t = 0;
  }
  addBox(x, z, hw, hd, top) { this.boxes.push({ x, z, hw, hd, top }); }
  addCircle(x, z, r, top = 999) { this.circles.push({ x, z, r, top }); }
  groundAt(x, z, y) {
    let g = terrainHeight(x, z);
    for (const b of this.boxes) if (Math.abs(x - b.x) < b.hw && Math.abs(z - b.z) < b.hd && y >= b.top - 0.45) g = Math.max(g, b.top);
    for (const c of this.circles) if (c.top < 900 && Math.hypot(x - c.x, z - c.z) < c.r && y >= c.top - 0.45) g = Math.max(g, c.top);
    return g;
  }
  collide(p, r) {
    for (const b of this.boxes) {
      if (p.y >= b.top - 0.45) continue;
      const cx = clamp(p.x, b.x - b.hw, b.x + b.hw), cz = clamp(p.z, b.z - b.hd, b.z + b.hd);
      const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
        else {
          const px = b.hw - Math.abs(p.x - b.x), pz = b.hd - Math.abs(p.z - b.z);
          if (px < pz) p.x = b.x + Math.sign(p.x - b.x || 1) * (b.hw + r); else p.z = b.z + Math.sign(p.z - b.z || 1) * (b.hd + r);
        }
      }
    }
    for (const c of this.circles) {
      if (p.y >= c.top - 0.45) continue;
      const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + r;
      if (d < m && d > 1e-6) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; }
    }
  }

  buildEnvironment({ path = [], sky = 'dusk', snowfall = true } = {}) {
    const scene = this.scene;
    const P = SKIES[sky] || SKIES.dusk; this.skyName = sky;
    scene.background = new THREE.Color(P.bg);
    scene.fog = new THREE.Fog(P.fog, P.fogNear, P.fogFar);

    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(P.top) }, mid: { value: new THREE.Color(P.mid) },
        warm: { value: new THREE.Color(P.warm) }, cool: { value: new THREE.Color(P.cool) },
        sunDir: { value: new THREE.Vector3(...P.sun).normalize() }, sunC: { value: new THREE.Color(P.sunC) }
      },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 warm; uniform vec3 cool; uniform vec3 sunDir; uniform vec3 sunC; varying vec3 vP;
        void main(){
          float y = vP.y; float s = max(dot(vP, sunDir), 0.0);
          vec3 hor = mix(cool, warm, pow(s, 1.6));
          vec3 c = mix(hor, mid, smoothstep(0.0, 0.32, y));
          c = mix(c, top, smoothstep(0.3, 0.85, y));
          if (y < 0.0) c = hor * 0.75;
          c += sunC * pow(s, 18.0) * 0.55;
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(450, 32, 16), skyMat);
    this.sky.renderOrder = -10; scene.add(this.sky);

    const R = rng(7), sp = [];
    for (let i = 0; i < 700; i++) {
      const th = R() * Math.PI * 2, y = 0.18 + R() * 0.82, rr = Math.sqrt(1 - y * y);
      sp.push(Math.cos(th) * rr * 420, y * 420, Math.sin(th) * rr * 420);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    this.skyStars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#fff8e6', size: P.starSize, sizeAttenuation: false, fog: false, transparent: true, opacity: P.stars, depthWrite: false }));
    scene.add(this.skyStars);

    scene.add(new THREE.HemisphereLight(P.hemi[0], P.hemi[1], P.hemi[2]));
    const sun = new THREE.DirectionalLight(P.sunL[0], P.sunL[1]); sun.position.set(P.sun[0] * 100, Math.max(25, P.sun[1] * 100), P.sun[2] * 100); scene.add(sun);
    const fill = new THREE.DirectionalLight('#9fb4ff', P.fill); fill.position.set(60, 50, 70); scene.add(fill);

    const geo = new THREE.PlaneGeometry(280, 280, 160, 160); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position; const col = new Float32Array(pos.count * 3);
    const snow = new THREE.Color('#eef3ff'), dirt = new THREE.Color('#c9b69c'), tmp = new THREE.Color();
    const segDist = (x, z) => {
      let best = 1e9;
      for (let i = 0; i < path.length - 1; i++) {
        const [ax, az] = path[i], [bx, bz] = path[i + 1];
        const vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz), 0, 1);
        best = Math.min(best, Math.hypot(x - (ax + vx * t), z - (az + vz * t)));
      }
      return best;
    };
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, terrainHeight(x, z) + 0.12 * Math.sin(x * 0.9) * Math.sin(z * 0.8));
      const pd = Math.min(segDist(x, z), Math.hypot(x, z) - 6.5);
      const k = (1 - smooth(1.2, 3.4, pd)) * 0.7;
      tmp.copy(snow).lerp(dirt, k);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, envMapIntensity: 0.3 })));

    const mparts = []; const RM = rng(11);
    for (let i = 0; i < 34; i++) {
      const a = i / 34 * Math.PI * 2 + RM() * 0.1, d = 140 + RM() * 50, h = 30 + RM() * 45, r = 28 + RM() * 26;
      const c = new THREE.ConeGeometry(r, h, 10, 4); c.translate(Math.cos(a) * d, h / 2 - 2, Math.sin(a) * d);
      paintY(c, P.mount, '#e9effc', h * 0.45 - 2, h * 0.12); mparts.push(c);
    }
    scene.add(new THREE.Mesh(merge(mparts), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, envMapIntensity: 0.2 })));
    if (snowfall) this.buildSnow();
  }

  buildSnow(n = 1300) {
    const p = new Float32Array(n * 3); const R = rng(5);
    for (let i = 0; i < n; i++) { p[i * 3] = R() * 60 - 30; p[i * 3 + 1] = R() * 26 - 6; p[i * 3 + 2] = R() * 60 - 30; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    this.snow = new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex(), color: '#ffffff', size: 0.22, transparent: true, opacity: 0.95, depthWrite: false }));
    this.snow.frustumCulled = false; this.scene.add(this.snow);
  }

  instanced(geo, list, collide = 0) {
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, envMapIntensity: 0.4 }), list.length);
    const d = new THREE.Object3D();
    list.forEach((p, i) => {
      d.position.set(p.x, (p.y ?? terrainHeight(p.x, p.z)) - 0.12, p.z); d.rotation.set(0, p.ry || 0, 0); d.scale.setScalar(p.s || 1);
      d.updateMatrix(); m.setMatrixAt(i, d.matrix);
      if (collide && Math.hypot(p.x, p.z) < 76) this.addCircle(p.x, p.z, collide * (p.s || 1));
    });
    m.frustumCulled = false; this.scene.add(m); return m;
  }
  pines(list) { return this.instanced(pineGeometry(), list, 0.55); }
  olives(list) { return this.instanced(oliveGeometry(), list, 0.4); }
  rocks(list) { return this.instanced(rockGeometry(), list, 0); }

  _window(g, x, y, z, ry, glowColor, frame) {
    const w = new THREE.Group(); w.position.set(x, y, z); w.rotation.y = ry;
    w.add(M(RB(1.15, 1.25, 0.16, 0.06), mat(frame)));
    w.add(M(new THREE.BoxGeometry(0.88, 0.98, 0.1), mat('#ffd98a', { emissive: glowColor, emissiveIntensity: 1.9 }), 0, 0, 0.04));
    w.add(M(RB(0.07, 0.98, 0.14, 0.03), mat(frame), 0, 0, 0.06));
    w.add(M(RB(0.88, 0.07, 0.14, 0.03), mat(frame), 0, 0, 0.06));
    w.add(M(RB(1.35, 0.16, 0.42, 0.06), mat(frame), 0, -0.68, 0.16));
    w.add(M(RB(1.4, 0.16, 0.46, 0.08), mat('#f4f7ff', { roughness: 0.9 }), 0, -0.56, 0.17));
    const gl = glow(glowColor, 2.9, 0.4); gl.position.z = 0.45; gl.userData.batch = true; w.add(gl);
    g.add(w);
  }

  // Casas variadas: style 'cabin' (madeira), 'stone' (pedra), 'timber' (enxaimel colorido);
  // stories 1|2, tower (torrezinha redonda), porch (varanda com postes listrados)
  house({ x, z, w = 6, d = 5, h, rot = 0, wall = '#b07c47', trim = '#5b3a24', glowColor = '#ffb347', bulbs = true, chimney = true,
    style = 'cabin', stories = 1, tower = false, porch = false, roof = null }) {
    h = h ?? (stories === 2 ? 5.6 : 3.4);
    const g = new THREE.Group(); const y0 = terrainHeight(x, z);
    g.position.set(x, y0, z); g.rotation.y = rot;
    const snowM = mat('#f4f7ff', { roughness: 0.85, envMapIntensity: 0.6 });
    const trimM = mat(trim);
    const wallM = style === 'stone' ? stoneMat(wall) : style === 'timber' ? plasterMat(wall) : plankMat(wall);
    g.add(M(new THREE.BoxGeometry(w, h + 1.2, d), wallM, 0, (h - 1.2) / 2, 0));
    g.add(M(RB(w + 0.3, 0.7, d + 0.3, 0.15), mat('#8f93ad'), 0, -0.05, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(M(RB(0.3, h + 0.3, 0.3, 0.08), style === 'stone' ? mat('#8d8a9c') : trimM, sx * w / 2, h / 2 - 0.1, sz * d / 2));
    if (style === 'timber') {
      // vigas do enxaimel (escuras sobre o reboco claro)
      const ys = stories === 2 ? [h * 0.5, h - 0.1] : [h - 0.1];
      for (const fz of [d / 2 + 0.04, -d / 2 - 0.04]) {
        for (const yy of ys) g.add(M(RB(w, 0.2, 0.1, 0.03), trimM, 0, yy, fz));
        for (const sx of [-1, 1]) g.add(M(RB(0.16, h, 0.1, 0.03), trimM, sx * 0.85, h / 2 - 0.1, fz));
        g.add(M(RB(0.16, Math.min(3, w * 0.55) * 0.8, 0.1, 0.03), trimM, 0, h + Math.min(3, w * 0.55) * 0.4, fz));
      }
      for (const sx of [-1, 1]) for (const yy of ys) g.add(M(RB(0.1, 0.2, d, 0.03), trimM, sx * (w / 2 + 0.04), yy, 0));
    }
    // empena
    const ov = 0.55, rh = Math.min(3.0, w * (style === 'timber' ? 0.55 : 0.46)), run = w / 2 + ov;
    const tri = new THREE.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, rh * (w / 2) / run); tri.closePath();
    const tg = new THREE.ExtrudeGeometry(tri, { depth: d, bevelEnabled: false }); tg.translate(0, 0, -d / 2);
    const uv = tg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w, uv.getY(i) / (h + 1.2));
    g.add(M(tg, wallM, 0, h, 0));
    // telhado + neve fofa
    const roofM = mat(roof || trim);
    const ang = Math.atan2(rh, run), L = Math.hypot(run, rh);
    for (const s of [-1, 1]) {
      const ny = Math.cos(ang);
      const base = M(RB(L + 0.1, 0.22, d + ov * 2, 0.05), roofM, s * run / 2, h + rh / 2, 0); base.rotation.z = -s * ang; g.add(base);
      const sn = M(RB(L + 0.45, 0.5, d + ov * 2 + 0.35, 0.24, 4), snowM, s * run / 2 + s * Math.sin(ang) * 0.3, h + rh / 2 + ny * 0.3, 0);
      sn.rotation.z = -s * ang; g.add(sn);
      const R = rng(Math.floor(x * 7 + z * 13 + s * 5 + 99));
      for (let lz = -(d / 2 + ov); lz <= d / 2 + ov + 0.01; lz += 0.55) {
        const r = 0.16 + R() * 0.12;
        const b = M(new THREE.SphereGeometry(r, 14, 10), snowM, s * (run + 0.12), h - 0.05 - r * 0.4, lz); b.scale.y = 1.25; g.add(b);
      }
    }
    const ridge = M(new THREE.CapsuleGeometry(0.3, d + ov * 2 + 0.1, 6, 16), snowM, 0, h + rh + 0.15, 0); ridge.rotation.x = Math.PI / 2; g.add(ridge);
    for (const s of [-1, 1]) { const b = M(RB(L, 0.18, 0.16, 0.05), trimM, s * run / 2, h + rh / 2, d / 2 + ov + 0.02); b.rotation.z = -s * ang; g.add(b); }
    // janela redonda do sótão
    const ow = new THREE.Group(); ow.position.set(0, h + rh * 0.38, d / 2 + 0.03);
    const pane = M(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 24), mat('#ffd98a', { emissive: glowColor, emissiveIntensity: 1.9 })); pane.rotation.x = Math.PI / 2; ow.add(pane);
    ow.add(M(new THREE.TorusGeometry(0.44, 0.07, 10, 28), trimM, 0, 0, 0.05));
    ow.add(M(RB(0.06, 0.82, 0.08, 0.02), trimM, 0, 0, 0.06)); ow.add(M(RB(0.82, 0.06, 0.08, 0.02), trimM, 0, 0, 0.06));
    g.add(ow);
    if (chimney) {
      const cx = w * 0.24, cz = -d * 0.15, cy = h + rh * (1 - cx / run) + 0.4;
      g.add(M(RB(0.75, 1.7, 0.75, 0.1), mat(style === 'stone' ? '#7d7a8c' : '#a35a43'), cx, cy, cz));
      g.add(M(RB(0.95, 0.3, 0.95, 0.14), snowM, cx, cy + 0.9, cz));
      const smoke = glow('#c9d3ef', 1.6, 0.25); smoke.position.set(cx, cy + 1.6, cz); g.add(smoke);
      this.anims.push(t => { smoke.position.y = cy + 1.4 + (t * 0.4 % 1) * 1.2; smoke.material.opacity = 0.28 * (1 - (t * 0.4 % 1)); });
    }
    // porta, toldo, degraus, guirlanda
    g.add(M(RB(1.2, 2.0, 0.2, 0.07), mat(style === 'timber' ? '#5b3a24' : '#7a4a2b'), 0, 1.0, d / 2 + 0.05));
    for (const yy of [0.55, 1.05, 1.55]) g.add(M(RB(1.05, 0.05, 0.05, 0.02), trimM, 0, yy, d / 2 + 0.17));
    g.add(M(new THREE.SphereGeometry(0.06, 10, 8), mat('#f0c95b', { metalness: 0.6, roughness: 0.3 }), 0.4, 1.0, d / 2 + 0.19));
    if (!porch) {
      g.add(M(RB(1.8, 0.14, 0.8, 0.05), roofM, 0, 2.2, d / 2 + 0.38));
      g.add(M(RB(1.9, 0.22, 0.88, 0.1), snowM, 0, 2.36, d / 2 + 0.4));
    } else {
      const pw = w * 0.8, pd = 1.7;
      g.add(M(RB(pw, 0.16, pd, 0.05), roofM, 0, 2.55, d / 2 + pd / 2));
      g.add(M(RB(pw + 0.2, 0.32, pd + 0.2, 0.15), snowM, 0, 2.78, d / 2 + pd / 2 + 0.05));
      g.add(M(RB(pw, 0.2, pd, 0.05), mat('#9b6a42'), 0, 0.02, d / 2 + pd / 2));
      for (const sx of [-1, 1]) g.add(M(new THREE.CylinderGeometry(0.1, 0.1, 2.5, 14), candyMat(), sx * (pw / 2 - 0.15), 1.27, d / 2 + pd - 0.15));
      for (let i = 0; i <= 12; i++) { const t = i / 12; this._pendingBulbs = this._pendingBulbs || []; this._pendingBulbs.push([(t - 0.5) * pw, 2.42 - Math.sin(t * Math.PI) * 0.18, d / 2 + pd + 0.05]); }
    }
    for (let i = 0; i < 3; i++) g.add(M(RB(1.9 - i * 0.2, 0.22, 0.45, 0.05), mat('#9b6a42'), 0, -0.2 + i * 0.1, d / 2 + 0.35 + (2 - i) * 0.32));
    g.add(M(new THREE.TorusGeometry(0.27, 0.1, 10, 20), mat('#2e7a45'), 0, 1.62, d / 2 + 0.22));
    g.add(M(new THREE.SphereGeometry(0.08, 10, 8), mat('#d42f3a'), 0, 1.38, d / 2 + 0.27));
    // janelas (uma ou duas fileiras)
    const rows = stories === 2 ? [h * 0.27, h * 0.7] : [h * 0.52];
    for (const wy of rows) {
      for (const wx of [-w / 4 - 0.3, w / 4 + 0.3]) this._window(g, wx, wy, d / 2 + 0.02, 0, glowColor, trim);
      this._window(g, w / 2 + 0.02, wy, 0, Math.PI / 2, glowColor, trim);
      this._window(g, -w / 2 - 0.02, wy, 0, -Math.PI / 2, glowColor, trim);
    }
    if (stories === 2) this._window(g, 0, h * 0.7, d / 2 + 0.02, 0, glowColor, trim);
    // torrezinha
    if (tower) {
      const tx = w / 2 - 0.1, tz = d / 2 - 0.1, th = h + 1.6, tr = 1.15;
      g.add(M(new THREE.CylinderGeometry(tr, tr, th + 1.2, 28), wallM, tx, (th - 1.2) / 2, tz));
      g.add(M(new THREE.CylinderGeometry(tr + 0.12, tr + 0.12, 0.2, 28), trimM, tx, th, tz));
      const cone = M(new THREE.ConeGeometry(tr + 0.35, 2.6, 28), roofM, tx, th + 1.3, tz); g.add(cone);
      const sc = M(new THREE.ConeGeometry(tr + 0.45, 2.0, 28, 1, true), snowM, tx, th + 1.55, tz); g.add(sc);
      g.add(M(new THREE.SphereGeometry(0.2, 14, 10), snowM, tx, th + 2.65, tz));
      const tw = new THREE.Group(); tw.position.set(tx + Math.sin(0.6) * (tr + 0.01), th - 1.0, tz + Math.cos(0.6) * (tr + 0.01)); tw.rotation.y = 0.6;
      tw.add(M(RB(0.7, 1.0, 0.12, 0.05), trimM)); tw.add(M(new THREE.BoxGeometry(0.52, 0.8, 0.1), mat('#ffd98a', { emissive: glowColor, emissiveIntensity: 1.9 }), 0, 0, 0.03));
      g.add(tw);
    }
    const dc = decal('#ffb64d', 7, 0.38); dc.position.set(0, 0.06, d / 2 + 2); g.add(dc);
    this.static.add(g);
    g.updateMatrixWorld(true);
    const toW = (lx, ly, lz) => V(lx, ly, lz).applyMatrix4(g.matrixWorld);
    if (bulbs) {
      const cols = ['#ffd36b', '#ffd36b', '#ffd36b', '#ff5a5a', '#ffd36b', '#ffd36b', '#6dff9a'];
      const zf = d / 2 + ov + 0.14; let k = 0;
      for (let i = 0; i <= 18; i++) {
        const t = i / 18; const lx = -run + t * run * 2; const ly = h + rh * (1 - Math.abs(lx) / run) - 0.05;
        this.bulbs.push({ p: toW(lx, ly, zf), c: cols[k++ % cols.length] });
      }
    }
    if (this._pendingBulbs) { let k = 0; for (const [a, b, c] of this._pendingBulbs) this.bulbs.push({ p: toW(a, b, c), c: ['#ffd36b', '#ff5a5a', '#6dff9a', '#5cb8ff'][k++ % 4] }); this._pendingBulbs = null; }
    for (const s of [-1, 1]) for (let lz = -(d / 2 + ov) + 0.3; lz < d / 2 + ov; lz += 0.5) this.icicles.push({ p: toW(s * (run + 0.12), h - 0.2, lz), len: 0.2 + Math.random() * 0.4 });
    const swap = Math.abs(Math.sin(rot)) > 0.5;
    const hw = (swap ? d : w) / 2 + 0.1, hd = (swap ? w : d) / 2 + 0.1;
    const top = y0 + h + rh * 0.55;
    this.addBox(x, z, hw, hd, top);
    if (tower) { const tp = toW(w / 2 - 0.1, 0, d / 2 - 0.1); this.addCircle(tp.x, tp.z, 1.2, y0 + h + 1.6); }
    g.userData = { roofTop: y0 + h + rh + 0.3, top, y0, front: toW(0, 0, d / 2 + 1.6), frontL: toW(-w / 2 + 0.6, 0, d / 2 + 0.9), frontR: toW(w / 2 - 0.6, 0, d / 2 + 0.9) };
    return g;
  }

  well(x, z) {
    const g = new THREE.Group(); const y0 = terrainHeight(x, z); g.position.set(x, y0, z);
    const stone = mat('#9a9fb8', { roughness: 0.8 });
    g.add(M(new THREE.CylinderGeometry(1.3, 1.45, 1.0, 24), stone, 0, 0.45, 0));
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; g.add(M(RB(0.5, 0.3, 0.3, 0.1), stone, Math.cos(a) * 1.42, 0.3 + (i % 2) * 0.35, Math.sin(a) * 1.42)).children; }
    const rim = M(new THREE.TorusGeometry(1.32, 0.16, 12, 32), mat('#f4f7ff', { roughness: 0.9 }), 0, 1.0, 0); rim.rotation.x = Math.PI / 2; g.add(rim);
    g.add(M(new THREE.CylinderGeometry(1.1, 1.1, 0.05, 24), mat('#24386f', { emissive: '#2a4687', emissiveIntensity: 0.4, roughness: 0.1 }), 0, 0.9, 0));
    for (const sx of [-1, 1]) g.add(M(RB(0.2, 2.3, 0.2, 0.05), mat('#6b4529'), sx * 1.15, 1.6, 0));
    const axle = M(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 10), mat('#6b4529'), 0, 2.45, 0); axle.rotation.z = Math.PI / 2; g.add(axle);
    const rf = M(new THREE.ConeGeometry(1.9, 1.0, 4), mat('#6b4529'), 0, 3.1, 0); rf.rotation.y = Math.PI / 4; g.add(rf);
    const sn = M(new THREE.SphereGeometry(1.45, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.4), mat('#f4f7ff', { roughness: 0.9 }), 0, 2.7, 0); sn.scale.y = 0.7; g.add(sn);
    g.add(M(new THREE.CylinderGeometry(0.18, 0.14, 0.3, 12), mat('#8a5a3b'), 0.35, 1.9, 0));
    this.static.add(g);
    this.addCircle(x, z, 1.5, y0 + 1.12);
    return g;
  }

  lamp(x, z) {
    const g = new THREE.Group(); const y0 = terrainHeight(x, z); g.position.set(x, y0, z);
    const iron = mat('#2f2a3c', { metalness: 0.4, roughness: 0.4 });
    g.add(M(new THREE.CylinderGeometry(0.07, 0.12, 2.6, 10), iron, 0, 1.3, 0));
    g.add(M(RB(0.5, 0.1, 0.5, 0.04), iron, 0, 2.55, 0));
    const inner = new THREE.Mesh(RB(0.34, 0.44, 0.34, 0.06), new THREE.MeshStandardMaterial({ color: '#5c6680', emissive: '#000000', roughness: 0.3 }));
    inner.position.y = 2.82; g.add(inner);
    const cap = M(new THREE.ConeGeometry(0.36, 0.3, 4), iron, 0, 3.17, 0); cap.rotation.y = Math.PI / 4; g.add(cap);
    const cs = M(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#f4f7ff'), 0, 3.22, 0); cs.scale.y = 0.6; g.add(cs);
    const gl = glow('#9fc4ff', 1.4, 0.5); gl.position.y = 2.82; g.add(gl);
    const dc = decal('#ffb64d', 7, 0.5); dc.position.y = 0.06; dc.visible = false; g.add(dc);
    this.scene.add(g); this.addCircle(x, z, 0.25);
    const obj = {
      group: g, lit: false, pos: V(x, y0, z),
      light() {
        obj.lit = true;
        inner.material.color.set('#ffe6a8'); inner.material.emissive.set('#ffb84d'); inner.material.emissiveIntensity = 2.2;
        gl.material.color.set('#ffc46b'); gl.scale.set(5, 5, 1); gl.material.opacity = 0.85; dc.visible = true;
      }
    };
    this.anims.push(t => { if (!obj.lit) gl.material.opacity = 0.3 + 0.25 * Math.sin(t * 3 + x); });
    return obj;
  }

  fenceRing(cx, cz, r, gapAngle = 0, gap = 0.6) {
    const parts = []; const n = Math.round(r * 2.2); let prev = null;
    for (let i = 0; i <= n; i++) {
      const a = i / n * Math.PI * 2;
      const da = Math.abs(((a - gapAngle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI);
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, y = terrainHeight(x, z);
      if (da < gap) { prev = null; continue; }
      const post = new THREE.CylinderGeometry(0.09, 0.1, 1.1, 8); post.translate(x, y + 0.45, z); parts.push(paint(post, '#7a5233'));
      const sn = new THREE.SphereGeometry(0.13, 10, 8); sn.scale(1, 0.6, 1); sn.translate(x, y + 1.02, z); parts.push(paint(sn, '#f4f7ff'));
      if (prev) for (const hy of [0.4, 0.8]) {
        const len = Math.hypot(x - prev.x, z - prev.z);
        const rail = new THREE.CylinderGeometry(0.045, 0.045, len, 8); rail.rotateZ(Math.PI / 2);
        rail.rotateY(-Math.atan2(z - prev.z, x - prev.x));
        rail.translate((x + prev.x) / 2, (y + prev.y) / 2 + hy, (z + prev.z) / 2); parts.push(paint(rail, '#8a6040'));
      }
      prev = { x, y, z };
    }
    this.scene.add(new THREE.Mesh(merge(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 })));
  }

  logs(x, z, rot = 0) {
    const g = new THREE.Group(); g.position.set(x, terrainHeight(x, z), z); g.rotation.y = rot;
    const lm = mat('#8a5a3b');
    for (const [px, py] of [[-0.4, 0.22], [0, 0.22], [0.4, 0.22], [-0.2, 0.58], [0.2, 0.58]]) {
      const l = M(new THREE.CylinderGeometry(0.2, 0.2, 2.2, 14), lm, px, py, 0); l.rotation.x = Math.PI / 2; g.add(l);
      for (const e of [-1.1, 1.1]) { const c = M(new THREE.CircleGeometry(0.17, 14), mat('#e2b98a'), px, py, e + Math.sign(e) * 0.01); if (e < 0) c.rotation.y = Math.PI; g.add(c); }
    }
    g.add(M(RB(1.1, 0.16, 2.3, 0.08), mat('#f4f7ff'), 0, 0.82, 0));
    g.add(M(RB(1.4, 0.7, 0.9, 0.06), plankMat('#a87442'), 1.4, 0.35, 0.3));
    this.static.add(g); this.addBox(x, z, 0.8, 1.2, terrainHeight(x, z) + 0.85);
  }

  collectStars(list) {
    const m = new THREE.InstancedMesh(ART.puffyStarGeometry(), new THREE.MeshStandardMaterial({ color: '#ffcc2e', emissive: '#d99400', emissiveIntensity: 0.55, metalness: 0.35, roughness: 0.22, envMapIntensity: 1.4 }), list.length);
    m.frustumCulled = false;
    const gp = new Float32Array(list.length * 3); list.forEach((p, i) => gp.set([p.x, p.y, p.z], i * 3));
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(gp, 3));
    const halo = new THREE.Points(gg, new THREE.PointsMaterial({ map: glowTex(), color: '#ffd77a', size: 1.7, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.frustumCulled = false;
    this.scene.add(m, halo);
    const taken = list.map(() => false); const d = new THREE.Object3D();
    const sys = {
      total: list.length, count: 0,
      update(t, pp, onGet) {
        list.forEach((p, i) => {
          d.scale.setScalar(taken[i] ? 0 : 1);
          if (!taken[i] && (pp.x - p.x) ** 2 + (pp.y - p.y) ** 2 + (pp.z - p.z) ** 2 < 1.6 * 1.6) {
            taken[i] = true; sys.count++; gp[i * 3 + 1] = -999; gg.attributes.position.needsUpdate = true; onGet && onGet(p); d.scale.setScalar(0);
          }
          d.position.set(p.x, p.y + Math.sin(t * 2 + i) * 0.15, p.z); d.rotation.set(0, t * 2.2 + i, 0); d.updateMatrix(); m.setMatrixAt(i, d.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
      }
    };
    return sys;
  }

  // ---------- Enfeites e objetos do cenário ----------
  _at(x, z, rot = 0) { const g = new THREE.Group(); g.position.set(x, terrainHeight(x, z), z); g.rotation.y = rot; this.static.add(g); return g; }

  xmasTree(x, z, s = 1) {
    const g = this._at(x, z); g.scale.setScalar(s);
    const snowM = mat('#f4f7ff', { roughness: 0.85 });
    g.add(M(new THREE.CylinderGeometry(0.28, 0.38, 1.2, 12), mat('#6b4529'), 0, 0.5, 0));
    const tiers = [[2.5, 2.2, 0.9], [2.05, 2.0, 2.1], [1.6, 1.8, 3.2], [1.15, 1.6, 4.2], [0.7, 1.3, 5.1]];
    const greens = ['#2c6e43', '#2f7a49', '#33834e', '#378c53', '#3c9558'];
    const R = rng(Math.floor(x * 31 + z * 17));
    const orn = ['#d6303d', '#f0c24a', '#d6303d', '#4a8fe0', '#f0c24a', '#e8e8f0'];
    tiers.forEach(([r, hh, y], i) => {
      g.add(M(new THREE.ConeGeometry(r, hh, 18), mat(greens[i], { roughness: 0.75 }), 0, y + hh / 2, 0));
      const cap = M(new THREE.ConeGeometry(r * 0.42, hh * 0.38, 18), snowM, 0, y + hh - hh * 0.19 + 0.02, 0); g.add(cap);
      const n = Math.round(r * 5);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + R() * 0.4, f = 0.12 + R() * 0.25, rr = r * (1 - f) + 0.08;
        g.add(M(new THREE.SphereGeometry(0.15 + R() * 0.05, 12, 10), mat(orn[(k + i) % orn.length], { metalness: 0.5, roughness: 0.25, envMapIntensity: 1.2 }), Math.cos(a) * rr, y + f * hh, Math.sin(a) * rr));
      }
    });
    const st = M(ART.puffyStarGeometry(), mat('#ffcc2e', { emissive: '#e0a000', emissiveIntensity: 0.9, metalness: 0.35, roughness: 0.25 }), 0, 6.75, 0);
    st.scale.setScalar(1.3); g.add(st);
    const gl = glow('#ffd77a', 4.5, 0.7); gl.position.y = 6.75; g.add(gl);
    const dc = decal('#ffcf7a', 9, 0.4); dc.position.y = 0.06; g.add(dc);
    g.updateMatrixWorld(true);
    const cols = ['#ffd36b', '#ffd36b', '#ff5a5a', '#6dff9a', '#5cb8ff'];
    for (let i = 0; i < 70; i++) {
      const t = i / 70, y = 1.1 + t * 4.6, rr = 2.45 * (1 - t * 0.86), a = t * Math.PI * 2 * 4.5;
      this.bulbs.push({ p: V(Math.cos(a) * (rr + 0.05), y, Math.sin(a) * (rr + 0.05)).applyMatrix4(g.matrixWorld), c: cols[i % cols.length] });
    }
    this.gifts(x + 1.6 * s, z + 1.9 * s, 3, 1); this.gifts(x - 1.9 * s, z + 1.2 * s, 2, 2); this.gifts(x + 0.3 * s, z - 2.2 * s, 2, 3);
    this.addCircle(x, z, 2.3 * s);
    return g;
  }

  gifts(x, z, n = 3, seed = 1) {
    const g = this._at(x, z); const R = rng(seed * 97 + Math.floor(x * 3));
    const pal = [['#d6303d', '#f0c24a'], ['#2e7d3c', '#f4f0e6'], ['#3b6fd0', '#f0c24a'], ['#f4f0e6', '#d6303d'], ['#8a4bc9', '#f4f0e6']];
    for (let i = 0; i < n; i++) {
      const [c, rb] = pal[Math.floor(R() * pal.length)];
      const w = 0.45 + R() * 0.35, hh = 0.35 + R() * 0.35, px = (R() - 0.5) * 0.9, pz = (R() - 0.5) * 0.9, ry = R() * 1.5;
      const b = new THREE.Group(); b.position.set(px, 0, pz); b.rotation.y = ry; g.add(b);
      b.add(M(RB(w, hh, w, 0.04), mat(c), 0, hh / 2, 0));
      b.add(M(RB(w + 0.02, hh + 0.02, 0.09, 0.02), mat(rb), 0, hh / 2, 0));
      b.add(M(RB(0.09, hh + 0.02, w + 0.02, 0.02), mat(rb), 0, hh / 2, 0));
      for (const sx of [-1, 1]) { const bw = M(new THREE.TorusGeometry(0.08, 0.035, 8, 14), mat(rb), sx * 0.07, hh + 0.06, 0); bw.rotation.y = Math.PI / 2; bw.rotation.x = sx * 0.5; b.add(bw); }
      if (i === 0 && n > 2) {
        const top = new THREE.Group(); top.position.set(px + 0.05, hh, pz); top.rotation.y = ry + 0.7; g.add(top);
        top.add(M(RB(w * 0.6, 0.3, w * 0.6, 0.04), mat(pal[(i + 2) % pal.length][0]), 0, 0.15, 0));
        top.add(M(RB(w * 0.62, 0.32, 0.07, 0.02), mat('#f0c24a'), 0, 0.15, 0));
      }
    }
    return g;
  }

  stall(x, z, rot = 0, color = '#d6303d', goods = 'fruit') {
    const g = this._at(x, z, rot);
    const wood = plankMat('#a87442'), dark = mat('#6b4529'), snowM = mat('#f4f7ff', { roughness: 0.9 });
    g.add(M(RB(3.0, 1.0, 1.2, 0.06), wood, 0, 0.5, 0));
    g.add(M(RB(3.2, 0.12, 1.4, 0.05), dark, 0, 1.05, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(M(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 8), dark, sx * 1.45, 1.3, sz * 0.62));
    // toldo listrado
    const n = 7, sw = 3.5 / n;
    for (let i = 0; i < n; i++) {
      const sl = M(RB(sw, 0.1, 1.9, 0.03), mat(i % 2 ? '#f6f1e6' : color), -1.75 + sw / 2 + i * sw, 2.65, 0.15); sl.rotation.x = 0.22; g.add(sl);
      const fl = M(new THREE.CylinderGeometry(sw / 2, sw / 2, 0.08, 12, 1, false, 0, Math.PI), mat(i % 2 ? '#f6f1e6' : color), -1.75 + sw / 2 + i * sw, 2.38, 1.08);
      fl.rotation.z = Math.PI / 2; fl.rotation.y = Math.PI / 2; g.add(fl);
    }
    const sn = M(RB(3.6, 0.22, 1.9, 0.1), snowM, 0, 2.8, 0.12); sn.rotation.x = 0.22; g.add(sn);
    // mercadorias
    const R = rng(Math.floor(x * 11 + z * 5));
    for (const cx of [-0.9, 0, 0.9]) {
      g.add(M(RB(0.75, 0.25, 0.6, 0.03), plankMat('#c08a55'), cx, 1.24, 0.15));
      const c = goods === 'fruit' ? (cx < 0 ? '#e8742a' : cx > 0 ? '#c9302c' : '#9bc23c') : goods === 'bread' ? '#d39a52' : '#c94a6a';
      for (let k = 0; k < 7; k++) g.add(M(new THREE.SphereGeometry(goods === 'bread' ? 0.16 : 0.11, 10, 8), mat(c, { roughness: 0.5 }), cx + (R() - 0.5) * 0.5, 1.42 + R() * 0.06, 0.15 + (R() - 0.5) * 0.36));
    }
    g.add(M(RB(0.7, 0.55, 0.7, 0.04), plankMat('#b07c47'), 1.9, 0.27, 0.5));
    g.add(M(RB(0.74, 0.12, 0.74, 0.05), snowM, 1.9, 0.6, 0.5));
    g.updateMatrixWorld(true);
    for (let i = 0; i <= 8; i++) { const t = i / 8; this.bulbs.push({ p: V(-1.6 + t * 3.2, 2.25 - Math.sin(t * Math.PI) * 0.15, 1.2).applyMatrix4(g.matrixWorld), c: i % 2 ? '#ffd36b' : '#ff7a5a' }); }
    const swap = Math.abs(Math.sin(rot)) > 0.5;
    this.addBox(x, z, swap ? 0.75 : 1.6, swap ? 1.6 : 0.75, terrainHeight(x, z) + 1.1);
    return g;
  }

  snowman(x, z, rot = 0, scarf = '#d6303d') {
    const g = this._at(x, z, rot); const snowM = mat('#f6f9ff', { roughness: 0.8 });
    g.add(M(new THREE.SphereGeometry(0.62, 20, 14), snowM, 0, 0.5, 0));
    g.add(M(new THREE.SphereGeometry(0.46, 20, 14), snowM, 0, 1.28, 0));
    g.add(M(new THREE.SphereGeometry(0.34, 20, 14), snowM, 0, 1.86, 0));
    const coal = mat('#26222e', { roughness: 0.4 });
    for (const sx of [-1, 1]) g.add(M(new THREE.SphereGeometry(0.05, 8, 6), coal, sx * 0.12, 1.94, 0.3));
    for (let i = 0; i < 5; i++) { const a = -0.6 + i * 0.3; g.add(M(new THREE.SphereGeometry(0.03, 6, 5), coal, Math.sin(a) * 0.2, 1.78 - Math.cos(a) * 0.05 + 0.05, 0.31)); }
    for (const y of [1.15, 1.35, 1.55]) g.add(M(new THREE.SphereGeometry(0.05, 8, 6), coal, 0, y - 0.05, 0.45 - Math.abs(y - 1.3) * 0.3));
    const nose = M(new THREE.ConeGeometry(0.06, 0.32, 10), mat('#f08a2a'), 0, 1.86, 0.45); nose.rotation.x = Math.PI / 2; g.add(nose);
    const sc = M(new THREE.TorusGeometry(0.3, 0.09, 10, 20), mat(scarf), 0, 1.6, 0); sc.rotation.x = Math.PI / 2; g.add(sc);
    const tail = M(RB(0.16, 0.45, 0.08, 0.03), mat(scarf), 0.18, 1.4, 0.3); tail.rotation.z = 0.2; g.add(tail);
    g.add(M(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 18), coal, 0, 2.14, 0));
    g.add(M(new THREE.CylinderGeometry(0.2, 0.21, 0.36, 18), coal, 0, 2.33, 0));
    g.add(M(new THREE.CylinderGeometry(0.212, 0.212, 0.07, 18), mat(scarf), 0, 2.2, 0));
    for (const sx of [-1, 1]) {
      const arm = M(new THREE.CylinderGeometry(0.03, 0.04, 0.9, 6), mat('#6b4529'), sx * 0.75, 1.45, 0); arm.rotation.z = sx * -1.0; g.add(arm);
    }
    this.addCircle(x, z, 0.65);
    return g;
  }

  barrel(x, z, snow = true) {
    const g = this._at(x, z, x * 3);
    const prof = [[0.36, 0], [0.42, 0.25], [0.45, 0.5], [0.42, 0.75], [0.36, 1.0]].map(([a, b]) => new THREE.Vector2(a, b));
    g.add(M(new THREE.LatheGeometry(prof, 18), plankMat('#9a6538')));
    g.add(M(new THREE.CircleGeometry(0.36, 18).rotateX(-Math.PI / 2), mat('#7a4a2b'), 0, 0.99, 0));
    for (const y of [0.15, 0.5, 0.85]) { const t = M(new THREE.TorusGeometry(y === 0.5 ? 0.455 : 0.405, 0.025, 6, 22), mat('#3c3640', { metalness: 0.4 }), 0, y, 0); t.rotation.x = Math.PI / 2; g.add(t); }
    if (snow) { const s = M(new THREE.SphereGeometry(0.34, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#f4f7ff'), 0, 0.98, 0); s.scale.y = 0.35; g.add(s); }
    this.addCircle(x, z, 0.45, terrainHeight(x, z) + 1.05);
    return g;
  }

  crate(x, z, s = 1, rot = 0) {
    const g = this._at(x, z, rot); g.scale.setScalar(s);
    g.add(M(RB(0.9, 0.8, 0.9, 0.03), plankMat('#b98a55'), 0, 0.4, 0));
    const tm = mat('#7a5233');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(M(RB(0.1, 0.82, 0.1, 0.02), tm, sx * 0.43, 0.4, sz * 0.43));
    for (const sz of [-1, 1]) { const b = M(RB(1.1, 0.1, 0.06, 0.02), tm, 0, 0.4, sz * 0.46); b.rotation.z = 0.72; g.add(b); }
    g.add(M(RB(0.92, 0.12, 0.92, 0.06), mat('#f4f7ff'), 0, 0.84, 0));
    this.addCircle(x, z, 0.55 * s, terrainHeight(x, z) + 0.88 * s);
    return g;
  }

  bench(x, z, rot = 0) {
    const g = this._at(x, z, rot); const wood = mat('#8a5a3b'), iron = mat('#2f2a3c', { metalness: 0.4, roughness: 0.4 });
    for (const k of [-0.15, 0.05, 0.25]) g.add(M(RB(2.0, 0.07, 0.18, 0.02), wood, 0, 0.55, k));
    for (const y of [0.85, 1.05]) g.add(M(RB(2.0, 0.14, 0.06, 0.02), wood, 0, y, -0.28));
    for (const sx of [-0.85, 0.85]) { g.add(M(RB(0.07, 0.55, 0.5, 0.02), iron, sx, 0.28, 0)); g.add(M(RB(0.07, 0.65, 0.07, 0.02), iron, sx, 0.88, -0.3)); }
    g.add(M(RB(1.9, 0.08, 0.5, 0.04), mat('#f4f7ff'), 0, 0.62, 0.05));
    const swap = Math.abs(Math.sin(rot)) > 0.5;
    this.addBox(x, z, swap ? 0.3 : 1.0, swap ? 1.0 : 0.3, terrainHeight(x, z) + 0.6);
    return g;
  }

  lightString(ax, az, bx, bz, h = 4.0) {
    const iron = mat('#3a2f2a');
    const ya = terrainHeight(ax, az), yb = terrainHeight(bx, bz);
    for (const [x, z, y] of [[ax, az, ya], [bx, bz, yb]]) {
      const g = this._at(x, z);
      g.add(M(new THREE.CylinderGeometry(0.08, 0.11, h, 10), iron, 0, h / 2, 0));
      g.add(M(new THREE.SphereGeometry(0.14, 10, 8), mat('#f4f7ff'), 0, h + 0.08, 0));
      const wr = M(new THREE.TorusGeometry(0.28, 0.09, 8, 16), mat('#2e7a45'), 0, h - 0.6, 0.0); wr.rotation.y = Math.atan2(bx - ax, bz - az) + Math.PI / 2; g.add(wr);
      this.addCircle(x, z, 0.2);
    }
    const n = Math.max(10, Math.round(Math.hypot(bx - ax, bz - az) * 2.2));
    const cols = ['#ffd36b', '#ff5a5a', '#6dff9a', '#5cb8ff', '#ffd36b'];
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(V(ax + (bx - ax) * t, ya + (yb - ya) * t + h - 0.15 - Math.sin(t * Math.PI) * 0.9, az + (bz - az) * t));
      if (i > 0 && i < n) this.bulbs.push({ p: pts[i].clone().add(V(0, -0.1, 0)), c: cols[i % cols.length] });
    }
    const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.02, 4), mat('#2a3a2a'));
    this.static.add(wire);
  }

  cart(x, z, rot = 0) {
    const g = this._at(x, z, rot); const wood = plankMat('#a0703f'), dark = mat('#5a3a24');
    g.add(M(RB(2.4, 0.15, 1.4, 0.04), wood, 0, 0.75, 0));
    for (const sz of [-1, 1]) g.add(M(RB(2.4, 0.5, 0.1, 0.03), wood, 0, 1.05, sz * 0.66));
    for (const sx of [-1, 1]) g.add(M(RB(0.1, 0.5, 1.4, 0.03), wood, sx * 1.16, 1.05, 0));
    for (const sz of [-1, 1]) {
      const wh = M(new THREE.TorusGeometry(0.5, 0.06, 8, 22), dark, 0.2, 0.52, sz * 0.82); g.add(wh);
      for (let k = 0; k < 4; k++) { const sp = M(RB(0.9, 0.05, 0.05, 0.01), dark, 0.2, 0.52, sz * 0.82); sp.rotation.z = k * Math.PI / 4; g.add(sp); }
      g.add(M(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 10).rotateX(Math.PI / 2), dark, 0.2, 0.52, sz * 0.86));
      const hd = M(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), dark, -1.9, 0.75, sz * 0.4); hd.rotation.z = Math.PI / 2 - 0.2; g.add(hd);
    }
    g.add(M(RB(2.0, 0.35, 1.1, 0.15), mat('#d9b25a', { roughness: 0.95 }), 0, 1.05, 0));
    for (const [px, pz] of [[-0.5, 0.1], [0.4, -0.2]]) { const sk = M(new THREE.SphereGeometry(0.32, 12, 10), mat('#c9b48a'), px, 1.35, pz); sk.scale.y = 0.8; g.add(sk); }
    const swap = Math.abs(Math.sin(rot)) > 0.5;
    this.addBox(x, z, swap ? 0.8 : 1.3, swap ? 1.3 : 0.8, terrainHeight(x, z) + 1.3);
    return g;
  }

  holly(x, z, s = 1) {
    const g = this._at(x, z, x); g.scale.setScalar(s); const R = rng(Math.floor(x * 13 + z * 7));
    const lf = mat('#24603a', { roughness: 0.6 }), berry = mat('#d42f3a', { roughness: 0.3 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const b = M(new THREE.SphereGeometry(0.42 + R() * 0.15, 12, 10), lf, Math.cos(a) * 0.35, 0.35 + R() * 0.15, Math.sin(a) * 0.35); g.add(b); }
    g.add(M(new THREE.SphereGeometry(0.5, 12, 10), lf, 0, 0.6, 0));
    for (let i = 0; i < 10; i++) { const a = R() * 6.28, e = 0.3 + R() * 0.8; g.add(M(new THREE.SphereGeometry(0.07, 8, 6), berry, Math.cos(a) * Math.cos(e) * 0.8, 0.5 + Math.sin(e) * 0.55, Math.sin(a) * Math.cos(e) * 0.8)); }
    const sn = M(new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#f4f7ff'), 0, 0.9, 0); sn.scale.y = 0.4; g.add(sn);
    return g;
  }

  // Junta tudo que é estático num punhado de malhas (bem mais leve para celular)
  bake() {
    this.static.updateMatrixWorld(true);
    const groups = new Map(), remove = [], glows = new Map();
    this.static.traverse(o => {
      if (o.isSprite && o.userData.batch) { remove.push(o); const k = o.material.color.getHexString() + '|' + o.scale.x + '|' + o.material.opacity; if (!glows.has(k)) glows.set(k, { s: o, p: [] }); glows.get(k).p.push(new THREE.Vector3().setFromMatrixPosition(o.matrixWorld)); return; }
      if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || o.material.transparent || !o.visible) return;
      let g = o.geometry.clone(); if (g.index) g = g.toNonIndexed();
      g.applyMatrix4(o.matrixWorld);
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.attributes.normal) g.computeVertexNormals();
      g.morphAttributes = {}; g.clearGroups();
      const k = o.material.uuid; if (!groups.has(k)) groups.set(k, { m: o.material, list: [] });
      groups.get(k).list.push(g); remove.push(o);
    });
    for (const o of remove) o.parent.remove(o);
    for (const { m, list } of groups.values()) {
      const geo = mergeGeometries(list); if (!geo) continue;
      const mesh = new THREE.Mesh(geo, m); mesh.matrixAutoUpdate = false; this.scene.add(mesh);
    }
    const tanH = Math.tan(THREE.MathUtils.degToRad(29));
    for (const { s, p } of glows.values()) {
      const gg = new THREE.BufferGeometry().setFromPoints(p);
      const pts = new THREE.Points(gg, new THREE.PointsMaterial({ map: glowTex(), color: s.material.color, size: s.scale.x / tanH, transparent: true, opacity: s.material.opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      pts.frustumCulled = false; this.scene.add(pts);
    }
  }

  finalize() {
    this.bake();
    if (this.bulbs.length) {
      const n = this.bulbs.length;
      const m = new THREE.InstancedMesh(new THREE.SphereGeometry(0.085, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), n);
      const d = new THREE.Object3D(); const c = new THREE.Color();
      const hp = new Float32Array(n * 3), hc = new Float32Array(n * 3);
      this.bulbs.forEach((b, i) => {
        d.position.copy(b.p); d.updateMatrix(); m.setMatrixAt(i, d.matrix); c.set(b.c); m.setColorAt(i, c);
        hp.set([b.p.x, b.p.y, b.p.z], i * 3); hc.set([c.r, c.g, c.b], i * 3);
      });
      m.frustumCulled = false; this.scene.add(m);
      const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.BufferAttribute(hp, 3));
      const base = hc.slice(); hg.setAttribute('color', new THREE.BufferAttribute(hc, 3));
      const halo = new THREE.Points(hg, new THREE.PointsMaterial({ map: glowTex(), size: 0.75, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.frustumCulled = false; this.scene.add(halo);
      let acc = 0;
      this.anims.push((t, dt) => {
        acc += dt; if (acc < 0.12) return; acc = 0;
        for (let i = 0; i < n; i++) { const k = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.4 + i * 1.7)); hc[i * 3] = base[i * 3] * k; hc[i * 3 + 1] = base[i * 3 + 1] * k; hc[i * 3 + 2] = base[i * 3 + 2] * k; }
        hg.attributes.color.needsUpdate = true;
      });
    }
    if (this.icicles.length) {
      const g = new THREE.ConeGeometry(0.06, 1, 8); g.translate(0, -0.5, 0); g.rotateX(Math.PI);
      const m = new THREE.InstancedMesh(g, mat('#d8ecff', { emissive: '#7aa7e0', emissiveIntensity: 0.25, roughness: 0.15 }), this.icicles.length);
      const d = new THREE.Object3D();
      this.icicles.forEach((ic, i) => { d.position.copy(ic.p); d.scale.set(1, ic.len, 1); d.updateMatrix(); m.setMatrixAt(i, d.matrix); });
      m.frustumCulled = false; this.scene.add(m);
    }
  }

  update(dt, t, camera) {
    this.t = t;
    if (this.sky) { this.sky.position.copy(camera.position); this.skyStars.position.copy(camera.position); }
    if (this.snow) {
      const p = this.snow.geometry.attributes.position, a = p.array, cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
      for (let i = 0; i < a.length; i += 3) {
        const k = i / 3;
        a[i + 1] -= (0.9 + (k % 7) * 0.13) * dt;
        a[i] += Math.sin(t * 0.6 + k) * 0.35 * dt;
        a[i] = ((a[i] - cx + 30) % 60 + 60) % 60 + cx - 30;
        a[i + 2] = ((a[i + 2] - cz + 30) % 60 + 60) % 60 + cz - 30;
        if (a[i + 1] < cy - 10) a[i + 1] += 26; else if (a[i + 1] > cy + 16) a[i + 1] -= 26;
      }
      p.needsUpdate = true;
    }
    for (const f of this.anims) f(t, dt);
  }
}
export { plankMat, RB };
