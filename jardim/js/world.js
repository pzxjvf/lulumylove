/* Nosso Jardim v2 — geração do mundo, terreno sazonal, colisão e entidades */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const U = NJ.util, D = NJ.data, SP = NJ.sprites;
  const W = (NJ.world = {});
  const T = D.T, MW = D.MW, MH = D.MH;
  Object.assign(W, { T, MW, MH });

  W.gr = new Uint8Array(MW * MH);   // 0 grama, 1 caminho, 2 água, 3 areia, 4 terra
  W.sol = new Uint8Array(MW * MH);  // sólido
  W.ents = []; W.LT = [];
  W.ix = (x, y) => y * MW + x;
  const ix = W.ix;
  W.addE = (sn, x, y, ox, oy, ex) => { const e = { sn, x, y, ox, oy, ...ex }; W.ents.push(e); return e; };

  const rect = (a, b, w, h, v) => { for (let y = b; y < b + h; y++) for (let x = a; x < a + w; x++) W.gr[ix(x, y)] = v; };
  W.rect = rect;

  W.mine = [88, 12];
  W.inFarm = (x, y) => x >= 13 && x < 32 && y >= 18 && y < 33;
  const Z = [
    [5, 5, 10, 8], [29, 3, 16, 10], [12, 14, 21, 20], [4, 22, 10, 9], [8, 13, 3, 5],
    [56, 6, 26, 12], [6, 40, 26, 24], [40, 28, 34, 26], [84, 6, 10, 24]
  ];
  W.resv = (x, y) => Z.some((z) => x >= z[0] && x < z[0] + z[2] && y >= z[1] && y < z[1] + z[3]);

  W.gen = function () {
    W.gr.fill(0); W.sol.fill(0); W.ents.length = 0; W.LT.length = 0;

    // ---------- lagos e lagoas ----------
    const lake = (cxp, cyp, rx, ry) => {
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        const dx = (x - cxp) / rx, dy = (y - cyp) / ry, d = dx * dx + dy * dy;
        if (d < 1) { W.gr[ix(x, y)] = 2; W.sol[ix(x, y)] = 1; }
        else if (d < 1.34 && W.gr[ix(x, y)] !== 2) W.gr[ix(x, y)] = 3;
      }
    };
    lake(58, 42, 15, 11);   // lago principal
    lake(84, 60, 7, 5);     // lagoa do leste
    lake(10, 58, 6, 4);     // lagoa do prado

    // ---------- caminhos ----------
    rect(9, 10, 2, 8, 1); rect(9, 16, 35, 2, 1); rect(31, 9, 13, 3, 1); rect(35, 11, 2, 6, 1);
    rect(40, 17, 2, 12, 1); rect(20, 18, 2, 1, 1); rect(40, 29, 8, 2, 4);
    rect(42, 27, 47, 2, 1);   // estrada a leste (até a mina)
    rect(20, 33, 2, 24, 1);   // caminho ao sul (até o prado)
    rect(22, 56, 53, 2, 1);   // contorno sul do lago
    rect(76, 17, 2, 39, 1);   // atalho a leste do lago
    rect(45, 20, 2, 7, 1);    // descida até a margem norte
    rect(87, 13, 2, 15, 1);   // subida até a mina

    // ---------- vila ----------
    W.addE('house', 152, 160, -40, -64); W.addE('shop', 576, 144, -32, -64);
    for (let y = 6; y < 10; y++) for (let x = 7; x < 12; x++) W.sol[ix(x, y)] = 1;
    for (let y = 5; y < 9; y++) for (let x = 34; x < 38; x++) W.sol[ix(x, y)] = 1;
    W.sol[ix(26, 13)] = 1; W.addE('well', 26 * T + 8, 14 * T, -8, -24, { well: 1 }); W.LT.push([26 * T + 8, 14 * T - 24, 64, '90,170,255']);
    [[12, 12], [12, 18], [30, 12], [39, 12], [39, 23], [22, 15], [44, 26], [60, 26], [18, 44], [24, 53], [78, 34], [78, 50]]
      .forEach(([x, y]) => { W.sol[ix(x, y)] = 1; W.addE('lamp', x * T + 8, y * T + 16, -4, -24); W.LT.push([x * T + 8, y * T - 4, 44, '255,200,110']); });
    W.LT.push([132, 142, 34, '255,200,110'], [172, 142, 34, '255,200,110'], [561, 125, 42, '255,200,110']);
    [[13, 8], [5, 10], [48, 24], [52, 25], [10, 44]].forEach(([x, y]) => { W.sol[ix(x, y)] = 1; W.addE('sak', x * T + 8, y * T + T, -16, -48, { tree: 1, ti: -1, tx: x, ty: y }); });
    W.sol[ix(24, 43)] = 1; W.sol[ix(24, 44)] = 1; W.addE('silo', 24 * T + 8, 45 * T, -16, -48);

    // ---------- biblioteca ----------
    rect(44, 16, 4, 2, 1);   // caminho até a biblioteca
    const blx = 46, bly = 11;
    for (let y = bly; y < bly + 3; y++) for (let x = blx; x < blx + 4; x++) W.sol[ix(x, y)] = 1;
    W.addE('library', blx * T + 32, (bly + 3) * T, -40, -64);
    W.LT.push([blx * T + 32, bly * T + 8, 44, '255,200,110']);
    W.libPoint = { x: blx * T + 32, y: (bly + 3) * T };

    // ---------- pomar ----------
    for (let x = 57; x <= 81; x += 3) for (let y = 7; y <= 16; y += 3) {
      W.sol[ix(x, y)] = 1; W.addE('tree', x * T + 8, y * T + T, -16, -48, { tree: 1, ti: (x + y) % 3, tx: x, ty: y });
    }

    // ---------- cerca da fazenda ----------
    for (let x = 13; x <= 31; x++) for (const y of [18, 32]) if (!(x == 20 || x == 21)) { W.sol[ix(x, y)] = 1; W.addE('fence', x * T + 8, y * T + T, -8, -16); }
    for (let y = 19; y < 32; y++) for (const x of [13, 31]) { W.sol[ix(x, y)] = 1; W.addE('fence', x * T + 8, y * T + T, -8, -16); }

    // ---------- entrada da mina ----------
    const [mx, my] = W.mine;
    for (let y = my - 2; y <= my; y++) for (let x = mx - 1; x <= mx + 1; x++) W.sol[ix(x, y)] = 1;
    W.addE('mine', mx * T + 8, my * T + 16, -24, -40, { mine: 1 });
    W.minePoint = { x: mx * T + 8, y: my * T + 8 };
    W.LT.push([mx * T + 8, my * T - 20, 40, '255,200,110']);
    W.scatter();
  };

  // árvores/arbustos espalhados
  W.scatter = function () {
    const rn = U.mkRng(11);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (W.gr[ix(x, y)] || W.sol[ix(x, y)]) continue;
      const edge = x < 3 || y < 3 || x >= MW - 3 || y >= MH - 3, rs = W.resv(x, y);
      const forest = (x < 15 && y > 22) || y > MH - 12 || x > MW - 12;
      const p = edge ? 0.95 : rs ? 0 : forest ? 0.38 : 0.045;
      if (rn() < p) { W.sol[ix(x, y)] = 1; W.addE('tree', x * T + 8, y * T + T, -16, -48, { tree: 1, ti: (rn() * 3) | 0, tx: x, ty: y }); }
    }
  };

  W.growTree = function () {
    let t = 0;
    while (t < 300) {
      t++;
      const x = U.I(3, MW - 3), y = U.I(3, MH - 3);
      if (W.gr[ix(x, y)] || W.sol[ix(x, y)] || W.resv(x, y) || W.inFarm(x, y) || NJ.S.built[x + ',' + y]) continue;
      const forest = (x < 15 && y > 22) || y > MH - 12 || x > MW - 12;
      if (!forest && Math.random() < 0.7) continue;
      W.sol[ix(x, y)] = 1; W.addE('tree', x * T + 8, y * T + T, -16, -48, { tree: 1, ti: U.I(0, 2), tx: x, ty: y });
      return 1;
    }
  };

  // forragem conforme a estação
  W.spawnFG = function () {
    const S = NJ.S, list = D.FORAGE[S.season] || D.FORAGE.spring;
    S.fg = [];
    let n = 0, t = 0;
    while (n < 72 && t < 2400) {
      t++;
      const x = U.I(2, MW - 3), y = U.I(2, MH - 3);
      if (W.gr[ix(x, y)] || W.sol[ix(x, y)] || W.inFarm(x, y) || S.built[x + ',' + y] || S.fg.some((f) => f.x == x && f.y == y)) continue;
      let r = Math.random(), acc = 0, k = list[0][0];
      for (const [id, w] of list) { acc += w; if (r <= acc) { k = id; break; } }
      S.fg.push({ x, y, k }); n++;
    }
  };

  // colisão: sólido do mapa ou construção sólida
  W.solidAt = function (tx, ty) {
    if (NJ.loc === 'cave' && NJ.mine) return NJ.mine.solidAt(tx, ty);
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true;
    if (W.sol[ix(tx, ty)]) return true;
    const b = NJ.S.built[tx + ',' + ty];
    return !!(b && D.BLM[b] && D.BLM[b].solid);
  };
  W.blk = function (x, y) {
    return [[-4, 0], [4, 0], [-4, -4], [4, -4]].some(([a, b]) => W.solidAt(Math.floor((x + a) / T), Math.floor((y + b) / T)));
  };

  // terreno desenhado em canvas, recriado a cada estação
  W.buildGround = function (season) {
    const P = D.PAL[season] || D.PAL.spring, snow = !!P.snow;
    const rn = U.mkRng(7);
    const g0 = P.g[0], g1 = P.g[1], g2 = P.g[2], g3 = P.g[3];
    const s0 = P.speck[0], s1 = P.speck[1];
    const FLW = snow ? ['#ffffff', '#e8f2ff'] : ['#ff6f91', '#ffd23f', '#ffffff', '#c58bff', '#7ad0ff'];

    W.GR = U.mk(MW * T, MH * T, (x, r) => {
      // vizinho (fora do mapa = grama) para transições suaves de relevo
      const nb = (X, y, dx, dy) => {
        const nx = X + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) return 0;
        return W.gr[ix(nx, ny)];
      };
      // tufo de capim em 3 pixels
      const tuft = (ax, ay, c) => { r(ax, ay, 1, 3, c); r(ax + 1, ay + 1, 1, 2, c); r(ax + 2, ay, 1, 2, c); };

      for (let y = 0; y < MH; y++) for (let X = 0; X < MW; X++) {
        const v = W.gr[ix(X, y)], px = X * T, py = y * T, alt = (X + y) & 1;

        // ---------- grama ----------
        if (v === 0) {
          r(px, py, T, T, alt ? g1 : g0);
          r(px + ((rn() * 8) | 0), py + ((rn() * 8) | 0), 4, 3, alt ? g2 : g0);
          r(px + 8 + ((rn() * 5) | 0), py + 8 + ((rn() * 5) | 0), 3, 3, alt ? g0 : g2);
          if (rn() < 0.3) r(px + 1, py + T - 2, 14, 2, g3);
          tuft(px + 2 + ((rn() * 9) | 0), py + 2 + ((rn() * 9) | 0), s1);
          if (rn() < 0.6) tuft(px + 1 + ((rn() * 11) | 0), py + 3 + ((rn() * 8) | 0), s0);
          if (rn() < 0.16) r(px + 3 + ((rn() * 9) | 0), py + 4 + ((rn() * 8) | 0), 2, 1, snow ? '#dbe8f0' : '#b9b5a4');
          if (rn() < 0.1) r(px + 2 + ((rn() * 10) | 0), py + 2 + ((rn() * 10) | 0), 3, 1, snow ? '#eef4f8' : '#6d5a3a');
          if (snow) { if (rn() < 0.14) r(px + ((rn() * 12) | 0), py + ((rn() * 12) | 0), 2, 1, '#ffffff'); }
          else if (rn() < P.flower) {
            const c = FLW[(rn() * FLW.length) | 0], a = px + 3 + ((rn() * 9) | 0), b = py + 3 + ((rn() * 8) | 0);
            r(a, b, 2, 2, c); r(a, b + 2, 1, 2, '#2f7a3c');
          }
          // franja onde a grama encosta em caminho
          if (nb(X, y, 0, -1) === 1) r(px, py, T, 1, '#6f6d5e');
          if (nb(X, y, 0, 1) === 1) r(px, py + T - 1, T, 1, '#6f6d5e');
          if (nb(X, y, -1, 0) === 1) r(px, py, 1, T, '#6f6d5e');
          if (nb(X, y, 1, 0) === 1) r(px + T - 1, py, 1, T, '#6f6d5e');
        }
        // ---------- caminho de pedra ----------
        else if (v === 1) {
          r(px, py, T, T, alt ? '#8c8a7a' : '#87856f');
          const st = (ax, ay, w, h, base) => { r(ax, ay, w, h, base); r(ax, ay, w, 1, '#c9c6b6'); r(ax, ay + h - 1, w, 1, '#6f6d60'); };
          st(px + 1, py + 1, 6, 6, '#a9a698'); st(px + 9, py + 1, 6, 6, '#b0ad9c');
          st(px + 1, py + 9, 6, 6, '#b0ad9c'); st(px + 9, py + 9, 6, 6, '#a9a698');
          r(px + 7, py, 2, T, '#767467'); r(px, py + 7, T, 2, '#767467');
          if (nb(X, y, 0, -1) === 0) { r(px + 2, py, 1, 2, g1); r(px + 9, py, 1, 2, g1); r(px + 13, py, 1, 1, g1); }
          if (nb(X, y, 0, 1) === 0) { r(px + 3, py + T - 2, 1, 2, g1); r(px + 10, py + T - 2, 1, 2, g1); }
          if (nb(X, y, -1, 0) === 0) { r(px, py + 3, 2, 1, g1); r(px, py + 11, 2, 1, g1); }
          if (nb(X, y, 1, 0) === 0) { r(px + T - 2, py + 5, 2, 1, g1); r(px + T - 2, py + 12, 2, 1, g1); }
        }
        // ---------- água ----------
        else if (v === 2) {
          r(px, py, T, T, snow ? '#bfe2f2' : '#2f78b8');
          r(px, py + 8, T, 8, snow ? '#cfe2f2' : '#26679f');
          if (!snow) { r(px + 4, py + 5, 5, 1, '#4a96d4'); r(px + 9, py + 11, 5, 1, '#4a96d4'); }
          const shallow = snow ? '#e6f2ff' : '#5aa6de', foam = snow ? '#ffffff' : '#bfe6ff';
          const land = (dx, dy) => nb(X, y, dx, dy) !== 2;
          if (land(0, -1)) { r(px, py, T, 2, shallow); r(px + ((X * 5) % 9), py + 2, 5, 1, foam); }
          if (land(0, 1)) { r(px, py + T - 2, T, 2, shallow); r(px + ((X * 7) % 9), py + T - 3, 5, 1, foam); }
          if (land(-1, 0)) { r(px, py, 2, T, shallow); r(px + 2, py + ((y * 6) % 9), 1, 5, foam); }
          if (land(1, 0)) { r(px + T - 2, py, 2, T, shallow); r(px + T - 3, py + ((y * 4) % 9), 1, 5, foam); }
        }
        // ---------- areia ----------
        else if (v === 3) {
          r(px, py, T, T, snow ? '#eef4f8' : '#e2cf98');
          r(px + ((rn() * 12) | 0), py + ((rn() * 12) | 0), 2, 1, snow ? '#dbe8f0' : '#cdb97d');
          r(px + ((rn() * 12) | 0), py + ((rn() * 12) | 0), 1, 1, snow ? '#ffffff' : '#f0e2b8');
          if (!snow) {
            if (nb(X, y, 0, -1) === 0) for (let i = 0; i < 5; i++) r(px + ((rn() * 14) | 0), py + ((rn() * 3) | 0), 2, 2, g1);
            if (nb(X, y, 0, 1) === 0) for (let i = 0; i < 5; i++) r(px + ((rn() * 14) | 0), py + 13 + ((rn() * 3) | 0), 2, 2, g1);
            if (nb(X, y, -1, 0) === 0) for (let i = 0; i < 4; i++) r(px + ((rn() * 3) | 0), py + ((rn() * 14) | 0), 2, 2, g1);
            if (nb(X, y, 1, 0) === 0) for (let i = 0; i < 4; i++) r(px + 13 + ((rn() * 3) | 0), py + ((rn() * 14) | 0), 2, 2, g1);
          }
        }
        // ---------- terra ----------
        else {
          r(px, py, T, T, '#a0693a');
          r(px, py, T, 1, '#b57a48');
          r(px, py + 7, T, 2, '#7a4a28'); r(px, py + 15, T, 2, '#7a4a28');
          r(px + 3, py + 2, 2, 2, '#b57a48'); r(px + 10, py + 10, 2, 2, '#8a5a30');
          r(px + 4, py, 1, T, '#7c4a26');
        }
      }
    });
    SP.build(season);
  };

  // casas de animais construídas (galinheiro/celeiro): lista em S.houses
  W.houseAt = function (tx, ty) {
    const S = NJ.S;
    for (const h of S.houses || []) if (tx >= h.x && tx < h.x + h.w && ty >= h.y && ty < h.y + h.h) return h;
    return null;
  };
})();
