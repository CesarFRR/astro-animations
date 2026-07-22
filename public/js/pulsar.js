import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ============================================
// PÚLSAR DE VELA - Rotación Real 89.33 Hz
// ============================================

const canvas = document.getElementById("space-canvas");
const renderer = new THREE.WebGLRenderer({ 
  canvas, 
  antialias: true, 
  alpha: false
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020208, 0.002);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 35);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 150;

// ============================================
// CONFIG
// ============================================

const PULSAR = {
  frequency: 89.33,
  rotationSpeed: Math.PI * 2 * 89.33,
  coreRadius: 1.2,
  beamLength: 50,
  beamRadius: 0.6,
};

let playing = true;
let speed = 0.1;
let audioMuted = false;
let rotationAngle = 0;

// ============================================
// ESTRELLA DE NEUTRONES
// ============================================

const pulsarGroup = new THREE.Group();
scene.add(pulsarGroup);

// Core
const coreGeo = new THREE.SphereGeometry(PULSAR.coreRadius, 64, 64);
const coreMat = new THREE.MeshBasicMaterial({
  color: 0xccddff,
  transparent: true,
  opacity: 1.0,
});
const core = new THREE.Mesh(coreGeo, coreMat);
pulsarGroup.add(core);

// Glow suave
const glowGeo = new THREE.SphereGeometry(PULSAR.coreRadius * 1.4, 32, 32);
const glowMat = new THREE.MeshBasicMaterial({
  color: 0x6688cc,
  transparent: true,
  opacity: 0.2,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  depthWrite: false,
});
const glow = new THREE.Mesh(glowGeo, glowMat);
pulsarGroup.add(glow);

// ============================================
// HACES - RECTOS Y BRILLANTES
// ============================================

function createBeam(radius, length) {
  const geo = new THREE.CylinderGeometry(radius, radius * 0.2, length, 16, 1, true);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = length / 2;
  return mesh;
}

const beamNorth = createBeam(PULSAR.beamRadius, PULSAR.beamLength);
pulsarGroup.add(beamNorth);

const beamSouth = createBeam(PULSAR.beamRadius, PULSAR.beamLength);
beamSouth.rotation.x = Math.PI;
pulsarGroup.add(beamSouth);

// ============================================
// ESTRELLAS DE FONDO - SUTILES
// ============================================

function createStarfield(count = 3000) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const radius = 80 + Math.random() * 300;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const brightness = 0.4 + Math.random() * 0.6;
    colors[i * 3] = brightness;
    colors[i * 3 + 1] = brightness;
    colors[i * 3 + 2] = brightness + Math.random() * 0.15;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
  });

  return new THREE.Points(geo, mat);
}

const starfield = createStarfield();
scene.add(starfield);

// ============================================
// NEBULOSA SUTIL
// ============================================

function createNebula() {
  const geo = new THREE.BufferGeometry();
  const count = 800;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const radius = 25 + Math.random() * 70;
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * 8;

    positions[i * 3] = radius * Math.cos(angle);
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = radius * Math.sin(angle);

    const t = Math.random();
    colors[i * 3] = 0.1 + t * 0.2;
    colors[i * 3 + 1] = 0.15 + t * 0.25;
    colors[i * 3 + 2] = 0.4 + t * 0.4;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 3.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return new THREE.Points(geo, mat);
}

const nebula = createNebula();
scene.add(nebula);

// ============================================
// LUZ
// ============================================

const ambientLight = new THREE.AmbientLight(0x111122, 0.3);
scene.add(ambientLight);

const pulsarLight = new THREE.PointLight(0x88ccff, 3, 100);
pulsarLight.position.set(0, 0, 0);
scene.add(pulsarLight);

// ============================================
// AUDIO
// ============================================

let audioContext = null;
let audioSource = null;
let audioBuffer = null;
let audioGain = null;

async function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioGain = audioContext.createGain();
    audioGain.gain.value = 0.35;

    const response = await fetch("audio/vela-pulsar-sound.ogg");
    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error("Error audio:", error);
  }
}

function playAudio() {
  if (!audioBuffer || !audioContext) return;
  if (audioContext.state === "suspended") audioContext.resume();

  audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  audioSource.loop = true;
  audioSource.connect(audioGain);
  audioGain.connect(audioContext.destination);
  audioSource.start(0);
}

function stopAudio() {
  if (audioSource) {
    audioSource.stop();
    audioSource = null;
  }
}

// ============================================
// CONTROLES
// ============================================

const playBtn = document.getElementById("btn-play");
const muteBtn = document.getElementById("btn-mute");
const speedSelect = document.getElementById("speed");

playBtn.addEventListener("click", () => {
  playing = !playing;
  playBtn.textContent = playing ? "⏸ Pausar" : "▶ Reproducir";
});

muteBtn.addEventListener("click", () => {
  if (!audioContext || !audioBuffer) return;
  if (audioMuted) {
    playAudio();
    audioMuted = false;
    muteBtn.textContent = "🔊 Sonido";
  } else {
    stopAudio();
    audioMuted = true;
    muteBtn.textContent = "🔇 Mudo";
  }
});

speedSelect.addEventListener("change", (e) => {
  speed = parseFloat(e.target.value);
});

// ============================================
// ANIMACIÓN - ROTACIÓN REAL
// ============================================

const clock = new THREE.Clock();
let elapsedTime = 0;

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();
  controls.update();

  if (playing) {
    elapsedTime += dt * speed;

    // ROTACIÓN REAL - 89.33 Hz
    rotationAngle += dt * speed * PULSAR.rotationSpeed;
    pulsarGroup.rotation.y = rotationAngle;

    // Pulso suave
    const pulsePhase = (elapsedTime * PULSAR.frequency) % 1;
    const pulse = 0.85 + 0.15 * Math.sin(pulsePhase * Math.PI * 2);

    coreMat.opacity = 0.9 + 0.1 * pulse;
    glowMat.opacity = 0.15 * pulse;
    pulsarLight.intensity = 2 + 1 * pulse;

    // Barrido
    const camDir = new THREE.Vector3();
    camera.getWorldPosition(camDir);
    camDir.sub(pulsarGroup.position).normalize();

    const beamDir = new THREE.Vector3(0, 1, 0);
    beamDir.applyQuaternion(pulsarGroup.quaternion);

    const beamDot = Math.abs(beamDir.dot(camDir));
    const sweep = Math.pow(beamDot, 6);

    beamNorth.material.opacity = 0.75 + 0.25 * sweep;
    beamSouth.material.opacity = 0.75 + 0.25 * sweep;

    // Nebulosa rota muy lento
    nebula.rotation.y += dt * 0.0003;
  }

  renderer.render(scene, camera);
}

// ============================================
// RESIZE
// ============================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================
// INICIO
// ============================================

async function start() {
  await initAudio();
  if (audioBuffer && audioContext) {
    playAudio();
  }
  animate();
}

start();
