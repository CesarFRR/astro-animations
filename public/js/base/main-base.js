import * as THREE from "three";
import { createScene } from "/astro-animations/js/shared/setup.js";
import { createStarfield, updateTwinkle } from "/astro-animations/js/shared/starfield.js";
import { createBase, updateBase, distanciaTierraSol } from "/astro-animations/js/shared/tierra-sol-luna.js";

const { renderer, scene, camera, controls, composer } = createScene({
  bloomStrength: 1.2,
  bloomRadius: 0.6,
  bloomThreshold: 0.1,
  fogDensity: 0.004,
  cameraPos: [14, 10, 32],
});

const sf = createStarfield(scene, 4000, 60, 500);

const base = createBase(scene, {
  a: 20,
  e: 0.0167,
  solRadio: 3,
  tierraRadio: 1.2,
  lunaRadio: 0.33,
  distLuna: 4,
});

const VELOCIDAD_ORBITAL = 29.78;

const gauges = {
  dias: document.getElementById("gauge-dias"),
  distancia: document.getElementById("gauge-distancia"),
  velocidad: document.getElementById("gauge-velocidad"),
  fase: document.getElementById("gauge-fase"),
};

function actualizarHUD() {
  if (!gauges.dias) return;
  const dias = base.sim.dias % 365.2422;
  gauges.dias.firstElementChild.lastElementChild.textContent = `${Math.floor(dias)} d`;
  const dist = distanciaTierraSol(base.sim, base.sim.a);
  gauges.distancia.firstElementChild.lastElementChild.textContent = `${dist.toFixed(3)} ua`;
  gauges.distancia.lastElementChild.style.width = `${((dist - (20 * (1 - 0.0167))) / (20 * 0.0334)) * 100}%`;
  const v = VELOCIDAD_ORBITAL * Math.sqrt((2 * 20) / dist - 1 / 20);
  gauges.velocidad.firstElementChild.lastElementChild.textContent = `${v.toFixed(1)} km/s`;
  const fase = Math.round((base.sim.MLuna / (Math.PI * 2)) * 100) % 100;
  gauges.fase.firstElementChild.lastElementChild.textContent = `Luna ${fase}%`;
  gauges.fase.lastElementChild.style.width = `${fase}%`;
}

let playing = true;
let speed = 1;
const playBtn = document.getElementById("btn-play");
const restartBtn = document.getElementById("btn-restart");
const speedSelect = document.getElementById("speed");

playBtn.addEventListener("click", () => {
  playing = !playing;
  playBtn.textContent = playing ? "⏸ Pausar" : "▶ Reproducir";
});

restartBtn.addEventListener("click", () => {
  base.sim.dias = 0;
  base.sim.M = 0;
  base.sim.MLuna = 0;
  base.sim.nodo = 0;
  base.sim.spin = 0;
  playing = true;
  playBtn.textContent = "⏸ Pausar";
});

speedSelect.addEventListener("change", (e) => {
  speed = parseFloat(e.target.value);
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if (playing) {
    updateBase(base.sim, base, dt * speed);
  }
  updateTwinkle(sf, clock.elapsedTime);
  controls.update();
  actualizarHUD();
  composer.render();
}
animate();
