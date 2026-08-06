import { iniciarExploradorTierra } from "/astro-animations/js/shared/explorador-tierra.js";

// Misma animación de vuelo libre, con el modo capas activado por defecto
// y una cámara más cercana para inspeccionar la sección interna.
const explorador = iniciarExploradorTierra({
  capasActivas: true,
  cameraPos: [1.4, 0.9, 2.6],
  minDistance: 0.4,
});

// Visibilidad individual de cada capa.
const POR_CAPA = [
  ["opt-capa-nucleo-interno", "nucleo-interno"],
  ["opt-capa-nucleo-externo", "nucleo-externo"],
  ["opt-capa-manto", "manto"],
  ["opt-capa-corteza", "corteza"],
];
POR_CAPA.forEach(([id, capa]) => {
  const chk = document.getElementById(id);
  chk?.addEventListener("change", (e) => {
    explorador.capas.setCapaVisible(capa, e.target.checked);
  });
});
