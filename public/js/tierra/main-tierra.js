import * as THREE from "three";
import { createScene } from "/astro-animations/js/shared/setup.js";
import { createStarfield, updateTwinkle } from "/astro-animations/js/shared/starfield.js";
import { crearTierraSola, updateTierraSola } from "/astro-animations/js/shared/tierra-sol-luna.js";
import { crearNavegacionTeclado } from "/astro-animations/js/shared/navegacion.js";
import { crearLODTierra } from "/astro-animations/js/shared/lod-texturas.js";
import { initPanelOpciones } from "/astro-animations/js/shared/panel-opciones.js";

const { renderer, scene, camera, controls, composer } = createScene({
  bloomStrength: 0.15,
  bloomRadius: 0.5,
  bloomThreshold: 0.6,
  fogDensity: 0.003,
  cameraPos: [2.2, 1.3, 4.5],
});

controls.minDistance = 1.5;
controls.maxDistance = 80;
controls.zoomSpeed = 1.2;
controls.panSpeed = 1.1;

const sf = createStarfield(scene, 4000, 60, 500);

const tierra = crearTierraSola(scene, {});
const navegar = crearNavegacionTeclado(camera, controls);
const lodTierra = crearLODTierra(
  [
    { material: tierra.mesh.material, prop: "map" },
    { set: (t) => { tierra.uniforms.uNight.value = t; } },
  ],
  [
    { max: null, texs: [tierra.tex.dia, tierra.tex.noche] },
    {
      max: 4.0,
      urls: [
        "/astro-animations/textures/max/4k_earth_daymap.webp",
        "/astro-animations/textures/max/4k_earth_nightmap.webp",
      ],
      srgb: true,
    },
    {
      max: 2.4,
      urls: [
        "/astro-animations/textures/max/8k_earth_daymap.webp",
        "/astro-animations/textures/max/8k_earth_nightmap.webp",
      ],
      srgb: true,
    },
  ]
);
lodTierra.precargarTodo();

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

function actualizarAtmosfera() {
  if (tierra.atmosfera) tierra.atmosfera.visible = optAtmosfera.checked && (tierra.uniforms.uModo.value !== 2);
}

const optNubes = document.getElementById("opt-nubes");
const optAtmosfera = document.getElementById("opt-atmosfera");
const segIlum = document.querySelectorAll("#opt-iluminacion button");
const segCalidad = document.querySelectorAll("#opt-calidad button");

optNubes?.addEventListener("change", (e) => {
  tierra.nubes1.visible = e.target.checked;
});
optAtmosfera?.addEventListener("change", actualizarAtmosfera);
segIlum.forEach((b) => {
  b.addEventListener("click", () => {
    const modo = Number(b.dataset.modo);
    tierra.uniforms.uModo.value = modo;
    setSeg(segIlum, "modo", modo);
    actualizarAtmosfera();
  });
});
segCalidad.forEach((b) => {
  b.addEventListener("click", () => {
    const cal = b.dataset.calidad;
    setSeg(segCalidad, "calidad", cal);
    if (cal === "auto") lodTierra.volverAuto();
    else if (cal === "bajo") lodTierra.forzar(0);
    else if (cal === "equilibrado") lodTierra.forzar(1);
    else lodTierra.forzar(2);
  });
});

initPanelOpciones();

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if (playing && rotar) {
    updateTierraSola(tierra.sim, tierra, dt * speed);
  }
  navegar(dt);
  const dist = camera.position.distanceTo(controls.target);
  lodTierra.actualizarLOD(dt, dist);
  updateTwinkle(sf, clock.elapsedTime);
  controls.update();
  composer.render();
}
animate();
