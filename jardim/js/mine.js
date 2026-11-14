/* Nosso Jardim v2 — mina/caverna com andares, pedras e minérios */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const D = NJ.data, U = NJ.util, SP = NJ.sprites;
  const M = (NJ.mine = {});
  const T = D.T, CW = 30, CH = 22;
  M.CW = CW; M.CH = CH;

  M.gr = new Uint8Array(CW * CH);       // 0 chão, 1 parede
  M.rocks = {};                          // "x,y" -> {ore}
  M.up = { x: 2, y: 2 }; M.down = { x: 2, y: 2 };
  M.depth = 1; M.cooldown = 0;
  const ix = (x, y) => y * CW + x;
  M.ix = ix;

  M.oreFor = function (depth) {
    const r = Math.random();
    if (depth >= 12 && r < 0.07) return 'gem';
    if (depth >= 8 && r < 0.16) return 'go';
    if (depth >= 4 && r < 0.32) return 'ir';
    if (r < 0.48) return 'cu';
    if (r < 0.68) return 'coal';
    return null;
  };

  M.gen = function (depth) {
    M.depth = depth;
    const rng = U.mkRng(1000 + depth * 7919);
    M.gr.fill(1); M.rocks = {};
    const rooms = [];
    for (let i = 0; i < 7; i++) {
      const w = 4 + ((rng() * 5) | 0), h = 4 + ((rng() * 4) | 0);
      const x = 1 + ((rng() * (CW - w - 2)) | 0), y = 1 + ((rng() * (CH - h - 2)) | 0);
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) M.gr[ix(xx, yy)] = 0;
      rooms.push({ x: (x + w / 2) | 0, y: (y + h / 2) | 0 });
    }
    for (let i = 1; i < rooms.length; i++) {
      let a = rooms[i - 1], b = rooms[i];
      for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) M.gr[ix(x, a.y)] = 0;
      for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) M.gr[ix(b.x, y)] = 0;
    }
    M.up = { x: rooms[0].x, y: rooms[0].y };
    M.down = { x: rooms[rooms.length - 1].x, y: rooms[rooms.length - 1].y };
    if (M.down.x === M.up.x && M.down.y === M.up.y) M.down = { x: Math.min(CW - 2, M.up.x + 4), y: M.up.y };
    for (let y = M.up.y - 1; y <= M.up.y + 1; y++) for (let x = M.up.x - 1; x <= M.up.x + 1; x++) if (x > 0 && y > 0 && x < CW - 1 && y < CH - 1) M.gr[ix(x, y)] = 0;
    for (let y = M.down.y - 1; y <= M.down.y + 1; y++) for (let x = M.down.x - 1; x <= M.down.x + 1; x++) if (x > 0 && y > 0 && x < CW - 1 && y < CH - 1) M.gr[ix(x, y)] = 0;
    // pedras e minérios
    for (let y = 1; y < CH - 1; y++) for (let x = 1; x < CW - 1; x++) {
      if (M.gr[ix(x, y)]) continue;
      if (Math.abs(x - M.up.x) <= 1 && Math.abs(y - M.up.y) <= 1) continue;
      if (Math.abs(x - M.down.x) <= 1 && Math.abs(y - M.down.y) <= 1) continue;
      if (rng() < 0.13) M.rocks[x + ',' + y] = { ore: M.oreFor(depth) };
    }
    // canvas do chão
    M.ground = NJ.util.mk(CW * T, CH * T, (ctx, r) => {
      const rn = NJ.util.mkRng(3 + depth);
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
        const px = x * T, py = y * T;
        if (M.gr[ix(x, y)]) { r(px, py, T, T, '#3a3644'); r(px + 1, py + 1, T - 2, 6, '#4a4656'); r(px + 1, py + 8, T - 2, 6, '#332f3d'); }
        else { r(px, py, T, T, '#6b5a48'); r(px + ((rn() * 12) | 0), py + ((rn() * 12) | 0), 2, 1, '#5a4a3a'); r(px + 2, py + 2, 1, 1, '#7a6a58'); }
      }
    });
  };

  M.solidAt = function (tx, ty) {
    if (tx < 0 || ty < 0 || tx >= CW || ty >= CH) return true;
    if (M.gr[ix(tx, ty)]) return true;
    return !!M.rocks[tx + ',' + ty];
  };

  M.enter = function () {
    M.saved = { x: NJ.S.px, y: NJ.S.py, d: NJ.S.d };
    NJ.loc = 'cave';
    M.gen(1);
    NJ.S.px = M.up.x * T + 8; NJ.S.py = M.up.y * T + 14; NJ.S.d = 0;
    NJ.audio.chord([330, 262]); NJ.ui.toast('⛏️ Mina — andar 1');
  };
  M.exit = function () {
    NJ.loc = 'world';
    if (M.saved) { NJ.S.px = M.saved.x; NJ.S.py = M.saved.y + 20; NJ.S.d = M.saved.d; }
    NJ.audio.beep(300); NJ.ui.toast('De volta à superfície ☀️');
  };
  M.break = function (tx, ty) {
    const k = tx + ',' + ty, rock = M.rocks[k];
    if (!rock) { NJ.ui.toast('Aqui não tem pedra ⚒️'); return; }
    delete M.rocks[k];
    NJ.econ.add('stone', 1);
    NJ.S.st.stone = (NJ.S.st.stone || 0) + 1;
    NJ.prog.xp('mining', 4);
    if (rock.ore) { NJ.econ.add(rock.ore, 1); if (rock.ore == 'gem') NJ.S.st.gem = (NJ.S.st.gem || 0) + 1; }
    NJ.fx(tx * T + 8, ty * T, rock.ore ? D.IT[rock.ore].e : '🪨');
    NJ.audio.beep(rock.ore == 'gem' ? 1100 : 260);
    NJ.prog.check(); NJ.state.save();
  };

  // chamado a cada passo: escadas
  M.step = function (dt) {
    if (NJ.loc !== 'cave') return;
    M.cooldown -= (dt || 1 / 60);
    const tx = Math.floor(NJ.S.px / T), ty = Math.floor(NJ.S.py / T);
    if (M.cooldown > 0) return;
    if (tx === M.down.x && ty === M.down.y) {
      if (M.depth >= 15) { NJ.ui.toast('Você chegou ao fundo da mina! 🦴'); return; }
      M.gen(M.depth + 1);
      NJ.S.px = M.up.x * T + 8; NJ.S.py = M.up.y * T + 14; M.cooldown = 0.8;
      NJ.ui.toast('⛏️ Andar ' + M.depth); NJ.audio.beep(500);
    } else if (tx === M.up.x && ty === M.up.y) {
      if (M.depth <= 1) M.exit();
      else { M.gen(M.depth - 1); NJ.S.px = M.down.x * T + 8; NJ.S.py = M.down.y * T + 14; M.cooldown = 0.8; NJ.ui.toast('⬆️ Andar ' + M.depth); NJ.audio.beep(600); }
    }
  };

  M.draw = function (g, cx, cy, t) {
    const W = Math.min(NJ.vw, CW * T), H = Math.min(NJ.vh, CH * T);
    g.drawImage(M.ground, cx, cy, W, H, 0, 0, W, H);
    // escadas
    const ldr = (x, y, up) => {
      const px = x * T - cx, py = y * T - cy;
      g.fillStyle = up ? '#8a6a3a' : '#a8842a';
      g.fillRect(px + 3, py + 2, 2, 12); g.fillRect(px + 11, py + 2, 2, 12);
      for (let i = 0; i < 3; i++) g.fillRect(px + 3, py + 3 + i * 4, 10, 2);
      g.fillStyle = up ? '#f2e8d0' : '#ffd23f'; g.font = 'bold 9px monospace'; g.textAlign = 'center';
      g.fillText(up ? '▲' : '▼', px + 8, py - 2);
    };
    for (const k in M.rocks) {
      const [x, y] = k.split(',').map(Number), rock = M.rocks[k], px = x * T - cx, py = y * T - cy;
      if (px < -20 || py < -20 || px > NJ.vw + 20 || py > NJ.vh + 20) continue;
      g.drawImage((x + y) % 2 ? SP.SPR.rock : SP.SPR.rock2, px, py);
      if (rock.ore) {
        const c = { cu: '#e08a3a', ir: '#c8c8d0', go: '#ffd23f', gem: '#7ad0ff', coal: '#3a3a3a' }[rock.ore];
        g.fillStyle = c; g.fillRect(px + 5, py + 6, 2, 2); g.fillRect(px + 9, py + 8, 2, 2); g.fillRect(px + 7, py + 10, 1, 1);
        if (rock.ore == 'gem' && Math.sin(t * 4 + x) > 0.3) g.fillRect(px + 6, py + 4, 1, 1);
      }
    }
    ldr(M.up.x, M.up.y, true); ldr(M.down.x, M.down.y, false);
  };
})();
