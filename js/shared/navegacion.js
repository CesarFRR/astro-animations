import * as THREE from "three";

const UP = new THREE.Vector3(0, 1, 0);
const TECLAS = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"];

export function crearNavegacionTeclado(camera, controls) {
  const teclas = {};
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (TECLAS.includes(k)) {
      teclas[k] = true;
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => (teclas[e.key.toLowerCase()] = false));

  const dir = new THREE.Vector3();
  return function navegar(dt) {
    dir.subVectors(camera.position, controls.target);
    const dist = dir.length();
    if (teclas.w || teclas.arrowup) {
      const k = 1 - Math.min(0.5, 1.1 * dt);
      dir.multiplyScalar(Math.max(k, controls.minDistance * 1.05 / dist));
    }
    if (teclas.s || teclas.arrowdown) {
      const k = 1 + Math.min(0.5, 1.1 * dt);
      dir.multiplyScalar(Math.min(k, controls.maxDistance * 0.95 / dist));
    }
    const velAng = 1.3 * dt;
    if (teclas.a || teclas.arrowleft) dir.applyAxisAngle(UP, velAng);
    if (teclas.d || teclas.arrowright) dir.applyAxisAngle(UP, -velAng);
    camera.position.copy(controls.target).add(dir);
  };
}
