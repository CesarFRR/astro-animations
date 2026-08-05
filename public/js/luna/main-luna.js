import * as THREE from "three";
import { createScene } from "/astro-animations/js/shared/setup.js";
import { createStarfield, updateTwinkle } from "/astro-animations/js/shared/starfield.js";
import { crearLunaSola, updateLunaSola } from "/astro-animations/js/shared/tierra-sol-luna.js";
import { crearNavegacionTeclado } from "/astro-animations/js/shared/navegacion.js";
import { crearLODTierra } from "/astro-animations/js/shared/lod-texturas.js";

const { renderer, scene, camera, controls, composer } = createScene({
  bloomStrength: 0.6,
  bloomRadius: 0.5,
  bloomThreshold: 0.3,
  fogDensity: 0.003,
  cameraPos: [2.6, 1.4, 5.2],
});

controls.minDistance = 0.9;
controls.maxDistance = 60;
controls.zoomSpeed = 1.2;
controls.panSpeed = 1.1;

const sf = createStarfield(scene, 4000, 60, 500);

const luna = crearLunaSola(scene, { radio: 0.6 });
const navegar = crearNavegacionTeclado(camera, controls);
const lodLuna = crearLODTierra(
  [{ material: luna.luna.material, prop: "map" }],
  [
    { max: null, texs: [luna.tex.luna] },
    { max: 4.0, urls: ["/astro-animations/textures/max/4k_moon.webp"], srgb: true },
    { max: 2.4, urls: ["/astro-animations/textures/max/8k_moon.webp"], srgb: true },
  ]
);

let playing = true;
let rotar = false;
let speed = 1;
const playBtn = document.getElementById("btn-play");
const rotarBtn = document.getElementById("btn-rotar");
const speedSelect = document.getElementById("speed");
playBtn.addEventListener("click", () => {
  playing = !playing;
  playBtn.textContent = playing ? "⏸ Pausar" : "▶ Reproducir";
});
rotarBtn.addEventListener("click", () => {
  rotar = !rotar;
  rotarBtn.textContent = rotar ? "⟳ Girar (ON)" : "⟳ Girar (OFF)";
  rotarBtn.classList.toggle("muted", !rotar);
});
speedSelect.addEventListener("change", (e) => {
  speed = parseFloat(e.target.value);
});

function setSeg(botones, clave, valor) {
  botones.forEach((b) => b.classList.toggle("active", b.dataset[clave] === String(valor)));
}

const segCalidad = document.querySelectorAll("#opt-calidad button");
segCalidad.forEach((b) => {
  b.addEventListener("click", () => {
    const cal = b.dataset.calidad;
    setSeg(segCalidad, "calidad", cal);
    if (cal === "auto") lodLuna.volverAuto();
    else if (cal === "bajo") lodLuna.forzar(0);
    else if (cal === "equilibrado") lodLuna.forzar(1);
    else lodLuna.forzar(2);
  });
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if (playing && rotar) {
    updateLunaSola(luna.sim, luna, dt * speed);
  }
  navegar(dt);
  const dist = camera.position.distanceTo(controls.target);
  lodLuna.actualizarLOD(dt, dist);
  updateTwinkle(sf, clock.elapsedTime);
  controls.update();
  composer.render();
}
animate();
