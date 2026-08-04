import * as THREE from "three";
import { createScene } from "/astro-animations/js/shared/setup.js";
import { createStarfield, updateTwinkle } from "/astro-animations/js/shared/starfield.js";

const TAU = Math.PI * 2;
const BASE = "/astro-animations";

const { renderer, scene, camera, controls, composer } = createScene({
  bloomStrength: 1.9,
  bloomRadius: 0.8,
  bloomThreshold: 0.15,
  fogDensity: 0.003,
  cameraPos: [9, 4, 17],
});

controls.minDistance = 6;
controls.maxDistance = 120;

const sf = createStarfield(scene, 4000, 60, 500);

const loader = new THREE.TextureLoader();
const texSol = loader.load(`${BASE}/textures/sun.webp`);
texSol.colorSpace = THREE.SRGBColorSpace;
texSol.anisotropy = 8;

const sol = new THREE.Mesh(
  new THREE.SphereGeometry(4, 96, 64),
  new THREE.MeshBasicMaterial({ map: texSol })
);
scene.add(sol);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
const ctx = canvas.getContext("2d");
const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
grad.addColorStop(0, "rgba(255, 250, 235, 0.85)");
grad.addColorStop(0.35, "rgba(255, 190, 90, 0.28)");
grad.addColorStop(0.7, "rgba(255, 120, 40, 0.08)");
grad.addColorStop(1, "rgba(255, 100, 30, 0)");
ctx.fillStyle = grad;
ctx.fillRect(0, 0, 256, 256);

const glowTex = new THREE.CanvasTexture(canvas);
const glow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: glowTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
glow.scale.setScalar(26);
scene.add(glow);

const sim = { dias: 0 };
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
    sim.dias += dt * speed;
    sol.rotation.y = (TAU * sim.dias) / 25.05;
  }
  updateTwinkle(sf, clock.elapsedTime);
  controls.update();
  composer.render();
}
animate();
