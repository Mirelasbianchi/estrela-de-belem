// Motor principal: renderização, câmera, estados (menu / jogo / pausa) e capítulos.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { World, terrainHeight, clamp } from './world.js';
import { Player } from './player.js';
import { input, initInput, pollInput, consume } from './input.js';
import { ui, wreathSVG } from './ui.js';
import { initAudio, sfx, startMusic, stopMusic, setSound } from './audio.js';
import { save, persist } from './save.js';
import { CHAPTERS, CANDLE_CHAPTERS, CHRIST_CANDLE } from './chapters.js';
import * as ch1 from './chapters/ch1.js';

const BUILDERS = { 1: ch1 };
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
function updateCam(dt) {
  if (cam.mode === 'follow') {
    if (!locked) cam.pitch = clamp(cam.pitch + input.camDY * 0.004, -0.05, 0.9);
    // a câmera fica sempre atrás da anjinha e gira junto com ela
    let d = (player.facing + Math.PI) - cam.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
    cam.yaw += cam._snap ? d : d * (1 - Math.exp(-dt * 7));
    const tgt = player.pos.clone(); tgt.y += 1.6;
    const dist = camera.aspect < 1 ? cam.dist * 1.25 : cam.dist;
    const cp = Math.cos(cam.pitch);
    cam.tPos.set(tgt.x + Math.sin(cam.yaw) * cp * dist, tgt.y + Math.sin(cam.pitch) * dist, tgt.z + Math.cos(cam.yaw) * cp * dist);
    const gh = terrainHeight(cam.tPos.x, cam.tPos.z) + 0.7; if (cam.tPos.y < gh) cam.tPos.y = gh;
    cam.tLook.copy(tgt);
    const k = cam._snap ? 1 : 1 - Math.exp(-dt * 9);
    cam.pos.lerp(cam.tPos, k); cam.look.lerp(cam.tLook, cam._snap ? 1 : 1 - Math.exp(-dt * 14));
  } else if (cam.mode === 'orbit') {
    cam.orbitA += dt * 0.045;
    cam.tPos.set(Math.sin(cam.orbitA) * 46, 17, Math.cos(cam.orbitA) * 46 - 6);
    cam.tLook.set(0, 3, -8);
    const k = cam._snap ? 1 : 1 - Math.exp(-dt * 1.5);
    cam.pos.lerp(cam.tPos, k); cam.look.lerp(cam.tLook, k);
  } else {
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
    finish: () => finishChapter(n),
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

async function finishChapter(n) {
  mode = 'menu'; locked = true;
  ui.hide('hud'); ui.hide('touch'); ui.hidePrompt();
  await ui.fade(1, 0.8);
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
    ui.modal(`<h2>Até aqui, tudo concluído!</h2>
      <p>Você terminou todos os capítulos disponíveis. O <b>Capítulo 2 · O Sonho de José</b> chega em breve.</p>
      <p>Enquanto isso, que tal voltar a Nazaré e encontrar todas as estrelas escondidas?</p>
      <div class="panel-actions"><button class="btn" id="replay1">Jogar o Capítulo 1 de novo</button></div>`);
    $('replay1').onclick = () => playChapter(1);
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
const HOW = `<h2>Como jogar</h2>
  <p>Você é um <b>anjinha mensageira</b> enviado do Céu para ajudar a preparar a chegada de Jesus.</p>
  <h3>No computador</h3>
  <div class="keys"><kbd>W / S</kbd><span>andar para frente / para trás (ou as setas)</span>
  <kbd>A / D</kbd><span>virar a anjinha (a câmera vira junto)</span>
  <kbd>Espaço</kbd><span>pular. No ar, aperte de novo para bater as asas (até 3 vezes)</span>
  <kbd>Segurar Espaço</kbd><span>planar devagarinho</span>
  <kbd>E</kbd><span>conversar / interagir</span>
  <kbd>Arrastar o mouse</kbd><span>também vira a anjinha</span>
  <kbd>Esc</kbd><span>pausar</span></div>
  <h3>No celular</h3>
  <p>Arraste o dedo no <b>lado esquerdo</b> da tela para andar e virar, ou arraste no <b>lado direito</b> para virar a anjinha (a câmera sempre acompanha). O botão de <b>asas</b> pula e voa (segure para planar). Quando aparecer um botão dourado, toque nele para conversar.</p>
  <p>💡 A seta dourada no alto da tela aponta para o próximo objetivo. As <b>estrelas</b> são segredos: procure nos telhados e no alto!</p>`;
$('bHow').onclick = () => ui.modal(HOW);
$('modalClose').onclick = () => ui.hide('modal');
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
