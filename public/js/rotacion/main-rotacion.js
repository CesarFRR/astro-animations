import * as THREE from "three";
import { createScene } from "/astro-animations/js/shared/setup.js";
import { createStarfield, updateTwinkle } from "/astro-animations/js/shared/starfield.js";
import { createBase, updateBase } from "/astro-animations/js/shared/tierra-sol-luna.js";
import { crearTexturaTierraSimple } from "/astro-animations/js/shared/textura-simple.js";

const TAU = Math.PI * 2;

const { renderer, scene, camera, controls, composer } = createScene({
  bloomStrength: 1.2,
  bloomRadius: 0.6,
  bloomThreshold: 0.1,
  fogDensity: 0.004,
  cameraPos: [5.5, 3.4, 9],
});

const sf = createStarfield(scene, 4000, 60, 500);

const base = createBase(scene, {
  a: 20,
  e: 0.0167,
  solRadio: 3,
  tierraRadio: 1.2,
  lunaRadio: 0.33,
  distLuna: 4,
  tierraTextura: crearTexturaTierraSimple(),
  mostrarNubes: false,
});

const R_T = base.tierraRadio;

const flechaMeridiano = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(R_T * 1.15, 0, 0),
    new THREE.Vector3(R_T * 1.95, 0, 0),
  ]),
  new THREE.LineBasicMaterial({ color: 0xff3b30 })
);
base.tierraSpin.add(flechaMeridiano);

const dirEstrella = new THREE.Vector3(1, 0, 0);
const estrellaMarker = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 16, 12),
  new THREE.MeshBasicMaterial({ color: 0xfff6e0, fog: false })
);
estrellaMarker.position.copy(dirEstrella).multiplyScalar(80);
scene.add(estrellaMarker);

const lineaEstrella = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), estrellaMarker.position.clone()]),
  new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false })
);
scene.add(lineaEstrella);

const lineaSol = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
  new THREE.LineBasicMaterial({ color: 0xffd27f, transparent: true, opacity: 0.65 })
);
scene.add(lineaSol);

const vTierra = new THREE.Vector3();
const vSol = new THREE.Vector3();
const vMer = new THREE.Vector3();

const estado = {
  crucesEstrella: 0,
  crucesSol: 0,
  inicioSidereo: 0,
  inicioSolar: 0,
  totalSidereoH: 0,
  totalSolarH: 0,
  dPrevEstrella: 0,
  dPrevSol: 0,
};

function anguloRelativo(dir, ref) {
  let d = Math.atan2(dir.z, dir.x) - Math.atan2(ref.z, ref.x);
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return d;
}

function fmtHoras(h) {
  const total = Math.max(0, Math.floor(h * 3600));
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

const gauges = {
  sider: document.getElementById("gauge-sider"),
  solar: document.getElementById("gauge-solar"),
  dif: document.getElementById("gauge-dif"),
};
const em = (span) => span.parentElement.querySelector(".gauge-label em");

function actualizarHUD() {
  if (!gauges.sider) return;
  const relojSider = (base.sim.dias - estado.inicioSidereo) * 24;
  const relojSolar = (base.sim.dias - estado.inicioSolar) * 24;
  gauges.sider.textContent = fmtHoras(relojSider);
  gauges.solar.textContent = fmtHoras(relojSolar);
  const difMin = (estado.totalSolarH - estado.totalSidereoH) * 60;
  gauges.dif.textContent = `+${difMin.toFixed(1)} min`;
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

function reiniciar() {
  base.sim.dias = 0;
  base.sim.M = 0;
  base.sim.MLuna = 0;
  base.sim.nodo = 0;
  base.sim.spin = 0;
  estado.crucesEstrella = 0;
  estado.crucesSol = 0;
  estado.inicioSidereo = 0;
  estado.inicioSolar = 0;
  estado.totalSidereoH = 0;
  estado.totalSolarH = 0;
  estado.dPrevEstrella = 0;
  estado.dPrevSol = 0;
  playing = true;
  playBtn.textContent = "⏸ Pausar";
}

if (restartBtn) restartBtn.addEventListener("click", reiniciar);

speedSelect.addEventListener("change", (e) => {
  speed = parseFloat(e.target.value);
});

const clock = new THREE.Clock();
const CRUCE = Math.PI - 0.5;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if (playing) {
    updateBase(base.sim, base, dt * speed);
  }

  vTierra.copy(base.tierra.position);
  vSol.copy(base.sol.position).sub(vTierra).normalize();
  vMer.set(1, 0, 0);
  base.tierraSpin.updateMatrixWorld(true);
  base.tierraSpin.localToWorld(vMer).sub(vTierra).normalize();

  const dEstrella = anguloRelativo(vMer, dirEstrella);
  const dSol = anguloRelativo(vMer, vSol);
  if (playing) {
    if (estado.dPrevEstrella < -CRUCE && dEstrella > CRUCE) {
      const dur = (base.sim.dias - estado.inicioSidereo) * 24;
      estado.totalSidereoH += dur;
      estado.inicioSidereo = base.sim.dias;
      estado.crucesEstrella++;
      em(gauges.sider).textContent = `Giro #${estado.crucesEstrella} · últ. ${fmtHoras(dur)}`;
    }
    if (estado.dPrevSol < -CRUCE && dSol > CRUCE) {
      const dur = (base.sim.dias - estado.inicioSolar) * 24;
      estado.totalSolarH += dur;
      estado.inicioSolar = base.sim.dias;
      estado.crucesSol++;
      em(gauges.solar).textContent = `últ. ${fmtHoras(dur)}`;
    }
  }
  estado.dPrevEstrella = dEstrella;
  estado.dPrevSol = dSol;

  lineaEstrella.geometry.setFromPoints([vTierra.clone(), estrellaMarker.position.clone()]);
  lineaSol.geometry.setFromPoints([vTierra.clone(), base.sol.position.clone()]);

  updateTwinkle(sf, clock.elapsedTime);
  controls.update();
  actualizarHUD();
  composer.render();
}
animate();
