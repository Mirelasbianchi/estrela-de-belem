// Música e efeitos sonoros gerados em código (Web Audio). Melodias de domínio público.
let ctx = null, master, musicBus, sfxBus, noiseBuf;
let enabled = true, musicOn = false, musicTimer = null, loopNodes = [];

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = enabled ? 0.85 : 0; master.connect(ctx.destination);
  // "reverb" simples com delay realimentado
  const delay = ctx.createDelay(1); delay.delayTime.value = 0.31;
  const fb = ctx.createGain(); fb.gain.value = 0.38;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
  const wet = ctx.createGain(); wet.gain.value = 0.32;
  delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(wet); wet.connect(master);
  musicBus = ctx.createGain(); musicBus.gain.value = 0.2; musicBus.connect(master); musicBus.connect(delay);
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master); sfxBus.connect(delay);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  document.addEventListener('visibilitychange', () => { if (!ctx) return; document.hidden ? ctx.suspend() : ctx.resume(); });
}
export function setSound(on) {
  enabled = on;
  if (ctx) master.gain.setTargetAtTime(on ? 0.85 : 0, ctx.currentTime, 0.05);
}

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function NOTE(n) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n);
  const midi = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12 * (+m[3] + 1);
  return 440 * Math.pow(2, (midi - 69) / 12);
}
function tone(freq, t, dur, { type = 'sine', gain = 0.3, attack = 0.01, out = sfxBus, detune = 0 } = {}) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, attack + 0.02));
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
}
function bell(freq, t, dur, gain = 0.25, out = sfxBus) {
  tone(freq, t, dur, { gain, out });
  tone(freq * 2.01, t, dur * 0.6, { gain: gain * 0.35, out });
  tone(freq * 3.0, t, dur * 0.3, { gain: gain * 0.12, out });
}
function noise(t, dur, { freq = 1200, q = 1, gain = 0.2, type = 'bandpass', sweep = null } = {}) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + dur + 0.05);
}

// ---- Noite Feliz (Stille Nacht, F. Gruber, 1818) em 6/8 ----
const MEL = [['G4',3],['A4',1],['G4',2],['E4',6],['G4',3],['A4',1],['G4',2],['E4',6],
  ['D5',4],['D5',2],['B4',6],['C5',4],['C5',2],['G4',6],
  ['A4',4],['A4',2],['C5',3],['B4',1],['A4',2],['G4',3],['A4',1],['G4',2],['E4',6],
  ['A4',4],['A4',2],['C5',3],['B4',1],['A4',2],['G4',3],['A4',1],['G4',2],['E4',6],
  ['D5',4],['D5',2],['F5',3],['D5',1],['B4',2],['C5',6],['E5',6],
  ['C5',3],['G4',1],['E4',2],['G4',3],['F4',1],['D4',2],['C4',12]];
const CH = ['C','C','C','C','G','G','C','C','F','F','C','C','F','F','C','C','G','G','C','C','C','G','C','C'];
const CHORD = { C: ['C3','G3','E4'], G: ['G2','D3','B3'], F: ['F2','C3','A3'] };

export function startMusic() {
  if (!ctx || musicOn) return; musicOn = true; scheduleLoop(ctx.currentTime + 0.4);
}
function scheduleLoop(t0) {
  if (!musicOn) return;
  const e = 0.33; const lg = ctx.createGain(); lg.gain.value = 1; lg.connect(musicBus); loopNodes.push(lg);
  let t = t0;
  for (const [n, d] of MEL) {
    const f = NOTE(n), dur = d * e;
    tone(f, t, dur * 0.95, { type: 'triangle', gain: 0.32, attack: 0.03, out: lg });
    tone(f * 2, t, dur * 0.5, { type: 'sine', gain: 0.05, attack: 0.02, out: lg });
    t += dur;
  }
  CH.forEach((c, i) => {
    const tt = t0 + i * 6 * e;
    CHORD[c].forEach((n, j) => tone(NOTE(n), tt + j * e, (6 - j) * e, { type: 'sine', gain: 0.1, attack: 0.06, out: lg }));
    bell(NOTE(CHORD[c][2]) * 2, tt, 1.2, 0.025, lg);
  });
  const end = t + 2.5;
  musicTimer = setTimeout(() => { loopNodes = loopNodes.filter(n => n !== lg); scheduleLoop(end); }, Math.max(0, (end - ctx.currentTime - 0.6) * 1000));
}
export function stopMusic() {
  musicOn = false; clearTimeout(musicTimer);
  if (!ctx) return;
  for (const n of loopNodes) { n.gain.setTargetAtTime(0, ctx.currentTime, 0.4); setTimeout(() => n.disconnect(), 3000); }
  loopNodes = [];
}

export const sfx = {
  star() { if (!ctx) return; const t = ctx.currentTime; bell(NOTE('E6'), t, 0.3, 0.16); bell(NOTE('B6'), t + 0.07, 0.45, 0.14); },
  item() { if (!ctx) return; const t = ctx.currentTime; ['C5','E5','G5','C6','E6'].forEach((n, i) => bell(NOTE(n), t + i * 0.09, 0.8, 0.17)); },
  lamp() { if (!ctx) return; const t = ctx.currentTime; noise(t, 0.5, { freq: 400, sweep: 3000, gain: 0.25 }); bell(NOTE('G5'), t + 0.15, 1.2, 0.18); bell(NOTE('D6'), t + 0.25, 1.0, 0.1); },
  jump() { if (!ctx) return; const t = ctx.currentTime; noise(t, 0.18, { freq: 900, sweep: 2200, gain: 0.12 }); },
  flap() { if (!ctx) return; const t = ctx.currentTime; noise(t, 0.22, { freq: 600, sweep: 1600, q: 0.7, gain: 0.16 }); tone(NOTE('A5'), t, 0.12, { gain: 0.03 }); },
  blip() { if (!ctx) return; tone(NOTE('A5') * (0.94 + Math.random() * 0.12), ctx.currentTime, 0.05, { gain: 0.025 }); },
  open() { if (!ctx) return; bell(NOTE('C6'), ctx.currentTime, 0.4, 0.1); },
  done() { if (!ctx) return; const t = ctx.currentTime; [['C5',0],['E5',0.12],['G5',0.24],['C6',0.36],['G5',0.6],['C6',0.75]].forEach(([n, d]) => bell(NOTE(n), t + d, 1.0, 0.16)); },
  choir(dur = 10) {
    if (!ctx) return; const t = ctx.currentTime;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; f.connect(sfxBus);
    for (const n of ['C4','E4','G4','C5','E5']) for (const dt of [-8, 8]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = NOTE(n); o.detune.value = dt;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.025, t + 2.5); g.gain.setValueAtTime(0.025, t + dur - 3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(f); o.start(t); o.stop(t + dur + 0.1);
    }
  },
  note(n, dur = 1.4, gain = 0.2) { if (!ctx) return; const t = ctx.currentTime; bell(NOTE(n), t, dur, gain); tone(NOTE(n) / 2, t, dur * 1.2, { type: 'triangle', gain: gain * 0.4, attack: 0.05 }); },
  // "Glória" em sequência descendente, com sinos
  gloria() {
    if (!ctx) return; const t = ctx.currentTime;
    const run = [['G5',1],['F5',1],['E5',1],['F5',1],['G5',1],['F5',1],['E5',1],['D5',1],['E5',1],['D5',1],['C5',1],['D5',1],['E5',1],['D5',1],['C5',1],['B4',1],['C5',2],['F5',2],['D5',2],['E5',4],['C5',6]];
    let k = 0; for (const [n, d] of run) { bell(NOTE(n), t + k * 0.22, d * 0.3 + 0.5, 0.15); k += d; }
  },
  glory() { if (!ctx) return; const t = ctx.currentTime; ['C5','E5','G5','C6','E6','G6','C7'].forEach((n, i) => bell(NOTE(n), t + i * 0.11, 2.2, 0.13)); },
};
