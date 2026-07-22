import * as THREE from "three";

export class Explosion {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.age = 0;

    // Shockwave ring
    const ringGeo = new THREE.RingGeometry(2.5, 2.8, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.shockwave = new THREE.Mesh(ringGeo, ringMat);
    this.shockwave.lookAt(new THREE.Vector3(0, 1, 0));
    this.shockwave.visible = false;
    this.scene.add(this.shockwave);

    // Flash
    const flashGeo = new THREE.SphereGeometry(1, 32, 32);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.flash = new THREE.Mesh(flashGeo, flashMat);
    this.scene.add(this.flash);

    // Remnant nebula shell
    const remnantGeo = new THREE.SphereGeometry(1, 48, 48);
    const remnantMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.remnant = new THREE.Mesh(remnantGeo, remnantMat);
    this.remnant.visible = false;
    this.scene.add(this.remnant);
  }

  start() {
    this.active = true;
    this.age = 0;
    this.shockwave.visible = true;
    this.shockwave.scale.setScalar(1);
    this.shockwave.material.opacity = 0.95;
    this.flash.visible = true;
    this.flash.scale.setScalar(1);
    this.flash.material.opacity = 1;
    this.remnant.visible = true;
    this.remnant.scale.setScalar(0.1);
    this.remnant.material.opacity = 0;
  }

  reset() {
    this.active = false;
    this.age = 0;
    this.shockwave.visible = false;
    this.shockwave.scale.setScalar(1);
    this.shockwave.material.opacity = 0;
    this.flash.visible = false;
    this.flash.scale.setScalar(1);
    this.flash.material.opacity = 0;
    this.remnant.visible = false;
    this.remnant.scale.setScalar(0.1);
    this.remnant.material.opacity = 0;
  }

  update(dt, phaseName, phaseProgress) {
    if (phaseName === "explosion") {
      this.age += dt;
      const t = Math.min(1, this.age / 2.5);
      // Flash
      this.flash.scale.setScalar(1 + t * 6);
      this.flash.material.opacity = Math.max(0, 1 - t * 1.5);
      // Shockwave
      this.shockwave.scale.setScalar(1 + t * 12);
      this.shockwave.material.opacity = Math.max(0, 0.95 - t * 1.4);
      // Remnant begins
      this.remnant.visible = true;
      this.remnant.scale.setScalar(0.2 + t * 2);
      this.remnant.material.opacity = Math.min(0.35, t * 0.55);
      const color = new THREE.Color().setHSL(0.08 + t * 0.04, 0.9, 0.5 + t * 0.1);
      this.remnant.material.color.copy(color);
    } else if (phaseName === "remnant") {
      this.age += dt;
      const t = 1 + phaseProgress;
      this.remnant.visible = true;
      this.remnant.scale.setScalar(2.2 + phaseProgress * 5);
      this.remnant.material.opacity = Math.max(0.08, 0.35 - phaseProgress * 0.2);
      const hue = 0.12 + phaseProgress * 0.08;
      this.remnant.material.color.setHSL(hue, 0.8, 0.5);
      this.shockwave.visible = false;
      this.flash.visible = false;
    } else {
      this.reset();
    }
  }

  destroy() {
    this.scene.remove(this.shockwave);
    this.scene.remove(this.flash);
    this.scene.remove(this.remnant);
    this.shockwave.geometry.dispose();
    this.flash.geometry.dispose();
    this.remnant.geometry.dispose();
    this.shockwave.material.dispose();
    this.flash.material.dispose();
    this.remnant.material.dispose();
  }
}
