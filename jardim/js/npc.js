/* Nosso Jardim v2 — moradores: conversa, presente, amizade, missões e eventos */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const D = NJ.data, U = NJ.util;
  const N = (NJ.npc = {});
  const S = () => NJ.S;

  N.hearts = (p) => { const f = Math.min(5, Math.floor((p || 0) / 20)); return '💗'.repeat(f) + '🤍'.repeat(5 - f); };

  // ---------- vida dos moradores: rotina, caminhada e cumprimentos ----------
  const RT = (N.rt = {});
  const HOME = (N.home = {});
  const reset = (n) => (RT[n.n] = { x: n.x, y: n.y, d: 0, f: 0, tx: n.x, ty: n.y, wt: U.R(0.6, 3.4), greet: 0 });
  D.NPCS.forEach((n) => { HOME[n.n] = { x: n.x, y: n.y }; reset(n); });
  N.reset = () => D.NPCS.forEach(reset);
  N.pos = (n) => RT[n];

  N.nearest = function (x, y, m) {
    let best = null, bd = m || 30;
    D.NPCS.forEach((n) => { const r = RT[n.n], d = Math.hypot(r.x - x, r.y - y); if (d < bd) { bd = d; best = n; } });
    return best;
  };

  // cumprimento: bolha de fala + amizade (1× por dia por morador)
  N.greet = function (n) {
    const s = S();
    s.greetD = s.greetD || {};
    if (s.greetD[n.n] === s.day) return;
    s.greetD[n.n] = s.day;
    N.gain(n.n);
    if (NJ.float) NJ.float(n.n, U.pick(D.CH[n.n] || ['Oi!']));
    NJ.state.save();
  };

  // moradores passeiam ao redor de casa, olham para a moça e cumprimentam ao passar
  N.update = function (dt) {
    const s = S(), W = NJ.world;
    const busy = NJ.ui && (NJ.ui.pOpen || NJ.ui.dlg);
    const hh = NJ.time ? NJ.time.hour() : 12;
    const night = hh >= 20 || hh < 6;
    D.NPCS.forEach((n) => {
      const r = RT[n.n], h = HOME[n.n];
      if (r.greet > 0) r.greet -= dt;
      if (night) { r.f = 0; return; }
      const dxp = s.px - r.x, dyp = s.py - r.y, dd = Math.hypot(dxp, dyp);
      if (dd < 42) {
        r.f = 0;
        r.d = Math.abs(dxp) > Math.abs(dyp) ? (dxp < 0 ? 2 : 3) : (dyp < 0 ? 1 : 0);
        if (!busy && dd < 34 && r.greet <= 0) { r.greet = 32; N.greet(n); }
        return;
      }
      r.wt -= dt;
      if (r.wt <= 0) { r.wt = U.R(1.8, 4.6); r.tx = h.x + U.R(-24, 24); r.ty = h.y + U.R(-16, 18); }
      const dx = r.tx - r.x, dy = r.ty - r.y, d2 = Math.hypot(dx, dy);
      if (d2 > 3) {
        const sp = 15, nx = r.x + (dx / d2) * sp * dt, ny = r.y + (dy / d2) * sp * dt;
        if (!W.blk(nx, r.y)) r.x = nx; else { r.wt = 0; return; }
        if (!W.blk(r.x, ny)) r.y = ny; else { r.wt = 0; return; }
        r.f += dt * 8;
        r.d = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
      } else r.f = 0;
    });
  };

  N.gain = function (name) {
    const s = S(); s.frD = s.frD || {};
    if (s.frD[name] === s.day) return;
    s.frD[name] = s.day; s.fr[name] = (s.fr[name] || 0) + 6;
  };

  N.gift = function (name) {
    const s = S();
    const opts = ['str', 'pot', 'tom', 'sun', 'pum', 'gra', 'cab', 'f', 'c', 'a', 'egg', 'milk', 'gem'].filter((k) => (s.inv[k] || 0) > 0);
    if (!opts.length) return NJ.ui.say(name + ' ' + N.hearts(s.fr[name]), ['Ai, você não tem nada pra me dar… mas só de te ver já me alegra! 💜']);
    const best = { gem: 40, milk: 30, egg: 20 }[opts[0]] || 20;
    const k = opts.reduce((a, b) => ((D.IT[b].s || 0) > (D.IT[a].s || 0) ? b : a));
    s.inv[k]--; if (s.inv[k] <= 0) delete s.inv[k];
    s.fr[name] = (s.fr[name] || 0) + best; s.frD[name] = s.day;
    NJ.fx(s.px, s.py - 14, D.IT[k].e); NJ.audio.chord([784, 988]);
    NJ.prog.check(); NJ.state.save();
    NJ.ui.say(name + ' ' + N.hearts(s.fr[name]), ['Ooh! ' + D.IT[k].e + ' ' + D.IT[k].n + ' pra mim? Adorei! 💗']);
  };

  const events = {
    Lia: ['Um dia quero abrir a maior feira do vale… e você já faz parte dela. 💐'],
    Teo: ['Sabe, o lago fica mais bonito quando você está pescando. 🌊'],
    Mira: ['As flores que você traz têm um jeitinho especial. Obrigada por tudo. 🌷'],
    Nino: ['Você é a melhor construtora do mundo! Quer ser minha parceira de aventuras? ⭐'],
    Rosa: ['Querida, você me lembra a mim mesma quando jovem. Cuide desse coração. ❤️'],
    Bento: ['Viço! Você tem coragem de verdade. A mina não te assusta mais. ⛏️'],
    Ivo: ['Você tem a paciência de um bom pescador… e um sorriso que fisga. 🎣'],
    Vera: ['O prado floresce mais bonito quando você passa por aqui. 🌷']
  };

  N.talk = function (name) {
    const s = S();
    N.gain(name);
    const nm = name + ' ' + N.hearts(s.fr[name] || 0);
    const gb = ['🎁 Presentear', () => N.gift(name)];

    // evento de coração
    s.evDone = s.evDone || {};
    const fr = s.fr[name] || 0;
    if (fr >= 100 && !s.evDone[name]) {
      s.evDone[name] = 1; s.partner = name; NJ.audio.chord([523, 659, 784, 1046]); NJ.state.save();
      return NJ.ui.say(nm, [events[name][0], '❤️ Você e ' + name + ' agora são um casal do vale!'], null, [['Que felicidade! 💞', () => NJ.prog.check()]]);
    }
    if (fr >= 60 && !s.evDone[name + '_60']) {
      s.evDone[name + '_60'] = 1; NJ.audio.chord([587, 740]);
      return NJ.ui.say(nm, [events[name][0]], null, [gb, ['Que fofo 💜', () => 0]]);
    }

    // missões do NPC
    const qs = D.Q.filter((q) => q.npc == name && (q.req == null || (s.q[q.req] || {}).s == 2));
    for (const q of qs) {
      const st = s.q[q.id];
      if (!st) return NJ.ui.say(nm, [q.ask], null, [['Aceito! 💜', () => { s.q[q.id] = { s: 1, b: s.st[q.k] || 0 }; NJ.ui.toast('📜 Missão: ' + q.t); NJ.audio.beep(660); }], gb, ['Depois', () => 0]]);
      if (st.s == 1) {
        const pr = (s.st[q.k] || 0) - st.b;
        if (pr >= q.n) { st.s = 2; s.coins += q.r; NJ.audio.chord([880, 1100]); NJ.state.save(); NJ.prog.check(); return NJ.ui.say(nm, [q.ok, 'Recompensa: ' + q.r + ' 💰']); }
        return NJ.ui.say(nm, ['Missão "' + q.t + '": ' + pr + '/' + q.n + '. Você consegue!'], null, [gb, ['Tá bom 👍', () => 0]]);
      }
    }
    return NJ.ui.say(nm, [U.pick(D.CH[name] || ['Oi!'])], null, [gb, ['Só conversar 💬', () => 0]]);
  };
})();
