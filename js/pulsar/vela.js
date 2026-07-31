import * as THREE from "three";
import { NeutronStar } from "./core.js";
import { PulsarBeam } from "./beam.js";
import { PulsarAudio } from "./audio.js";
import { createStarfield, updateTwinkle } from "../shared/starfield.js";
import { createScene, createGroups, addPulsarLighting } from "../shared/setup.js";

const { scene, camera, controls, composer, renderer } = createScene();
const { container, pulsar, beam } = createGroups(scene, 0.28, 0.15);

const star = new NeutronStar(pulsar, 1.2, 0x99ccff);
const beams = new PulsarBeam(beam, 0x99ccff, 300);
const starfield = createStarfield(scene);
const lights = addPulsarLighting(scene, beam);

const audio = new PulsarAudio();

let playing = true, speed = 1, muted = false, angle = 0, time = 0;

const playBtn = document.getElementById("btn-play");
const muteBtn = document.getElementById("btn-mute");
const speedEl = document.getElementById("speed");

playBtn.addEventListener("click", () => {
  playing = !playing;
  playBtn.textContent = playing ? "\u23F8 Pausar" : "\u25B6 Reproducir";
});

muteBtn.addEventListener("click", () => {
  if (!audio.buffer) return;
  if (muted) { audio.play(); muteBtn.textContent = "\u{1F50A} Sonido"; }
  else { audio.stop(); muteBtn.textContent = "\u{1F507} Sonido"; }
  muted = !muted;
});

speedEl.addEventListener("change", () => { speed = parseFloat(speedEl.value); });

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  controls.update();
  audio.updateListener(camera);

  if (playing) {
    time += dt * speed;
    angle += dt * speed * Math.PI * 2 * 7;
    pulsar.rotation.y = angle;

    const pulse = 0.85 + 0.15 * Math.sin(((time * 89.33) % 1) * Math.PI * 2);
    star.material.opacity = 0.9 + 0.1 * pulse;

    const cd = new THREE.Vector3();
    camera.getWorldPosition(cd).sub(container.position).normalize();
    const bd = new THREE.Vector3(0, 1, 0).applyQuaternion(beam.quaternion).applyQuaternion(pulsar.quaternion);
    const sweep = Math.pow(Math.abs(bd.dot(cd)), 10);
    const surge = 0.3 + 0.7 * sweep;

    lights.point.intensity = (4 + 2 * pulse) * surge;
    lights.spot.intensity = 6 * surge;
    beams.setOpacity(0.75 + 0.25 * sweep);
    updateTwinkle(starfield, time);
  }
  composer.render();
}

(async () => {
  await audio.init("/astro-animations/audio/vela-pulsar-sound.ogg");
  if (audio.buffer) audio.play();
  animate();
})();
