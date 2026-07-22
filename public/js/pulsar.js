import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ============================================
// PÚLSAR DE VELA - Animación Mejorada
// ============================================

const canvas = document.getElementById("space-canvas");
const renderer = new THREE.WebGLRenderer({ 
  canvas, 
  antialias: true, 
  alpha: false
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030308, 0.001);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 30);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 150;

// ============================================
// CONFIG
// ============================================

const PULSAR = {
  coreRadius: 1.2,
  beamLength: 50,
  beamRadius: 0.6,
};

let playing = true;
let speed = 0.1;
let audioMuted = false;
let rotationAngle = 0;

// ============================================
// ESTRELLA DE NEUTRONES - MEJORADA
// ============================================

const pulsarGroup = new THREE.Group();
scene.add(pulsarGroup);

// Core sólido brillante
const coreGeo = new THREE.SphereGeometry(PULSAR.coreRadius, 64, 64);
const coreMat = new THREE.MeshBasicMaterial({
  color: 0xeeffff,
  transparent: true,
  opacity: 1.0,
});
const core = new THREE.Mesh(coreGeo, coreMat);
pulsarGroup.add(core);

// Glow atmosférico
const glowGeo = new THREE.SphereGeometry(PULSAR.coreRadius * 1.5, 32, 32);
const glowMat = new THREE.MeshBasicMaterial({
  color: 0x88ccff,
  transparent: true,
  opacity: 0.25,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  depthWrite: false,
});
const glow = new THREE.Mesh(glowGeo, glowMat);
pulsarGroup.add(glow);

// Halo externo suave
const haloGeo = new THREE.SphereGeometry(PULSAR.coreRadius * 2.5, 32, 32);
const haloMat = new THREE.MeshBasicMaterial({
  color: 0x4466aa,
  transparent: true,
  opacity: 0.08,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  depthWrite: false,
});
const halo = new THREE.Mesh(haloGeo, haloMat);
pulsarGroup.add(halo);

// ============================================
// HACES DE RADIACIÓN - MEJORADOS
// ============================================

function createBeam(radius, length) {
  // Geometría con más segmentos para suavidad
  const geo = new THREE.CylinderGeometry(radius, radius * 0.15, length, 32, 1, true);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x99ddff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = length / 2;
  return mesh;
}

// Haz principal Norte
const beamNorth = createBeam(PULSAR.beamRadius, PULSAR.beamLength);
pulsarGroup.add(beamNorth);

// Haz principal Sur
const beamSouth = createBeam(PULSAR.beamRadius, PULSAR.beamLength);
beamSouth.rotation.x = Math.PI;
pulsarGroup.add(beamSouth);

// Haz interno brillante (núcleo del haz)
function createInnerBeam(radius, length) {
  const geo = new THREE.CylinderGeometry(radius, radius * 0.3, length, 16, 1, true);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xccffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = length / 2;
  return mesh;
}

const innerBeamNorth = createInnerBeam(PULSAR.beamRadius * 0.3, PULSAR.beamLength * 0.9);
pulsarGroup.add(innerBeamNorth);

const innerBeamSouth = createInnerBeam(PULSAR.beamRadius * 0.3, PULSAR.beamLength * 0.9);
innerBeamSouth.rotation.x = Math.PI;
pulsarGroup.add(innerBeamSouth);

// ============================================
// PARTÍCULAS EN LOS HACES
// ============================================

function createBeamParticles(count, direction) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.4;
    const y = Math.random() * PULSAR.beamLength * direction;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    velocities.push({
      y: 0.08 + Math.random() * 0.12,
      angle: angle,
      radius: radius,
    });
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xaaddff,
    size: 0.2,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return { mesh: new THREE.Points(geo, mat), velocities, direction };
}

const beamParticlesN = createBeamParticles(200, 1);
beamParticlesN.mesh.position.y = PULSAR.coreRadius;
pulsarGroup.add(beamParticlesN.mesh);

const beamParticlesS = createBeamParticles(200, -1);
beamParticlesS.mesh.position.y = -PULSAR.coreRadius;
beamParticlesS.mesh.rotation.x = Math.PI;
pulsarGroup.add(beamParticlesS.mesh);

// ============================================
// CAMPO MAGNÉTICO - LÍNEAS DE FUERZA
// ============================================

const magneticGroup = new THREE.Group();
pulsarGroup.add(magneticGroup);

function createFieldLine(radius, segments = 80) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const x = radius * Math.sin(t) * Math.cos(t * 1.2);
    const y = radius * Math.cos(t) * 0.4;
    const z = radius * Math.sin(t) * Math.sin(t * 1.2);
    points.push(new THREE.Vector3(x, y, z));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color: 0x3366aa,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Line(geo, mat);
}

for (let i = 0; i < 10; i++) {
  const line = createFieldLine(3 + i * 0.7);
  line.rotation.y = (i / 10) * Math.PI * 2;
  line.rotation.x = (i % 2) * 0.3 - 0.15;
  magneticGroup.add(line);
}

// ============================================
// ESTRELLAS DE FONDO - MEJORADAS
// ============================================

function createStarfield(count = 4000) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const radius = 60 + Math.random() * 400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Colores variados de estrellas reales
    const starType = Math.random();
    if (starType < 0.5) {
      // Blanco-azulado
      colors[i * 3] = 0.9 + Math.random() * 0.1;
      colors[i * 3 + 1] = 0.95 + Math.random() * 0.05;
      colors[i * 3 + 2] = 1.0;
    } else if (starType < 0.8) {
      // Blanco
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 1.0;
    } else if (starType < 0.92) {
      // Amarillo (tipo solar)
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 0.7;
    } else {
      // Naranja-rojo
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.7;
      colors[i * 3 + 2] = 0.5;
    }

    sizes[i] = 0.15 + Math.random() * 0.35;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });

  return new THREE.Points(geo, mat);
}

const starfield = createStarfield();
scene.add(starfield);

// ============================================
// NEBULOSA DE VELA - MEJORADA
// ============================================

function createNebula() {
  const geo = new THREE.BufferGeometry();
  const count = 1200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Distribución en capas
    const radius = 20 + Math.random() * 90;
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * 12;

    positions[i * 3] = radius * Math.cos(angle);
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = radius * Math.sin(angle);

    // Colores de nebulosa (azul-cian-violeta)
    const t = Math.random();
    const hue = 0.55 + t * 0.15;
    const rgb = new THREE.Color().setHSL(hue, 0.5, 0.3 + t * 0.2);
    colors[i * 3] = rgb.r;
    colors[i * 3 + 1] = rgb.g;
    colors[i * 3 + 2] = rgb.b;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 3.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return new THREE.Points(geo, mat);
}

const nebula = createNebula();
scene.add(nebula);

// ============================================
// ILUMINACIÓN
// ============================================

const ambientLight = new THREE.AmbientLight(0x111122, 0.25);
scene.add(ambientLight);

const pulsarLight = new THREE.PointLight(0x88ccff, 4, 120);
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
// ANIMACIÓN
// ============================================

const clock = new THREE.Clock();
let elapsedTime = 0;

function updateBeamParticles(particles, dt) {
  const positions = particles.mesh.geometry.attributes.position.array;
  const velocities = particles.velocities;

  for (let i = 0; i < velocities.length; i++) {
    const v = velocities[i];
    positions[i * 3 + 1] += v.y * dt * 40 * particles.direction;

    if (Math.abs(positions[i * 3 + 1]) > PULSAR.beamLength) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.25;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
  }
  particles.mesh.geometry.attributes.position.needsUpdate = true;
}

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();
  controls.update();

  if (playing) {
    elapsedTime += dt * speed;

    // ROTACIÓN - 1 vuelta/segundo
    rotationAngle += dt * speed * Math.PI * 2;
    pulsarGroup.rotation.y = rotationAngle;

    // Pulso suave
    const pulsePhase = (elapsedTime * 89.33) % 1;
    const pulse = 0.85 + 0.15 * Math.sin(pulsePhase * Math.PI * 2);

    coreMat.opacity = 0.9 + 0.1 * pulse;
    glowMat.opacity = 0.2 * pulse;
    haloMat.opacity = 0.06 * pulse;
    pulsarLight.intensity = 3 + 1 * pulse;

    // Barrido del haz
    const camDir = new THREE.Vector3();
    camera.getWorldPosition(camDir);
    camDir.sub(pulsarGroup.position).normalize();

    const beamDir = new THREE.Vector3(0, 1, 0);
    beamDir.applyQuaternion(pulsarGroup.quaternion);

    const beamDot = Math.abs(beamDir.dot(camDir));
    const sweep = Math.pow(beamDot, 8);

    // Intensidad de haces
    beamNorth.material.opacity = 0.8 + 0.2 * sweep;
    beamSouth.material.opacity = 0.8 + 0.2 * sweep;
    innerBeamNorth.material.opacity = 0.85 + 0.15 * sweep;
    innerBeamSouth.material.opacity = 0.85 + 0.15 * sweep;

    // Color del haz varía sutilmente
    const hue = 0.56 + 0.05 * Math.sin(elapsedTime * 0.3);
    beamNorth.material.color.setHSL(hue, 0.6, 0.65 + 0.15 * sweep);
    beamSouth.material.color.setHSL(hue, 0.6, 0.65 + 0.15 * sweep);

    // Actualizar partículas
    updateBeamParticles(beamParticlesN, dt);
    updateBeamParticles(beamParticlesS, dt);

    // Rotación sutil de nebulosa
    nebula.rotation.y += dt * 0.0004;

    // Campo magnético rota con el púlsar
    magneticGroup.rotation.y = rotationAngle * 0.15;
    magneticGroup.rotation.x = Math.sin(elapsedTime * 0.1) * 0.05;
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
