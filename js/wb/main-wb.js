import * as THREE from "three";
import { WbStar } from "./star-wb.js";
import { WbParticles } from "./particles-wb.js";
import { WbLightCurve } from "./lightcurve-wb.js";
import { updateHud } from "./hud-wb.js";
import { updateCaption } from "./captions-wb.js";
import { getPhaseAt, phaseAge, lerp, easeInOut, easeOutCubic, TOTAL_DURATION } from "./phases-wb.js";
import { createScene } from "../shared/setup.js";
import { createStarfield, updateTwinkle } from "../shared/starfield.js";
import { createGalaxies } from "../shared/background.js";

const { scene, camera, controls, composer } = createScene({
  cameraPos: [0, 0, 12],
  cameraFov: 55,
  fogColor: 0x05070a,
  fogDensity: 0.004,
  bloomStrength: 1.0,
  bloomRadius: 0.85,
  bloomThreshold: 0.35,
});

const worldGroup = new THREE.Group();
scene.add(worldGroup);

const sf = createStarfield(worldGroup, 2500);
createGalaxies(worldGroup, 24);

const star = new WbStar(worldGroup);
const particles = new WbParticles(worldGroup);
const lightCurve = new WbLightCurve("lightcurve-svg");

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
  star.show();
  star.setCore(1, 0xffdd66, 0xffcc44, 0.22);
  star.setEnvelope(1, 0xff6633, 0);
  camera.position.set(0, 0, 12);
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

window.addEventListener("resize", adjustViewport);

function computeHud(phase, local) {
  const age = phaseAge(phase, local);
  let temp, lum, radius;
  switch (phase) {
    case "mainSequence":
      temp = 5800;
      lum = lerp(1, 2, local);
      radius = 1;
      break;
    case "redGiant": {
      const t = easeInOut(local);
      temp = lerp(5800, 3200, t);
      lum = lerp(2, 2300, t);
      radius = lerp(1, 150, t);
      break;
    }
    case "heliumFlash": {
      const t = easeOutCubic(local);
      temp = lerp(3200, 4500, t);
      lum = lerp(2300, 60, t);
      radius = lerp(150, 12, t);
      break;
    }
    case "agb": {
      const t = easeInOut(local);
      temp = lerp(4500, 2800, t);
      lum = lerp(60, 5000, t);
      radius = lerp(12, 250, t);
      break;
    }
    case "planetaryNebula": {
      const t = easeInOut(local);
      temp = lerp(2800, 120000, t);
      lum = lerp(5000, 100, t);
      radius = lerp(250, 0.012, t);
      break;
    }
    case "whiteDwarf":
      temp = lerp(120000, 4000, easeInOut(local));
      lum = lerp(100, 1e-4, easeInOut(local));
      radius = lerp(0.012, 0.0086, local);
      break;
    default:
      temp = 5800; lum = 1; radius = 1;
  }
  return { temp, lum, radius, age };
}

function updateScene(phase, local, dt, totalTime) {
  // Camera per phase (OrbitControls handles orientation)
  let targetZ = 12;
  if (phase === "redGiant") targetZ = lerp(12, 26, local);
  else if (phase === "heliumFlash") targetZ = lerp(26, 18, local);
  else if (phase === "agb") targetZ = lerp(18, 30, local);
  else if (phase === "planetaryNebula") targetZ = lerp(30, 36, local);
  else if (phase === "whiteDwarf") targetZ = lerp(36, 22, local);
  camera.position.z = lerp(camera.position.z, targetZ, 0.03);

  star.show();

  if (phase === "mainSequence") {
    star.setCore(1, 0xffdd66, 0xffcc44, 0.22);
    star.setEnvelope(1, 0xff6633, 0);
    star.pulse(totalTime, 0.015);
  } else if (phase === "redGiant") {
    const t = easeInOut(local);
    star.setCore(lerp(1, 0.35, t), 0xfff3cc, 0xffeeaa, 0.25);
    star.setEnvelope(lerp(1, 7.5, t), 0xff6633, lerp(0, 0.28, t));
    star.pulse(totalTime, 0.02);
  } else if (phase === "heliumFlash") {
    const t = easeOutCubic(local);
    // Brief intense flash then settles
    const flash = local < 0.3 ? Math.sin((local / 0.3) * Math.PI) : 0;
    star.setCore(lerp(0.35, 0.5, t) * (1 + flash * 0.6), 0xffffff, 0xffffee, 0.25 + flash * 0.5);
    star.setEnvelope(lerp(7.5, 3, t), 0xff8844, lerp(0.28, 0.15, t));
  } else if (phase === "agb") {
    const t = easeInOut(local);
    star.setCore(lerp(0.5, 0.3, t), 0xfff3cc, 0xffeeaa, 0.25);
    star.setEnvelope(lerp(3, 9, t), 0xcc3311, lerp(0.15, 0.3, t));
    star.pulseEnvelope(totalTime, 0.06 + t * 0.06); // Mira-like pulsations
    star.pulse(totalTime, 0.05);
  } else if (phase === "planetaryNebula") {
    const t = easeInOut(local);
    star.setCore(lerp(0.3, 0.22, t), 0xe8f4ff, 0x99ccff, lerp(0.25, 0.55, t));
    star.setEnvelope(lerp(9, 12, t), 0xcc3311, Math.max(0, 0.3 - t * 0.35));
  } else if (phase === "whiteDwarf") {
    const t = easeInOut(local);
    // Cooling: blue-white -> yellow -> reddish
    const color = new THREE.Color().lerpColors(
      new THREE.Color(0xe8f4ff), new THREE.Color(0xff7744), Math.min(1, t * 1.15)
    );
    const glowColor = new THREE.Color().lerpColors(
      new THREE.Color(0x99ccff), new THREE.Color(0xcc5522), Math.min(1, t * 1.15)
    );
    star.setCore(0.22, color, glowColor, lerp(0.55, 0.15, t));
    star.setEnvelope(12, 0xcc3311, 0);
  }

  particles.update(dt, phase, local);

  if (previousPhase !== phase) {
    updateCaption(phase);
    previousPhase = phase;
  }

  const hud = computeHud(phase, local);
  updateHud(hud.temp, hud.lum, hud.radius, hud.age);
  lightCurve.setMarker(hud.age);
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

  updateTwinkle(sf, clock.elapsedTime);
  const { key, localProgress } = getPhaseAt(globalProgress);
  updateScene(key, localProgress, dt, clock.elapsedTime);

  controls.update();
  composer.render();
}

resetSimulation();
updateCaption("mainSequence");
adjustViewport();
animate();
