/* Nosso Jardim v2 — interface: HUD, painéis, diálogos, barra de ferramentas */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const D = NJ.data, U = NJ.util;
  const UI = (NJ.ui = { pOpen: false, creating: false, dlg: null });
  const $ = (s) => document.querySelector(s);
  const S = () => NJ.S;

  let tt;
  UI.toast = function (t) { const e = $('#ts'); e.textContent = t; e.style.opacity = 1; clearTimeout(tt); tt = setTimeout(() => (e.style.opacity = 0), 2400); };

  // ---------- diálogo ----------
  UI.say = function (n, ls, cb, ch) { UI.dlg = { n, ls: [...ls], cb, ch }; dshow(); };
  function dshow() {
    const d = $('#dg'); if (!UI.dlg) { d.style.display = 'none'; return; }
    d.style.display = 'block';
    d.innerHTML = '<b>' + U.esc(UI.dlg.n) + '</b><p>' + UI.dlg.ls[0] + '</p>' +
      (UI.dlg.ls.length == 1 && UI.dlg.ch ? UI.dlg.ch.map((c, i) => '<button data-i="' + i + '">' + c[0] + '</button>').join('') : '<i>▼</i>');
  }
  UI.dnext = function () {
    if (!UI.dlg) return;
    if (UI.dlg.ls.length > 1) { UI.dlg.ls.shift(); dshow(); return; }
    if (UI.dlg.ch) return;
    const cb = UI.dlg.cb; UI.dlg = null; dshow(); cb && cb();
  };
  $('#dg').addEventListener('click', (e) => {
    if (!UI.dlg) return;
    const b = e.target.closest('button');
    if (b) { const c = UI.dlg.ch[+b.dataset.i]; UI.dlg = null; dshow(); c[1] && c[1](); }
    else UI.dnext();
  });

  // ---------- painéis ----------
  const pn = $('#pn'), pb = pn.firstElementChild;
  UI.panel = function (h, id) { UI.pCur = id || null; pb.innerHTML = h + '<div class="r"><span></span><button data-a="x">Fechar</button></div>'; pn.style.display = 'flex'; UI.pOpen = true; };
  UI.closeP = function () { pn.style.display = 'none'; UI.pOpen = false; UI.creating = false; UI.pCur = null; NJ.state.save(); };

  UI.quests = function () {
    const s = S();
    UI.panel('<h3>📜 Missões</h3>' + D.Q.map((q) => {
      const st = s.q[q.id], ok = q.req == null || (s.q[q.req] || {}).s == 2;
      if (!ok) return '';
      const pr = st ? Math.min(q.n, (s.st[q.k] || 0) - st.b) : 0;
      return '<div class="r"><span>' + (st && st.s == 2 ? '✅' : '📌') + ' <b>' + q.t + '</b><br><small>' + q.npc + ' · ' + (st ? (st.s == 2 ? 'concluída' : pr + '/' + q.n) : 'fale com ' + q.npc) + ' · ' + q.r + ' 💰</small></span></div>';
    }).join('') || '<p>Sem missões ainda — converse com os moradores!</p>');
  };

  // mochila: permite equipar a ferramenta da mão e ver os itens
  UI.inv = function () {
    const s = S();
    let h = '<h3>🎒 Mochila</h3><p style="margin:2px 0 4px"><b>Na mão</b> <small>(toque para equipar)</small></p><div class="grid">';
    D.TOOLS.forEach((t, i) => {
      h += '<button class="mb ' + (s.tool == i ? 'on' : '') + '" data-a="t" data-k="' + i + '">' + t.e + ' ' + t.n + '</button>';
    });
    h += '</div>';
    const items = Object.keys(s.inv).filter((k) => s.inv[k] > 0 && D.IT[k]);
    h += '<h3>📦 Itens</h3>' + (items.map((k) => '<div class="r"><span>' + D.IT[k].e + ' ' + D.IT[k].n + '</span><b>×' + s.inv[k] + '</b></div>').join('') || '<p>Vazia por enquanto.</p>');
    UI.panel(h, 'inv');
  };

  // biblioteca: leitura de livros (dica + experiência, uma vez cada)
  UI.books = function () {
    const s = S();
    let h = '<h3>📖 Biblioteca</h3><p style="margin:2px 0"><small>Cada livro ensina uma dica e rende experiência na primeira leitura.</small></p>';
    D.BOOKS.forEach((b) => {
      const read = !!s.st['bk_' + b.id];
      const sk = b.sk ? D.SKILLS.find((x) => x.id === b.sk) : null;
      h += '<div class="r"><span>' + b.e + ' <b>' + b.n + '</b><br><small>' + (read ? '✔️ lido' : '📕 não lido') + (sk ? ' · +' + b.xp + ' ' + sk.e + ' ' + sk.n : '') + '</small></span><button data-a="readBk" data-k="' + b.id + '">' + (read ? 'Reler' : 'Ler') + '</button></div>';
    });
    h += '<div class="r"><span></span><button data-a="lib">📚 Abrir almanaque</button></div>';
    UI.panel(h, 'books');
  };

  // almanaque: tudo o que já se descobriu no vale
  UI.almanac = function () {
    const s = S(), hv = (k) => s.st[k] || 0;
    const row = (e, name, sub, right) => '<div class="r"><span>' + e + ' ' + name + (sub ? '<br><small>' + sub + '</small>' : '') + '</span>' + (right ? '<b>' + right + '</b>' : '') + '</div>';
    let h = '<h3>📚 Almanaque do vale</h3><p>💰 ' + s.coins + ' · 📅 Dia ' + s.day + ' · Ano ' + s.year + ' · 🏆 ' + Object.keys(s.ach).length + '/' + D.ACH.length + '</p>';

    h += '<h3>🌾 Culturas</h3>';
    D.CROPS.forEach((c) => {
      const n = hv('h_' + c.id), own = n > 0 || (s.inv['S_' + c.id] || 0) > 0;
      h += own
        ? row(c.e, '<b>' + c.n + '</b>', c.seasons.map((x) => D.SEASON_E[x] + D.SEASON_PT[x]).join(' ') + ' · ' + c.days + ' dias · ' + c.sell + '💰', n ? n + '×' : '')
        : row('🌫️', '???', 'cultive na estação certa para descobrir');
    });

    h += '<h3>🐟 Peixes <small>(' + hv('fish') + ' no total)</small></h3>';
    [['p1', ''], ['p2', ''], ['p3', hv('star') ? hv('star') + '×' : ''], ['p4', hv('legend') ? hv('legend') + '×' : '']].forEach(([k, r]) => {
      const it = D.IT[k];
      h += row(it.e, it.n, it.s + '💰' + (k === 'p3' ? ' · 🌟 raro à noite' : k === 'p4' ? ' · 🐋 lendário' : ''), r);
    });

    h += '<h3>🍄 Forragem</h3>';
    [['f', 'spring'], ['dand', 'spring'], ['a', 'summer'], ['chili', 'summer'], ['c', 'fall'], ['hazel', 'fall'], ['wroot', 'winter'], ['ice', 'winter']].forEach(([k, se]) => {
      const it = D.IT[k], n = hv(k);
      h += row(it.e, it.n, D.SEASON_E[se] + D.SEASON_PT[se] + ' · ' + it.s + '💰', n ? n + '×' : '');
    });

    h += '<h3>🐔 Animais</h3>';
    D.ANIM.forEach((a) => { h += row(a.e, a.n, a.cost + '💰 · ' + (a.house === 'coop' ? 'Galinheiro' : 'Celeiro') + ' · produz ' + D.IT[a.prod].e + ' a cada ' + a.every + 'd'); });

    h += '<h3>🍳 Receitas</h3>';
    D.RECIPES.forEach((rc) => { h += row(rc.e, rc.n, Object.keys(rc.need).map((k) => D.IT[k].e + '×' + rc.need[k]).join(' + ') + ' → ' + D.IT[rc.out].s + '💰'); });

    h += '<h3>👥 Moradores</h3>';
    D.NPCS.forEach((n) => { h += row('🧑', n.n, NJ.npc.hearts(s.fr[n.n] || 0)); });

    h += '<h3>🏆 Conquistas</h3>';
    D.ACH.forEach((a) => { h += row(s.ach[a.id] ? a.e : '⬜', a.n, a.d); });

    UI.panel(h, 'almanac');
  };

  // menu de pausa (☰): reúne tudo num lugar só
  UI.menu = function () {
    const btn = (a, k, label) => '<button class="mb" data-a="' + a + '"' + (k != null ? ' data-k="' + k + '"' : '') + '>' + label + '</button>';
    UI.panel('<h3>☰ Menu</h3><div class="grid">' +
      btn('inv', null, '🎒 Mochila') + btn('qs', null, '📜 Missões') +
      btn('prog', null, '📈 Progresso') + btn('lib', null, '📚 Biblioteca') +
      btn('cl', null, '👗 Aparência') + btn('bd', null, '🔨 Construir') +
      btn('help', null, '❓ Como jogar') + btn('music', null, '🎵 Música') +
      btn('snd', null, '🔊 Som') + btn('zin', null, '＋ Zoom') +
      btn('zout', null, '－ Zoom') + btn('save', null, '💾 Salvar') +
      btn('reset', null, '🏠 Reiniciar') +
      '</div>', 'menu');
  };

  UI.help = function () {
    UI.panel('<h3>❓ Como jogar</h3>' +
      '<p><b>Mover:</b> setas/WASD, joystick ou toque no chão. <b>Ação:</b> Espaço/E ou botão A.</p>' +
      '<p><b>Interagir:</b> toque num objeto, animal ou morador — a personagem anda até lá e abre um <b>balão de ações</b> (estilo The Sims). Toque no chão para só andar.</p>' +
      '<p><b>Mochila (🎒):</b> toque numa ferramenta para deixá-la <b>na mão</b>. Ela aparece equipada na personagem.</p>' +
      '<p><b>Menu (☰ ou M):</b> mochila, missões, aparência, música, som, zoom, salvar e reiniciar.</p>' +
      '<p><b>Ferramentas (1-7):</b> Enxada are a terra na fazenda; Regador rega; Sementes plantam; Vara pesca na água (minigame); Mão coleta; Machado corta árvore; Picareta só na mina.</p>' +
      '<p><b>Fazenda:</b> are → plante → regue todo dia. Plantas prontas aparecem com bolinhas — encoste e colha.</p>' +
      '<p><b>Estações:</b> cada cultura cresce em certas estações. A cada 28 dias muda a estação.</p>' +
      '<p><b>Animais:</b> construa 🔨 um Galinheiro/Celeiro e compre bichos. Compre 🌾 Feno; eles produzem de manhã.</p>' +
      '<p><b>Construir (🔨 ou B):</b> escolha a peça, toque no chão para posicionar. Toque numa peça existente para <b>remover</b>. ESC sai do modo.</p>' +
      '<p><b>Mina:</b> suba ao norte, entre na mina, use a Picareta nas pedras. Desça pelas escadas ▼.</p>' +
      '<p><b>Presentes:</b> converse com moradores e presenteie para ganhar corações 💗.</p>' +
      '<p><b>Salvar:</b> automático. <b>Z</b> desfaz construção.</p>');
  };

  UI.seedPicker = function () {
    const s = S(), list = D.seedsFor(s.season).filter((c) => (s.inv['S_' + c.id] || 0) > 0);
    if (!list.length) { UI.toast('Você não tem sementes desta estação 🛍️'); return; }
    let h = '<h3>🌱 Escolher semente</h3>';
    list.forEach((c) => { h += '<div class="r"><span>' + c.e + ' ' + c.n + ' <small>(' + c.days + 'd)</small></span><button data-a="pickSeed" data-k="' + c.id + '"' + (s.seedSel == 'S_' + c.id ? ' class="on"' : '') + '>×' + s.inv['S_' + c.id] + '</button></div>'; });
    UI.panel(h);
  };

  // ---------- criação de personagem ----------
  UI.pv = function () {
    const c = $('#pv'); if (!c) return;
    const x = c.getContext('2d'); x.clearRect(0, 0, 108, 34);
    [0, 2, 1, 3].forEach((d, i) => NJ.char.draw(x, 10 + i * 20, 31, d, 0, S().ch));
    NJ.char.pet(x, 96, 31, 0, { k: S().pet.k, c: S().pet.c, f: 0 });
  };
  UI.creator = function (first) {
    UI.creating = first; pn.style.display = 'flex'; UI.pOpen = true;
    const s = S();
    const val = (f) => (f == 'pk' ? s.pet.k : f == 'pc' ? s.pet.c : s.ch[f]);
    const sw = (f, a) => a.map((c, i) => '<button class="sw ' + (val(f) == i ? 'on' : '') + '" style="background:' + c + '" data-a="o" data-f="' + f + '" data-v="' + i + '"></button>').join('');
    const op = (f, a) => a.map((c, i) => '<button class="op ' + (val(f) == i ? 'on' : '') + '" data-a="o" data-f="' + f + '" data-v="' + i + '">' + c + '</button>').join('');
    const row = (t, h) => '<p style="margin:8px 0 3px"><b>' + t + '</b></p><div style="display:flex;gap:5px;flex-wrap:wrap">' + h + '</div>';
    pb.innerHTML = '<h3 style="margin:0 0 6px">✨ Sua personagem</h3><canvas id="pv" width="108" height="34"></canvas>' +
      '<p style="margin:8px 0 3px"><b>Nome</b></p><input id="nm" maxlength="14" value="' + U.esc(s.name) + '" placeholder="Como ela se chama?">' +
      row('Pele', sw('skin', D.SK)) + row('Cabelo', op('hs', D.HS)) + row('Cor do cabelo', sw('hair', D.HC)) +
      row('Roupa', op('os', D.OS)) + row('Cor da roupa', sw('out', D.OC)) + row('Detalhes', sw('c2', D.OC)) + row('Acessório', op('acc', D.ACC)) +
      '<h3 style="margin:14px 0 6px">🐾 Seu pet</h3><input id="pnm" maxlength="14" value="' + U.esc(s.pet.name) + '" placeholder="Nome do pet">' +
      row('Bichinho', op('pk', D.PET.map((p) => p.n))) + row('Cor do pet', sw('pc', D.PC)) +
      '<button data-a="done" style="width:100%;margin-top:12px;background:#4fb37a;color:#fff">Pronto! 💜</button>';
    UI.pv();
  };

  // ---------- HUD e barra de ferramentas ----------
  UI.hud = function () {
    const s = S(), h = Math.floor(s.min / 60) % 24;
    const loc = NJ.loc === 'cave' ? ' · ⛏️ Mina ' + NJ.mine.depth : '';
    $('#hud').innerHTML = '💰 ' + s.coins + ' · ' + D.SEASON_E[s.season] + ' ' + D.SEASON_PT[s.season] + ' · 📅 Dia ' + s.day + ' · Ano ' + s.year +
      '<br>🕒 ' + String(h).padStart(2, '0') + ':' + String(Math.floor(s.min % 60)).padStart(2, '0') + ' ' + (s.rain ? '🌧️' : s.ev == 'star' ? '✨' : s.ev == 'market' ? '🎪' : s.ev == 'spirit' ? '🌟' : '') + loc;
  };
  UI.hb = function () {
    const s = S(), tb = $('#hb');
    if (NJ.buildMode) {
      tb.innerHTML = D.BL.map((b, i) => '<div class="sl ' + (NJ.bsel == i ? 'on' : '') + '" data-a="bt" data-k="' + i + '" title="' + b.n + '">' + b.e + '<small>' + (b.w ? '🪵' + b.w : '💰' + b.c) + '</small></div>').join('') + '<div class="sl" data-a="undo" title="Desfazer">↩️</div>';
      return;
    }
    if (NJ.loc === 'cave') {
      tb.innerHTML = ['⛏️', '⚒️'].map(() => '').join('') +
        '<div class="sl on" data-a="t" data-k="6">⚒️</div><div class="sl" data-a="mineExit">🚪<small>sair</small></div><div class="sl" data-a="undo">↩️</div>';
      return;
    }
    const seed = NJ.farm.defaultSeed(), sc = seed ? (s.inv[seed] || 0) : 0;
    tb.innerHTML = D.TOOLS.map((t, i) =>
      '<div class="sl ' + (s.tool == i ? 'on' : '') + '" data-a="t" data-k="' + i + '">' + t.e + '<small>' + (i == 2 ? sc : i == 1 ? s.water : i == 6 ? (NJ.mine.depth && NJ.loc == 'cave' ? '' : '') : '') + '</small></div>').join('');
  };
})();
