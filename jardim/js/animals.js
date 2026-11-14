/* Nosso Jardim v2 — animais de fazenda: comprar, alimentar, coletar */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const D = NJ.data, W = NJ.world, U = NJ.util;
  const A = (NJ.animals = {});
  const S = () => NJ.S;
  const CAP = { coop: 6, barn: 8 };

  A.count = (hi) => S().animals.filter((a) => a.h === hi).length;
  A.cap = (h) => CAP[h.type] || 0;

  A.spawnPos = (h) => ({ x: (h.x + h.w / 2) * 16 + U.I(-30, 30), y: (h.y + h.h + 0.6) * 16 + U.I(-6, 6) });

  A.buy = function (hi, typeId) {
    const s = S(), h = s.houses[hi], t = D.ANIMMAP[typeId];
    if (!h || t.house !== h.type) { NJ.ui.toast('Este animal não mora aqui 🏠'); return; }
    if (A.count(hi) >= A.cap(h)) { NJ.ui.toast('A casa está cheia 🏠'); return; }
    if (s.coins < t.cost) { NJ.ui.toast('Faltam moedas 💰'); NJ.audio.beep(200); return; }
    s.coins -= t.cost;
    const p = A.spawnPos(h);
    s.animals.push({ id: typeId, col: U.I(0, t.c.length - 1), name: '', h: hi, prog: 0, ready: false, fed: true, fa: 20, x: p.x, y: p.y, d: 0, f: 0, tx: p.x, ty: p.y, wt: 0 });
    NJ.audio.chord([523, 659]); NJ.ui.toast(t.e + ' ' + t.n + ' chegou na fazenda!');
    NJ.prog.check(); A.panel(hi);
  };

  A.collect = function (hi) {
    const s = S(); let n = 0;
    s.animals.forEach((a) => { if (a.h === hi && a.ready) { const t = D.ANIMMAP[a.id]; NJ.econ.add(t.prod, 1); a.ready = false; a.prog = 0; n++; NJ.fx(a.x, a.y - 14, D.IT[t.prod].e); } });
    if (n) { NJ.audio.chord([659, 784]); NJ.ui.toast('Coletou ' + n + ' item(ns) 🧺'); } else NJ.ui.toast('Nada pronto ainda — alimente e espere o amanhecer');
    NJ.state.save(); A.panel(hi);
  };

  A.panel = function (hi) {
    const s = S(), h = s.houses[hi]; if (!h) return;
    const list = s.animals.map((a, i) => [a, i]).filter(([a]) => a.h === hi);
    let html = '<h3>' + (h.type === 'coop' ? '🏚️ Galinheiro' : '🏠 Celeiro') + '</h3>';
    html += '<p>🥚 Prontos: ' + list.filter(([a]) => a.ready).length + ' · 🌾 Feno: ' + (s.inv.hay || 0) + ' · ' + A.count(hi) + '/' + A.cap(h) + '</p>';
    const types = D.ANIM.filter((t) => t.house === h.type);
    html += '<b>Comprar animal</b>';
    types.forEach((t) => { html += '<div class="r"><span>' + t.e + ' ' + t.n + ' <small>(produz ' + D.IT[t.prod].e + ' a cada ' + t.every + 'd)</small></span><button data-a="buyA" data-h="' + hi + '" data-k="' + t.id + '">' + t.cost + ' 💰</button></div>'; });
    html += '<b>Moradores</b>';
    if (!list.length) html += '<p>Vazio. Compre um bichinho e compre Feno na loja!</p>';
    list.forEach(([a]) => { const t = D.ANIMMAP[a.id]; html += '<div class="r"><span>' + t.e + ' ' + t.n + (a.ready ? ' <b>pronto!</b>' : a.fed ? ' <small>alimentado</small>' : ' <small>com fome 😢 (sem feno)</small>') + '</span></div>'; });
    html += '<div class="r"><span></span><button data-a="collectA" data-h="' + hi + '">🧺 Coletar tudo</button></div>';
    NJ.ui.panel(html);
  };

  A.onNewDay = function () {
    const s = S();
    // silos produzem feno
    const silos = (s.houses || []).filter((h) => h.type === 'silo').length;
    if (silos) { NJ.econ.add('hay', silos); }
    const hay = s.inv.hay || 0;
    let used = 0;
    s.animals.forEach((a) => {
      const t = D.ANIMMAP[a.id];
      if ((s.inv.hay || 0) > 0) { s.inv.hay--; a.fed = true; a.fa = Math.min(100, a.fa + 3); a.prog++; if (a.prog >= t.every) { a.ready = true; a.prog = 0; } }
      else a.fed = false;
    });
    if (s.animals.length && (s.inv.hay || 0) <= 0 && used === 0) setTimeout(() => NJ.ui.toast('🐾 Seus animais estão com fome — compre Feno na loja!'), 900);
  };

  A.update = function (dt) {
    const s = S();
    s.animals.forEach((a) => {
      const h = s.houses[a.h]; if (!h) return;
      const cx = (h.x + h.w / 2) * 16, cy = (h.y + h.h + 0.6) * 16;
      a.wt -= dt;
      if (a.wt <= 0) { a.wt = U.R(1.5, 4); a.tx = cx + U.R(-36, 36); a.ty = cy + U.R(-14, 16); }
      const dx = a.tx - a.x, dy = a.ty - a.y, dd = Math.hypot(dx, dy);
      if (dd > 2) { const sp = 14; a.x += dx / dd * sp * dt; a.y += dy / dd * sp * dt; a.f += dt * 8; a.d = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0); }
      else a.f = 0;
    });
  };

  NJ.actions = Object.assign(NJ.actions || {}, {
    buyA: (b, k) => A.buy(+b.dataset.h, k),
    collectA: (b) => A.collect(+b.dataset.h)
  });
})();
