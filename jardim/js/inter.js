/* Nosso Jardim v2 — balão de interação contextual (estilo The Sims) */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const I = (NJ.inter = {});
  const $ = (s) => document.querySelector(s);

  let open_ = false, target = null, refs = null;

  I.isOpen = () => open_;

  I.close = function () {
    if (!open_) return;
    open_ = false; target = null; refs = null;
    const e = $('#ib');
    if (e) { e.classList.remove('on'); e.innerHTML = ''; }
  };

  // abre o balão para um alvo: { x, y, name, acts:[{ e, l, fn }] }
  I.open = function (t) {
    if (!t || !t.acts || !t.acts.length) { I.close(); return; }
    const e = $('#ib'); if (!e) return;
    target = t; open_ = true; refs = { title: null, btns: [], close: null };
    e.innerHTML = '';
    if (t.name) {
      const ti = document.createElement('div');
      ti.className = 'ib-t'; ti.textContent = t.name;
      e.appendChild(ti); refs.title = ti;
    }
    t.acts.forEach((a, i) => {
      const b = document.createElement('button');
      b.className = 'ib-b'; b.dataset.a = 'ia'; b.dataset.k = i;
      b.innerHTML = a.e + '<small>' + a.l + '</small>';
      e.appendChild(b); refs.btns.push(b);
    });
    const c = document.createElement('button');
    c.className = 'ib-c'; c.dataset.a = 'ix'; c.textContent = '✕';
    e.appendChild(c); refs.close = c;
    e.classList.add('on');
    NJ.audio.beep(660, 0.07, 'triangle', 0.02);
    I.tick();
  };

  I.act = function (i) {
    const t = target; if (!t) return;
    const a = t.acts[i]; if (!a) return;
    I.close();
    a.fn();
  };

  function place(node, x, y) {
    if (!node) return;
    node.style.left = Math.max(32, Math.min(innerWidth - 32, x)) + 'px';
    node.style.top = Math.max(30, Math.min(innerHeight - 34, y)) + 'px';
  }

  // posiciona os botões em arco sobre o alvo (e fecha se o jogador se afastar)
  I.tick = function () {
    if (!open_ || !target || !refs || !NJ.w2s) return;
    const S = NJ.S;
    if (Math.hypot(target.x - S.px, target.y - S.py) > 132) { I.close(); return; }
    const p = NJ.w2s(target.x, target.y);
    const n = refs.btns.length;
    const R = 62 + (n > 3 ? (n - 3) * 10 : 0);
    const spread = Math.min(Math.PI, 0.6 * (n - 1) + 0.45);
    if (refs.title) place(refs.title, p.x, p.y - R - 34);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 - spread / 2 + (n === 1 ? spread / 2 : (spread * i) / (n - 1));
      place(refs.btns[i], p.x + Math.cos(a) * R, p.y + Math.sin(a) * R);
    }
    place(refs.close, p.x, p.y);
  };

  (function loop() { I.tick(); requestAnimationFrame(loop); })();
})();
