/* Nosso Jardim v2 — desenho em camadas do personagem, pet e animais */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const D = NJ.data, U = NJ.util;
  const CH = (NJ.char = {});

  // personagem: cx = centro, fy = linha dos pés; d 0=baixo 1=cima 2=esq 3=dir; f = quadro de caminhada (1 = pé esquerdo, 3 = pé direito)
  CH.draw = function (x, cx, fy, d, f, o) {
    const r = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(cx + a, fy + b, w, h); };
    const sk = D.SK[o.skin], hc = D.HC[o.hair], oc = D.OC[o.out], c2 = D.OC[o.c2];
    const lu = f == 1 ? 1 : 0, ru = f == 3 ? 1 : 0, y = (f & 1) ? -1 : 0, sd = d > 1, sl = (o.os == 1 || o.os == 2) ? c2 : oc;
    r(-5, -1, 10, 3, '#0004');
    if (o.acc == 6) { r(-9, -13 + y, 4, 7, '#eaf6ff'); r(-7, -12 + y, 3, 5, '#cfe8ff'); r(5, -13 + y, 4, 7, '#eaf6ff'); r(4, -12 + y, 3, 5, '#cfe8ff'); }
    if (o.hs == 0) r(-6, -22 + y, 12, 13, hc);
    if (o.hs == 3) r(-6, -22 + y, 12, 8, hc);
    if (o.hs == 7) r(-6, -22 + y, 12, 12, hc);
    if (o.hs == 1) { r(-8, -20 + y, 3, 8, hc); r(5, -20 + y, 3, 8, hc); r(-8, -13 + y, 3, 2, '#ff5d8f'); r(5, -13 + y, 3, 2, '#ff5d8f'); }
    if (o.hs == 5) { r(-6, -21 + y, 12, 10, hc); r(5, -19 + y, 4, 3, hc); }
    if (o.hs == 6) { r(-7, -21 + y, 14, 11, hc); r(-8, -18 + y, 3, 4, hc); r(5, -18 + y, 3, 4, hc); r(-8, -12 + y, 3, 3, hc); r(5, -12 + y, 3, 3, hc); }
    if (o.hs == 4 && d == 1) r(-1, -17 + y, 3, 11, hc);
    if (!sd) { r(-3, -6 - lu, 2, 5, sk); r(1, -6 - ru, 2, 5, sk); r(-3, -2 - lu, 3, 2, '#3a2a3a'); r(0, -2 - ru, 3, 2, '#3a2a3a'); }
    else { const s = (lu ? 1 : 0) - (ru ? 1 : 0); r(-2 + s, -6, 2, 5, sk); r(-2 + s + (d == 3 ? 1 : 0), -2, 3, 2, '#3a2a3a'); }
    if (o.os == 0) { r(-4, -14 + y, 8, 5, oc); r(-5, -9 + y, 10, 4, oc); r(-5, -6 + y, 10, 1, c2); }
    else if (o.os == 1) { r(-4, -14 + y, 8, 5, c2); r(-4, -9 + y, 8, 4, oc); r(-3, -14 + y, 1, 5, oc); r(2, -14 + y, 1, 5, oc); }
    else if (o.os == 2) { r(-4, -14 + y, 8, 4, c2); r(-5, -10 + y, 10, 4, oc); r(-5, -7 + y, 10, 1, c2); }
    else if (o.os == 3) { r(-4, -14 + y, 8, 5, '#e8e8ee'); r(-4, -9 + y, 8, 7, '#3d5a8a'); r(-1, -13 + y, 2, 4, '#3d5a8a'); r(-4, -5 + y, 8, 1, '#2f4a72'); }
    else if (o.os == 4) { r(-4, -14 + y, 8, 4, c2); r(-5, -11 + y, 10, 7, oc); r(-5, -4 + y, 10, 1, c2); r(-3, -12 + y, 1, 1, '#fff'); r(2, -11 + y, 1, 1, '#fff'); }
    else { r(-4, -14 + y, 8, 5, oc); r(-5, -9 + y, 10, 7, c2); r(-1, -14 + y, 2, 12, oc); r(-5, -9 + y, 10, 1, '#ffd23f'); }
    if (!sd) { r(-6, -13 + y, 2, 5, sl); r(4, -13 + y, 2, 5, sl); r(-6, -8 + y, 2, 2, sk); r(4, -8 + y, 2, 2, sk); } else { r(-1, -13 + y, 3, 5, sl); r(-1, -8 + y, 3, 2, sk); }
    r(-5, -23 + y, 10, 9, sk);
    if (d == 0) { r(-3, -18 + y, 1, 2, '#2b1b2b'); r(2, -18 + y, 1, 2, '#2b1b2b'); r(-4, -16 + y, 2, 1, '#f58a9a'); r(2, -16 + y, 2, 1, '#f58a9a'); }
    else if (sd) r(d == 3 ? 2 : -3, -18 + y, 1, 2, '#2b1b2b');
    if (d == 1) r(-6, -24 + y, 12, 11, hc);
    else { r(-6, -24 + y, 12, 4, hc); r(-6, -21 + y, 3, 3, hc); r(3, -21 + y, 3, 3, hc); if (sd) r(d == 3 ? -6 : 1, -21 + y, 5, 6, hc); else r(-3, -21 + y, 6, 1, hc); }
    if (o.hs == 2) r(-2, -28 + y, 5, 4, hc);
    if (o.hs == 4 && d != 1) r(d == 3 ? -6 : d == 2 ? 4 : 3, -15 + y, 3, 9, hc);
    if (o.hs == 5 && d != 1) r(d == 3 ? -8 : 5, -14 + y, 3, 10, hc);
    if (o.hs == 6) r(-7, -24 + y, 14, 3, hc);
    if (o.hs == 7 && d == 0) r(-5, -22 + y, 10, 2, hc);
    if (o.acc == 1) { r(3, -26 + y, 4, 3, '#ff5d8f'); r(4, -25 + y, 1, 1, '#fff'); }
    if (o.acc == 2) { r(-8, -25 + y, 16, 2, '#e8c46a'); r(-5, -29 + y, 10, 5, '#e8c46a'); r(-5, -26 + y, 10, 1, '#c0392b'); }
    if (o.acc == 3) { r(-6, -24 + y, 3, 3, '#fff'); r(-5, -23 + y, 1, 1, '#ffd23f'); }
    if (o.acc == 4) { r(-4, -18 + y, 8, 1, '#2b2b3b'); r(-4, -18 + y, 2, 3, '#7ad0ff'); r(2, -18 + y, 2, 3, '#7ad0ff'); r(-1, -18 + y, 2, 1, '#2b2b3b'); }
    if (o.acc == 5) { r(-6, -28 + y, 12, 3, '#ffd23f'); r(-6, -30 + y, 2, 3, '#ffd23f'); r(-1, -31 + y, 2, 5, '#ffd23f'); r(4, -30 + y, 2, 3, '#ffd23f'); r(-1, -27 + y, 2, 2, '#e8607a'); }
    if (o.acc == 7) { r(-5, -15 + y, 10, 3, c2); r(3, -14 + y, 3, 6, c2); r(4, -9 + y, 2, 3, c2); }
  };

  // ferramenta na mão durante o golpe: p = 0..1 (progresso da animação)
  // linha de pixels nítida entre dois pontos (mantém o visual pixel-art)
  function pline(r, x0, y0, x1, y1, col, w) {
    const dx = x1 - x0, dy = y1 - y0, n = Math.max(1, Math.round(Math.max(Math.abs(dx), Math.abs(dy))));
    for (let i = 0; i <= n; i++) r(Math.round(x0 + (dx * i) / n), Math.round(y0 + (dy * i) / n), w || 2, w || 2, col);
  }
  CH.tool = function (x, cx, fy, d, id, p) {
    if (!id || id === 'hand' || id === 'seed') return;
    const r = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(cx + a, fy + b, w, h); };
    const dir = d === 2 ? -1 : 1;                 // espelha quando olha para a esquerda
    const hy = -12, hx = dir * 4;                 // mão (local, fy como base)
    const L = id === 'can' ? 9 : 14;              // comprimento da haste/ferramenta
    const a = -1.4 + p * 2.2;                     // -80° (erguido) -> +45° (golpe)
    const tx = hx + dir * Math.sin(a) * L, ty = hy + Math.cos(a) * L;
    if (id === 'can') {
      // regador: corpo perto da mão, inclina no golpe
      r(hx + dir * 1, hy - 3, 6, 6, '#3d9be0');
      r(hx + dir * 1, hy - 3, 6, 2, '#8fd0ff');
      r(hx + dir * 6, hy - 2 + (p < 0.5 ? -1 : 1), 4, 2, '#8fd0ff');
      if (p > 0.5) { for (let i = 0; i < 3; i++) r(hx + dir * (9 + i), hy + 1 + i * 2, 1, 1, '#bfe6ff'); }
      return;
    }
    // haste de madeira
    pline(r, hx, hy, tx, ty, '#6b4226', 3);
    pline(r, hx, hy, tx - dir, ty - 1, '#a8703c', 1);
    // cabeça da ferramenta
    if (id === 'axe') {
      r(tx - 3 + dir * 1, ty - 4, 5, 7, '#c8ccd4'); r(tx - 2 + dir * 1, ty - 3, 3, 5, '#eef2f8');
      r(tx - 3 + dir * 1, ty - 4, 5, 1, '#ffffff'); r(tx + dir * 1, ty + 3, 2, 3, '#9aa0ac');
    } else if (id === 'pick') {
      r(tx - 5, ty - 2, 11, 3, '#8a8f9a'); r(tx - 5, ty - 2, 11, 1, '#b6bcc6');
      r(tx - 6, ty - 1, 2, 3, '#6d727c'); r(tx + 5, ty - 1, 2, 3, '#6d727c');
    } else if (id === 'hoe') {
      r(tx - dir * 1, ty - 1, 3, 3, '#9ba1ad');
      r(tx + dir * 2, ty - 3, 5, 3, '#b6bcc6'); r(tx + dir * 2, ty - 3, 5, 1, '#dde2ea');
    } else { // vara de pesca / outros
      r(tx - 1, ty - 1, 2, 2, '#5a3a20');
    }
  };

  CH.pet = function (x, cx, fy, d, o) {
    const k = D.PET[o.k].c[o.c % D.PET[o.k].c.length];
    const r = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(cx + a, fy + b, w, h); };
    const b0 = (o.f & 1) ? -1 : 0;
    r(-5, -1, 10, 2, '#0004');
    r(-6, -7 + b0, 3, 3, k);
    r(-4, -9 + b0, 8, 8, k);
    r(-3, -13 + b0, 7, 5, k);
    if (o.k == 0) { r(-3, -15 + b0, 2, 3, k); r(2, -15 + b0, 2, 3, k); }
    if (o.k == 1) { r(-4, -13 + b0, 2, 4, k); r(3, -13 + b0, 2, 4, k); }
    if (o.k == 2) { r(-2, -17 + b0, 2, 5, k); r(1, -17 + b0, 2, 5, k); }
    if (o.k == 3) { r(-3, -15 + b0, 2, 3, k); r(2, -15 + b0, 2, 3, k); }
    r(-2, -4 + b0, 4, 3, '#ffffff55');
    if (d != 1) { const e = d == 2 ? -1 : d == 3 ? 1 : 0; r(-2 + e, -12 + b0, 1, 1, '#2b1b2b'); r(1 + e, -12 + b0, 1, 1, '#2b1b2b'); r(0 + e, -10 + b0, 1, 1, '#f58a9a'); }
  };

  // ---------- animais de fazenda ----------
  CH.animal = function (x, cx, fy, id, col, d) {
    const r = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(cx + a, fy + b, w, h); };
    const A = D.ANIMMAP[id] || D.ANIMMAP.chicken, c = A.c[col % A.c.length], dk = '#2b2b2b';
    const bh = (d === 1 ? -1 : 0);
    if (id === 'chicken' || id === 'duck') {
      r(-5, -1, 11, 2, 'rgba(0,0,0,.20)');
      U.ci(r, 0, -6 + bh, 5, c); r(-5, -9 + bh, 10, 7, c);
      r(-4, -8 + bh, 5, 2, '#ffffff44');
      r(-3, -13 + bh, 6, 6, c);
      if (id === 'chicken') { r(-3, -16 + bh, 6, 2, '#e0432f'); r(-2, -18 + bh, 4, 2, '#e0432f'); r(-1, -19 + bh, 2, 2, '#e0432f'); }
      if (id === 'duck') { r(-4, -13 + bh, 3, 4, '#e8a020'); }
      r(3, -11 + bh, 4, 2, '#f2b134'); r(3, -11 + bh, 4, 1, '#ffd66a');
      r(-1, -11 + bh, 2, 2, dk); r(-1, -11 + bh, 1, 1, '#fff');
      r(-4, -1, 2, 2, '#f2b134'); r(2, -1, 2, 2, '#f2b134');
    } else if (id === 'cow') {
      r(-10, -1, 20, 2, 'rgba(0,0,0,.20)');
      U.ci(r, -2, -7 + bh, 7, c); r(-9, -11 + bh, 18, 11, c);
      r(-6, -9 + bh, 8, 2, '#ffffff33');
      r(6, -13 + bh, 7, 7, c); r(5, -14 + bh, 3, 3, c);
      r(5, -16 + bh, 2, 3, '#e8e0d0'); r(11, -16 + bh, 2, 3, '#e8e0d0');
      r(9, -9 + bh, 4, 3, '#f2b134'); r(9, -9 + bh, 4, 2, '#ffd66a');
      r(7, -12 + bh, 1, 2, dk); r(10, -12 + bh, 1, 2, dk);
      r(-7, -10 + bh, 4, 4, dk); r(0, -9 + bh, 3, 3, dk);
      r(-9, -1, 3, 3, dk); r(-3, -1, 3, 3, dk); r(3, -1, 3, 3, dk);
      r(12, -11 + bh, 1, 5, '#f58a9a');
    } else {
      r(-8, -1, 17, 2, 'rgba(0,0,0,.20)');
      U.ci(r, -1, -8 + bh, 7, '#efe9dd'); r(-8, -12 + bh, 17, 12, '#efe9dd');
      U.ci(r, -4, -12 + bh, 4, '#ffffff'); U.ci(r, 2, -12 + bh, 4, '#ffffff'); U.ci(r, -1, -15 + bh, 4, '#ffffff');
      r(5, -12 + bh, 6, 6, c); r(6, -11 + bh, 4, 3, c);
      r(10, -9 + bh, 2, 2, '#3a3a3a'); r(7, -11 + bh, 1, 2, dk); r(9, -11 + bh, 1, 2, dk);
      r(-8, -1, 2, 3, dk); r(-1, -1, 2, 3, dk); r(5, -1, 2, 3, dk);
    }
  };
})();
