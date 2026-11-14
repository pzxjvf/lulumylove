/* Nosso Jardim v2 — habilidades, níveis e conquistas */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const D = NJ.data;
  const P = (NJ.prog = {});
  const S = () => NJ.S;

  P.level = (sk) => Math.min(D.SKILL_MAX, Math.floor((S().skills[sk] || 0) / D.SKILL_STEP));
  P.into = (sk) => (S().skills[sk] || 0) % D.SKILL_STEP;
  P.xp = function (sk, n) {
    const s = S(), before = P.level(sk);
    s.skills[sk] = (s.skills[sk] || 0) + n;
    const after = P.level(sk);
    if (after > before) { NJ.audio.chord([523, 659, 880]); NJ.ui.toast(D.SKILLS.find((x) => x.id === sk).e + ' ' + D.SKILLS.find((x) => x.id === sk).n + ' nível ' + after + '!'); }
  };

  P.check = function () {
    const s = S();
    D.ACH.forEach((a) => { if (!s.ach[a.id] && a.c(s)) { s.ach[a.id] = 1; NJ.audio.chord([659, 784, 1046]); setTimeout(() => NJ.ui.toast('🏆 Conquista: ' + a.n), 300); } });
  };

  P.onNewDay = function () { P.check(); };

  P.panel = function () {
    const s = S();
    let h = '<h3>📈 Habilidades</h3>';
    D.SKILLS.forEach((sk) => {
      const lv = P.level(sk.id), into = P.into(sk.id);
      h += '<div class="r"><span>' + sk.e + ' <b>' + sk.n + '</b> · nível ' + lv + '/' + D.SKILL_MAX + '<br><small class="bar"><i style="width:' + (into / D.SKILL_STEP * 100) + '%"></i></small></span></div>';
    });
    h += '<h3>🏆 Conquistas (' + Object.keys(s.ach).length + '/' + D.ACH.length + ')</h3>';
    D.ACH.forEach((a) => { h += '<div class="r"><span>' + (s.ach[a.id] ? '✅' : '⬜') + ' ' + a.e + ' <b>' + a.n + '</b><br><small>' + a.d + '</small></span></div>'; });
    NJ.ui.panel(h);
  };

  NJ.actions = Object.assign(NJ.actions || {}, { prog: () => P.panel() });
})();
