/* Nosso Jardim v2 — sprites gerados por código (arte detalhada) + desenho das peças de construção */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const U = NJ.util, D = NJ.data;
  const SP = (NJ.sprites = {});
  const SPR = (SP.SPR = {});
  const OUT = '#22301d';                 // contorno escuro (dá leitura à arte)

  // círculo com contorno
  const blob = (r, cx, cy, rad, col, out) => { if (out) U.ci(r, cx, cy, rad, out); U.ci(r, cx, cy, rad - 1, col); };
  // "elipse" (usada para sombras e volumes)
  const oval = (r, cx, cy, rw, rh, col) => {
    for (let y = -rh; y <= rh; y++) {
      const t = 1 - (y * y) / (rh * rh);
      const w = Math.round(Math.sqrt(t < 0 ? 0 : t) * rw);
      r(cx - w, cy + y, 2 * w + 1, 1, col);
    }
  };

  // ---------- vegetais ----------
  const tree = (a, b, c, snow) => U.mk(32, 48, (x, r) => {
    oval(r, 16, 45, 13, 3, 'rgba(0,0,0,.20)');
    r(13, 28, 7, 18, '#3d2213'); r(14, 28, 4, 18, '#7d4b25'); r(18, 28, 1, 18, '#2c170c');
    r(13, 33, 7, 1, '#5c3418'); r(13, 39, 7, 1, '#5c3418');
    r(10, 44, 5, 4, '#3d2213'); r(18, 44, 5, 4, '#3d2213');
    blob(r, 16, 15, 13, a, OUT);
    blob(r, 9, 14, 8, b, OUT); blob(r, 23, 16, 8, b, OUT); blob(r, 16, 7, 9, b, OUT);
    blob(r, 7, 9, 5, c, OUT); blob(r, 15, 3, 6, c, OUT); blob(r, 25, 10, 5, c, OUT);
    r(8, 6, 3, 2, '#ffffff55'); r(14, 2, 4, 2, '#ffffff44'); r(24, 8, 3, 2, '#ffffff33');
    if (snow) { r(6, 11, 21, 2, '#ffffff'); r(11, 6, 12, 2, '#ffffff'); r(8, 15, 7, 1, '#ffffff'); r(22, 13, 7, 1, '#ffffff'); }
  });
  const rock = (a, b) => U.mk(16, 16, (x, r) => {
    oval(r, 8, 14, 7, 2, 'rgba(0,0,0,.18)');
    blob(r, 8, 9, 7, a, OUT);
    blob(r, 6, 7, 3, b, OUT);
    r(4, 11, 9, 1, '#00000022'); r(9, 5, 3, 2, '#ffffff33');
  });

  SP.build = function (season) {
    const P = D.PAL[season] || D.PAL.spring, snow = !!P.snow;
    SPR.t = [
      tree(P.tree[0], P.tree[1], P.tree[2], snow),
      tree(P.tree[1], P.tree[2], P.tree[0], snow),
      tree(P.tree[0], P.tree[2], P.tree[1], snow)
    ];
    SPR.sak = tree('#e87aa8', '#f7a8c8', '#ffe2f0', snow);
    SPR.rock = rock('#8c8a7a', '#b3b0a0');
    SPR.rock2 = rock('#7a6f66', '#968a80');

    // ---------- casa da fazenda (80x64) ----------
    SPR.house = U.mk(80, 64, (x, r) => {
      oval(r, 40, 62, 34, 4, 'rgba(0,0,0,.22)');
      // chaminé (atrás do telhado)
      r(53, 0, 9, 14, '#7d5a4a'); r(53, 0, 9, 2, '#9a7060'); r(52, 0, 11, 2, '#5a3f34');
      r(53, 4, 9, 1, '#5a3f34'); r(53, 9, 9, 1, '#5a3f34');
      // telhado em duas águas
      for (let i = 0; i < 11; i++) {
        const hw = 9 + i * 3.6, w = Math.round(hw * 2), x0 = Math.round(40 - hw), y = i * 3;
        const A = i % 2 ? '#b03946' : '#c9485a';
        r(x0, y, w, 3, A);
        r(x0, y, Math.round(hw), 3, i % 2 ? '#c14a58' : '#d75a6c');
        r(x0 + Math.round(hw), y, Math.round(hw), 3, '#8f2a35');
        r(x0, y, w, 1, '#00000018');
      }
      r(0, 30, 80, 3, '#5a1e26');
      r(37, 0, 6, 3, '#e8848f');
      // paredes
      r(6, 33, 68, 31, '#c98a5a'); r(6, 33, 68, 3, '#dba46e'); r(6, 61, 68, 3, '#9d6a40');
      for (let i = 0; i < 7; i++) r(6, 37 + i * 4, 68, 1, '#b0784a');
      r(6, 33, 3, 31, '#8a5a34'); r(71, 33, 3, 31, '#8a5a34');
      // janelas + jardineiras
      [13, 53].forEach((a) => {
        r(a - 1, 41, 16, 15, '#6b3f26'); r(a, 42, 14, 13, '#3a2416');
        r(a + 1, 43, 12, 11, '#ffd98a'); r(a + 1, 43, 12, 4, '#fff2cc');
        r(a + 6, 43, 2, 11, '#6b3f26'); r(a + 1, 48, 12, 2, '#6b3f26');
        r(a + 1, 43, 3, 11, '#e8607a'); r(a + 10, 43, 3, 11, '#e8607a');
        r(a - 2, 54, 18, 2, '#6b3f26'); r(a - 1, 55, 16, 5, '#7a4a28'); r(a, 55, 14, 2, '#8a5a34');
        r(a + 1, 53, 2, 2, '#ff6f91'); r(a + 5, 53, 2, 2, '#ffd23f'); r(a + 9, 53, 2, 2, '#c58bff'); r(a + 12, 53, 2, 2, '#ff6f91');
      });
      // porta
      r(33, 42, 14, 22, '#6b3f26'); r(34, 43, 12, 21, '#8a5634');
      r(35, 43, 5, 21, '#a06a42'); r(34, 43, 12, 1, '#c98a5a');
      r(34, 47, 12, 1, '#75492c'); r(34, 52, 12, 1, '#75492c'); r(34, 57, 12, 1, '#75492c');
      r(44, 53, 2, 2, '#ffd23f');
      r(31, 62, 18, 3, '#9a9080'); r(31, 62, 18, 1, '#bcb2a2');
      // lampiãozinho ao lado da porta
      r(28, 45, 2, 14, '#4a4a5a'); r(26, 43, 6, 6, '#ffd98a'); r(26, 43, 6, 2, '#fff0c0'); r(25, 42, 8, 2, '#3a3a4a'); r(25, 49, 8, 2, '#3a3a4a');
    });

    // ---------- lojinha (64x64) ----------
    SPR.shop = U.mk(64, 64, (x, r) => {
      oval(r, 32, 62, 29, 4, 'rgba(0,0,0,.22)');
      // toldo listrado
      for (let i = 0; i < 10; i++) { const hw = 13 + i * 2.5, w = Math.round(hw * 2), x0 = Math.round(32 - hw), y = i * 3; r(x0, y, w, 3, i % 2 ? '#a8343f' : '#c8434f'); r(x0, y, Math.round(hw), 3, i % 2 ? '#bb3d49' : '#d8505d'); r(x0 + Math.round(hw), y, Math.round(hw), 3, '#8a2430'); }
      r(0, 29, 64, 3, '#7a2430');
      // balcão / parede
      r(4, 32, 56, 30, '#d7b47e'); r(4, 32, 56, 3, '#e8c894'); r(4, 59, 56, 3, '#a8885a');
      for (let i = 0; i < 7; i++) r(4, 35 + i * 4, 56, 1, '#bf9a68');
      // vitrine
      r(7, 39, 20, 16, '#6b3f26'); r(8, 40, 18, 14, '#cfe8ff'); r(8, 40, 18, 5, '#eaf6ff');
      r(16, 40, 1, 14, '#6b3f26'); r(8, 46, 18, 1, '#6b3f26');
      r(11, 48, 3, 4, '#e8607a'); r(17, 47, 4, 5, '#7ad0ff'); r(22, 48, 3, 4, '#ffd23f');
      // porta
      r(38, 39, 16, 23, '#6b3f26'); r(39, 40, 14, 22, '#8a5634'); r(40, 40, 6, 22, '#a06a42');
      r(52, 51, 2, 2, '#ffd23f');
      // placa "LOJA"
      r(20, 20, 24, 9, '#6b3f26'); r(21, 21, 22, 7, '#c0392b'); r(21, 21, 22, 2, '#e05a48');
      x.font = 'bold 6px monospace'; x.fillStyle = '#ffe9b0'; x.fillText('LOJA', 24, 27);
      // barris e caixotes
      r(0, 46, 8, 14, '#7a4a28'); r(1, 47, 6, 12, '#96602f'); r(0, 51, 8, 1, '#5a3420'); r(0, 55, 8, 1, '#5a3420');
      r(56, 44, 8, 16, '#8a5a34'); r(57, 45, 6, 14, '#a8703c'); r(56, 50, 8, 1, '#6b4226'); r(56, 56, 8, 1, '#6b4226');
    });

    // ---------- silo (32x48) ----------
    SPR.silo = U.mk(32, 48, (x, r) => {
      oval(r, 16, 46, 13, 3, 'rgba(0,0,0,.20)');
      r(5, 12, 22, 34, '#b9b3a2'); r(6, 12, 9, 34, '#d0c9b8'); r(24, 12, 3, 34, '#9a9484');
      for (let i = 0; i < 6; i++) r(5, 16 + i * 5, 22, 1, '#9a9484');
      r(5, 8, 22, 6, '#8a8470'); r(7, 4, 18, 5, '#a39c86'); r(11, 1, 10, 4, '#b9b3a2'); r(11, 1, 10, 1, '#d0c9b8');
      r(14, 36, 5, 10, '#6b6050'); r(15, 37, 3, 9, '#847a66'); r(14, 41, 5, 1, '#4f4738');
      r(6, 13, 1, 32, '#ffffff22');
    });

    // ---------- entrada da mina (48x40) ----------
    SPR.mine = U.mk(48, 40, (x, r) => {
      oval(r, 24, 37, 21, 3, 'rgba(0,0,0,.25)');
      r(2, 24, 44, 16, '#767b82'); r(2, 24, 44, 2, '#8f959c'); r(4, 27, 40, 11, '#8d929a');
      r(3, 38, 42, 2, '#5a5f66');
      r(8, 14, 32, 14, '#666b72'); r(8, 14, 32, 2, '#7a808a');
      r(13, 18, 22, 22, '#2a2a2e'); r(14, 19, 20, 20, '#141416'); r(15, 20, 18, 18, '#0c0c0e');
      // vigas de madeira
      r(10, 12, 28, 4, '#7a4a28'); r(10, 12, 28, 1, '#96602f');
      r(10, 12, 4, 22, '#6b3f26'); r(34, 12, 4, 22, '#6b3f26');
      r(11, 13, 2, 20, '#8a5634'); r(35, 13, 2, 20, '#8a5634');
      // brilho dos olhos na escuridão
      r(17, 28, 2, 2, '#ffd23f'); r(29, 28, 2, 2, '#ffd23f');
      // pedrinhas / trilho
      r(12, 34, 24, 2, '#4a3a2a'); r(12, 34, 24, 1, '#5f4a34');
    });

    // ---------- poço (16x24) ----------
    SPR.well = U.mk(16, 24, (x, r) => {
      oval(r, 8, 22, 7, 2, 'rgba(0,0,0,.20)');
      r(1, 13, 14, 10, '#6f7686'); r(2, 13, 12, 2, '#8b93a3'); r(1, 21, 14, 2, '#525a68');
      for (let i = 0; i < 4; i++) r(2 + i * 3, 15, 1, 7, '#5a6272');
      r(0, 11, 16, 3, '#9aa2b4'); r(0, 11, 16, 1, '#b6bece'); r(3, 12, 10, 2, '#1f4fb8'); r(4, 12, 8, 1, '#6fa8ff');
      r(7, 3, 2, 9, '#4a3a2a'); r(3, 2, 10, 2, '#5a4a3a'); r(3, 2, 10, 1, '#7a6a5a');
      r(2, 3, 1, 8, '#3a2a1a'); r(13, 3, 1, 8, '#3a2a1a');
    });

    // ---------- poste de luz (8x24) ----------
    SPR.lamp = U.mk(8, 24, (x, r) => {
      r(3, 7, 2, 17, '#3a3a4a'); r(3, 7, 1, 17, '#555568');
      r(2, 22, 4, 2, '#2a2a3a');
      r(0, 1, 8, 1, '#2a2a3a'); r(1, 2, 6, 6, '#ffe08a'); r(2, 3, 4, 4, '#fff6d0'); r(1, 1, 6, 1, '#3a3a4a'); r(0, 7, 8, 2, '#2a2a3a');
    });

    // ---------- cerca (16x16) ----------
    SPR.fence = U.mk(16, 16, (x, r) => {
      r(0, 7, 16, 3, '#a8703c'); r(0, 7, 16, 1, '#c98a52');
      r(0, 11, 16, 3, '#a8703c'); r(0, 11, 16, 1, '#c98a52');
      [1, 12].forEach((a) => { r(a, 3, 3, 12, '#6b4226'); r(a, 3, 1, 12, '#8a5a34'); r(a, 2, 3, 2, '#8a5a34'); });
    });

    // ---------- espantalho (16x24) ----------
    SPR.scarecrow = U.mk(16, 24, (x, r) => {
      oval(r, 8, 23, 6, 2, 'rgba(0,0,0,.20)');
      r(7, 9, 2, 15, '#8a6a3a'); r(7, 9, 1, 15, '#a5834d');
      r(2, 11, 12, 2, '#8a6a3a'); r(2, 11, 12, 1, '#a5834d');
      r(4, 15, 8, 8, '#c0392b'); r(4, 15, 8, 2, '#d85a48'); r(2, 16, 3, 5, '#c0392b'); r(11, 16, 3, 5, '#c0392b');
      r(4, 15, 2, 8, '#8a2430');
      r(5, 4, 7, 7, '#e8d0a0'); r(5, 4, 7, 2, '#f6e2b8');
      r(6, 6, 1, 1, '#2b1b17'); r(9, 6, 1, 1, '#2b1b17'); r(7, 9, 3, 1, '#c0392b');
      r(3, 2, 10, 3, '#e8c46a'); r(3, 2, 10, 1, '#f6d98a'); r(2, 3, 12, 2, '#c9a94a');
    });

    SP.HOLE = U.mkRad('rgba(0,0,0,.96)', 'rgba(0,0,0,0)');
    SP.GLW = U.mkRad('rgba(255,205,120,.34)', 'rgba(255,205,120,0)');
    SP.GLB = U.mkRad('rgba(110,180,255,.34)', 'rgba(110,180,255,0)');
    SP.shadow = U.mkRad('rgba(0,0,0,.34)', 'rgba(0,0,0,0)');
  };

  // ---------- desenho das peças de construção ----------
  SP.drawB = function (id, px, py, t) {
    const rr = SP.rr;
    px = Math.round(px); py = Math.round(py);
    if (id == 'path') {
      rr(px, py, 16, 16, '#a9764a'); rr(px, py, 16, 2, '#bb875a');
      rr(px + 1, py + 5, 14, 1, '#8f5f38'); rr(px + 1, py + 11, 14, 1, '#8f5f38');
      rr(px + ((px * 7) % 11), py + 2, 2, 1, '#c79a6c'); rr(px + ((py * 5) % 11), py + 9, 2, 1, '#c79a6c');
    }
    else if (id == 'stone') {
      rr(px, py, 16, 16, '#a9a698');
      rr(px, py + 7, 16, 1, '#8e8b7e'); rr(px + 7, py, 1, 16, '#8e8b7e');
      rr(px + 1, py + 1, 6, 6, '#c2bfb1'); rr(px + 9, py + 1, 6, 6, '#b6b3a5');
      rr(px + 1, py + 9, 6, 6, '#b6b3a5'); rr(px + 9, py + 9, 6, 6, '#c2bfb1');
      rr(px + 1, py + 1, 5, 1, '#d4d1c3'); rr(px + 9, py + 9, 5, 1, '#d4d1c3');
    }
    else if (id == 'floor') {
      rr(px, py, 16, 16, '#c98a4a');
      for (let i = 0; i < 4; i++) { rr(px, py + i * 4, 16, 1, '#a86b3a'); rr(px, py + i * 4, 16, 1, '#a86b3a'); }
      rr(px, py, 16, 1, '#d99a5a'); rr(px + 7, py, 1, 16, '#a86b3a');
      rr(px + 2 + ((px / 16) % 8), py + 5, 3, 1, '#e0a868');
    }
    else if (id == 'rug') {
      rr(px, py, 16, 16, '#9a2f3f'); rr(px, py, 16, 1, '#b03f4f');
      rr(px + 1, py + 1, 14, 14, '#c0392b'); rr(px + 3, py + 3, 10, 10, '#e8607a');
      rr(px + 5, py + 5, 6, 6, '#ffd23f'); rr(px + 6, py + 6, 4, 4, '#e8607a');
    }
    else if (id == 'wall') {
      rr(px, py, 16, 16, '#8a5a30');
      for (let i = 0; i < 4; i++) { rr(px, py + i * 4, 16, 1, '#6b4226'); rr(px, py + i * 4 + 1, 16, 1, '#a8703c'); }
      rr(px + ((px / 16) % 2 ? 0 : 7), py, 1, 16, '#6b4226');
      rr(px, py, 16, 1, '#b8804a');
    }
    else if (id == 'roof') {
      for (let i = 0; i < 4; i++) {
        const sh = 4 + i;
        rr(px + i * 4, py, sh, 4, '#8f2a35');
        rr(px + i * 4, py + 4, sh, 4, i % 2 ? '#a8343f' : '#c8434f');
        rr(px + i * 4, py, sh, 1, '#d75a6c');
        rr(px + i * 4, py + 8, sh, 4, i % 2 ? '#c8434f' : '#a8343f');
        rr(px + i * 4, py + 12, sh, 4, '#8f2a35');
      }
      rr(px, py + 3, 16, 1, '#5a1e26'); rr(px, py + 11, 16, 1, '#5a1e26');
    }
    else if (id == 'window') {
      rr(px, py, 16, 16, '#8a5a30'); rr(px, py, 16, 1, '#a8703c');
      rr(px + 2, py + 3, 12, 11, '#3a2416'); rr(px + 3, py + 4, 10, 9, '#ffd98a'); rr(px + 3, py + 4, 10, 3, '#fff2cc');
      rr(px + 7, py + 4, 2, 9, '#8a5a30'); rr(px + 3, py + 8, 10, 1, '#8a5a30');
      rr(px + 1, py + 14, 14, 2, '#6b3f26'); rr(px + 2, py + 12, 12, 2, '#7a4a28');
      rr(px + 3, py + 10, 2, 2, '#ff6f91'); rr(px + 7, py + 10, 2, 2, '#ffd23f'); rr(px + 11, py + 10, 2, 2, '#c58bff');
    }
    else if (id == 'door') {
      rr(px, py, 16, 16, '#6b3f26'); rr(px + 1, py + 2, 14, 14, '#8a5634');
      rr(px + 2, py + 3, 5, 13, '#a06a42'); rr(px + 1, py + 2, 14, 1, '#c98a5a');
      rr(px + 1, py + 6, 14, 1, '#75492c'); rr(px + 1, py + 11, 14, 1, '#75492c');
      rr(px + 12, py + 8, 2, 2, '#ffd23f');
      rr(px - 1, py + 15, 18, 1, '#9a9080');
    }
    else if (id == 'fence' || id == 'gate') {
      if (id == 'gate') { rr(px, py + 6, 16, 2, '#a8703c'); rr(px + 3, py + 2, 2, 12, '#6b4226'); rr(px + 11, py + 2, 2, 12, '#6b4226'); rr(px, py + 6, 16, 1, '#c98a52'); }
      else SP.ctx.drawImage(SPR.fence, px, py);
    }
    else if (id == 'bench') {
      rr(px + 1, py + 9, 14, 3, '#6b4226'); rr(px + 1, py + 7, 14, 2, '#a8703c'); rr(px + 1, py + 7, 14, 1, '#c98a52');
      rr(px + 1, py + 3, 14, 3, '#8a5a34'); rr(px + 1, py + 3, 14, 1, '#b07a48');
      rr(px + 2, py + 12, 2, 4, '#5a3420'); rr(px + 12, py + 12, 2, 4, '#5a3420');
    }
    else if (id == 'lamp') { SP.ctx.drawImage(SPR.lamp, px, py - 16); }
    else if (id == 'pot') {
      rr(px + 5, py + 9, 6, 6, '#b03a2f'); rr(px + 4, py + 8, 8, 2, '#d05545'); rr(px + 5, py + 9, 2, 6, '#d05545'); rr(px + 4, py + 13, 8, 2, '#8a2a22');
      rr(px + 7, py + 4, 2, 5, '#2f7a3c');
      const f = ['#ff6f91', '#ffd23f', '#c58bff'][Math.floor(t * 1.6) % 3];
      U.ci(rr, px + 8, py + 3, 3, '#2f7a3c'); U.ci(rr, px + 8, py + 3, 2, f);
    }
    else if (id == 'fountain') {
      rr(px + 2, py + 8, 12, 7, '#8c8a7a'); rr(px + 2, py + 8, 12, 2, '#a8a595'); rr(px + 2, py + 14, 12, 1, '#6f6d60');
      rr(px + 3, py + 10, 10, 4, '#3d9be0'); rr(px + 4, py + 11, 4, 1, '#8fd0ff');
      rr(px + 7, py + 3, 2, 6, '#a8a595');
      const s = Math.round(Math.sin(t * 6) * 1);
      rr(px + 5, py + 1 + s, 6, 2, '#bfe6ff'); rr(px + 6, py + 1 + s, 4, 1, '#ffffff');
      rr(px + 3, py + 4, 1, 3, '#bfe6ff88'); rr(px + 12, py + 4, 1, 3, '#bfe6ff88');
    }
    else if (id == 'scarecrow') { SP.ctx.drawImage(SPR.scarecrow, px, py - 8); }
    else if (id == 'sprinkler') {
      rr(px + 4, py + 8, 8, 5, '#6f747b'); rr(px + 4, py + 8, 8, 1, '#8c9199');
      rr(px + 6, py + 4, 4, 5, '#8c9199'); rr(px + 7, py + 2, 2, 3, '#bfe6ff');
      const w = Math.round(Math.sin(t * 5) * 3);
      rr(px + 3 - w, py + 3, 2, 2, '#bfe6ff77'); rr(px + 11 + w, py + 3, 2, 2, '#bfe6ff77');
      rr(px + 6, py + 1, 1, 1, '#ffffff88');
    }
  };
})();
