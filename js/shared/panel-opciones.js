export function initPanelOpciones() {
  const posicionar = () => {
    document.querySelectorAll("details.opciones[open]").forEach((d) => {
      const summary = d.querySelector("summary");
      const cuerpo = d.querySelector(".opciones-cuerpo");
      if (!summary || !cuerpo) return;
      const margen = 12;
      const r = summary.getBoundingClientRect();
      const ancho = Math.min(320, window.innerWidth - margen * 2);
      let left = Math.min(r.left, window.innerWidth - ancho - margen);
      left = Math.max(margen, left);
      cuerpo.style.position = "fixed";
      cuerpo.style.left = left + "px";
      cuerpo.style.bottom = Math.max(margen, window.innerHeight - r.top + margen) + "px";
      cuerpo.style.width = ancho + "px";
      cuerpo.style.maxWidth = ancho + "px";
      cuerpo.style.maxHeight = Math.max(120, r.top - margen) + "px";
    });
  };

  document.querySelectorAll("details.opciones").forEach((d) => {
    d.addEventListener("toggle", posicionar);
  });
  window.addEventListener("resize", posicionar);

  document.querySelector(".controls")?.addEventListener("click", (e) => {
    if (!e.target.closest(".opciones")) {
      document.querySelectorAll("details.opciones[open]").forEach((d) => (d.open = false));
    }
  });
}
