// Motor principal: renderização, câmera, estados (menu / jogo / pausa) e capítulos.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { World, terrainHeight, clamp, setTerrain } from './world.js';
import { Player } from './player.js';
import { input, initInput, pollInput, consume } from './input.js';
import { ui, wreathSVG } from './ui.js';
import { initAudio, sfx, startMusic, stopMusic, setSound } from './audio.js';
import { save, persist } from './save.js';
import { CHAPTERS, CANDLE_CHAPTERS, CHRIST_CANDLE } from './chapters.js';
import * as ch1 from './chapters/ch1.js';
import * as ch2 from './chapters/ch2.js';
import * as ch3 from './chapters/ch3.js';
import * as ch4 from './chapters/ch4.js';

// Um capítulo novo por vez: adicione aqui e marque ready: true em chapters.js
const BUILDERS = { 1: ch1, 2: ch2, 3: ch3, 4: ch4 };
const $ = id => document.getElementById(id);

// ---------- Renderer ----------
const canvas = $('c');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { ui.hide('loading'); ui.show('error'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 900);
// reflexos suaves (estilo "massinha"/animação) em todos os materiais
const envTex = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 1 ? 74 : 58; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

// ---------- Tempo / tweens ----------
let time = 0;
const tweens = [];
const easeIO = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
function tween(dur, fn, ease = easeIO) { return new Promise(res => tweens.push({ t: 0, dur, fn, ease, res })); }
const wait = s => tween(s, () => {});

// ---------- Câmera ----------
const cam = {
  mode: 'orbit', yaw: 0, pitch: 0.2, dist: 5.6,
  pos: new THREE.Vector3(40, 22, 50), look: new THREE.Vector3(0, 2, -5),
  tPos: new THREE.Vector3(), tLook: new THREE.Vector3(), speed: 3, orbitA: 0.6,
  follow() { this.mode = 'follow'; },
  shot(p, l, speed = 2.5) { this.mode = 'shot'; this.tPos.copy(p); this.tLook.copy(l); this.speed = speed; },
  cut(p, l) { this.mode = 'shot'; this.tPos.copy(p); this.tLook.copy(l); this.pos.copy(p); this.look.copy(l); },
  snap() { this._snap = true; },
};
const _cp = new THREE.Vector3();
function camBlock(a, b) {
  // fração do caminho a→b livre de colisores (caixas das casas, com margem para telhado e parede)
  if (!world) return 1;
  const N = 28, p = new THREE.Vector3();
  // volume aproximado da casa: paredes + beiral (1 m) + telhado em "pirâmide" até a cumeeira
  const inside = (q, bx) => {
    const out = Math.max(Math.abs(q.x - bx.x) - bx.hw, Math.abs(q.z - bx.z) - bx.hd);
    if (out > 1.0) return false;
    const limit = bx.top + 0.6 + 2.1 * clamp(-out / Math.min(bx.hw, bx.hd), 0, 1);
    if (q.y > limit) return false;
    if (out > 0.45 && q.y < bx.top - 1.7) return false;
    return true;
  };
  const boxes = world.boxes.filter(bx => !inside(a, bx) && bx.hw + bx.hd > 1.2);
  for (let i = 1; i <= N; i++) {
    const t = i / N; p.lerpVectors(a, b, t);
    for (const bx of boxes) {
      if (inside(p, bx)) return (i - 1) / N - 0.02;
    }
  }
  return 1;
}
function updateCam(dt) {
  if (cam.mode === 'follow') {
    if (!locked) cam.pitch = clamp(cam.pitch + input.camDY * 0.004, -0.05, 0.9);
    // a câmera fica sempre atrás da anjinha e gira junto com ela
    let d = (player.facing + Math.PI) - cam.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
    cam.yaw += cam._snap ? d : d * (1 - Math.exp(-dt * 7));
    const tgt = player.pos.clone(); tgt.y += 1.6;
    const dist = camera.aspect < 1 ? cam.dist * 1.25 : cam.dist;
    const place = (pitch, d, out) => { const cp = Math.cos(pitch); return out.set(tgt.x + Math.sin(cam.yaw) * cp * d, tgt.y + Math.sin(pitch) * d, tgt.z + Math.cos(cam.yaw) * cp * d); };
    // se uma casa estiver atrás da anjinha, a câmera sobe por cima do telhado em vez de entrar na parede
    let need = 0, best = -1, bestF = 0;
    for (const extra of [0, 0.3, 0.6, 0.9, 1.15]) {
      const fr = camBlock(tgt, place(cam.pitch + extra, dist, _cp));
      if (fr > bestF + 0.05) { bestF = fr; best = extra; }
      if (fr >= 1) break;
    }
    need = best < 0 ? 0 : best;
    cam.extra = cam.extra || 0;
    cam.extra += (need - cam.extra) * Math.min(1, dt * (need > cam.extra ? 10 : 2.5));
    if (cam._snap) cam.extra = need;
    place(Math.min(1.35, cam.pitch + cam.extra), dist, cam.tPos);
    const gh = terrainHeight(cam.tPos.x, cam.tPos.z) + 0.7; if (cam.tPos.y < gh) cam.tPos.y = gh;
    const f = camBlock(tgt, cam.tPos);
    const blocked = f < 1;
    if (blocked) cam.tPos.lerpVectors(tgt, cam.tPos, Math.max(0.3 / dist, f));
    // câmera colada na anjinha (encostada numa parede): esconde a anjinha para não atrapalhar a visão
    const close = cam.tPos.distanceTo(tgt) < 1.1;
    player.model.visible = !close;
    cam.tLook.copy(tgt);
    if (close) cam.tLook.add(_cp.set(Math.sin(player.facing) * 3, 0, Math.cos(player.facing) * 3));
    const k = cam._snap || blocked ? 1 : 1 - Math.exp(-dt * 9);
    cam.pos.lerp(cam.tPos, k); cam.look.lerp(cam.tLook, cam._snap ? 1 : 1 - Math.exp(-dt * 14));
  } else if (cam.mode === 'orbit') {
    cam.orbitA += dt * 0.045;
    cam.tPos.set(Math.sin(cam.orbitA) * 46, 17, Math.cos(cam.orbitA) * 46 - 6);
    cam.tLook.set(0, 3, -8);
    const k = cam._snap ? 1 : 1 - Math.exp(-dt * 1.5);
    cam.pos.lerp(cam.tPos, k); cam.look.lerp(cam.tLook, k);
  } else {
    if (player && mode === 'play') player.model.visible = true;
    const k = cam._snap ? 1 : 1 - Math.exp(-dt * cam.speed);
    cam.pos.lerp(cam.tPos, k); cam.look.lerp(cam.tLook, k);
  }
  cam._snap = false;
  camera.position.copy(cam.pos); camera.lookAt(cam.look);
}

// ---------- Estado ----------
let scene, world, player, chapter, interactables = [];
let mode = 'loading', locked = false, actBlock = 0, current = 1, activeCtx = null;

function disposeScene(s) {
  if (!s) return;
  s.traverse(o => { if (o.geometry) o.geometry.dispose(); });
}

function buildChapter(n) {
  disposeScene(scene);
  if (activeCtx) activeCtx.alive = false;
  tweens.length = 0;
  setTerrain(BUILDERS[n].TERRAIN || {});
  scene = new THREE.Scene();
  scene.environment = envTex;
  world = new World(scene);
  player = new Player(scene, world);
  interactables = [];
  const ctx = {
    THREE, scene, world, player, ui, sfx, cam, tween, wait, input, save, persist,
    startMusic, stopMusic,
    interact(o) { interactables.push(o); return o; },
    lock(v) { locked = v; if (!v) actBlock = time + 0.35; if (v) ui.hidePrompt(); },
    finish: next => finishChapter(n, next),
    get time() { return time; },
    alive: true,
  };
  activeCtx = ctx;
  window.__dbg = { ctx, player, world, cam, get mode() { return mode; } };
  chapter = BUILDERS[n].build(ctx);
  current = n;
}

async function playChapter(n) {
  initAudio(); startMusic();
  ui.hide('menu'); ui.hide('modal');
  ui.setFade(1);
  buildChapter(n);
  mode = 'play'; locked = true;
  ui.show('hud'); if (input.touch) ui.show('touch');
  player.model.visible = true; player.shadow.visible = true;
  await chapter.start();
}

async function finishChapter(n, next) {
  mode = 'menu'; locked = true;
  ui.hide('hud'); ui.hide('touch'); ui.hidePrompt();
  await ui.fade(1, 0.8);
  if (next && BUILDERS[next]) { playChapter(next); return; }
  buildChapter(1);
  enterMenu();
  await ui.fade(0, 1.2);
}

function enterMenu() {
  mode = 'menu'; locked = true;
  player.model.visible = false; player.shadow.visible = false;
  cam.mode = 'orbit'; cam.snap();
  renderMenu();
  ui.show('menu'); ui.hide('hud'); ui.hide('touch'); ui.hidePrompt(); ui.setArrow(null);
}

function renderMenu() {
  const lit = CANDLE_CHAPTERS.map(c => save.completed.includes(c));
  $('wreath').innerHTML = wreathSVG(lit, save.completed.includes(CHRIST_CANDLE));
  const n = lit.filter(Boolean).length;
  $('wreathCaption').textContent = n === 0 ? 'Coroa do Advento · conclua capítulos para acender as velas'
    : `Coroa do Advento · ${n} de 4 velas acesas`;
  $('bPlay').textContent = save.completed.length ? 'Continuar a jornada' : 'Começar a jornada';
  $('bSound').classList.toggle('off', !save.sound);
}

// ---------- Menus ----------
function nextChapter() {
  for (const c of CHAPTERS) if (c.ready && !save.completed.includes(c.n)) return c.n;
  return null;
}
$('bPlay').onclick = () => {
  const n = nextChapter();
  if (n) playChapter(n);
  else {
    initAudio();
    const soon = CHAPTERS.find(c => !c.ready);
    ui.modal(soon ? `<h2>Até aqui, tudo concluído!</h2>
      <p>Você terminou todos os capítulos disponíveis. O <b>Capítulo ${soon.n} · ${soon.title}</b> chega em breve.</p>
      <p>Enquanto isso, que tal voltar e encontrar todas as estrelas escondidas?</p>` : `<h2>Feliz Natal! 🌟</h2>
      <p>Você completou toda a jornada, da Anunciação até a Noite Santa, e o seu presépio está completo.</p>
      <p>Que tal voltar aos capítulos e encontrar todas as estrelas escondidas?</p>
      <div class="panel-actions"><button class="btn" id="replay1">Escolher um capítulo</button></div>`);
    $('replay1').onclick = () => $('bChapters').onclick();
  }
};
$('bChapters').onclick = () => {
  initAudio();
  ui.modal(`<h2>Capítulos</h2>` + CHAPTERS.map(c => {
    const done = save.completed.includes(c.n);
    const unlocked = c.ready && (c.n === 1 || save.completed.includes(c.n - 1));
    const st = done ? `✓ ${save.stars[c.n] || 0} ★` : unlocked ? 'Jogar ▶' : c.ready ? '🔒' : 'Em breve';
    return `<div class="chap ${unlocked ? 'ready' : 'locked'}" data-n="${unlocked ? c.n : ''}">
      <div class="num">${c.n}</div><div class="info"><div class="t">${c.title}</div><div class="s">${c.place} · ${c.ref}</div></div><div class="st">${st}</div></div>`;
  }).join(''));
  document.querySelectorAll('.chap.ready').forEach(el => el.onclick = () => playChapter(+el.dataset.n));
};
$('bPresepio').onclick = () => {
  initAudio();
  ui.modal(`<h2>Meu Presépio</h2>
    <p style="text-align:center;margin-top:0">Cada capítulo concluído traz uma peça. Na Noite Santa, o Menino Jesus chega à manjedoura.</p>
    <div class="pieces">` + CHAPTERS.map(c => {
      const got = save.pieces.includes(c.n);
      return `<div class="piece ${got ? 'got' : ''}"><div class="ic">${got ? '✦' : '?'}</div><div class="n">${got ? c.piece : '???'}</div><div class="c">Capítulo ${c.n}</div></div>`;
    }).join('') + `</div>`);
};
const HOW = `<h2>Regras do jogo</h2>
  <p>Você é a <b>anjinha mensageira</b>, enviada do Céu para ajudar a preparar a chegada de Jesus. São 7 capítulos, da Anunciação à Noite Santa.</p>
  <h3>Objetivo</h3>
  <ul class="rules">
    <li>Cada capítulo tem <b>missões</b> (lista no canto de cima). Cumpra todas para a história continuar.</li>
    <li>A <b>seta dourada</b> no alto da tela aponta para a próxima missão.</li>
    <li>Converse com os moradores: eles dão pistas de onde estão as coisas.</li>
    <li>As <b>estrelas</b> são opcionais e ficam escondidas, muitas em cima dos telhados. Junte todas!</li>
    <li>Ao terminar um capítulo você ganha uma <b>peça do presépio</b> e uma <b>vela do Advento</b> pode acender.</li>
    <li>Você pode voar à vontade, mas existe um <b>limite de altura</b> para não se perder do mapa.</li>
    <li>Não tem como perder: vá no seu ritmo. Se travar, toque no <b>💡</b> para receber uma dica.</li>
  </ul>
  <h3>No computador</h3>
  <div class="keys"><kbd>W / S</kbd><span>andar para frente / para trás (ou as setas)</span>
  <kbd>A / D</kbd><span>virar a anjinha (a câmera vira junto)</span>
  <kbd>Espaço ou Enter</kbd><span>pular e voar: cada toque bate as asas e sobe mais</span>
  <kbd>Segurar</kbd><span>planar devagarinho</span>
  <kbd>E</kbd><span>conversar / interagir</span>
  <kbd>Arrastar o mouse</kbd><span>também vira a anjinha</span>
  <kbd>Esc</kbd><span>pausar</span></div>
  <h3>No celular</h3>
  <p>Arraste o dedo no <b>lado esquerdo</b> da tela para andar e virar, ou arraste no <b>lado direito</b> para virar. O botão de <b>asas</b> pula e voa (cada toque sobe mais; segure para planar). Quando aparecer um botão dourado, toque nele para conversar.</p>
  <h3>Botões</h3>
  <p><b>?</b> abre estas regras · <b>💡</b> dá uma dica da missão atual · <b>❚❚</b> pausa. O <b>modo daltônico</b> fica no menu e na pausa.</p>`;
$('bHow').onclick = () => ui.modal(HOW);
let modalPaused = false;
$('modalClose').onclick = () => { ui.hide('modal'); if (modalPaused) { modalPaused = false; mode = 'play'; actBlock = time + 0.3; } };
$('bRules').onclick = () => { if (mode !== 'play') return; mode = 'pause'; modalPaused = true; ui.modal(HOW); };
$('bHint').onclick = () => {
  if (mode !== 'play') return;
  const h = chapter && chapter.hint ? chapter.hint() : null;
  ui.toast('💡 ' + (h || 'Siga a seta dourada e converse com os moradores!'), 7);
};
// Modo daltônico: corrige as cores da cena (daltonização) e reforça contornos da interface
const CB = [['off', 'desligado'], ['deut', 'deuteranopia (verde)'], ['prot', 'protanopia (vermelho)'], ['trit', 'tritanopia (azul)']];
const SIM = {
  prot: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deut: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  trit: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const SHIFT = { prot: [[0, 0, 0], [0.7, 1, 0], [0.7, 0, 1]], deut: [[0, 0, 0], [0.7, 1, 0], [0.7, 0, 1]], trit: [[1, 0, 0.7], [0, 1, 0.7], [0, 0, 0]] };
for (const k of ['prot', 'deut', 'trit']) {
  const S = SIM[k], D = SHIFT[k], out = [];
  for (let i = 0; i < 3; i++) {
    const row = [];
    for (let j = 0; j < 3; j++) { let v = i === j ? 1 : 0; for (let m = 0; m < 3; m++) v += D[i][m] * ((m === j ? 1 : 0) - S[m][j]); row.push(+v.toFixed(4)); }
    out.push(row.join(' ') + ' 0 0');
  }
  document.getElementById('m-' + k).setAttribute('values', out.join(' ') + ' 0 0 0 1 0');
}
function applyCB() {
  const k = save.cb || 'off', label = 'Modo daltônico: ' + CB.find(c => c[0] === k)[1];
  $('c').style.filter = k === 'off' ? '' : `url(#cb-${k})`;
  document.body.classList.toggle('cb', k !== 'off');
  $('bCB').textContent = label; $('pCB').textContent = label;
}
const cycleCB = () => { const i = CB.findIndex(c => c[0] === (save.cb || 'off')); save.cb = CB[(i + 1) % CB.length][0]; persist(); applyCB(); };
$('bCB').onclick = cycleCB; $('pCB').onclick = cycleCB;
applyCB();
$('bSound').onclick = () => {
  initAudio(); save.sound = !save.sound; setSound(save.sound); persist(); renderMenu();
};

// Pausa
function pause() {
  if (mode !== 'play') return;
  mode = 'pause'; $('pSound').textContent = 'Som: ' + (save.sound ? 'ligado' : 'desligado'); ui.show('pause');
}
$('bPause').onclick = pause;
$('pResume').onclick = () => { ui.hide('pause'); mode = 'play'; actBlock = time + 0.3; };
$('pSound').onclick = () => { save.sound = !save.sound; setSound(save.sound); persist(); $('pSound').textContent = 'Som: ' + (save.sound ? 'ligado' : 'desligado'); };
$('pHow').onclick = () => ui.modal(HOW);
$('pMenu').onclick = async () => {
  ui.hide('pause'); if (ui._cleanup) ui._cleanup(); ui.hide('card'); ui.hide('titlecard');
  stopMusic(); startMusic();
  await ui.fade(1, 0.5); buildChapter(1); enterMenu(); ui.fade(0, 0.8);
};

// ---------- Interação ----------
const _v = new THREE.Vector3();
function updateInteract() {
  let best = null, bd = 1e9;
  if (mode === 'play' && !locked) {
    for (const it of interactables) {
      if (it.enabled && !it.enabled()) continue;
      const p = it.pos; const d = Math.hypot(p.x - player.pos.x, p.z - player.pos.z);
      if (d < (it.r || 2.6) && Math.abs(p.y - player.pos.y) < (it.h || 3.5) && d < bd) { best = it; bd = d; }
    }
  }
  if (!best) { ui.hidePrompt(); return; }
  _v.copy(best.pos); _v.y += best.ph || 2.3; _v.project(camera);
  ui.prompt(best.label, (_v.x * 0.5 + 0.5) * innerWidth, (-_v.y * 0.5 + 0.5) * innerHeight);
  if (input.actPressed && time > actBlock) { ui.hidePrompt(); best.fn(); }
}

// ---------- Loop ----------
const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  tick(Math.min(clock.getDelta(), 0.05));
  renderer.render(scene, camera);
}
// usado em testes: avança a simulação sem depender do requestAnimationFrame
window.__play = n => playChapter(n);
window.__step = (n = 60) => { for (let i = 0; i < n; i++) tick(1 / 60); renderer.render(scene, camera); };
function tick(dt) {
  pollInput();
  if (input.escPressed) { if (mode === 'play') pause(); else if (mode === 'pause') { ui.hide('pause'); mode = 'play'; } }
  if (mode !== 'pause') {
    time += dt;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i]; tw.t += dt; const k = Math.min(1, tw.t / tw.dur);
      tw.fn(tw.ease(k)); if (k >= 1) { tweens.splice(i, 1); tw.res(); }
    }
    if (mode === 'play') player.update(dt, input, locked);
    if (chapter) chapter.update(dt, time, mode === 'play');
    updateCam(dt);
    world.update(dt, time, camera);
    updateInteract();
  }
  consume();
}

// ---------- Início ----------
initInput(canvas);
setSound(save.sound);
buildChapter(1);
enterMenu();
cam.snap();
frame();
ui.hide('loading');
