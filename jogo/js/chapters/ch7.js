// Capítulo 7 · A Noite Santa (Lc 2,7-20). Jesus nasce na gruta; nos campos, o anjo anuncia aos pastores,
// a anjinha voa pelos anéis de luz até o coro do Céu, junta os cordeirinhos e guia os pastores até a manjedoura.
import * as THREE from 'three';
import { terrainHeight as H, person, V, mat, rng, glow, glowTex, sheepModel, angelModel, gabrielModel, setWings, animateChar } from '../world.js';
import { kit, LOOKS } from './kit.js';
import { donkeyModel, oxModel, animateQuad, stableModel, mangerModel, babyModel, bigStarModel, lightBeam, campfireModel, lightFire, animateFire } from '../models.js';

// a gruta num platô ao norte, Belém num morro a noroeste e os campos dos pastores ao sul
export const TERRAIN = { hills: [[0, -36, 3.5, 80, 9], [-34, -42, 6, 150], [30, -30, 4, 160], [-26, 28, 2.5, 120]], flat: 14, ring: 58, bumps: 0.9 };
const JOSE = 'José', MARIA = 'Maria', GAB = 'Anjo Gabriel', CORO = 'Coro dos anjos', NATAN = 'Natan', JACO = 'Vovô Jacó', MIRIAM = 'Miriam';
const SX = 0, SZ = -30;

export function build(ctx) {
  const { world, scene, player, ui, sfx, cam, tween } = ctx;
  const K = kit(ctx, 7);
  world.buildEnvironment({ path: [[4, 42], [4, 22], [2, 8], [0, -6], [0, -25]], sky: 'holy', ground: 'meadow', snowfall: false });
  const Hs = H(SX, SZ);

  // ---------- Céu da Noite Santa: Via Láctea ----------
  const sky = new THREE.Group(); scene.add(sky);
  {
    const R = rng(77), n = 2600, p = new Float32Array(n * 3), c = new Float32Array(n * 3), col = new THREE.Color();
    const tilt = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.5, 0.3, 0.9)), v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, spread = (R() + R() + R() - 1.5) * 0.16;
      v.set(Math.cos(a), spread, Math.sin(a)).normalize().applyMatrix4(tilt).multiplyScalar(400);
      if (v.y < 8) v.y = Math.abs(v.y) + 8;
      p.set([v.x, v.y, v.z], i * 3); col.set(['#ffffff', '#cfd8ff', '#ffe9c8', '#d9c8ff'][i % 4]); c.set([col.r, col.g, col.b], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    sky.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.5, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false, fog: false })));
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2; v.set(Math.cos(a), 0, Math.sin(a)).applyMatrix4(tilt).multiplyScalar(380); if (v.y < 30) continue;
      const s = glow(i % 2 ? '#7a6ad8' : '#5a7ae0', 150, 0.13); s.position.copy(v); sky.add(s);
    }
  }

  // ---------- A gruta de Belém ----------
  const stable = stableModel(world, SX, SZ, 0);
  world.rocks([[-5, -33], [5, -33.4], [-6.2, -30], [6.4, -30.4], [-3.4, -35], [3, -35.5]].map(([x, z], i) => ({ x, z, s: 1.8 + (i % 3) * 0.5, ry: i })));
  const manger = mangerModel(false); K.place(manger, SX, SZ - 0.6, 0); manger.scale.setScalar(1.3);
  const baby = babyModel(); baby.position.set(0, 0.68, -0.15); baby.visible = false; manger.add(baby);
  const bglow = glow('#fff1c4', 3.6, 0); bglow.position.set(0, 1.0, 0); manger.add(bglow);
  const lamp = new THREE.PointLight('#ffb35a', 14, 14, 1.6); lamp.position.copy(stable.userData.lantern); scene.add(lamp);
  { const l = glow('#ffc46b', 3, 0.8); l.position.copy(stable.userData.lantern); scene.add(l); }
  const holy = new THREE.PointLight('#ffe6b0', 0, 9, 1.8); holy.position.set(SX, Hs + 1.6, SZ + 0.4); scene.add(holy);
  const face = (m, x, z) => { m.rotation.y = Math.atan2(x - m.position.x, z - m.position.z); };
  const maria = person({ ...LOOKS.maria, kneel: true }); K.place(maria, SX + 1.1, SZ + 0.3); face(maria, SX, SZ - 0.6);
  const jose = person(LOOKS.jose); K.place(jose, SX - 1.3, SZ + 0.5); face(jose, SX, SZ - 0.6);
  const ox = oxModel(); K.place(ox, SX - 2.6, SZ - 1.2); face(ox, SX, SZ - 0.6);
  const donkey = donkeyModel(); K.place(donkey, SX + 2.7, SZ - 1.3); face(donkey, SX, SZ - 0.6);
  for (const [m, nm] of [[maria, MARIA], [jose, JOSE]]) K.npcs.push({ name: nm, model: m, static: true, x: 0, z: 0, pos: V(), talks: 0 });

  // ---------- A Estrela de Belém ----------
  const star = bigStarModel(); star.position.set(SX, Hs + 24, SZ - 1); star.scale.setScalar(0.6); scene.add(star);
  const flares = [[2.4, 80], [80, 2.4], [1.4, 46], [46, 1.4]].map(([w, h], i) => { const f = glow('#fff1c4', 1, i < 2 ? 0.5 : 0.35); f.scale.set(w, h, 1); f.position.copy(star.position); scene.add(f); return f; });
  const beam = lightBeam(23, 0.5, 3.4); beam.position.set(SX, Hs + 12.5, SZ - 0.6); beam.material.opacity = 0.04; scene.add(beam);
  // brilho dourado que cai sobre a gruta
  const rain = (() => {
    const n = 260, p = new Float32Array(n * 3), R = rng(9);
    for (let i = 0; i < n; i++) p.set([SX + (R() - 0.5) * 12, Hs + R() * 20, SZ + (R() - 0.5) * 10], i * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex(), color: '#ffe08a', size: 0.32, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.frustumCulled = false; scene.add(m); return m;
  })();

  // ---------- Belém ao longe e o caminho ----------
  [[-34, -40, 0.6], [-29, -44, 0.5], [-38, -46, 0.7], [-31, -36, 0.4], [-39, -38, 0.8]].forEach(([x, z, rot], i) =>
    world.flatHouse({ x, z, rot, w: 5, d: 4, h: 3, wall: ['#efe2c6', '#e4cfa6', '#f2e8d4', '#dcc39a', '#ead8b4'][i], upper: i % 2 === 0, stairs: false, plants: false }));
  for (const [x, z] of [[5.6, 30], [2.2, 14], [3.4, 2], [-2, -8], [2, -16], [-2.2, -22]]) world.lamp(x, z).light();
  // os campos dos pastores
  const fireX = 4, fireZ = 20; const fire = K.place(campfireModel(), fireX, fireZ); lightFire(fire); world.addCircle(fireX, fireZ, 0.8);
  const penX = 13, penZ = 25; world.fenceRing(penX, penZ, 4.5, Math.PI, 0.55);
  world.logs(-1.5, 21.5, 0.4);
  world.olives([[-12, 12], [-16, 18], [-20, 6], [18, 10], [22, 16], [24, 36], [-8, 34], [-18, 30], [16, -8], [-14, -10], [12, -18], [-10, -20]].map(([x, z]) => ({ x, z, s: 1.1, ry: x })));
  world.cypresses([[-7, -22], [7, -22.5], [-8, -16], [8, -15]].map(([x, z]) => ({ x, z, s: 1, ry: x })));
  for (const [x, z, r, n] of [[-6, 26, 6, 70], [20, 30, 6, 60], [-14, 2, 6, 60], [12, 2, 5, 50], [0, -18, 4, 40]]) world.flowers(x, z, r, n, x * 5 + z * 3);
  K.forest({ seed: 77, n: 90, r0: 38, r1: 95, avoid: (x, z) => Math.hypot(x, z) < 38 || Math.hypot(x + 34, z + 42) < 12 });
  const flock = [[11, 23], [14.5, 26.5], [12.5, 27], [15, 23.5], [10.5, 26], [7, 28], [16, 31]].map(([x, z], i) => K.place(sheepModel(), x, z, i * 1.7));
  // vagalumes nos campos
  const flies = (() => {
    const n = 80, p = new Float32Array(n * 3), base = [], R = rng(14);
    for (let i = 0; i < n; i++) { const x = (R() - 0.5) * 60, z = -10 + R() * 50; base.push([x, H(x, z) + 0.5 + R() * 2, z, R() * 6]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex(), color: '#f6ff9a', size: 0.42, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.frustumCulled = false; scene.add(m); return { m, base };
  })();

  // ---------- Estrelas (18) ----------
  const sl = [];
  for (let i = 0; i < 6; i++) { const z = 34 - i * 10; sl.push([2 + Math.sin(i) * 2, H(2, z) + 1.2, z]); }
  sl.push([SX, stable.userData.roofTop + 1, SZ], [-34, H(-34, -40) + 5, -40], [-38, H(-38, -46) + 5, -46], [penX, H(penX, penZ) + 1.4, penZ], [-1.5, H(-1.5, 21.5) + 2, 21.5]);
  for (const [x, z] of [[-16, 18], [22, 16], [-20, 6], [24, 36], [16, -8]]) sl.push([x, H(x, z) + 3.4, z]);
  sl.push([30, H(30, -30) + 1.4, -30], [-26, H(-26, 28) + 1.4, 28]);
  K.starsAt(sl);
  world.finalize();

  // ---------- Pastores ----------
  const NAT = { color: '#9a7448', belt: '#6b4a2e', male: true, boots: '#6b4a2e', tights: '#c9a27a', hair: { color: '#3a2618', style: 'short' }, eyes: '#4a3020', skin: '#dba67e', staff: true, s: 0.88 };
  const JAC = { color: '#8a6a48', sash: '#c9a46a', mantle: '#6b5a44', long: true, male: true, hair: { color: '#e8e2d8', style: 'short' }, beard: '#f2eee6', eyes: '#3b2a1a', skin: '#d9a47a', old: true, staff: true, s: 1.0 };
  const MIR = { color: '#b0638a', trim: '#e8c46a', veil: '#efe6d6', hair: { color: '#4a2a18', style: 'long' }, eyes: '#4a2a18', lashes: true, skin: '#e2b08a', boots: '#6b4a2e', tights: '#f4efe8', staff: true, s: 0.86 };
  const natan = K.npc({
    name: NATAN, x: fireX - 1.8, z: fireZ + 1.6, face: 2.3, collide: false, look: NAT,
    lines: () => [{ who: NATAN, text: `Os cordeirinhos fugiram com o susto da luz! Ache os ${4 - penned} que faltam e traga para o curral. Eles seguem você!` }],
    enabled: () => K.stage === 2,
  });
  const jaco = person(JAC); K.place(jaco, fireX + 1.9, fireZ + 1.4); face(jaco, fireX, fireZ);
  const miriam = person(MIR); K.place(miriam, fireX + 0.4, fireZ - 2); face(miriam, fireX, fireZ);
  for (const [m, nm] of [[jaco, JACO], [miriam, MIRIAM]]) K.npcs.push({ name: nm, model: m, static: true, x: 0, z: 0, pos: V(), talks: 0 });
  const giftLamb = sheepModel(); giftLamb.scale.setScalar(0.42); giftLamb.position.set(0, 0.62, 0.3); giftLamb.visible = false; natan.model.add(giftLamb);

  // ---------- Anjos ----------
  const gabriel = gabrielModel(); gabriel.visible = false; scene.add(gabriel);
  K.npcs.push({ name: GAB, model: gabriel, static: true, x: 0, z: 0, pos: V(), talks: 0 });
  const Hc = H(5, 2), C = V(5, Hc + 15, 2);
  const choir = Array.from({ length: 8 }, (_, i) => {
    const a = -1.15 + i * 2.3 / 7, m = angelModel();
    m.userData.home = V(C.x + Math.sin(a) * 6.5, C.y + Math.abs(a) * 1.3, C.z - Math.cos(a) * 2.2);
    m.position.copy(m.userData.home); m.visible = false; m.scale.setScalar(0.01); scene.add(m); return m;
  });
  const me = angelModel(); me.visible = false; scene.add(me); // a anjinha cantando no meio do coro
  let choirOn = false, hover = true;

  // ---------- Desafio 1: anéis de luz até o coro ----------
  const NOTES = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
  const ringPos = [[6, 13.5, 2.4], [9, 10, 4.4], [7.5, 6.4, 6.6], [3.5, 4.6, 8.8], [1, 7.4, 11], [3.6, 9.4, 13]].map(([x, z, h]) => V(x, H(x, z) + h, z));
  const rings = ringPos.map((p, i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.13, 12, 44), new THREE.MeshStandardMaterial({ color: '#ffe08a', emissive: '#ffbf3a', emissiveIntensity: 1.6, metalness: 0.4, roughness: 0.3, transparent: true, opacity: 0.35 }));
    m.position.copy(p); m.lookAt(ringPos[i + 1] || C); m.visible = false; scene.add(m);
    const g = glow('#ffe7a0', 3.4, 0.35); m.add(g);
    return { m, g, p, done: false };
  });
  let ringI = 0;

  // ---------- Desafio 2: os cordeirinhos fujões ----------
  const lambs = [[-17, 22], [24, 33], [-13, 3], [25, 7]].map(([x, z], i) => {
    const m = sheepModel(); m.scale.setScalar(0.62); K.place(m, x, z, i * 1.4); m.visible = false;
    const f = K.follow(m, { gap: 1.7, speed: 6.2, r: 0.3 });
    return { m, f, x, z, state: 0 }; // 0 perdido, 1 seguindo, 2 no curral
  });
  let penned = 0;
  const followingN = () => lambs.filter(l => l.state === 1).length;

  // ---------- Pastores seguindo a anjinha ----------
  const shepF = [natan.model, jaco, miriam].map((m, i) => K.follow(m, { gap: 2.0, speed: 5.4, slot: i, r: 0.4 }));

  // ---------- Missões ----------
  K.refresh = () => {
    const q = [];
    if (K.stage === 1) q.push({ t: `Voe pelos anéis de luz até o coro dos anjos (${ringI}/6)`, done: false });
    if (K.stage === 2) q.push({ t: `Traga os cordeirinhos de volta ao curral (${penned}/4)`, done: penned >= 4 });
    if (K.stage === 3) q.push({ t: 'Guie os pastores até a gruta, seguindo a estrela', done: false });
    if (K.stage >= 1 && K.stage <= 3) q.push(K.starQuest());
    ui.setQuests(q); ui.setStars(K.stars.count, K.stars.total);
  };
  K.target = () => {
    if (K.stage === 1) return rings[ringI] ? rings[ringI].p : C;
    if (K.stage === 2) return followingN() ? V(penX, 0, penZ) : lambs.filter(l => l.state === 0).map(l => l.m.position.clone());
    if (K.stage === 3) return V(SX, 0, SZ + 6);
    return null;
  };

  // ---------- O quadro final (também usado no menu depois do fim do jogo) ----------
  function tableau(withPlayer) {
    baby.visible = true; bglow.material.opacity = 0.75; holy.intensity = 4; star.scale.setScalar(1.5);
    beam.material.opacity = 0.13; rain.material.opacity = 0.9;
    const kneel = [[NAT, -1.7, 3.0], [JAC, 0, 3.5], [MIR, 1.7, 3.0]].map(([look, lx, lz]) => {
      const m = person({ ...look, kneel: true, staff: false }); K.place(m, SX + lx, SZ + lz); face(m, SX, SZ - 0.6); return m;
    });
    for (const m of [natan.model, jaco, miriam]) m.visible = false;
    const gl = sheepModel(); gl.scale.setScalar(0.5); K.place(gl, SX - 0.9, SZ + 0.6); face(gl, SX, SZ - 0.6);
    const roof = stable.userData.roofTop;
    choir.forEach((m, i) => {
      const a = -1.2 + i * 2.4 / 7;
      m.userData.home = V(SX + Math.sin(a) * 5.4, roof + 0.6 + Math.abs(a) * 1.1, SZ + 1.2 - Math.cos(a) * 1.6);
      m.position.copy(m.userData.home); m.visible = true; m.scale.setScalar(1); face(m, SX, SZ + 8);
    });
    choirOn = true; hover = true;
    gabriel.visible = true; gabriel.position.set(SX, roof + 2.4, SZ + 1.6); gabriel.rotation.y = 0; gabriel.scale.setScalar(1);
    flock.slice(0, 3).forEach((s, i) => { s.position.set(SX - 3 + i * 3, 0, SZ + 5 + (i % 2) * 0.6); s.position.y = H(s.position.x, s.position.z); face(s, SX, SZ); });
    if (withPlayer) { player.place(SX + 2.9, SZ + 2.6); player.facing = Math.atan2(SX - player.pos.x, SZ - 0.6 - player.pos.z); player.sync && player.sync(0); }
    return kneel;
  }
  if (ctx.menu) tableau(false);

  // ---------- Cenas ----------
  async function start() {
    try {
      K.cutscene = true;
      await K.intro({
        title: 'A Noite Santa', sub: 'Belém · Lc 2,7-20', x: SX + 3, z: SZ + 7, facing: Math.PI,
        narr: ['Era noite em Belém. Na gruta simples, iluminada pela lamparina, Maria e José esperavam...', 'E então, no silêncio daquela noite santa...'],
      });
      ctx.lock(true);
      player.place(SX + 3.4, SZ + 4.2, Math.PI + 0.6);
      cam.cut(V(SX + 0.2, Hs + 2.0, SZ + 4.4), V(SX, Hs + 0.75, SZ - 0.7));
      await K.wait(1);
      ui.flash(); sfx.glory(); ctx.stopMusic();
      baby.visible = true;
      tween(2.5, k => { bglow.material.opacity = 0.75 * k; holy.intensity = 4 * k; star.scale.setScalar(0.6 + 0.9 * k); beam.material.opacity = 0.04 + 0.09 * k; rain.material.opacity = 0.9 * k; });
      sfx.choir(14);
      await K.wait(1.6);
      await K.say([
        'Maria deu à luz o seu filho primogênito. Envolveu-o em faixas e deitou-o numa manjedoura.',
        { who: MARIA, text: 'Jesus... meu filhinho. Seja bem-vindo ao mundo.' },
        { who: JOSE, text: 'Emanuel: Deus conosco! Ele está aqui, Maria. O Filho de Deus está aqui!' },
        'O Rei do universo nasceu pobrezinho, numa gruta, aquecido pelo boi e pelo burrinho. E o Céu inteiro fez festa!',
      ]);
      cam.shot(V(SX + 4, Hs + 2.2, SZ + 9), V(SX, Hs + 14, SZ - 1), 0.9);
      await K.wait(2.2);
      // nos campos
      await K.step(ui.fade(1, 0.8));
      ctx.startMusic();
      const Hf = H(fireX, fireZ);
      player.place(fireX - 2.6, fireZ - 2.2, 0.6);
      cam.cut(V(fireX + 5, Hf + 2.2, fireZ + 7), V(fireX, Hf + 1.2, fireZ));
      await K.step(ui.fade(0, 1));
      await K.say([
        'Naquela mesma região havia pastores que passavam a noite nos campos, tomando conta do seu rebanho.',
        { who: NATAN, text: 'Vovô Jacó, olha aquela estrela! Nunca vi uma estrela tão grande!' },
        { who: JACO, text: 'Nem eu, Natan... e olha que já sou bem velhinho.' },
      ]);
      // o anjo aparece
      gabriel.visible = true; gabriel.position.set(fireX, Hf + 9, fireZ - 6); face(gabriel, fireX, fireZ + 8);
      ui.flash(); sfx.glory();
      cam.shot(V(fireX + 1, Hf + 1.6, fireZ + 7.5), V(fireX, Hf + 4.4, fireZ - 5), 1.4);
      await K.step(tween(2.2, k => { gabriel.position.y = Hf + 9 - 4 * k; }));
      await K.say([
        'Um anjo do Senhor apareceu aos pastores, e a glória do Senhor os envolveu de luz. Eles ficaram com muito medo.',
        { who: GAB, text: 'Não tenham medo! Eu lhes anuncio uma grande alegria, que será para todo o povo:' },
        { who: GAB, text: 'Hoje, na cidade de Davi, nasceu para vocês um Salvador, que é o Cristo Senhor!' },
        { who: GAB, text: 'Este será o sinal: vocês encontrarão um recém-nascido envolto em faixas e deitado numa manjedoura.' },
      ]);
      // o coro aparece
      cam.shot(V(C.x, C.y - 6, C.z + 18), V(C.x, C.y, C.z), 1.2);
      for (const m of choir) { m.visible = true; tween(0.5, k => m.scale.setScalar(Math.max(0.01, k))); sfx.star(); await K.wait(0.22); }
      choirOn = true;
      await K.wait(0.6);
      await K.say([
        'De repente, apareceu junto do anjo uma multidão de anjos do Céu...',
        { who: GAB, text: 'Anjinha mensageira! O coro do Céu está esperando você. Voe pelos anéis de luz e venha cantar com a gente!' },
      ]);
      rings.forEach(r => (r.m.visible = true));
      player.place(fireX + 2, fireZ + 3, Math.PI - 0.15);
      K.stage = 1; K.play();
      ui.toast('Voe (Espaço / botão de asas) pelos anéis de luz, um de cada vez!', 5);
    } catch (e) { K.err(e); }
  }

  async function gloria() {
    K.stage = 1.5; K.cutscene = true; ctx.lock(true); ui.setQuests([]);
    try {
      player.place(fireX + 2.2, fireZ + 4.2, Math.PI + 0.3);
      me.visible = true; me.position.set(C.x, C.y + 0.2, C.z + 1.2); me.rotation.y = 0;
      cam.shot(V(C.x, C.y - 0.6, C.z + 11), V(C.x, C.y + 0.6, C.z), 1.3);
      sfx.gloria(); ui.flash();
      await K.say([
        { who: CORO, text: 'Glória a Deus no mais alto dos céus, e paz na terra aos homens por Ele amados!' },
        { who: CORO, text: 'Glória, glória, glória! Jesus nasceu!' },
      ]);
      // os anjos voltam para o céu
      const Hf = H(fireX, fireZ);
      cam.shot(V(fireX + 6, Hf + 2.4, fireZ + 9), V(C.x, C.y, C.z), 0.8);
      hover = false; const y0 = choir.map(m => m.position.y);
      await K.step(tween(2.4, k => { choir.forEach((m, i) => { m.position.y = y0[i] + k * 24; }); gabriel.position.y += 0.08; })); hover = true;
      choir.forEach(m => { m.visible = false; }); gabriel.visible = false; choirOn = false; me.visible = false;
      cam.shot(V(fireX + 4.6, Hf + 2, fireZ + 7), V(fireX, Hf + 1.1, fireZ), 1.6);
      for (const l of lambs) l.m.visible = true;
      await K.say([
        { who: JACO, text: 'Vamos já a Belém ver o que aconteceu, o que o Senhor nos deu a conhecer!' },
        { who: MIRIAM, text: 'Mas, vovô, os cordeirinhos fugiram com o susto da luz! Não podemos deixá-los sozinhos no campo...' },
        { who: NATAN, text: 'Anjinho, ajuda a gente? São 4 cordeirinhos. Encoste neles e eles seguem você até o curral!' },
      ]);
      K.stage = 2; K.play();
    } catch (e) { K.err(e); }
  }

  async function lambsHome() {
    K.stage = 2.5; K.cutscene = true; ctx.lock(true);
    try {
      await K.wait(1.2);
      const Hf = H(fireX, fireZ);
      cam.shot(V(fireX + 4, Hf + 2, fireZ + 6.5), V(fireX, Hf + 1.1, fireZ + 1), 1.6);
      for (const m of [natan.model, jaco, miriam]) face(m, player.pos.x, player.pos.z);
      giftLamb.visible = true; sfx.item();
      await K.say([
        { who: NATAN, text: 'Todos de volta! Obrigado, anjinho! E este cordeirinho, o mais fofinho, eu vou levar de presente para o Menino!' },
        { who: MIRIAM, text: 'Mas onde fica a manjedoura? Belém é tão grande...' },
        { who: JACO, text: 'Olhem a estrela! A luz dela desce bem em cima da gruta, ao norte. Mostre o caminho, anjinha!' },
      ]);
      shepF.forEach(f => (f.on = true));
      K.stage = 3; K.play();
      ui.toast('Os pastores seguem você! Leve-os até a gruta, embaixo da estrela.', 4.5);
    } catch (e) { K.err(e); }
  }

  async function adoration() {
    K.stage = 4; K.cutscene = true; ctx.lock(true); ui.setQuests([]); shepF.forEach(f => (f.on = false));
    try {
      await K.step(ui.fade(1, 0.9));
      ctx.stopMusic();
      const kneel = tableau(true);
      for (const [m, nm] of [[kneel[0], NATAN], [kneel[1], JACO], [kneel[2], MIRIAM]]) K.npcs.push({ name: nm, model: m, static: true, x: 0, z: 0, pos: V(), talks: 0 });
      gabriel.visible = false; choir.forEach(m => (m.visible = false)); choirOn = false;
      cam.cut(V(SX + 0.6, Hs + 2.1, SZ + 8.5), V(SX, Hs + 1.1, SZ - 0.2));
      await K.step(ui.fade(0, 1.4));
      ctx.startMusic();
      await K.say([
        'Os pastores foram depressa e encontraram Maria, José e o Recém-nascido deitado na manjedoura.',
        { who: NATAN, text: 'É verdade! Igualzinho o anjo falou: envolto em faixas e deitado numa manjedoura!' },
        { who: JACO, text: 'Esperei a vida inteira por este dia... O Salvador nasceu! Meus olhos viram!' },
        { who: NATAN, text: 'Trouxe um cordeirinho para você, Jesus. É o mais fofinho do rebanho.' },
        { who: MARIA, text: 'Obrigada, Natan. Ele veio para todos: para os pastores, para os pequenos, para cada um de nós.' },
      ]);
      // os anjos descem sobre a gruta
      ui.flash(); sfx.gloria();
      gabriel.visible = true; const gy = gabriel.position.y;
      hover = false; choir.forEach(m => { m.visible = true; m.position.y = m.userData.home.y + 14; }); choirOn = true;
      cam.shot(V(SX, Hs + 3.2, SZ + 13), V(SX, Hs + 4.6, SZ - 0.5), 1);
      await K.step(tween(3, k => { choir.forEach(m => { m.position.y = m.userData.home.y + 14 * (1 - k); }); gabriel.position.y = gy + 10 * (1 - k); })); hover = true;
      await K.say([
        'Maria guardava todas essas coisas, meditando-as no seu coração.',
        { who: MARIA, text: 'Anjinha mensageira... você nos acompanhou desde o meu “sim”, lá em Nazaré, até esta noite. Obrigada!' },
        { who: JOSE, text: 'Agora vá e conte para o mundo inteiro: Jesus nasceu!' },
      ]);
      // a câmera passeia devagar em volta do presépio
      const orbit = tween(14, k => { const a = -0.75 + 1.5 * k; cam.tPos.set(SX + Math.sin(a) * 9, Hs + 2.6 + Math.sin(k * Math.PI) * 1.2, SZ + Math.cos(a) * 9); cam.tLook.set(SX, Hs + 1.4, SZ - 0.4); }, k => k);
      cam.shot(cam.tPos.clone(), V(SX, Hs + 1.4, SZ - 0.4), 1.2);
      await K.say([
        'E o Verbo se fez carne e habitou entre nós.',
        'Os pastores voltaram glorificando e louvando a Deus por tudo o que tinham visto e ouvido.',
      ]);
      await K.step(orbit);
      cam.shot(V(SX, Hs + 2.4, SZ + 8), V(SX, Hs + 1.6, SZ - 0.5), 0.8);
      await K.step(ui.titleCard('✦ Jesus nasceu ✦', 'Feliz Natal!', 'Emanuel · Deus conosco', 4.2));
      await K.complete({
        verse: 'Eu vos anuncio uma grande alegria, que será para todo o povo: hoje, na cidade de Davi, nasceu para vós um Salvador, que é o Cristo Senhor.',
        ref: 'Lc 2,10-11',
        reflect: 'Jesus é o maior presente de Natal: Deus que vem morar com a gente. Como os pastores, vá contar essa alegria para todo mundo, com palavras e com gestos de carinho!',
      });
    } catch (e) { K.err(e); }
  }

  // ---------- Loop ----------
  const pv = V();
  function update(dt, t, playing) {
    K.update(dt, t, playing);
    sky.position.copy(cam.pos);
    star.lookAt(cam.pos); star.rotateZ(Math.sin(t * 0.5) * 0.1);
    star.userData.star.scale.setScalar(3.4 * (1 + Math.sin(t * 2.2) * 0.04));
    flares.forEach((f, i) => { f.material.rotation = t * 0.05 * (i % 2 ? -1 : 1) + (i > 1 ? 0.78 : 0); f.material.opacity = (i < 2 ? 0.5 : 0.35) * (0.8 + 0.2 * Math.sin(t * 1.7 + i)); });
    beam.rotation.y = t * 0.2;
    animateFire(fire, t);
    if (baby.visible) bglow.scale.setScalar(3.6 + Math.sin(t * 2) * 0.3);
    // brilho caindo
    if (rain.material.opacity > 0) {
      const a = rain.geometry.attributes.position.array;
      for (let i = 0; i < a.length; i += 3) { a[i + 1] -= dt * (0.8 + (i % 7) * 0.12); if (a[i + 1] < Hs) a[i + 1] = Hs + 20; }
      rain.geometry.attributes.position.needsUpdate = true;
    }
    // vagalumes
    { const a = flies.m.geometry.attributes.position.array; flies.base.forEach(([x, y, z, s], i) => { a[i * 3] = x + Math.sin(t * 0.4 + s) * 1.2; a[i * 3 + 1] = y + Math.sin(t * 0.9 + s * 2) * 0.4; a[i * 3 + 2] = z + Math.cos(t * 0.35 + s) * 1.2; }); flies.m.geometry.attributes.position.needsUpdate = true; flies.m.material.opacity = 0.6 + 0.3 * Math.sin(t * 3); }
    // bichos e personagens parados
    animateQuad(ox, t, dt, 0); animateQuad(donkey, t, dt, 0);
    flock.forEach((s, i) => { s.position.y = H(s.position.x, s.position.z) + Math.abs(Math.sin(t * 2 + i)) * 0.03; });
    // anjos flutuando
    if (gabriel.visible) { animateChar(gabriel, t, dt, { talk: ui.speaker === GAB, air: true }); setWings(gabriel, 0.35 + Math.sin(t * 1.6) * 0.15); }
    if (choirOn) choir.forEach((m, i) => { if (!m.visible) return; animateChar(m, t + i, dt, { air: true, talk: ui.speaker === CORO }); setWings(m, 0.4 + Math.sin(t * 5 + i) * 0.35); if (hover) m.position.y = m.userData.home.y + Math.sin(t * 1.5 + i) * 0.25; });
    if (me.visible) { animateChar(me, t, dt, { air: true, talk: ui.speaker === CORO }); setWings(me, 0.4 + Math.sin(t * 5) * 0.35); }
    // anéis de luz
    if (K.stage === 1) {
      rings.forEach((r, i) => { if (r.done) return; const on = i === ringI; r.m.material.opacity = on ? 0.95 : 0.3; r.g.material.opacity = on ? 0.6 + 0.3 * Math.sin(t * 4) : 0.15; r.m.rotation.z += dt * (on ? 1.2 : 0.3); });
      if (playing && rings[ringI]) {
        pv.copy(player.pos); pv.y += 0.8;
        if (pv.distanceTo(rings[ringI].p) < 1.9) {
          const r = rings[ringI]; r.done = true; sfx.note(NOTES[ringI]);
          tween(0.6, k => { r.m.scale.setScalar(1 + k * 1.5); r.m.material.opacity = 0.95 * (1 - k); r.g.material.opacity = 0.6 * (1 - k); }).then(() => (r.m.visible = false));
          ringI++; K.refresh();
          ui.toast(ringI < 6 ? `Anel de luz! (${ringI}/6) Continue subindo!` : 'Você chegou ao coro dos anjos! 🎶', 2.4);
          if (ringI >= 6) gloria();
        }
      }
    }
    // cordeirinhos
    lambs.forEach((l, i) => {
      if (!l.m.visible) return;
      if (l.state === 0) {
        K.anim(l.m, t, dt, {}); l.m.position.y = H(l.m.position.x, l.m.position.z) + Math.abs(Math.sin(t * 3 + i)) * 0.12;
        if (playing && K.stage === 2 && Math.hypot(player.pos.x - l.m.position.x, player.pos.z - l.m.position.z) < 1.8 && player.pos.y - H(player.pos.x, player.pos.z) < 2) {
          l.state = 1; l.f.slot = followingN() - 1; l.f.on = true; sfx.star(); ui.toast('Mééé! O cordeirinho está seguindo você 🐑', 2.4); K.refresh();
        }
      } else if (l.state === 1 && Math.hypot(l.m.position.x - penX, l.m.position.z - penZ) < 5) {
        l.state = 2; l.f.on = false; penned++;
        const a = i * 1.6, x = penX + Math.cos(a) * 1.6, z = penZ + Math.sin(a) * 1.6;
        K.walkTo(l.m, x, z, 2.5); sfx.item();
        lambs.filter(q => q.state === 1).forEach((q, k) => (q.f.slot = k));
        ui.toast(penned < 4 ? `Cordeirinho no curral! (${penned}/4)` : 'Todos os cordeirinhos estão salvos! 🐑', 3); K.refresh();
        if (penned >= 4) lambsHome();
      } else if (l.state === 2 && !K.movers.some(w => w.m === l.m)) K.anim(l.m, t, dt, {});
    });
    if (playing && K.stage === 3 && Math.hypot(player.pos.x - SX, player.pos.z - (SZ + 5)) < 6 && Math.hypot(natan.model.position.x - SX, natan.model.position.z - (SZ + 5)) < 11) adoration();
  }

  function hint() {
    if (K.cutscene) return 'Acompanhe a história.';
    if (K.stage === 1) return 'Aperte Espaço (ou o botão de asas) várias vezes para subir e passe por dentro do anel que está brilhando mais. A seta mostra o próximo.';
    if (K.stage === 2) return followingN() ? 'Leve os cordeirinhos até o curral cercado, perto da fogueira.' : 'Os cordeirinhos se espalharam pelos campos. Siga a seta e encoste neles.';
    if (K.stage === 3) return 'Siga a estrela! A gruta fica ao norte, no alto, embaixo da luz que desce do céu.';
    return 'Acompanhe a história.';
  }

  return { start, update, hint, menuView: { c: V(SX, Hs, SZ), r: 19, h: 5.5, yaw: 0, arc: 0.45, look: V(SX, Hs + 5.5, SZ - 0.5) } };
}
