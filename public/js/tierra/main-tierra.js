import * as THREE from "three";
import { createScene } from "/astro-animations/js/shared/setup.js";
import { createStarfield, updateTwinkle } from "/astro-animations/js/shared/starfield.js";
import { crearTierraSola, updateTierraSola } from "/astro-animations/js/shared/tierra-sol-luna.js";
import { crearNavegacionTeclado } from "/astro-animations/js/shared/navegacion.js";
import { crearLODTierra } from "/astro-animations/js/shared/lod-texturas.js";

const { renderer, scene, camera, controls, composer } = createScene({
  bloomStrength: 0.4,
  bloomRadius: 0.5,
  bloomThreshold: 0.3,
  fogDensity: 0.003,
  cameraPos: [3.4, 2.1, 6.2],
});

controls.minDistance = 1.5;
controls.maxDistance = 80;
controls.zoomSpeed = 1.2;
controls.panSpeed = 1.1;

const sf = createStarfield(scene, 4000, 60, 500);

const tierra = crearTierraSola(scene, {});
const navegar = crearNavegacionTeclado(camera, controls);
const lodTierra = crearLODTierra(tierra.mesh, [
  { min: null, max: null, tex: tierra.tex.dia },
  { min: null, max: 4.0, url: "/astro-animations/textures/max/4k_earth_daymap.webp" },
  { min: null, max: 2.4, url: "/astro-animations/textures/max/8k_earth_daymap.webp", liberar: true },
]);

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

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  tierra.luz.position.copy(camera.position);
  tierra.luz.target.position.copy(controls.target);
  if (playing && rotar) {
    updateTierraSola(tierra.sim, tierra, dt * speed);
  }
  navegar(dt);
  const dist = camera.position.distanceTo(controls.target);
  lodTierra(dt, dist);
  updateTwinkle(sf, clock.elapsedTime);
  controls.update();
  composer.render();
}
animate();
