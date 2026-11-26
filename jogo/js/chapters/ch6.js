// Capítulo 6 · Não Havia Lugar (Lc 2,6-7). Belém lotada, à noite: nenhuma hospedaria tem lugar,
// a filha do hospedeiro brinca de esconde-esconde com a chave e a anjinha prepara a gruta dos animais.
import * as THREE from 'three';
import { terrainHeight as H, person, V, mat, rng, glow, sheepModel } from '../world.js';
import { kit, LOOKS } from './kit.js';
import { donkeyModel, oxModel, animateQuad, stableModel, mangerModel, bigStarModel } from '../models.js';

// a encosta da gruta a leste e morrinhos em volta da cidade
export const TERRAIN = { hills: [[38, -20, 7, 150], [-34, -26, 4, 160], [-30, 30, 3, 120]], flat: 16, ring: 56, bumps: 0.8 };
const JOSE = 'José', MARIA = 'Maria', SIMAO = 'Simão', RUTE = 'Rute';

export function build(ctx) {
  const { world, scene, player, ui, sfx, cam, tween } = ctx;
  const K = kit(ctx, 6);
  world.buildEnvironment({ path: [[0, 44], [0, 8], [-8, -2], [14, -12], [26, -16]], sky: 'night', ground: 'meadow', snowfall: false });

  // ---------- Belém: muralha, portão e ruas cheias ----------
  const stoneM = mat('#b9ad98', { roughness: 0.9 });
  for (const sx of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(3, 7, 3), stoneM); t.position.set(sx * 4, H(sx * 4, 34) + 3.2, 34); world.static.add(t); world.addBox(sx * 4, 34, 1.6, 1.6, H(sx * 4, 34) + 6.7);
    const w = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 1.6), stoneM); w.position.set(sx * 14.5, H(sx * 14, 34) + 1.8, 34); world.static.add(w); world.addBox(sx * 14.5, 34, 9, 0.9, H(sx * 14, 34) + 3.8);
  }
  const arch = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, 3), stoneM); arch.position.set(0, H(0, 34) + 6.2, 34); world.static.add(arch);
  const inns = [
    { x: -13, z: 14, rot: Math.PI / 2, wall: '#ead8b4', awning: '#c94a3a' },
    { x: 13, z: -6, rot: -Math.PI / 2, wall: '#e4cfa6', awning: '#2e7d5c' },
    { x: -12, z: -14, rot: Math.PI / 2 - 0.2, wall: '#f2e8d4', awning: '#3f72c8' },
  ].map(o => world.flatHouse({ ...o, w: 7, d: 5.5, h: 3.4, upper: true }));
  const houses = [
    [-12, 26, Math.PI / 2], [12, 24, -Math.PI / 2], [13, 13, -Math.PI / 2], [-13, 3, Math.PI / 2], [12, -18, -Math.PI / 2],
    [-2, -24, 0], [-22, 8, Math.PI / 2], [22, 6, -Math.PI / 2], [-22, -4, Math.PI / 2], [6, -26, 0.1],
  ].map(([x, z, rot], i) => world.flatHouse({ x, z, rot, wall: ['#efe2c6', '#e4cfa6', '#f2e8d4', '#dcc39a', '#ead8b4'][i % 5], upper: i % 3 === 0, awning: i % 4 === 1 ? '#c98a3a' : null }));
  world.well(-3, 6);
  world.stall(6, 18, -Math.PI / 2, '#d6303d', 'fruit'); world.stall(-6, 21, Math.PI / 2, '#d89a2e', 'bread'); world.stall(6, 0, -Math.PI / 2, '#3b6fd0', 'flowers');
  for (const [x, z] of [[8.2, 21.6], [8.8, 20.4], [-7.5, 2], [16.5, -1.5]]) world.barrel(x, z);
  world.crate(9, 22.8, 0.9, 0.3); world.crate(-8, 26, 0.8, 0.2); world.cart(-5.5, 27.5, 0.3);
  // tenda do recenseamento (soldados romanos)
  {
    const g = new THREE.Group(); g.position.set(9.5, H(9.5, 8), 8); g.rotation.y = -Math.PI / 2; world.static.add(g);
    const red = mat('#b8222e', { roughness: 0.8 }), cream = mat('#f1e4c8');
    const roof = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 3.4), red); roof.position.y = 2.7; roof.rotation.x = 0.12; g.add(roof);
    for (const [x, z] of [[-2.3, -1.5], [2.3, -1.5], [-2.3, 1.5], [2.3, 1.5]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.8, 8), mat('#6b4529')); p.position.set(x, 1.35, z); g.add(p); }
    const tb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1), cream); tb.position.set(0, 0.45, -0.3); g.add(tb);
    const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 10), mat('#f6ecd2')); sc.rotation.z = Math.PI / 2; sc.position.set(0.3, 0.95, -0.3); g.add(sc);
    const ban = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.05), red); ban.position.set(-2.3, 2.1, 1.55); g.add(ban);
    const eg = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), mat('#e8bf55', { metalness: 0.6, roughness: 0.3 })); eg.position.set(-2.3, 3.0, 1.55); g.add(eg);
    world.addBox(9.5, 8, 0.8, 1.4, H(9.5, 8) + 0.9);
  }
  // lampiões acesos pelas ruas
  for (const [x, z] of [[2.6, 30], [-2.6, 22], [2.6, 12], [-6, 1], [3, -4], [9, -11], [17, -14], [-5, -10], [22, -15]]) world.lamp(x, z).light();
  // fora da cidade: oliveiras, ovelhas e a encosta com a gruta
  world.olives([[24, 18], [28, 10], [-26, 18], [-28, -12], [20, -30], [-16, -30], [30, -32], [34, -6]].map(([x, z]) => ({ x, z, s: 1.1, ry: x })));
  world.cypresses([[-6, 31], [6, 31], [-18, 30], [18, 30]].map(([x, z]) => ({ x, z, s: 1, ry: x })));
  world.fenceRing(-24, 24, 4.2, 0, 0.6);
  const sheep = [[-24, 23], [-22.5, 25.5], [-25.5, 25.8]].map(([x, z], i) => K.place(sheepModel(), x, z, i * 2));
  K.forest({ seed: 66, n: 90, r0: 36, r1: 95, avoid: (x, z) => Math.hypot(x, z) < 36 || Math.hypot(x - 32, z + 18) < 12 });

  // ---------- A gruta dos animais ----------
  const SX = 31, SZ = -18, SR = -Math.PI / 2;
  const stable = stableModel(world, SX, SZ, SR);
  const sw = stable.userData.toW;
  // rochas da encosta em volta da gruta
  world.rocks([[-1, -3.6], [2.5, -3.4], [-4.6, -1.2], [4.8, -1.4], [-4.8, 2], [5, 1.8]].map(([lx, lz], i) => { const p = sw(lx, 0, lz); return { x: p.x, z: p.z, s: 1.6 + (i % 3) * 0.4, ry: i }; }));
  const manger = mangerModel(false); { const p = sw(0.6, 0, -0.9); K.place(manger, p.x, p.z, SR); }
  // portão de madeira (fechado até achar a chave)
  const gateP = sw(0, 0, 2.6);
  const gate = new THREE.Group(); gate.position.set(gateP.x, H(gateP.x, gateP.z), gateP.z); gate.rotation.y = SR; scene.add(gate);
  const leaf = new THREE.Group(); leaf.position.x = -1.6; gate.add(leaf);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.08), mat('#8a5a3b')); b.position.set(0.3 + i * 0.52, 0.65, 0); leaf.add(b); }
  for (const y of [0.35, 0.95]) { const b = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.1), mat('#6b4529')); b.position.set(1.6, y, 0.05); leaf.add(b); }
  // lamparina da gruta
  const lampP = stable.userData.lantern;
  const lantern = new THREE.Group(); lantern.position.copy(lampP); scene.add(lantern);
  const lglass = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.28), new THREE.MeshStandardMaterial({ color: '#6a6a7a', emissive: '#000000', roughness: 0.3 })); lantern.add(lglass);
  const lcap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.18, 4), mat('#3a2f2a')); lcap.position.y = 0.27; lcap.rotation.y = Math.PI / 4; lantern.add(lcap);
  const lglow = glow('#ffc46b', 4, 0); lantern.add(lglow);
  const llight = new THREE.PointLight('#ffb35a', 0, 14, 1.6); lantern.add(llight);
  // o boi Barnabé pastando na encosta
  const ox = oxModel(); { K.place(ox, 25, -27, 0.4); }

  // ---------- Estrelas (18) ----------
  const sl = [];
  for (let i = 0; i < 6; i++) { const z = 30 - i * 6; sl.push([Math.sin(i) * 1.6, H(0, z) + 1.2, z]); }
  for (const h of [inns[0], inns[1], houses[2], houses[7], houses[5]]) sl.push([h.position.x, h.userData.roofTop + 0.9, h.position.z]);
  sl.push([0, H(0, 34) + 8, 34], [-3, H(-3, 6) + 4.2, 6], [SX, stable.userData.roofTop + 1, SZ], [-24, H(-24, 24) + 1.4, 24], [36, H(36, -20) + 1.4, -20], [-28, H(-28, -12) + 3.6, -12], [26, H(26, -27) + 1.4, -27]);
  K.starsAt(sl);
  world.finalize();

  // ---------- Gente na cidade ----------
  const R = rng(61), PAL = ['#6d6aa0', '#9a7448', '#5d7aa6', '#b0638a', '#2e7d5c', '#c98a3a', '#7a5233', '#8a4a6a', '#4a6a8a', '#a8683f'];
  const someone = (i, o = {}) => person({ color: PAL[i % PAL.length], trim: i % 2 ? '#e8c46a' : null, long: i % 3 !== 0, male: i % 2 === 0, veil: i % 2 ? ['#efe6d6', '#d9c6e8', '#f2d4c4'][i % 3] : null, beard: i % 4 === 0 ? '#4a3426' : null,
    hair: { color: ['#3a2418', '#5a3424', '#2a1a10', '#8a6a48'][i % 4], style: i % 2 ? 'long' : 'short' }, eyes: '#3a2418', lashes: i % 2 === 1, skin: ['#e2b08a', '#f0c4a0', '#c99870', '#eab98f'][i % 4], s: 0.85 + (i % 3) * 0.08, staff: i % 5 === 0, ...o });
  const crowd = [];
  [[-3, 28, 0.4], [3.5, 25, -2.6], [-4.5, 17, 1.2], [4, 15, -1], [-2, 12.5, 2.6], [8, 4, -1.6], [10.5, 10.5, -1.4], [10.5, 5.6, -1.7], [-6, -6, 0.6], [5, -9, -2], [16, -10, -1.4], [-18, 10, 1.6], [-17, 18, 1.5], [18, 18, -1.5]]
    .forEach(([x, z, r], i) => { const m = someone(i); K.place(m, x, z, r); crowd.push(m); world.addCircle(x, z, 0.4); });
  // gente dormindo no telhado da primeira hospedaria (estava lotada!)
  for (const [lx, lz, i] of [[-1.6, 1.2, 3], [1.4, 1.4, 6]]) { const p = inns[0].userData.toW(lx, 0, lz); const m = someone(i); m.rotation.set(-Math.PI / 2, 0, 0, 'YXZ'); m.position.set(p.x, inns[0].userData.top + 0.25, p.z); scene.add(m); }
  // quem passeia pela rua
  const walkers = [[[-1.5, 30], [-1.5, 14]], [[2, 2], [16, -12]], [[-8, -3], [-8, 18]], [[1.5, 26], [8, 13]]].map(([a, b], i) => {
    const m = someone(i + 3); K.place(m, a[0], a[1]); const w = { m, a, b, go: 1 };
    const loop = () => { if (!ctx.alive) return; const [x, z] = w.go ? w.b : w.a; w.go = 1 - w.go; K.walkTo(m, x, z, 1.3 + (i % 2) * 0.3).then(() => ctx.wait(1 + i).then(loop)); };
    loop(); return w;
  });
  const soldier = K.npc({ name: 'Soldado', x: 11.8, z: 10.6, face: -Math.PI / 2, look: { color: '#b8222e', trim: '#e8bf55', belt: '#6b4a2e', male: true, boots: '#6b4a2e', tights: '#e6c9a0', hair: { color: '#3a2418', style: 'short' }, eyes: '#3a2418', skin: '#e2b08a', s: 1.05 },
    lines: () => [{ who: 'Soldado', text: 'Ordem de César! Todos devem dar o nome para o recenseamento. Venham amanhã cedo, a fila hoje já acabou!' }] });

  // ---------- As hospedarias ----------
  const KEEP = [
    { name: 'Hospedeiro', look: { color: '#7a5233', sash: '#c99b5a', long: true, male: true, hair: { color: '#2a1a10', style: 'short' }, beard: '#2a1a10', eyes: '#2a1a10', skin: '#c99870', s: 1.08 },
      lines: [
        { who: 'Hospedeiro', text: 'Lugar? Hoje?! Não tem nem um cantinho! Até no telhado tem gente dormindo, olha lá em cima!' },
        { who: 'Hospedeiro', text: 'Belém está cheia por causa do recenseamento. Sinto muito!' }] },
    { name: 'Hospedeira', look: { color: '#8a4a6a', trim: '#e8c46a', long: true, veil: '#f2d4c4', hair: { color: '#5a3424', style: 'short' }, eyes: '#5a3a22', lashes: true, skin: '#eab98f', s: 1 },
      lines: [
        { who: 'Hospedeira', text: 'Ai, minha filha... uma moça esperando bebê, nesse frio? Mas não tenho lugar, está tudo cheio.' },
        { who: 'Hospedeira', text: 'Tente a hospedaria do Simão, a das listras azuis, do outro lado da rua. Ele tem um coração enorme.' }] },
    { name: SIMAO, look: { color: '#5d7aa6', sash: '#e8c46a', long: true, male: true, hair: { color: '#cfc9c0', style: 'short' }, beard: '#e8e2d8', eyes: '#3b2a1a', skin: '#e8b996', old: true, s: 1.02 },
      lines: [
        { who: SIMAO, text: 'Uma família procurando lugar? Os quartos estão cheios, não sobrou nenhum...' },
        { who: SIMAO, text: 'Mas espere! Eu tenho uma gruta na encosta, a leste, onde guardo meus animais. Não é bonita, mas é quentinha e tranquila.' },
        { who: SIMAO, text: 'Só que a chave do portão está com a minha filha, a Rute. Ela saiu para brincar de esconde-esconde... e ninguém acha aquela menina!' }] },
  ];
  const knocked = [false, false, false];
  const keepers = inns.map((inn, i) => {
    const f = inn.userData.front, m = person(KEEP[i].look); m.visible = false;
    K.place(m, f.x, f.z, inn.rotation.y); K.npcs.push({ name: KEEP[i].name, model: m, static: true, x: f.x, z: f.z, pos: V(), talks: 0 });
    ctx.interact({
      pos: V(f.x, H(f.x, f.z), f.z), r: 2.8, label: 'Bater à porta', enabled: () => K.stage === 1 && !knocked[i],
      fn: () => knock(i),
    });
    return m;
  });
  async function knock(i) {
    ctx.lock(true);
    try {
      sfx.open(); await K.wait(0.15); sfx.open(); await K.wait(0.5);
      if (i === 2 && !(knocked[0] && knocked[1])) {
        await K.say(['(Toc, toc! Ninguém atende. Parece que o dono está ocupado lá dentro...)', 'Tente primeiro as outras hospedarias.']);
        ctx.lock(false); return;
      }
      keepers[i].visible = true;
      await K.say(KEEP[i].lines);
      knocked[i] = true;
      if (i < 2) { keepers[i].visible = false; ui.toast(i === 0 ? 'Não havia lugar... Tente outra hospedaria.' : 'Também não... Procure a hospedaria do Simão!', 3.5); ctx.lock(false); K.refresh(); return; }
      K.stage = 2; ctx.lock(false); K.refresh();
      ui.toast('Ache a Rute! Ouvi uma risadinha perto das barracas da feira...', 5);
    } catch (e) { K.err(e); }
  }

  // ---------- Esconde-esconde da Rute ----------
  const roofH = houses[4];
  const spots = [
    { x: 9.6, z: 23.6, y: null, where: 'Ouvi uma risadinha lá em cima de um telhado, do lado leste...' },
    { x: roofH.position.x, z: roofH.position.z, y: roofH.userData.top + 0.05, where: 'Agora a risadinha veio do curral das ovelhas, perto do portão oeste!' },
    { x: -26.6, z: 22.4, y: null },
  ];
  const rute = person({ color: '#f2a65a', trim: '#fff1d0', hair: { color: '#6b3a1e', style: 'long' }, eyes: '#5a3a22', skin: '#f0c4a0', lashes: true, boots: '#7a4a2b', tights: '#f4efe8', s: 0.74 });
  rute.visible = false; scene.add(rute);
  K.npcs.push({ name: RUTE, model: rute, static: true, x: 0, z: 0, pos: V(), talks: 0 });
  let ri = 0, hiding = false;
  const putRute = () => { const s = spots[ri]; rute.position.set(s.x, s.y ?? H(s.x, s.z), s.z); rute.visible = true; };
  async function found() {
    hiding = true; sfx.star();
    const puff = glow('#fff4c0', 3, 0.9); puff.position.copy(rute.position); puff.position.y += 0.8; scene.add(puff);
    tween(0.8, k => { puff.scale.setScalar(3 + k * 3); puff.material.opacity = 0.9 * (1 - k); }).then(() => scene.remove(puff));
    if (ri < 2) {
      ui.toast(ri === 0 ? 'Rute: “Hihi! Quase me pegou! Mas eu sou rápida!”' : 'Rute: “Uau, você voa?! Não vale! Hihi!”', 3.2);
      rute.visible = false; const w = spots[ri].where; ri++;
      await ctx.wait(1.4); if (!ctx.alive) return;
      putRute(); ui.toast(w, 4.5); K.refresh(); hiding = false; return;
    }
    ctx.lock(true); K.cutscene = true;
    try {
      rute.rotation.y = Math.atan2(player.pos.x - rute.position.x, player.pos.z - rute.position.z);
      await K.say([
        { who: RUTE, text: 'Tá bom, tá bom, você me achou! Você é a melhor em esconde-esconde que eu já vi!' },
        { who: RUTE, text: 'A chave da gruta? Está aqui! Papai mandou entregar? Então toma, pode levar! A gruta fica na encosta, a leste.' },
      ]);
      sfx.item(); ui.toast('Você recebeu a chave da gruta! 🗝️', 3.5);
      K.stage = 3; K.play();
    } catch (e) { K.err(e); }
  }

  // ---------- Preparar a gruta ----------
  let opened = false, lit = false, hay = 0, oxIn = false;
  ctx.interact({
    pos: V(gateP.x, H(gateP.x, gateP.z), gateP.z), r: 3, label: 'Abrir o portão com a chave', enabled: () => K.stage === 3 && !opened,
    fn: () => { opened = true; sfx.lamp(); tween(1.2, k => { leaf.rotation.y = -k * 1.9; }); world.addCircle(sw(-1.6, 0, 2.6).x, sw(-1.6, 0, 2.6).z, 0.3); ui.toast('O portão abriu! Agora prepare a gruta para Maria e José.', 4); K.refresh(); },
  });
  ctx.interact({
    pos: V(lampP.x, H(lampP.x, lampP.z), lampP.z), r: 2.6, h: 5, ph: 3.2, label: 'Acender a lamparina', enabled: () => K.stage === 3 && opened && !lit,
    fn: () => { lit = true; sfx.lamp(); lglass.material.color.set('#ffe6a8'); lglass.material.emissive.set('#ffb84d'); lglass.material.emissiveIntensity = 2; tween(1, k => { llight.intensity = 16 * k; lglow.material.opacity = 0.8 * k; }); ui.toast('A gruta ficou iluminada e aconchegante.', 3); K.refresh(); checkReady(); },
  });
  const onHay = () => { hay++; ui.toast(hay < 3 ? `Palha fresquinha! (${hay}/3)` : 'Toda a palha! A manjedoura está forrada.', 3); K.refresh(); checkReady(); };
  const hayList = [
    K.pickup('hay', -5.4, 27.7, { y: H(-5.4, 27.7) + 1.0, onGet: onHay, enabled: () => K.stage === 3 }),
    K.pickup('hay', houses[7].position.x, houses[7].position.z, { y: houses[7].userData.roofTop - 0.25, onGet: onHay, enabled: () => K.stage === 3 }),
    K.pickup('hay', 24, -6, { onGet: onHay, enabled: () => K.stage === 3 }),
  ];
  function checkReady() {
    if (!(hay >= 3 && lit && opened) || oxIn) return;
    oxIn = true; const p = sw(-2.3, 0, -0.6);
    ui.toast('O boi Barnabé sentiu o cheiro da palha e entrou na gruta! Muuu! 🐂', 4);
    K.walkTo(ox, gateP.x, gateP.z, 1.6).then(() => K.walkTo(ox, p.x, p.z, 1.2)).then(() => { ox.rotation.y = SR + Math.PI / 2 + 0.2; });
    ctx.wait(1).then(() => { if (!ctx.alive) return; K.stage = 4; K.refresh(); ui.toast('A gruta está pronta! Vá buscar Maria e José na praça.', 4.5); });
  }

  // ---------- Maria e José ----------
  const donkey = donkeyModel(); K.place(donkey, -5.6, 10.4, 2.2);
  const rider = person({ ...LOOKS.maria, long: false, kneel: true }); rider.position.set(0, 0.92, -0.08); rider.scale.setScalar(0.95); donkey.add(rider);
  K.npcs.push({ name: MARIA, model: rider, static: true, x: 0, z: 0, pos: V(), talks: 0 });
  const jose = K.npc({
    name: JOSE, x: -4.2, z: 11.4, face: 2.4, collide: false, look: LOOKS.jose, talkR: 3,
    lines: () => [
      { who: JOSE, text: 'Bati em tantas portas, anjinho... ninguém tem lugar. E o bebê pode nascer a qualquer momento.' },
      { who: MARIA, text: 'Calma, José. Deus nos trouxe até aqui. Ele vai preparar um lugar.' },
    ],
    again: () => [{ who: JOSE, text: K.stage === 1 ? 'Procure uma hospedaria com lugar para nós, por favor!' : K.stage === 2 ? 'Uma gruta? Já é uma bênção! Ache a menina com a chave.' : 'Esperamos aqui. Avise quando a gruta estiver pronta!' }],
    enabled: () => K.stage >= 1 && K.stage <= 3,
  });
  const donkeyF = K.follow(donkey, { gap: 2.2, speed: 5.5, r: 0.5 }), joseF = K.follow(jose.model, { gap: 2.0, speed: 5.5, slot: 1 });
  ctx.interact({
    pos: jose.pos, r: 3.2, label: 'Levar Maria e José para a gruta', enabled: () => K.stage === 4 && !donkeyF.on,
    fn: async () => {
      ctx.lock(true);
      try {
        await K.say([{ who: JOSE, text: 'A gruta está pronta? Deus seja louvado! Vamos, Maria.' }, { who: MARIA, text: 'Mostre o caminho, anjinho. Nós seguimos você.' }]);
        donkeyF.on = true; joseF.on = true; K.refresh();
      } catch (e) { K.err(e); return; }
      ctx.lock(false);
    },
  });

  // ---------- Missões ----------
  K.refresh = () => {
    const q = [];
    const nk = knocked.filter(Boolean).length;
    if (K.stage === 1) q.push({ t: `Procure lugar nas hospedarias (${nk}/3)`, done: false });
    if (K.stage === 2) q.push({ t: 'Brinque de esconde-esconde: ache a Rute e a chave', done: false });
    if (K.stage === 3) {
      q.push({ t: 'Abra o portão da gruta', done: opened });
      q.push({ t: `Forre a manjedoura com palha (${hay}/3)`, done: hay >= 3 });
      q.push({ t: 'Acenda a lamparina da gruta', done: lit });
    }
    if (K.stage === 4) q.push({ t: donkeyF.on ? 'Guie Maria e José até a gruta' : 'Busque Maria e José na praça', done: false });
    if (K.stage >= 1 && K.stage <= 4) q.push(K.starQuest());
    ui.setQuests(q); ui.setStars(K.stars.count, K.stars.total);
  };
  K.target = () => {
    if (K.stage === 1) { const i = knocked.findIndex(k => !k); const f = inns[i].userData.front; return V(f.x, 0, f.z); }
    if (K.stage === 2) return V(rute.position.x, rute.position.y, rute.position.z);
    if (K.stage === 3) {
      if (!opened) return V(gateP.x, 0, gateP.z);
      const l = hayList.filter(h => !h.taken).map(h => V(h.x, h.y, h.z)); if (!lit) l.push(V(lampP.x, 0, lampP.z)); return l;
    }
    if (K.stage === 4) return donkeyF.on ? V(gateP.x, 0, gateP.z) : jose.pos;
    return null;
  };

  // ---------- Cenas ----------
  async function start() {
    try {
      K.cutscene = true;
      await K.intro({
        title: 'Não Havia Lugar', sub: 'Belém · Lc 2,6-7', x: 0, z: 28, facing: Math.PI,
        narr: [
          'Maria e José chegaram a Belém já de noite. A cidade estava lotada: gente de todo canto tinha vindo para o recenseamento.',
          'Ruas cheias, soldados romanos anotando nomes... e Maria cansada, esperando o bebê.',
        ],
      });
      cam.shot(V(-1.2, H(-4, 11) + 2, 15.2), V(-4.8, H(-4, 11) + 1.2, 10.6), 1.6);
      await K.say([
        { who: JOSE, text: 'Maria, descanse aqui perto do poço. Precisamos achar uma hospedaria para esta noite.' },
        { who: MARIA, text: 'Vá com o anjinho, José. Eu sinto que o bebê vai chegar logo...' },
        { who: JOSE, text: 'Anjinho, bata na porta das hospedarias. Quem sabe alguém tem um lugar para nós!' },
      ]);
      K.stage = 1; K.play();
      ui.toast('Procure as hospedarias: elas têm toldos coloridos e um andar a mais. Siga a seta!', 5);
    } catch (e) { K.err(e); }
  }

  async function settle() {
    K.stage = 5; K.cutscene = true; ctx.lock(true); donkeyF.on = false; joseF.on = false; ui.setQuests([]);
    try {
      await K.step(ui.fade(1, 0.7));
      const dp = sw(2.4, 0, -0.3), jp = sw(-0.9, 0, 0.9), mp = sw(0.9, 0, 0.3);
      donkey.position.set(dp.x, H(dp.x, dp.z), dp.z); donkey.rotation.y = SR - Math.PI / 2 - 0.3; rider.visible = false;
      const maria = person({ ...LOOKS.maria, kneel: true }); K.place(maria, mp.x, mp.z, SR + 0.4);
      K.npcs.push({ name: MARIA, model: maria, static: true, x: mp.x, z: mp.z, pos: V(), talks: 0 });
      jose.model.position.set(jp.x, H(jp.x, jp.z), jp.z); jose.model.rotation.y = SR + 0.9; jose.static = true;
      const op = sw(-2.3, 0, -0.6); ox.position.set(op.x, H(op.x, op.z), op.z); ox.rotation.y = SR + Math.PI / 2 + 0.2;
      const pp = sw(2.6, 0, 3.4); player.place(pp.x, pp.z, SR + Math.PI + 0.5);
      const c0 = sw(0.4, 1.9, 6.4), l0 = sw(0, 1.1, -0.3);
      cam.cut(V(c0.x, H(c0.x, c0.z) + 1.9, c0.z), V(l0.x, H(l0.x, l0.z) + 1.1, l0.z));
      await K.step(ui.fade(0, 1));
      await K.say([
        { who: JOSE, text: 'Não é um palácio, Maria. Eu queria tanto dar a você um lugar melhor...' },
        { who: MARIA, text: 'Tem tudo o que precisamos, José: palha limpinha, uma luz acesa, o calor dos animais... e Deus conosco.' },
        '(O boi Barnabé deita pertinho da manjedoura, e o burrinho Pipoca encosta a cabeça em Maria.)',
      ]);
      // Simão e Rute chegam para ajudar
      const sp = sw(3.6, 0, 3.2), rp = sw(2.6, 0, 4.2);
      const simao = person(KEEP[2].look); K.place(simao, sp.x, sp.z, SR + Math.PI - 0.4); K.npcs.push({ name: SIMAO, model: simao, static: true, x: 0, z: 0, pos: V(), talks: 0 });
      rute.visible = true; rute.position.set(rp.x, H(rp.x, rp.z), rp.z); rute.rotation.y = SR + Math.PI - 0.2;
      await K.say([
        { who: RUTE, text: 'Trouxe um pão quentinho e água fresca! E eu nunca mais vou me esconder com a chave, prometo!' },
        { who: SIMAO, text: 'Fiquem em paz. Se precisarem de qualquer coisa, é só chamar.' },
        'Enquanto estavam ali, completaram-se os dias para o parto.',
      ]);
      // uma estrela nova começa a brilhar
      const star = bigStarModel(); const top = sw(-1, 0, -2); star.position.set(top.x, H(top.x, top.z) + 20, top.z); star.scale.setScalar(0.01); scene.add(star);
      K.extra.push((dt, t) => { star.lookAt(cam.pos); star.rotateZ(Math.sin(t * 0.6) * 0.08); });
      const cs = sw(2.5, 0, 17);
      cam.shot(V(cs.x, H(cs.x, cs.z) + 2.2, cs.z), V(top.x, H(top.x, top.z) + 8, top.z), 0.6);
      ctx.stopMusic(); sfx.choir(10);
      await K.step(tween(5, k => star.scale.setScalar(0.01 + k * 0.6)));
      await K.say([
        'Naquela noite, uma estrela nova, enorme e brilhante, apareceu no céu bem em cima da gruta...',
        'Alguma coisa muito especial estava para acontecer em Belém.',
      ]);
      ctx.startMusic();
      await K.complete({
        verse: 'Enquanto estavam ali, completaram-se os dias para o parto... porque não havia lugar para eles na hospedaria.',
        ref: 'Lc 2,6-7',
        reflect: 'Não havia lugar nas hospedarias, mas houve gente generosa como o Simão e a Rute. Neste Advento, como você pode abrir espaço no seu coração (e na sua casa) para Jesus chegar?',
      });
    } catch (e) { K.err(e); }
  }

  function update(dt, t, playing) {
    K.update(dt, t, playing);
    jose.pos.copy(jose.model.position);
    if (!oxIn) { animateQuad(ox, t, dt, 0); ox.userData.head.rotation.x = 0.4 + Math.sin(t * 1.6) * 0.1; }
    else if (!K.movers.some(w => w.m === ox)) animateQuad(ox, t, dt, 0);
    if (!donkeyF.on && K.stage < 5) animateQuad(donkey, t, dt, 0);
    sheep.forEach((s, i) => { s.position.y = H(s.position.x, s.position.z) + Math.abs(Math.sin(t * 2 + i)) * 0.03; });
    if (rute.visible) K.anim(rute, t, dt, { talk: ui.speaker === RUTE, speed: 0 });
    if (rute.visible && K.stage === 2) { rute.position.y = (spots[ri].y ?? H(rute.position.x, rute.position.z)) + Math.abs(Math.sin(t * 5)) * 0.12; rute.rotation.y += dt * 1.2; }
    if (playing && K.stage === 2 && !hiding && rute.visible) {
      const s = spots[ri], dy = player.pos.y - (s.y ?? H(s.x, s.z));
      if (Math.hypot(player.pos.x - s.x, player.pos.z - s.z) < 3 && Math.abs(dy) < 2.2) found().catch(K.err);
    }
    if (K.stage === 2 && !rute.visible && !hiding) putRute();
    if (playing && K.stage === 4 && donkeyF.on && Math.hypot(player.pos.x - gateP.x, player.pos.z - gateP.z) < 6 && Math.hypot(donkey.position.x - gateP.x, donkey.position.z - gateP.z) < 9) settle();
  }

  function hint() {
    if (K.cutscene) return 'Acompanhe a história.';
    if (K.stage === 1) return knocked[0] && knocked[1] ? 'A hospedaria do Simão tem o toldo azul, a sudoeste da praça.' : 'As hospedarias têm um andar a mais e toldo colorido. Chegue na porta e aperte E para bater.';
    if (K.stage === 2) return ri === 0 ? 'A Rute está escondida perto das barracas da feira, entre os barris.' : ri === 1 ? 'A Rute subiu num telhado do lado leste! Voe até lá.' : 'Ela está no curral das ovelhas, perto do portão oeste.';
    if (K.stage === 3) return !opened ? 'A gruta fica na encosta a leste. Abra o portão com a chave.' : hay < 3 ? 'Tem palha na carroça perto do portão da cidade, em cima de um telhado a leste e no campo perto da gruta.' : 'Acenda a lamparina pendurada na entrada da gruta.';
    if (K.stage === 4) return donkeyF.on ? 'Leve Maria e José até o portão da gruta, a leste.' : 'Maria e José estão perto do poço, na praça.';
    return 'Acompanhe a história.';
  }

  return { start, update, hint };
}
