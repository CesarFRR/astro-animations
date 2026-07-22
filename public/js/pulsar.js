import * as THREE from "three";

// ============================================
// PÚLSAR DE VELA - Animación 3D
// ============================================

const canvas = document.getElementById("space-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05070a, 0.008);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 8, 25);
camera.lookAt(0, 0, 0);

// ============================================
// CONFIGURACIÓN DEL PÚLSAR
// ============================================

const PULSAR_CONFIG = {
  rotationPeriod: 0.011195,  // 11.195 ms en segundos (realista)
  visualRotation: 0.8,       // Velocidad visual (más lenta para ver)
  neutronStarRadius: 1.2,
  beamLength: 18,
  beamWidth: 0.15,
  beamSpread: 0.3,
  magneticAxisTilt: 12 * Math.PI / 180,  // 12 grados de inclinación
};

let playing = true;
let speed = 1;
let soundEnabled = false;
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
const glowGeometry = new THREE.SphereGeometry(PULSAR_CONFIG.neutronStarRadius * 1.3, 32, 32);
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

// ============================================
// HAZ DE RADIACIÓN (CONE)
// ============================================

function createBeam(color, length) {
  const geometry = new THREE.ConeGeometry(
    PULSAR_CONFIG.beamWidth,
    length,
    16,
    1,
    true
  );
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

// Haz Norte (radio + gamma)
const beamNorth = createBeam(0x88ccff, PULSAR_CONFIG.beamLength);
beamNorth.position.y = PULSAR_CONFIG.beamLength / 2 + PULSAR_CONFIG.neutronStarRadius;
pulsarGroup.add(beamNorth);

// Haz Sur
const beamSouth = createBeam(0x88ccff, PULSAR_CONFIG.beamLength);
beamSouth.rotation.x = Math.PI;
beamSouth.position.y = -(PULSAR_CONFIG.beamLength / 2 + PULSAR_CONFIG.neutronStarRadius);
pulsarGroup.add(beamSouth);

// Haces secundarios (rayos X, más estrechos)
const xrayBeamNorth = createBeam(0x44aaff, PULSAR_CONFIG.beamLength * 0.7);
xrayBeamNorth.scale.set(0.5, 1, 0.5);
xrayBeamNorth.position.y = PULSAR_CONFIG.beamLength * 0.35 + PULSAR_CONFIG.neutronStarRadius;
pulsarGroup.add(xrayBeamNorth);

const xrayBeamSouth = createBeam(0x44aaff, PULSAR_CONFIG.beamLength * 0.7);
xrayBeamSouth.rotation.x = Math.PI;
xrayBeamSouth.scale.set(0.5, 1, 0.5);
xrayBeamSouth.position.y = -(PULSAR_CONFIG.beamLength * 0.35 + PULSAR_CONFIG.neutronStarRadius);
pulsarGroup.add(xrayBeamSouth);

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
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Line(geometry, material);
}

// Crear múltiples líneas de campo
for (let i = 0; i < 8; i++) {
  const line = createMagneticFieldLine(3 + i * 0.5);
  line.rotation.y = (i / 8) * Math.PI * 2;
  magneticFieldGroup.add(line);
}

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
  const count = 800;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i += 3) {
    const radius = 30 + Math.random() * 60;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = radius * Math.cos(phi);

    // Colores de nebulosa (azul/verde pálido)
    colors[i] = 0.2 + Math.random() * 0.3;
    colors[i + 1] = 0.4 + Math.random() * 0.3;
    colors[i + 2] = 0.6 + Math.random() * 0.4;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 2.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.15,
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

const ambientLight = new THREE.AmbientLight(0x111122, 0.5);
scene.add(ambientLight);

const pulsarLight = new THREE.PointLight(0x88ccff, 2, 50);
pulsarLight.position.set(0, 0, 0);
scene.add(pulsarLight);

// ============================================
// AUDIO - Web Audio API
// ============================================

let audioContext = null;
let audioSource = null;
let audioAnalyser = null;
let audioBuffer = null;
let audioGain = null;
let audioPlaying = false;

async function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 256;
    audioGain = audioContext.createGain();
    audioGain.gain.value = 0.4;

    const response = await fetch("audio/vela-pulsar-sound.ogg");
    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    console.log("Audio cargado correctamente");
  } catch (error) {
    console.error("Error al cargar audio:", error);
  }
}

function toggleSound() {
  if (!audioContext) {
    initAudio().then(() => {
      if (audioBuffer) playAudio();
    });
    return;
  }

  if (soundEnabled) {
    stopAudio();
  } else {
    playAudio();
  }
}

function playAudio() {
  if (!audioBuffer || !audioContext) return;

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  // Crear source con loop
  audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  audioSource.loop = true;
  audioSource.connect(audioGain);
  audioGain.connect(audioAnalyser);
  audioAnalyser.connect(audioContext.destination);
  audioSource.start(0);

  soundEnabled = true;
  audioPlaying = true;
  document.getElementById("btn-sound").textContent = "🔊 Sonido";
}

function stopAudio() {
  if (audioSource) {
    audioSource.stop();
    audioSource = null;
  }
  soundEnabled = false;
  audioPlaying = false;
  document.getElementById("btn-sound").textContent = "🔇 Mudo";
}

// ============================================
// CONTROLES
// ============================================

const playBtn = document.getElementById("btn-play");
const soundBtn = document.getElementById("btn-sound");
const speedSelect = document.getElementById("speed");

playBtn.addEventListener("click", () => {
  playing = !playing;
  playBtn.textContent = playing ? "⏸ Pausar" : "▶ Reproducir";
});

soundBtn.addEventListener("click", toggleSound);

speedSelect.addEventListener("change", (e) => {
  speed = parseFloat(e.target.value);
});

// ============================================
// ANIMACIÓN PRINCIPAL
// ============================================

const clock = new THREE.Clock();
let elapsedTime = 0;

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();

  if (playing) {
    elapsedTime += dt * speed;

    // Rotación del púlsar (velocidad visual reducida para ver)
    rotationAngle += dt * speed * PULSAR_CONFIG.visualRotation * Math.PI * 2;

    // Aplicar rotación al grupo del púlsar
    pulsarGroup.rotation.y = rotationAngle;

    // Efecto de pulso en el brillo
    const pulsePhase = (elapsedTime * 89.33) % 1;  // 89.33 Hz real
    const pulseIntensity = 0.8 + 0.2 * Math.sin(pulsePhase * Math.PI * 2);
    glowMaterial.opacity = 0.25 * pulseIntensity;
    coreMaterial.opacity = 0.9 + 0.1 * pulseIntensity;

    // Pulso de luz
    pulsarLight.intensity = 1.5 + 0.5 * pulseIntensity;

    // Efecto de "barrido" - cuando el haz apunta hacia la cámara
    const beamAngle = rotationAngle % (Math.PI * 2);
    const cameraDot = Math.abs(Math.sin(beamAngle));
    const sweepIntensity = Math.pow(cameraDot, 8);  // Pulso agudo

    beamNorth.material.opacity = 0.5 + 0.4 * sweepIntensity;
    beamSouth.material.opacity = 0.5 + 0.4 * sweepIntensity;

    // Brillo del core más intenso durante el barrido
    const coreGlow = 0.85 + 0.15 * sweepIntensity;
    coreMaterial.color.setRGB(0.6 + 0.1 * sweepIntensity, 0.7 + 0.15 * sweepIntensity, 1.0);
    coreMaterial.opacity = coreGlow;

    // Variación sutil en el color del haz
    const hue = 0.58 + 0.04 * Math.sin(elapsedTime * 0.5);
    beamNorth.material.color.setHSL(hue, 0.7, 0.7);
    beamSouth.material.color.setHSL(hue, 0.7, 0.7);

    // Rotación de la nebulosa (muy lenta)
    nebulosa.rotation.y += dt * 0.002;

    // Pulso del campo magnético
    magneticFieldGroup.rotation.y = rotationAngle * 0.3;
    magneticFieldGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.1;
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
// INICIALIZACIÓN
// ============================================

initAudio();
animate();

// Actualizar HUD inicial
document.getElementById("freq-value").textContent = "89.33 Hz";
document.getElementById("mag-value").textContent = "3.38×10¹² G";
document.getElementById("temp-value").textContent = "~8×10⁵ K";
document.getElementById("age-value").textContent = "~11,000 años";
