// Ferramentas comuns dos capítulos: moradores, objetos para achar, quem segue a anjinha, estrelas, seta-guia e o final.
import * as THREE from 'three';
import { terrainHeight as H, person, V, animateChar, glow, rng } from '../world.js';
import { itemModel, animateQuad } from '../models.js';
import { CHAPTERS, CANDLE_CHAPTERS, CHRIST_CANDLE } from '../chapters.js';
import { wreathSVG } from '../ui.js';

const CANDLE_NAMES = ['da esperança', 'da paz', 'da alegria', 'do amor'];

export function kit(ctx, n) {
  const { world, scene, player, ui, sfx, cam, tween } = ctx;
  const K = { npcs: [], pickups: [], movers: [], followers: [], extra: [], stars: null, target: null, stage: 0, cutscene: false };
  K.live = () => { if (!ctx.alive) throw new Error('capítulo encerrado'); };
  K.step = async p => { await p; K.live(); };
  K.say = lines => K.step(ui.say(lines));
  K.wait = s => K.step(ctx.wait(s));
  K.refresh = () => {};

  // Coloca um modelo no chão
  K.place = (m, x, z, ry = 0, dy = 0) => { m.position.set(x, H(x, z) + dy, z); m.rotation.y = ry; scene.add(m); return m; };
  // Anima qualquer personagem (gente ou bicho)
  const anim = (m, t, dt, o = {}) => { if (m.userData.rig) animateChar(m, t, dt, o); else if (m.userData.legs && m.userData.tail) animateQuad(m, t, dt, o.speed || 0); };
  K.anim = anim;

  // ---------- Moradores ----------
  K.npc = def => {
    const m = def.model || person(def.look);
    const s = def.look && def.look.s || 1;
    K.place(m, def.x, def.z, def.face || 0);
    if (def.collide !== false) world.addCircle(def.x, def.z, def.r || 0.45 * s);
    const o = { ...def, model: m, talks: 0, base: def.face || 0, pos: V(def.x, H(def.x, def.z), def.z) };
    K.npcs.push(o);
    if (def.lines) ctx.interact({
      pos: o.pos, r: def.talkR || 2.8, label: def.label || `Falar com ${def.name}`, enabled: () => (def.enabled ? def.enabled() : true),
      fn: async () => {
        ctx.lock(true);
        const lines = o.talks === 0 || !def.again ? def.lines() : def.again();
        o.talks++;
        try { await K.say(lines); } catch (e) { return; }
        def.after && def.after(o);
        if (!K.cutscene) ctx.lock(false);
        K.refresh();
      },
    });
    return o;
  };

  // ---------- Objetos para achar (encostar pega) ----------
  K.pickup = (kind, x, z, opt = {}) => {
    const m = opt.model || itemModel(kind); const y = opt.y ?? H(x, z) + 0.3;
    m.position.set(x, y, z); m.scale.setScalar(opt.s || 1.2); scene.add(m);
    const p = { kind, m, x, y, z, taken: false, known: opt.known ?? true, onGet: opt.onGet, enabled: opt.enabled, s: opt.s || 1.2 };
    K.pickups.push(p); return p;
  };

  // ---------- Quem segue a anjinha (burrinho, pastores, Maria...) ----------
  K.follow = (m, opt = {}) => {
    const f = { m, on: false, gap: opt.gap || 1.8, speed: opt.speed || 5.8, slot: opt.slot || 0, v: 0, phase: 0, r: opt.r || 0.4 };
    K.followers.push(f); return f;
  };
  // Anda até um ponto (para cenas); resolve ao chegar
  K.walkTo = (m, x, z, speed = 2.2) => new Promise(res => { K.movers = K.movers.filter(w => w.m !== m); K.movers.push({ m, x, z, speed, res, phase: 0 }); });

  // ---------- Estrelas escondidas ----------
  K.starsAt = list => { K.stars = world.collectStars(list.map(([x, y, z]) => ({ x, y, z }))); return K.stars; };
  K.starQuest = () => ({ t: `Estrelas escondidas (${K.stars.count}/${K.stars.total})`, done: K.stars.count >= K.stars.total, opt: true });

  // ---------- Abertura do capítulo ----------
  K.intro = async ({ title, sub, narr, x, z, facing = Math.PI, yaw = 0 }) => {
    player.place(x, z, facing);
    cam.yaw = yaw; cam.pitch = 0.28; cam.follow(); cam.snap();
    ui.setStars(0, K.stars ? K.stars.total : 0); ui.setQuests([]); ui.setArrow(null);
    await K.step(ui.fade(0, 1.4));
    await K.step(ui.titleCard(`Capítulo ${n}`, title, sub));
    if (narr) await K.say(narr);
  };
  K.play = () => {
    cam.follow(); K.cutscene = false; ctx.lock(false); K.refresh();
  };

  // ---------- Final do capítulo ----------
  K.complete = async ({ verse, ref, reflect }) => {
    const s = ctx.save;
    const first = !s.completed.includes(n);
    if (first) s.completed.push(n);
    if (!s.pieces.includes(n)) s.pieces.push(n);
    const got = K.stars ? K.stars.count : 0, total = K.stars ? K.stars.total : 0;
    s.stars[n] = Math.max(s.stars[n] || 0, got);
    ctx.persist();
    ui.setArrow(null); ui.setQuests([]);
    await K.step(ui.card(`
      <div class="card-kicker">Palavra de Deus</div>
      <p class="verse">“${verse}”</p>
      <div class="ref">${ref}</div>
      <div class="reflect"><b>Para você:</b> ${reflect}</div>`));
    sfx.done();
    const ci = CANDLE_CHAPTERS.indexOf(n);
    const candle = ci >= 0
      ? (first ? `A <b>${ci + 1}ª vela do Advento</b> foi acesa: a vela ${CANDLE_NAMES[ci]}.` : `A ${ci + 1}ª vela do Advento continua acesa.`)
      : n === CHRIST_CANDLE ? 'A <b>vela de Cristo</b>, branca, brilha no centro da coroa: Jesus nasceu! Feliz Natal!' : '';
    const nx = CHAPTERS[n], next = nx && nx.ready ? nx : null;
    const lit = CANDLE_CHAPTERS.map(c => s.completed.includes(c));
    await K.step(ui.card(`
      <div class="card-kicker">Capítulo ${n} concluído</div>
      <div class="reward-ic">✦</div>
      <h2>Peça do presépio: ${CHAPTERS[n - 1].piece}</h2>
      <p>Estrelas encontradas: <b>${got}/${total}</b>${got < total ? '<br><small>Jogue de novo para achar todas!</small>' : ' 🌟 Todas!'}</p>
      <div class="mini-wreath">${wreathSVG(lit, s.completed.includes(CHRIST_CANDLE))}</div>
      ${candle ? `<p>${candle}</p>` : ''}
      <p><small>${next ? `Próximo: <b>Capítulo ${next.n} · ${next.title}</b>` : nx ? `Próximo: <b>Capítulo ${nx.n} · ${nx.title}</b> (em breve)` : 'Você completou toda a jornada, do “sim” de Maria até a Noite Santa. Veja o seu presépio completo no menu!'}</small></p>`,
      next ? 'Próximo capítulo ▶' : 'Voltar ao menu'));
    ctx.finish(next ? next.n : null);
  };

  // ---------- Loop ----------
  const tmp = V(), pp = V();
  K.update = (dt, t, playing) => {
    tmp.copy(player.pos); tmp.y += 0.8;
    if (K.stars) K.stars.update(t, playing ? tmp : V(0, -999, 0), () => {
      sfx.star(); ui.setStars(K.stars.count, K.stars.total, true); K.refresh();
      if (K.stars.count === K.stars.total) ui.toast('Você encontrou todas as estrelas! 🌟');
    });
    for (const p of K.pickups) {
      if (p.taken) continue;
      p.m.rotation.y = t * 0.9; p.m.position.y = p.y + Math.sin(t * 2 + p.x) * 0.1;
      if (playing && !K.cutscene && (!p.enabled || p.enabled()) && tmp.distanceTo(pp.set(p.x, p.y + 0.6, p.z)) < 1.9) {
        p.taken = true; sfx.item();
        tween(0.5, k => { p.m.scale.setScalar(p.s * (1 - k)); p.m.position.y = p.y + k * 1.5; }).then(() => { p.m.visible = false; });
        p.onGet && p.onGet(p); K.refresh();
      }
    }
    // moradores olham para a anjinha
    for (const o of K.npcs) {
      if (K.followers.some(f => f.on && f.m === o.model) || K.movers.some(w => w.m === o.model)) continue;
      if (o.static || o.model.parent !== scene) { anim(o.model, t, dt, { talk: ui.speaker === o.name }); continue; }
      const dx = player.pos.x - o.model.position.x, dz = player.pos.z - o.model.position.z, d = Math.hypot(dx, dz);
      if (!o.moving) {
        const target = d < 7 && playing ? Math.atan2(dx, dz) : o.base;
        let a = target - o.model.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a));
        o.model.rotation.y += a * Math.min(1, dt * 4);
      }
      anim(o.model, t, dt, { talk: ui.speaker === o.name, speed: o.moving ? 2 : 0, phase: t * 5 });
    }
    // quem segue a anjinha
    for (const f of K.followers) {
      if (!f.on) continue;
      const m = f.m, back = f.gap + f.slot * 1.3;
      const side = f.slot % 2 ? 1 : -1;
      const tx = player.pos.x - Math.sin(player.facing) * back + Math.cos(player.facing) * side * (f.slot ? 0.9 : 0);
      const tz = player.pos.z - Math.cos(player.facing) * back - Math.sin(player.facing) * side * (f.slot ? 0.9 : 0);
      const dx = tx - m.position.x, dz = tz - m.position.z, d = Math.hypot(dx, dz);
      const want = d > 0.4 ? Math.min(f.speed * (d > 12 ? 2 : 1), d * 3) : 0;
      f.v += (want - f.v) * Math.min(1, dt * 6);
      if (d > 0.05) { m.position.x += dx / d * f.v * dt; m.position.z += dz / d * f.v * dt; }
      if (d > 25) { m.position.x = tx; m.position.z = tz; }
      pp.set(m.position.x, 0, m.position.z); world.collide(pp, f.r); m.position.x = pp.x; m.position.z = pp.z;
      m.position.y = H(m.position.x, m.position.z);
      if (f.v > 0.3) { const a0 = Math.atan2(dx, dz); let a = a0 - m.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); m.rotation.y += a * Math.min(1, dt * 6); }
      f.phase += f.v * dt * 2.2;
      anim(m, t, dt, { speed: f.v, phase: f.phase });
    }
    // caminhadas de cena
    for (const w of [...K.movers]) {
      const m = w.m, dx = w.x - m.position.x, dz = w.z - m.position.z, d = Math.hypot(dx, dz);
      if (d < 0.08) { K.movers.splice(K.movers.indexOf(w), 1); anim(m, t, dt, {}); w.res(); continue; }
      const st = Math.min(d, w.speed * dt);
      m.position.x += dx / d * st; m.position.z += dz / d * st; m.position.y = H(m.position.x, m.position.z);
      const a0 = Math.atan2(dx, dz); let a = a0 - m.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); m.rotation.y += a * Math.min(1, dt * 8);
      w.phase += w.speed * dt * 2.2;
      anim(m, t, dt, { speed: w.speed, phase: w.phase });
    }
    for (const f of K.extra) f(dt, t, playing);
    // seta-guia
    if (playing && !K.cutscene) {
      let target = K.target ? K.target() : null;
      if (Array.isArray(target)) {
        let bd = 1e9, best = null;
        for (const c of target) { const dd = Math.hypot(c.x - player.pos.x, c.z - player.pos.z); if (dd < bd) { bd = dd; best = c; } }
        target = best;
      }
      if (target && Math.hypot(target.x - player.pos.x, target.z - player.pos.z) > 3) {
        const hf = Math.atan2(-Math.sin(cam.yaw), -Math.cos(cam.yaw));
        const ht = Math.atan2(target.x - player.pos.x, target.z - player.pos.z);
        let r = hf - ht; r = Math.atan2(Math.sin(r), Math.cos(r));
        ui.setArrow(r);
      } else ui.setArrow(null);
    } else if (K.cutscene) ui.setArrow(null);
  };

  // Bosque de pinheiros e pedras em volta do mapa, evitando as áreas de jogo
  K.forest = ({ seed = 1, n = 150, r0 = 24, r1 = 95, avoid = () => false, extra = [], rocks = 30 } = {}) => {
    const R = rng(seed), list = [];
    for (let i = 0; i < n * 2 && list.length < n; i++) {
      const a = R() * Math.PI * 2, d = r0 + R() * (r1 - r0), x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (!avoid(x, z)) list.push({ x, z, s: 0.9 + R() * 0.8, ry: R() * 6 });
    }
    world.pines(list.concat(extra.map(([x, z, s = 1]) => ({ x, z, s, ry: x }))));
    const rl = [];
    for (let i = 0; i < rocks; i++) { const a = R() * Math.PI * 2, d = r0 * 0.7 + R() * 50, x = Math.cos(a) * d, z = Math.sin(a) * d; if (!avoid(x, z)) rl.push({ x, z, s: 0.4 + R() * 0.8, ry: R() * 6 }); }
    world.rocks(rl);
  };
  // Pontinho de luz no chão para marcar um lugar
  K.marker = (x, z, color = '#ffd36b') => { const g = glow(color, 3, 0.7); g.position.set(x, H(x, z) + 1, z); scene.add(g); return g; };
  return K;
}

// Visual dos personagens que aparecem em vários capítulos
export const LOOKS = {
  maria: { color: '#f6efe4', trim: '#e3b94f', mantle: '#3f72c8', veil: '#3f72c8', hair: { color: '#6b4528', style: 'short' }, eyes: '#6b4528', skin: '#f2c9a8', lashes: true, long: true },
  jose: { color: '#c9a47a', sash: '#7a5233', mantle: '#7a8f5a', long: true, male: true, hair: { color: '#4a3020', style: 'short' }, beard: '#4a3020', eyes: '#4a3020', skin: '#e2b08a', staff: true, s: 1.08 },
  gabriel: null,
};
