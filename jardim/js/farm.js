/* Nosso Jardim v2 — fazenda: arar, regar, plantar, crescer e colher */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const D = NJ.data, W = NJ.world, U = NJ.util;
  const F = (NJ.farm = {});
  const S = () => NJ.S;

  // estágio visual 0..3 a partir dos dias acumulados
  F.stage = (c) => { const cr = D.CROPMAP[c.t]; return Math.min(3, Math.floor(c.s / cr.days * 4)); };
  F.ready = (c) => c.s >= D.CROPMAP[c.t].days;

  F.defaultSeed = function () {
    const s = S();
    const inS = D.seedsFor(s.season).map((c) => 'S_' + c.id).filter((k) => s.inv[k] > 0);
    if (s.seedSel && s.inv[s.seedSel] > 0) return s.seedSel;
    return inS[0] || (D.seedsFor(s.season)[0] && 'S_' + D.seedsFor(s.season)[0].id) || null;
  };

  F.use = function (tool, tx, ty) {
    const s = S(), k = tx + ',' + ty, solid = W.sol[W.ix(tx, ty)], gr = W.gr[W.ix(tx, ty)];
    if (tool == 'hoe') {
      if (s.built[k]) { NJ.ui.toast('Tem algo construído aí 🔨'); return; }
      if (W.inFarm(tx, ty) && gr == 0 && !solid && !(k in s.till)) { s.till[k] = 0; NJ.fx(tx * 16 + 8, ty * 16, '🟫'); NJ.prog.xp('farming', 1); NJ.audio.beep(180); }
      else if (!W.inFarm(tx, ty)) NJ.ui.toast('Dá para arar só dentro da fazenda 🌾');
      else NJ.ui.toast('Não dá para arar aqui');
    } else if (tool == 'can') {
      if (gr == 2 || gr == 3) { s.water = s.rain ? 20 : 12; NJ.fx(tx * 16 + 8, ty * 16, '💧'); NJ.ui.toast('Regador cheio 💧'); NJ.audio.beep(500); }
      else if (k in s.till) { if (s.water <= 0) { NJ.ui.toast('Regador vazio — encha no lago'); return; } s.water--; s.till[k] = 1; NJ.fx(tx * 16 + 8, ty * 16, '💧'); NJ.audio.beep(520); }
    } else if (tool == 'seed') {
      if (!(k in s.till)) { NJ.ui.toast('Are o chão primeiro ⛏️'); return; }
      if (s.crops[k]) { NJ.ui.toast('Já tem algo plantado 🌱'); return; }
      const seed = F.defaultSeed();
      if (!seed || !s.inv[seed]) { NJ.ui.toast('Sem sementes — compre na loja 🛍️'); return; }
      const cr = D.CROPMAP[D.IT[seed].crop];
      if (!D.inSeason(cr.id, s.season)) { NJ.ui.toast(cr.e + ' ' + cr.n + ' não cresce no ' + D.SEASON_PT[s.season].toLowerCase()); return; }
      s.inv[seed]--; if (s.inv[seed] <= 0) delete s.inv[seed];
      s.crops[k] = { t: cr.id, s: 0 };
      s.st.plant = (s.st.plant || 0) + 1;
      NJ.fx(tx * 16 + 8, ty * 16, '🌱'); NJ.audio.beep(400); NJ.prog.xp('farming', 3); NJ.prog.check();
    } else if (tool == 'axe') {
      const e = W.ents.find((o) => o.tree && o.tx == tx && o.ty == ty);
      if (e) {
        W.ents.splice(W.ents.indexOf(e), 1); W.sol[W.ix(tx, ty)] = 0;
        const nw = U.I(2, 4) + (NJ.prog.level('foraging') >= 3 ? 1 : 0);
        NJ.econ.add('wd', nw); NJ.fx(tx * 16 + 8, ty * 16 + 4, '🪵');
        NJ.ui.toast('+' + nw + ' madeira 🪵'); NJ.audio.beep(240); NJ.prog.xp('foraging', 5); NJ.state.save();
      } else NJ.ui.toast('Fique de frente para uma árvore 🪓');
    } else if (tool == 'pick') {
      NJ.ui.toast('A picareta só funciona na mina ⚒️');
    }
  };
})();
