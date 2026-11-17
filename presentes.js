(() => {
  "use strict";

  /* =====================================================================
     COLEÇÃO DE PRESENTES (lista, formulário, localStorage)
     ===================================================================== */
  const STORE = "cantinho_presentes_v1";
  const FIRST_GIFT = {
    id: "buque-lirios-lulu",
    name: "O buquê de lírios brancos",
    category: "flowers",
    note: "Lírios brancos, mosquitinho, folhagens, papel amarelo e uma caixinha dourada de Ferrero Rocher. Um presente cheio de carinho. 💛",
    date: ""
  };
  const CATEGORIES = {
    flowers: { label: "Flores", icon: "💐" },
    pet: { label: "Bichinho", icon: "🐾" },
    jewel: { label: "Joia ou acessório", icon: "💎" },
    date: { label: "Passeio ou encontro", icon: "🎟️" },
    other: { label: "Outro mimo", icon: "🎁" }
  };
  const $ = (selector) => document.querySelector(selector);
  const list = $("#giftList");
  const message = $("#sceneMessage");
  const deleteButton = $("#deleteGift");
  let gifts = loadGifts();
  let selectedId = FIRST_GIFT.id;
  let toastTimer;

  function loadGifts() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE));
      if (Array.isArray(saved)) return [FIRST_GIFT, ...saved.filter((item) => item && item.id !== FIRST_GIFT.id)];
    } catch (error) { /* Rebuild the collection if browser storage is unavailable. */ }
    return [FIRST_GIFT];
  }

  function saveGifts() {
    try {
      localStorage.setItem(STORE, JSON.stringify(gifts.filter((gift) => gift.id !== FIRST_GIFT.id)));
      return true;
    } catch (error) {
      showToast("Não consegui salvar neste navegador. Tente remover algumas lembranças.");
      return false;
    }
  }

  function showToast(text) {
    const el = $("#toast");
    el.textContent = text;
    el.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("on"), 2700);
  }

  function safe(text) {
    return String(text || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function renderList() {
    list.innerHTML = gifts.map((gift) => {
      const category = CATEGORIES[gift.category] || CATEGORIES.other;
      const isModel = gift.id === FIRST_GIFT.id;
      const details = gift.date || (isModel ? "Modelo 3D interativo" : category.label);
      return '<button class="gift-entry' + (gift.id === selectedId ? " selected" : "") +
        '" type="button" data-gift="' + safe(gift.id) + '" aria-pressed="' + (gift.id === selectedId) + '">' +
        '<span class="gift-icon">' + (isModel ? "💐" : category.icon) + "</span>" +
        '<span><span class="gift-name">' + safe(gift.name) + "</span><span class=\"gift-meta\">" + safe(details) + "</span></span>" +
        '<span class="arrow" aria-hidden="true">›</span></button>';
    }).join("");

    list.querySelectorAll("[data-gift]").forEach((button) => {
      button.addEventListener("click", () => selectGift(button.dataset.gift));
    });
    const selected = gifts.find((gift) => gift.id === selectedId);
    deleteButton.classList.toggle("on", !!selected && selected.id !== FIRST_GIFT.id);
  }

  function selectGift(id) {
    const gift = gifts.find((item) => item.id === id);
    if (!gift) return;
    selectedId = id;
    const isModel = id === FIRST_GIFT.id;
    message.classList.toggle("on", !isModel);
    if (!isModel) {
      const category = CATEGORIES[gift.category] || CATEGORIES.other;
      message.innerHTML = "<div><span style=\"font-size:2.6rem\">" + category.icon +
        "</span><strong>" + safe(gift.name) + "</strong><p>" + safe(gift.note || "Uma lembrança guardada com carinho.") +
        "</p><p style=\"margin-top:12px;font-size:.8rem\">O buquê continua aqui em 3D. Cada presente novo pode ganhar seu próprio modelo especial. 💜</p></div>";
    }
    deleteButton.classList.toggle("on", !isModel);
    renderList();
  }

  $("#giftForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = $("#giftName").value.trim();
    if (!name) return;
    const category = $("#giftCategory").value;
    const note = $("#giftNote").value.trim();
    const id = "gift-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
    const date = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" }).format(new Date());
    gifts.push({ id, name, category, note, date });
    if (!saveGifts()) { gifts.pop(); return; }
    form.reset();
    $("#formNote").textContent = "Guardado com carinho. 💌";
    selectedId = id;
    selectGift(id);
    showToast("💝 Presente guardado na coleção!");
    setTimeout(() => { $("#formNote").textContent = ""; }, 3000);
  });

  deleteButton.addEventListener("click", () => {
    const gift = gifts.find((item) => item.id === selectedId);
    if (!gift || gift.id === FIRST_GIFT.id) return;
    if (!window.confirm('Remover "' + gift.name + '" da coleção?')) return;
    gifts = gifts.filter((item) => item.id !== selectedId);
    saveGifts();
    selectedId = FIRST_GIFT.id;
    selectGift(selectedId);
    showToast("Lembrança removida.");
  });

  renderList();

  /* =====================================================================
     MODELO DO BUQUÊ (matemática pura, sem Three.js)
     Tudo é gerado como "sopas" de triângulos (posições + cores + índices),
     baseado nas fotos: papel amarelo listrado, 3 lírios sem antera,
     mosquitinho, samambaia, pitósporo, Ferrero Rocher, envelope e laço.
     ===================================================================== */
  /* MODEL-START */
  const Model = (() => {
    const PI = Math.PI, TAU = Math.PI * 2;
    const V = {
      add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
      sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
      mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
      dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
      cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
      len: (a) => Math.hypot(a[0], a[1], a[2]),
      norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
      lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
    };
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
    const mixC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const shadeC = (c, k) => [clamp(c[0] * k, 0, 1), clamp(c[1] * k, 0, 1), clamp(c[2] * k, 0, 1)];
    function makeRng(seed) {
      let s = (seed >>> 0) || 1;
      return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    }

    const IDENT = { o: [0, 0, 0], x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
    const newSoup = () => ({ pos: [], col: [], idx: [] });

    // Copia uma malha local (verts) para a sopa, transformando pelo "frame".
    function emit(soup, frame, verts, cols, tris) {
      const base = soup.pos.length / 3;
      const single = typeof cols[0] === "number";
      for (let i = 0; i < verts.length; i++) {
        const p = verts[i];
        soup.pos.push(
          frame.o[0] + frame.x[0] * p[0] + frame.y[0] * p[1] + frame.z[0] * p[2],
          frame.o[1] + frame.x[1] * p[0] + frame.y[1] * p[1] + frame.z[1] * p[2],
          frame.o[2] + frame.x[2] * p[0] + frame.y[2] * p[1] + frame.z[2] * p[2]
        );
        const c = single ? cols : cols[i];
        soup.col.push(c[0], c[1], c[2]);
      }
      for (let i = 0; i < tris.length; i++) soup.idx.push(tris[i] + base);
    }
    const toWorld = (f, p) => [
      f.o[0] + f.x[0] * p[0] + f.y[0] * p[1] + f.z[0] * p[2],
      f.o[1] + f.x[1] * p[0] + f.y[1] * p[1] + f.z[1] * p[2],
      f.o[2] + f.x[2] * p[0] + f.y[2] * p[1] + f.z[2] * p[2]
    ];

    // Frame com eixo y na direção dada e z o mais próximo possível de zHint.
    function frameFrom(origin, yDir, zHint) {
      const y = V.norm(yDir);
      let z = V.sub(zHint, V.mul(y, V.dot(zHint, y)));
      if (V.len(z) < 1e-3) {
        z = V.sub([0, 0, 1], V.mul(y, y[2]));
        if (V.len(z) < 1e-3) z = V.sub([1, 0, 0], V.mul(y, y[0]));
      }
      z = V.norm(z);
      return { o: origin, x: V.cross(y, z), y, z };
    }

    function bez(p0, p1, p2, p3, n) {
      const out = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, u = 1 - t;
        const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
        out.push([
          a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
          a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
          a * p0[2] + b * p1[2] + c * p2[2] + d * p3[2]
        ]);
      }
      return out;
    }

    function addTube(soup, path, r0, r1, sides, color) {
      const n = path.length, verts = [], tris = [];
      let T = V.norm(V.sub(path[1], path[0]));
      let N = V.norm(V.cross(T, Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
      for (let i = 0; i < n; i++) {
        T = V.norm(V.sub(path[Math.min(i + 1, n - 1)], path[Math.max(i - 1, 0)]));
        N = V.norm(V.sub(N, V.mul(T, V.dot(N, T))));
        const B = V.cross(T, N);
        const r = r0 + (r1 - r0) * i / (n - 1);
        for (let k = 0; k < sides; k++) {
          const a = k / sides * TAU;
          verts.push(V.add(path[i], V.add(V.mul(N, Math.cos(a) * r), V.mul(B, Math.sin(a) * r))));
        }
      }
      for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) {
        const a = i * sides + k, a2 = i * sides + (k + 1) % sides, b = a + sides, b2 = a2 + sides;
        tris.push(a, b, a2, b, b2, a2);
      }
      emit(soup, IDENT, verts, color, tris);
    }

    // Faixa de fita (superfície fina) ao longo de um caminho.
    function addBand(soup, path, width, sideFn, colors, closed) {
      const n = path.length, verts = [], cs = [], tris = [];
      for (let i = 0; i < n; i++) {
        const a = path[closed ? (i + n - 1) % n : Math.max(i - 1, 0)];
        const b = path[closed ? (i + 1) % n : Math.min(i + 1, n - 1)];
        const T = V.norm(V.sub(b, a));
        const S = V.mul(V.norm(sideFn(T, i)), width / 2);
        verts.push(V.add(path[i], S), V.sub(path[i], S));
        const c = Array.isArray(colors[0]) ? colors[i % colors.length] : colors;
        cs.push(c, shadeC(c, 0.9));
      }
      const segs = closed ? n : n - 1;
      for (let i = 0; i < segs; i++) {
        const a = i * 2, b = ((i + 1) % n) * 2;
        tris.push(a, a + 1, b, a + 1, b + 1, b);
      }
      emit(soup, IDENT, verts, cs, tris);
    }

    // Bolinha (icosaedro) para florzinhas, estigma etc.
    const ICO = (() => {
      const t = (1 + Math.sqrt(5)) / 2;
      const raw = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
      const tris = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
        3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1];
      return { verts: raw.map(V.norm), tris };
    })();
    const addBlob = (soup, c, sx, sy, sz, color) =>
      emit(soup, { o: c, x: [sx, 0, 0], y: [0, sy, 0], z: [0, 0, sz] }, ICO.verts, color, ICO.tris);

    function addBox(soup, f, w, h, d, color) {
      const hx = w / 2, hy = h / 2, hz = d / 2;
      const faces = [
        [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]],
        [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]],
        [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]],
        [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]],
        [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]],
        [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]]
      ];
      faces.forEach((q, i) => emit(soup, f, q, i === 0 || i === 1 ? shadeC(color, 1.04) : shadeC(color, 0.92), [0, 1, 2, 0, 2, 3]));
    }

    function rotAxes(rx, ry, rz) {
      const rot = (v) => {
        let [x, y, z] = v;
        let c = Math.cos(rz), s = Math.sin(rz); [x, y] = [x * c - y * s, x * s + y * c];
        c = Math.cos(rx); s = Math.sin(rx); [y, z] = [y * c - z * s, y * s + z * c];
        c = Math.cos(ry); s = Math.sin(ry); [x, z] = [x * c + z * s, -x * s + z * c];
        return [x, y, z];
      };
      return { x: rot([1, 0, 0]), y: rot([0, 1, 0]), z: rot([0, 0, 1]) };
    }

    /* ---------------- folhas ---------------- */
    function leafData(len, wid, o) {
      const rows = o.rows || 10, cols = 4;
      const peak = o.peak || 0.45, pw = Math.log(0.5) / Math.log(peak);
      const verts = [], cs = [], tris = [];
      for (let r = 0; r <= rows; r++) {
        const t = r / rows;
        const w = wid * Math.pow(Math.max(0, Math.sin(PI * Math.pow(t, pw))), o.sharp || 0.8);
        for (let c = 0; c <= cols; c++) {
          const u = c / cols * 2 - 1, au = Math.abs(u);
          const z = -(o.droop === undefined ? 0.1 : o.droop) * len * t * t + (o.fold === undefined ? 0.18 : o.fold) * w * au +
            0.02 * len * Math.sin(t * 8 + (o.wave || 0)) * au * t;
          verts.push([u * w, t * len, z]);
          let col = mixC(o.base, o.edge || o.base, smooth(0.45, 1, au));
          if (o.vein) col = mixC(col, o.vein, (1 - smooth(0, 0.25, au)) * 0.45);
          cs.push(shadeC(col, (o.tint || 1) * (0.9 + 0.2 * t)));
        }
      }
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const a = r * (cols + 1) + c, b = a + cols + 1;
        tris.push(a, b, a + 1, b, b + 1, a + 1);
      }
      return { verts, cs, tris };
    }
    function addLeaf(soup, o, dir, zHint, len, wid, opt) {
      const d = leafData(len, wid, opt);
      emit(soup, frameFrom(o, dir, zHint), d.verts, d.cs, d.tris);
    }

    const LEAF_DARK = { base: hex("#2b6637"), edge: hex("#3a8044"), vein: hex("#6aa86a"), peak: 0.42, fold: 0.2, droop: 0.12 };
    const LEAF_VAR = { base: hex("#5d9a45"), edge: hex("#eaeec0"), vein: hex("#8cbd62"), peak: 0.6, fold: 0.16, droop: 0.1 };
    const LEAF_FERN = { base: hex("#2f6b36"), edge: hex("#3a7c40"), peak: 0.5, fold: 0.1, droop: 0.14, rows: 5, sharp: 0.7 };

    function addFern(soup, rnd, o, dir, len) {
      const up = [0, 1, 0], d = V.norm(dir), N = 14;
      let side = V.cross(up, d);
      if (V.len(side) < 0.05) side = [1, 0, 0];
      side = V.norm(side);
      const Nf = V.norm(V.cross(d, side));
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const s = i / N;
        pts.push(V.add(V.add(o, V.mul(d, len * s)), [0, -0.42 * len * s * s, 0]));
      }
      addTube(soup, pts, 0.02, 0.006, 4, hex("#3d6e34"));
      for (let i = 2; i <= N; i++) {
        const s = i / N;
        const T = V.norm(V.sub(pts[Math.min(N, i + 1)], pts[i - 1]));
        const S = V.norm(V.cross(Nf, T));
        const ll = len * 0.36 * (1 - s * 0.8) * (0.85 + 0.3 * rnd()) * (0.6 + 0.4 * smooth(0.05, 0.3, s));
        for (let sd = -1; sd <= 1; sd += 2) {
          const ang = 1.0 + 0.15 * rnd();
          const ld = V.norm(V.add(V.mul(T, Math.cos(ang)), V.mul(S, sd * Math.sin(ang))));
          addLeaf(soup, pts[i], ld, Nf, ll, ll * 0.3, Object.assign({ tint: 0.92 + 0.2 * rnd() }, LEAF_FERN));
        }
      }
      addLeaf(soup, pts[N], V.sub(pts[N], pts[N - 1]), Nf, len * 0.12, len * 0.03, LEAF_FERN);
    }

    /* ---------------- mosquitinho (e solidago) ---------------- */
    function addBreath(soup, rnd, cfg) {
      const twig = hex("#5f8c3e");
      const cluster = (p, n, spread) => {
        for (let i = 0; i < n; i++) {
          const off = [(rnd() - 0.5) * 2 * spread, (rnd() - 0.5) * 2 * spread * 0.8, (rnd() - 0.5) * 2 * spread];
          const s = cfg.size * (0.7 + 0.6 * rnd());
          const c = cfg.colors[Math.floor(rnd() * cfg.colors.length)];
          addBlob(soup, V.add(p, off), s, s * 0.85, s, shadeC(c, 0.95 + 0.1 * rnd()));
        }
      };
      for (let b = 0; b < cfg.branches; b++) {
        const tip = V.add(cfg.center, [(rnd() - 0.5) * 2 * cfg.radius, (rnd() - 0.45) * cfg.radius * 0.9, (rnd() - 0.5) * 2 * cfg.radius]);
        const base = V.add(cfg.base, [(rnd() - 0.5) * 0.3, 0, (rnd() - 0.5) * 0.3]);
        const path = bez(base, V.add(V.lerp(base, tip, 0.33), [0, 0.1, 0]), V.add(V.lerp(base, tip, 0.66), [0, 0.05, 0]), tip, 6);
        addTube(soup, path, 0.012, 0.006, 4, twig);
        for (let k = 0; k < cfg.twigs; k++) {
          const o = path[3 + Math.min(3, k)];
          const dir = V.norm([(rnd() - 0.5) * 1.6, 0.3 + rnd() * 0.7, (rnd() - 0.5) * 1.6]);
          const end = V.add(o, V.mul(dir, cfg.twigLen * (0.6 + 0.6 * rnd())));
          addTube(soup, [o, V.lerp(o, end, 0.5), end], 0.006, 0.004, 3, twig);
          cluster(end, cfg.perTwig, cfg.spread);
        }
        cluster(tip, cfg.perTwig + 1, cfg.spread);
      }
    }

    /* ---------------- lírio (sem anteras, como nas fotos) ---------------- */
    function petalLocal(L, W, phi, b0, b1, cup, ripple, inner) {
      const rows = 16, cols = 8, verts = [], cs = [], tris = [];
      const er = [Math.cos(phi), Math.sin(phi)], et = [-Math.sin(phi), Math.cos(phi)];
      const white = inner ? [0.985, 0.975, 0.945] : [0.965, 0.965, 0.94];
      const green = hex("#c3d98d"), root = hex("#a9c566");
      let r = 0, z = 0;
      const ds = L / rows;
      for (let i = 0; i <= rows; i++) {
        const t = i / rows;
        if (i > 0) {
          const tm = (i - 0.5) / rows, bm = b0 + (b1 - b0) * Math.pow(tm, 1.5);
          r += ds * Math.sin(bm); z += ds * Math.cos(bm);
        }
        const beta = b0 + (b1 - b0) * Math.pow(t, 1.5);
        const n = [-Math.cos(beta), Math.sin(beta)];
        const w = W * Math.pow(Math.max(0, Math.sin(PI * Math.pow(t, 0.7))), 0.85);
        for (let j = 0; j <= cols; j++) {
          const u = j / cols * 2 - 1, au = Math.abs(u);
          const off = cup * w * u * u + ripple * L * Math.sin(t * 11 + phi * 3) * au * au * au * t;
          const pr = r + n[0] * off, pz = z + n[1] * off;
          verts.push([er[0] * pr + et[0] * u * w, er[1] * pr + et[1] * u * w, pz]);
          let col = white;
          col = mixC(col, green, (1 - smooth(0, 0.45, au)) * (1 - smooth(0.1, 0.75, t)) * 0.6);
          col = mixC(col, root, (1 - smooth(0, 0.22, t)) * 0.8);
          cs.push(col);
        }
      }
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
        const a = i * (cols + 1) + j, b = a + cols + 1;
        tris.push(a, b, a + 1, b, b + 1, a + 1);
      }
      return { verts, cs, tris };
    }

    function addLily(soup, rnd, O, A, L, roll) {
      const z = V.norm(A);
      const ref = Math.abs(z[1]) < 0.95 ? [0, 1, 0] : [1, 0, 0];
      const x = V.norm(V.cross(ref, z)), y = V.cross(z, x);
      const c = Math.cos(roll), s = Math.sin(roll);
      const f = { o: O, x: V.add(V.mul(x, c), V.mul(y, s)), y: V.add(V.mul(y, c), V.mul(x, -s)), z };
      for (let k = 0; k < 6; k++) {
        const inner = k % 2 === 1;
        const phi = k * PI / 3 + 0.12 * (rnd() - 0.5);
        const p = petalLocal(
          L * (inner ? 0.98 : 1.0) * (0.96 + 0.08 * rnd()), L * (inner ? 0.27 : 0.21), phi,
          (inner ? 0.72 : 0.95) + 0.1 * (rnd() - 0.5), (inner ? 1.95 : 2.25) + 0.2 * (rnd() - 0.5),
          inner ? 0.45 : 0.32, 0.012, inner
        );
        emit(soup, f, p.verts, p.cs, p.tris);
      }
      // pistilo longo e verde com estigma, e filetes pálidos (sem anteras)
      const pistil = bez([0, 0, 0.02 * L], [0.01 * L, 0.04 * L, 0.3 * L], [0, 0.1 * L, 0.6 * L], [0, 0.17 * L, 0.82 * L], 8).map((q) => toWorld(f, q));
      addTube(soup, pistil, 0.038 * L, 0.03 * L, 6, hex("#a9cc6a"));
      const tipP = toWorld(f, [0, 0.18 * L, 0.86 * L]);
      addBlob(soup, tipP, 0.06 * L, 0.06 * L, 0.075 * L, hex("#8db553"));
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * TAU + 0.3, ca = Math.cos(a), sa = Math.sin(a);
        const fil = bez([0, 0, 0.02 * L], [0.05 * L * ca, 0.05 * L * sa, 0.2 * L], [0.1 * L * ca, 0.1 * L * sa, 0.4 * L], [0.14 * L * ca, 0.14 * L * sa, 0.56 * L], 4).map((q) => toWorld(f, q));
        addTube(soup, fil, 0.011 * L, 0.004 * L, 3, hex("#d3e5a6"));
      }
      addBlob(soup, toWorld(f, [0, 0, -0.05 * L]), 0.07 * L, 0.07 * L, 0.07 * L, hex("#6f9a45"));
    }

    /* ---------------- papel de embrulho ---------------- */
    const coneR = (y) => 0.26 + 0.36 * y + 0.04 * y * y;
    function yTop(th) {
      const s = Math.sin(th), back = 0.5 - 0.5 * s, wing = Math.pow(Math.cos(th), 2);
      return 1.9 + 1.25 * Math.pow(back, 1.2) + 0.3 * wing + 0.06 * Math.sin(th * 7 + 1.0) + 0.04 * Math.sin(th * 17 + 0.5);
    }
    function paperAt(th, t) {
      const y = t * yTop(th);
      const pl = 1 + 0.055 * smooth(0.3, 2.2, y) * (Math.sin(7 * th + 0.6) + 0.55 * Math.sin(17 * th + 2.0) + 0.3 * Math.sin(29 * th));
      const r = coneR(y) * pl;
      return [r * Math.cos(th), y, r * Math.sin(th)];
    }
    function buildPaper(soup) {
      const C = 360, R = 44, verts = [], cs = [], tris = [];
      const top = hex("#f6e8a6"), low = hex("#edd77f"), stripe = hex("#c9a248");
      for (let r = 0; r <= R; r++) {
        const t = r / R;
        for (let c = 0; c < C; c++) {
          verts.push(paperAt(c / C * TAU, t));
          const f = (c / 10) % 1, d = Math.min(f, 1 - f) * 10;
          cs.push(mixC(mixC(low, top, smooth(0, 1, t)), stripe, (1 - smooth(0.25, 1.0, d)) * 0.8));
        }
      }
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        const a = r * C + c, a1 = r * C + (c + 1) % C, b = a + C, b1 = a1 + C;
        tris.push(a, b, a1, b, b1, a1);
      }
      emit(soup, IDENT, verts, cs, tris);
    }

    /* ---------------- laço amarelo ---------------- */
    function buildBow(soup) {
      const K = [0, 0.5, coneR(0.5) + 0.04];
      // anel que prende o papel
      const ring = [];
      for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; const r = coneR(0.5) + 0.01; ring.push([r * Math.cos(a), 0.5, r * Math.sin(a)]); }
      addTube(soup, ring, 0.06, 0.06, 6, hex("#f0cf48"));
      const loops = [
        { az: 90, pitch: 18, L: 1.5, hw: 0.28 }, { az: 50, pitch: 46, L: 1.35, hw: 0.26 }, { az: 130, pitch: 46, L: 1.35, hw: 0.26 },
        { az: 14, pitch: 68, L: 1.15, hw: 0.23 }, { az: 166, pitch: 68, L: 1.15, hw: 0.23 }, { az: 72, pitch: 32, L: 1.2, hw: 0.24 },
        { az: 108, pitch: 32, L: 1.2, hw: 0.24 }, { az: 90, pitch: 58, L: 1.0, hw: 0.22 }
      ];
      const shades = [hex("#f3d85a"), hex("#f8e585"), hex("#eecb44"), hex("#f6df6e")];
      loops.forEach((lp, li) => {
        const az = lp.az * PI / 180, pi = lp.pitch * PI / 180;
        const d = V.norm([Math.sin(pi) * Math.cos(az), -Math.cos(pi), Math.sin(pi) * Math.sin(az)]);
        const n = V.norm(V.cross(d, [0, 1, 0]));
        const p = V.cross(n, d);
        const path = [];
        const S = 30;
        for (let i = 0; i < S; i++) {
          const s = i / S * TAU, along = lp.L * (1 - Math.cos(s)) / 2;
          const lat = lp.hw * Math.sin(s) * (0.35 + 0.65 * along / lp.L);
          path.push(V.add(V.add(K, V.mul(d, along)), V.mul(p, lat)));
        }
        addBand(soup, path, 0.36, () => n, shades[li % shades.length], true);
      });
      // duas pontas onduladas
      [-1, 1].forEach((sd, ti) => {
        const path = [];
        for (let i = 0; i <= 18; i++) {
          const s = i / 18;
          path.push([K[0] + sd * 0.35 * s + 0.12 * Math.sin(s * 11) * s, K[1] - 1.7 * s, K[2] + 0.3 * s + 0.1 * Math.cos(s * 11) * s]);
        }
        addBand(soup, path, 0.24, (T) => V.cross(T, [0, 0, 1]), ti ? hex("#f4dc66") : hex("#efcf4d"), false);
      });
      addBlob(soup, K, 0.17, 0.15, 0.15, hex("#e2bb33"));
    }

    function addShell(soup, y0, y1, r0, r1, color, seg) {
      const verts = [], tris = [];
      for (let r = 0; r <= 1; r++) for (let c = 0; c < seg; c++) {
        const a = c / seg * TAU, y = r ? y1 : y0, rad = r ? r1 : r0;
        verts.push([rad * Math.cos(a), y, rad * Math.sin(a)]);
      }
      for (let c = 0; c < seg; c++) { const a = c, a1 = (c + 1) % seg; tris.push(a, a + seg, a1, a + seg, a1 + seg, a1); }
      emit(soup, IDENT, verts, color, tris);
    }

    /* ---------------- montagem ---------------- */
    function build() {
      const rnd = makeRng(93217);
      const organic = newSoup(), ribbon = newSoup(), gold = newSoup(), paper = newSoup();
      const blooms = [];
      const props = {};

      buildPaper(paper);
      buildBow(ribbon);

      // miolo de folhas escuras: três anéis cobrem toda a boca do papel
      for (let ring = 0; ring < 3; ring++) {
        const n = 8 + ring * 2;
        for (let i = 0; i < n; i++) {
          const az = i / n * TAU + ring * 0.4 + rnd() * 0.25;
          const el = 0.55 + 0.35 * rnd() + ring * 0.1;
          const dir = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)];
          const o = [Math.cos(az) * 0.15, 2.3 + ring * 0.3, Math.sin(az) * 0.15];
          addLeaf(organic, o, dir, [0, 1, 0], 1.25 + 0.35 * rnd() + ring * 0.1, 0.46, Object.assign({ tint: 0.9 + 0.15 * rnd(), wave: i }, LEAF_DARK));
        }
      }

      // samambaias (folhas pinadas) caindo por cima da borda
      [
        { o: [-0.6, 3.0, 0.3], d: [-0.7, 0.35, 0.75], l: 1.9 },
        { o: [0.0, 2.9, 0.45], d: [0.1, 0.25, 1.0], l: 1.5 },
        { o: [0.55, 3.0, 0.25], d: [0.9, 0.35, 0.55], l: 1.8 },
        { o: [-0.35, 3.1, -0.4], d: [-0.6, 0.85, -0.2], l: 1.5 },
        { o: [0.5, 3.1, -0.5], d: [0.65, 0.8, -0.3], l: 1.4 },
        { o: [-0.9, 3.0, 0.0], d: [-1.0, 0.4, 0.1], l: 1.5 },
        { o: [0.3, 3.0, 0.6], d: [0.35, 0.25, 1.0], l: 1.3 },
        { o: [-0.3, 3.0, 0.55], d: [-0.4, 0.25, 1.0], l: 1.35 },
        { o: [1.0, 3.0, -0.2], d: [1.0, 0.4, -0.2], l: 1.4 },
        { o: [0.0, 2.8, 0.7], d: [0.0, 0.0, 1.0], l: 1.6 },
        { o: [-0.7, 2.8, 0.7], d: [-0.6, 0.0, 1.0], l: 1.5 },
        { o: [0.7, 2.8, 0.7], d: [0.7, 0.0, 1.0], l: 1.5 }
      ].forEach((fr) => addFern(organic, rnd, fr.o, fr.d, fr.l));

      // folhas largas e escuras na frente e nos lados
      [
        { o: [-0.2, 3.0, 0.5], d: [-0.35, 0.2, 0.9], l: 1.25, w: 0.5 },
        { o: [1.0, 3.1, 0.2], d: [1.0, 0.15, 0.3], l: 1.25, w: 0.46 },
        { o: [-1.0, 3.1, -0.1], d: [-1.0, 0.3, -0.1], l: 1.2, w: 0.46 },
        { o: [0.2, 3.05, -0.6], d: [0.2, 0.5, -1.0], l: 1.2, w: 0.46 },
        { o: [-0.5, 2.95, 0.6], d: [-0.9, 0.1, 0.6], l: 1.15, w: 0.42 },
        { o: [0.5, 2.95, 0.7], d: [0.5, 0.1, 1.0], l: 1.15, w: 0.42 }
      ].forEach((lf) => addLeaf(organic, lf.o, lf.d, [0, 1, 0], lf.l, lf.w, Object.assign({ tint: 0.95 + 0.1 * rnd() }, LEAF_DARK)));

      // rosetas de pitósporo variegado (verde com borda creme)
      [[0.95, 3.1, 0.45], [0.3, 3.05, 0.85]].forEach((c0, ri) => {
        for (let i = 0; i < 9; i++) {
          const az = i / 9 * TAU + rnd() * 0.3, el = 0.25 + 0.4 * rnd();
          const dir = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)];
          addLeaf(organic, c0, dir, [0, 1, 0], (ri ? 0.85 : 1.1) + 0.2 * rnd(), ri ? 0.38 : 0.44, Object.assign({ tint: 0.95 + 0.1 * rnd(), wave: i }, LEAF_VAR));
        }
      });

      // lírios (grandes, como nas fotos)
      const lilies = [
        { o: [-0.8, 3.1, 0.6], a: [-0.35, 0.45, 0.82], l: 1.7, roll: 0.4 },
        { o: [0.2, 3.55, -0.2], a: [0.15, 0.7, 0.65], l: 1.4, roll: 1.1 },
        { o: [1.0, 3.2, 0.35], a: [0.5, 0.5, 0.7], l: 1.3, roll: 2.0 }
      ];
      lilies.forEach((lp) => {
        const soup = newSoup();
        addLily(soup, rnd, lp.o, lp.a, lp.l, lp.roll);
        blooms.push({ pivot: lp.o, soup });
        const A = V.norm(lp.a);
        addTube(organic, bez(lp.o, V.sub(lp.o, V.mul(A, 0.5)), [lp.o[0] * 0.3, 2.9, lp.o[2] * 0.3], [lp.o[0] * 0.15, 2.3, lp.o[2] * 0.15], 10), 0.05, 0.06, 6, hex("#5b8a3d"));
      });

      // mosquitinho (nuvens brancas) e um pouco de solidago amarelo
      const whites = [hex("#fffdf6"), hex("#fbf8ee"), hex("#f3efdf")];
      [
        { c: [-1.8, 4.3, 0.0], r: 0.55 }, { c: [-1.6, 3.0, 0.8], r: 0.45 }, { c: [0.1, 3.0, 1.15], r: 0.45 },
        { c: [0.3, 4.9, -0.4], r: 0.55 }, { c: [1.4, 3.9, 0.0], r: 0.45 }, { c: [1.5, 3.1, 0.6], r: 0.35 }
      ].forEach((cl) => addBreath(organic, rnd, {
        base: [cl.c[0] * 0.2, 2.9, cl.c[2] * 0.2], center: cl.c, radius: cl.r, branches: 10, twigs: 3, twigLen: 0.3, perTwig: 4, spread: 0.09, size: 0.048, colors: whites
      }));
      [{ c: [-1.2, 4.1, 0.25], r: 0.3 }, { c: [1.1, 4.2, 0.3], r: 0.3 }].forEach((cl) => addBreath(organic, rnd, {
        base: [cl.c[0] * 0.2, 2.9, cl.c[2] * 0.2], center: cl.c, radius: cl.r, branches: 4, twigs: 2, twigLen: 0.2, perTwig: 3, spread: 0.06, size: 0.034, colors: [hex("#f1c232"), hex("#e8b624")]
      }));

      // caixinha de Ferrero Rocher (a frente/trás ganham textura no navegador)
      const fAx = rotAxes(-0.08, -0.18, 0.1);
      const fc = [0.72, 4.25, -0.1], fw = 0.62, fh = 1.12, fd = 0.26;
      addBox(gold, { o: fc, x: fAx.x, y: fAx.y, z: fAx.z }, fw, fh, fd, hex("#cfa34d"));
      props.ferrero = { o: fc, x: fAx.x, y: fAx.y, z: fAx.z, w: fw, h: fh, d: fd };

      // envelope branco com aba e lacre
      const eAx = rotAxes(-0.15, -0.4, -0.2), eo = [1.15, 3.95, -0.7];
      const ef = { o: eo, x: eAx.x, y: eAx.y, z: eAx.z };
      emit(organic, ef, [[-0.47, -0.35, 0], [0.47, -0.35, 0], [0.47, 0.35, 0], [-0.47, 0.35, 0]], hex("#fbfaf5"), [0, 1, 2, 0, 2, 3]);
      emit(organic, ef, [[-0.47, 0.35, 0.006], [0.47, 0.35, 0.006], [0, -0.05, 0.006]], hex("#efeee7"), [0, 1, 2]);
      addBlob(organic, toWorld(ef, [0, -0.04, 0.012]), 0.05, 0.05, 0.012, hex("#cfcfc8"));

      // etiqueta redonda no papel (a textura é desenhada no navegador)
      const th = PI / 2, t0 = 0.95 / yTop(th);
      const sp = paperAt(th, t0);
      const du = V.sub(paperAt(th + 0.01, t0), paperAt(th - 0.01, t0));
      const dv = V.sub(paperAt(th, t0 + 0.01), paperAt(th, t0 - 0.01));
      let sn = V.norm(V.cross(dv, du));
      if (V.dot(sn, [sp[0], 0, sp[2]]) < 0) sn = V.mul(sn, -1);
      props.sticker = { o: V.add(sp, V.mul(sn, 0.05)), up: V.norm(dv), n: sn, w: 0.4, h: 0.24 };

      const parts = [
        { name: "papel", material: "paper", soup: paper },
        { name: "folhagem", material: "organic", soup: organic },
        { name: "laco", material: "ribbon", soup: ribbon },
        { name: "ferrero", material: "gold", soup: gold }
      ];
      blooms.forEach((b, i) => parts.push({ name: "lirio" + i, material: "petal", soup: b.soup, pivot: b.pivot }));

      let minY = Infinity, maxY = -Infinity, radius = 0;
      parts.forEach((pt) => {
        const p = pt.soup.pos;
        for (let i = 0; i < p.length; i += 3) {
          minY = Math.min(minY, p[i + 1]); maxY = Math.max(maxY, p[i + 1]);
          radius = Math.max(radius, Math.hypot(p[i], p[i + 2]));
        }
      });
      return { parts, props, bounds: { minY, maxY, radius } };
    }

    return { build, paperAt, yTop, coneR };
  })();
  /* MODEL-END */

  /* =====================================================================
     CENA 3D (Three.js)
     ===================================================================== */
  const stage = $("#stage");
  const canvas = $("#bouquetCanvas");
  const smellButton = $("#smellButton");
  const waterButton = $("#waterButton");
  const USE_SHADOWS = true;
  const PITCH = 0.46;
  let scene;
  let renderer;
  let camera;
  let bouquet;
  let fit = null;
  let baseDistance = 14;
  let aimY = 2;
  let blooms = [];
  let wateringCan;
  let waterDrops = [];
  let waterStart = -1;
  let smellStart = -1;
  let lastFrame = performance.now();
  let dragging = false;
  let previousPointer = null;
  let autoRotate = false;
  let lastDrag = 0;
  let zoomScale = 1;
  const pointers = new Map();

  const rand = (() => {
    let seed = 93217;
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  })();

  const toLinear = (c) => Math.pow(c, 2.2);
  const lin = (hexColor) => new THREE.Color(hexColor).convertSRGBToLinear();

  function geometryFrom(soup, pivot) {
    const n = soup.pos.length / 3;
    const pos = new Float32Array(soup.pos.length);
    const col = new Float32Array(soup.col.length);
    const px = pivot ? pivot[0] : 0, py = pivot ? pivot[1] : 0, pz = pivot ? pivot[2] : 0;
    for (let i = 0; i < n; i++) {
      pos[i * 3] = soup.pos[i * 3] - px;
      pos[i * 3 + 1] = soup.pos[i * 3 + 1] - py;
      pos[i * 3 + 2] = soup.pos[i * 3 + 2] - pz;
      col[i * 3] = toLinear(soup.col[i * 3]);
      col[i * 3 + 1] = toLinear(soup.col[i * 3 + 1]);
      col[i * 3 + 2] = toLinear(soup.col[i * 3 + 2]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(soup.idx, 1) : new THREE.Uint16BufferAttribute(soup.idx, 1));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }

  function alignMesh(mesh, o, x, y, z) {
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(x[0], x[1], x[2]), new THREE.Vector3(y[0], y[1], y[2]), new THREE.Vector3(z[0], z[1], z[2]));
    mesh.quaternion.setFromRotationMatrix(m);
    mesh.position.set(o[0], o[1], o[2]);
  }

  function ferreroTexture() {
    const W = 460, H = 830;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#ead08a"); g.addColorStop(0.5, "#c9a04c"); g.addColorStop(1, "#ecd28e");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = "rgba(120,86,28,.35)"; c.lineWidth = 2;
    for (let i = -H; i < W + H; i += 26) {
      c.beginPath(); c.moveTo(i, 0); c.lineTo(i + H, H); c.stroke();
      c.beginPath(); c.moveTo(i + H, 0); c.lineTo(i, H); c.stroke();
    }
    // selos de aviso no topo
    c.fillStyle = "#f7f4ea"; c.fillRect(40, 26, W - 80, 62);
    c.strokeStyle = "#2b2b2b"; c.lineWidth = 3;
    c.strokeRect(46, 32, 175, 50); c.strokeRect(W - 221, 32, 175, 50);
    c.fillStyle = "#2b2b2b"; c.textAlign = "center"; c.font = "bold 13px Arial";
    c.fillText("ALTO EM", 133, 51); c.fillText("AÇÚCAR ADICIONADO", 133, 68);
    c.fillText("ALTO EM", W - 133, 51); c.fillText("GORDURA SATURADA", W - 133, 68);
    // oval central
    c.fillStyle = "#c18f35"; c.beginPath(); c.ellipse(W / 2, 470, 188, 278, 0, 0, TWO_PI()); c.fill();
    c.fillStyle = "#fbf6e6"; c.beginPath(); c.ellipse(W / 2, 470, 172, 262, 0, 0, TWO_PI()); c.fill();
    c.strokeStyle = "#b8872f"; c.lineWidth = 5; c.beginPath(); c.ellipse(W / 2, 470, 160, 250, 0, 0, TWO_PI()); c.stroke();
    // avelãs
    const nut = (x, y) => {
      c.fillStyle = "#b9822f"; c.beginPath(); c.arc(x, y, 21, 0, TWO_PI()); c.fill();
      c.fillStyle = "#e3b45a"; c.beginPath(); c.arc(x - 6, y - 7, 8, 0, TWO_PI()); c.fill();
    };
    nut(W / 2, 300); nut(W / 2 - 22, 338); nut(W / 2 + 22, 338); nut(W / 2 - 44, 376); nut(W / 2, 376); nut(W / 2 + 44, 376);
    c.fillStyle = "#7a5a1c"; c.textAlign = "center";
    c.font = "bold 58px Georgia, serif"; c.fillText("FERRERO", W / 2, 480);
    c.font = "bold 70px Georgia, serif"; c.fillText("ROCHER", W / 2, 552);
    c.fillRect(W / 2 - 90, 578, 180, 4);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    return tex;
  }
  function TWO_PI() { return Math.PI * 2; }

  function stickerTexture() {
    const cv = document.createElement("canvas");
    cv.width = 320; cv.height = 192;
    const c = cv.getContext("2d");
    c.fillStyle = "#fffdf6"; c.beginPath(); c.ellipse(160, 96, 150, 84, 0, 0, TWO_PI()); c.fill();
    c.strokeStyle = "#b7794a"; c.lineWidth = 4; c.beginPath(); c.ellipse(160, 96, 138, 72, 0, 0, TWO_PI()); c.stroke();
    c.fillStyle = "#b3322f";
    [[78, 96, 17], [64, 84, 12], [66, 110, 12], [92, 84, 12], [92, 110, 12]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TWO_PI()); c.fill(); });
    c.strokeStyle = "#7b4a32"; c.lineWidth = 6; c.lineCap = "round";
    c.beginPath(); c.moveTo(122, 80); c.quadraticCurveTo(170, 60, 236, 80); c.stroke();
    c.lineWidth = 4;
    c.beginPath(); c.moveTo(122, 104); c.quadraticCurveTo(170, 92, 224, 106); c.stroke();
    c.beginPath(); c.moveTo(130, 126); c.quadraticCurveTo(170, 120, 214, 128); c.stroke();
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    return tex;
  }

  function lineBetween(parent, a, b, radius, material, segments = 7) {
    const direction = new THREE.Vector3().subVectors(b, a);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius, direction.length(), segments), material);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    parent.add(mesh);
    return mesh;
  }

  function makeWateringCan() {
    const group = new THREE.Group();
    const tin = new THREE.MeshStandardMaterial({ color: lin("#7db5c8"), roughness: 0.4, metalness: 0.24 });
    const dark = new THREE.MeshStandardMaterial({ color: lin("#508eaa"), roughness: 0.48, metalness: 0.18 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.38, 12), tin);
    body.scale.z = 0.8; group.add(body);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 7, 15, Math.PI * 1.55), dark);
    handle.position.set(0, 0.1, -0.14); handle.rotation.z = -0.75; group.add(handle);
    const spoutStart = new THREE.Vector3(0.12, 0.05, 0.09);
    const spoutEnd = new THREE.Vector3(0.34, 0.19, 0.38);
    lineBetween(group, spoutStart, spoutEnd, 0.065, tin, 10);
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.065, 0.065, 12), dark);
    rose.position.copy(spoutEnd); rose.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.45, 0.55, 0.7).normalize());
    group.add(rose);
    group.scale.setScalar(1.7);
    group.rotation.y = Math.PI;
    group.visible = false;
    bouquet.add(group);
    wateringCan = group;

    const waterMaterial = new THREE.MeshStandardMaterial({ color: lin("#9ce6fa"), transparent: true, opacity: 0.9, roughness: 0.2, metalness: 0.06 });
    const dropGeo = new THREE.SphereGeometry(0.05, 7, 6);
    waterDrops = Array.from({ length: 19 }, (_, i) => {
      const drop = new THREE.Mesh(dropGeo, waterMaterial.clone());
      bouquet.add(drop);
      drop.visible = false;
      return { mesh: drop, offset: i / 19 };
    });
  }

  function initScene() {
    if (!window.THREE) {
      message.classList.add("on");
      message.innerHTML = "<div><span style=\"font-size:2.7rem\">🌷</span><strong>O buquê está guardado</strong><p>Não consegui carregar o visualizador 3D. Confira a conexão e atualize a página para tentar de novo.</p></div>";
      return;
    }
    try {
      scene = new THREE.Scene();
      scene.background = null;
      camera = new THREE.PerspectiveCamera(35, 1, 0.1, 120);

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
      renderer.setSize(stage.clientWidth, stage.clientHeight, false);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.NoToneMapping;
      if (USE_SHADOWS) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }

      scene.add(new THREE.HemisphereLight("#ffffff", "#d9cba8", 0.55));
      const key = new THREE.DirectionalLight("#fff3e0", 0.62);
      key.position.set(-4, 9, 7);
      key.target.position.set(0, 2.5, 0);
      scene.add(key, key.target);
      if (USE_SHADOWS) {
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.camera.left = -5; key.shadow.camera.right = 5;
        key.shadow.camera.top = 6; key.shadow.camera.bottom = -4;
        key.shadow.camera.near = 1; key.shadow.camera.far = 30;
        key.shadow.bias = -0.0006;
        key.shadow.normalBias = 0.05;
      }
      const fill = new THREE.DirectionalLight("#e9e0ff", 0.25);
      fill.position.set(6, 4, -5); scene.add(fill);
      const front = new THREE.DirectionalLight("#ffffff", 0.2);
      front.position.set(2, 3, 9); scene.add(front);

      const model = Model.build();
      fit = model.bounds;

      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(3.4, 48),
        new THREE.MeshBasicMaterial({ color: "#cbbabf", transparent: true, opacity: 0.16, depthWrite: false })
      );
      ground.rotation.x = -Math.PI / 2; ground.position.y = fit.minY - 0.05; ground.scale.set(1, 0.46, 1); scene.add(ground);

      bouquet = new THREE.Group();
      scene.add(bouquet);

      const materials = {
        organic: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.58, metalness: 0 }),
        petal: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.42, metalness: 0 }),
        paper: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.FrontSide, roughness: 0.5, metalness: 0 }),
        ribbon: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.36, metalness: 0 }),
        gold: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.2 })
      };
      const paperInside = new THREE.MeshStandardMaterial({ color: lin("#e8b42c"), side: THREE.BackSide, roughness: 0.55, metalness: 0 });

      model.parts.forEach((part) => {
        const geo = geometryFrom(part.soup, part.pivot);
        const mesh = new THREE.Mesh(geo, materials[part.material]);
        mesh.castShadow = USE_SHADOWS;
        mesh.receiveShadow = USE_SHADOWS;
        if (part.pivot) {
          mesh.position.set(part.pivot[0], part.pivot[1], part.pivot[2]);
          blooms.push(mesh);
        }
        bouquet.add(mesh);
        if (part.material === "paper") {
          const inner = new THREE.Mesh(geo, paperInside);
          bouquet.add(inner);
        }
      });

      // textura da caixinha de Ferrero Rocher (frente e verso)
      const fp = model.props.ferrero;
      const fTex = ferreroTexture();
      const fMat = new THREE.MeshStandardMaterial({ map: fTex, roughness: 0.4, metalness: 0.15 });
      const fFront = new THREE.Mesh(new THREE.PlaneGeometry(fp.w * 0.97, fp.h * 0.97), fMat);
      alignMesh(fFront, [fp.o[0] + fp.z[0] * (fp.d / 2 + 0.004), fp.o[1] + fp.z[1] * (fp.d / 2 + 0.004), fp.o[2] + fp.z[2] * (fp.d / 2 + 0.004)], fp.x, fp.y, fp.z);
      bouquet.add(fFront);
      const fBack = new THREE.Mesh(new THREE.PlaneGeometry(fp.w * 0.97, fp.h * 0.97), fMat);
      alignMesh(fBack, [fp.o[0] - fp.z[0] * (fp.d / 2 + 0.004), fp.o[1] - fp.z[1] * (fp.d / 2 + 0.004), fp.o[2] - fp.z[2] * (fp.d / 2 + 0.004)],
        [-fp.x[0], -fp.x[1], -fp.x[2]], fp.y, [-fp.z[0], -fp.z[1], -fp.z[2]]);
      bouquet.add(fBack);

      // etiqueta redonda do papel
      const sp = model.props.sticker;
      const sticker = new THREE.Mesh(
        new THREE.PlaneGeometry(sp.w, sp.h),
        new THREE.MeshStandardMaterial({ map: stickerTexture(), transparent: true, roughness: 0.6, metalness: 0 })
      );
      const sx = [sp.up[1] * sp.n[2] - sp.up[2] * sp.n[1], sp.up[2] * sp.n[0] - sp.up[0] * sp.n[2], sp.up[0] * sp.n[1] - sp.up[1] * sp.n[0]];
      alignMesh(sticker, sp.o, sx, sp.up, sp.n);
      bouquet.add(sticker);

      makeWateringCan();
      resize();
      animate();
    } catch (error) {
      console.error("Não foi possível montar o buquê 3D:", error);
      message.classList.add("on");
      message.innerHTML = "<div><span style=\"font-size:2.7rem\">🌷</span><strong>O buquê está guardado</strong><p>Este navegador não conseguiu abrir o modelo 3D. Tente atualizar a página ou abrir em outro navegador.</p></div>";
    }
  }

  // Enquadra o buquê inteiro (altura e largura) para o tamanho atual da tela.
  function fitCamera() {
    if (!camera || !fit) return;
    const halfH = (fit.maxY - fit.minY) / 2, R = fit.radius;
    const tanV = Math.tan(camera.fov * Math.PI / 360);
    const vExt = (halfH * Math.cos(PITCH) + R * Math.sin(PITCH)) * 1.06;
    const hExt = R * 1.06;
    const dV = vExt / tanV;
    const dH = hExt / (tanV * camera.aspect);
    baseDistance = Math.max(dV * 0.9, dH) + R * 0.3;
    aimY = (fit.minY + fit.maxY) / 2;
    updateCamera();
  }

  function updateCamera() {
    if (!camera || !fit) return;
    const dir = new THREE.Vector3(0.14, Math.sin(PITCH), Math.cos(PITCH)).normalize();
    camera.position.set(0, aimY, 0).addScaledVector(dir, baseDistance * zoomScale);
    camera.lookAt(0, aimY, 0);
  }

  function resize() {
    if (!renderer || !camera) return;
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fitCamera();
  }
  window.addEventListener("resize", resize);

  function spawnScent() {
    const symbols = ["🌸", "💜", "✨", "🌼", "♡"];
    for (let i = 0; i < 10; i++) {
      const el = document.createElement("span");
      el.className = "scent";
      el.textContent = symbols[i % symbols.length];
      el.style.left = (22 + rand() * 56) + "%";
      el.style.top = (37 + rand() * 30) + "%";
      el.style.setProperty("--drift", ((rand() - 0.5) * 70) + "px");
      el.style.animationDelay = (rand() * 0.6) + "s";
      stage.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }
    showToast("🌸 Hmmm... cheirinho de lírio fresquinho!");
  }

  smellButton.addEventListener("click", () => {
    if (selectedId !== FIRST_GIFT.id) {
      selectGift(FIRST_GIFT.id);
      showToast("O buquê está aqui. Agora pode sentir o perfume dele! 🌸");
    }
    smellStart = performance.now();
    spawnScent();
  });

  waterButton.addEventListener("click", () => {
    if (selectedId !== FIRST_GIFT.id) {
      selectGift(FIRST_GIFT.id);
      showToast("Vamos cuidar do buquê de lírios. 💐");
    }
    if (waterStart >= 0) return;
    waterStart = performance.now();
    waterButton.disabled = true;
    waterButton.textContent = "💧 Regando...";
    showToast("💧 Um pouquinho de água para manter as flores lindas!");
  });

  function removePointers() {
    if (pointers.size < 2) previousPointer = null;
  }
  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    try { canvas.setPointerCapture(event.pointerId); } catch (error) { /* Pointer capture may be unavailable in older browsers. */ }
    if (pointers.size === 1) {
      dragging = true;
      previousPointer = { x: event.clientX, y: event.clientY };
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    const old = pointers.get(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) {
      const pts = [...pointers.values()];
      const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (previousPointer && previousPointer.distance) {
        zoomScale = THREE.MathUtils.clamp(zoomScale + (previousPointer.distance - distance) * 0.004, 0.45, 1.5);
        updateCamera();
      }
      previousPointer = { distance };
      return;
    }
    if (!dragging || !bouquet) return;
    const dx = event.clientX - old.x, dy = event.clientY - old.y;
    bouquet.rotation.y += dx * 0.009;
    bouquet.rotation.x = THREE.MathUtils.clamp(bouquet.rotation.x + dy * 0.004, -0.36, 0.34);
    lastDrag = performance.now();
    autoRotate = false;
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => {
    canvas.addEventListener(name, (event) => {
      pointers.delete(event.pointerId);
      dragging = pointers.size === 1;
      removePointers();
      if (!pointers.size) setTimeout(() => { autoRotate = true; }, 2300);
    });
  });
  stage.addEventListener("wheel", (event) => {
    if (!renderer) return;
    event.preventDefault();
    zoomScale = THREE.MathUtils.clamp(zoomScale * (1 + Math.sign(event.deltaY) * 0.07), 0.45, 1.5);
    updateCamera();
  }, { passive: false });

  function updateWater(time) {
    if (waterStart < 0 || !wateringCan || !bouquet || !fit) return;
    const elapsed = (time - waterStart) / 1000;
    const duration = 5.2;
    const progress = Math.min(1, elapsed / duration);
    const swing = Math.sin(progress * Math.PI);
    const tilt = -0.7 * swing;
    const topY = fit.maxY;
    const cx = 2.7 - swing * 0.35, cy = topY + 1.0 - swing * 0.35, cz = 1.7;
    wateringCan.visible = progress < 0.96;
    wateringCan.position.set(cx, cy, cz);
    wateringCan.rotation.z = tilt;
    // ponta do bico (a lata está virada para o buquê)
    const s = 1.7, lx = 0.34 * s, ly = 0.19 * s, lz = 0.38 * s;
    const xl = lx * Math.cos(tilt) - ly * Math.sin(tilt), yl = lx * Math.sin(tilt) + ly * Math.cos(tilt);
    const sx = cx - xl, sy = cy + yl, sz = cz - lz;
    const landY = 3.5;
    waterDrops.forEach(({ mesh, offset }) => {
      const stream = (progress * 1.6 + offset) % 1;
      const active = progress > 0.16 && progress < 0.9;
      mesh.visible = active && (stream > 0.15 || offset < progress);
      mesh.position.set(
        sx - stream * 0.55 + Math.sin((stream + offset) * 12) * 0.07,
        sy - (sy - landY) * stream * stream,
        sz - stream * 0.3 + Math.cos((stream + offset) * 9) * 0.05
      );
      mesh.scale.set(0.8, 1.5 + stream * 0.5, 0.8);
      mesh.material.opacity = 0.8 * (1 - stream * 0.3);
    });
    if (progress >= 1) {
      wateringCan.visible = false;
      waterDrops.forEach(({ mesh }) => { mesh.visible = false; });
      waterStart = -1;
      waterButton.disabled = false;
      waterButton.textContent = "💧 Regar";
      showToast("🌿 Prontinho! Os lírios estão hidratados.");
    }
  }

  function animate(time = performance.now()) {
    if (!renderer || !scene) return;
    const delta = Math.min(0.05, (time - lastFrame) / 1000);
    lastFrame = time;
    if (bouquet && autoRotate && !dragging && time - lastDrag > 2400) bouquet.rotation.y += delta * 0.13;
    if (smellStart >= 0 && blooms.length) {
      const elapsed = (time - smellStart) / 1000;
      const pulse = 1 + Math.max(0, Math.sin(elapsed * Math.PI * 3)) * Math.max(0, 1 - elapsed / 2) * 0.055;
      blooms.forEach((bloom) => bloom.scale.setScalar(pulse));
      if (elapsed > 2) { blooms.forEach((bloom) => bloom.scale.setScalar(1)); smellStart = -1; }
    }
    updateWater(time);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  initScene();
})();
