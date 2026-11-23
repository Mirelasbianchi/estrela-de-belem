// Capítulo 2 · O Sonho de José (Mt 1,18-25). Nazaré, à noite.
import * as THREE from 'three';
import { terrainHeight as H, person, gabrielModel, setWings, V, mat } from '../world.js';
import { kit, LOOKS } from './kit.js';
import { campfireModel, lightFire, animateFire } from '../models.js';

export const TERRAIN = { hills: [[26, -20, 5, 130]], flat: 12, ring: 52 };
const JOSE = 'José', G = 'Anjo do Senhor';

export function build(ctx) {
  const { world, scene, player, ui, sfx, cam, tween } = ctx;
  const K = kit(ctx, 2);
  world.buildEnvironment({ path: [[0, 30], [0, -11], [0, 0], [14, 9]], sky: 'night' });

  // ---------- Vila à noite ----------
  const shop = world.house({ x: 0, z: -16, w: 7, d: 6, h: 3.8, rot: 0, wall: '#9a6538', roof: '#5a3a24' });
  const home = world.house({ x: 19, z: 13, w: 6, d: 5, rot: -Math.PI / 2, style: 'timber', wall: '#f0dcbc', trim: '#5b3a24', roof: '#8a3b3b' });
  const houses = [
    { x: -13, z: -10, rot: Math.PI / 2, style: 'stone', wall: '#c9c4d2', roof: '#4f6a8f' },
    { x: -14, z: 6, rot: Math.PI / 2, wall: '#c08a55', porch: true },
    { x: 13, z: -9, rot: -Math.PI / 2, style: 'timber', wall: '#f3e6cf', trim: '#5b3a24', roof: '#a8423a' },
    { x: -11, z: 20, rot: Math.PI / 2, w: 5.5, style: 'stone', wall: '#d8d0c4', roof: '#7a3f5a', tower: true },
    { x: 9, z: 24, rot: -Math.PI / 2, w: 5.5, wall: '#b8794a', roof: '#3f6b4f' },
  ].map(o => world.house(o));
  world.well(0, 0);
  world.logs(5, -11.5, 0.3);
  world.crate(-4.6, -11.6, 1, 0.3); world.barrel(-5.6, -12.6);
  world.xmasTree(-6.5, 3.5, 0.8);
  world.snowman(6.5, 3, -0.6, '#2e7d3c');
  world.bench(-4, -5, 0.8);
  world.lightString(-3.6, 12, 3.6, 12); world.lightString(-3.6, -6, 3.6, -6);
  for (const h of [...houses, home]) world.holly(h.userData.frontR.x, h.userData.frontR.z, 0.8);
  for (const [x, z] of [[3.5, 8], [-3, 16], [10.5, 5]]) world.lamp(x, z).light();
  K.forest({
    seed: 21, n: 150, r0: 26, r1: 90,
    avoid: (x, z) => Math.hypot(x, z) < 26 || (Math.abs(x) < 5 && z > 20) || Math.hypot(x - 26, z + 20) < 9 || Math.hypot(x + 27, z - 16) < 5,
    extra: [[-24, 12, 1.1], [-30, 18, 1], [-25, 21, 0.9], [-31, 12, 1.2], [-6, 27, 0.8], [6, 30, 0.9]],
  });
  world.olives([[24, -16], [29, -22], [22, -24], [31, -15]].map(([x, z]) => ({ x, z, s: 1.1, ry: x })));

  // Pátio da casa de José: fogueira e esteira para dormir
  const yardX = 10.5, yardZ = 10.5;
  const fire = K.place(campfireModel(), yardX + 1.2, yardZ - 2.2);
  const mat0 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 2.0), mat('#b8453a', { roughness: 0.95 }));
  mat0.position.set(yardX - 0.6, H(yardX - 0.6, yardZ) + 0.05, yardZ); scene.add(mat0);

  // ---------- Estrelas (18) ----------
  const sl = [];
  for (let i = 0; i < 5; i++) { const z = 26 - i * 4.5; sl.push([Math.sin(i) * 1.5, H(0, z) + 1.1, z]); }
  for (const h of [houses[0], houses[1], houses[2], home]) sl.push([h.position.x, h.userData.roofTop + 0.9, h.position.z]);
  for (let i = 0; i < 4; i++) { const t = i / 3, x = 20 + t * 9, z = -14 - t * 8; sl.push([x, H(x, z) + 1.1, z]); }
  for (let i = 0; i < 3; i++) { const x = -26 - i * 2, z = 14 + i * 3; sl.push([x, H(x, z) + 1.2, z]); }
  sl.push([0, H(0, 0) + 5.4, 0], [-6.5, H(-6.5, 3.5) + 7, 3.5]);
  K.starsAt(sl);
  world.finalize();

  // ---------- Personagens ----------
  const jose = K.npc({
    name: JOSE, x: 2.8, z: -10.2, face: 0.3, look: LOOKS.jose,
    lines: () => [
      { who: JOSE, text: 'Ah, pequeno mensageiro... desculpe, estou com a cabeça longe esta noite.' },
      { who: JOSE, text: 'O vento soprou forte e espalhou minhas tábuas de cedro pela vila. Sem elas não consigo terminar o trabalho.' },
      { who: JOSE, text: 'São 4 feixes. Um foi parar lá em cima do telhado da oficina! Outro rolou para perto do poço... Os vizinhos devem ter visto os outros.' },
    ],
    again: () => [{ who: JOSE, text: `Ainda faltam ${4 - got} feixes de tábuas. Obrigado por me ajudar.` }],
    enabled: () => K.stage === 1 && got < 4,
  });
  const sara = K.npc({
    name: 'Sara', x: -7.5, z: 8.5, face: 1.2, look: { color: '#e07a8a', trim: '#f4e1b0', hair: { color: '#5a3424', style: 'long' }, eyes: '#5a3a22', skin: '#f0c4a0', lashes: true, boots: '#7a4a2b', tights: '#f4efe8', s: 0.78 },
    lines: () => [
      { who: 'Sara', text: 'Oi, anjinho! Eu também não consigo dormir, o céu está lindo demais!' },
      { who: 'Sara', text: 'Vi uma coisa de madeira voando com o vento lá para o bosque de pinheiros, a oeste. Parecia uma tábua!' },
      { who: 'Sara', text: 'O seu José está tristinho hoje. Ele sempre faz brinquedos para a gente... será que aconteceu alguma coisa?' },
    ],
    again: () => [{ who: 'Sara', text: 'O bosque fica a oeste, depois das casas!' }],
    after: () => { planks[2].known = true; },
  });
  const ruben = K.npc({
    name: 'Rúben', x: -9, z: -3.5, face: 1.9, look: { color: '#6d6aa0', sash: '#c99b5a', long: true, male: true, hair: { color: '#4a3426', style: 'short' }, beard: '#4a3426', eyes: '#3b2a1a', skin: '#e2b08a', s: 1.05 },
    lines: () => [
      { who: 'Rúben', text: 'Boa noite, pequeno! José ainda está trabalhando a esta hora? Ele anda muito pensativo...' },
      { who: 'Rúben', text: 'Dizem que Maria, a noiva dele, está esperando um bebê. José é um homem justo e não quer que ela sofra.' },
      { who: 'Rúben', text: 'Ah, e vi tábuas lá na colina das oliveiras, a sudeste. O vento as levou longe!' },
    ],
    again: () => [{ who: 'Rúben', text: 'A colina das oliveiras fica a sudeste. Voe por cima das casas!' }],
    after: () => { planks[3].known = true; },
  });

  // ---------- Tábuas de cedro (4) ----------
  let got = 0;
  const onGet = () => {
    got++;
    if (got < 4) ui.toast(`Você achou um feixe de tábuas! (${got}/4)`); else ui.toast('Todas as tábuas! Volte até José, na oficina.', 4);
  };
  const planks = [
    K.pickup('plank', 0, -16, { y: shop.userData.roofTop + 0.1, onGet, enabled: () => K.stage === 1 }),
    K.pickup('plank', -2.6, 3.2, { onGet, enabled: () => K.stage === 1 }),
    K.pickup('plank', -27, 16, { onGet, known: false, enabled: () => K.stage === 1 }),
    K.pickup('plank', 26, -20, { onGet, known: false, enabled: () => K.stage === 1 }),
  ];
  const joseFollow = K.follow(jose.model, { gap: 2, speed: 5.5 });

  // ---------- Missões ----------
  K.refresh = () => {
    const q = [];
    if (K.stage === 1) {
      q.push({ t: 'Fale com José, na oficina', done: jose.talks > 0 });
      q.push({ t: `Ache as tábuas de cedro (${got}/4)`, done: got >= 4 });
      if (got >= 4) q.push({ t: 'Volte até José', done: false });
    } else if (K.stage === 2) q.push({ t: 'Leve José até a casa dele (siga a seta)', done: false });
    if (K.stars && K.stage >= 1 && K.stage < 3) q.push(K.starQuest());
    ui.setQuests(q);
    ui.setStars(K.stars.count, K.stars.total);
  };
  K.target = () => {
    if (K.stage === 1) {
      if (!jose.talks) return jose.pos;
      if (got >= 4) return jose.pos;
      return planks.filter(p => !p.taken && p.known).map(p => V(p.x, p.y, p.z));
    }
    if (K.stage === 2) return V(yardX, 0, yardZ);
    return null;
  };

  // Depois de juntar as tábuas, José aceita ir para casa
  ctx.interact({
    pos: jose.pos, r: 2.8, label: 'Falar com José', enabled: () => K.stage === 1 && got >= 4,
    fn: async () => {
      ctx.lock(true);
      try {
        await K.say([
          { who: JOSE, text: 'Você achou todas! Que anjinho bondoso. Obrigado!' },
          { who: JOSE, text: 'Agora preciso descansar... meu coração está pesado. Você me acompanha até minha casa? É pertinho, a leste do poço.' },
        ]);
      } catch (e) { K.err(e); return; }
      K.stage = 2; jose.static = true; joseFollow.on = true; K.refresh(); ctx.lock(false);
    },
  });

  // ---------- Sequências ----------
  async function start() {
    try {
      K.cutscene = true;
      await K.intro({
        title: 'O Sonho de José', sub: 'Nazaré · Mt 1,18-25', x: 0, z: 28, facing: Math.PI,
        narr: [
          'Algum tempo depois da visita do anjo, José, o carpinteiro, ficou sabendo que Maria, sua noiva, esperava um bebê.',
          'José era um homem justo. Sem entender o que tinha acontecido, ficou muito preocupado...',
          'Naquela noite fria, a anjinha mensageira voltou a Nazaré. José ainda estava acordado, na sua oficina.',
        ],
      });
      K.stage = 1; K.play();
      ui.toast('Vá até a oficina de José, no fim do caminho. Siga a seta dourada!', 5);
    } catch (e) { K.err(e); }
  }

  const gab = gabrielModel(); gab.visible = false; scene.add(gab);
  const dreamLight = new THREE.PointLight('#bcd0ff', 0, 18, 1.4); scene.add(dreamLight);
  async function dream() {
    K.stage = 3; K.cutscene = true; ctx.lock(true); joseFollow.on = false; ui.setQuests([]);
    const jm = jose.model, gy = H(yardX, yardZ);
    try {
      await K.step(ui.fade(1, 0.7));
      jm.position.set(yardX - 0.6, gy, yardZ + 0.6); jm.rotation.set(0, -0.75, 0);
      lightFire(fire);
      player.place(yardX + 2.6, yardZ - 0.4, -Math.PI / 2 - 0.3);
      cam.cut(V(yardX - 3.4, gy + 1.9, yardZ + 3.6), V(yardX + 0.2, gy + 1.0, yardZ - 0.2));
      await K.step(ui.fade(0, 1));
      await K.say([
        { who: JOSE, text: 'Que noite... Eu amo a Maria. Mas não entendo o que aconteceu.' },
        { who: JOSE, text: 'Não quero que ninguém fale mal dela. Acho que vou desfazer o noivado em segredo, sem expor a Maria...' },
        'José pensava nisso tudo quando, cansado, adormeceu ali mesmo, perto do fogo.',
      ]);
      await K.step(ui.fade(1, 0.8));
      jm.rotation.set(-Math.PI / 2, 0, 0); jm.position.set(yardX - 0.6, gy + 0.32, yardZ + 0.7);
      ui.setFade(1, '#000');
      cam.cut(V(yardX - 2.6, gy + 2.4, yardZ + 2.8), V(yardX - 0.6, gy + 0.5, yardZ + 0.6));
      await K.step(ui.fade(0, 1.2));
      // o sonho: luz azulada e o anjo descendo
      ctx.stopMusic(); sfx.choir(14);
      gab.visible = true; gab.position.set(yardX - 0.6, gy + 12, yardZ - 1.6); gab.rotation.y = 0;
      cam.shot(V(yardX - 3.4, gy + 2.2, yardZ + 4.2), V(yardX - 0.6, gy + 2.2, yardZ - 1), 1.2);
      await K.step(tween(3.4, k => { gab.position.y = gy + 12 - 10.6 * k; dreamLight.position.set(yardX - 0.6, gy + 3, yardZ - 1); dreamLight.intensity = 22 * k; }));
      await K.say([
        { who: G, text: 'José, filho de Davi, não tenhas medo de receber Maria como tua esposa.' },
        { who: G, text: 'O que nela foi gerado vem do Espírito Santo.' },
        { who: G, text: 'Ela dará à luz um filho, e tu lhe porás o nome de JESUS, pois ele vai salvar o seu povo dos seus pecados.' },
        'Tudo isso aconteceu para se cumprir o que o Senhor disse pelo profeta: "A virgem conceberá e dará à luz um filho, que será chamado Emanuel, que quer dizer: Deus conosco."',
      ]);
      await K.step(tween(2.6, k => { gab.position.y = gy + 1.4 + 14 * k; dreamLight.intensity = 22 * (1 - k); }));
      gab.visible = false;
      await K.step(ui.flash());
      jm.rotation.set(0, -0.75, 0); jm.position.set(yardX - 0.6, gy, yardZ + 0.4);
      cam.shot(V(yardX - 2.6, gy + 1.7, yardZ + 2.8), V(yardX - 0.6, gy + 1.3, yardZ + 0.4), 2);
      ctx.startMusic();
      await K.say([
        { who: JOSE, text: '(acordando) Um anjo! Um anjo falou comigo em sonho!' },
        { who: JOSE, text: 'Agora entendi tudo. O filho de Maria é o Filho de Deus, o Emanuel prometido!' },
        { who: JOSE, text: 'Não tenho mais medo. Amanhã cedo vou buscar Maria e levá-la para a minha casa. Vou cuidar dela e do Menino com todo o meu coração.' },
        { who: JOSE, text: 'E vou fazer para Ele o berço mais bonito da Galileia. Com as tábuas que você encontrou!' },
      ]);
      await K.complete({
        verse: 'Quando acordou, José fez como o anjo do Senhor lhe havia mandado e recebeu Maria, sua esposa.',
        ref: 'Mt 1,24',
        reflect: 'José não disse nenhuma palavra na Bíblia, mas confiou e obedeceu. Quando você não entender alguma coisa, pode confiar em Deus como José confiou: Ele sempre cuida de nós.',
      });
    } catch (e) { K.err(e); }
  }

  function update(dt, t, playing) {
    K.update(dt, t, playing);
    animateFire(fire, t);
    if (gab.visible) { setWings(gab, 0.35 + Math.sin(t * 1.6) * 0.12); K.anim(gab, t, dt, { air: true, talk: ui.speaker === G }); }
    if (playing && K.stage === 2 && Math.hypot(player.pos.x - yardX, player.pos.z - yardZ) < 4.5 && jose.model.position.distanceTo(V(yardX, jose.model.position.y, yardZ)) < 7) dream();
  }

  function hint() {
    if (K.stage === 0 || K.cutscene) return 'Acompanhe a história.';
    if (K.stage === 2) return 'Ande até o pátio da casa de José, a leste do poço. Ele vem atrás de você.';
    if (!jose.talks) return 'José está na oficina dele, no fim do caminho, ao sul. Chegue perto e aperte E.';
    if (got >= 4) return 'Volte até José, na frente da oficina.';
    const tips = ['em cima do telhado da oficina: pule e bata as asas', 'perto do poço, no meio da praça', 'no bosque de pinheiros a oeste (a Sara viu)', 'na colina das oliveiras, a sudeste (o Rúben viu)'];
    const i = planks.findIndex(p => !p.taken);
    return `Tem um feixe de tábuas ${tips[i]}.`;
  }

  return { start, update, hint };
}
