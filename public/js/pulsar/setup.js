import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export function createScene() {
  const canvas = document.getElementById("space-canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020205, 0.003);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(10, 8, 40);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 5;
  controls.maxDistance = 150;
  controls.target.set(0, 0, 0);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.8, 1.0, 0.08);
  composer.addPass(bloom);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, scene, camera, controls, composer, bloom, canvas };
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
