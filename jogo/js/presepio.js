// O presépio desenhado (SVG): cada capítulo concluído coloca uma peça no lugar.
// Também monta o cartão de Natal final para baixar (PNG).
import { CHAPTERS } from './chapters.js';

const face = (x, y, r, skin = '#f2c9a8', hair = '#5a3424', o = {}) => `
  <circle cx="${x}" cy="${y}" r="${r}" fill="${skin}"/>
  ${o.hairTop !== false ? `<path d="M${x - r} ${y - 1} a${r} ${r} 0 0 1 ${2 * r} 0 q${-r * 0.4} ${-r * 0.55} ${-r} ${-r * 0.3} q${-r * 0.6} ${-r * 0.25} ${-r} ${r * 0.3}z" fill="${hair}"/>` : ''}
  <ellipse cx="${x - r * 0.36}" cy="${y + r * 0.12}" rx="${r * 0.13}" ry="${r * 0.17}" fill="#2a1a14"/><ellipse cx="${x + r * 0.36}" cy="${y + r * 0.12}" rx="${r * 0.13}" ry="${r * 0.17}" fill="#2a1a14"/>
  <circle cx="${x - r * 0.32}" cy="${y + r * 0.05}" r="${r * 0.05}" fill="#fff"/><circle cx="${x + r * 0.4}" cy="${y + r * 0.05}" r="${r * 0.05}" fill="#fff"/>
  <path d="M${x - r * 0.2} ${y + r * 0.45} q${r * 0.2} ${r * 0.2} ${r * 0.4} 0" stroke="#9a4a4a" stroke-width="${r * 0.08}" fill="none" stroke-linecap="round"/>
  <circle cx="${x - r * 0.62}" cy="${y + r * 0.4}" r="${r * 0.16}" fill="#ff9a8f" opacity=".5"/><circle cx="${x + r * 0.62}" cy="${y + r * 0.4}" r="${r * 0.16}" fill="#ff9a8f" opacity=".5"/>`;

// desenho de cada peça (capítulo → SVG)
const PIECES = {
  1: () => `<g>
    <ellipse cx="120" cy="118" rx="34" ry="14" fill="#fff" opacity=".9" transform="rotate(-25 120 118)"/><ellipse cx="176" cy="118" rx="34" ry="14" fill="#fff" opacity=".9" transform="rotate(25 176 118)"/>
    <path d="M128 168 q20 -60 40 0z" fill="#fffaf0"/><path d="M134 168 q14 -46 28 0z" fill="#f6e8c4"/>
    ${face(148, 104, 15, '#eec3a0', '#d9a441')}
    <ellipse cx="148" cy="84" rx="15" ry="4" fill="none" stroke="#ffd75e" stroke-width="3.5"/></g>`,
  2: () => `<g>
    <path d="M176 330 q2 -78 30 -84 q28 6 30 84z" fill="#c9a47a"/><path d="M182 330 q6 -60 24 -66 q-6 30 -4 66z" fill="#7a8f5a"/>
    <rect x="200" y="276" width="14" height="5" rx="2" fill="#7a5233"/>
    <line x1="244" y1="214" x2="252" y2="332" stroke="#6b4529" stroke-width="5" stroke-linecap="round"/>
    ${face(206, 232, 19, '#e2b08a', '#4a3020')}
    <path d="M190 238 q16 30 32 0 q-4 16 -16 18 q-12 -2 -16 -18z" fill="#4a3020"/></g>`,
  3: () => `<g>
    <path d="M366 332 q-6 -50 30 -66 q36 16 30 66z" fill="#3f72c8"/><path d="M380 332 q0 -36 16 -48 q16 12 16 48z" fill="#f6efe4"/>
    <path d="M374 268 q22 -40 44 0 q-4 -12 -22 -14 q-18 2 -22 14z" fill="#3f72c8"/>
    ${face(396, 262, 18, '#f2c9a8', '#6b4528', { hairTop: false })}
    <path d="M376 258 q20 -34 40 0 q-6 -22 -20 -22 q-14 0 -20 22z" fill="#3f72c8"/>
    <path d="M388 300 l8 -10 l8 10z" fill="#f2c9a8"/></g>`,
  4: () => `<g>
    <ellipse cx="498" cy="300" rx="44" ry="26" fill="#9b9aa6"/><ellipse cx="498" cy="308" rx="32" ry="15" fill="#e8e4e0"/>
    ${[468, 482, 512, 526].map(x => `<rect x="${x - 5}" y="314" width="10" height="26" rx="5" fill="#9b9aa6"/><rect x="${x - 5}" y="334" width="10" height="7" rx="3" fill="#3c3a44"/>`).join('')}
    <ellipse cx="458" cy="272" rx="7" ry="24" fill="#9b9aa6" transform="rotate(-20 458 272)"/><ellipse cx="478" cy="268" rx="7" ry="24" fill="#9b9aa6" transform="rotate(14 478 268)"/>
    <circle cx="466" cy="290" r="22" fill="#9b9aa6"/><ellipse cx="462" cy="302" rx="14" ry="10" fill="#e8e4e0"/>
    <ellipse cx="458" cy="286" rx="3" ry="4" fill="#2a1a14"/><ellipse cx="474" cy="286" rx="3" ry="4" fill="#2a1a14"/></g>`,
  5: () => `<g>
    <path d="M250 300 l100 0 l-12 34 l-76 0z" fill="#9a6538"/>
    <line x1="256" y1="300" x2="244" y2="346" stroke="#6b4529" stroke-width="6" stroke-linecap="round"/><line x1="344" y1="300" x2="356" y2="346" stroke="#6b4529" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="300" cy="300" rx="52" ry="12" fill="#e8c25a"/>
    ${[262, 276, 292, 310, 326, 340].map((x, i) => `<line x1="${x}" y1="${296 + (i % 2) * 3}" x2="${x + 8}" y2="${289 + (i % 3) * 2}" stroke="#f0d27a" stroke-width="2"/>`).join('')}</g>`,
  6: () => `<g>
    <ellipse cx="104" cy="304" rx="50" ry="28" fill="#a8683f"/><ellipse cx="104" cy="312" rx="36" ry="16" fill="#f2dfc4"/>
    ${[72, 88, 120, 136].map(x => `<rect x="${x - 6}" y="318" width="12" height="24" rx="6" fill="#a8683f"/><rect x="${x - 6}" y="336" width="12" height="7" rx="3" fill="#4a2e20"/>`).join('')}
    <circle cx="148" cy="290" r="24" fill="#a8683f"/><ellipse cx="152" cy="303" rx="16" ry="11" fill="#f2dfc4"/>
    <path d="M128 272 q-12 -10 -4 -20" stroke="#f1e2c0" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M166 272 q12 -10 4 -20" stroke="#f1e2c0" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="140" cy="286" rx="3" ry="4" fill="#2a1a14"/><ellipse cx="157" cy="286" rx="3" ry="4" fill="#2a1a14"/></g>`,
  7: () => `<g>
    <circle cx="300" cy="290" r="40" fill="url(#pjGlow)"/>
    <ellipse cx="300" cy="292" rx="26" ry="11" fill="#fbf7ee"/>
    ${face(320, 284, 10, '#f3c9a6', '#e9dcc0', { hairTop: false })}
    <ellipse cx="320" cy="270" rx="11" ry="3" fill="none" stroke="#ffd75e" stroke-width="2.5"/></g>`,
};

// presépio completo ou parcial; `fresh` = capítulo cuja peça acabou de chegar
export function presepioSVG(pieces = [], fresh = 0, opts = {}) {
  const has = n => pieces.includes(n);
  const order = [6, 4, 5, 7, 2, 3, 1];
  const parts = order.map(n => {
    const c = CHAPTERS[n - 1];
    if (has(n)) return `<g class="pp ${n === fresh ? 'fresh' : ''} ${opts.pop ? 'pop' : ''}" style="animation-delay:${opts.pop ? order.indexOf(n) * 0.35 : 0}s">${PIECES[n]()}</g>`;
    return `<g class="pp ghost" opacity=".13">${PIECES[n]()}</g>`;
  }).join('');
  const stars = Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 137) % 600}" cy="${(i * 71) % 150}" r="${i % 3 ? 1.2 : 2}" fill="#fff8e6" opacity="${0.4 + (i % 4) * 0.15}"/>`).join('');
  return `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" class="presepio-svg" role="img" aria-label="Presépio">
    <defs>
      <linearGradient id="pjSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1745"/><stop offset="1" stop-color="#2b3b78"/></linearGradient>
      <radialGradient id="pjGlow"><stop offset="0" stop-color="#fff6c8" stop-opacity=".95"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient>
      <radialGradient id="pjStar"><stop offset="0" stop-color="#fffbe8"/><stop offset=".3" stop-color="#ffe08a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="600" height="400" rx="22" fill="url(#pjSky)"/>${stars}
    <circle cx="300" cy="46" r="44" fill="url(#pjStar)"/>
    <path d="M300 18 L307 40 L330 46 L307 52 L300 76 L293 52 L270 46 L293 40Z" fill="#fff3c4"/>
    <path d="M300 76 L232 380 L368 380Z" fill="#ffe9b0" opacity="${has(7) ? 0.16 : 0.05}"/>
    <path d="M40 352 q260 -40 520 0 l0 48 l-520 0z" fill="#3d5a3a"/><path d="M40 360 q260 -30 520 0 l0 40 l-520 0z" fill="#c9a25a" opacity=".55"/>
    <path d="M70 200 L300 112 L530 200 L512 214 L300 134 L88 214Z" fill="#8a5a3b"/>
    <rect x="96" y="208" width="12" height="148" rx="4" fill="#6b4529"/><rect x="492" y="208" width="12" height="148" rx="4" fill="#6b4529"/>
    <path d="M108 214 L300 140 L492 214 L492 356 L108 356Z" fill="#2c2418" opacity=".45"/>
    ${parts}
  </svg>`;
}

// Cartão de Natal final em PNG (desenhado num canvas, com o presépio completo)
export async function christmasCardPNG({ name = '', stars = 0, total = 0 }) {
  const W = 1080, Hh = 1350, c = document.createElement('canvas'); c.width = W; c.height = Hh;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#0b1745'); bg.addColorStop(1, '#2b3b78'); g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,248,230,${0.3 + (i % 5) * 0.12})`; g.beginPath(); g.arc((i * 263) % W, (i * 151) % Hh, i % 4 ? 1.6 : 2.8, 0, 7); g.fill(); }
  g.strokeStyle = '#e8bf55'; g.lineWidth = 6; g.strokeRect(30, 30, W - 60, Hh - 60); g.lineWidth = 2; g.strokeRect(46, 46, W - 92, Hh - 92);
  try { await document.fonts.load('110px "Mountains of Christmas"'); await document.fonts.load('600 40px Fredoka'); } catch (e) { /* segue com a fonte padrão */ }
  g.textAlign = 'center'; g.fillStyle = '#ffd36b'; g.font = '700 120px "Mountains of Christmas", serif';
  g.fillText('Feliz Natal!', W / 2, 190);
  const img = new Image();
  const svg = presepioSVG(CHAPTERS.map(ch => ch.n));
  await new Promise(res => { img.onload = res; img.onerror = res; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  try { g.drawImage(img, 60, 240, 960, 640); } catch (e) { /* sem imagem */ }
  g.fillStyle = '#fff8e6'; g.font = '600 44px Fredoka, sans-serif';
  g.fillText(name ? `${name} completou a jornada` : 'Jornada completa!', W / 2, 960);
  g.font = '400 34px Fredoka, sans-serif'; g.fillStyle = '#d9e2ff';
  g.fillText('A Estrela de Belém · da Anunciação à Noite Santa', W / 2, 1014);
  g.fillText(`Presépio completo · ${stars} de ${total} estrelas encontradas`, W / 2, 1062);
  g.fillStyle = '#ffd36b'; g.font = 'italic 500 36px Fredoka, sans-serif';
  g.fillText('“Hoje nasceu para vós um Salvador, que é o Cristo Senhor.”', W / 2, 1160);
  g.font = '400 30px Fredoka, sans-serif'; g.fillText('Lc 2,11', W / 2, 1204);
  g.fillStyle = '#9fb0e0'; g.font = '400 26px Fredoka, sans-serif';
  g.fillText(new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }), W / 2, 1270);
  return new Promise(res => c.toBlob(res, 'image/png'));
}
export async function downloadCard(info) {
  const blob = await christmasCardPNG(info); if (!blob) return;
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = 'feliz-natal-estrela-de-belem.png'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
