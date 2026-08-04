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
  foco: document.getElementById("gauge-foco"),
};

const fill = (span) => span?.parentElement?.querySelector(".gauge-fill");

function actualizarHUD() {
  if (!gauges.dias) return;
  const dias = base.sim.dias % 365.2422;
  gauges.dias.textContent = `${Math.floor(dias)} d`;
  const dist = distanciaTierraSol(base.sim, base.sim.a);
  gauges.distancia.textContent = `${dist.toFixed(3)} ua`;
  fill(gauges.distancia).style.width = `${((dist - (20 * (1 - 0.0167))) / (20 * 0.0334)) * 100}%`;
  const v = VELOCIDAD_ORBITAL * Math.sqrt((2 * 20) / dist - 1 / 20);
  gauges.velocidad.textContent = `${v.toFixed(1)} km/s`;
  const fase = Math.round((base.sim.MLuna / (Math.PI * 2)) * 100) % 100;
  gauges.fase.textContent = `Luna ${fase}%`;
  fill(gauges.fase).style.width = `${fase}%`;
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

if (restartBtn) restartBtn.addEventListener("click", () => {
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

const CUERPOS = {
  sol: { objeto: base.solMesh, distancia: 6 },
  tierra: { objeto: base.tierra, distancia: 4.5 },
  luna: { objeto: base.luna, distancia: 1.8 },
};
const NOMBRES = { sol: "Sol", tierra: "Tierra", luna: "Luna" };

let enfocado = null;
let animar = false;
let offsetCam = null;
const posInicial = camera.position.clone();
const targetInicial = controls.target.clone();
const vWorld = new THREE.Vector3();

function aplicarVisibilidad() {
  base.solMesh.visible = enfocado === null || enfocado === "sol";
  base.tierra.visible = enfocado === null || enfocado === "tierra";
  base.luna.visible = enfocado === null || enfocado === "luna";
  base.orbitas.forEach((o) => (o.visible = enfocado === null));
}

function enfocar(cuerpo) {
  if (enfocado === cuerpo) return;
  enfocado = cuerpo;
  animar = true;
  const dist = CUERPOS[cuerpo].distancia;
  CUERPOS[cuerpo].objeto.updateMatrixWorld(true);
  CUERPOS[cuerpo].objeto.getWorldPosition(vWorld);
  offsetCam = new THREE.Vector3()
    .subVectors(camera.position, vWorld)
    .normalize()
    .multiplyScalar(dist);
  aplicarVisibilidad();
  if (gauges.foco) gauges.foco.textContent = NOMBRES[cuerpo];
}

function salirDeEnfoque() {
  enfocado = null;
  animar = true;
  aplicarVisibilidad();
  if (gauges.foco) gauges.foco.textContent = "General";
}

const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const canvas = renderer.domElement;
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  ray.setFromCamera(pointer, camera);
  const hits = ray.intersectObjects([base.solMesh, base.tierra, base.luna], true);
  if (hits.length > 0) {
    const cuerpo = hits[0].object.userData.cuerpo;
    if (cuerpo) enfocar(cuerpo);
  } else if (enfocado) {
    salirDeEnfoque();
  }
});

const clock = new THREE.Clock();
const FIN_TRANSICION = 0.15;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if (playing) {
    updateBase(base.sim, base, dt * speed);
  }
  if (animar) {
    if (enfocado) {
      CUERPOS[enfocado].objeto.updateMatrixWorld(true);
      CUERPOS[enfocado].objeto.getWorldPosition(vWorld);
      controls.target.lerp(vWorld, 0.12);
      camera.position.lerp(vWorld.clone().add(offsetCam), 0.12);
      if (camera.position.distanceTo(vWorld.clone().add(offsetCam)) < FIN_TRANSICION) {
        animar = false;
      }
    } else {
      controls.target.lerp(targetInicial, 0.1);
      camera.position.lerp(posInicial, 0.1);
      if (camera.position.distanceTo(posInicial) < FIN_TRANSICION) {
        animar = false;
        camera.position.copy(posInicial);
        controls.target.copy(targetInicial);
      }
    }
  } else if (enfocado) {
    CUERPOS[enfocado].objeto.updateMatrixWorld(true);
    CUERPOS[enfocado].objeto.getWorldPosition(vWorld);
    controls.target.lerp(vWorld, 0.08);
  }
  updateTwinkle(sf, clock.elapsedTime);
  controls.update();
  actualizarHUD();
  composer.render();
}
animate();
