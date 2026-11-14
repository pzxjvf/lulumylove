/* Nosso Jardim v2 — mochila, loja, venda e artesanato */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const D = NJ.data, U = NJ.util;
  const E = (NJ.econ = {});
  const S = () => NJ.S;

  E.add = (k, n) => { S().inv[k] = (S().inv[k] || 0) + (n || 1); };
  E.have = (k, n) => (S().inv[k] || 0) >= (n || 1);
  E.take = (k, n) => { const s = S(); if ((s.inv[k] || 0) < (n || 1)) return false; s.inv[k] -= (n || 1); if (s.inv[k] <= 0) delete s.inv[k]; return true; };
  E.val = (k) => (D.IT[k] && D.IT[k].s) || 0;
  E.price = (k) => { const b = (D.IT[k] && D.IT[k].b) || 0; return S().ev == 'market' ? Math.ceil(b * 0.8) : b; };
  E.countAll = () => Object.keys(S().inv).reduce((a, k) => a + S().inv[k], 0);

  E.shop = function () {
    const s = S();
    let h = '<h3>🛍️ Loja da Lia</h3><p>💰 ' + s.coins + (s.ev == 'market' ? ' · 🎪 Feira (-20%)' : '') + '</p><b>' + D.SEASON_E[s.season] + ' Sementes da estação</b>';
    D.seedsFor(s.season).forEach((c) => {
      h += '<div class="r"><span>' + c.e + ' Semente de ' + c.n.toLowerCase() + ' <small>(' + c.days + ' dias · vende ' + c.sell + ')</small></span><button data-a="buy" data-k="S_' + c.id + '">' + E.price('S_' + c.id) + ' 💰</button></div>';
    });
    h += '<b>🧰 Suprimentos</b>';
    ['wd', 'hay'].forEach((k) => { h += '<div class="r"><span>' + D.IT[k].e + ' ' + D.IT[k].n + '</span><button data-a="buy" data-k="' + k + '">' + E.price(k) + ' 💰</button></div>'; });
    h += '<b>💰 Vender</b>';
    let n = 0;
    for (const k in s.inv) if (s.inv[k] > 0 && E.val(k)) { n++; h += '<div class="r"><span>' + D.IT[k].e + ' ' + D.IT[k].n + ' ×' + s.inv[k] + '</span><button data-a="sell" data-k="' + k + '">Tudo · ' + E.val(k) * s.inv[k] + ' 💰</button></div>'; }
    if (!n) h += '<p>Nada para vender ainda.</p>';
    NJ.ui.panel(h);
  };

  E.craft = function () {
    let h = '<h3>🧑‍🍳 Artesanato</h3><p>Transforme produtos em itens mais valiosos.</p>';
    D.RECIPES.forEach((rc) => {
      const canDo = Object.keys(rc.need).every((k) => E.have(k, rc.need[k]));
      const need = Object.keys(rc.need).map((k) => D.IT[k].e + ' ' + D.IT[k].n + '×' + rc.need[k]).join(' + ');
      h += '<div class="r"><span>' + rc.e + ' <b>' + rc.n + '</b><br><small>' + need + ' → ' + D.IT[rc.out].e + ' ' + rc.outN + ' (' + D.IT[rc.out].s + ' 💰)</small></span><button data-a="craft" data-k="' + rc.id + '"' + (canDo ? '' : ' disabled') + '>Fazer</button></div>';
    });
    NJ.ui.panel(h);
  };

  NJ.actions = Object.assign(NJ.actions || {}, {
    add: null,
    buy: (b, k) => { const p = E.price(k); const s = S(); if (s.coins < p) { NJ.ui.toast('Faltam moedas 💰'); NJ.audio.beep(200); return; } s.coins -= p; E.add(k, b && b.dataset.n ? +b.dataset.n : 1); NJ.audio.beep(700); E.shop(); },
    sell: (b, k) => { const p = E.val(k); if (!p || !S().inv[k]) return; S().coins += p * S().inv[k]; S().inv[k] = 0; delete S().inv[k]; NJ.audio.beep(900); NJ.prog.check(); E.shop(); },
    craft: (b, k) => {
      const rc = D.RECIPES.find((r) => r.id == k); if (!rc) return;
      if (!Object.keys(rc.need).every((x) => E.have(x, rc.need[x]))) return;
      Object.keys(rc.need).forEach((x) => E.take(x, rc.need[x]));
      E.add(rc.out, rc.outN); NJ.audio.chord([523, 659]); NJ.ui.toast('Fez ' + rc.e + ' ' + rc.n + '!'); E.craft();
    }
  });
})();
