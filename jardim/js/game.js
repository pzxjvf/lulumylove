/* Nosso Jardim v2 — núcleo: loop, render, câmera, entrada e ações globais */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const U = NJ.util, D = NJ.data, W = NJ.world, SP = NJ.sprites, ST = NJ.state, UI = NJ.ui, Farm = NJ.farm, SPR = SP.SPR;
  const T = D.T, MW = D.MW, MH = D.MH;
  const $ = (s) => document.querySelector(s);
  const cv = $('#c'), g = cv.getContext('2d');
  const DX = [0, 0, -1, 1], DY = [1, -1, 0, 0];

  NJ.loc = 'world';
  NJ.buildMode = false; NJ.bsel = 0; NJ.vw = 0; NJ.vh = 0;
  NJ.actions = NJ.actions || {};

  let SC, VW, VH, DK, dk, zoom = 1;
  const cam = { x: 0, y: 0 };
  let K = {}, jx = 0, jy = 0, wt = 0, destination = null, abDown = false, paint = 0, lastPaint = [-1, -1], fishHold = false;
  let swingT = 0, swingTool = null, SWING = 0.34;   // animação do golpe da ferramenta
  let FX = [], undoStack = [];
  let ints = [];

  const rr = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(a, b, w, h); };
  SP.ctx = g; SP.rr = rr;
  NJ.fx = (x, y, e) => FX.push({ x, y, t: 0, e });

  // ---------- partículas, bolhas de fala e clima ----------
  let PT = [], BUB = [], rainT = 0, stepT = 0, flash = 0, boltT = 9;
  NJ.float = (name, text) => { BUB.push({ name, text, t: 0 }); if (BUB.length > 6) BUB.shift(); };
  function puff(x, y, c) {
    PT.push({ x: x + U.R(-3, 3), y: y + U.R(-2, 0), vx: U.R(-7, 7), vy: U.R(-18, -9), t: 0, life: U.R(0.32, 0.58), c: c || 'rgba(226,216,190,.8)', r: U.R(1, 2) });
    if (PT.length > 170) PT.shift();
  }
  NJ.puff = puff;
  NJ.splash = (x, y) => { PT.push({ x, y, t: 0, life: U.R(0.4, 0.6), ring: 1, c: 'rgba(198,230,255,.85)' }); if (PT.length > 170) PT.shift(); };

  // ---------- tempo ----------
  const hour = () => (NJ.S.min / 60) % 24;
  function dkv() { const h = hour(); return h >= 20 || h < 5 ? 1 : h >= 17 ? (h - 17) / 3 : h < 7 ? (7 - h) / 2 : 0; }
  NJ.time = { hour, dark: dkv, isNight: () => dkv() >= 0.5 };

  // ---------- escala / tela ----------
  function rs() {
    SC = Math.max(2, Math.round((innerHeight / 190) * zoom));
    VW = Math.ceil(innerWidth / SC); VH = Math.ceil(innerHeight / SC);
    cv.width = VW; cv.height = VH; NJ.vw = VW; NJ.vh = VH;
    DK = DK || document.createElement('canvas');
    DK.width = VW; DK.height = VH; dk = DK.getContext('2d');
  }
  addEventListener('resize', rs);

  // ---------- pontos de interação ----------
  function well() {
    const S = NJ.S;
    if (S.wish) { UI.say('Poço mágico', ['A chama azul dança, mas você já fez seu desejo hoje. 💙']); return; }
    S.wish = 1; NJ.audio.beep(900);
    if (Math.random() < 0.5) { const c = U.I(10, 35); S.coins += c; UI.say('Poço mágico', ['A chama azul brilha… e cospe ' + c + ' moedas! 💙']); }
    else { const c = U.pick(D.seedsFor(S.season)); NJ.econ.add('S_' + c.id, 2); UI.say('Poço mágico', ['A chama azul brilha… e surgem 2× ' + c.e + ' sementes de ' + c.n.toLowerCase() + '!']); }
    NJ.state.save();
  }
  function houseMenu() {
    UI.say('Sua casinha', ['Dormir até amanhã ou preparar algo? 🌙🍳'], null, [
      ['Dormir 💤', () => NJ.state.newDay(false)],
      ['Cozinhar 🍳', () => NJ.econ.craft()],
      ['Ainda não', () => 0]
    ]);
  }
  function buildInts() {
    ints = [
      { x: 152, y: 168, r: 22, e: '🌙', fn: houseMenu },
      { x: 590, y: 152, r: 20, e: '🛍️', fn: () => NJ.econ.shop() },
      { x: 26 * T + 8, y: 14 * T - 6, r: 20, e: '💧', fn: well },
      { x: W.minePoint.x, y: W.minePoint.y + 10, r: 28, e: '⛏️', fn: () => NJ.mine.enter() }
    ];
    // moradores são procurados na posição atual (eles passeiam) — ver findTarget()
  }

  // ---------- ações ----------
  function selTool(i) {
    const S = NJ.S;
    if (NJ.buildMode) { NJ.buildMode = 0; const e = $('#bbtn'); if (e) e.classList.remove('on'); }
    if (i === 2 && S.tool === 2) { UI.seedPicker(); return; }
    S.tool = i;
    NJ.audio.beep(520);
    UI.toast(D.TOOLS[i].e + ' ' + D.TOOLS[i].n);
    UI.hb();
  }
  function pushUndo(u) { undoStack.push(u); if (undoStack.length > 30) undoStack.shift(); }
  function doUndo() {
    const S = NJ.S, u = undoStack.pop();
    if (!u) { UI.toast('Nada para desfazer'); return; }
    u.cells.forEach(([x, y]) => { delete S.built[x + ',' + y]; });
    S.inv.wd = (S.inv.wd || 0) + (u.wd || 0);
    S.coins += u.coins || 0;
    S.st.build = Math.max(0, (S.st.build || 0) - 1);
    if (u.house) {
      const i = S.houses.findIndex((h) => h.type === u.house && h.x === u.tx && h.y === u.ty);
      if (i >= 0) { S.houses.splice(i, 1); S.animals = S.animals.filter((a) => a.h !== i).map((a) => (a.h > i ? Object.assign(a, { h: a.h - 1 }) : a)); }
    }
    UI.toast('Desfeito ↩️'); NJ.audio.beep(300); UI.hb(); NJ.state.save();
  }
  function placeOK(tx, ty) {
    const S = NJ.S;
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return 0;
    const k = tx + ',' + ty;
    if (S.built[k]) return 2;                    // já construído -> clique remove
    if (W.gr[W.ix(tx, ty)] == 2) return 0;       // água
    if (W.sol[W.ix(tx, ty)]) return 0;           // árvore, pedra, cerca do mapa…
    if (tx === Math.floor(S.px / T) && ty === Math.floor(S.py / T)) return 0;
    const b = D.BL[NJ.bsel];
    return ((S.inv.wd || 0) >= b.w && S.coins >= b.c) ? 1 : 3;
  }
  function dropHouseAt(tx, ty) {
    const S = NJ.S;
    const i = S.houses.findIndex((h) => tx >= h.x && tx < h.x + h.w && ty >= h.y && ty < h.y + h.h);
    if (i < 0) return;
    S.houses.splice(i, 1);
    S.animals = S.animals.filter((a) => a.h !== i).map((a) => (a.h > i ? Object.assign(a, { h: a.h - 1 }) : a));
  }
  function doBuild(tx, ty) {
    const S = NJ.S, b = D.BL[NJ.bsel];
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) { UI.toast('Fora do mapa'); return; }
    const k = tx + ',' + ty;
    if (S.built[k]) {
      const cb = D.BLM[S.built[k]];
      dropHouseAt(tx, ty);
      delete S.built[k];
      S.inv.wd = (S.inv.wd || 0) + Math.ceil((cb.w || 0) / 2);
      if (cb.c) S.coins += Math.ceil(cb.c / 2);
      NJ.fx(tx * T + 8, ty * T + 8, '🧹'); UI.toast('Removido (metade devolvida)'); NJ.audio.beep(300); UI.hb(); NJ.state.save(); return;
    }
    if (W.gr[W.ix(tx, ty)] == 2) { UI.toast('Não dá para construir na água 💧'); return; }
    if (b.bp) {
      const cells = b.bp.map(([dx, dy, id]) => [tx + dx, ty + dy, id]);
      for (const [x, y] of cells) {
        if (x < 0 || y < 0 || x >= MW || y >= MH || W.gr[W.ix(x, y)] == 2 || W.sol[W.ix(x, y)] || S.built[x + ',' + y]) { UI.toast('Espaço insuficiente para a casa 😅'); NJ.audio.beep(200); return; }
        if (x === Math.floor(S.px / T) && y === Math.floor(S.py / T)) { UI.toast('Você está no meio 😅'); NJ.audio.beep(200); return; }
      }
      if ((S.inv.wd || 0) < b.w) { UI.toast('Falta madeira 🪵 (' + b.w + ')'); NJ.audio.beep(200); return; }
      if (S.coins < b.c) { UI.toast('Faltam moedas 💰 (' + b.c + ')'); NJ.audio.beep(200); return; }
      S.inv.wd -= b.w; S.coins -= b.c;
      cells.forEach(([x, y, id]) => (S.built[x + ',' + y] = id));
      S.st.build = (S.st.build || 0) + 1;
      pushUndo({ cells: cells.map((c) => [c[0], c[1]]), wd: b.w, coins: b.c, house: b.house || null, tx, ty });
      if (b.house) S.houses.push({ type: b.house, x: tx, y: ty, w: b.bw, h: b.bh });
      NJ.fx(tx * T + 8, ty * T + 8, b.e); UI.toast(b.n + ' pronta! 🏡'); NJ.audio.chord([523, 659]);
      UI.hb(); NJ.state.save(); return;
    }
    if (W.sol[W.ix(tx, ty)]) { UI.toast('Já tem algo aqui (árvore, pedra, cerca…) 🌳'); NJ.audio.beep(200); return; }
    if (tx === Math.floor(S.px / T) && ty === Math.floor(S.py / T)) { UI.toast('Não aqui em cima 😅'); return; }
    if ((S.inv.wd || 0) < b.w) { UI.toast('Falta madeira 🪵 — corte árvores com o machado 🪓'); NJ.audio.beep(200); return; }
    if (S.coins < b.c) { UI.toast('Faltam moedas 💰'); NJ.audio.beep(200); return; }
    S.inv.wd -= b.w; S.coins -= b.c;
    S.built[k] = b.id; S.st.build = (S.st.build || 0) + 1;
    pushUndo({ cells: [[tx, ty]], wd: b.w, coins: b.c });
    NJ.fx(tx * T + 8, ty * T + 8, b.e); NJ.audio.beep(620); UI.hb(); NJ.state.save();
  }
  function petPet() {
    const S = NJ.S;
    S.pet.h = Math.min(100, S.pet.h + 10);
    NJ.audio.beep(760);
    NJ.fx(S.pet.x, S.pet.y - 14, '💗');
    if (Math.random() < 0.45) UI.toast(U.pick(['Seu pet abana o rabo de alegria! 🐾', 'Ele se aconchega na sua mão. 💜', 'Adora carinho! 🥰', 'Faz um som fofo de felicidade. 💗']));
    if (S.pet.h >= 100) {
      S.pet.h = 0;
      if (Math.random() < 0.6) {
        const r = Math.random();
        if (r < 0.45) { const c = U.I(5, 18); S.coins += c; UI.say('Seu pet', [U.esc(S.pet.name || 'Seu pet') + ' achou algo enterrado: ' + c + ' moedas! 🐾']); }
        else { const s = U.pick(['S_str', 'S_pot', 'wd']); NJ.econ.add(s, 1); UI.say('Seu pet', [U.esc(S.pet.name || 'Seu pet') + ' trouxe um presentinho: ' + D.IT[s].e + ' ' + D.IT[s].n + '! 🐾']); }
      }
    }
    NJ.state.save();
  }

  // ---------- interações do mundo ----------
  function pickForage(fi) {
    const S = NJ.S, a = S.fg.splice(fi, 1)[0];
    NJ.econ.add(a.k, 1); S.st[a.k] = (S.st[a.k] || 0) + 1; S.st.forage = (S.st.forage || 0) + 1;
    NJ.fx(a.x * T + 8, a.y * T, D.IT[a.k].e); NJ.audio.beep(700); NJ.prog.xp('foraging', 4); NJ.prog.check(); NJ.state.save();
  }
  function harvestCrop(tx, ty) {
    const S = NJ.S, k = tx + ',' + ty, c = S.crops[k], cr = D.CROPMAP[c.t];
    NJ.econ.add(cr.id, 1); delete S.crops[k];
    S.st.harv = (S.st.harv || 0) + 1; S.st['h_' + cr.id] = (S.st['h_' + cr.id] || 0) + 1;
    NJ.fx(tx * T + 8, ty * T, cr.e); NJ.audio.beep(800); NJ.prog.xp('farming', 8); NJ.prog.check(); NJ.state.save();
  }
  const BACT = { bench: '🪑', fountain: '⛲', pot: '🪴' };
  function builtAct(id, tx, ty) {
    const S = NJ.S;
    if (id === 'bench') { S.min += 60; NJ.audio.beep(420); UI.toast('Você descansa um pouco à sombra ☕ (+1h)'); }
    else if (id === 'fountain') { S.water = S.rain ? 20 : 12; NJ.audio.beep(540); NJ.fx(tx * T + 8, ty * T, '💧'); UI.toast('Regador reabastecido na fontinha ⛲'); }
    else if (id === 'pot') {
      if (S.potD === S.day) { UI.toast('O vaso só floresce uma vez por dia 🪴'); return; }
      S.potD = S.day; NJ.econ.add('f', 1); NJ.audio.chord([659, 880]);
      NJ.fx(tx * T + 8, ty * T, '🌼'); UI.toast('Você colheu uma florzinha do vaso 🌼'); NJ.prog.xp('foraging', 2); NJ.prog.check();
    }
    NJ.state.save();
  }
  // descobre o alvo de interação mais próximo (usado pela ação e pela dica flutuante)
  function findTarget(f, tx, ty) {
    const S = NJ.S;
    if (Math.hypot(S.pet.x - f.x, S.pet.y - f.y) < 22) return { x: S.pet.x, y: S.pet.y - 18, e: '💗', run: petPet };
    const n = NJ.npc.nearest(f.x, f.y, 30);
    if (n) { const r = NJ.npc.pos(n.n); return { x: r.x, y: r.y - 28, e: '💬', run: () => NJ.npc.talk(n.n) }; }
    let best = null, bd = 24;
    ints.forEach((i) => { const d = Math.hypot(i.x - f.x, i.y - f.y); if (d < bd) { bd = d; best = i; } });
    if (best) return { x: best.x, y: best.y - 24, e: best.e || '❕', run: best.fn };
    const hIdx = S.houses.findIndex((h) => tx >= h.x && tx < h.x + h.w && ty >= h.y && ty < h.y + h.h);
    if (hIdx >= 0) {
      const h = S.houses[hIdx];
      return { x: (h.x + h.w / 2) * T, y: h.y * T - 4, e: h.type === 'silo' ? '🌾' : '🐔', run: () => (h.type === 'silo' ? UI.toast('🌾 O silo produz feno a cada manhã') : NJ.animals.panel(hIdx)) };
    }
    const fi = S.fg.findIndex((a) => a.x === tx && a.y === ty);
    if (fi > -1) return { x: tx * T + 8, y: ty * T, e: '✋', run: () => pickForage(fi) };
    const c = S.crops[tx + ',' + ty];
    if (c && Farm.ready(c)) return { x: tx * T + 8, y: ty * T, e: '✋', run: () => harvestCrop(tx, ty) };
    const bId = S.built[tx + ',' + ty];
    if (BACT[bId]) return { x: tx * T + 8, y: ty * T, e: BACT[bId], run: () => builtAct(bId, tx, ty) };
    return null;
  }

  // inicia a animação do golpe com a ferramenta na mão
  function swingStart(id) {
    if (!id || id === 'hand' || id === 'seed') return;
    swingTool = id; swingT = SWING;
  }

  // tt = tile clicado (opcional): quando o jogador clica no chão, agimos no tile clicado
  function act(tt) {
    const S = NJ.S;
    if (UI.pOpen || UI.creating) return;
    if (UI.dlg) { UI.dnext(); return; }
    if (NJ.fish.active) return;
    const f = { x: S.px + DX[S.d] * 10, y: S.py - 4 + DY[S.d] * 10 };
    let tx = Math.floor(f.x / T), ty = Math.floor(f.y / T);
    if (tt) { tx = tt[0]; ty = tt[1]; }

    if (NJ.loc === 'cave') {
      const tool = D.TOOLS[S.tool].id;
      if (!NJ.mine.rocks[tx + ',' + ty]) { UI.toast('Use a picareta ⚒️ nas pedras'); return; }
      if (tool !== 'pick') { S.tool = 6; UI.hb(); }
      swingStart('pick');
      NJ.mine.break(tx, ty);
      return;
    }
    if (NJ.buildMode) { doBuild(tx, ty); return; }

    const tgt = findTarget(f, tx, ty);
    if (tgt) { tgt.run(); return; }

    const tool = D.TOOLS[S.tool].id;
    if (tool === 'rod') {
      if (W.gr[W.ix(tx, ty)] == 2 || W.gr[W.ix(tx, ty)] == 3) NJ.fish.start(tx, ty);
      else UI.toast('Fique de frente para a água 🎣');
      return;
    }
    if (tool === 'hand') { UI.toast('Ande até a planta, forragem ou móvel para interagir ✋'); return; }
    swingStart(tool);
    Farm.use(tool, tx, ty);
    UI.hb();
  }

  // ---------- simulação ----------
  function upd(dt) {
    const S = NJ.S;
    if (NJ.loc === 'world') {
      const pdx = S.px - S.pet.x, pdy = S.py - S.pet.y, pdd = Math.hypot(pdx, pdy);
      if (pdd > 26) {
        const a = Math.atan2(pdy, pdx), sp = Math.min(78, pdd * 2.4);
        const nx = S.pet.x + Math.cos(a) * sp * dt, ny = S.pet.y + Math.sin(a) * sp * dt;
        if (!W.blk(nx, S.pet.y)) S.pet.x = nx;
        if (!W.blk(S.pet.x, ny)) S.pet.y = ny;
        S.pet.f += dt * 9;
        S.pet.d = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) < 0 ? 2 : 3) : (Math.sin(a) < 0 ? 1 : 0);
      } else S.pet.f = 0;
      NJ.animals.update(dt);
      NJ.npc.update(dt);
    }
    if (!UI.dlg && !UI.pOpen) {
      S.min += dt * 2.2;
      if (S.min >= 1560) NJ.state.newDay(true);
      let vx = (K.arrowright || K.d ? 1 : 0) - (K.arrowleft || K.a ? 1 : 0) + jx;
      let vy = (K.arrowdown || K.s ? 1 : 0) - (K.arrowup || K.w ? 1 : 0) + jy;
      if (destination) {
        const dx = destination.x - S.px, dy = destination.y - S.py, dist = Math.hypot(dx, dy);
        if (dist < 9) { const d = destination; destination = null; if (d.auto) act(d.tt); } else { vx = dx / dist; vy = dy / dist; }
      }
      const l = Math.hypot(vx, vy);
      if (l > 0.2) {
        if (l > 1) { vx /= l; vy /= l; }
        const spd = K.shift ? 92 : 58;
        const nx = S.px + vx * spd * dt, ny = S.py + vy * spd * dt;
        if (!W.blk(nx, S.py)) S.px = nx;
        if (!W.blk(S.px, ny)) S.py = ny;
        S.d = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 2 : 3) : (vy < 0 ? 1 : 0);
        wt += dt * (K.shift ? 14 : 9);
        stepT -= dt;
        if (stepT <= 0) { stepT = K.shift ? 0.2 : 0.3; NJ.audio.foot(0); if (S.rain) NJ.splash(S.px, S.py + 3); }
        if (NJ.fish.active) { NJ.fish.active = false; UI.toast('Você se afastou da água'); }
      } else wt = 0;
    }
    // clima: trovões, clarões e respingos de chuva
    if (NJ.loc === 'world' && S.rain) {
      boltT -= dt;
      if (boltT <= 0) { boltT = U.R(8, 20); flash = 0.55; NJ.audio.thunder(); }
      rainT -= dt;
      if (rainT <= 0) { rainT = U.R(0.03, 0.12); NJ.splash(S.px + U.R(-VW / 2, VW / 2), S.py + U.R(-VH / 2, VH / 2)); }
    }
    if (flash > 0) flash -= dt;
    if (NJ.loc === 'cave') NJ.mine.step(dt);
    NJ.fish.hold = !!(K[' '] || K.e || K.enter || abDown || fishHold);
    NJ.fish.update(dt);
    if (swingT > 0) swingT -= dt;
    FX.forEach((f) => (f.t += dt));
    if (FX.length) FX = FX.filter((f) => f.t < 1.1);
    PT.forEach((p) => { p.t += dt; if (!p.ring) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 70 * dt; } });
    if (PT.length) PT = PT.filter((p) => p.t < p.life);
  }

  // ---------- desenho ----------
  const FL = Array.from({ length: 60 }, () => ({ x: U.R(40, MW * T - 40), y: U.R(40, MH * T - 40), p: U.R(0, 6.3) }));
  const BF = Array.from({ length: 12 }, () => ({ x: U.R(40, MW * T - 40), y: U.R(40, MH * T - 40), p: U.R(0, 6.3) }));

  function buildPreview(cx, cy, t) {
    const S = NJ.S;
    const target = destination || { x: S.px + DX[S.d] * 10, y: S.py - 4 + DY[S.d] * 10 };
    const tx = Math.floor(target.x / T), ty = Math.floor(target.y / T);
    if (NJ.buildMode) {
      const ok = placeOK(tx, ty);
      g.globalAlpha = 0.55;
      if (ok === 1 || ok === 2) SP.drawB(D.BL[NJ.bsel].id, tx * T - cx, ty * T - cy, t);
      g.globalAlpha = 1;
      g.fillStyle = ok === 1 ? '#7ee08155' : ok === 2 ? '#7ad0ff55' : '#ff5d5d55';
      g.fillRect(tx * T - cx + 1, ty * T - cy + 1, T - 2, T - 2);
      g.strokeStyle = ok === 1 ? '#7ee081' : ok === 2 ? '#7ad0ff' : '#ff5d5d';
      g.lineWidth = 1; g.strokeRect(tx * T - cx + 0.5, ty * T - cy + 0.5, T - 1, T - 1);
    } else {
      g.strokeStyle = '#ffffff99'; g.lineWidth = 1;
      g.strokeRect(tx * T - cx + 0.5, ty * T - cy + 0.5, T - 1, T - 1);
      if (destination) { g.fillStyle = '#fff'; g.fillRect(target.x - cx - 1, target.y - cy - 1, 3, 3); }
    }
  }

  function draw() {
    const t = performance.now() / 1000, S = NJ.S;
    g.imageSmoothingEnabled = false;
    const cave = NJ.loc === 'cave';
    const WW = cave ? NJ.mine.CW * T : MW * T, WH = cave ? NJ.mine.CH * T : MH * T;
    cam.x = U.cl(S.px - VW / 2, 0, Math.max(0, WW - VW));
    cam.y = U.cl(S.py - 12 - VH / 2, 0, Math.max(0, WH - VH));
    const cx = Math.round(cam.x), cy = Math.round(cam.y);
    rr(0, 0, VW, VH, '#10142a');

    const vis = [];
    const inV = (x, y, m) => x > cx - m && x < cx + VW + m && y > cy - m && y < cy + VH + m;

    if (cave) {
      NJ.mine.draw(g, cx, cy, t);
    } else {
      const GW = Math.min(VW, MW * T), GH = Math.min(VH, MH * T);
      g.drawImage(W.GR, cx, cy, GW, GH, 0, 0, GW, GH);
      // água animada
      for (let y = Math.floor(cy / T); y <= (cy + VH) / T; y++) for (let x = Math.floor(cx / T); x <= (cx + VW) / T; x++) {
        if (x < 0 || y < 0 || x >= MW || y >= MH || W.gr[W.ix(x, y)] != 2) continue;
        const px = x * T - cx, py = y * T - cy, o = (Math.sin(t * 1.8 + x * 1.1 + y * 1.4) * 3 + 3) | 0;
        rr(px + 2, py + 2 + (o % 7), T - 4, 1, '#5aa6de'); rr(px + 3, py + 8 + ((o + 3) % 6), T - 6, 1, '#5aa6de');
        if (Math.sin(t * 1.5 + x * 7.3 + y * 3.1) > 0.82) rr(px + ((x * 5) % 12) + 2, py + ((y * 7) % 12) + 2, 3, 1, '#bfe6ff');
      }
      // terra arada
      for (const k in S.till) {
        const [x, y] = k.split(',').map(Number), px = x * T - cx, py = y * T - cy;
        if (px < -T || py < -T || px > VW || py > VH) continue;
        const w = S.till[k] == 1;
        rr(px, py, T, T, w ? '#5a3a20' : '#8a5a34'); rr(px + 1, py + 4, T - 2, 1, w ? '#432a16' : '#6e4426'); rr(px + 1, py + 10, T - 2, 1, w ? '#432a16' : '#6e4426');
      }
      // blocos planos
      for (const k in S.built) {
        const b = D.BLM[S.built[k]]; if (!b || !b.flat) continue;
        const [x, y] = k.split(',').map(Number), px = x * T - cx, py = y * T - cy;
        if (px < -T || py < -T || px > VW || py > VH) continue;
        SP.drawB(b.id, px, py, t);
      }
      // entidades (árvores, casas, etc.)
      for (const e of W.ents) {
        if (!inV(e.x, e.y, 60)) continue;
        vis.push([e.y, () => {
          const img = e.tree ? SPR.t[e.ti || 0] : SPR[e.sn];
          if (!img) return;
          const sway = e.tree ? Math.sin(t * 1.3 + e.x * 0.07) * 1.3 : 0;
          const ex = Math.round(e.x + e.ox + sway) - cx, ey = Math.round(e.y + e.oy) - cy;
          // sombra de contato suave
          const sw2 = img.width * 0.68, sh2 = Math.max(6, img.height * 0.15);
          g.globalAlpha = 0.42;
          g.drawImage(SP.shadow, Math.round(ex + img.width / 2 - sw2 / 2), Math.round(ey + img.height - sh2 * 0.6), Math.round(sw2), Math.round(sh2));
          g.globalAlpha = 1;
          g.drawImage(img, ex, ey);
          if (e.well) { const fl = Math.round(Math.sin(t * 9)), wx = e.x - cx, wy = e.y - cy - 25; rr(wx - 2, wy - 3 + fl, 4, 5, '#2a6fe0'); rr(wx - 1, wy - 6 + fl, 2, 4, '#7fd0ff'); rr(wx, wy - 3, 1, 2, '#fff'); }
        }]);
      }
      // plantações
      for (const k in S.crops) {
        const [x, y] = k.split(',').map(Number), c = S.crops[k], px = x * T - cx, py = y * T - cy;
        if (px < -T || py < -T || px > VW || py > VH) continue;
        const cr = D.CROPMAP[c.t];
        vis.push([y * T + T - 2, () => {
          const s = Farm.stage(c), col = cr.color;
          if (s == 0) rr(px + 6, py + 11, 4, 3, '#6b4226');
          else {
            rr(px + 7, py + (s == 1 ? 8 : 4), 2, s == 1 ? 6 : 10, '#4fb34f');
            rr(px + (s == 1 ? 5 : 3), py + (s == 1 ? 8 : 6), s == 1 ? 2 : 4, s == 1 ? 2 : 3, '#6fd05f');
            if (s > 1) rr(px + 9, py + 5, 4, 3, '#6fd05f');
            if (Farm.ready(c)) { rr(px + 4, py + 10, 3, 3, col); rr(px + 9, py + 8, 3, 3, col); rr(px + 6, py + 6, 3, 3, col); if (Math.sin(t * 4 + x) > 0.7) rr(px + 12, py + 2, 1, 1, '#fff'); }
          }
        }]);
      }
      // forragem
      g.textAlign = 'center'; g.font = '12px sans-serif';
      for (const f of S.fg) {
        const px = f.x * T - cx, py = f.y * T - cy;
        if (px < -T || py < -T || px > VW || py > VH) continue;
        const it = D.IT[f.k]; if (!it) continue;
        vis.push([f.y * T + T - 1, () => g.fillText(it.e, px + 8, py + 13)]);
      }
      // moradores (andam pelo vale — posição vem da rotina em npc.js)
      for (const n of D.NPCS) {
        const nr = NJ.npc.pos(n.n);
        if (!inV(nr.x, nr.y, 40)) continue;
        vis.push([nr.y, () => {
          const fr = nr.f > 0 ? [0, 1, 0, 3][Math.floor(nr.f) & 3] : 0;
          NJ.char.draw(g, Math.round(nr.x) - cx, Math.round(nr.y) - cy, nr.d, fr, n.o);
          const qq = D.Q.find((q) => q.npc === n.n && (q.req == null || (S.q[q.req] || {}).s == 2) && !(S.q[q.id] && S.q[q.id].s == 2));
          if (qq) { g.font = 'bold 9px monospace'; g.textAlign = 'center'; g.fillStyle = S.q[qq.id] ? '#ffd23f' : '#fff'; g.fillText(S.q[qq.id] ? '?' : '!', nr.x - cx, nr.y - cy - 32 + Math.round(Math.sin(t * 4))); }
        }]);
      }
      // blocos altos (cercas, paredes, etc.)
      for (const k in S.built) {
        const b = D.BLM[S.built[k]]; if (!b || b.flat) continue;
        const [x, y] = k.split(',').map(Number);
        if (!inV(x * T, y * T, 40)) continue;
        vis.push([y * T + T, () => SP.drawB(b.id, x * T - cx, y * T - cy, t)]);
      }
      // pet e animais
      vis.push([S.pet.y, () => NJ.char.pet(g, Math.round(S.pet.x) - cx, Math.round(S.pet.y) - cy, S.pet.d, S.pet)]);
      for (const a of S.animals) vis.push([a.y, () => NJ.char.animal(g, Math.round(a.x) - cx, Math.round(a.y) - cy, a.id, a.col, a.d)]);
    }

    // jogador (com a ferramenta na mão: em repouso ou durante o golpe)
    const fr = wt > 0 ? [0, 1, 0, 3][Math.floor(wt) & 3] : 0;
    const curT = D.TOOLS[S.tool] ? D.TOOLS[S.tool].id : null;
    const heldT = NJ.fish.active ? null : (swingT > 0 ? swingTool : curT);
    const heldP = swingT > 0 ? 1 - swingT / SWING : 0;
    vis.push([S.py, () => {
      const px = Math.round(S.px) - cx, py = Math.round(S.py) - cy;
      if (heldT) NJ.char.tool(g, px, py, S.d, heldT, heldP);
      NJ.char.draw(g, px, py, S.d, fr, S.ch);
    }]);
    vis.sort((a, b) => a[0] - b[0]).forEach((v) => v[1]());

    // pré-visualização / alvo
    if (!cave && !UI.dlg && !UI.pOpen && !UI.creating && !NJ.fish.active) buildPreview(cx, cy, t);

    // pesca
    if (NJ.fish.active) NJ.fish.draw(g, cx, cy);

    // chuva
    if (!cave && S.rain) { g.fillStyle = '#bcd8ffaa'; for (let i = 0; i < 80; i++) g.fillRect(((i * 47 + t * 40) % VW) | 0, ((i * 31 + t * 220) % VH) | 0, 1, 4); }

    // dica de interação: ícone flutuante no que está logo à frente
    if (!cave && !UI.dlg && !UI.pOpen && !UI.creating && !NJ.buildMode && !NJ.fish.active) {
      const fx2 = S.px + DX[S.d] * 10, fy2 = S.py - 4 + DY[S.d] * 10;
      const tgt = findTarget({ x: fx2, y: fy2 }, Math.floor((S.px + DX[S.d] * 14) / T), Math.floor((S.py + DY[S.d] * 14) / T));
      if (tgt) {
        g.font = '13px sans-serif'; g.textAlign = 'center'; g.globalAlpha = 0.9;
        g.fillText(tgt.e, Math.round(tgt.x) - cx, Math.round(tgt.y) - cy - 6 + Math.sin(t * 3.4) * 2);
        g.globalAlpha = 1;
      }
    }

    // partículas (poeira, respingos de chuva, gotas)
    for (const p of PT) {
      const px = p.x - cx, py = p.y - cy;
      if (px < -12 || py < -12 || px > VW + 12 || py > VH + 12) continue;
      if (p.ring) {
        const k2 = p.t / p.life;
        g.strokeStyle = p.c; g.lineWidth = 1; g.globalAlpha = 1 - k2;
        g.beginPath(); g.arc(px, py, 2 + k2 * 6, 0, 6.283); g.stroke();
        g.globalAlpha = 1;
      } else {
        g.globalAlpha = Math.max(0, 1 - p.t / p.life); g.fillStyle = p.c;
        g.fillRect(px | 0, py | 0, p.r, p.r); g.globalAlpha = 1;
      }
    }

    // borboletas de dia
    if (!cave && dkv() < 0.35) for (const f of BF) {
      const bx = f.x + Math.sin(t * 0.5 + f.p) * 30 - cx, by = f.y + Math.cos(t * 0.4 + f.p * 1.3) * 22 - cy;
      if (bx < -6 || by < -6 || bx > VW + 6 || by > VH + 6) continue;
      const o = Math.abs(Math.sin(t * 10 + f.p)) < 0.5 ? 2 : -2;
      rr(bx, by, 2, 2, '#fff8e0'); rr(bx + o, by - 1, 2, 2, '#ffd98a');
    }

    // iluminação / noite
    const hh = hour();
    const k = cave ? 0.78 : Math.max(dkv(), S.rain ? 0.25 : 0);
    // crepúsculo (amanhecer / pôr do sol) aquece a cena
    const dusk = cave ? 0 : (hh >= 16 && hh < 20) ? 1 - Math.abs(hh - 18) / 2 : (hh >= 5 && hh < 8) ? 1 - Math.abs(hh - 6.5) / 1.5 : 0;
    if (k > 0.02) {
      dk.globalCompositeOperation = 'source-over';
      dk.clearRect(0, 0, VW, VH);
      const m = 1 - k;
      dk.fillStyle = 'rgba(' + ((8 + m * 40 + dusk * 70) | 0) + ',' + ((14 + m * 6 + dusk * 16) | 0) + ',' + ((56 + m * 14 + dusk * 4) | 0) + ',' + (0.74 * k) + ')';
      dk.fillRect(0, 0, VW, VH);
      dk.globalCompositeOperation = 'destination-out';
      const L = cave ? [] : W.LT.slice();
      if (!cave) for (const kk in S.built) { const b = D.BLM[S.built[kk]]; if (b && b.light) { const [x, y] = kk.split(',').map(Number); L.push([x * T + 8, y * T + 2, 46, '255,200,110']); } }
      L.push([S.px, S.py - 10, cave ? 56 : 34, '255,200,110']);
      for (const l of L) { const x = l[0] - cx, y = l[1] - cy; if (x < -90 || y < -90 || x > VW + 90 || y > VH + 90) continue; const s = l[2] * 2; dk.drawImage(SP.HOLE, x - l[2], y - l[2], s, s); }
      g.drawImage(DK, 0, 0);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = k;
      for (const l of L) { const x = l[0] - cx, y = l[1] - cy; if (x < -90 || y < -90 || x > VW + 90 || y > VH + 90) continue; const s = l[2] * 2; g.drawImage(String(l[3])[0] == '9' ? SP.GLB : SP.GLW, x - l[2], y - l[2], s, s); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      // vaga-lumes
      if (!cave && dkv() > 0.4 && !S.rain) for (const f of FL) {
        const x = f.x + Math.sin(t * 0.7 + f.p) * 8 - cx, y = f.y + Math.cos(t * 0.6 + f.p) * 6 - cy;
        if (x < 0 || y < 0 || x > VW || y > VH) continue;
        g.fillStyle = 'rgba(244,255,138,' + (0.4 + 0.6 * Math.max(0, Math.sin(t * 3 + f.p * 2))) + ')';
        g.fillRect(x | 0, y | 0, 2, 2);
      }
    }

    // brilho quente do horizonte no amanhecer / anoitecer
    if (dusk > 0.04) {
      const gd = g.createLinearGradient(0, 0, 0, VH * 0.95);
      gd.addColorStop(0, 'rgba(255,152,74,' + (0.24 * dusk) + ')');
      gd.addColorStop(0.45, 'rgba(255,110,96,' + (0.10 * dusk) + ')');
      gd.addColorStop(1, 'rgba(96,64,146,0)');
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = gd; g.fillRect(0, 0, VW, VH);
      g.globalCompositeOperation = 'source-over';
    }
    // vinheta suave (foca o olhar no centro)
    if (!cave) {
      const vg = g.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.34, VW / 2, VH / 2, Math.max(VW, VH) * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,' + (0.16 + k * 0.22) + ')');
      g.fillStyle = vg; g.fillRect(0, 0, VW, VH);
    }

    // efeitos flutuantes
    g.font = '11px sans-serif'; g.textAlign = 'center';
    FX.forEach((f) => { g.globalAlpha = 1 - f.t / 1.1; g.fillText(f.e, f.x - cx, f.y - cy - f.t * 22); });
    g.globalAlpha = 1;

    // clarão do trovão
    if (flash > 0 && !cave) { g.fillStyle = 'rgba(255,255,255,' + Math.min(0.55, flash * 0.9).toFixed(3) + ')'; g.fillRect(0, 0, VW, VH); }
  }

  // ---------- entrada ----------
  addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    const k = (e.key || '').toLowerCase();
    K[k] = 1;
    if (k === ' ' || k === 'e' || k === 'enter') { e.preventDefault(); act(); }
    else if (k >= '1' && k <= '7' && !UI.pOpen && !UI.creating) selTool(+k - 1);
    else if (k === 'b' && !UI.pOpen && !UI.creating) NJ.actions.bd();
    else if (k === 'z' && !UI.pOpen && !UI.creating) { e.preventDefault(); doUndo(); }
    else if (k === 'i' && !UI.creating) { UI.pOpen ? UI.closeP() : UI.inv(); }
    else if (k === 'q' && !UI.creating) { UI.pOpen ? UI.closeP() : UI.quests(); }
    else if (k === 'm' && !UI.creating) { UI.pOpen ? UI.closeP() : UI.menu(); }
    else if (k === 'escape') {
      if (UI.pOpen && !UI.creating) UI.closeP();
      else if (NJ.buildMode) NJ.actions.bd();
    }
  });
  addEventListener('keyup', (e) => { K[(e.key || '').toLowerCase()] = 0; });

  const js = $('#js');
  const jm = (e) => {
    const b = js.getBoundingClientRect(), dx = e.clientX - b.left - 55, dy = e.clientY - b.top - 55, l = Math.hypot(dx, dy) || 1, m = Math.min(l, 40) / 40;
    jx = dx / l * m; jy = dy / l * m;
    $('#kn').style.transform = 'translate(' + jx * 28 + 'px,' + jy * 28 + 'px)';
  };
  js.addEventListener('pointerdown', (e) => { js.setPointerCapture(e.pointerId); jm(e); });
  js.addEventListener('pointermove', (e) => { if (e.buttons) jm(e); });
  ['pointerup', 'pointercancel'].forEach((n) => js.addEventListener(n, () => { jx = jy = 0; $('#kn').style.transform = ''; }));

  const ab = $('#ab');
  ab.addEventListener('pointerdown', (e) => { e.preventDefault(); abDown = true; act(); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((n) => ab.addEventListener(n, () => (abDown = false)));

  const pointAt = (e) => {
    const r = cv.getBoundingClientRect();
    const sx = (e.clientX - r.left) / r.width * VW, sy = (e.clientY - r.top) / r.height * VH;
    return { x: cam.x + sx, y: cam.y + sy };
  };
  const hideHint = () => { const h = $('#movehint'); if (h) h.style.display = 'none'; };
  cv.addEventListener('pointerdown', (e) => {
    hideHint();
    if (NJ.fish.active) { e.preventDefault(); fishHold = true; return; }
    if (UI.pOpen || UI.dlg || UI.creating) return;
    e.preventDefault(); paint = 1;
    const p = pointAt(e);
    const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
    if (NJ.buildMode) { lastPaint = [tx, ty]; doBuild(tx, ty); return; }
    const dx = p.x - NJ.S.px, dy = p.y - NJ.S.py, dist = Math.hypot(dx, dy) || 1;
    NJ.S.d = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
    // toque/clique simples: caminha até lá e interage no tile clicado
    destination = { x: p.x - dx / dist * 18, y: p.y - dy / dist * 18, tt: [tx, ty], auto: true };
  });
  cv.addEventListener('pointermove', (e) => {
    if (UI.pOpen || UI.dlg || UI.creating || !paint) return;
    const p = pointAt(e);
    if (NJ.buildMode) { const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T); if (tx != lastPaint[0] || ty != lastPaint[1]) { lastPaint = [tx, ty]; doBuild(tx, ty); } return; }
    const dx = p.x - NJ.S.px, dy = p.y - NJ.S.py, dist = Math.hypot(dx, dy) || 1;
    NJ.S.d = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
    // arrastar = só andar (não dispara ação ao chegar)
    destination = { x: p.x, y: p.y, tt: [Math.floor(p.x / T), Math.floor(p.y / T)], auto: false };
  });
  ['pointerup', 'pointercancel'].forEach((n) => cv.addEventListener(n, () => { paint = 0; fishHold = false; }));
  $('#zin').addEventListener('click', () => { zoom = Math.min(1.8, zoom + 0.15); rs(); });
  $('#zout').addEventListener('click', () => { zoom = Math.max(0.65, zoom - 0.15); rs(); });

  // ---------- ações globais (delegação) ----------
  Object.assign(NJ.actions, {
    x: () => UI.closeP(),
    snd: (b) => { NJ.audio.muted = !NJ.audio.muted; if (b) b.textContent = NJ.audio.muted ? '🔇' : '🔊'; },
    music: () => { const on = NJ.audio.toggleMusic(); if (on) UI.toast('🎵 Música ligada'); },
    bd: () => {
      if (NJ.loc === 'cave') { UI.toast('Não dá para construir na mina ⛏️'); return; }
      if (UI.pOpen && !UI.creating) UI.closeP();
      NJ.buildMode = !NJ.buildMode; destination = null;
      const e = $('#bbtn'); if (e) e.classList.toggle('on', NJ.buildMode);
      UI.toast(NJ.buildMode ? '🔨 Toque no chão para posicionar · toque numa peça para remover · ESC sai' : '🌾 De volta ao modo fazenda');
      UI.hb(); NJ.audio.beep(NJ.buildMode ? 520 : 360);
    },
    bt: (b, k) => {
      NJ.bsel = +k; NJ.buildMode = true;
      const e = $('#bbtn'); if (e) e.classList.add('on');
      const p = D.BL[+k]; UI.toast(p.e + ' ' + p.n + ' · toque no chão para posicionar');
      UI.hb(); NJ.audio.beep(560);
    },
    undo: () => doUndo(),
    t: (b, k) => { selTool(+k); if (UI.pCur === 'inv') UI.inv(); },
    menu: () => UI.menu(),
    help: () => UI.help(),
    save: () => { NJ.state.save(); UI.toast('💾 Jogo salvo'); UI.closeP(); },
    reset: () => {
      UI.closeP();
      UI.say('Começar de novo', ['Quer apagar o progresso e começar um novo jogo? Isso não pode ser desfeito. 😦'], null, [
        ['Sim, reiniciar 🔄', () => { NJ.state.reset(); location.reload(); }],
        ['Não, continuar', () => 0]
      ]);
    },
    zin: () => { zoom = Math.min(1.8, zoom + 0.15); rs(); },
    zout: () => { zoom = Math.max(0.65, zoom - 0.15); rs(); },
    mineExit: () => NJ.mine.exit(),
    pickSeed: (b, k) => { NJ.S.seedSel = 'S_' + k; UI.closeP(); UI.hb(); UI.toast('🌱 ' + D.CROPMAP[k].n + ' selecionada'); },
    inv: () => UI.inv(),
    qs: () => UI.quests(),
    cl: () => UI.creator(false),
    pet: () => UI.creator(false),
    o: (b) => {
      const S = NJ.S, nm = $('#nm'), pnm = $('#pnm');
      S.name = nm ? nm.value : S.name;
      S.pet.name = pnm ? pnm.value : S.pet.name;
      const f = b.dataset.f, v = +b.dataset.v;
      if (f === 'pk') S.pet.k = v; else if (f === 'pc') S.pet.c = v; else S.ch[f] = v;
      UI.creator(UI.creating);
    },
    done: () => {
      const S = NJ.S, nm = $('#nm'), pnm = $('#pnm');
      S.name = ((nm && nm.value) || '').trim() || 'Aventureira';
      S.pet.name = ((pnm && pnm.value) || '').trim() || 'Fofinho';
      const first = UI.creating;
      UI.closeP();
      NJ.audio.chord([523, 659, 880]);
      if (first) UI.say('Narrador', ['Bem-vinda ao vale, ' + U.esc(S.name) + '! Seu pet ' + U.esc(S.pet.name) + ' vai te acompanhar por aí. 🐾', 'Are a terra na fazenda ao sul, plante e regue. Fale com os moradores e toque 🔨 para construir casinhas! 💜']);
    }
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (b && NJ.actions[b.dataset.a]) { e.preventDefault(); NJ.actions[b.dataset.a](b, b.dataset.k); }
  });

  // ---------- inicialização ----------
  function boot() {
    const loaded = ST.load();
    let first = false;
    if (!loaded) { NJ.S = ST.fresh(); first = true; } else NJ.S = loaded;
    W.gen();
    W.buildGround(NJ.S.season);
    if (!NJ.S.fg || !NJ.S.fg.length) W.spawnFG();
    buildInts();
    rs();
    UI.hb(); UI.hud();
    if (first) UI.creator(true);
    else ST.save();
    setInterval(() => { UI.hud(); UI.hb(); }, 400);
    setInterval(() => ST.save(), 8000);
    addEventListener('beforeunload', () => ST.save());
    const resume = () => { try { NJ.audio.ctx && NJ.audio.ctx.resume(); } catch (e) {} };
    addEventListener('pointerdown', resume, { once: true });
    addEventListener('keydown', resume, { once: true });

    let last = performance.now();
    (function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!UI.creating) upd(dt);
      draw();
      requestAnimationFrame(loop);
    })(last);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
