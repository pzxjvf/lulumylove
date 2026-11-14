/* Nosso Jardim v2 — utilidades, RNG, sprites helpers e áudio */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const U = (NJ.util = {});
  U.R = (a, b) => a + Math.random() * (b - a);
  U.I = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.cl = (v, a, b) => Math.max(a, Math.min(b, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.pick = (a) => a[(Math.random() * a.length) | 0];
  U.esc = (s) => String(s).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
  U.dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

  // cria um canvas e pinta via callback com "r(x,y,w,h,cor)"
  U.mk = (w, h, f) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    f(x, (a, b, cw, ch, col) => { x.fillStyle = col; x.fillRect(a, b, cw, ch); });
    return c;
  };
  U.ci = (r, cx, cy, rad, c) => {
    for (let y = -rad; y <= rad; y++) {
      const w = Math.floor(Math.sqrt(rad * rad - y * y));
      r(cx - w, cy + y, 2 * w + 1, 1, c);
    }
  };
  U.mkRad = (c0, c1) => U.mk(128, 128, (x) => {
    const gd = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gd.addColorStop(0, c0); gd.addColorStop(1, c1);
    x.fillStyle = gd; x.fillRect(0, 0, 128, 128);
  });
  // gerador determinístico (para o mapa base)
  U.mkRng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // ---------- áudio ----------
  const A = (NJ.audio = { ctx: null, muted: false, music: null, musicOn: false });
  A.beep = (f, d = 0.12, type = 'square', vol = 0.03) => {
    if (A.muted) return;
    try {
      A.ctx = A.ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (A.ctx.state === 'suspended') A.ctx.resume();
      const o = A.ctx.createOscillator(), v = A.ctx.createGain();
      o.type = type; o.frequency.value = f;
      v.gain.value = vol;
      v.gain.exponentialRampToValueAtTime(0.0001, A.ctx.currentTime + d);
      o.connect(v); v.connect(A.ctx.destination);
      o.start(); o.stop(A.ctx.currentTime + d + 0.02);
    } catch (e) {}
  };
  A.chord = (fs, d = 0.25) => fs.forEach((f, i) => setTimeout(() => A.beep(f, d, 'triangle', 0.02), i * 55));
  A.foot = (gt) => A.beep(gt === 1 ? 150 + Math.random() * 30 : 92 + Math.random() * 22, 0.045, 'triangle', 0.010);
  A.thunder = () => { A.beep(58, 0.5, 'sine', 0.030); setTimeout(() => A.beep(44, 0.7, 'sine', 0.020), 130); };
  A.musicURL = 'music/theme.mp3';
  A.toggleMusic = () => {
    const ui = NJ.ui;
    if (!window.Howl) { ui && ui.toast('Sem Howler — coloque um mp3 em jardim/music/theme.mp3'); return false; }
    try {
      if (A.music && A.music.playing()) { A.music.pause(); A.musicOn = false; return false; }
      if (!A.music) {
        A.music = new Howl({
          src: [A.musicURL], loop: true, volume: 0.35, html5: true,
          onloaderror: () => ui && ui.toast('Não encontrei music/theme.mp3 🎵')
        });
      }
      A.music.play(); A.musicOn = true; return true;
    } catch (e) { return false; }
  };
})();
