import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export function createScene(opts = {}) {
  const {
    bloomStrength = 1.8,
    bloomRadius = 1.0,
    bloomThreshold = 0.08,
    fogColor = 0x020205,
    fogDensity = 0.003,
    cameraPos = [10, 8, 40],
    cameraFov = 50,
    enableControls = true,
  } = opts;

  const canvas = document.getElementById("space-canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(fogColor, fogDensity);

  const camera = new THREE.PerspectiveCamera(cameraFov, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(...cameraPos);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 5;
  controls.maxDistance = 150;
  controls.target.set(0, 0, 0);

  const composer = bloomStrength > 0 ? new EffectComposer(renderer) : null;
  let bloom = null;
  if (composer) {
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      bloomStrength, bloomRadius, bloomThreshold
    );
    composer.addPass(bloom);
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, scene, camera, controls, composer, bloom, canvas };
}

export function createOrbitControls(camera, canvas, opts = {}) {
  const {
    damping = 0.05,
    minDistance = 5,
    maxDistance = 150,
  } = opts;
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = damping;
  controls.minDistance = minDistance;
  controls.maxDistance = maxDistance;
  controls.target.set(0, 0, 0);
  return controls;
}

export function createGroups(scene, tiltAngle, beamTilt) {
  const container = new THREE.Group();
  container.rotation.z = tiltAngle;
  scene.add(container);

  const pulsar = new THREE.Group();
  container.add(pulsar);

  const beam = new THREE.Group();
  beam.rotation.x = beamTilt;
  pulsar.add(beam);

  return { container, pulsar, beam };
}

export function addPulsarLighting(scene, beamGroup) {
  scene.add(new THREE.AmbientLight(0x111122, 0.3));
  const point = new THREE.PointLight(0xcce0ff, 8, 300);
  point.position.set(0, 0, 0);
  scene.add(point);
  const spot = new THREE.SpotLight(0xdde8ff, 6, 400, Math.PI * 0.12, 0.4, 1.5);
  spot.target.position.set(0, 1, 0);
  beamGroup.add(spot);
  beamGroup.add(spot.target);
  return { point, spot };
}
