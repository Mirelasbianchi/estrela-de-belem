// Interface: diálogos, cartões, HUD, coroa do Advento.
import { sfx } from './audio.js';
import { input } from './input.js';

const $ = id => document.getElementById(id);

export const ui = {
  show(id) { $(id).classList.remove('hidden'); },
  hide(id) { $(id).classList.add('hidden'); },

  // ---------- Diálogo ----------
  say(lines) {
    return new Promise(resolve => {
      let i = 0, typing = null, full = '', shown = 0;
      const box = $('dialog'), name = $('dlgName'), text = $('dlgText'), next = $('dlgNext');
      const openedAt = performance.now();
      ui.show('dialog'); ui.show('dialogCatch');
      const showLine = () => {
        const l = typeof lines[i] === 'string' ? { who: null, text: lines[i] } : lines[i];
        name.textContent = l.who || ''; text.classList.toggle('narr', !l.who);
        full = l.text; shown = 0; text.textContent = ''; next.style.visibility = 'hidden';
        clearInterval(typing);
        typing = setInterval(() => {
          shown += 2; text.textContent = full.slice(0, shown);
          if (shown % 6 === 0) sfx.blip();
          if (shown >= full.length) { clearInterval(typing); typing = null; next.style.visibility = 'visible'; }
        }, 24);
      };
      const advance = () => {
        if (performance.now() - openedAt < 250) return;
        if (typing) { clearInterval(typing); typing = null; text.textContent = full; next.style.visibility = 'visible'; return; }
        i++;
        if (i >= lines.length) { cleanup(); resolve(); } else showLine();
      };
      const onKey = e => { if (['Space', 'Enter', 'KeyE'].includes(e.code) && !e.repeat) { e.preventDefault(); advance(); } };
      const onClick = e => { e.preventDefault(); advance(); };
      const cleanup = () => {
        clearInterval(typing); ui._cleanup = null;
        ui.hide('dialog'); ui.hide('dialogCatch');
        removeEventListener('keydown', onKey); box.removeEventListener('pointerdown', onClick); $('dialogCatch').removeEventListener('pointerdown', onClick);
        input.jumpPressed = false; input.actPressed = false;
      };
      if (ui._cleanup) ui._cleanup();
      ui._cleanup = cleanup;
      addEventListener('keydown', onKey); box.addEventListener('pointerdown', onClick); $('dialogCatch').addEventListener('pointerdown', onClick);
      showLine();
    });
  },

  // ---------- Cartões ----------
  card(html, button = 'Continuar') {
    return new Promise(resolve => {
      $('cardBody').innerHTML = html; $('cardBtn').textContent = button; ui.show('card'); sfx.open();
      const b = $('cardBtn');
      const done = () => { b.removeEventListener('click', done); removeEventListener('keydown', onKey); ui.hide('card'); resolve(); };
      const onKey = e => { if (e.code === 'Enter') done(); };
      setTimeout(() => { b.addEventListener('click', done); addEventListener('keydown', onKey); }, 400);
    });
  },
  titleCard(kicker, title, sub, dur = 3.6) {
    const tc = $('titlecard');
    tc.querySelector('.tc-kicker').textContent = kicker; tc.querySelector('.tc-title').textContent = title; tc.querySelector('.tc-sub').textContent = sub;
    tc.classList.add('hidden'); void tc.offsetWidth; tc.classList.remove('hidden');
    return new Promise(r => setTimeout(() => { tc.classList.add('hidden'); r(); }, dur * 1000));
  },
  modal(html) { $('modalBody').innerHTML = html; ui.show('modal'); sfx.open(); },

  toast(msg, dur = 2.6) {
    const t = $('toast'); t.textContent = msg; t.classList.add('hidden'); void t.offsetWidth; t.classList.remove('hidden');
    clearTimeout(ui._tt); ui._tt = setTimeout(() => t.classList.add('hidden'), dur * 1000);
  },
  fade(to, dur = 0.8, color = '#000') {
    const f = $('fade'); f.style.background = color; f.style.transition = `opacity ${dur}s ease`; f.style.opacity = to;
    return new Promise(r => setTimeout(r, dur * 1000));
  },
  async flash() { await ui.fade(1, 0.35, '#fff8e6'); await ui.fade(0, 1.6, '#fff8e6'); },
  setFade(v, color = '#000') { const f = $('fade'); f.style.transition = 'none'; f.style.background = color; f.style.opacity = v; },

  // ---------- HUD ----------
  setQuests(list) {
    $('quests').innerHTML = list.map(q => `<div class="q ${q.done ? 'done' : ''} ${q.opt ? 'opt' : ''}"><span class="b">${q.done ? '✓' : ''}</span><span>${q.t}</span></div>`).join('');
  },
  setStars(n, total, bump = false) {
    $('starCount').textContent = `${n}/${total}`;
    if (bump) { const s = $('stars'); s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump'); }
  },
  setArrow(rad) {
    const a = $('arrow');
    if (rad === null) { a.classList.add('off'); return; }
    a.classList.remove('off'); a.style.transform = `rotate(${rad}rad)`;
  },
  prompt(text, x, y) {
    if (input.touch) {
      const b = $('btnAct'); b.textContent = text; b.classList.remove('hidden'); ui.hide('prompt');
    } else {
      const p = $('prompt'); p.innerHTML = `<kbd>E</kbd>${text}`; p.style.left = x + 'px'; p.style.top = y + 'px'; p.classList.remove('hidden');
    }
  },
  hidePrompt() { ui.hide('prompt'); $('btnAct').classList.add('hidden'); },
};

// ---------- Coroa do Advento (SVG) ----------
export function wreathSVG(lit = [false, false, false, false], christ = false) {
  const cx = 130, cy = 118, rx = 100, ry = 36;
  let leaves = '';
  for (let i = 0; i < 70; i++) {
    const a = i / 70 * Math.PI * 2, x = cx + Math.cos(a) * rx * (0.92 + (i % 3) * 0.06), y = cy + Math.sin(a) * ry * (0.9 + (i % 2) * 0.12);
    const rot = (a * 180 / Math.PI + 90 + (i % 5) * 18).toFixed(0);
    leaves += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="15" ry="6" fill="${['#1f5236', '#2c6b45', '#3b8152'][i % 3]}" transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2 + 0.2, x = cx + Math.cos(a) * rx * 1.02, y = cy + Math.sin(a) * ry * 1.08;
    leaves += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#d3303c"/><circle cx="${(x - 1.2).toFixed(1)}" cy="${(y - 1.2).toFixed(1)}" r="1.2" fill="#ff9aa2"/>`;
  }
  const flame = (x, y, on) => on
    ? `<circle cx="${x}" cy="${y - 10}" r="18" fill="url(#fg)"/><path class="flame" style="animation-delay:${(x % 7) / 10}s" d="M${x} ${y - 24} C ${x + 7} ${y - 13}, ${x + 6} ${y - 2}, ${x} ${y} C ${x - 6} ${y - 2}, ${x - 7} ${y - 13}, ${x} ${y - 24} Z" fill="url(#ff)"/>`
    : `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 6}" stroke="#333" stroke-width="2"/>`;
  const candle = (x, base, h, color, on, w = 16) => `
    <rect x="${x - w / 2}" y="${base - h}" width="${w}" height="${h}" rx="3" fill="${color}"/>
    <rect x="${x - w / 2}" y="${base - h}" width="${w / 3}" height="${h}" rx="2" fill="rgba(255,255,255,.18)"/>
    <ellipse cx="${x}" cy="${base - h}" rx="${w / 2}" ry="3" fill="rgba(255,255,255,.25)"/>
    ${flame(x, base - h - 2, on)}`;
  // posições: 1 esquerda, 2 fundo, 3 direita (rosa — Gaudete), 4 frente
  const P = [[cx - rx, cy], [cx, cy - ry], [cx + rx, cy], [cx, cy + ry]];
  const C = ['#6b3fa0', '#6b3fa0', '#e07fb4', '#6b3fa0'];
  const order = [1, 0, 2];
  let back = order.map(i => candle(P[i][0], P[i][1] + 4, 52, C[i], lit[i])).join('');
  const center = candle(cx, cy + 6, 70, '#fbf6ea', christ, 20);
  const front = candle(P[3][0], P[3][1] + 4, 52, C[3], lit[3]);
  return `<svg viewBox="0 0 260 180" xmlns="http://www.w3.org/2000/svg" aria-label="Coroa do Advento">
    <defs>
      <radialGradient id="fg"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
      <linearGradient id="ff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c8"/><stop offset=".6" stop-color="#ffc341"/><stop offset="1" stop-color="#ff7a1a"/></linearGradient>
    </defs>
    <ellipse cx="${cx}" cy="${cy + 8}" rx="${rx + 22}" ry="${ry + 14}" fill="rgba(0,0,0,.25)"/>
    ${back}${leaves}${center}${front}
  </svg>`;
}
