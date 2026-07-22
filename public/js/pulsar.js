import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const canvas = document.getElementById("space-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020205, 0.003);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(10, 8, 40);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 150;
controls.enablePan = true;
controls.target.set(0, 0, 0);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.8,
  1.0,
  0.08
);
composer.addPass(bloomPass);

// ============================================
// CONFIGURACIÓN
// ============================================

const PULSAR = {
  frequency: 89.33,
  neutronStarRadius: 1.2,
  beamLength: 500,
  tiltAngle: 0.28,
  beamTilt: 0.15,
};

let playing = true;
let speed = 1;
let audioMuted = false;
let rotationAngle = 0;

// ============================================
// JERARQUÍA DE GRUPOS
// ============================================
// containerGroup: tilt fijo (rotation.z) – NO se modifica en animate
//   pulsarGroup: rotación Y – se modifica en animate
//     beamGroup: tilt del haz (rotation.x) – para que barra como faro
//       coreBeams: los dos palitos que barren
// ============================================

const containerGroup = new THREE.Group();
containerGroup.rotation.z = PULSAR.tiltAngle;
scene.add(containerGroup);

const pulsarGroup = new THREE.Group();
containerGroup.add(pulsarGroup);

// ============================================
// ESTRELLA DE NEUTRONES
// ============================================

const coreGeometry = new THREE.SphereGeometry(PULSAR.neutronStarRadius, 80, 80);
const coreMaterial = new THREE.MeshBasicMaterial({
  color: 0x99ccff,
  transparent: true,
  opacity: 1.0,
});
const core = new THREE.Mesh(coreGeometry, coreMaterial);
pulsarGroup.add(core);



// ============================================
// HACES DE LUZ – EFECTO ASPERSOR
// ============================================
// El haz está inclinado (beamGroup.rotation.x = beamTilt) dentro de pulsarGroup.
// Cuando pulsarGroup rota en Y, el haz barre como un faro.
// Los fotones viajan en línea recta desde donde apuntaba el haz en el momento de emisión.
// ============================================

const beamGroup = new THREE.Group();
beamGroup.rotation.x = PULSAR.beamTilt;
pulsarGroup.add(beamGroup);

function createCoreBeam(color, direction = 1) {
  const length = PULSAR.beamLength * 0.6;
  const rBase = 0.05;
  const rTip = 3.0;
  const rTop = direction > 0 ? rTip : rBase;
  const rBot = direction > 0 ? rBase : rTip;
  const geometry = new THREE.CylinderGeometry(rTop, rBot, length, 48, 1, false);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 1.0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = direction * length / 2;
  return mesh;
}

const coreBeamNorth = createCoreBeam(0x99ccff, 1);
beamGroup.add(coreBeamNorth);

const coreBeamSouth = createCoreBeam(0x99ccff, -1);
beamGroup.add(coreBeamSouth);

function createBeamGlow(direction = 1) {
  const length = PULSAR.beamLength * 0.6;
  const rBase = 0.15;
  const rTip = 3.5;
  const rTop = direction > 0 ? rTip : rBase;
  const rBot = direction > 0 ? rBase : rTip;
  const geo = new THREE.CylinderGeometry(rTop, rBot, length, 32, 8, true);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const color = new THREE.Color(0xb0d0ff);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = (y + length / 2) / length;
    const fade = direction > 0 ? t : 1 - t;
    const intensity = 0.01 + 0.12 * Math.pow(fade, 0.5);
    colors[i * 3] = color.r * intensity;
    colors[i * 3 + 1] = color.g * intensity;
    colors[i * 3 + 2] = color.b * intensity;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = direction * length / 2;
  return mesh;
}

const beamGlowNorth = createBeamGlow(1);
beamGroup.add(beamGlowNorth);

const beamGlowSouth = createBeamGlow(-1);
beamGroup.add(beamGlowSouth);

function createBaseGlow(direction = 1) {
  const geo = new THREE.SphereGeometry(0.35, 16, 16);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xccddff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = direction * 0.1;
  return mesh;
}

const baseGlowNorth = createBaseGlow(1);
beamGroup.add(baseGlowNorth);

const baseGlowSouth = createBaseGlow(-1);
beamGroup.add(baseGlowSouth);

// ============================================
// ESTRELLAS DE FONDO
// ============================================

const starData = [];
function createStarfield(count = 5000) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const radius = 60 + Math.random() * 500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const starType = Math.random();
    if (starType < 0.45) {
      colors[i * 3] = 0.9 + Math.random() * 0.1;
      colors[i * 3 + 1] = 0.95 + Math.random() * 0.05;
      colors[i * 3 + 2] = 1.0;
    } else if (starType < 0.75) {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 1.0;
    } else if (starType < 0.9) {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.85;
      colors[i * 3 + 2] = 0.6;
    } else {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.65;
      colors[i * 3 + 2] = 0.45;
    }

    const baseSize = 0.1 + Math.random() * 0.4;
    sizes[i] = baseSize;
    starData.push({
      baseSize,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 1.5,
    });
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

const starfield = createStarfield();
scene.add(starfield);

// ============================================
// ILUMINACIÓN
// ============================================

const ambientLight = new THREE.AmbientLight(0x111122, 0.3);
scene.add(ambientLight);

const pulsarLight = new THREE.PointLight(0xcce0ff, 8, 300);
pulsarLight.position.set(0, 0, 0);
scene.add(pulsarLight);

const beamLight = new THREE.SpotLight(0xdde8ff, 6, 400, Math.PI * 0.12, 0.4, 1.5);
beamLight.target.position.set(0, 1, 0);
beamGroup.add(beamLight);
beamGroup.add(beamLight.target);

// ============================================
// AUDIO
// ============================================

let audioContext = null;
let audioSource = null;
let audioBuffer = null;
let audioGain = null;
let audioPanner = null;
let proximityGain = null;
let distortionNode = null;

async function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioGain = audioContext.createGain();
    audioGain.gain.value = 0.35;

    audioPanner = audioContext.createPanner();
    audioPanner.panningModel = "HRTF";
    audioPanner.distanceModel = "inverse";
    audioPanner.refDistance = 50;
    audioPanner.maxDistance = 300;
    audioPanner.rolloffFactor = 0.5;
    audioPanner.positionX.value = 0;
    audioPanner.positionY.value = 0;
    audioPanner.positionZ.value = 0;

    proximityGain = audioContext.createGain();
    proximityGain.gain.value = 1;

    distortionNode = audioContext.createWaveShaper();
    distortionNode.curve = makeDistortionCurve(0);
    distortionNode.oversample = "2x";

    const response = await fetch("audio/vela-pulsar-sound.ogg");
    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error("Error audio:", error);
  }
}

function makeDistortionCurve(amount) {
  const samples = 256;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 2 - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  return curve;
}

function playAudio() {
  if (!audioBuffer || !audioContext || !audioPanner) return;
  if (audioContext.state === "suspended") audioContext.resume();

  audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  audioSource.loop = true;
  audioSource.connect(audioGain);
  audioGain.connect(proximityGain);
  proximityGain.connect(distortionNode);
  distortionNode.connect(audioPanner);
  audioPanner.connect(audioContext.destination);
  audioSource.start(0);
}

function updateAudioListener() {
  if (!audioContext || !camera) return;
  const pos = new THREE.Vector3();
  camera.getWorldPosition(pos);
  audioContext.listener.positionX.value = pos.x;
  audioContext.listener.positionY.value = pos.y;
  audioContext.listener.positionZ.value = -pos.z;

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  audioContext.listener.forwardX.value = dir.x;
  audioContext.listener.forwardY.value = dir.y;
  audioContext.listener.forwardZ.value = -dir.z;

  const up = camera.up.clone();
  up.applyQuaternion(camera.quaternion);
  audioContext.listener.upX.value = up.x;
  audioContext.listener.upY.value = up.y;
  audioContext.listener.upZ.value = up.z;

  const dist = pos.length();
  const boost = Math.min(4, 40 / Math.max(dist, 1));
  const amount = Math.min(0.6, Math.max(0, (15 - dist) / 15));
  if (proximityGain) proximityGain.gain.value = boost;
  if (distortionNode) distortionNode.curve = makeDistortionCurve(amount);
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
  playBtn.textContent = playing ? "\u23F8 Pausar" : "\u25B6 Reproducir";
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
    muteBtn.textContent = "🔇 Sonido";
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

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();
  controls.update();
  updateAudioListener();

  if (playing) {
    elapsedTime += dt * speed;

    rotationAngle += dt * speed * Math.PI * 2 * 7;
    pulsarGroup.rotation.y = rotationAngle;

    const pulsePhase = (elapsedTime * PULSAR.frequency) % 1;
    const pulse = 0.85 + 0.15 * Math.sin(pulsePhase * Math.PI * 2);

    coreMaterial.opacity = 0.9 + 0.1 * pulse;

    // Barrido del haz hacia la cámara
    const camDir = new THREE.Vector3();
    camera.getWorldPosition(camDir);
    camDir.sub(containerGroup.position).normalize();

    const beamDir = new THREE.Vector3(0, 1, 0);
    beamDir.applyQuaternion(beamGroup.quaternion);
    beamDir.applyQuaternion(pulsarGroup.quaternion);

    const beamDot = Math.abs(beamDir.dot(camDir));
    const sweep = Math.pow(beamDot, 10);
    const lightSurge = 0.3 + 0.7 * sweep;

    pulsarLight.intensity = (4 + 2 * pulse) * lightSurge;
    beamLight.intensity = 6 * lightSurge;

    coreBeamNorth.material.opacity = 0.75 + 0.25 * sweep;
    coreBeamSouth.material.opacity = 0.75 + 0.25 * sweep;

    // Parpadeo de estrellas
    const starSizes = starfield.geometry.attributes.size.array;
    for (let i = 0; i < starData.length; i++) {
      const s = starData[i];
      starSizes[i] = s.baseSize * (0.6 + 0.4 * Math.sin(elapsedTime * s.speed + s.phase));
    }
    starfield.geometry.attributes.size.needsUpdate = true;
  }

  composer.render();
}

// ============================================
// RESIZE
// ============================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
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
