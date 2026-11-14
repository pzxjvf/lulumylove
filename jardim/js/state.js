/* Nosso Jardim v2 — estado do jogo, save/load, passagem de dia e estações */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const D = NJ.data, W = NJ.world, U = NJ.util;
  const ST = (NJ.state = {});

  ST.fresh = () => ({
    v: 2, name: '', px: 152, py: 182, d: 0, coins: 80,
    day: 1, season: 'spring', year: 1, min: 360,
    rain: false, ev: '', water: 12, tool: 0, seedSel: null,
    till: {}, crops: {}, fg: [], inv: { S_str: 3 }, st: {}, q: {}, built: {}, houses: [],
    animals: [], fr: {}, frD: {}, greetD: {}, wish: 0, potD: 0, dstat: null,
    skills: { farming: 0, foraging: 0, fishing: 0, mining: 0 }, ach: {}, seen: {},
    pet: { k: 0, c: 0, name: '', h: 0, x: 132, y: 182, d: 0, f: 0 },
    ch: { skin: 1, hair: 1, hs: 0, out: 0, os: 0, c2: 7, acc: 1 }
  });

  ST.load = function () {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(D.KEY)); } catch (e) {}
    if (!s || !s.ch) return null;
    const f = ST.fresh();
    const merged = Object.assign(f, s);
    merged.skills = Object.assign(f.skills, s.skills || {});
    merged.inv = s.inv || f.inv;
    merged.houses = s.houses || []; merged.animals = s.animals || [];
    merged.seen = s.seen || {};
    return merged;
  };
  ST.save = function () { try { localStorage.setItem(D.KEY, JSON.stringify(NJ.S)); } catch (e) {} };
  ST.reset = function () { try { localStorage.removeItem(D.KEY); } catch (e) {} };
  // foto do início do dia (para o resumo ao dormir)
  ST.snap = function () {
    const S = NJ.S, st = S.st || {};
    S.dstat = { coins: S.coins, plant: st.plant || 0, harv: st.harv || 0, fish: st.fish || 0, forage: st.forage || 0, stone: st.stone || 0, build: st.build || 0 };
  };

  // ---------- novo dia ----------
  ST.newDay = function (auto) {
    const S = NJ.S;
    const st = S.st || {};
    const d0 = S.dstat, ended = S.day;
    const recap = [];
    if (d0) {
      const gain = S.coins - d0.coins;
      if (gain > 0) recap.push('💰 +' + gain + ' moedas'); else if (gain < 0) recap.push('💰 ' + gain + ' moedas');
      const dd = (a, b, label) => { const n = (b || 0) - a; if (n > 0) recap.push(label + ' ' + n); };
      dd(d0.plant, st.plant, '🌱 plantou'); dd(d0.harv, st.harv, '🧺 colheu'); dd(d0.fish, st.fish, '🐟 pescou');
      dd(d0.forage, st.forage, '🍄 achou'); dd(d0.stone, st.stone, '🪨 minerou'); dd(d0.build, st.build, '🔨 construiu');
    }
    // cresce plantações regadas
    for (const k in S.crops) { const c = S.crops[k]; const cd = D.CROPMAP[c.t]; if (cd && S.till[k] == 1 && c.s < cd.days) c.s++; }
    for (const k in S.till) S.till[k] = 0;
    // aspersores regam ao redor
    for (const k in S.built) {
      if (D.BLM[S.built[k]] && D.BLM[S.built[k]].sprinkle) {
        const [x, y] = k.split(',').map(Number);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const kk = (x + dx) + ',' + (y + dy); if (kk in S.till) S.till[kk] = 1; });
      }
    }
    // avança o calendário
    S.day++;
    if (S.day > D.DAYS) {
      S.day = 1;
      const i = D.SEASONS.indexOf(S.season);
      S.season = D.SEASONS[(i + 1) % 4];
      if (S.season === 'spring') S.year++;
      S.seen[S.season] = 1;
      S.st.seen = Object.keys(S.seen).length;
      W.buildGround(S.season);
      W.spawnFG();
      NJ.audio.chord([392, 523, 659]);
    }
    // clima e eventos
    S.rain = Math.random() < (S.season === 'spring' ? 0.28 : S.season === 'winter' ? 0.3 : 0.16);
    if (S.rain) for (const k in S.till) S.till[k] = 1;
    const r = Math.random();
    S.ev = S.rain ? 'rain' : r < 0.1 ? 'star' : r < 0.22 ? 'market' : r < 0.26 ? 'spirit' : '';
    S.min = 360; S.water = S.rain ? 20 : 12; S.wish = 0;
    W.growTree(); W.growTree(); W.spawnFG();
    NJ.farm && NJ.farm.onNewDay && NJ.farm.onNewDay();
    NJ.animals && NJ.animals.onNewDay && NJ.animals.onNewDay();
    NJ.prog && NJ.prog.onNewDay && NJ.prog.onNewDay();
    if (S.pet.h >= 60) { S.pet.h = 0; const s = NJ.util.pick(['S_str', 'S_pot', 'S_tom', 'wd']); NJ.econ.add(s, 1); setTimeout(() => NJ.ui.toast('🐾 ' + (S.pet.name || 'Seu pet') + ' trouxe ' + D.IT[s].e + ' ' + D.IT[s].n + '!'), 500); }
    ST.save(); ST.snap();
    NJ.ui.toast(S.rain ? 'Amanheceu chovendo 🌧️ — as plantas agradecem' : S.ev == 'star' ? '✨ Chuva de estrelas hoje à noite!' : S.ev == 'market' ? '🎪 Dia de feira na loja (-20%)!' : S.ev == 'spirit' ? '🌟 Espíritos do vale abençoaram a fazenda!' : 'Um novo dia começou ☀️');
    if (auto) NJ.ui.say('Narrador', ['Você adormeceu de cansaço… um novo dia começa. ☀️']);
    else setTimeout(() => NJ.ui.say('🌙 Resumo do dia ' + ended, [recap.length ? recap.join(' · ') : 'Um dia tranquilo no vale. 💜', 'Bom dia! Dia ' + S.day + ' começa agora ☀️']), 350);
  };
})();
