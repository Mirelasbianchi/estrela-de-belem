// Capítulo 3 · A Visitação (Lc 1,39-80). Ain Karem, nas montanhas da Judeia: entardecer dourado e, no fim, a fogueira de São João.
import * as THREE from 'three';
import { terrainHeight as H, person, V } from '../world.js';
import { kit, LOOKS } from './kit.js';
import { bonfireModel, lightBonfire, animateBonfire, babyModel, mangerModel } from '../models.js';

// o monte de Isabel ao sul e colinas suaves
export const TERRAIN = { hills: [[0, -29, 7, 196, 10], [-26, 8, 3, 110], [24, 14, 2.5, 90]], flat: 10, ring: 56, bumps: 1.2 };
const MARIA = 'Maria', ISA = 'Isabel', ZAC = 'Zacarias';

export function build(ctx) {
  const { world, scene, player, ui, sfx, cam, tween } = ctx;
  const K = kit(ctx, 3);
  const path = [[1, 36], [0, 22], [-4, 10], [-5, 0], [3, -10], [1, -20], [0, -25]];
  world.buildEnvironment({ path, sky: 'golden', ground: 'grass', snowfall: false });

  // ---------- Ain Karem: casinhas de pedra nas encostas ----------
  const isaHouse = world.flatHouse({ x: 0, z: -31, w: 6.5, d: 5, h: 3.2, rot: 0, wall: '#efe0c2', trim: '#7a5a3a', awning: '#3f72c8', upper: true, stairs: true });
  const houses = [
    { x: -12, z: 6, rot: Math.PI / 2, wall: '#e8d2a8', awning: '#c94a3a' },
    { x: 11, z: 2, rot: -Math.PI / 2, wall: '#f1e4c8', upper: true },
    { x: -13, z: -10, rot: Math.PI / 2 - 0.3, wall: '#dcc39a', awning: '#2e7d5c' },
    { x: 12, z: -14, rot: -Math.PI / 2 + 0.3, wall: '#e9dbc0' },
    { x: -9, z: 21, rot: Math.PI / 2, wall: '#f3e7d0', upper: true, awning: '#d89a2e' },
    { x: 13, z: 20, rot: -Math.PI / 2, wall: '#e2caa0' },
  ].map(o => world.flatHouse(o));
  world.spring(6, 12, -Math.PI / 2);
  world.vineyard(-22, -4, 4, 8, 0.3);
  world.cypresses([[3, 26], [-3, 26], [3.4, 18], [-6.5, 14], [-1.5, -5], [6, -6], [-3, -16], [5, -18], [-4, -25], [14, -31], [16, -26], [-16, -24]].map(([x, z]) => ({ x, z, s: 0.9 + Math.abs(Math.sin(x * z)) * 0.4, ry: x })));
  world.palms([[9, 9], [9.5, 15], [-16, 1], [16, 8], [-17, 15]].map(([x, z]) => ({ x, z, s: 1, ry: x * 2 })));
  world.olives([[20, -4], [24, -10], [27, -2], [22, 4], [29, 6], [-26, 14], [-30, 6], [-23, 20]].map(([x, z]) => ({ x, z, s: 1.1, ry: x })));
  for (const [x, z, r, n] of [[-6, 30, 6, 70], [14, -6, 5, 50], [-8, -20, 5, 50], [20, 22, 6, 60], [-20, 28, 6, 60], [8, -36, 6, 50]]) world.flowers(x, z, r, n, x * 3 + z);
  world.stoneWall(-30, -14, -14, -18); world.stoneWall(16, -20, 30, -16); world.stoneWall(-6, 2, -16, 26); world.stoneWall(18, 26, 26, 10);
  world.cart(-6, 30, 0.4);
  world.barrel(isaHouse.userData.frontL.x - 0.6, isaHouse.userData.frontL.z); world.crate(-17, 8, 0.9, 0.3);
  K.forest({
    seed: 33, n: 110, r0: 34, r1: 95,
    avoid: (x, z) => Math.hypot(x, z) < 34 || (Math.abs(x) < 6 && z > 30),
  });

  // Fogueira (no alto do monte, ao lado da casa) e o bercinho de João
  const fireX = 7.5, fireZ = -25.5;
  const fire = K.place(bonfireModel(), fireX, fireZ); world.addCircle(fireX, fireZ, 1.4);
  const cradle = mangerModel(false); const baby = babyModel({ halo: false }); baby.position.set(0, 0.68, -0.15); cradle.add(baby);
  cradle.visible = false; K.place(cradle, -2.2, -27.2, 0.4);

  // ---------- Estrelas (18) ----------
  const sl = [];
  for (let i = 0; i < path.length - 1; i++) { const [ax, az] = path[i], [bx, bz] = path[i + 1]; const x = (ax + bx) / 2, z = (az + bz) / 2; sl.push([x, H(x, z) + 1.1, z]); }
  for (const h of [houses[0], houses[1], houses[4], isaHouse]) sl.push([h.position.x, h.userData.roofTop + 0.9, h.position.z]);
  for (let i = 0; i < 3; i++) { const x = -24 + i * 2.5, z = -6 + i * 0.8; sl.push([x, H(x, z) + 1.6, z]); }
  for (let i = 0; i < 3; i++) { const x = 21 + i * 3, z = -2 - i * 3; sl.push([x, H(x, z) + 1.2, z]); }
  sl.push([6, H(6, 12) + 3.6, 12], [-26, H(-26, 8) + 1.2, 8]);
  K.starsAt(sl);
  world.finalize();

  // ---------- Personagens ----------
  const maria = person(LOOKS.maria); K.place(maria, 2.2, 33.5, Math.PI);
  K.npcs.push({ name: MARIA, model: maria, static: true, x: 2.2, z: 33.5, pos: V(), talks: 0 });
  const mariaF = K.follow(maria, { gap: 1.9, speed: 5.2 });
  const isabel = K.npc({
    name: ISA, x: 1.6, z: -27.4, face: 0.3, collide: false, look: { color: '#b0638a', trim: '#e8c46a', long: true, veil: '#f0dccf', hair: { color: '#bdb6ad', style: 'short' }, eyes: '#5a3a2a', lashes: true, old: true, skin: '#eab98f', s: 0.98 },
    lines: () => [{ who: ISA, text: '...' }], enabled: () => false,
  });
  isabel.model.visible = false;
  const zac = K.npc({
    name: ZAC, x: -1.8, z: -27.6, face: 0.2, look: { color: '#ece4d2', sash: '#3f6ab0', long: true, male: true, old: true, hair: { color: '#e8e4dc', style: 'short' }, beard: '#eeeae2', eyes: '#4a3a2a', skin: '#e2b08a', s: 1.02 },
    lines: () => K.stage < 3 ? [
      `(Zacarias sorri e acena com as mãos. Ele não consegue falar!)`,
      'Uma vizinha explica: "Zacarias é sacerdote. Lá no Templo, o anjo Gabriel lhe disse que Isabel teria um filho, mas ele duvidou... e ficou mudo até o menino nascer."',
    ] : [{ who: ZAC, text: 'Bendito seja o Senhor! Ajude Isabel a juntar a lenha, pequeno mensageiro!' }],
    again: () => K.stage < 3 ? ['(Zacarias faz um coração com as mãos e aponta para a trilha.)'] : [{ who: ZAC, text: 'João vai preparar o caminho do Senhor!' }],
  });
  K.npc({
    name: 'Tobias', x: -5.5, z: 16, face: 2.2, look: { color: '#6aa0c9', belt: '#6b4a2e', male: true, boots: '#6b4a2e', tights: '#e6c9a0', hair: { color: '#2e1e14', style: 'short' }, eyes: '#3a2416', skin: '#d9a070', s: 0.8 },
    lines: () => K.stage < 3 ? [
      { who: 'Tobias', text: 'Oi! Vocês vieram de longe? Nazaré fica a uns quatro dias de caminhada daqui!' },
      { who: 'Tobias', text: 'A água da nossa fonte é a mais fresquinha da Judeia. Pega um pouco para a moça, ela parece cansada.' },
    ] : [
      { who: 'Tobias', text: 'Uma fogueira? Que legal! Vi lenha lá no meio da plantação de uvas, a oeste.' },
    ],
    again: () => [{ who: 'Tobias', text: K.stage < 3 ? 'A casa de Isabel e Zacarias é aquela lá no alto do monte, com o toldo azul.' : 'A plantação de uvas fica a oeste!' }],
    after: () => { if (K.stage >= 3) wood[1].known = true; },
  });
  K.npc({
    name: 'Raquel', x: 14.5, z: -9, face: -1.2, look: { color: '#d9a04a', trim: '#7a3a2a', long: true, veil: '#c94a3a', hair: { color: '#3a2418', style: 'long' }, eyes: '#3a2418', lashes: true, skin: '#d49a6a' },
    lines: () => K.stage < 3 ? [
      { who: 'Raquel', text: 'Shalom! Vocês vão à casa de Isabel? Ela está esperando um bebê, mesmo sendo bem velhinha!' },
      { who: 'Raquel', text: 'Todo mundo dizia que ela não podia ter filhos. Mas para Deus nada é impossível!' },
    ] : [
      { who: 'Raquel', text: 'O filho de Isabel nasceu! Vi um feixe de lenha entre as oliveiras, a leste. Pode levar!' },
    ],
    again: () => [{ who: 'Raquel', text: K.stage < 3 ? 'Siga a trilha morro acima!' : 'As oliveiras ficam a leste, depois da minha casa.' }],
    after: () => { if (K.stage >= 3) wood[2].known = true; },
  });

  // ---------- Objetos ----------
  let water = false, gotWood = 0;
  const jar = K.pickup('jar', 3.5, 12, { enabled: () => K.stage === 1, onGet: () => { water = true; giveWater(); } });
  const onWood = () => { gotWood++; ui.toast(gotWood < 4 ? `Lenha para a fogueira! (${gotWood}/4)` : 'Toda a lenha! Leve até a fogueira, no alto do monte.', 3.5); };
  const wood = [
    K.pickup('wood', -9, 21, { y: houses[4].userData.roofTop - 0.1, known: true, onGet: onWood, enabled: () => K.stage === 3 }),
    K.pickup('wood', -22, -4.2, { known: false, onGet: onWood, enabled: () => K.stage === 3 }),
    K.pickup('wood', 25, -6, { known: false, onGet: onWood, enabled: () => K.stage === 3 }),
    K.pickup('wood', 8.4, 14.6, { known: true, onGet: onWood, enabled: () => K.stage === 3 }),
  ];
  wood.forEach(w => (w.m.visible = false));

  async function giveWater() {
    ctx.lock(true); K.cutscene = true;
    try {
      await K.wait(0.4);
      await K.say([
        { who: MARIA, text: 'Água fresquinha! Obrigada, anjinho. Que delícia...' },
        { who: MARIA, text: 'Agora tenho forças para subir o monte. Vá na frente, eu sigo você!' },
      ]);
      K.stage = 2; mariaF.on = true; K.play();
    } catch (e) { K.err(e); }
  }

  // ---------- Missões ----------
  K.refresh = () => {
    const q = [];
    if (K.stage === 1) q.push({ t: 'Pegue água na fonte para Maria', done: water });
    if (K.stage === 2) q.push({ t: 'Guie Maria pela trilha até a casa de Isabel, no alto do monte', done: false });
    if (K.stage === 3) { q.push({ t: `Junte lenha para a fogueira (${gotWood}/4)`, done: gotWood >= 4 }); if (gotWood >= 4) q.push({ t: 'Acenda a fogueira no alto do monte', done: false }); }
    if (K.stage >= 1 && K.stage <= 3) q.push(K.starQuest());
    ui.setQuests(q); ui.setStars(K.stars.count, K.stars.total);
  };
  K.target = () => {
    if (K.stage === 1) return V(jar.x, 0, jar.z);
    if (K.stage === 2) return V(0, 0, -26.5);
    if (K.stage === 3) return gotWood >= 4 ? V(fireX, 0, fireZ) : wood.filter(w => !w.taken && w.known).map(w => V(w.x, w.y, w.z));
    return null;
  };
  ctx.interact({
    pos: V(fireX, H(fireX, fireZ), fireZ), r: 3.8, label: 'Acender a fogueira', enabled: () => K.stage === 3 && gotWood >= 4,
    fn: () => bonfire(),
  });

  // ---------- Cenas ----------
  async function start() {
    try {
      K.cutscene = true;
      await K.intro({
        title: 'A Visitação', sub: 'Montanhas da Judeia · Lc 1,39-56', x: 0, z: 34, facing: Math.PI,
        narr: [
          'Depois que o anjo Gabriel foi embora, Maria partiu apressadamente para as montanhas da Judeia.',
          'Ela queria visitar e ajudar sua prima Isabel, que, mesmo velhinha, esperava um bebê: "para Deus nada é impossível!"',
          'Depois de dias de viagem, Maria chegou a Ain Karem, uma vilazinha no meio das colinas...',
        ],
      });
      cam.shot(V(4.5, H(2, 33) + 2.2, 29.5), V(2.2, H(2, 33) + 1.3, 33.5), 2);
      await K.say([
        { who: MARIA, text: 'Que alegria ver você de novo, anjinho! A viagem foi longa e estou com muita sede...' },
        { who: MARIA, text: 'Ali embaixo tem uma fonte de pedra. Pode me trazer um pouco de água?' },
      ]);
      K.stage = 1; K.play();
      ui.toast('Pegue a jarra de água na fonte. Siga a seta dourada!', 5);
    } catch (e) { K.err(e); }
  }

  async function visitation() {
    K.stage = 2.5; K.cutscene = true; ctx.lock(true); mariaF.on = false; ui.setQuests([]);
    const gy = H(0, -26);
    try {
      await K.step(ui.fade(1, 0.6));
      maria.position.set(0.2, H(0.2, -23.4), -23.4); maria.rotation.y = Math.PI;
      isabel.model.visible = true; isabel.model.position.set(0.2, H(0.2, -26.6), -26.6); isabel.model.rotation.y = 0; isabel.static = true;
      player.place(3.4, -23.8, -Math.PI / 2 - 0.5);
      cam.cut(V(-4.2, gy + 2.3, -18.6), V(0.2, gy + 1.2, -25));
      await K.step(ui.fade(0, 0.9));
      await K.say([{ who: MARIA, text: 'A paz do Senhor, Isabel! Sou eu, Maria!' }]);
      sfx.glory();
      await K.say(['Quando Isabel ouviu a saudação de Maria, a criança pulou de alegria dentro dela! E Isabel ficou cheia do Espírito Santo.']);
      cam.shot(V(1.8, gy + 1.8, -22.2), V(0.2, gy + 1.3, -26.6), 2);
      await K.say([
        { who: ISA, text: 'Bendita és tu entre as mulheres, e bendito é o fruto do teu ventre!' },
        { who: ISA, text: 'Como posso merecer que a mãe do meu Senhor venha me visitar?' },
        { who: ISA, text: 'Assim que ouvi a tua voz, o meu bebê pulou de alegria! Feliz de ti, que acreditaste no que o Senhor te disse!' },
      ]);
      cam.shot(V(1.7, gy + 1.6, -25.6), V(0.2, gy + 1.25, -23.4), 2);
      ctx.stopMusic(); sfx.choir(16);
      await K.say([
        { who: MARIA, text: 'A minha alma engrandece o Senhor, e o meu espírito se alegra em Deus, meu Salvador!' },
        { who: MARIA, text: 'Porque Ele olhou para a pequenez de sua serva. De hoje em diante, todas as gerações me chamarão bem-aventurada.' },
        { who: MARIA, text: 'O Poderoso fez em mim maravilhas, e Santo é o seu nome!' },
        'Esse canto de Maria se chama Magnificat. A Igreja reza esse cântico todos os dias, ao entardecer.',
      ]);
      ctx.startMusic();
      cam.shot(V(4, gy + 2.6, -20), V(0, gy + 1.2, -26), 1.5);
      await K.say([
        'Maria ficou com Isabel uns três meses, ajudando a prima em tudo.',
        { who: ISA, text: 'Maria, quando o meu bebê nascer, vou acender uma grande fogueira aqui no alto do monte. Assim, lá de longe, você vai saber que ele chegou!' },
        { who: MARIA, text: 'Combinado, Isabel! Todas as noites vou olhar para estes montes.' },
      ]);
      // o tempo passa: Maria volta para casa e João nasce
      world.setSky('night', 3);
      await K.step(ui.fade(1, 1.2));
      maria.visible = false;
      cradle.visible = true; isabel.model.position.set(-1.0, H(-1, -26.4), -26.4); isabel.model.rotation.y = 0.5;
      zac.model.position.set(0.8, H(0.8, -26.2), -26.2); zac.model.rotation.y = -0.3; zac.static = true;
      wood.forEach(w => (w.m.visible = true));
      player.place(1.5, -22.4, Math.PI);
      cam.cut(V(1.2, gy + 2.2, -21.4), V(-0.6, gy + 0.9, -26.6));
      await K.step(ui.fade(0, 1.2));
      await K.say([
        'Maria voltou para Nazaré. E pouco tempo depois... Isabel deu à luz um menino!',
        'Os vizinhos queriam chamá-lo de Zacarias, como o pai. Mas Isabel disse: "Não! Ele vai se chamar João."',
        'Zacarias pediu uma tabuinha e escreveu: "O nome dele é João". Na mesma hora, sua boca se abriu e ele voltou a falar!',
      ]);
      sfx.glory();
      await K.say([
        { who: ZAC, text: 'Bendito seja o Senhor, Deus de Israel, que veio visitar o seu povo!' },
        { who: ZAC, text: 'E tu, menino, serás chamado profeta do Altíssimo, pois irás à frente do Senhor preparar os seus caminhos!' },
        { who: ISA, text: 'Anjinho, agora precisamos cumprir a promessa! Junte lenha para a grande fogueira, para Maria ver lá de Nazaré!' },
      ]);
      K.stage = 3; isabel.static = false; zac.static = false; K.play();
      ui.toast('Junte 4 feixes de lenha. Pergunte aos vizinhos!', 5);
    } catch (e) { K.err(e); }
  }

  async function bonfire() {
    K.stage = 4; K.cutscene = true; ctx.lock(true); ui.setQuests([]);
    const fy = H(fireX, fireZ);
    try {
      player.place(fireX - 3.2, fireZ + 2.4, Math.PI / 2 + 0.6);
      isabel.model.position.set(fireX - 2.4, H(fireX - 2.4, fireZ - 1.6), fireZ - 1.6); isabel.model.rotation.y = 1.1; isabel.static = true;
      zac.model.position.set(fireX + 1.6, H(fireX + 1.6, fireZ + 2.4), fireZ + 2.4); zac.model.rotation.y = -2.5; zac.static = true;
      cam.cut(V(fireX - 6, fy + 3, fireZ + 6), V(fireX, fy + 1.6, fireZ));
      await K.wait(0.6);
      lightBonfire(fire); sfx.lamp(); sfx.glory();
      await K.wait(1.2);
      cam.shot(V(fireX - 4, fy + 2.2, fireZ + 4.5), V(fireX, fy + 2.4, fireZ), 1.2);
      await K.say([
        { who: ISA, text: 'Que fogueira linda! Agora Maria vai saber que o João nasceu!' },
        'Diz uma antiga tradição que foi assim que Maria ficou sabendo do nascimento de João: pela luz de uma fogueira no alto do monte.',
        'Por isso, até hoje, nas festas de São João, no dia 24 de junho, acendemos fogueiras, soltamos balões e fazemos festa!',
        { who: ZAC, text: 'João não era a luz. Ele veio para anunciar a Luz verdadeira, que ilumina todas as pessoas: Jesus (Jo 1,8-9).' },
        { who: ISA, text: 'A fogueira de São João lembra isso: João foi como uma chama que avisou a todos que Jesus estava chegando!' },
      ]);
      // lá longe, em Nazaré, Maria vê o brilho
      maria.visible = true; maria.position.set(-6, H(-6, 50), 50); maria.rotation.y = Math.PI;
      cam.cut(V(-6.6, H(-6, 50) + 1.9, 52.5), V(fireX, fy + 3, fireZ));
      await K.wait(1.0);
      await K.say([
        { who: MARIA, text: '(bem longe dali) Olha! Uma fogueira lá no monte da Judeia! O bebê de Isabel nasceu!' },
        { who: MARIA, text: 'Glória a Deus! João chegou para preparar o caminho do meu Filho...' },
      ]);
      await K.complete({
        verse: 'Bendita és tu entre as mulheres, e bendito é o fruto do teu ventre!',
        ref: 'Lc 1,42',
        reflect: 'Maria esperava Jesus e mesmo assim viajou para ajudar a prima. Quem leva Jesus no coração leva alegria aos outros! E, como a fogueira de São João, você também pode ser uma luzinha que mostra Jesus para quem está perto.',
      });
    } catch (e) { K.err(e); }
  }

  function update(dt, t, playing) {
    K.update(dt, t, playing);
    animateBonfire(fire, t, dt);
    if (playing && K.stage === 2 && Math.hypot(player.pos.x, player.pos.z + 26) < 6 && Math.hypot(maria.position.x, maria.position.z + 26) < 9) visitation();
  }

  function hint() {
    if (K.cutscene) return 'Acompanhe a história.';
    if (K.stage === 1) return 'A fonte de pedra fica à direita da trilha, perto das palmeiras. Encoste na jarra para pegar.';
    if (K.stage === 2) return 'Suba a trilha até a casa com toldo azul, no alto do monte ao sul. Maria vem atrás de você.';
    if (K.stage === 3) {
      if (gotWood >= 4) return 'Vá até a fogueira montada ao lado da casa de Isabel e aperte E.';
      const tips = ['no telhado de uma casa perto da entrada da vila: voe até lá', 'na plantação de uvas, a oeste', 'entre as oliveiras, a leste', 'perto da fonte de pedra'];
      const i = wood.findIndex(w => !w.taken);
      return `Tem lenha ${tips[i]}.`;
    }
    return 'Siga a seta dourada no alto da tela.';
  }

  return { start, update, hint };
}
