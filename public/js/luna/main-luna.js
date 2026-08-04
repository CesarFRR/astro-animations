import * as THREE from "three";
import { createScene } from "/astro-animations/js/shared/setup.js";
import { createStarfield, updateTwinkle } from "/astro-animations/js/shared/starfield.js";
import { crearLunaSola, updateLunaSola } from "/astro-animations/js/shared/tierra-sol-luna.js";

const { renderer, scene, camera, controls, composer } = createScene({
  bloomStrength: 1.2,
  bloomRadius: 0.6,
  bloomThreshold: 0.1,
  fogDensity: 0.003,
  cameraPos: [2.2, 1.2, 4.8],
});

controls.minDistance = 0.9;
controls.maxDistance = 60;
controls.zoomSpeed = 1.2;
controls.panSpeed = 1.1;

const sf = createStarfield(scene, 4000, 60, 500);

const luna = crearLunaSola(scene, { radio: 0.6 });

let playing = true;
let speed = 1;
const playBtn = document.getElementById("btn-play");
const speedSelect = document.getElementById("speed");
playBtn.addEventListener("click", () => {
  playing = !playing;
  playBtn.textContent = playing ? "⏸ Pausar" : "▶ Reproducir";
});
speedSelect.addEventListener("change", (e) => {
  speed = parseFloat(e.target.value);
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if (playing) {
    updateLunaSola(luna.sim, luna, dt * speed);
  }
  updateTwinkle(sf, clock.elapsedTime);
  controls.update();
  composer.render();
}
animate();
