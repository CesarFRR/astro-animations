import * as THREE from "three";
import { createScene } from "/astro-animations/js/shared/setup.js";
import { createStarfield, updateTwinkle } from "/astro-animations/js/shared/starfield.js";
import { crearTierraSola, updateTierraSola } from "/astro-animations/js/shared/tierra-sol-luna.js";

const { renderer, scene, camera, controls, composer } = createScene({
  bloomStrength: 1.3,
  bloomRadius: 0.7,
  bloomThreshold: 0.1,
  fogDensity: 0.003,
  cameraPos: [2.4, 1.5, 5.4],
});

controls.minDistance = 1.5;
controls.maxDistance = 80;
controls.zoomSpeed = 1.2;
controls.panSpeed = 1.1;

const sf = createStarfield(scene, 4000, 60, 500);

const tierra = crearTierraSola(scene, {});

const teclas = {};
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
    teclas[k] = true;
    e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => (teclas[e.key.toLowerCase()] = false));

const vFrente = new THREE.Vector3();
const vDer = new THREE.Vector3();
const vPan = new THREE.Vector3();
const vPos = new THREE.Vector3();

function aplicarPan(dt) {
  const dist = controls.target.distanceTo(camera.position);
  const vel = 0.8 * (dist / 4) * dt;
  vPos.subVectors(controls.target, camera.position);
  vFrente.set(vPos.x, 0, vPos.z).normalize();
  if (vFrente.lengthSq() < 0.001) vFrente.set(0, 0, 1);
  vDer.crossVectors(vFrente, new THREE.Vector3(0, 1, 0)).normalize();
  vPan.set(0, 0, 0);
  if (teclas.w || teclas.arrowup) vPan.add(vFrente);
  if (teclas.s || teclas.arrowdown) vPan.sub(vFrente);
  if (teclas.d || teclas.arrowright) vPan.add(vDer);
  if (teclas.a || teclas.arrowleft) vPan.sub(vDer);
  if (vPan.lengthSq() === 0) return;
  vPan.normalize().multiplyScalar(vel);
  camera.position.add(vPan);
  controls.target.add(vPan);
}

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
    updateTierraSola(tierra.sim, tierra, dt * speed);
  }
  aplicarPan(dt);
  updateTwinkle(sf, clock.elapsedTime);
  controls.update();
  composer.render();
}
animate();
