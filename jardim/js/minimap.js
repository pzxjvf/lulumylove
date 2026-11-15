/* Nosso Jardim v2 — minimapa, mapa do vale, descoberta de locais e viagem rápida */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const D = NJ.data, U = NJ.util, W = NJ.world;
  const M = (NJ.minimap = {});
  const $ = (s) => document.querySelector(s);
  const S = () => NJ.S;
  const T = D.T;
  const CELL = 2;          // pixels do minimapa por tile

  let list = [], base = null, baseKey = '', discT = 0;
  M.on = true;             // mostrar/esconder o minimapa

  // locais importantes do vale (o mapa é montado depois de W.gen())
  function buildList() {
    const l = [
      { id: 'home', n: 'Sua casinha', e: '🏡', x: 152, y: 182 },
      { id: 'shop', n: 'Loja da Lia', e: '🛍️', x: 592, y: 158 },
      { id: 'village', n: 'Vila e poço', e: '⛲', x: 26 * T + 8, y: 14 * T },
      { id: 'farm', n: 'Fazenda', e: '🌾', x: 22 * T, y: 25 * T },
      { id: 'orchard', n: 'Pomar', e: '🍎', x: 69 * T, y: 12 * T },
      { id: 'lake', n: 'Lago', e: '🎣', x: 58 * T, y: 42 * T },
      { id: 'board', n: 'Praça e quadro', e: '📋', x: 17 * T + 8, y: 13 * T + 16 }
    ];
    if (W.libPoint) l.push({ id: 'lib', n: 'Biblioteca', e: '📖', x: W.libPoint.x, y: W.libPoint.y });
    if (W.festPoint) l.push({ id: 'square', n: 'Praça do festival', e: '🎪', x: W.festPoint.x, y: W.festPoint.y });
    if (W.minePoint) l.push({ id: 'mine', n: 'Mina do norte', e: '⛏️', x: W.minePoint.x, y: W.minePoint.y });
    return l;
  }

  M.init = function () {
    list = buildList();
    const s = S();
    if (s && !s.found) s.found = {};
    baseKey = '';
  };
  M.siteCount = () => list.length;

  // ---------- terreno simplificado (cacheado por estação) ----------
  function baseTerrain() {
    const s = S(), season = s.season;
    if (base && baseKey === season) return base;
    const w = D.MW * CELL, h = D.MH * CELL;
    base = base || document.createElement('canvas');
    base.width = w; base.height = h;
    const c = base.getContext('2d');
    const P = D.PAL[season] || D.PAL.spring;
    const grass = P.g[0];
    const col = (v) => v === 1 ? '#8c8a7a' : v === 2 ? '#2f78b8' : v === 3 ? '#e2cf98' : v === 4 ? '#a0693a' : grass;
    c.fillStyle = grass; c.fillRect(0, 0, w, h);
    for (let y = 0; y < D.MH; y++) for (let x = 0; x < D.MW; x++) {
      const v = W.gr[W.ix(x, y)];
      if (!v) continue;
      c.fillStyle = col(v);
      c.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
    baseKey = season;
    return base;
  }

  // ---------- descoberta de locais ----------
  function discover(dt) {
    discT -= dt;
    if (discT > 0) return;
    discT = 0.35;
    const s = S();
    if (!s.found) s.found = {};
    for (const it of list) {
      if (s.found[it.id]) continue;
      if (U.dist(s.px, s.py, it.x, it.y) < 96) {
        s.found[it.id] = 1;
        NJ.audio.chord([659, 880]);
        NJ.ui.toast('📍 Local descoberto: ' + it.e + ' ' + it.n + '!');
        NJ.prog && NJ.prog.check();
        NJ.state.save();
      }
    }
  }

  // ---------- desenho ----------
  function render() {
    const el = $('#mm'), cv = $('#mmc');
    if (!el || !cv) return;
    const s = S();
    const show = M.on && NJ.loc !== 'cave' && !NJ.ui.creating;
    el.style.display = show ? 'block' : 'none';
    if (!show) return;
    const b = baseTerrain();
    const x = cv.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, cv.width, cv.height);
    x.drawImage(b, 0, 0);
    // posições em pixels do minimapa
    const mx = (v) => v / T * CELL, my = (v) => v / T * CELL;
    if (!s.found) s.found = {};
    // locais (brilhantes quando descobertos)
    x.globalAlpha = 1;
    for (const it of list) {
      const fx = mx(it.x), fy = my(it.y);
      if (s.found[it.id]) { x.fillStyle = '#ffd23f'; x.fillRect(fx - 3, fy - 3, 6, 6); x.fillStyle = '#7a3f00'; x.fillRect(fx - 1, fy - 1, 2, 2); }
      else { x.globalAlpha = 0.4; x.fillStyle = '#ffffff'; x.fillRect(fx - 2, fy - 2, 4, 4); x.globalAlpha = 1; }
    }
    // construções do jogador
    x.fillStyle = 'rgba(196,120,60,.95)';
    for (const k in s.built) { const p = k.split(','); x.fillRect(mx(+p[0] * T), my(+p[1] * T), CELL, CELL); }
    // moradores e pet
    x.fillStyle = '#7ad0ff';
    D.NPCS.forEach((n) => { const r = NJ.npc.pos(n.n); x.fillRect(mx(r.x) - 1, my(r.y) - 1, 2, 2); });
    x.fillStyle = '#ff9ec8';
    x.fillRect(mx(s.pet.x) - 1, my(s.pet.y) - 1, 2, 2);
    // jogadora
    const px = mx(s.px), py = my(s.py);
    x.fillStyle = '#ffffff'; x.fillRect(Math.round(px) - 3, Math.round(py) - 3, 5, 5);
    x.fillStyle = '#8a4fd6'; x.fillRect(Math.round(px) - 2, Math.round(py) - 2, 3, 3);
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (NJ.S && NJ.S.ch && list.length) { discover(dt); render(); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------- mapa do vale + viagem rápida ----------
  M.panel = function () {
    const s = S();
    if (!s.found) s.found = {};
    let h = '<h3>🗺️ Mapa do vale</h3><p><small>Toque num lugar descoberto para <b>viajar</b> até lá na hora. Lugares novos aparecem quando você chega perto deles.</small></p><div class="grid">';
    list.forEach((it) => {
      const found = s.found[it.id];
      h += '<button class="mb" data-a="travel" data-k="' + it.id + '"' + (found ? '' : ' disabled') + '>' + (found ? it.e + ' ' + it.n : '❔ ???') + '</button>';
    });
    h += '</div>';
    h += '<p><small>Descobertos: ' + Object.keys(s.found).length + ' de ' + list.length + ' lugares.</small></p>';
    h += '<div class="r"><span></span><button data-a="mmtoggle">' + (M.on ? '🧭 Esconder minimapa' : '🧭 Mostrar minimapa') + '</button></div>';
    NJ.ui.panel(h, 'map');
  };

  M.travel = function (id) {
    const it = list.find((x) => x.id === id); if (!it) return;
    const s = S();
    if (!s.found || !s.found[id]) { NJ.ui.toast('Você ainda não conhece esse lugar 🙈'); return; }
    if (NJ.loc === 'cave') NJ.mine.exit();
    // procura um ponto livre perto do destino
    let x = it.x, y = it.y;
    if (W.blk(x, y)) {
      outer: for (let r = 1; r <= 6; r++) for (let a = 0; a < 8; a++) {
        const ang = a * Math.PI / 4, nx = it.x + Math.cos(ang) * r * T, ny = it.y + Math.sin(ang) * r * T;
        if (nx > 0 && ny > 0 && nx < D.MW * T && ny < D.MH * T && !W.blk(nx, ny)) { x = nx; y = ny; break outer; }
      }
    }
    s.px = x; s.py = y;
    NJ.clearDest && NJ.clearDest();
    NJ.inter.close(); NJ.ui.closeP();
    NJ.audio.chord([523, 659]); NJ.fx(x, y - 12, '✨');
    NJ.ui.toast('🗺️ Viajando para ' + it.n + '…');
    NJ.prog && NJ.prog.check(); NJ.state.save();
  };
})();
