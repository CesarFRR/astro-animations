import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ============================================
// PÚLSAR DE VELA - Animación 3D Interactiva
// ============================================

const canvas = document.getElementById("space-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05070a, 0.005);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 12, 30);

// OrbitControls - interacción con mouse
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 8;
controls.maxDistance = 100;
controls.enablePan = true;
controls.autoRotate = false;
controls.target.set(0, 0, 0);

// ============================================
// CONFIGURACIÓN DEL PÚLSAR - DATOS REALES
// ============================================

const PULSAR_CONFIG = {
  // PSR B0833-45 (Púlsar de Vela)
  rotationPeriod: 0.011195,    // 11.195 ms por rotación
  frequency: 89.33,            // 89.33 Hz (rotaciones/segundo)
  rotationSpeed: Math.PI * 2 * 89.33,  // ~561.3 radianes/segundo
  
  neutronStarRadius: 1.2,      // Radio visual (proporcional a ~10km real)
  beamLength: 20,
  beamRadius: 0.4,
  beamCurve: 3.5,
};

let playing = true;
let speed = 1;  // 1x = velocidad real
let rotationAngle = 0;

// ============================================
// ESTRELLA DE NEUTRONES
// ============================================

const pulsarGroup = new THREE.Group();
scene.add(pulsarGroup);

// Núcleo de la estrella de neutrones
const coreGeometry = new THREE.SphereGeometry(PULSAR_CONFIG.neutronStarRadius, 64, 64);
const coreMaterial = new THREE.MeshBasicMaterial({
  color: 0xaaccff,
  transparent: true,
  opacity: 0.95,
});
const core = new THREE.Mesh(coreGeometry, coreMaterial);
pulsarGroup.add(core);

// Brillo externo (atmósfera de plasma)
const glowGeometry = new THREE.SphereGeometry(PULSAR_CONFIG.neutronStarRadius * 1.4, 32, 32);
const glowMaterial = new THREE.MeshBasicMaterial({
  color: 0x6688ff,
  transparent: true,
  opacity: 0.3,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  depthWrite: false,
});
const glow = new THREE.Mesh(glowGeometry, glowMaterial);
pulsarGroup.add(glow);

// Capa de corteza (superficie magnética)
const crustGeometry = new THREE.SphereGeometry(PULSAR_CONFIG.neutronStarRadius * 1.05, 32, 32);
const crustMaterial = new THREE.MeshBasicMaterial({
  color: 0x4466aa,
  transparent: true,
  opacity: 0.4,
  wireframe: true,
});
const crust = new THREE.Mesh(crustGeometry, crustMaterial);
pulsarGroup.add(crust);

// Anillo ecuatorial (disco de partículas)
const ringGeometry = new THREE.TorusGeometry(2.5, 0.08, 8, 64);
const ringMaterial = new THREE.MeshBasicMaterial({
  color: 0x88aaff,
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending,
});
const ring = new THREE.Mesh(ringGeometry, ringMaterial);
ring.rotation.x = Math.PI / 2;
pulsarGroup.add(ring);

// ============================================
// HAZ DE RADIACIÓN DOBLADO (CHORRO)
// ============================================

function createCurvedBeam(color, direction = 1) {
  const curvePoints = [];
  const segments = 40;
  const length = PULSAR_CONFIG.beamLength;
  const curveAmount = PULSAR_CONFIG.beamCurve;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * length * direction;
    // Curva que se ensancha y curva como chorro de agua
    const curveFactor = Math.pow(t, 1.5) * curveAmount;
    const x = Math.sin(t * Math.PI * 0.5) * curveFactor;
    const z = Math.cos(t * Math.PI * 0.3) * curveFactor * 0.3;
    curvePoints.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(curvePoints);

  // Radio variable: estrecho en la base, se ensancha
  const radiusFunction = (t) => {
    const base = 0.05;
    const expansion = Math.pow(t, 2) * PULSAR_CONFIG.beamRadius;
    return base + expansion;
  };

  // Crear tube con radio variable usandoTubeGeometry
  const tubeSegments = 60;
  const radialSegments = 12;
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
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  return new THREE.Mesh(geometry, material);
}

// Haz Norte (chorro curvado)
const beamNorth = createCurvedBeam(0x88ccff, 1);
pulsarGroup.add(beamNorth);

// Haz Sur (chorro curvado, dirección opuesta)
const beamSouth = createCurvedBeam(0x88ccff, -1);
pulsarGroup.add(beamSouth);

// Haces internos más estrechos (rayos gamma)
function createInnerBeam(color, direction = 1) {
  const curvePoints = [];
  const segments = 30;
  const length = PULSAR_CONFIG.beamLength * 0.8;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * length * direction;
    const x = Math.sin(t * Math.PI * 0.3) * PULSAR_CONFIG.beamCurve * 0.3;
    curvePoints.push(new THREE.Vector3(x, y, 0));
  }

  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const geometry = new THREE.TubeGeometry(curve, 30, 0.08, 8, false);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return new THREE.Mesh(geometry, material);
}

const innerBeamNorth = createInnerBeam(0x44ddff, 1);
pulsarGroup.add(innerBeamNorth);

const innerBeamSouth = createInnerBeam(0x44ddff, -1);
pulsarGroup.add(innerBeamSouth);

// ============================================
// CAMPO MAGNÉTICO (LÍNEAS DE FUERZA)
// ============================================

const magneticFieldGroup = new THREE.Group();
pulsarGroup.add(magneticFieldGroup);

function createMagneticFieldLine(radius, segments = 64) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI;
    const x = radius * Math.sin(t) * Math.cos(t * 2);
    const y = radius * Math.cos(t);
    const z = radius * Math.sin(t) * Math.sin(t * 2);
    points.push(new THREE.Vector3(x, y, z));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x3366aa,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Line(geometry, material);
}

for (let i = 0; i < 10; i++) {
  const line = createMagneticFieldLine(2.5 + i * 0.6);
  line.rotation.y = (i / 10) * Math.PI * 2;
  magneticFieldGroup.add(line);
}

// ============================================
// PARTÍCULAS EN EL HAZ (POLVO CÓSMICO)
// ============================================

const beamParticlesGroup = new THREE.Group();
pulsarGroup.add(beamParticlesGroup);

function createBeamParticles(count = 200) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.3;
    const y = Math.random() * PULSAR_CONFIG.beamLength;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    velocities.push({
      y: 0.1 + Math.random() * 0.3,
      angle: angle,
      radius: radius,
    });
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xaaddff,
    size: 0.15,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return { mesh: new THREE.Points(geometry, material), velocities };
}

const beamParticlesNorth = createBeamParticles(150);
beamParticlesNorth.mesh.position.y = PULSAR_CONFIG.neutronStarRadius;
beamParticlesGroup.add(beamParticlesNorth.mesh);

const beamParticlesSouth = createBeamParticles(150);
beamParticlesSouth.mesh.position.y = -PULSAR_CONFIG.neutronStarRadius;
beamParticlesSouth.mesh.rotation.x = Math.PI;
beamParticlesGroup.add(beamParticlesSouth.mesh);

// ============================================
// ESTRELLAS DE FONDO
// ============================================

function createStarfield(count = 3000) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i += 3) {
    const radius = 50 + Math.random() * 450;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = radius * Math.cos(phi);

    const brightness = 0.5 + Math.random() * 0.5;
    colors[i] = brightness;
    colors[i + 1] = brightness;
    colors[i + 2] = brightness + Math.random() * 0.2;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

const starfield = createStarfield();
scene.add(starfield);

// Nebulosa de Vela (fondo difuso)
function createVelaNebula() {
  const geometry = new THREE.BufferGeometry();
  const count = 1000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i += 3) {
    const radius = 25 + Math.random() * 70;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = radius * Math.cos(phi);

    colors[i] = 0.15 + Math.random() * 0.25;
    colors[i + 1] = 0.35 + Math.random() * 0.35;
    colors[i + 2] = 0.55 + Math.random() * 0.45;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 3.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

const nebulosa = createVelaNebula();
scene.add(nebulosa);

// ============================================
// ILUMINACIÓN
// ============================================

const ambientLight = new THREE.AmbientLight(0x111122, 0.4);
scene.add(ambientLight);

const pulsarLight = new THREE.PointLight(0x88ccff, 3, 60);
pulsarLight.position.set(0, 0, 0);
scene.add(pulsarLight);

// ============================================
// AUDIO - Web Audio API (autoplay on load)
// ============================================

let audioContext = null;
let audioSource = null;
let audioAnalyser = null;
let audioBuffer = null;
let audioGain = null;
let audioMuted = false;

async function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 256;
    audioGain = audioContext.createGain();
    audioGain.gain.value = 0.35;

    const response = await fetch("audio/vela-pulsar-sound.ogg");
    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    console.log("Audio listo");
  } catch (error) {
    console.error("Error audio:", error);
  }
}

function playAudio() {
  if (!audioBuffer || !audioContext) return;

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  audioSource.loop = true;
  audioSource.connect(audioGain);
  audioGain.connect(audioAnalyser);
  audioAnalyser.connect(audioContext.destination);
  audioSource.start(0);
}

function stopAudio() {
  if (audioSource) {
    audioSource.stop();
    audioSource = null;
  }
}

function toggleMute() {
  if (!audioContext || !audioBuffer) return;

  if (audioMuted) {
    // Unmute - reproducir
    playAudio();
    audioMuted = false;
    muteBtn.textContent = "🔊 Sonido";
    muteBtn.classList.remove("muted");
  } else {
    // Mute - pausar audio
    stopAudio();
    audioMuted = true;
    muteBtn.textContent = "🔇 Mudo";
    muteBtn.classList.add("muted");
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

muteBtn.addEventListener("click", toggleMute);

speedSelect.addEventListener("change", (e) => {
  speed = parseFloat(e.target.value);
});

// ============================================
// ANIMACIÓN PRINCIPAL
// ============================================

const clock = new THREE.Clock();
let elapsedTime = 0;

function updateBeamParticles(particlesObj, dt, direction) {
  const positions = particlesObj.mesh.geometry.attributes.position.array;
  const velocities = particlesObj.velocities;

  for (let i = 0; i < velocities.length; i++) {
    const v = velocities[i];
    
    // Mover partículas a lo largo del haz
    positions[i * 3 + 1] += v.y * dt * 30 * direction;
    
    // Reposicionar si salen del haz
    if (Math.abs(positions[i * 3 + 1]) > PULSAR_CONFIG.beamLength) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
  }

  particlesObj.mesh.geometry.attributes.position.needsUpdate = true;
}

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();

  // Actualizar controles de órbita
  controls.update();

  if (playing) {
    elapsedTime += dt * speed;

    // Rotación del púlsar - VELOCIDAD REAL (89.33 Hz)
    rotationAngle += dt * speed * PULSAR_CONFIG.rotationSpeed;
    pulsarGroup.rotation.y = rotationAngle;

    // Efecto de pulso en el brillo - sincronizado con rotación real
    const pulsePhase = (elapsedTime * PULSAR_CONFIG.frequency) % 1;
    const pulseIntensity = 0.8 + 0.2 * Math.sin(pulsePhase * Math.PI * 2);
    glowMaterial.opacity = 0.25 * pulseIntensity;
    coreMaterial.opacity = 0.9 + 0.1 * pulseIntensity;

    // Pulso de luz
    pulsarLight.intensity = 2 + 1 * pulseIntensity;

    // Efecto de "barrido" - brillo cuando el haz apunta a la cámara
    const cameraDir = new THREE.Vector3();
    camera.getWorldPosition(cameraDir);
    cameraDir.sub(pulsarGroup.position).normalize();

    const beamDir = new THREE.Vector3(0, 1, 0);
    beamDir.applyQuaternion(pulsarGroup.quaternion);

    const beamDot = Math.abs(beamDir.dot(cameraDir));
    const sweepIntensity = Math.pow(beamDot, 6);

    // Intensificar haces durante el barrido
    beamNorth.material.opacity = 0.5 + 0.4 * sweepIntensity;
    beamSouth.material.opacity = 0.5 + 0.4 * sweepIntensity;
    innerBeamNorth.material.opacity = 0.6 + 0.3 * sweepIntensity;
    innerBeamSouth.material.opacity = 0.6 + 0.3 * sweepIntensity;

    // Brillo del core
    const coreGlow = 0.85 + 0.15 * sweepIntensity;
    coreMaterial.color.setRGB(
      0.6 + 0.15 * sweepIntensity,
      0.7 + 0.2 * sweepIntensity,
      1.0
    );
    coreMaterial.opacity = coreGlow;

    // Color del haz varía
    const hue = 0.56 + 0.06 * Math.sin(elapsedTime * 0.8);
    beamNorth.material.color.setHSL(hue, 0.7, 0.65 + 0.1 * sweepIntensity);
    beamSouth.material.color.setHSL(hue, 0.7, 0.65 + 0.1 * sweepIntensity);

    // Actualizar partículas del haz
    updateBeamParticles(beamParticlesNorth, dt, 1);
    updateBeamParticles(beamParticlesSouth, dt, -1);

    // Rotación de la nebulosa
    nebulosa.rotation.y += dt * 0.001;

    // Pulso del campo magnético
    magneticFieldGroup.rotation.y = rotationAngle * 0.2;
    magneticFieldGroup.rotation.x = Math.sin(elapsedTime * 0.15) * 0.08;

    // Anillo pulsa
    ring.scale.setScalar(1 + 0.05 * Math.sin(elapsedTime * 10));
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
// INICIALIZACIÓN - Audio autoplay
// ============================================

async function start() {
  await initAudio();
  
  // Intentar reproducir audio automáticamente
  // (funciona porque el usuario hizo click en la card del catálogo)
  if (audioBuffer && audioContext) {
    playAudio();
  }
  
  animate();
}

start();
