import * as THREE from "three";
import { createScene } from "/astro-animations/js/shared/setup.js";
import { createStarfield, updateTwinkle } from "/astro-animations/js/shared/starfield.js";
import { crearLunaSola, updateLunaSola } from "/astro-animations/js/shared/tierra-sol-luna.js";
import { crearNavegacionTeclado } from "/astro-animations/js/shared/navegacion.js";
import { crearLODTierra } from "/astro-animations/js/shared/lod-texturas.js";
import { initPanelOpciones } from "/astro-animations/js/shared/panel-opciones.js";
import { crearExtrasLuna } from "/astro-animations/js/shared/luna-extras.js";

const { renderer, scene, camera, controls, composer } = createScene({
  bloomStrength: 0,
  bloomRadius: 0.5,
  bloomThreshold: 0.3,
  fogDensity: 0.003,
  cameraPos: [1.2, 0.6, 2.5],
});

controls.minDistance = 0.7;
controls.maxDistance = 60;
controls.zoomSpeed = 1.2;
controls.panSpeed = 1.1;
controls.minPolarAngle = 0.05;
controls.maxPolarAngle = Math.PI - 0.05;

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
lodLuna.precargarTodo();

let playing = true;
let rotar = true;
let speed = 0.1;
const playBtn = document.getElementById("btn-play");
const speedSelect = document.getElementById("speed");
playBtn.addEventListener("click", () => {
  playing = !playing;
  playBtn.textContent = playing ? "⏸" : "▶";
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

const optSombra = document.getElementById("opt-sombra");
optSombra?.addEventListener("change", (e) => {
  luna.luz.intensity = e.target.checked ? 1.5 : 0;
  luna.fill.intensity = e.target.checked ? 0 : 1.5;
});

const extras = crearExtrasLuna(scene, luna.luna, {
  radio: 0.6,
  domElement: renderer.domElement,
  onSelect: volarAZona,
});
extras.cargarDatos();

const optRelieve = document.getElementById("opt-relieve");
optRelieve?.addEventListener("change", (e) => {
  const m = luna.luna.material;
  m.normalMap = e.target.checked ? luna.normalMap : null;
  m.needsUpdate = true;
});

const optNombres = document.getElementById("opt-nombres");
optNombres?.addEventListener("change", (e) => {
  extras.setVisible(e.target.checked);
});

// ===== Fly-to: detener rotación y acercar la cámara a una zona =====
const fly = { activo: false, destino: new THREE.Vector3() };
const tmpFly = new THREE.Vector3();

function volarAZona(it) {
  playing = false;
  playBtn.textContent = "▶";
  tmpFly.copy(it.dir).applyQuaternion(luna.luna.quaternion).normalize();
  fly.destino.copy(tmpFly).multiplyScalar(0.8);
  fly.activo = true;
}

initPanelOpciones();

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if (playing && rotar) {
    updateLunaSola(luna.sim, luna, dt * speed);
  }
  if (fly.activo) {
    const k = 1 - Math.pow(0.0005, dt);
    camera.position.lerp(fly.destino, k);
    if (camera.position.distanceTo(fly.destino) < 0.002) {
      camera.position.copy(fly.destino);
      fly.activo = false;
    }
    const distFly = camera.position.distanceTo(controls.target);
    luna.fill.position.copy(camera.position);
    lodLuna.actualizarLOD(dt, distFly);
    extras.actualizarLODEtiquetas(distFly);
    extras.actualizar(camera);
    updateTwinkle(sf, clock.elapsedTime);
    controls.update();
    if (composer) composer.render();
    else renderer.render(scene, camera);
    return;
  }
  navegar(dt);
  luna.fill.position.copy(camera.position);
  const dist = camera.position.distanceTo(controls.target);

  const rotPrecision = THREE.MathUtils.smoothstep(dist, 0.7, 5.0);
  controls.rotateSpeed = THREE.MathUtils.lerp(0.1, 1.0, rotPrecision);

  // Zoom tipo Google Earth: más lento cuanto más cerca de la luna
  const zoomSuave = THREE.MathUtils.smoothstep(dist, 0.75, 4.0);
  controls.zoomSpeed = THREE.MathUtils.lerp(0.08, 1.2, zoomSuave);

  const bumpZoom = 1 - THREE.MathUtils.smoothstep(dist, 1.0, 3.0);
  const relievescale = THREE.MathUtils.lerp(0.25, 0.6, bumpZoom);
  luna.luna.material.normalScale = new THREE.Vector2(relievescale, relievescale);

  lodLuna.actualizarLOD(dt, dist);
  extras.actualizarLODEtiquetas(dist);
  extras.actualizar(camera);
  updateTwinkle(sf, clock.elapsedTime);
  controls.update();
  if (composer) composer.render();
  else renderer.render(scene, camera);
}
animate();
