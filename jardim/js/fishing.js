/* Nosso Jardim v2 — pesca com minigame de barra */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const D = NJ.data, U = NJ.util;
  const F = (NJ.fish = { active: false, hold: false });

  F.start = function (tx, ty) {
    const lvl = NJ.prog.level('fishing');
    F.active = true; F.hold = false; F.phase = 'wait'; F.t = U.R(1.2, 3.2); F.p = 0.5; F.v = 0;
    F.zone = Math.max(0.13, 0.21 - lvl * 0.008);
    F.fishP = 0.5; F.ftx = 0.5; F.ft = 0; F.prog = 0.4; F.bx = tx * 16 + 8; F.by = ty * 16 + 8; F.bob = 0;
    NJ.ui.toast('Aguarde a fisgada… 🎣');
  };

  F.update = function (dt) {
    if (!F.active) return;
    if (F.phase == 'wait') {
      F.t -= dt;
      if (F.t <= 0) { F.phase = 'play'; NJ.audio.beep(420); NJ.ui.toast('Fisgou! Segure Espaço (ou toque) para subir 🐟'); }
      return;
    }
    // física da barra: aceleração com arrasto → velocidade de equilíbrio (~0,75/s, controlável)
    const ACC = 4.2, DRAG = 5.6;
    F.v += (F.hold ? ACC : -ACC) * dt;
    F.v -= F.v * DRAG * dt;
    F.v = U.cl(F.v, -0.8, 0.8);
    F.p = U.cl(F.p + F.v * dt, 0, 1);
    if ((F.p <= 0 && F.v < 0) || (F.p >= 1 && F.v > 0)) F.v = 0;
    // peixe se move
    F.ft -= dt;
    if (F.ft <= 0) { F.ft = U.R(0.7, 1.5); F.ftx = U.R(F.zone, 1 - F.zone); }
    F.fishP += (F.ftx - F.fishP) * Math.min(1, dt * 1.8);
    F.fishP = U.cl(F.fishP, 0, 1);
    // progresso
    if (Math.abs(F.p - F.fishP) < F.zone) F.prog += dt * 0.6;
    else F.prog -= dt * 0.24;
    F.prog = U.cl(F.prog, 0, 1);
    if (F.prog >= 1) F.catch(); else if (F.prog <= 0) F.escape();
  };

  F.catch = function () {
    const s = NJ.S, night = NJ.time.isNight() || s.ev == 'star';
    const lvl = NJ.prog.level('fishing');
    const r = Math.random();
    let k = 'p1';
    if (r < (night ? 0.1 : 0.03) + lvl * 0.006) k = 'p4';
    else if (r < (night ? 0.35 : 0.18) + lvl * 0.01) k = 'p3';
    else if (r < 0.6) k = 'p2';
    NJ.econ.add(k, 1);
    s.st.fish = (s.st.fish || 0) + 1; if (k == 'p3') s.st.star = (s.st.star || 0) + 1; if (k == 'p4') s.st.legend = (s.st.legend || 0) + 1;
    NJ.fx(F.bx, F.by, D.IT[k].e);
    NJ.audio.chord([659, 880, 1046]);
    NJ.ui.toast('Pescou: ' + D.IT[k].e + ' ' + D.IT[k].n + '!');
    NJ.prog.xp('fishing', 12); NJ.prog.check(); NJ.state.save();
    F.active = false;
  };
  F.escape = function () { NJ.audio.beep(180); NJ.ui.toast('Escapou! 🐟'); F.active = false; };

  F.draw = function (g, cx, cy) {
    // linha e boia
    const bx = F.bx - cx, by = F.by - cy + Math.round(Math.sin(performance.now() / 300) * 1);
    g.strokeStyle = '#fff9'; g.beginPath(); g.moveTo(NJ.S.px - cx, NJ.S.py - cy - 20); g.lineTo(bx, by); g.stroke();
    g.fillStyle = '#e8334a'; g.fillRect(bx - 1, by - 1, 3, 3);
    if (F.phase == 'wait') { g.font = 'bold 14px monospace'; g.textAlign = 'center'; g.fillStyle = '#ffd23f'; g.fillText('…', bx, by - 10); }
    if (F.phase != 'play') return;
    // barra do minigame
    const bw = 26, bh = 150, x = Math.round(NJ.vw / 2 - bw / 2), y = NJ.vh - bh - 74;
    g.fillStyle = '#2b1f3aee'; g.fillRect(x - 3, y - 3, bw + 6, bh + 6);
    g.fillStyle = '#5a4a7a'; g.fillRect(x, y, bw, bh);
    // zona
    const zy = y + bh - (F.fishP + F.zone) * bh, zh = F.zone * 2 * bh;
    g.fillStyle = '#7ee08155'; g.fillRect(x, zy, bw, zh);
    // peixe
    g.font = '18px sans-serif'; g.textAlign = 'center'; g.fillText('🐟', x + bw / 2, y + bh - F.fishP * bh + 6);
    // barra
    const byy = y + bh - F.p * bh;
    g.fillStyle = '#ffd23f'; g.fillRect(x + 2, byy - 9, bw - 4, 18); g.fillStyle = '#2b1f3a'; g.fillRect(x + 3, byy - 8, bw - 6, 16);
    // progresso
    g.fillStyle = '#3a2a5a'; g.fillRect(x, y - 14, bw, 8); g.fillStyle = F.prog > 0.5 ? '#4fb37a' : '#e8607a'; g.fillRect(x, y - 14, bw * F.prog, 8);
    g.font = '11px sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('segure para subir', x + bw / 2, y + bh + 14);
  };
})();
