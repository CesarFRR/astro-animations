import * as THREE from "three";
import { Star } from "./star.js";
import { ParticleManager } from "./particles.js";
import { Explosion } from "./explosion.js";
import { LightCurve } from "./lightcurve.js";
import { updateHud } from "./hud.js";
import { updateCaption } from "./captions.js";
import { getPhaseAt, lerp, easeInOut, easeOutCubic, easeInCubic, TOTAL_DURATION } from "./phases.js";
import { createStarfield, createGalaxies } from "./shared/background.js";

const canvas = document.getElementById("space-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05070a, 0.012);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 18);

// Mobile viewport adjustment group
const worldGroup = new THREE.Group();
scene.add(worldGroup);

createStarfield(worldGroup, 2500);
createGalaxies(worldGroup, 24);

const star = new Star(worldGroup);
const particles = new ParticleManager(worldGroup);
const explosion = new Explosion(worldGroup);
const lightCurve = new LightCurve("lightcurve-svg");

let globalProgress = 0;
let playing = true;
let speed = 1;
let userScrubbing = false;
let previousPhase = null;

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
  explosion.reset();
  star.show();
  star.setCoreScale(1);
  star.setEnvelopeScale(1);
  star.setOpacity(0.55);
  camera.position.set(0, 0, 18);
}

// Adjust star position/scale for mobile viewports so the UI doesn't hide it
function adjustViewport() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;

  if (w <= 600) {
    // Small phones: shift scene up and scale it up a bit
    worldGroup.position.y = 2.2;
    worldGroup.scale.setScalar(aspect < 0.55 ? 1.25 : 1.15);
  } else if (w <= 768) {
    // Tablets / large phones
    worldGroup.position.y = 1.6;
    worldGroup.scale.setScalar(1.08);
  } else if (w <= 1024) {
    // Small laptops / tablets landscape
    worldGroup.position.y = 0.6;
    worldGroup.scale.setScalar(1.02);
  } else {
    // Desktop: default
    worldGroup.position.y = 0;
    worldGroup.scale.setScalar(1);
  }
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  adjustViewport();
});

function computeHudValues(phase, local) {
  let temp = 0.3;
  let pressure = 100;
  let pairs = 0;
  let luminosity = 0.05;

  switch (phase) {
    case "equilibrium": {
      const t = local;
      temp = lerp(0.3, 1.2, t);
      pressure = 100;
      pairs = 0;
      luminosity = 0.05 + t * 0.05;
      break;
    }
    case "pairProduction": {
      const t = local;
      temp = lerp(1.2, 2.0, t);
      pressure = lerp(100, 82, t);
      pairs = lerp(0, 25, t);
      luminosity = 0.1 + t * 0.05;
      break;
    }
    case "collapse": {
      const t = easeInCubic(local);
      temp = lerp(2.0, 4.5, t);
      pressure = lerp(82, 25, t);
      pairs = lerp(25, 90, t);
      luminosity = 0.15 + t * 0.1;
      break;
    }
    case "thermonuclear": {
      const t = easeOutCubic(local);
      temp = lerp(4.5, 5.0, t);
      pressure = lerp(25, 200, t); // pressure from fusion blast
      pairs = lerp(90, 30, t);
      luminosity = lerp(0.25, 1.5, t);
      break;
    }
    case "explosion": {
      const t = local;
      temp = lerp(5.0, 3.0, t);
      pressure = lerp(200, 80, t);
      pairs = lerp(30, 5, t);
      luminosity = lerp(1.5, 1.0, t);
      break;
    }
    case "remnant": {
      const t = local;
      temp = lerp(3.0, 1.0, t);
      pressure = lerp(80, 10, t);
      pairs = 0;
      luminosity = lerp(1.0, 0.15, t);
      break;
    }
  }

  return { temp, pressure, pairs, luminosity };
}

function updateScene(phase, local, dt, totalTime) {
  // Camera motion: pull back during explosion/remnant
  let targetZ = 18;
  if (phase === "explosion") targetZ = lerp(18, 32, local);
  else if (phase === "remnant") targetZ = lerp(32, 48, local);
  camera.position.z = lerp(camera.position.z, targetZ, 0.03);
  camera.position.x = Math.sin(totalTime * 0.08) * 0.5;
  camera.position.y = Math.cos(totalTime * 0.06) * 0.3;
  camera.lookAt(0, 0, 0);

  // Star behavior per phase
  if (phase === "equilibrium") {
    star.show();
    star.setCoreScale(1);
    star.setEnvelopeScale(1);
    star.setOpacity(0.55);
    star.pulse(totalTime, 0.02);
    star.setColor(0);
  } else if (phase === "pairProduction") {
    star.show();
    star.setCoreScale(lerp(1, 0.95, local));
    star.setEnvelopeScale(lerp(1, 0.97, local));
    star.setOpacity(lerp(0.55, 0.45, local));
    star.setColor(local * 0.3);
  } else if (phase === "collapse") {
    star.show();
    const t = easeInOut(local);
    star.setCoreScale(lerp(0.95, 0.45, t));
    star.setEnvelopeScale(lerp(0.97, 0.75, t));
    star.setOpacity(lerp(0.45, 0.3, t));
    star.setColor(0.3 + t * 0.4);
  } else if (phase === "thermonuclear") {
    star.show();
    const t = easeOutCubic(local);
    star.setCoreScale(lerp(0.45, 1.4, t));
    star.setEnvelopeScale(lerp(0.75, 1.05, t));
    star.setOpacity(lerp(0.3, 0.9, t));
    star.setColor(0.7 + t * 0.3);
    // Spawn fusion sparkles occasionally handled in particles
  } else if (phase === "explosion") {
    star.show();
    star.setEnvelopeScale(lerp(1.05, 2.5, local));
    star.setOpacity(lerp(0.9, 0, Math.min(local * 1.5, 1)));
    star.setCoreScale(lerp(1.4, 0.1, local));
    if (previousPhase !== "explosion") {
      explosion.start();
      particles.spawnEjecta(3000, 1.4, 0.35);
      particles.spawnNickel(800, 1.2);
    }
  } else if (phase === "remnant") {
    star.hide();
  }

  particles.setOpacity(phase);
  particles.update(dt, local, phase);
  explosion.update(dt, phase, local);

  // Phase caption only on change
  if (previousPhase !== phase) {
    updateCaption(phase);
    previousPhase = phase;
  }

  // HUD values
  const hud = computeHudValues(phase, local);
  updateHud(hud.temp, hud.pressure, hud.pairs, hud.luminosity);

  // Light curve marker
  lightCurve.setMarker(globalProgress);
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

  renderer.render(scene, camera);
}

resetSimulation();
updateCaption("equilibrium");
adjustViewport();
animate();
