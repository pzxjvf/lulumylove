/* Nosso Jardim v2 — base de dados do jogo (itens, plantações, construções, NPCs, missões, skills) */
var NJ = (window.NJ = window.NJ || {});
(function () {
  const D = (NJ.data = {});
  D.T = 16; D.MW = 96; D.MH = 72; D.KEY = 'nj_v2';
  D.DAYS = 28;                        // dias por estação
  D.SEASONS = ['spring', 'summer', 'fall', 'winter'];
  D.SEASON_PT = { spring: 'Primavera', summer: 'Verão', fall: 'Outono', winter: 'Inverno' };
  D.SEASON_E = { spring: '🌸', summer: '☀️', fall: '🍂', winter: '❄️' };

  // paletas por estação: g = tons de grama, tree = copa das árvores, snow = neve
  D.PAL = {
    spring: { g: ['#4c9a45', '#489441', '#5fb257', '#3a7d36'], speck: ['#5fb257', '#3a7d36'], flower: 0.07, tree: ['#2f7a3c', '#3f9a4c', '#6ccf6a'], leaf: '#ff9ec8' },
    summer: { g: ['#3f8a3a', '#357f34', '#57a24e', '#2f6e2c'], speck: ['#57a24e', '#2f6e2c'], flower: 0.05, tree: ['#276a45', '#348a55', '#5cc77f'], leaf: '#ffd23f' },
    fall: { g: ['#8f8140', '#8a7a38', '#a89448', '#6f6229'], speck: ['#a89448', '#6f6229'], flower: 0.03, tree: ['#b5541f', '#d0742a', '#e8a13c'], leaf: '#e8803c' },
    winter: { g: ['#e6edf2', '#dde7ee', '#f2f6f9', '#cfdbe4'], speck: ['#ffffff', '#cfdbe4'], flower: 0, tree: ['#5a6a55', '#6f7f68', '#8a9a80'], leaf: '#dff0ff', snow: 1 }
  };

  // ---------- personagem ----------
  D.SK = ['#ffe0c4', '#f1c27d', '#d9a066', '#a86b3c', '#6b4226'];
  D.HC = ['#2b1b17', '#5a3825', '#a0522d', '#e6b84d', '#e85a8a', '#7b5cd6', '#3db0a8', '#f2f2f2', '#e0432f', '#8fd0ff', '#b5e07a', '#ff9ec8'];
  D.OC = ['#8a4fd6', '#e8607a', '#3d9be0', '#4fb37a', '#f2b134', '#ef7f45', '#2b2f4a', '#f4f0e6', '#f06292', '#64b5f6', '#9575cd', '#4db6ac', '#ffb74d', '#a1887f'];
  D.HS = ['Longo', 'Maria-chiquinha', 'Coque', 'Chanel', 'Trança', 'Rabo de cavalo', 'Cacheado', 'Franjinha'];
  D.OS = ['Vestido', 'Macacão', 'Blusa e saia', 'Jardineira', 'Vestido de festa', 'Kimono'];
  D.ACC = ['Nenhum', 'Laço', 'Chapéu', 'Flor', 'Óculos', 'Coroa', 'Asas', 'Cachecol'];
  D.PC = ['#e8b84d', '#9a6a4a', '#e8e8e8', '#3a3a4a', '#e8804a', '#f2e8e0'];
  D.PET = [
    { n: 'Gato', e: '🐱', c: ['#e8b84d', '#9a6a4a', '#e8e8e8', '#3a3a4a', '#e8804a', '#f2e8e0'] },
    { n: 'Cachorro', e: '🐶', c: ['#c98a4a', '#8a5a3a', '#f0e0c8', '#5a4a3a', '#e8804a', '#f2e8e0'] },
    { n: 'Coelho', e: '🐰', c: ['#f2e8e0', '#d8c0a8', '#ffffff', '#c8b0a0', '#e8d0c0', '#b09080'] },
    { n: 'Raposa', e: '🦊', c: ['#e8804a', '#d06030', '#f0c8a0', '#b05030', '#e8a060', '#f2e8e0'] }
  ];

  // ---------- itens ----------
  const IT = (D.IT = {});
  const it = (id, n, e, o) => (IT[id] = Object.assign({ id, n, e }, o || {}));

  // ferramentas
  D.TOOLS = [
    { id: 'hoe', n: 'Enxada', e: '⛏️' }, { id: 'can', n: 'Regador', e: '🚿' },
    { id: 'seed', n: 'Sementes', e: '🌱' }, { id: 'rod', n: 'Vara de pesca', e: '🎣' },
    { id: 'hand', n: 'Colher', e: '✋' }, { id: 'axe', n: 'Machado', e: '🪓' },
    { id: 'pick', n: 'Picareta', e: '⚒️' }
  ];

  // ---------- plantações (com estações) ----------
  D.CROPS = [
    { id: 'str', n: 'Morango', e: '🍓', color: '#e0364b', seasons: ['spring'], cost: 10, sell: 26, days: 5 },
    { id: 'pot', n: 'Batata', e: '🥔', color: '#c9a06a', seasons: ['spring'], cost: 8, sell: 18, days: 4 },
    { id: 'tul', n: 'Tulipa', e: '🌷', color: '#ff6f91', seasons: ['spring'], cost: 12, sell: 28, days: 5, flower: 1 },
    { id: 'cau', n: 'Couve-flor', e: '🥦', color: '#e8e8d0', seasons: ['spring'], cost: 20, sell: 48, days: 8 },
    { id: 'tom', n: 'Tomate', e: '🍅', color: '#f05a28', seasons: ['summer'], cost: 16, sell: 38, days: 6 },
    { id: 'blu', n: 'Mirtilo', e: '🫐', color: '#4a5ad0', seasons: ['summer'], cost: 18, sell: 42, days: 7 },
    { id: 'cor', n: 'Milho', e: '🌽', color: '#f2c14e', seasons: ['summer', 'fall'], cost: 20, sell: 44, days: 8 },
    { id: 'sun', n: 'Girassol', e: '🌻', color: '#ffd23f', seasons: ['summer', 'fall'], cost: 24, sell: 62, days: 9, flower: 1 },
    { id: 'pum', n: 'Abóbora', e: '🎃', color: '#ef7f45', seasons: ['fall'], cost: 25, sell: 72, days: 9 },
    { id: 'gra', n: 'Uva', e: '🍇', color: '#8a4fd6', seasons: ['fall'], cost: 22, sell: 54, days: 8 },
    { id: 'cab', n: 'Repolho', e: '🥬', color: '#7fc25a', seasons: ['winter'], cost: 15, sell: 34, days: 6 },
    { id: 'cry', n: 'Flor-de-gelo', e: '🪻', color: '#a9d8ff', seasons: ['winter'], cost: 30, sell: 80, days: 8, flower: 1 },
    { id: 'trig', n: 'Trigo', e: '🌾', color: '#e8c46a', seasons: ['spring', 'summer'], cost: 12, sell: 26, days: 5 },
    { id: 'lav', n: 'Lavanda', e: '💜', color: '#b98ae0', seasons: ['spring', 'summer'], cost: 20, sell: 46, days: 6, flower: 1 },
    { id: 'mel', n: 'Melancia', e: '🍉', color: '#4fb37a', seasons: ['summer'], cost: 24, sell: 56, days: 8 },
    { id: 'gro', n: 'Groselha', e: '🍒', color: '#c0392b', seasons: ['winter'], cost: 18, sell: 44, days: 7 }
  ];
  const CROPMAP = (D.CROPMAP = {});
  D.CROPS.forEach((c) => {
    CROPMAP[c.id] = c;
    it(c.id, c.n, c.e, { s: c.sell });
    it('S_' + c.id, 'Semente de ' + c.n.toLowerCase(), '🌱', { b: c.cost, seed: 1, crop: c.id });
  });
  const seasonsOf = (c) => c.seasons;
  D.inSeason = (cropId, season) => CROPMAP[cropId] && CROPMAP[cropId].seasons.indexOf(season) > -1;
  D.seedsFor = (season) => D.CROPS.filter((c) => c.seasons.indexOf(season) > -1);

  // ---------- forragem (muda com a estação) ----------
  it('f', 'Flor silvestre', '🌼', { s: 8 });
  it('c', 'Cogumelo', '🍄', { s: 14 });
  it('a', 'Amora', '🫐', { s: 10 });
  it('dand', 'Dente-de-leão', '🌼', { s: 12 });
  it('leek', 'Alho-poró', '🧅', { s: 16 });
  it('chili', 'Pimenta-doce', '🌶️', { s: 20 });
  it('hazel', 'Avelã', '🌰', { s: 22 });
  it('wroot', 'Raiz de inverno', '🥕', { s: 24 });
  it('ice', 'Fruta-cristal', '🧊', { s: 34 });
  D.FORAGE = {
    spring: [['dand', 0.4], ['f', 0.6]], summer: [['a', 0.5], ['chili', 0.5]],
    fall: [['c', 0.5], ['hazel', 0.5]], winter: [['wroot', 0.5], ['ice', 0.5]]
  };

  // ---------- pesca ----------
  it('p1', 'Peixinho', '🐟', { s: 22 });
  it('p2', 'Carpa', '🐠', { s: 40 });
  it('p3', 'Peixe-estrela', '🌟', { s: 90 });
  it('p4', 'Peixe-lenda', '🐋', { s: 240 });

  // ---------- mineração ----------
  it('stone', 'Pedra', '🪨', { s: 4 });
  it('coal', 'Carvão', '🖤', { s: 10 });
  it('cu', 'Cobre', '🟠', { s: 18 });
  it('ir', 'Ferro', '⚙️', { s: 36 });
  it('go', 'Ouro', '🪙', { s: 65 });
  it('gem', 'Gema', '💎', { s: 130 });

  // ---------- materiais e animais ----------
  it('wd', 'Madeira', '🪵', { b: 8, s: 4 });
  it('hay', 'Feno', '🌾', { b: 6, s: 2 });
  it('egg', 'Ovo', '🥚', { s: 34 });
  it('milk', 'Leite', '🥛', { s: 68 });
  it('wool', 'Lã', '🧶', { s: 160 });
  it('cheese', 'Queijo', '🧀', { s: 130 });
  it('cloth', 'Tecido', '🧵', { s: 300 });
  it('jam', 'Geleia', '🍯', { s: 62 });
  it('bread', 'Pão', '🍞', { s: 74 });
  it('wine', 'Vinho', '🍷', { s: 190 });
  it('cake', 'Bolo', '🎂', { s: 240 });

  // receitas de artesanato (máquina simples)
  D.RECIPES = [
    { id: 'cheese', n: 'Queijo', e: '🧀', need: { milk: 1 }, out: 'cheese', outN: 1, time: 40 },
    { id: 'cloth', n: 'Tecido', e: '🧵', need: { wool: 1 }, out: 'cloth', outN: 1, time: 60 },
    { id: 'bread', n: 'Pão', e: '🍞', need: { trig: 2 }, out: 'bread', outN: 1, time: 30 },
    { id: 'jam', n: 'Geleia', e: '🍯', need: { a: 3 }, out: 'jam', outN: 1, time: 30 },
    { id: 'wine', n: 'Vinho', e: '🍷', need: { gra: 3 }, out: 'wine', outN: 1, time: 60 },
    { id: 'cake', n: 'Bolo', e: '🎂', need: { egg: 2, milk: 1, trig: 1 }, out: 'cake', outN: 1, time: 80 }
  ];

  // ---------- animais ----------
  D.ANIM = [
    { id: 'chicken', n: 'Galinha', e: '🐔', cost: 800, prod: 'egg', every: 1, house: 'coop', c: ['#f2f2f2', '#e8d0a0', '#c98a4a'] },
    { id: 'duck', n: 'Pato', e: '🦆', cost: 1100, prod: 'egg', every: 1, house: 'coop', c: ['#f4f0e6', '#e8e0c8', '#c9b88a'] },
    { id: 'cow', n: 'Vaca', e: '🐄', cost: 1500, prod: 'milk', every: 1, house: 'barn', c: ['#f4f4f4', '#e0c9a8', '#8a6a4a'] },
    { id: 'sheep', n: 'Ovelha', e: '🐑', cost: 2400, prod: 'wool', every: 3, house: 'barn', c: ['#f4f0e6', '#e0d8c8', '#c8b8a0'] }
  ];
  const ANIMMAP = (D.ANIMMAP = {}); D.ANIM.forEach((a) => (ANIMMAP[a.id] = a));

  // ---------- blocos / construções (posicionáveis) ----------
  const BL = (D.BL = []);
  const bl = (id, n, e, o) => { const b = Object.assign({ id, n, e, w: 0, c: 0 }, o); BL.push(b); return b; };
  bl('path', 'Caminho de terra', '🟫', { w: 1, flat: 1 });
  bl('stone', 'Caminho de pedra', '⬜', { w: 1, c: 2, flat: 1 });
  bl('floor', 'Piso de madeira', '🟧', { w: 2, flat: 1 });
  bl('rug', 'Tapete', '🟥', { w: 1, c: 4, flat: 1 });
  bl('wall', 'Parede', '🧱', { w: 3, solid: 1 });
  bl('roof', 'Telhado', '🔺', { w: 3, solid: 1 });
  bl('window', 'Janela', '🪟', { w: 2, c: 3, solid: 1 });
  bl('door', 'Porta', '🚪', { w: 4, c: 2, solid: 1 });
  bl('fence', 'Cerca', '🚧', { w: 1, c: 2, solid: 1 });
  bl('gate', 'Portão', '🚧', { w: 2, c: 4 });
  bl('bench', 'Banco', '🪑', { w: 3, c: 4, solid: 1 });
  bl('lamp', 'Poste de luz', '💡', { w: 2, c: 8, solid: 1, light: 1 });
  bl('pot', 'Vaso de flores', '🪴', { w: 1, c: 3 });
  bl('fountain', 'Fontinha', '⛲', { w: 4, c: 20 });
  bl('scarecrow', 'Espantalho', '🎎', { w: 2, c: 6 });
  bl('sprinkler', 'Aspersor', '💦', { w: 4, c: 40, sprinkle: 1 });
  const BLM = (D.BLM = {}); BL.forEach((b) => (BLM[b.id] = b));

  // ---------- plantas de casa (blueprints multi-tile) ----------
  const BPL = (D.BPL = []);
  const bp = (id, n, e, cells, extra) => { const b = Object.assign({ id, n, e, bp: cells, kind: 'bp', flat: 1 }, extra); BPL.push(b); return b; };
  bp('cabaninha', 'Cabaninha', '🏠', [[0, 0, 'wall'], [1, 0, 'wall'], [2, 0, 'wall'], [0, 1, 'wall'], [1, 1, 'floor'], [2, 1, 'wall'], [0, 2, 'wall'], [1, 2, 'door'], [2, 2, 'wall']]);
  bp('casinha', 'Casinha', '🏡', [[0, 0, 'wall'], [1, 0, 'window'], [2, 0, 'wall'], [3, 0, 'window'], [4, 0, 'wall'], [0, 1, 'wall'], [1, 1, 'floor'], [2, 1, 'floor'], [3, 1, 'floor'], [4, 1, 'wall'], [0, 2, 'wall'], [1, 2, 'floor'], [2, 2, 'floor'], [3, 2, 'floor'], [4, 2, 'wall'], [0, 3, 'wall'], [1, 3, 'wall'], [2, 3, 'door'], [3, 3, 'wall'], [4, 3, 'wall']]);
  bp('coop', 'Galinheiro', '🏚️', [[0, 0, 'wall'], [1, 0, 'wall'], [2, 0, 'wall'], [0, 1, 'wall'], [1, 1, 'floor'], [2, 1, 'wall'], [0, 2, 'wall'], [1, 2, 'door'], [2, 2, 'wall']], { house: 'coop' });
  bp('barn', 'Celeiro', '🏠', [[0, 0, 'wall'], [1, 0, 'roof'], [2, 0, 'roof'], [3, 0, 'wall'], [0, 1, 'wall'], [1, 1, 'floor'], [2, 1, 'floor'], [3, 1, 'wall'], [0, 2, 'window'], [1, 2, 'door'], [2, 2, 'door'], [3, 2, 'window']], { house: 'barn' });
  bp('silo', 'Silo', '🗼', [[0, 0, 'wall'], [1, 0, 'wall'], [0, 1, 'wall'], [1, 1, 'wall']], { house: 'silo' });
  BPL.forEach((b) => {
    let w = 0, c = 0, maxx = 0, maxy = 0;
    b.bp.forEach(([dx, dy, id]) => { const p = BLM[id]; w += p.w; c += p.c; maxx = Math.max(maxx, dx); maxy = Math.max(maxy, dy); });
    b.w = w; b.c = c; b.bw = maxx + 1; b.bh = maxy + 1;
    BL.push(b); BLM[b.id] = b;
  });

  // ---------- moradores ----------
  D.NPCS = [
    { n: 'Lia', x: 560, y: 158, shop: 1, o: { skin: 1, hair: 7, hs: 2, out: 3, os: 0, c2: 7, acc: 0 } },
    { n: 'Teo', x: 632, y: 462, o: { skin: 3, hair: 1, hs: 3, out: 2, os: 1, c2: 7, acc: 2 } },
    { n: 'Mira', x: 152, y: 426, o: { skin: 0, hair: 4, hs: 1, out: 1, os: 2, c2: 7, acc: 3 } },
    { n: 'Nino', x: 552, y: 272, o: { skin: 2, hair: 0, hs: 7, out: 9, os: 3, c2: 5, acc: 4 } },
    { n: 'Rosa', x: 296, y: 272, o: { skin: 0, hair: 7, hs: 2, out: 8, os: 4, c2: 3, acc: 5 } },
    { n: 'Bento', x: 1344, y: 240, miner: 1, o: { skin: 3, hair: 0, hs: 0, out: 6, os: 1, c2: 6, acc: 0 } },
    { n: 'Ivo', x: 936, y: 480, fish: 1, o: { skin: 2, hair: 3, hs: 0, out: 4, os: 0, c2: 2, acc: 7 } },
    { n: 'Vera', x: 280, y: 744, o: { skin: 0, hair: 5, hs: 6, out: 1, os: 2, c2: 4, acc: 3 } }
  ];

  // ---------- missões ----------
  D.Q = [
    { id: 0, npc: 'Teo', t: 'Pescar 3 peixes', k: 'fish', n: 3, r: 60, ask: 'Oi, moça! Os peixes estão dorminhocos… pesca 3 pra mim?', ok: 'Que pescaria! Toma, você mereceu.' },
    { id: 1, npc: 'Mira', t: 'Colher 5 flores/forragens', k: 'forage', n: 5, r: 55, ask: 'Preciso de 5 coisas achadas no mato pro meu buquê!', ok: 'Lindas! Cheiram a primavera.' },
    { id: 2, npc: 'Lia', t: 'Colher 4 plantações', k: 'harv', n: 4, r: 90, ask: 'Use enxada, semente e regador na fazenda. Traga 4 colheitas pra mim!', ok: 'Que mão boa pra plantar!' },
    { id: 3, npc: 'Teo', t: 'Pescar um Peixe-estrela 🌟', k: 'star', n: 1, r: 220, req: 0, ask: 'Dizem que existe um Peixe-estrela no lago, e de noite aparece mais. Topa?', ok: 'Inacreditável! Uma estrela de verdade!' },
    { id: 4, npc: 'Mira', t: 'Colher 4 cogumelos', k: 'c', n: 4, r: 80, req: 1, ask: 'Agora preciso de cogumelos para a sopa. Quatro bastam!', ok: 'Vai ser a melhor sopa do vale!' },
    { id: 5, npc: 'Nino', t: 'Colher 3 amoras', k: 'a', n: 3, r: 50, ask: 'Oi! Eu e meu pet adoramos amoras! Acha 3 pra mim?', ok: 'Uhu! Vamos fazer um bolo de amora!' },
    { id: 6, npc: 'Rosa', t: 'Colher 2 morangos', k: 'h_str', n: 2, r: 80, ask: 'Querida, plante morangos na fazenda e me traga 2 fresquinhos?', ok: 'Que docinhos! Obrigada, meu bem.' },
    { id: 7, npc: 'Nino', t: 'Construir 4 pecinhas', k: 'build', n: 4, r: 85, req: 5, ask: 'Você sabe construir? Toque 🔨 e monte 4 pecinhas por aí!', ok: 'Uau, ficou incrível! Você é uma arquiteta!' },
    { id: 8, npc: 'Teo', t: 'Pescar 5 peixes', k: 'fish', n: 5, r: 130, req: 3, ask: 'Você virou lenda da pesca! Mais 5 pra fechar o dia com estilo?', ok: 'Cinco de uma vez! Impressionante, moça!' },
    { id: 9, npc: 'Mira', t: 'Colher 6 forragens', k: 'forage', n: 6, r: 120, req: 4, ask: 'Minhas flores acabaram de novo… seis mais, por favor?', ok: 'Perfeitas! Você é minha jardineira favorita. 💐' },
    { id: 10, npc: 'Bento', t: 'Construir um Galinheiro', k: 'coop', n: 1, r: 200, ask: 'Pra criar bichos você precisa de um galinheiro. Monte um pra mim!', ok: 'Boa! Agora é só comprar galinhas e alimentar todo dia.' },
    { id: 11, npc: 'Nino', t: 'Coletar 3 ovos', k: 'egg', n: 3, r: 140, req: 10, ask: 'Ovos fresquinhos?! Traz 3 pra gente fazer bolo!', ok: 'Oba! Bolo de ovo pra todo mundo!' },
    { id: 12, npc: 'Bento', t: 'Quebrar 10 pedras na mina', k: 'stone', n: 10, r: 160, ask: 'Já foi na mina ao norte? Quebra 10 pedras e me mostra a força!', ok: 'Tá vendo? Você nasceu pra isso!' },
    { id: 13, npc: 'Rosa', t: 'Trazer 3 ferros ⚙️', k: 'ir', n: 3, r: 240, req: 12, ask: 'Meu fogão tá caído… consegue 3 ferros na mina?', ok: 'Que maravilha! Agora posso assar de novo.' },
    { id: 14, npc: 'Mira', t: 'Trazer uma Gema 💎', k: 'gem', n: 1, r: 260, req: 12, ask: 'Uma gema brilharia lindo no meu colar. Acha uma?', ok: 'É a coisa mais bonita que já vi!' },
    { id: 15, npc: 'Lia', t: 'Colher 10 plantações', k: 'harv', n: 10, r: 300, req: 2, ask: 'Você já é uma fazendeira e tanto! Me prova com 10 colheitas?', ok: 'Inacreditável! Vou fazer um banquete.' }
  ];

  // ---------- conversas ----------
  D.CH = {
    Lia: ['Sementes fresquinhas, só hoje!', 'No verão os tomates ficam doces que só vendo.'],
    Teo: ['Dica: peixes raros aparecem à noite.', 'Shhh… os peixes estão ouvindo.'],
    Mira: ['As flores cheiram melhor depois da chuva.', 'Já viu os vaga-lumes? Chegam quando escurece.'],
    Nino: ['Olha o meu pet! Ele é meu melhor amigo.', 'Vamos brincar de construir casinhas?'],
    Rosa: ['Um chá quentinho resolve quase tudo.', 'Corte madeira com o machado e construa à vontade, querida.'],
    Bento: ['A mina ao norte tem três andares… e mais fundo, coisa boa.', 'Picareta na mão e pedra no chão: é só quebrar!'],
    Ivo: ['O lago grande é fundo, viu? Dizem que tem peixe-lenda lá.', 'Fico na margem norte desde o amanhecer… a luz é linda aqui.'],
    Vera: ['Cultivei cada uma dessas flores do prado. 🌷', 'Nada acalma mais que um campo cheio de cor, querida.']
  };

  // ---------- habilidades ----------
  D.SKILLS = [
    { id: 'farming', n: 'Fazenda', e: '🌾' },
    { id: 'foraging', n: 'Coleta', e: '🍄' },
    { id: 'fishing', n: 'Pesca', e: '🎣' },
    { id: 'mining', n: 'Mineração', e: '⛏️' }
  ];
  D.SKILL_STEP = 60;   // xp por nível
  D.SKILL_MAX = 10;

  // ---------- conquistas ----------
  D.ACH = [
    { id: 'first', n: 'Primeira semente', d: 'Plante sua primeira cultura', e: '🌱', c: (S) => (S.st.plant || 0) >= 1 },
    { id: 'harv10', n: 'Colheita farta', d: 'Colha 10 plantações', e: '🧺', c: (S) => (S.st.harv || 0) >= 10 },
    { id: 'fish5', n: 'Pescadora', d: 'Pesque 5 peixes', e: '🎣', c: (S) => (S.st.fish || 0) >= 5 },
    { id: 'star', n: 'Lenda do lago', d: 'Pesque um Peixe-estrela', e: '🌟', c: (S) => (S.st.star || 0) >= 1 },
    { id: 'mine', n: 'Garimpeira', d: 'Colha 20 pedras', e: '⛏️', c: (S) => (S.st.stone || 0) >= 20 },
    { id: 'gem', n: 'Coração de gema', d: 'Ache uma gema', e: '💎', c: (S) => (S.st.gem || 0) >= 1 },
    { id: 'coop', n: 'Vida no campo', d: 'Tenha 3 animais', e: '🐔', c: (S) => (S.animals || []).length >= 3 },
    { id: 'rich', n: 'Bolsos cheios', d: 'Junte 1000 moedas', e: '💰', c: (S) => S.coins >= 1000 },
    { id: 'build10', n: 'Arquiteta', d: 'Construa 10 pecinhas', e: '🔨', c: (S) => (S.st.build || 0) >= 10 },
    { id: 'friend', n: 'Alma do vale', d: 'Faça 5 amizades', e: '💗', c: (S) => Object.keys(S.fr || {}).filter((k) => S.fr[k] >= 40).length >= 5 },
    { id: 'season', n: 'Quatro estações', d: 'Viva todas as estações', e: '🍂', c: (S) => (S.st.seen || 0) >= 4 },
    { id: 'millionaire', n: 'Fazendeira rica', d: 'Junte 5000 moedas', e: '👑', c: (S) => S.coins >= 5000 }
  ];
})();
