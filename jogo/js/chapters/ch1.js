// Capítulo 1 · A Anunciação (Lc 1,26-38). Nazaré da Galileia, ao entardecer.
import * as THREE from 'three';
import {
  terrainHeight as H, person, gabrielModel, doveModel, sheepModel, lilyModel, glow, decal, rng, setWings, V, reindeerModel, animateReindeer, animateChar,
} from '../world.js';
import { CHAPTERS } from '../chapters.js';
import { wreathSVG } from '../ui.js';

const G = 'Gabriel', MARIA = 'Maria';

export function build(ctx) {
  const { world, scene, player, ui, sfx, cam, tween, wait } = ctx;
  const live = () => { if (!ctx.alive) throw new Error('capítulo encerrado'); };
  const step = async p => { await p; live(); };

  world.buildEnvironment({ path: [[0, 40], [0, 0], [0, -42]] });

  // ---------- Vila ----------
  const houses = [
    { x: -12, z: -12, rot: 0, style: 'timber', wall: '#f3e6cf', trim: '#5b3a24', roof: '#a8423a' },
    { x: 12, z: -12, rot: 0, style: 'stone', wall: '#c9c4d2', trim: '#4f3a22', roof: '#4f6a8f', porch: true },
    { x: -14, z: 3, rot: Math.PI / 2, wall: '#c08a55' },
    { x: 14, z: 3, rot: -Math.PI / 2, style: 'timber', wall: '#f0d2b0', trim: '#4a3020', roof: '#3f6b4f' },
    { x: -11, z: 17, rot: Math.PI / 2, w: 5.5, style: 'stone', wall: '#d8d0c4', roof: '#7a3f5a', tower: true },
    { x: 11, z: 17, rot: -Math.PI / 2, w: 5.5, wall: '#b8794a', porch: true, roof: '#8a3b3b' },
    { x: 24, z: -5, rot: -Math.PI / 2, style: 'timber', stories: 2, wall: '#d9e4f0', trim: '#4a3a5a', roof: '#8a3b3b' },
    { x: -22, z: -22, rot: 0.3, style: 'stone', stories: 2, wall: '#bdb6a8', roof: '#3f5a7a' },
    { x: 21, z: -24, rot: -0.3, style: 'timber', wall: '#f5dcc0', trim: '#5b3a24', roof: '#4f6a8f', tower: true },
    { x: -31, z: -6, rot: Math.PI / 2, stories: 2, wall: '#a98a52', roof: '#5a3a24', porch: true },
  ].map(o => world.house(o));
  const carp = world.house({ x: -24, z: 9, w: 7, d: 6, h: 3.8, rot: Math.PI / 2, wall: '#9a6538' });
  world.logs(-19.4, 5.2, 0);
  const maryHouse = world.house({ x: 0, z: -46, w: 6.5, d: 5.5, h: 3.5, rot: 0, wall: '#d9b88a', trim: '#6b4a2e', glowColor: '#ffc45e' });
  world.well(0, 0);

  // Enfeites: árvore de Natal na praça, feirinha, bonecos de neve, varais de luz...
  world.xmasTree(-6.8, -6.2, 1);
  world.stall(5.9, 9.5, -Math.PI / 2, '#d6303d', 'fruit');
  world.stall(-6.2, -16, Math.PI / 2, '#2e7d3c', 'bread');
  world.stall(6.2, -17.5, -Math.PI / 2, '#3b6fd0', 'flowers');
  world.snowman(-5.2, 21.5, 0.6); world.snowman(8.5, -5.8, -0.9, '#2e7d3c'); world.snowman(30, 6, -1.2, '#3b6fd0');
  world.bench(4.6, -7.2, -0.6); world.bench(-4.4, 6.8, 2.4);
  world.lightString(-3.6, 12.5, 3.6, 12.5); world.lightString(-3.6, -9, 3.6, -9); world.lightString(-3.6, -25, 3.6, -25);
  world.cart(16.5, -16.5, 0.6);
  for (const [x, z, s] of [[-28.6, 6.2, 1], [-28.6, 7.4, 0.9]]) world.barrel(x, z);
  world.crate(-28.4, 11.4, 1, 0.2); world.crate(-28.3, 12.4, 0.8, -0.3);
  world.barrel(9, 12.8); world.crate(8.2, 13.8, 0.85, 0.4);
  world.barrel(-17.6, -9.2); world.crate(17.4, -8.6, 1, 0.5);
  for (const h of houses) { const u = h.userData; world.gifts(u.frontL.x, u.frontL.z, 2, Math.floor(h.position.x)); world.holly(u.frontR.x, u.frontR.z, 0.8); }
  for (const [x, z] of [[-4.5, 32], [4.6, 34], [-3.9, -37.5], [4.3, -36.8], [9, 25], [-9, 24], [17.5, 9], [-17.5, -2]]) world.holly(x, z, 0.9);

  // Jardim de lírios de Maria (decoração) e luz quente
  for (const [x, z] of [[-2.4, -42.4], [-3, -41.6], [2.5, -42.3], [3.1, -41.5], [-2.1, -41.2], [2.2, -41.1]]) {
    const l = lilyModel(false); l.position.set(x, H(x, z), z); l.scale.setScalar(0.8); scene.add(l);
  }
  const ml = new THREE.PointLight('#ffb760', 18, 16, 1.6); ml.position.set(0, H(0, -42) + 2.6, -41.5); scene.add(ml);

  // Natureza
  const R = rng(42), pines = [];
  const blocked = (x, z) => {
    const r = Math.hypot(x, z);
    if (r < 27) return true;
    if (Math.abs(x) < 5 && (z > 20 || z < -18)) return true;
    if (Math.hypot(x, z + 46) < 12) return true;
    if (Math.hypot(x - 36, z - 18) < 10) return true;
    if (Math.hypot(x + 30, z - 26) < 8) return true;
    if (Math.hypot(x + 45, z - 40) < 3.4) return true;
    for (const h of houses) if (Math.hypot(x - h.position.x, z - h.position.z) < 6) return true;
    return false;
  };
  for (let i = 0; i < 230 && pines.length < 170; i++) {
    const a = R() * Math.PI * 2, d = 27 + R() * 70, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (!blocked(x, z)) pines.push({ x, z, s: 0.9 + R() * 0.8, ry: R() * 6 });
  }
  for (let i = 0; i < 70; i++) {
    const a = R() * Math.PI * 2, d = 3.6 + R() * 12, x = -45 + Math.cos(a) * d, z = 40 + Math.sin(a) * d;
    if (Math.hypot(x + 30, z - 26) > 7) pines.push({ x, z, s: 1 + R() * 0.7, ry: R() * 6 });
  }
  for (const [x, z, s] of [[-6, 26, 0.8], [6, 25, 0.9], [-8, 31, 1], [7.5, 31, 0.85], [-17, -4, 0.8], [18, 12, 0.8], [-6, -24, 0.9], [7, -20, 0.85]]) pines.push({ x, z, s, ry: x });
  world.pines(pines);
  world.olives([[31, 13], [40, 14], [33, 23], [41, 22], [37, 10], [29, 20], [-6, -43], [6.5, -42], [-8, -49], [8, -49.5], [-7, -34], [-9.5, -39]]
    .map(([x, z]) => ({ x, z, s: 1 + R() * 0.3, ry: R() * 6 })));
  const rocks = [];
  for (let i = 0; i < 40; i++) { const a = R() * Math.PI * 2, d = 18 + R() * 50, x = Math.cos(a) * d, z = Math.sin(a) * d; if (!blocked(x, z) || d > 30) rocks.push({ x, z, s: 0.4 + R() * 0.8, ry: R() * 6 }); }
  world.rocks(rocks);

  // Ovelhas de Natan
  world.fenceRing(-30, 26, 5, 0, 0.55);
  const sheep = [[-31, 25], [-29, 28], [-32.5, 27.5]].map(([x, z], i) => {
    const s = sheepModel(); s.position.set(x, H(x, z), z); s.rotation.y = i * 2; scene.add(s); return s;
  });

  // Renas perto da entrada da vila
  const deer = [[-3.8, 29.5, 2.4], [4.4, 28.5, -2.2]].map(([x, z, ry]) => {
    const r = reindeerModel(); r.position.set(x, H(x, z), z); r.rotation.y = ry; scene.add(r); world.addCircle(x, z, 0.5); return r;
  });

  // ---------- Personagens ----------
  const npcs = [];
  function npc(def) {
    const m = person(def.look); const y = H(def.x, def.z);
    m.position.set(def.x, y, def.z); m.rotation.y = def.face || 0; scene.add(m);
    world.addCircle(def.x, def.z, 0.45 * (def.look.s || 1));
    const o = { ...def, model: m, talks: 0, base: def.face || 0, pos: V(def.x, y, def.z) };
    npcs.push(o);
    ctx.interact({
      pos: o.pos, r: 2.8, label: `Falar com ${def.name}`, enabled: () => (def.enabled ? def.enabled() : true),
      fn: async () => {
        ctx.lock(true);
        const lines = o.talks === 0 || !def.again ? def.lines() : def.again();
        o.talks++;
        await ui.say(lines);
        if (!ctx.alive) return;
        def.after && def.after();
        ctx.lock(false); refresh();
      },
    });
    return o;
  }

  const mary = person({ color: '#f6efe4', trim: '#e3b94f', mantle: '#3f72c8', veil: '#3f72c8', hair: { color: '#6b4528', style: 'short' }, eyes: '#6b4528', skin: '#f2c9a8', lashes: true, kneel: true, pray: true });
  const maryPos = V(0, H(0, -41.2), -41.2);
  mary.position.copy(maryPos); scene.add(mary); world.addCircle(0, -41.2, 0.5);
  const maryGlow = glow('#fff2c8', 3.2, 0); maryGlow.position.set(0, maryPos.y + 0.9, -41.2); scene.add(maryGlow);

  const gabriel = gabrielModel();
  const gabPos = V(0, H(0, 25) + 2.4, 25);
  gabriel.position.copy(gabPos); gabriel.rotation.y = 0; scene.add(gabriel);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 40, 18, 1, true),
    new THREE.MeshBasicMaterial({ color: '#ffe2a6', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.visible = false; scene.add(beam);
  const dove = doveModel(); dove.visible = false; scene.add(dove);

  // ---------- Objetivos ----------
  const lamps = [[3.8, -3.4], [-19, 14.6], [-24.4, 21], [27, 13.5], [2.9, -30]].map(([x, z]) => {
    const l = world.lamp(x, z);
    ctx.interact({
      pos: l.pos, r: 2.4, label: 'Acender a lamparina', enabled: () => !l.lit && stage >= 1 && stage < 3,
      fn: () => {
        l.light(); lit++; sfx.lamp();
        ui.toast(lit < 5 ? `Lamparina acesa! (${lit}/5)` : 'Todas as lamparinas acesas! Nazaré está brilhando ✨');
        refresh();
      },
    });
    return l;
  });
  const lilySpots = [
    { x: -24, z: 9, y: carp.userData.roofTop + 0.15 },
    { x: 37, z: 18 },
    { x: -45, z: 40 },
  ];
  const lilies = lilySpots.map(sp => {
    const m = lilyModel(true); const y = sp.y ?? H(sp.x, sp.z);
    m.position.set(sp.x, y, sp.z); m.scale.setScalar(1.3); scene.add(m);
    return { m, x: sp.x, y, z: sp.z, taken: false, known: false };
  });

  // Estrelas escondidas (30)
  const sl = [];
  for (let i = 0; i < 6; i++) { const z = 30 - i * 3.6, x = Math.sin(i * 1.1) * 1.8; sl.push([x, H(x, z) + 1.1, z]); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.5, x = Math.cos(a) * 5.6, z = Math.sin(a) * 5.6; sl.push([x, H(x, z) + 1.1, z]); }
  for (const h of houses.slice(0, 4)) sl.push([h.position.x, h.userData.roofTop + 0.9, h.position.z]);
  for (let i = 0; i < 5; i++) { const t = i / 4, x = 19 + t * 14, z = 8 + t * 8; sl.push([x, H(x, z) + 1.1, z]); }
  for (let i = 0; i < 4; i++) { const t = i / 3, x = -34 - t * 8, z = 30 + t * 6.5; sl.push([x, H(x, z) + 1.1, z]); }
  sl.push([-6, H(-6, -43) + 4.4, -43], [6.5, H(6.5, -42) + 4.4, -42], [-1.6, H(-1.6, -32) + 1.1, -32]);
  sl.push([0, H(0, 0) + 5.4, 0], [0, maryHouse.userData.roofTop + 1.0, -46]);
  const stars = world.collectStars(sl.map(([x, y, z]) => ({ x, y, z })));

  world.finalize();

  // ---------- Estado ----------
  let stage = 0, lit = 0, got = 0, cutscene = false;

  function refresh() {
    if (stage === 0 || stage >= 3) { ui.setQuests([]); }
    else if (stage === 1) ui.setQuests([
      { t: `Encontre os lírios brancos (${got}/3)`, done: got >= 3 },
      { t: `Acenda as lamparinas (${lit}/5)`, done: lit >= 5 },
      { t: `Estrelas escondidas (${stars.count}/${stars.total})`, done: stars.count >= stars.total, opt: true },
    ]);
    else ui.setQuests([
      { t: 'Vá até a casa de Maria, ao norte', done: false },
      { t: `Estrelas escondidas (${stars.count}/${stars.total})`, done: stars.count >= stars.total, opt: true },
    ]);
    ui.setStars(stars.count, stars.total);
    if (stage === 1 && got >= 3 && lit >= 5) allReady();
  }

  // ---------- Diálogos ----------
  npc({
    name: 'Rúben', x: -19.6, z: 11.2, face: Math.PI / 2, look: { color: '#6d6aa0', sash: '#c99b5a', long: true, male: true, hair: { color: '#4a3426', style: 'short' }, beard: '#4a3426', eyes: '#3b2a1a', skin: '#e2b08a', s: 1.05 },
    lines: () => [
      { who: 'Rúben', text: 'Shalom, pequeno! Esta é a oficina de José, o carpinteiro. Ele está noivo da Maria.' },
      { who: 'Rúben', text: 'José é um homem justo: trabalhador, honesto e de poucas palavras. Faz as melhores mesas da Galileia!' },
      { who: 'Rúben', text: 'Hoje cedo vi uma flor branca brilhando lá em cima do telhado da oficina. Como será que foi parar lá? Só alguém com asas para pegar!' },
      { who: 'Rúben', text: 'Dica de quem conserta telhado: pule e, lá no alto, bata as asas mais vezes. Segurando, você plana.' },
    ],
    again: () => [{ who: 'Rúben', text: lilies[0].taken ? 'Você pegou a flor do telhado! José vai rir quando eu contar.' : 'A flor ainda está lá no telhado. Bata as asas, pequeno!' }],
    after: () => { lilies[0].known = true; },
  });
  npc({
    name: 'Débora', x: 7.4, z: 19, face: -Math.PI / 2 + 0.6, look: { color: '#5d7aa6', trim: '#d9c08a', long: true, veil: '#efe6d6', hair: { color: '#cfc9c0', style: 'short' }, eyes: '#4a6a8a', lashes: true, old: true, skin: '#e8b996', s: 0.95 },
    lines: () => [
      { who: 'Débora', text: 'Que alegria, uma visita! Sou Débora, tecelã desde moça.' },
      { who: 'Débora', text: 'Desde menina escuto as palavras do profeta Isaías: "A virgem conceberá e dará à luz um filho, e o chamará Emanuel", que quer dizer Deus conosco (Is 7,14).' },
      { who: 'Débora', text: 'Todas as noites eu peço: "Senhor, deixa-me ver o Messias". Sinto no coração que esse dia está perto...' },
      { who: 'Débora', text: 'Se procura lírios, suba a colina a leste, entre as oliveiras. É lá que floresce o lírio mais bonito da Galileia.' },
    ],
    again: () => [{ who: 'Débora', text: 'Emanuel... Deus conosco. Já pensou, Deus pertinho da gente?' }],
    after: () => { lilies[1].known = true; },
  });
  npc({
    name: 'Natan', x: -24, z: 25, face: -Math.PI / 2, look: { color: '#9a7448', belt: '#6b4a2e', male: true, boots: '#6b4a2e', tights: '#c9a27a', hair: { color: '#3a2618', style: 'short' }, eyes: '#4a3020', skin: '#dba67e', staff: true, s: 0.88 },
    lines: () => [
      { who: 'Natan', text: 'Ei! Devagar, para não assustar minhas ovelhas! Eu sou Natan, pastor igual ao meu avô.' },
      { who: 'Natan', text: 'Meu avô diz que o Messias vai ser descendente do rei Davi, que também era pastor, lá em Belém. Já imaginou? Um rei pastor!' },
      { who: 'Natan', text: 'Ontem vi um brilho branco no meio do bosque de pinheiros, ali a sudoeste. Deve ser um dos seus lírios!' },
      { who: 'Natan', text: 'E tem uma lamparina apagada perto da cerca. Acende pra mim? As ovelhas ficam mais calmas com luz.' },
    ],
    again: () => [{ who: 'Natan', text: 'Bééé! Brincadeira, sou eu mesmo. O bosque fica a sudoeste!' }],
    after: () => { lilies[2].known = true; },
  });
  npc({
    name: MARIA, x: 0, z: -41.2, face: 0, look: {}, enabled: () => stage < 2,
    lines: () => [
      { who: MARIA, text: 'A paz do Senhor esteja com você, pequenino.' },
      { who: MARIA, text: 'Eu gosto de rezar aqui fora quando o céu fica dourado. Parece que Deus está bem pertinho...' },
    ],
  });
  // remove o modelo duplicado criado pelo npc() de Maria (usamos o modelo ajoelhado)
  { const o = npcs[npcs.length - 1]; scene.remove(o.model); o.model = mary; o.static = true; }

  ctx.interact({
    pos: V(gabPos.x, gabPos.y - 2.4, gabPos.z), r: 4, label: 'Falar com Gabriel', enabled: () => stage === 1,
    fn: async () => {
      ctx.lock(true);
      const miss = [];
      if (got < 3) miss.push(`${3 - got} ${3 - got === 1 ? 'lírio' : 'lírios'}`);
      if (lit < 5) miss.push(`${5 - lit} ${5 - lit === 1 ? 'lamparina' : 'lamparinas'}`);
      const hint = lilies.some(l => !l.taken && !l.known) ? 'Converse com os moradores: eles sabem onde os lírios floresceram.' : 'Siga a seta dourada no alto da tela.';
      await ui.say([
        { who: G, text: `Ainda faltam ${miss.join(' e ')}. ${hint}` },
        { who: G, text: ['Coragem! O Senhor ama os corações dispostos.', 'Nada é pequeno quando é feito com amor.', 'Toda luz acesa hoje prepara o caminho do Salvador.'][Math.floor(Math.random() * 3)] },
      ]);
      if (!ctx.alive) return;
      ctx.lock(false);
    },
  });

  // ---------- Sequências ----------
  async function start() {
    try {
      player.place(0, 33, Math.PI);
      cam.yaw = 0; cam.pitch = 0.28; cam.follow(); cam.snap();
      ui.setStars(0, stars.total); ui.setQuests([]); ui.setArrow(null);
      await step(ui.fade(0, 1.4));
      await step(ui.titleCard('Capítulo 1', 'A Anunciação', 'Nazaré da Galileia · Lc 1,26-38'));
      await step(ui.say([
        'Há mais de dois mil anos, numa pequena vila da Galileia chamada Nazaré, o povo de Israel esperava o Salvador prometido por Deus.',
        'Naquela tarde, enquanto o céu ficava dourado, um pequeno anjo foi enviado do Céu com uma missão muito especial...',
      ]));
      cam.shot(V(3.5, gabPos.y + 0.2, 31), V(0, gabPos.y - 0.2, 25), 2.2);
      await step(ui.say([
        { who: G, text: 'Paz a você, pequeno mensageiro! Eu sou Gabriel, aquele que está diante de Deus.' },
        { who: G, text: 'Hoje o Altíssimo vai realizar algo que o mundo espera há séculos, aqui mesmo, nesta pequena Nazaré.' },
        { who: G, text: 'Ajude-me a preparar tudo: encontre os 3 lírios brancos que floresceram pela vila e acenda as 5 lamparinas para que Nazaré brilhe.' },
        { who: G, text: 'Converse com os moradores, eles sabem muita coisa. E lembre-se: você tem asas! No ar, bata as asas para subir mais alto.' },
      ]));
      cam.follow();
      stage = 1; refresh();
      ctx.lock(false);
      ui.toast(ctx.input.touch ? 'Joystick: andar e virar · Arraste à direita: girar · Botão de asas: voar' : 'W/S: andar · A/D: virar · Espaço/Enter: voar · E: conversar · ? regras · 💡 dica', 6);
    } catch (e) { /* capítulo encerrado */ }
  }

  async function allReady() {
    stage = 1.5; ctx.lock(true); ui.setArrow(null);
    try {
      await step(wait(0.6));
      sfx.done();
      await step(ui.say([
        { who: G, text: 'Muito bem, pequeno mensageiro! Nazaré nunca brilhou tanto.' },
        { who: G, text: 'Agora chegou a hora. Vá até a casa de Maria, ao norte, no fim do caminho. Eu encontro você lá.' },
      ]));
      tween(2.5, t => { if (stage >= 3) return; gabriel.position.y = gabPos.y + t * 30; gabriel.scale.setScalar(1 - t * 0.8); }).then(() => { if (stage < 3) gabriel.visible = false; });
      stage = 2; refresh(); ctx.lock(false);
    } catch (e) { }
  }

  async function annunciation() {
    stage = 3; cutscene = true; ctx.lock(true); ui.setArrow(null); refresh();
    const my = maryPos.y;
    try {
      ctx.stopMusic();
      await step(ui.fade(1, 0.7));
      player.place(-3.6, -36.2, Math.atan2(3.6, -5));
      cam.cut(V(7, my + 2.6, -33), V(0, my + 1.4, -39.2));
      gabriel.visible = true; gabriel.scale.setScalar(1); gabriel.rotation.y = Math.PI;
      gabriel.position.set(0, my + 16, -37);
      beam.visible = true; beam.position.set(0, my + 20, -37);
      await step(ui.fade(0, 1));
      await step(ui.say(['Ao entardecer, Maria rezava em silêncio. De repente, uma luz suave encheu todo o pátio...']));
      sfx.choir(14);
      await step(tween(3.6, t => { gabriel.position.y = my + 16 - (16 - 0.7) * t; beam.material.opacity = 0.13 * t; }));
      await step(ui.say([{ who: G, text: 'Alegra-te, cheia de graça! O Senhor está contigo.' }]));
      cam.shot(V(1.5, my + 1.5, -37.7), V(0, my + 0.95, -41.2), 2);
      await step(ui.say(['Maria ficou perturbada com essas palavras e se perguntava o que significava aquela saudação.']));
      cam.shot(V(-2.2, my + 1.9, -42.4), V(0, my + 2, -37), 2);
      await step(ui.say([
        { who: G, text: 'Não tenhas medo, Maria! Encontraste graça diante de Deus.' },
        { who: G, text: 'Eis que conceberás e darás à luz um filho, e lhe porás o nome de JESUS.' },
        { who: G, text: 'Ele será grande e será chamado Filho do Altíssimo. O Senhor Deus lhe dará o trono de Davi, seu pai, e o seu Reino não terá fim.' },
      ]));
      cam.shot(V(1.5, my + 1.5, -37.7), V(0, my + 0.95, -41.2), 2);
      await step(ui.say([{ who: MARIA, text: 'Como acontecerá isso, se eu não conheço homem algum?' }]));
      cam.shot(V(-2.2, my + 1.9, -42.4), V(0, my + 2, -37), 2);
      await step(ui.say([
        { who: G, text: 'O Espírito Santo virá sobre ti, e o poder do Altíssimo te cobrirá com a sua sombra. Por isso, o Santo que vai nascer será chamado Filho de Deus.' },
        { who: G, text: 'Também Isabel, tua parenta, concebeu um filho em sua velhice. Para Deus, nada é impossível.' },
      ]));
      cam.shot(V(0, my + 1.4, -37.3), V(0, my + 1.0, -41.2), 1.4);
      await step(wait(1.2));
      await step(ui.say([{ who: MARIA, text: 'Eis aqui a serva do Senhor. Faça-se em mim segundo a tua palavra.' }]));
      // O Espírito Santo desce sobre Maria
      sfx.glory();
      cam.shot(V(5.5, my + 3.2, -35.5), V(0, my + 2.2, -41.2), 1.6);
      dove.visible = true;
      await step(tween(3.4, t => {
        const r = 1.8 * (1 - t);
        dove.position.set(Math.sin(t * 7) * r, my + 13 - (13 - 2.4) * t, -41.2 + Math.cos(t * 7) * r);
        dove.rotation.y = t * 7 + Math.PI / 2;
        setWings(dove, 0.3 + Math.sin(ctx.time * 14) * 0.6);
        maryGlow.material.opacity = t * 0.9;
      }));
      await step(ui.flash());
      dove.visible = false;
      await step(ui.say(['E o Verbo se fez carne e habitou entre nós (Jo 1,14).']));
      await step(tween(3, t => { gabriel.position.y = my + 0.7 + 18 * t; beam.material.opacity = 0.13 * (1 - t); }));
      gabriel.visible = false; beam.visible = false;
      await step(ui.say([
        'E o anjo retirou-se de junto dela.',
        { who: G, text: '(lá do alto) Você viu, pequeno mensageiro? Uma jovem de Nazaré disse "sim" a Deus, e o Céu inteiro se alegrou!' },
        { who: G, text: 'Mas a história está só começando... José ainda não sabe de nada. Até breve!' },
      ]));
      ctx.startMusic();
      await complete();
    } catch (e) { }
  }

  async function complete() {
    const s = ctx.save;
    const first = !s.completed.includes(1);
    if (first) s.completed.push(1);
    if (!s.pieces.includes(1)) s.pieces.push(1);
    s.stars[1] = Math.max(s.stars[1] || 0, stars.count);
    ctx.persist();
    await step(ui.card(`
      <div class="card-kicker">Palavra de Deus</div>
      <p class="verse">“Eis aqui a serva do Senhor. Faça-se em mim segundo a tua palavra.”</p>
      <div class="ref">Lc 1,38</div>
      <div class="reflect"><b>Para você:</b> Maria era bem jovem quando disse “sim” a Deus, mesmo sem entender tudo. Deus também conta com o seu “sim”, do jeitinho que você é, hoje.</div>`));
    sfx.done();
    await step(ui.card(`
      <div class="card-kicker">Capítulo 1 concluído</div>
      <div class="reward-ic">✦</div>
      <h2>Peça do presépio: ${CHAPTERS[0].piece}</h2>
      <p>Estrelas encontradas: <b>${stars.count}/${stars.total}</b>${stars.count < stars.total ? '<br><small>Jogue de novo para achar todas!</small>' : ' 🌟 Todas!'}</p>
      <div class="mini-wreath">${wreathSVG([true, s.completed.includes(3), s.completed.includes(5), s.completed.includes(6)], s.completed.includes(7))}</div>
      <p>${first ? 'A <b>1ª vela do Advento</b> foi acesa: a vela da esperança.' : 'A 1ª vela do Advento continua acesa.'}</p>
      <p><small>Próximo: <b>Capítulo 2 · O Sonho de José</b> (em breve)</small></p>`, 'Voltar ao menu'));
    ctx.finish();
  }

  // ---------- Loop ----------
  const tmp = V();
  function update(dt, t, playing) {
    // estrelas
    tmp.copy(player.pos); tmp.y += 0.8;
    stars.update(t, playing ? tmp : V(0, -999, 0), () => {
      sfx.star(); ui.setStars(stars.count, stars.total, true); refresh();
      if (stars.count === stars.total) ui.toast('Você encontrou todas as estrelas! 🌟');
    });
    // lírios
    for (const l of lilies) {
      if (l.taken) continue;
      l.m.rotation.y = t * 0.8; l.m.position.y = l.y + Math.sin(t * 2) * 0.1;
      if (playing && stage >= 1 && stage < 3 && tmp.distanceTo(V(l.x, l.y + 1, l.z)) < 1.8) {
        l.taken = true; got++; sfx.item();
        tween(0.6, k => { l.m.scale.setScalar(1.3 * (1 - k)); l.m.position.y = l.y + k * 2; }).then(() => { l.m.visible = false; });
        ui.toast(got < 3 ? `Você encontrou um lírio! (${got}/3)` : 'Os 3 lírios! Símbolo da pureza de Maria.');
        refresh();
      }
    }
    // NPCs olham para o anjinho
    for (const n of npcs) {
      if (n.static) continue;
      const dx = player.pos.x - n.x, dz = player.pos.z - n.z, d = Math.hypot(dx, dz);
      const target = d < 7 && playing ? Math.atan2(dx, dz) : n.base;
      let a = target - n.model.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a));
      n.model.rotation.y += a * Math.min(1, dt * 4);
      n.model.position.y = H(n.x, n.z);
      animateChar(n.model, t, dt, { talk: ui.speaker === n.name });
    }
    animateChar(mary, t, dt, { talk: ui.speaker === MARIA });
    if (gabriel.visible) animateChar(gabriel, t, dt, { talk: ui.speaker === G, air: true });
    deer.forEach((r, i) => animateReindeer(r, t + i * 2, 0));
    sheep.forEach((s, i) => { s.rotation.y += Math.sin(t * 0.3 + i) * 0.003; s.position.y = H(s.position.x, s.position.z) + Math.abs(Math.sin(t * 2 + i)) * 0.03; });
    // Gabriel flutuando
    if (gabriel.visible && !cutscene) {
      gabriel.position.y = (stage < 2 ? gabPos.y : gabriel.position.y) + (stage < 2 ? Math.sin(t * 1.2) * 0.15 : 0);
      if (stage < 2) { const dx = player.pos.x - gabPos.x, dz = player.pos.z - gabPos.z; gabriel.rotation.y = Math.atan2(dx, dz); }
    }
    if (gabriel.visible) setWings(gabriel, 0.35 + Math.sin(t * 1.6) * 0.12);
    // seta-guia
    if (playing && !cutscene) {
      let target = null;
      if (stage === 1) {
        let bd = 1e9;
        const cands = [...lamps.filter(l => !l.lit).map(l => l.pos), ...lilies.filter(l => l.known && !l.taken).map(l => V(l.x, l.y, l.z))];
        for (const c of cands) { const d = Math.hypot(c.x - player.pos.x, c.z - player.pos.z); if (d < bd) { bd = d; target = c; } }
      } else if (stage === 2) target = maryPos;
      if (target && Math.hypot(target.x - player.pos.x, target.z - player.pos.z) > 3) {
        const hf = Math.atan2(-Math.sin(cam.yaw), -Math.cos(cam.yaw));
        const ht = Math.atan2(target.x - player.pos.x, target.z - player.pos.z);
        let r = hf - ht; r = Math.atan2(Math.sin(r), Math.cos(r));
        ui.setArrow(r);
      } else ui.setArrow(null);
      // chegada à casa de Maria
      if (stage === 2 && Math.hypot(player.pos.x - maryPos.x, player.pos.z - maryPos.z) < 6.5) annunciation();
    }
  }

  // Dica do botão 💡
  const LAMP_TIP = ['ao lado do poço, na praça', 'perto da oficina de José', 'perto da cerca das ovelhas', 'a leste, no caminho da colina', 'no caminho para a casa de Maria, ao norte'];
  const LILY_TIP = ['em cima do telhado da oficina de José: pule e bata as asas várias vezes', 'na colina a leste, entre as oliveiras', 'no bosque de pinheiros a sudoeste'];
  function hint() {
    if (stage === 0 || cutscene) return 'Acompanhe a conversa com o anjo Gabriel.';
    if (stage === 2) return 'Siga o caminho de terra para o norte até a casa de Maria, perto das oliveiras.';
    if (stage === 1) {
      const li = lilies.findIndex(l => !l.taken);
      const la = lamps.findIndex(l => !l.lit);
      if (li >= 0 && (la < 0 || Math.random() < 0.5)) return `Tem um lírio ${LILY_TIP[li]}.`;
      if (la >= 0) return `Tem uma lamparina apagada ${LAMP_TIP[la]}. Chegue perto e aperte E.`;
    }
    return 'Siga a seta dourada no alto da tela.';
  }

  return { start, update, hint };
}
