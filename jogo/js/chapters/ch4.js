// Capítulo 4 · O Decreto de César (Lc 2,1-5). Dia de feira em Nazaré: o arauto anuncia o recenseamento e é preciso preparar a viagem.
import * as THREE from 'three';
import { terrainHeight as H, person, V, mat, sheepModel } from '../world.js';
import { kit, LOOKS } from './kit.js';
import { donkeyModel, animateQuad } from '../models.js';

// colina de trigo a leste, onde o burrinho foi passear
export const TERRAIN = { hills: [[30, -6, 6, 220], [-28, -22, 3.5, 120]], flat: 11, ring: 56, bumps: 1 };
const JOSE = 'José', MARIA = 'Maria', ARAUTO = 'Arauto';

export function build(ctx) {
  const { world, scene, player, ui, sfx, cam, tween } = ctx;
  const K = kit(ctx, 4);
  world.buildEnvironment({ path: [[0, 34], [0, 6], [0, -2], [-12, -12], [-16, -18]], sky: 'sunny', ground: 'grass', snowfall: false });

  // ---------- Nazaré em dia de feira ----------
  const joseHouse = world.flatHouse({ x: -17, z: -21, w: 6.5, d: 5, h: 3.2, rot: 0.55, wall: '#e8d4ae', trim: '#6b4a2e', awning: '#8a5a3b', upper: true });
  const houses = [
    { x: -13, z: 4, rot: Math.PI / 2, wall: '#f1e4c8', awning: '#3f72c8' },
    { x: 13, z: 5, rot: -Math.PI / 2, wall: '#e6cfa4', upper: true },
    { x: -12, z: 17, rot: Math.PI / 2, wall: '#efdcbc', awning: '#c94a3a' },
    { x: 12, z: 18, rot: -Math.PI / 2, wall: '#dcc39a' },
    { x: 11, z: -12, rot: -Math.PI / 2 - 0.4, wall: '#f3e7d0', upper: true, awning: '#2e7d5c' },
    { x: -2, z: -21, rot: 0, wall: '#e2caa0' },
  ].map(o => world.flatHouse(o));
  world.well(-4.5, 9.5);
  // barracas da feira em volta da praça
  world.stall(5.6, 2.5, -Math.PI / 2, '#d6303d', 'fruit');
  world.stall(-5.8, -3.5, Math.PI / 2, '#d89a2e', 'bread');
  world.stall(5.8, -6, -Math.PI / 2, '#3b6fd0', 'flowers');
  world.stall(-5.6, 15, Math.PI / 2, '#2e7d3c', 'fruit');
  for (const [x, z] of [[8, 9], [-8.5, 9], [7.8, -1]]) world.barrel(x, z);
  world.crate(8.6, -9.4, 1, 0.4); world.crate(-8.4, 1.2, 0.8, 0.2); world.cart(-9, 24, 0.5);
  // palco do arauto
  const stage0 = new THREE.Group(); stage0.position.set(0, H(0, -9), -9); scene.add(stage0);
  stage0.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.6, 2.4), mat('#9a6538')), {}));
  stage0.children[0].position.y = 0.3;
  for (const sx of [-1.4, 1.4]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.6, 8), mat('#6b4529')); p.position.set(sx, 1.8, -1); stage0.add(p); const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.04), mat('#b8222e', { roughness: 0.7 })); b.position.set(sx, 2.7, -0.97); stage0.add(b); const eg = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), mat('#e8bf55', { metalness: 0.6, roughness: 0.3 })); eg.position.set(sx, 3.66, -1); stage0.add(eg); }
  world.addBox(0, -9, 1.7, 1.2, H(0, -9) + 0.6);
  // campos e natureza
  world.wheat(28, -6, 16, 18, 0.2, 1100);
  world.vineyard(-24, 6, 3, 8, Math.PI / 2);
  world.olives([[-26, -6], [-30, 2], [-22, 18], [-28, 24], [20, 22], [26, 16], [18, -24], [24, -20]].map(([x, z]) => ({ x, z, s: 1.1, ry: x })));
  world.cypresses([[3.5, 26], [-3.5, 26], [3.5, 31], [-3.5, 31], [-21, -14], [-11, -26], [16, -16]].map(([x, z]) => ({ x, z, s: 1, ry: x })));
  world.palms([[4.5, 12], [-14, -6], [16, 12]].map(([x, z]) => ({ x, z, s: 1, ry: x })));
  world.stoneWall(19, -18, 19, 6); world.stoneWall(-20, 26, -32, 10);
  world.fenceRing(-24, 30, 4, 0, 0.55);
  for (const [x, z, r, n] of [[-6, 30, 6, 60], [20, 26, 6, 60], [-28, -12, 6, 60], [8, -24, 5, 40]]) world.flowers(x, z, r, n, x * 5 + z);
  K.forest({ seed: 44, n: 100, r0: 34, r1: 95, avoid: (x, z) => Math.hypot(x, z) < 34 || (Math.abs(x) < 6 && z > 30) || Math.hypot(x - 30, z + 6) < 14 });
  const sheep = [[-25, 29], [-23, 31.5]].map(([x, z], i) => K.place(sheepModel(), x, z, i * 2));

  // ---------- Estrelas (18) ----------
  const sl = [];
  for (let i = 0; i < 5; i++) { const z = 30 - i * 6; sl.push([Math.sin(i * 1.3) * 1.5, H(0, z) + 1.1, z]); }
  for (const h of [houses[0], houses[1], houses[4], joseHouse]) sl.push([h.position.x, h.userData.roofTop + 0.9, h.position.z]);
  for (let i = 0; i < 4; i++) { const x = 24 + i * 2.5, z = -12 + i * 4; sl.push([x, H(x, z) + 1.6, z]); }
  for (let i = 0; i < 3; i++) { const x = -24 + i * 2, z = 2 + i * 3; sl.push([x, H(x, z) + 1.8, z]); }
  sl.push([0, H(0, -9) + 4.6, -9], [-4.5, H(-4.5, 9.5) + 4.2, 9.5]);
  K.starsAt(sl);
  world.finalize();

  // ---------- Personagens ----------
  const arauto = K.npc({ name: ARAUTO, x: 0, z: -9.2, face: 0, collide: false, look: { color: '#b8222e', trim: '#e8bf55', belt: '#6b4a2e', male: true, boots: '#6b4a2e', tights: '#e6c9a0', hair: { color: '#3a2418', style: 'short' }, eyes: '#3a2418', skin: '#e2b08a', s: 1.05 } });
  arauto.model.position.y = H(0, -9) + 0.6;
  const jose = K.npc({
    name: JOSE, x: -13.2, z: -16.6, face: 0.6, look: LOOKS.jose,
    lines: () => [
      { who: JOSE, text: 'Belém fica longe, a uns cinco dias de caminhada. Precisamos de pão, de água e de um cobertor para as noites frias.' },
      { who: JOSE, text: 'E do nosso burrinho, o Pipoca! Maria não pode andar tanto. Mas ele fugiu de novo... vive indo comer trigo na colina a leste!' },
    ],
    again: () => [{ who: JOSE, text: ready() ? 'Tudo pronto? Então traga o Pipoca até aqui!' : `Ainda falta: ${missing().join(', ')}.` }],
    enabled: () => K.stage === 1,
  });
  const maria = K.npc({
    name: MARIA, x: -14.8, z: -15.4, face: 0.9, look: LOOKS.maria,
    lines: () => [
      { who: MARIA, text: 'O bebê vai nascer logo, anjinho. Sinto que Ele está pertinho...' },
      { who: MARIA, text: 'Os profetas disseram que o Messias nasceria em Belém, a cidade do rei Davi. E agora o imperador manda a gente justamente para lá! Deus escreve certo...' },
    ],
    again: () => [{ who: MARIA, text: 'Obrigada por nos ajudar. Você é um anjinho muito especial.' }],
    enabled: () => K.stage === 1,
  });
  K.npc({
    name: 'Rúben', x: -8.2, z: -5.6, face: 1.4, look: { color: '#6d6aa0', sash: '#c99b5a', long: true, male: true, hair: { color: '#4a3426', style: 'short' }, beard: '#4a3426', eyes: '#3b2a1a', skin: '#e2b08a', s: 1.05 },
    lines: () => [
      { who: 'Rúben', text: 'José vai viajar para Belém? Então leve estes pães da minha banca. São para a viagem, presente meu!' },
      { who: 'Rúben', text: 'Esse recenseamento é para o imperador saber quantas pessoas existem e cobrar impostos. Todo mundo tem que ir para a cidade da sua família.' },
    ],
    again: () => [{ who: 'Rúben', text: 'Boa viagem para eles! Que Deus os proteja na estrada.' }],
    after: () => { items.bread.known = true; },
  });
  K.npc({
    name: 'Débora', x: -10.6, z: 6.8, face: Math.PI / 2 + 0.6, look: { color: '#5d7aa6', trim: '#d9c08a', long: true, veil: '#efe6d6', hair: { color: '#cfc9c0', style: 'short' }, eyes: '#4a6a8a', lashes: true, old: true, skin: '#e8b996', s: 0.95 },
    lines: () => [
      { who: 'Débora', text: 'Eu teci um cobertor bem quentinho para o bebê de Maria! Ia dar de presente quando ele nascesse...' },
      { who: 'Débora', text: 'Mas é melhor levar agora: as noites na estrada são frias. Está ali, na porta da minha casa.' },
    ],
    again: () => [{ who: 'Débora', text: 'Emanuel, Deus conosco... e vai nascer em Belém! Bem como disse o profeta Miqueias.' }],
    after: () => { items.blanket.known = true; },
  });
  K.npc({
    name: 'Natan', x: -21, z: 27, face: 2.4, look: { color: '#9a7448', belt: '#6b4a2e', male: true, boots: '#6b4a2e', tights: '#c9a27a', hair: { color: '#3a2618', style: 'short' }, eyes: '#4a3020', skin: '#dba67e', staff: true, s: 0.88 },
    lines: () => [
      { who: 'Natan', text: 'O Pipoca fugiu de novo? Ha! Aquele burrinho é teimoso que só ele.' },
      { who: 'Natan', text: 'Ele só obedece por uma coisa: CENOURA! Tem cenoura na banca de frutas da praça.' },
    ],
    again: () => [{ who: 'Natan', text: 'Cenoura na banca de frutas, depois procure o Pipoca no trigal a leste!' }],
    after: () => { items.carrot.known = true; },
  });
  K.npc({
    name: 'Sara', x: 9, z: 12, face: -2, look: { color: '#e07a8a', trim: '#f4e1b0', hair: { color: '#5a3424', style: 'long' }, eyes: '#5a3a22', skin: '#f0c4a0', lashes: true, boots: '#7a4a2b', tights: '#f4efe8', s: 0.78 },
    lines: () => [
      { who: 'Sara', text: 'Anjinho! Você viu o soldado romano lendo aquele papel enorme? Fiquei com medo!' },
      { who: 'Sara', text: 'O José vai levar a Maria para Belém... vou sentir saudade! Leva o odre de água do poço para eles!' },
    ],
    again: () => [{ who: 'Sara', text: 'O odre fica ao lado do poço, ali perto.' }],
    after: () => { items.jar.known = true; },
  });

  // ---------- Provisões e o burrinho ----------
  const got = { bread: false, jar: false, blanket: false, carrot: false };
  const onItem = (k, msg) => () => { got[k] = true; ui.toast(msg, 3); if (ready() && K.stage === 1) ui.toast('Provisões prontas! Agora ache o burrinho.', 3.5); };
  const items = {
    bread: K.pickup('bread', -6.3, -2.4, { y: H(-6.3, -2.4) + 1.15, known: false, onGet: onItem('bread', 'Pão para a viagem! 🍞'), enabled: () => K.stage === 1 }),
    jar: K.pickup('jar', -2.6, 10.6, { known: false, onGet: onItem('jar', 'Odre de água cheio! 💧'), enabled: () => K.stage === 1 }),
    blanket: K.pickup('blanket', -10.4, 4, { known: false, onGet: onItem('blanket', 'Cobertor quentinho da Débora!'), enabled: () => K.stage === 1 }),
    carrot: K.pickup('carrot', 6.2, 3.6, { y: H(6.2, 3.6) + 1.15, known: false, onGet: () => { got.carrot = true; ui.toast('Uma cenoura! O Pipoca vai adorar 🥕', 3); }, enabled: () => K.stage === 1 }),
  };
  const missing = () => [!got.bread && 'pão', !got.jar && 'água', !got.blanket && 'cobertor', !found && 'o burrinho'].filter(Boolean);
  const ready = () => got.bread && got.jar && got.blanket;
  const donkey = donkeyModel(); K.place(donkey, 31, -4, -1.2);
  const donkeyF = K.follow(donkey, { gap: 2.2, speed: 6, r: 0.5 });
  let found = false;
  ctx.interact({
    pos: V(31, H(31, -4), -4), r: 3, label: 'Chamar o burrinho Pipoca', enabled: () => K.stage === 1 && !found,
    fn: async () => {
      ctx.lock(true);
      try {
        if (!got.carrot) {
          await K.say(['(O burrinho Pipoca mastiga trigo e nem olha para você. Ele não quer sair do lugar!)', 'Hmm... o que será que convence um burrinho teimoso? Pergunte ao pastorzinho Natan, perto do cercado das ovelhas.']);
          items.carrot.known = true;
        } else {
          sfx.item();
          await K.say(['(Você mostra a cenoura. As orelhas do Pipoca ficam em pé!)', '(Ele come a cenoura num instante e começa a seguir você, todo feliz!)']);
          found = true; donkeyF.on = true; ui.toast('O Pipoca está seguindo você! Leve-o até a casa de José.', 4);
        }
      } catch (e) { K.err(e); return; }
      ctx.lock(false); K.refresh();
    },
  });

  // ---------- Missões ----------
  K.refresh = () => {
    const q = [];
    if (K.stage === 1) {
      q.push({ t: 'Fale com José e Maria', done: jose.talks > 0 });
      q.push({ t: `Provisões: pão, água e cobertor (${[got.bread, got.jar, got.blanket].filter(Boolean).length}/3)`, done: ready() });
      q.push({ t: found ? 'Leve o Pipoca até a casa de José' : 'Encontre o burrinho fujão', done: false });
      q.push(K.starQuest());
    }
    ui.setQuests(q); ui.setStars(K.stars.count, K.stars.total);
  };
  const giver = { bread: V(-8.2, 0, -5.6), jar: V(9, 0, 12), blanket: V(-10.6, 0, 6.8), carrot: V(-21, 0, 27) };
  K.target = () => {
    if (K.stage !== 1) return null;
    if (!jose.talks) return jose.pos;
    if (found && ready()) return jose.pos;
    const list = [];
    for (const k of ['bread', 'jar', 'blanket']) if (!items[k].taken) list.push(items[k].known ? V(items[k].x, items[k].y, items[k].z) : giver[k]);
    if (!found) {
      if (got.carrot) list.push(V(31, 0, -4));
      else if (ready()) list.push(items.carrot.known ? V(items.carrot.x, 0, items.carrot.z) : giver.carrot);
    }
    return list;
  };

  // ---------- Cenas ----------
  async function start() {
    try {
      K.cutscene = true;
      await K.intro({
        title: 'O Decreto de César', sub: 'Nazaré · Lc 2,1-5', x: 0, z: 2, facing: Math.PI,
        narr: [
          'Os meses passaram. José e Maria já moravam juntos em Nazaré, e o bebê estava para nascer.',
          'Era dia de feira, e a praça estava cheia de gente. De repente, soou uma trombeta...',
        ],
      });
      const sy = H(0, -9) + 0.6;
      cam.shot(V(2.6, sy + 1.8, -4.2), V(0, sy + 1.4, -9.2), 1.8);
      await K.say([
        { who: ARAUTO, text: 'Ouçam! Ouçam! Ordem de César Augusto, imperador de Roma!' },
        { who: ARAUTO, text: 'Todos os habitantes do império devem se alistar no recenseamento. Cada um deve ir para a cidade de origem da sua família!' },
        'Naquele tempo, Quirino era governador da Síria. E todos foram se alistar, cada um na sua cidade.',
      ]);
      cam.shot(V(-10, H(-14, -16) + 2, -11.5), V(-14, H(-14, -16) + 1.2, -16), 1.6);
      await K.say([
        { who: JOSE, text: 'Maria, eu sou da família do rei Davi. A nossa cidade é Belém, na Judeia...' },
        { who: MARIA, text: 'Então vamos juntos, José. Deus está conosco.' },
      ]);
      K.stage = 1; K.play();
      ui.toast('Vá falar com José e Maria, perto da casa deles. Siga a seta dourada!', 5);
    } catch (e) { K.err(e); }
  }

  async function departure() {
    K.stage = 2; K.cutscene = true; ctx.lock(true); donkeyF.on = false; ui.setQuests([]);
    const jx = -13.6, jz = -15;
    try {
      await K.step(ui.fade(1, 0.6));
      // Maria monta no burrinho
      donkey.position.set(jx + 1.4, H(jx + 1.4, jz + 1), jz + 1); donkey.rotation.y = 0.2;
      const rider = person({ ...LOOKS.maria, long: false, kneel: true }); rider.position.set(0, 0.92, -0.08); rider.scale.setScalar(0.95); donkey.add(rider);
      K.npcs.push({ name: MARIA, model: rider, static: true, x: 0, z: 0, pos: V(), talks: 0 });
      maria.model.visible = false;
      jose.model.position.set(jx, H(jx, jz + 1.2), jz + 1.2); jose.model.rotation.y = 0.3; jose.static = true;
      player.place(jx - 1.6, jz + 2.8, Math.PI - 0.9);
      cam.cut(V(jx + 4.5, H(jx, jz) + 2.4, jz + 6), V(jx + 0.6, H(jx, jz) + 1.3, jz + 1));
      await K.step(ui.fade(0, 0.9));
      await K.say([
        { who: JOSE, text: 'Pão, água, cobertor e o Pipoca! Está tudo pronto. Obrigado, pequeno mensageiro!' },
        { who: MARIA, text: 'Pipoca, vá devagarinho, está bem? Você está levando uma carga muito preciosa!' },
        '(O burrinho balança as orelhas, como quem diz: "Pode deixar!")',
      ]);
      // partida pela estrada
      cam.shot(V(4, H(0, 10) + 5, 16), V(0, H(0, 4) + 1, 4), 0.8);
      ctx.stopMusic(); sfx.choir(12);
      K.walkTo(donkey, 0.8, 0, 2.4); await K.walkTo(jose.model, -0.8, 0.4, 2.4);
      K.walkTo(donkey, 0.8, 28, 2.4); K.walkTo(jose.model, -0.8, 28.4, 2.4);
      await K.say([
        'Também José subiu da Galileia, da cidade de Nazaré, para a Judeia, à cidade de Davi, chamada Belém, porque era da casa e da família de Davi.',
        'Ele foi se alistar com Maria, sua esposa, que estava grávida.',
      ]);
      ctx.startMusic();
      await K.complete({
        verse: 'José subiu da Galileia, da cidade de Nazaré, à Judeia, à cidade de Davi, chamada Belém, para se alistar com Maria, sua esposa, que estava grávida.',
        ref: 'Lc 2,4-5',
        reflect: 'Uma ordem do imperador parecia só atrapalhar, mas Deus usou até isso para Jesus nascer em Belém, como os profetas tinham anunciado. Quando os planos mudam, Deus continua cuidando de tudo!',
      });
    } catch (e) { K.err(e); }
  }

  function update(dt, t, playing) {
    K.update(dt, t, playing);
    if (!donkeyF.on && K.stage === 1) { animateQuad(donkey, t, dt, 0); donkey.userData.head.rotation.x = 0.35 + Math.sin(t * 2) * 0.1; }
    sheep.forEach((s, i) => { s.position.y = H(s.position.x, s.position.z) + Math.abs(Math.sin(t * 2 + i)) * 0.03; });
    if (playing && K.stage === 1 && found && ready() && Math.hypot(player.pos.x - jose.pos.x, player.pos.z - jose.pos.z) < 5 && Math.hypot(donkey.position.x - jose.pos.x, donkey.position.z - jose.pos.z) < 8) departure();
  }

  function hint() {
    if (K.cutscene) return 'Acompanhe a história.';
    if (!jose.talks) return 'José e Maria estão em frente à casa deles, a sudoeste da praça.';
    if (!got.bread) return 'O padeiro Rúben tem pão na banca dele, na praça. Converse com ele!';
    if (!got.jar) return 'Tem um odre de água perto do poço. A Sara sabe onde.';
    if (!got.blanket) return 'A Débora fez um cobertor. Ela mora numa casa a oeste da praça.';
    if (!found && !got.carrot) return 'O burrinho Pipoca está no trigal da colina a leste, mas só vem por uma cenoura. Ela está na banca de frutas da praça!';
    if (!found) return 'Leve a cenoura até o Pipoca, no trigal da colina a leste, e aperte E.';
    return 'Leve o Pipoca até a casa de José e Maria, a sudoeste.';
  }

  return { start, update, hint };
}
