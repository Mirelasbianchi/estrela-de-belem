// Capítulo 5 · A Estrada para Belém (Lc 2,4-5; Mq 5,1). Deserto da Judeia: Maria e José seguem pela estrada
// e a anjinha vai na frente abrindo o caminho: pedras caídas, a passagem do riacho e os lampiões ao anoitecer.
import * as THREE from 'three';
import { terrainHeight as H, person, V, mat, rng } from '../world.js';
import { kit, LOOKS } from './kit.js';
import { donkeyModel, itemModel } from '../models.js';

// morro de pedra (platô alto), dunas, o riacho e o monte de Belém ao norte
export const TERRAIN = { hills: [[23, 7, 6.5, 14, 3.2], [-27, -22, 4, 160], [28, -24, 5, 200], [-30, 26, 3.5, 140], [0, -61, 6, 110, 10]], river: [-1, 1.7, 6, 2.5, 0.12], flat: 9, ring: 60, bumps: 1.5 };
const JOSE = 'José', MARIA = 'Maria';
// a estrada; a família para antes das pedras (2→3), antes do riacho (4→5) e no escuro (6→7)
const WAY = [[-3, 42], [5, 33], [7.5, 23.5], [1, 12], [-7.6, 4.2], [-6.6, -9], [3.5, -14], [8, -23], [1, -32], [-1, -40]];
const riverZ = x => -1 + Math.sin(x * 0.12) * 2.5;

export function build(ctx) {
  const { world, scene, player, ui, sfx, cam, tween } = ctx;
  const K = kit(ctx, 5);
  world.buildEnvironment({ path: WAY, sky: 'desert', ground: 'sand', snowfall: false });

  // ---------- Deserto, oásis e o riacho ----------
  const nearRoad = (x, z, r) => {
    for (let i = 0; i < WAY.length - 1; i++) {
      const [ax, az] = WAY[i], [bx, bz] = WAY[i + 1], vx = bx - ax, vz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
      if (Math.hypot(x - ax - vx * t, z - az - vz * t) < r) return true;
    }
    return false;
  };
  const R = rng(55), shrubs = [], rocks = [];
  for (let i = 0; i < 260; i++) {
    const a = R() * Math.PI * 2, d = 10 + R() * 85, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (nearRoad(x, z, 4.5) || Math.abs(z - riverZ(x)) < 3.5 || Math.hypot(x - 23, z - 7) < 8 || Math.hypot(x + 20, z - 12) < 7 || Math.hypot(x, z + 60) < 16) continue;
    if (i % 3) rocks.push({ x, z, s: 0.4 + R() * 1.3, ry: R() * 6 }); else shrubs.push({ x, z, s: 0.45 + R() * 0.4, ry: R() * 6 });
  }
  world.rocks(rocks); world.olives(shrubs);
  world.palms([[-23, 8], [-17.5, 7.5], [-24.5, 14], [-21, 17.5], [-15.5, 13.5], [12, 4.5], [16.5, -0.5], [-12, 1.6], [-2, 4.4], [20, 4.8]].map(([x, z]) => ({ x, z, s: 0.95 + Math.abs(Math.sin(x)) * 0.3, ry: x })));
  world.spring(-20, 12, Math.PI / 2 + 0.3);
  for (const [x, z, r, n] of [[-20, 12, 6, 50], [14, 2, 4, 30], [-10, -4, 4, 30]]) world.flowers(x, z, r, n, x * 7 + z);
  // água do riacho (faixa que acompanha o leito)
  const waterY = x => H(x, riverZ(x)) + 1.1;
  {
    const xs = [], pos = [], idx = [];
    for (let x = -72; x <= 72; x += 2) xs.push(x);
    xs.forEach((x, i) => { const zc = riverZ(x), y = waterY(x); pos.push(x, y, zc - 3.3, x, y, zc + 3.3); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const w = new THREE.Mesh(g, mat('#4a9ad8', { emissive: '#2a6aa8', emissiveIntensity: 0.35, roughness: 0.06, metalness: 0.25, transparent: true, opacity: 0.86 }));
    scene.add(w);
  }
  // acampamento de Rúben no começo da estrada
  world.cart(-8.5, 44, 0.9); world.barrel(-7, 46.5); world.crate(-10, 41.5, 0.8, 0.4);
  {
    const tent = new THREE.Group(); tent.position.set(-11, H(-11, 47), 47); tent.rotation.y = 0.6; world.static.add(tent);
    const cloth = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.4, 4, 1, true), mat('#c98a5a', { side: THREE.DoubleSide, roughness: 0.9 })); cloth.position.y = 1.2; cloth.rotation.y = Math.PI / 4; tent.add(cloth);
    const st = new THREE.Mesh(new THREE.ConeGeometry(2.25, 0.5, 4, 1, true), mat('#f3e2c0', { side: THREE.DoubleSide })); st.position.y = 0.45; st.rotation.y = Math.PI / 4; tent.add(st);
    world.addCircle(-11, 47, 1.6);
  }
  // Belém lá no alto do monte, ao longe
  const belem = [[-7, -57, 0.25], [0, -60, 0], [7, -57, -0.25], [-3.5, -65, 0.1], [4, -65, -0.1], [-10, -63, 0.4]].map(([x, z, rot], i) =>
    world.flatHouse({ x, z, rot, w: 5, d: 4.2, h: 3, wall: ['#efe2c6', '#e4cfa6', '#f2e8d4', '#dcc39a', '#ead8b4', '#e8d6b0'][i], upper: i % 2 === 0, stairs: false, plants: false, glowColor: '#ffb347' }));

  // ---------- Desafio 1: pedras na estrada ----------
  const stoneM = mat('#a8977f', { roughness: 0.9, flatShading: true });
  const perp = V(11.5, 0, -6.5).normalize();
  const boulders = [[5.3, 19.4, 0.95], [4.1, 17.4, 1.05], [6.1, 17.8, 0.8]].map(([x, z, r]) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), stoneM); m.scale.y = 0.85;
    m.position.set(x, H(x, z) + r * 0.7, z); scene.add(m);
    const b = { m, x, z, r, done: false };
    ctx.interact({
      pos: V(x, H(x, z), z), r: 2.3, label: 'Empurrar a pedra', enabled: () => K.stage === 1 && !b.done,
      fn: () => {
        b.done = true; sfx.jump(); ui.toast(rocksLeft() ? `Pedra fora do caminho! Faltam ${rocksLeft()}.` : 'A estrada está livre! 👏', 2.6);
        const x0 = x, z0 = z;
        tween(1.4, k => { const xx = x0 + perp.x * 6 * k, zz = z0 + perp.z * 6 * k; m.position.set(xx, H(xx, zz) + r * 0.7, zz); m.rotation.z = -k * 5; m.rotation.x = k * 2; }, k => k * (2 - k));
        K.refresh();
      },
    });
    return b;
  });
  const rocksLeft = () => boulders.filter(b => !b.done).length;

  // ---------- Desafio 2: a passagem de pedras do riacho ----------
  const crossX = z => -7.6 + (z - 4.2) / (-13.2) * 1.0;
  const zc = riverZ(-7.06), wy = waterY(-7.06), deckY = wy + 0.18;
  const slots = [-2.4, -0.8, 0.8, 2.4].map(o => { const z = zc + o; return V(crossX(z), wy - 0.05, z); });
  const deck = new THREE.Group(); deck.visible = false; scene.add(deck);
  for (let i = 0; i < 11; i++) { const z = zc - 3.3 + i * 0.6; const p = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.5), mat(i % 2 ? '#a8794a' : '#9a6a3e')); p.position.set(crossX(z), deckY, z); deck.add(p); }
  for (const sx of [-0.9, 0.9]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6.8, 6), mat('#6b4529')); r.rotation.x = Math.PI / 2; r.position.set(crossX(zc) + sx, deckY + 0.55, zc); deck.add(r); for (const o of [-3, 0, 3]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6), mat('#6b4529')); p.position.set(crossX(zc + o) + sx, deckY + 0.3, zc + o); deck.add(p); } }
  let placed = 0, bridge = false;
  const onStone = p => {
    const s = slots[placed++];
    const m = itemModel('stone'); m.scale.setScalar(1.5); scene.add(m);
    const from = player.pos.clone(); from.y += 1;
    tween(1.1, k => { m.position.lerpVectors(from, s, k); m.position.y += Math.sin(k * Math.PI) * 3; m.rotation.y = k * 6; });
    if (placed < 4) ui.toast(`Pedra no riacho! (${placed}/4)`, 2.6);
    else ctx.wait(1.2).then(() => { if (!ctx.alive) return; finishBridge(); });
    K.refresh();
  };
  const stones = [
    K.pickup('stone', -18.6, 15.6, { known: false, onGet: onStone, enabled: () => K.stage === 1 }),
    K.pickup('stone', 23, 7, { y: H(23, 7) + 0.3, known: false, onGet: onStone, enabled: () => K.stage === 1 }),
    K.pickup('stone', -15, -8.5, { known: false, onGet: onStone, enabled: () => K.stage === 1 }),
    K.pickup('stone', 12.5, -3.8, { known: false, onGet: onStone, enabled: () => K.stage === 1 }),
  ];
  function finishBridge() {
    bridge = true; deck.visible = true; sfx.item();
    deck.children.forEach((c, i) => { const y = c.position.y; c.position.y = y + 3; tween(0.5 + i * 0.05, k => { c.position.y = y + 3 * (1 - k); }); });
    world.addBox(crossX(zc), zc, 1.0, 3.4, deckY + 0.06);
    ui.toast('A passagem do riacho está pronta! 🌉', 3.5);
    // o sol começa a se pôr
    world.setSky('sunset', 10);
    ctx.wait(1.5).then(() => { if (!ctx.alive || K.stage !== 1) return; ui.toast('O sol está se pondo... Acenda os lampiões da estrada antes que escureça!', 5); });
    K.refresh();
  }

  // ---------- Desafio 3: lampiões ----------
  const lamps = [[5.8, -16.6], [10.2, -23.5], [5.4, -28.8], [-1.8, -34], [1.8, -40.6]].map(([x, z]) => {
    const l = world.lamp(x, z);
    ctx.interact({ pos: V(x, H(x, z), z), r: 2.4, label: 'Acender o lampião', enabled: () => K.stage === 1 && bridge && !l.lit, fn: () => { l.light(); sfx.lamp(); const n = lamps.filter(q => q.lit).length; ui.toast(n < 5 ? `Lampião aceso! (${n}/5)` : 'Todos os lampiões acesos! A estrada brilha 🏮', 3); K.refresh(); } });
    return l;
  });
  const lampsLit = () => lamps.filter(l => l.lit).length;

  // ---------- Estrelas (18) ----------
  const sl = [];
  for (let i = 0; i < WAY.length - 1; i++) { const [ax, az] = WAY[i], [bx, bz] = WAY[i + 1], x = (ax + bx) / 2, z = (az + bz) / 2; sl.push([x + 1.5, H(x, z) + 1.2, z]); }
  sl.push([22, H(22, 6) + 1.4, 6], [24, H(24, 8.5) + 1.4, 8.5], [-20, H(-20, 12) + 3.4, 12], [-24.5, H(-24.5, 14) + 5.6, 14], [-7, wy + 2.2, zc]);
  sl.push([-11, H(-11, 47) + 3.2, 47], [0, H(0, -60) + 5.2, -60], [30, H(30, -24) + 1.4, -24], [-27, H(-27, -22) + 1.4, -22]);
  K.starsAt(sl);
  world.finalize();

  // ---------- Personagens ----------
  const donkey = donkeyModel(); K.place(donkey, WAY[0][0], WAY[0][1], Math.PI - 0.7);
  const rider = person({ ...LOOKS.maria, long: false, kneel: true }); rider.position.set(0, 0.92, -0.08); rider.scale.setScalar(0.95); donkey.add(rider);
  K.npcs.push({ name: MARIA, model: rider, static: true, x: 0, z: 0, pos: V(), talks: 0 });
  const waiting = () => (fam.wait === 3 ? 'Tem pedras fechando a estrada. Você consegue tirá-las?' : fam.wait === 5 ? 'Sem as pedras da passagem não dá para atravessar o riacho com o burrinho...' : fam.wait === 7 ? 'Está escuro demais. Precisamos dos lampiões acesos para ver a estrada!' : null);
  const jose = K.npc({
    name: JOSE, x: WAY[0][0] + 1.3, z: WAY[0][1] + 0.6, face: Math.PI - 0.7, collide: false, look: LOOKS.jose, talkR: 3,
    lines: () => [{ who: JOSE, text: waiting() || 'Vamos no passo do Pipoca. Cada passo nos deixa mais perto de Belém!' }],
    again: () => [{ who: JOSE, text: waiting() || 'Obrigado por ir na frente, anjinho. Seguimos você!' }],
    enabled: () => K.stage === 1,
  });
  K.npc({
    name: 'Rúben', x: -8.2, z: 41.6, face: 0.6, look: { color: '#6d6aa0', sash: '#c99b5a', long: true, male: true, hair: { color: '#4a3426', style: 'short' }, beard: '#4a3426', eyes: '#3b2a1a', skin: '#e2b08a', s: 1.05 },
    lines: () => [
      { who: 'Rúben', text: 'Eu e a Sara também vamos nos alistar, na cidade da nossa família. Ela correu na frente até o oásis!' },
      { who: 'Rúben', text: 'Cuidado: pedras rolaram do morro e fecharam a estrada. E a chuva levou as pedras da passagem do riacho.' },
    ],
    again: () => [{ who: 'Rúben', text: 'O oásis fica a oeste do riacho, entre as palmeiras. A Sara sabe tudo o que acontece por lá!' }],
  });
  K.npc({
    name: 'Sara', x: -18, z: 10.4, face: 0.4, look: { color: '#e07a8a', trim: '#f4e1b0', hair: { color: '#5a3424', style: 'long' }, eyes: '#5a3a22', skin: '#f0c4a0', lashes: true, boots: '#7a4a2b', tights: '#f4efe8', s: 0.78 },
    lines: () => [
      { who: 'Sara', text: 'Anjinho! Você vai consertar a passagem do riacho? Eu sei onde tem pedras chatinhas, perfeitas!' },
      { who: 'Sara', text: 'Uma está aqui no oásis. Outra lá em cima do morro de pedra, a leste (só voando!). Outra do outro lado do riacho, e a última na beira dele, perto das palmeiras.' },
    ],
    again: () => [{ who: 'Sara', text: placed >= 4 ? 'Você conseguiu! Agora o Pipoca passa sem molhar as patas!' : `Já achou ${placed} de 4 pedras. Continue!` }],
    after: () => stones.forEach(s => (s.known = true)),
  });

  // ---------- A viagem ----------
  const fam = { i: 0, wait: 0, told: {} };
  const allowed = i => (i === 3 ? rocksLeft() === 0 : i === 5 ? bridge : i === 7 ? lampsLit() >= 5 : true);
  async function travel() {
    for (let i = 1; i < WAY.length; i++) {
      while (!allowed(i)) {
        if (fam.wait !== i) { fam.wait = i; if (!fam.told[i]) { fam.told[i] = true; ui.toast(i === 3 ? 'Maria e José pararam: pedras fecham a estrada!' : i === 5 ? 'Maria e José esperam na beira do riacho...' : 'Ficou escuro! Maria e José esperam os lampiões.', 4); } }
        await K.wait(0.4);
      }
      fam.wait = 0;
      const [ax, az] = WAY[i - 1], [x, z] = WAY[i], d = Math.hypot(x - ax, z - az), px = (z - az) / d, pz = -(x - ax) / d;
      await Promise.all([K.walkTo(donkey, x, z, 1.9), K.walkTo(jose.model, x + px * 1.15, z + pz * 1.15, 1.9)]);
      fam.i = i;
      if (i === 6) world.setSky('night', 6);
    }
    arrival();
  }

  // ---------- Missões ----------
  K.refresh = () => {
    const q = [];
    if (K.stage === 1) {
      q.push({ t: 'Acompanhe Maria e José até Belém', done: false });
      q.push({ t: `Tire as pedras da estrada (${3 - rocksLeft()}/3)`, done: rocksLeft() === 0 });
      q.push({ t: `Refaça a passagem do riacho (${placed}/4 pedras)`, done: bridge });
      if (bridge) q.push({ t: `Acenda os lampiões da estrada (${lampsLit()}/5)`, done: lampsLit() >= 5 });
      q.push(K.starQuest());
    }
    ui.setQuests(q); ui.setStars(K.stars.count, K.stars.total);
  };
  K.target = () => {
    if (K.stage !== 1) return null;
    if (rocksLeft()) return boulders.filter(b => !b.done).map(b => V(b.x, 0, b.z));
    if (!bridge) { const k = stones.filter(s => !s.taken && s.known); return k.length ? k.map(s => V(s.x, s.y, s.z)) : V(-18, 0, 10.4); }
    if (lampsLit() < 5) return lamps.filter(l => !l.lit).map(l => l.pos);
    return donkey.position.clone();
  };

  // ---------- Cenas ----------
  async function start() {
    try {
      K.cutscene = true;
      await K.intro({
        title: 'A Estrada para Belém', sub: 'Caminho da Judeia · Lc 2,4-5', x: -1.5, z: 38.5, facing: Math.PI - 0.4,
        narr: [
          'Maria e José partiram de Nazaré. Até Belém eram uns cinco dias de caminhada, por montes, desertos e riachos.',
          'A anjinha mensageira foi junto, sem ninguém perceber, para cuidar deles pelo caminho.',
        ],
      });
      cam.shot(V(-3.5, H(-3, 42) + 2.2, 37.6), V(-4.5, H(-3, 42) + 1.2, 42.5), 1.8);
      await K.say([
        { who: JOSE, text: 'Ainda falta muito, Maria. Mas vamos devagar, no passo do Pipoca.' },
        { who: MARIA, text: 'Deus foi abrindo o caminho até aqui, José. Ele não vai nos deixar sozinhos.' },
        { who: MARIA, text: '(baixinho) Anjinho... sei que você está aí. Vá na frente e nos ajude, está bem?' },
      ]);
      K.stage = 1; K.play();
      ui.toast('Maria e José vão andando sozinhos. Vá na frente e tire os obstáculos do caminho!', 5);
      travel().catch(K.err);
    } catch (e) { K.err(e); }
  }

  async function arrival() {
    K.stage = 2; K.cutscene = true; ctx.lock(true); ui.setQuests([]);
    try {
      player.place(2.6, -38.6, Math.PI + 0.2);
      const by = H(0, -60);
      cam.shot(V(-2.6, H(-1, -40) + 1.9, -35.8), V(0, by + 2.4, -60), 0.9);
      await K.wait(1.2);
      await K.say([
        { who: MARIA, text: 'José, olhe! Lá no alto do monte... são as luzes de Belém!' },
        { who: JOSE, text: 'A cidade do rei Davi, meu antepassado. Chegamos, Maria!' },
        'Belém quer dizer “Casa do Pão”. Ali ia nascer Jesus, o Pão vivo descido do Céu.',
        'Muitos séculos antes, o profeta Miqueias tinha anunciado que o Salvador nasceria justamente ali, na pequena Belém.',
      ]);
      cam.shot(V(1.2, H(-1, -40) + 1.6, -36.6), V(-1, H(-1, -40) + 1.2, -40), 1.4);
      await K.say([
        { who: MARIA, text: 'Obrigada, anjinho, por cuidar de nós pela estrada.' },
        { who: JOSE, text: 'Agora precisamos de um lugar para passar a noite. O bebê vai nascer logo!' },
      ]);
      await K.complete({
        verse: 'E tu, Belém de Éfrata, tão pequena entre as cidades de Judá, de ti sairá aquele que há de reinar em Israel.',
        ref: 'Mq 5,1',
        reflect: 'O Advento também é um caminho: a gente se prepara passo a passo para receber Jesus. Tirar as “pedras” do coração (brigas, preguiça, egoísmo) abre a estrada para Ele chegar!',
      });
    } catch (e) { K.err(e); }
  }

  function update(dt, t, playing) {
    K.update(dt, t, playing);
    jose.pos.copy(jose.model.position);
    // em cima da ponte, ninguém molha os pés
    if (bridge) for (const m of [donkey, jose.model]) if (Math.abs(m.position.z - zc) < 3.4 && Math.abs(m.position.x - crossX(m.position.z)) < 1.2) m.position.y = Math.max(m.position.y, deckY + 0.06);
  }

  function hint() {
    if (K.cutscene) return 'Acompanhe a história.';
    if (rocksLeft()) return 'Pedras caíram na estrada, mais à frente. Chegue perto de cada uma e aperte E para empurrar.';
    if (!bridge) return stones.some(s => s.known) ? 'Pegue as pedras chatas: no oásis, no alto do morro de pedra a leste (voe!), do outro lado do riacho e na beira dele.' : 'A Sara está no oásis, a oeste do riacho. Ela sabe onde há pedras para a passagem!';
    if (lampsLit() < 5) return 'Os lampiões ficam ao lado da estrada, depois do riacho. Chegue perto e aperte E.';
    return 'Tudo pronto! Acompanhe Maria e José até o fim da estrada.';
  }

  return { start, update, hint };
}
