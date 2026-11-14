/* Nosso Jardim v2 — extras: buffs de comida, cozinha, máquinas, recados diários e festival */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const D = NJ.data, U = NJ.util, W = NJ.world;
  const EX = (NJ.extra = {});
  const G = () => NJ.S;
  const T = D.T;

  // ========== BUFFS ==========
  EX.buff = () => G().buff;
  EX.has = (k) => { const b = G().buff; return !!(b && b.k === k && b.left > 0); };
  EX.spd = () => (EX.has('speed') ? 1.35 : 1);        // multiplica a velocidade da personagem
  EX.timeScale = () => (EX.has('vigor') ? 1.5 : 2.2);  // quanto o relógio anda por segundo
  EX.luck = () => (EX.has('luck') || G().wx === 'rainbow' ? 1 : 0); // melhores peixes e minérios

  // clima do dia
  EX.wx = () => D.WX[G().wx] || D.WX.clear;
  EX.wxPanel = function () {
    const s = G(), w = EX.wx();
    let h = '<h3>' + w.e + ' Clima de hoje</h3><p><b>' + w.n + '</b></p><p><small>' + w.d + '</small></p>';
    h += '<p><small>' + (s.rain ? '🌧️ A chuva já regou toda a fazenda hoje.' : '☀️ Regue as plantas você mesma hoje.') + '</small></p>';
    if (s.wx === 'rainbow') h += '<p><small>🍀 Sorte do arco-íris ativa: peixes e minérios melhores!</small></p>';
    if (s.rain) h += '<p><small>⛈️ Troveja lá fora — cuidado com os clarões!</small></p>';
    NJ.ui.panel(h, 'wx');
  };

  EX.eat = function (id) {
    const f = D.FOOD.find((x) => x.id === id); if (!f) return;
    if (!NJ.econ.take(id, 1)) { NJ.ui.toast('Você não tem esse prato 🍽️'); return; }
    const bf = D.BUFFS[f.buff.k];
    G().buff = { k: f.buff.k, left: f.buff.t };
    NJ.audio.chord([523, 659, 784]); NJ.fx(G().px, G().py - 20, bf.e);
    NJ.ui.toast('🍽️ ' + D.IT[id].n + ' → ' + bf.e + ' ' + bf.n + ' por ' + f.buff.t + 's');
    NJ.state.save();
    if (NJ.ui.pCur === 'inv') NJ.ui.inv(); else if (NJ.ui.pCur === 'cook') EX.cook();
  };

  // ========== COZINHA (receitas com buff) ==========
  EX.cook = function () {
    const b = G().buff;
    let h = '<h3>🍳 Cozinha</h3><p>Transforme ingredientes em pratos que dão <b>efeitos temporários</b>.</p>';
    if (b) h += '<p><small>Efeito ativo: ' + D.BUFFS[b.k].e + ' <b>' + D.BUFFS[b.k].n + '</b> · ' + Math.ceil(b.left) + 's</small></p>';
    D.FOOD.forEach((f) => {
      const it = D.IT[f.id], bf = D.BUFFS[f.buff.k];
      const can = Object.keys(f.need).every((k) => NJ.econ.have(k, f.need[k]));
      const need = Object.keys(f.need).map((k) => D.IT[k].e + D.IT[k].n + '×' + f.need[k]).join(' + ');
      h += '<div class="r"><span>' + it.e + ' <b>' + it.n + '</b> <small>(' + need + ')</small><br><small>' + bf.e + ' ' + bf.n + ' — ' + bf.d + ' · ' + f.buff.t + 's</small></span><button data-a="cook" data-k="' + f.id + '"' + (can ? '' : ' disabled') + '>Cozinhar</button></div>';
    });
    h += '<p><small>Já tem o prato? Abra a 🎒 mochila e toque em <b>Comer</b>.</small></p>';
    NJ.ui.panel(h, 'cook');
  };

  // ========== MÁQUINAS DE PROCESSAMENTO ==========
  EX.machState = (tx, ty) => G().mach[tx + ',' + ty] || null;
  EX.machTarget = function (id, tx, ty) {
    const m = D.MACHMAP[id], st = EX.machState(tx, ty), acts = [];
    if (st && st.rc) {
      if (st.t > 0) acts.push({ e: '⏳', l: 'Faltam ' + Math.ceil(st.t) + 's', fn: () => NJ.ui.toast('⏳ ' + D.IT[st.out].e + ' ' + D.IT[st.out].n + ' — faltam ' + Math.ceil(st.t) + 's') });
      else acts.push({ e: '📦', l: 'Recolher ' + D.IT[st.out].n, fn: () => EX.machCollect(tx, ty) });
    } else {
      m.out.forEach((rid) => {
        const rc = D.RECIPES.find((r) => r.id === rid); if (!rc) return;
        acts.push({ e: rc.e, l: rc.n, fn: () => EX.machStart(tx, ty, rid) });
      });
    }
    return { x: tx * T + 8, y: ty * T, name: m.n, acts };
  };
  EX.machStart = function (tx, ty, rid) {
    const k = tx + ',' + ty, rc = D.RECIPES.find((r) => r.id === rid);
    if (!rc) return;
    if (!Object.keys(rc.need).every((x) => NJ.econ.have(x, rc.need[x]))) { NJ.ui.toast('Faltam ingredientes 😕'); NJ.audio.beep(200); return; }
    Object.keys(rc.need).forEach((x) => NJ.econ.take(x, rc.need[x]));
    G().mach[k] = { rc: rid, out: rc.out, t: rc.time };
    NJ.audio.beep(560); NJ.ui.toast('🎛️ ' + rc.n + ' em produção… (' + rc.time + 's)'); NJ.state.save();
    NJ.inter.open(EX.machTarget(D.BLM[G().built[k]].id, tx, ty));
  };
  EX.machCollect = function (tx, ty) {
    const k = tx + ',' + ty, st = G().mach[k]; if (!st) return;
    NJ.econ.add(st.out, 1); NJ.fx(tx * T + 8, ty * T, D.IT[st.out].e);
    G().st[st.out] = (G().st[st.out] || 0) + 1;
    G().st.craft = (G().st.craft || 0) + 1;
    NJ.audio.chord([659, 880]); NJ.ui.toast('Coletou ' + D.IT[st.out].e + ' ' + D.IT[st.out].n + '!');
    NJ.prog.check(); delete G().mach[k]; NJ.inter.close(); NJ.state.save();
  };

  // ========== RECADOS DIÁRIOS (quadro na praça) ==========
  EX.dailyGen = function () {
    const s = G(), pool = D.DAILY.slice(), out = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const d = pool.splice((Math.random() * pool.length) | 0, 1)[0];
      const n = d.min + ((Math.random() * (d.max - d.min + 1)) | 0);
      out.push({ k: d.k, t: d.t.replace('%n', n), e: d.e, n, r: d.r, b: (s.st[d.k] || 0), done: 0 });
    }
    s.dq = out; s.dqD = s.day;
  };
  EX.dailyProg = (q) => Math.max(0, (G().st[q.k] || 0) - q.b);
  EX.ensure = function () { const s = G(); if (!s.dq || !s.dq.length || s.dqD !== s.day) EX.dailyGen(); };
  EX.onNewDay = function () { EX.dailyGen(); };
  EX.dailyPanel = function () {
    const s = G();
    EX.ensure();
    let h = '<h3>📋 Recados do dia ' + s.day + '</h3><p><small>Três tarefas para hoje. Complete e recolha a recompensa 💰</small></p>';
    s.dq.forEach((q, i) => {
      const pr = EX.dailyProg(q), ok = pr >= q.n;
      h += '<div class="r"><span>' + q.e + ' <b>' + q.t + '</b><br><small>' + Math.min(pr, q.n) + '/' + q.n + ' · ' + q.r + ' 💰' + (q.done ? ' · ✅ feito' : '') + '</small></span>' +
        (q.done ? '<small>✅</small>' : '<button data-a="dclaim" data-k="' + i + '"' + (ok ? '' : ' disabled') + '>Recolher</button>') + '</div>';
    });
    NJ.ui.panel(h, 'daily');
  };
  EX.dailyClaim = function (i) {
    const s = G(), q = s.dq[+i];
    if (!q || q.done || EX.dailyProg(q) < q.n) return;
    q.done = 1; s.coins += q.r;
    const bonus = U.pick(['f', 'c', 'S_str', 'wd']); NJ.econ.add(bonus, 1);
    NJ.audio.chord([523, 659, 880]);
    NJ.ui.toast('📋 Recado completo! +' + q.r + ' 💰 e ' + D.IT[bonus].e + ' ' + D.IT[bonus].n);
    NJ.state.save(); EX.dailyPanel();
  };
  EX.boardTarget = function (tx, ty) {
    const ready = G().dq.filter((q) => !q.done && EX.dailyProg(q) >= q.n).length;
    return { x: W.boardPoint.x, y: W.boardPoint.y - 26, name: 'Quadro de recados' + (ready ? ' 🔔' : ''), acts: [
      { e: '📋', l: 'Ver recados', fn: () => EX.dailyPanel() }
    ] };
  };

  // ========== FESTIVAL DAS ESTAÇÕES (praça) ==========
  EX.festDay = () => G().day === D.FEST_DAY;
  EX.festTarget = function () {
    const acts = [];
    if (EX.festDay()) {
      acts.push({ e: '🎣', l: 'Concurso de pesca', fn: EX.festFish });
      acts.push({ e: '🛍️', l: 'Mercado raro', fn: EX.festShop });
    } else {
      acts.push({ e: '📅', l: 'Quando?', fn: () => NJ.ui.say('Festival das estações 🎪', ['A grande festa acontece no <b>dia ' + D.FEST_DAY + '</b> de cada estação. Hoje é dia ' + G().day + '. Volte lá! 🎉']) });
      acts.push({ e: '🎪', l: 'Barraquinhas', fn: () => NJ.ui.say('Praça do vale', ['As barraquinhas esperam a festa… mas a praça é ótima para um passeio! 🌳']) });
    }
    return { x: W.festPoint.x, y: W.festPoint.y - 24, name: EX.festDay() ? 'Festival das estações 🎉' : 'Praça do vale', acts };
  };
  EX.festShop = function () {
    const s = G();
    let h = '<h3>🎪 Mercado do festival</h3><p>💰 ' + s.coins + ' · itens raros só hoje</p>';
    D.FEST_STOCK.forEach((k) => {
      const it = D.IT[k]; if (!it) return;
      const p = Math.ceil((it.s || it.b || 10) * 0.9);
      h += '<div class="r"><span>' + it.e + ' ' + it.n + '</span><button data-a="fbuy" data-k="' + k + '">' + p + ' 💰</button></div>';
    });
    NJ.ui.panel(h, 'fest');
  };
  EX.festPrice = (k) => { const it = D.IT[k]; return Math.ceil((it.s || it.b || 10) * 0.9); };
  EX.festFish = function () {
    const s = G();
    let cnt = ['p1', 'p2', 'p3', 'p4'].reduce((a, k) => a + (s.inv[k] || 0), 0);
    if (cnt < 3) { NJ.ui.say('Concurso de pesca 🎣', ['Traga <b>3 peixes</b> quaisquer e eu troco por um prêmio! Você tem ' + cnt + '.']); return; }
    let need = 3;
    ['p1', 'p2', 'p3', 'p4'].forEach((k) => { while (need > 0 && (s.inv[k] || 0) > 0) { NJ.econ.take(k, 1); need--; } });
    const prize = 150 + U.I(0, 100), rare = U.pick(['gem', 'wine', 'cake', 'cheese']);
    s.coins += prize; NJ.econ.add(rare, 1);
    NJ.audio.chord([659, 880, 1046]); NJ.fx(s.px, s.py - 20, '🏆');
    NJ.ui.say('Concurso de pesca 🏆', ['Que pescaria! Prêmio: <b>' + prize + ' 💰</b> e ' + D.IT[rare].e + ' <b>' + D.IT[rare].n + '</b>!']);
    NJ.state.save();
  };

  // ========== POR DIA / POR QUADRO ==========
  EX.tick = function (dt) {
    const s = G();
    const b = s.buff;
    if (b) { b.left -= dt; if (b.left <= 0) { s.buff = null; NJ.ui.toast('O efeito de ' + D.BUFFS[b.k].n + ' acabou 💫'); } }
    const m = s.mach;
    for (const k in m) if (m[k].t > 0) m[k].t -= dt;
    if (s.dq) s.dq.forEach((q) => { if (!q.done && !q.warn && EX.dailyProg(q) >= q.n) { q.warn = 1; NJ.ui.toast('📋 Recado pronto: ' + q.t); } });
  };

  NJ.actions = Object.assign(NJ.actions || {}, {
    cook: (b, k) => {
      const f = D.FOOD.find((x) => x.id === k); if (!f) return;
      if (!Object.keys(f.need).every((x) => NJ.econ.have(x, f.need[x]))) { NJ.ui.toast('Faltam ingredientes 😕'); return; }
      Object.keys(f.need).forEach((x) => NJ.econ.take(x, f.need[x]));
      NJ.econ.add(f.id, 1);
      const s = G(); s.st.craft = (s.st.craft || 0) + 1;
      NJ.audio.chord([523, 659]); NJ.ui.toast('🍳 Fez ' + D.IT[f.id].e + ' ' + D.IT[f.id].n + '!');
      NJ.state.save(); EX.cook();
    },
    eat: (b, k) => EX.eat(k),
    dclaim: (b, k) => EX.dailyClaim(k),
    daily: () => EX.dailyPanel(),
    wx: () => EX.wxPanel(),
    fbuy: (b, k) => {
      const p = EX.festPrice(k), s = G();
      if (s.coins < p) { NJ.ui.toast('Faltam moedas 💰'); NJ.audio.beep(200); return; }
      s.coins -= p; NJ.econ.add(k, 1); NJ.audio.beep(700); NJ.state.save(); EX.festShop();
    }
  });
})();
