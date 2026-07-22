import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

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
renderer.toneMappingExposure = 1.3;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020205, 0.003);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 10, 35);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 150;
controls.enablePan = true;
controls.target.set(0, 0, 0);

// ============================================
// POST-PROCESADO - BLOOM
// ============================================

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.2,    // strength
  0.6,    // radius
  0.2     // threshold
);
composer.addPass(bloomPass);

// ============================================
// CONFIGURACIÓN
// ============================================

const PULSAR = {
  frequency: 89.33,
  neutronStarRadius: 1.2,
  beamLength: 25,
  beamRadius: 0.35,
  beamCurve: 4.0,
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

// Core sólido
const coreGeometry = new THREE.SphereGeometry(PULSAR.neutronStarRadius, 64, 64);
const coreMaterial = new THREE.MeshBasicMaterial({
  color: 0xeeffff,
  transparent: true,
  opacity: 1.0,
});
const core = new THREE.Mesh(coreGeometry, coreMaterial);
pulsarGroup.add(core);

// Glow atmosférico
const glowGeometry = new THREE.SphereGeometry(PULSAR.neutronStarRadius * 1.5, 32, 32);
const glowMaterial = new THREE.MeshBasicMaterial({
  color: 0x88ccff,
  transparent: true,
  opacity: 0.35,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  depthWrite: false,
});
const glow = new THREE.Mesh(glowGeometry, glowMaterial);
pulsarGroup.add(glow);

// Halo externo
const haloGeometry = new THREE.SphereGeometry(PULSAR.neutronStarRadius * 2.2, 32, 32);
const haloMaterial = new THREE.MeshBasicMaterial({
  color: 0x4466aa,
  transparent: true,
  opacity: 0.1,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  depthWrite: false,
});
const halo = new THREE.Mesh(haloGeometry, haloMaterial);
pulsarGroup.add(halo);

// ============================================
// HACES DE RADIACIÓN - CURVADOS
// ============================================

function createCurvedBeam(color, direction = 1) {
  const curvePoints = [];
  const segments = 40;
  const length = PULSAR.beamLength;
  const curveAmount = PULSAR.beamCurve;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * length * direction;
    // Curva que se ensancha y curva como chorro
    const curveFactor = Math.pow(t, 1.5) * curveAmount;
    const x = Math.sin(t * Math.PI * 0.5) * curveFactor;
    const z = Math.cos(t * Math.PI * 0.3) * curveFactor * 0.4;
    curvePoints.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const radiusFunction = (t) => {
    const base = 0.08;
    const expansion = Math.pow(t, 2) * PULSAR.beamRadius;
    return base + expansion;
  };

  const tubeSegments = 50;
  const radialSegments = 16;
  const frames = curve.computeFrenetFrames(tubeSegments, false);
  
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= tubeSegments; i++) {
    const t = i / tubeSegments;
    const radius = radiusFunction(t);
    const point = curve.getPointAt(t);
    const normal = frames.normals[Math.min(i, tubeSegments - 1)];
    const binormal = frames.binormals[Math.min(i, tubeSegments - 1)];

    for (let j = 0; j <= radialSegments; j++) {
      const angle = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);

      const vertex = new THREE.Vector3();
      vertex.x = point.x + radius * (cos * normal.x + sin * binormal.x);
      vertex.y = point.y + radius * (cos * normal.y + sin * binormal.y);
      vertex.z = point.z + radius * (cos * normal.z + sin * binormal.z);
      vertices.push(vertex.x, vertex.y, vertex.z);

      const normalVec = new THREE.Vector3(
        cos * normal.x + sin * binormal.x,
        cos * normal.y + sin * binormal.y,
        cos * normal.z + sin * binormal.z
      ).normalize();
      normals.push(normalVec.x, normalVec.y, normalVec.z);

      uvs.push(t, j / radialSegments);
    }
  }

  for (let i = 0; i < tubeSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = a + radialSegments + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  return new THREE.Mesh(geometry, material);
}

// Haz Norte
const beamNorth = createCurvedBeam(0x88ccff, 1);
pulsarGroup.add(beamNorth);

// Haz Sur
const beamSouth = createCurvedBeam(0x88ccff, -1);
pulsarGroup.add(beamSouth);

// Haz interno (más brillante)
function createInnerBeam(color, direction = 1) {
  const curvePoints = [];
  const segments = 30;
  const length = PULSAR.beamLength * 0.85;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * length * direction;
    const x = Math.sin(t * Math.PI * 0.4) * PULSAR.beamCurve * 0.25;
    curvePoints.push(new THREE.Vector3(x, y, 0));
  }

  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const geometry = new THREE.TubeGeometry(curve, 30, 0.06, 8, false);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return new THREE.Mesh(geometry, material);
}

const innerBeamNorth = createInnerBeam(0xccffff, 1);
pulsarGroup.add(innerBeamNorth);

const innerBeamSouth = createInnerBeam(0xccffff, -1);
pulsarGroup.add(innerBeamSouth);

// ============================================
// PARTÍCULAS EN EL HAZ
// ============================================

function createBeamParticles(count = 250) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.35;
    const y = Math.random() * PULSAR.beamLength;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    velocities.push({
      y: 0.12 + Math.random() * 0.2,
      angle: angle,
      radius: radius,
    });
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xaaddff,
    size: 0.18,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return { mesh: new THREE.Points(geometry, material), velocities };
}

const beamParticlesNorth = createBeamParticles(200);
beamParticlesNorth.mesh.position.y = PULSAR.neutronStarRadius;
pulsarGroup.add(beamParticlesNorth.mesh);

const beamParticlesSouth = createBeamParticles(200);
beamParticlesSouth.mesh.position.y = -PULSAR.neutronStarRadius;
beamParticlesSouth.mesh.rotation.x = Math.PI;
pulsarGroup.add(beamParticlesSouth.mesh);

// ============================================
// ESTRELLAS DE FONDO - MEJORADAS
// ============================================

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

    // Colores de estrellas reales
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

    sizes[i] = 0.1 + Math.random() * 0.4;
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
// NEBULOSA DE VELA
// ============================================

function createNebula() {
  const geometry = new THREE.BufferGeometry();
  const count = 1000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const radius = 20 + Math.random() * 80;
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * 10;

    positions[i * 3] = radius * Math.cos(angle);
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = radius * Math.sin(angle);

    const t = Math.random();
    const hue = 0.55 + t * 0.12;
    const rgb = new THREE.Color().setHSL(hue, 0.4, 0.25 + t * 0.15);
    colors[i * 3] = rgb.r;
    colors[i * 3 + 1] = rgb.g;
    colors[i * 3 + 2] = rgb.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 4.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

const nebula = createNebula();
scene.add(nebula);

// ============================================
// ILUMINACIÓN
// ============================================

const ambientLight = new THREE.AmbientLight(0x111122, 0.3);
scene.add(ambientLight);

const pulsarLight = new THREE.PointLight(0x88ccff, 5, 150);
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

function updateBeamParticles(particles, dt, direction) {
  const positions = particles.mesh.geometry.attributes.position.array;
  const velocities = particles.velocities;

  for (let i = 0; i < velocities.length; i++) {
    const v = velocities[i];
    positions[i * 3 + 1] += v.y * dt * 50 * direction;

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

    // Pulso sincronizado
    const pulsePhase = (elapsedTime * PULSAR.frequency) % 1;
    const pulse = 0.85 + 0.15 * Math.sin(pulsePhase * Math.PI * 2);

    coreMaterial.opacity = 0.9 + 0.1 * pulse;
    glowMaterial.opacity = 0.3 * pulse;
    haloMaterial.opacity = 0.08 * pulse;
    pulsarLight.intensity = 4 + 2 * pulse;

    // Barrido del haz hacia cámara
    const camDir = new THREE.Vector3();
    camera.getWorldPosition(camDir);
    camDir.sub(pulsarGroup.position).normalize();

    const beamDir = new THREE.Vector3(0, 1, 0);
    beamDir.applyQuaternion(pulsarGroup.quaternion);

    const beamDot = Math.abs(beamDir.dot(camDir));
    const sweep = Math.pow(beamDot, 10);

    // Intensidad de haces
    beamNorth.material.opacity = 0.75 + 0.25 * sweep;
    beamSouth.material.opacity = 0.75 + 0.25 * sweep;
    innerBeamNorth.material.opacity = 0.85 + 0.15 * sweep;
    innerBeamSouth.material.opacity = 0.85 + 0.15 * sweep;

    // Color del haz varía sutilmente
    const hue = 0.56 + 0.04 * Math.sin(elapsedTime * 0.4);
    beamNorth.material.color.setHSL(hue, 0.65, 0.7 + 0.2 * sweep);
    beamSouth.material.color.setHSL(hue, 0.65, 0.7 + 0.2 * sweep);

    // Actualizar partículas
    updateBeamParticles(beamParticlesNorth, dt, 1);
    updateBeamParticles(beamParticlesSouth, dt, -1);

    // Rotación sutil de nebulosa
    nebula.rotation.y += dt * 0.0003;
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
