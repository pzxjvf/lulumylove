/* ====================================================================
   🎄  TEMA NATALINO DO NOSSO CANTINHO  ❄️
   Adiciona a neve caindo e a guirlanda no topo em TODAS as páginas.
   ==================================================================== */
(function () {
  if (window.__natalTemaCarregado) return;
  window.__natalTemaCarregado = true;

  function montarNeve() {
    var camada = document.createElement("div");
    camada.className = "natal-neve";
    camada.setAttribute("aria-hidden", "true");
    var flocos = ["❄", "❅", "❆", "❄", "❆"];
    var largura = window.innerWidth || 800;
    var qtd = Math.min(22, Math.max(10, Math.round(largura / 72)));
    for (var i = 0; i < qtd; i++) {
      var s = document.createElement("span");
      s.textContent = flocos[i % flocos.length];
      s.style.left = (Math.random() * 100).toFixed(2) + "%";
      s.style.fontSize = (5 + Math.random() * 8).toFixed(1) + "px";
      s.style.opacity = (0.14 + Math.random() * 0.32).toFixed(2);
      s.style.animationDuration = (6 + Math.random() * 8).toFixed(1) + "s";
      s.style.animationDelay = (-Math.random() * 12).toFixed(1) + "s";
      s.style.setProperty("--deriva", (Math.random() * 80 - 40).toFixed(0) + "px");
      camada.appendChild(s);
    }
    document.body.appendChild(camada);
  }

  function montarGuirlanda() {
    var g = document.createElement("div");
    g.className = "natal-guirlanda";
    g.setAttribute("aria-hidden", "true");
    var itens = ["🎄", "❄️", "⭐", "🔔", "🎁", "✨", "⛄", "🎅", "🕯️", "🍬"];
    var largura = window.innerWidth || 800;
    var qtd = Math.min(14, Math.max(7, Math.round(largura / 110)));
    for (var i = 0; i < qtd; i++) {
      var s = document.createElement("span");
      s.textContent = itens[i % itens.length];
      g.appendChild(s);
    }
    document.body.appendChild(g);
  }

  function iniciar() {
    montarNeve();
    montarGuirlanda();
  }

  if (document.body) iniciar();
  else document.addEventListener("DOMContentLoaded", iniciar);
})();
