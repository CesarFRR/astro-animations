import * as THREE from "three";
import { BhStar } from "./star-bh.js";
import { BhParticles } from "./particles-bh.js";
import { BlackHole } from "./blackhole.js";
import { Lensing } from "./lensing.js";
import { BhLightCurve } from "./lightcurve-bh.js";
import { updateHud } from "./hud-bh.js";
import { updateCaption } from "./captions-bh.js";
import { getPhaseAt, phaseDay, lerp, easeInOut, easeOutCubic, easeInCubic, TOTAL_DURATION } from "./phases-bh.js";
import { createStarfield, createGalaxies } from "../shared/background.js";

// Redshift palette for collapse: [white, yellow, orange, red, dark red, near-black]
const COLLAPSE_COLORS = [
  new THREE.Color(0xffffff),
  new THREE.Color(0xffdd66),
  new THREE.Color(0xff8833),
  new THREE.Color(0xcc2200),
  new THREE.Color(0x661100),
  new THREE.Color(0x1a0500)
];
const COLLAPSE_GLOW = [
  new THREE.Color(0xaaddff),
  new THREE.Color(0xffcc66),
  new THREE.Color(0xff5533),
  new THREE.Color(0x881100),
  new THREE.Color(0x330800),
  new THREE.Color(0x050200)
];

const canvas = document.getElementById("space-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05070a, 0.012);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 18);

const worldGroup = new THREE.Group();
scene.add(worldGroup);

createStarfield(worldGroup, 3000);
createGalaxies(worldGroup, 36);

const star = new BhStar(worldGroup);
const particles = new BhParticles(worldGroup);
const blackHole = new BlackHole(worldGroup);
const lightCurve = new BhLightCurve("lightcurve-svg");
const lensing = new Lensing(renderer, scene, camera);
lensing.setSize(window.innerWidth, window.innerHeight);

let globalProgress = 0;
let playing = true;
let speed = 1;
let userScrubbing = false;
let previousPhase = null;
let lensingStrength = 0;

const playBtn = document.getElementById("btn-play");
const restartBtn = document.getElementById("btn-restart");
const speedSelect = document.getElementById("speed");
const timeline = document.getElementById("timeline");
const toggleComparisonBtn = document.getElementById("toggle-comparison");

playBtn.addEventListener("click", () => {
  playing = !playing;
  playBtn.textContent = playing ? "⏸ Pausar" : "▶ Reproducir";
});

restartBtn.addEventListener("click", () => {
  globalProgress = 0;
  playing = true;
  playBtn.textContent = "⏸ Pausar";
  resetSimulation();
});

speedSelect.addEventListener("change", (e) => {
  speed = parseFloat(e.target.value);
});

timeline.addEventListener("input", () => {
  userScrubbing = true;
  globalProgress = parseInt(timeline.value, 10) / 1000;
});

timeline.addEventListener("change", () => {
  userScrubbing = false;
});

toggleComparisonBtn.addEventListener("click", () => {
  lightCurve.toggleComparison();
  toggleComparisonBtn.classList.toggle("active", lightCurve.showComparison);
});

const mobileCurveToggle = document.getElementById("mobile-curve-toggle");
if (mobileCurveToggle) {
  mobileCurveToggle.addEventListener("click", () => {
    document.querySelector(".lightcurve-panel").classList.toggle("visible");
    mobileCurveToggle.classList.toggle("active");
  });
}

function resetSimulation() {
  particles.reset();
  blackHole.setIntensity(0);
  star.show();
  star.setCore(1, 0xffddaa, 0xffcc66, 0.22);
  star.setEnvelope(3.2, 0xff5533, 0.3);
  star.setLayers(0);
  lensingStrength = 0;
  camera.position.set(0, 0, 16);
}

function adjustViewport() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;
  if (w <= 600) {
    worldGroup.position.y = 2.2;
    worldGroup.scale.setScalar(aspect < 0.55 ? 1.25 : 1.15);
  } else if (w <= 768) {
    worldGroup.position.y = 1.6;
    worldGroup.scale.setScalar(1.08);
  } else if (w <= 1024) {
    worldGroup.position.y = 0.6;
    worldGroup.scale.setScalar(1.02);
  } else {
    worldGroup.position.y = 0;
    worldGroup.scale.setScalar(1);
  }
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  lensing.setSize(window.innerWidth, window.innerHeight);
  adjustViewport();
});

function computeHud(phase, local) {
  let tempGK, coreMass, neutrinos, radiusKm;
  switch (phase) {
    case "supergiant":
      tempGK = lerp(0.04, 0.6, local);
      coreMass = lerp(0.2, 0.5, local);
      neutrinos = 0;
      radiusKm = 2600;
      break;
    case "onionLayers": {
      const t = easeInOut(local);
      tempGK = lerp(0.6, 3.5, t);
      coreMass = lerp(0.5, 1.8, t);
      neutrinos = lerp(0, 3, t);
      radiusKm = lerp(2600, 1600, t);
      break;
    }
    case "coreCollapse": {
      const t = easeInCubic(local);
      tempGK = lerp(3.5, 100, t);
      coreMass = lerp(1.8, 2.2, t);
      neutrinos = lerp(3, 100, t);
      radiusKm = lerp(1600, 30, t);
      break;
    }
    case "explosion":
      tempGK = lerp(100, 15, local);
      coreMass = 2.2;
      neutrinos = lerp(100, 35, local);
      radiusKm = 30;
      break;
    case "blackHole": {
      const t = easeInOut(local);
      tempGK = lerp(15, 0.01, t);
      coreMass = lerp(2.2, 10, t); // fallback adds mass to the BH
      neutrinos = lerp(35, 5, t);
      radiusKm = lerp(30, 30, t); // horizon ~3 km per M☉
      break;
    }
    case "accretionDisk":
      tempGK = 0.01; // disco a ~10^7 K
      coreMass = lerp(10, 12, local);
      neutrinos = lerp(5, 0, local);
      radiusKm = 30;
      break;
    default:
      tempGK = 0.04; coreMass = 0.2; neutrinos = 0; radiusKm = 2600;
  }
  return { tempGK, coreMass, neutrinos, radiusKm };
}

function updateScene(phase, local, dt, totalTime) {
  // Camera per phase
  let targetZ = 16;
  if (phase === "onionLayers") targetZ = lerp(16, 22, local);
  else if (phase === "coreCollapse") targetZ = lerp(22, 15, local);
  else if (phase === "explosion") targetZ = lerp(15, 30, local);
  else if (phase === "blackHole") targetZ = lerp(30, 17, local);
  else if (phase === "accretionDisk") targetZ = lerp(17, 13, local);
  camera.position.z = lerp(camera.position.z, targetZ, 0.03);
  camera.position.x = Math.sin(totalTime * 0.07) * 0.4;
  camera.position.y = Math.cos(totalTime * 0.05) * 0.3 + (phase === "accretionDisk" ? 1.2 : 0);
  camera.lookAt(0, 0, 0);

  if (phase === "supergiant") {
    star.show();
    star.setCore(1, 0xffddaa, 0xffcc66, 0.22);
    star.setEnvelope(3.2 + Math.sin(totalTime * 1.5) * 0.15, 0xff5533, 0.3);
    star.setLayers(0);
    star.pulse(totalTime, 0.02);
  } else if (phase === "onionLayers") {
    const t = easeInOut(local);
    star.show();
    star.setCore(lerp(1, 0.7, t), 0xffffff, 0xffffcc, 0.3);
    star.setEnvelope(3.2, 0xff5533, lerp(0.3, 0.12, t));
    star.setLayers(t); // reveal the onion shells
    star.pulse(totalTime, 0.02);
  } else if (phase === "coreCollapse") {
    const t = easeInCubic(local);
    star.show();
    const ci = Math.min(Math.floor(t * (COLLAPSE_COLORS.length - 1)), COLLAPSE_COLORS.length - 2);
    const cf = t * (COLLAPSE_COLORS.length - 1) - ci;
    const color = COLLAPSE_COLORS[ci].clone().lerp(COLLAPSE_COLORS[ci + 1], cf);
    const glow = COLLAPSE_GLOW[ci].clone().lerp(COLLAPSE_GLOW[ci + 1], cf);
    star.setCore(lerp(0.7, 0.12, t), color, glow, lerp(0.3, 0.6, t));
    const envColor = new THREE.Color(0xff5533).lerp(new THREE.Color(0x661100), t);
    star.setEnvelope(lerp(3.2, 2.6, t), envColor, 0.12);
    star.setLayers(1, lerp(1, 0.25, t));
  } else if (phase === "explosion") {
    if (previousPhase !== "explosion") star.fireShock();
    star.show();
    const re = Math.min(1, local * 2);
    const expColor = new THREE.Color(0xffffff).lerp(new THREE.Color(0xffaa66), re);
    star.setCore(lerp(0.12, 0.1, local), expColor, 0xaaddff, 0.5);
    star.setEnvelope(lerp(2.6, 5, local), 0xff8844, Math.max(0, 0.12 - local * 0.15));
    star.setLayers(lerp(1, 0, local), 0.25);
  } else if (phase === "blackHole") {
    const t = easeInOut(local);
    blackHole.setIntensity(t);
    if (t < 0.6) {
      star.show();
      const freezeScale = 0.12 + 0.035 * Math.exp(-4 * t * 2);
      const ci = Math.min(Math.floor((0.3 + t) * 4), COLLAPSE_COLORS.length - 2);
      const cf = ((0.3 + t) * 4) - ci;
      const bhColor = COLLAPSE_COLORS[Math.min(ci, COLLAPSE_COLORS.length - 1)];
      const bhGlow = COLLAPSE_GLOW[Math.min(ci, COLLAPSE_GLOW.length - 1)];
      const bhColor2 = COLLAPSE_COLORS[Math.min(ci + 1, COLLAPSE_COLORS.length - 1)];
      const bhGlow2 = COLLAPSE_GLOW[Math.min(ci + 1, COLLAPSE_GLOW.length - 1)];
      const col = bhColor.clone().lerp(bhColor2, cf);
      const gl = bhGlow.clone().lerp(bhGlow2, cf);
      const starOpacity = Math.max(0, 1 - t * 2.2);
      star.setCore(freezeScale, col, gl, starOpacity * 0.6);
      star.setEnvelope(lerp(2.6, 0.15, Math.min(1, t * 3)), 0x1a0500, starOpacity * 0.08);
      star.setLayers(Math.max(0, 1 - t * 3), 0.1);
    } else {
      star.hide();
    }
  } else if (phase === "accretionDisk") {
    star.hide();
    blackHole.setIntensity(1);
  }

  star.updateShock(dt);
  particles.update(dt, phase, local, blackHole.diskTilt);
  blackHole.update(dt);

  // Lensing crece al formarse el agujero negro
  let targetLens = 0;
  if (phase === "blackHole") targetLens = easeInOut(local);
  else if (phase === "accretionDisk") targetLens = 1;
  lensingStrength = lerp(lensingStrength, targetLens, 0.06);

  if (previousPhase !== phase) {
    updateCaption(phase);
    previousPhase = phase;
  }

  const hud = computeHud(phase, local);
  updateHud(hud.tempGK, hud.coreMass, hud.neutrinos, hud.radiusKm);
  lightCurve.setMarker(phaseDay(phase, local));
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();

  if (playing && !userScrubbing) {
    globalProgress += (dt * speed) / TOTAL_DURATION;
    if (globalProgress >= 1) {
      globalProgress = 1;
      playing = false;
      playBtn.textContent = "▶ Reproducir";
    }
  }

  if (!userScrubbing) {
    timeline.value = Math.round(globalProgress * 1000);
  }

  const { key, localProgress } = getPhaseAt(globalProgress);
  updateScene(key, localProgress, dt, clock.elapsedTime);

  // Falso lensing centrado en el origen del mundo
  worldGroup.updateMatrixWorld();
  const worldOrigin = new THREE.Vector3(0, 0, 0).applyMatrix4(worldGroup.matrixWorld);
  lensing.update(camera, worldOrigin, lensingStrength, 8.5, 1.0);
  lensing.render();
}

resetSimulation();
updateCaption("supergiant");
adjustViewport();
animate();
