import * as THREE from "three";

export class Star {
  constructor(scene) {
    this.scene = scene;
    this.coreScale = 1;
    this.envelopeScale = 1;
    this.opacity = 0.55;

    // Core
    const coreGeo = new THREE.SphereGeometry(1, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0.95
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.scene.add(this.core);

    // Core glow (slightly larger sphere with additive blending)
    const glowGeo = new THREE.SphereGeometry(1.4, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.scene.add(this.glow);

    // Envelope
    const envGeo = new THREE.SphereGeometry(3.2, 48, 48);
    const envMat = new THREE.MeshBasicMaterial({
      color: 0xffddaa,
      transparent: true,
      opacity: this.opacity,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      depthWrite: false
    });
    this.envelope = new THREE.Mesh(envGeo, envMat);
    this.scene.add(this.envelope);

    // Wireframe overlay for layers
    const wireGeo = new THREE.SphereGeometry(3.25, 32, 32);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffaa88,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    });
    this.wireframe = new THREE.Mesh(wireGeo, wireMat);
    this.scene.add(this.wireframe);
  }

  setCoreScale(s) {
    this.coreScale = s;
    this.core.scale.setScalar(s);
    this.glow.scale.setScalar(s * 1.4);
  }

  setEnvelopeScale(s) {
    this.envelopeScale = s;
    this.envelope.scale.setScalar(s);
    this.wireframe.scale.setScalar(s);
  }

  setColor(hueShift) {
    // hueShift 0..1: 0 = warm yellow, 1 = white/blue intense
    const c = new THREE.Color().setHSL(0.08 + hueShift * 0.05, 1.0, 0.5 + hueShift * 0.3);
    this.core.material.color.copy(c);
    this.glow.material.color.copy(c);
    this.envelope.material.color.copy(c);
  }

  setOpacity(o) {
    this.opacity = o;
    this.envelope.material.opacity = o;
    this.wireframe.material.opacity = o * 0.22;
  }

  pulse(time, intensity = 0.02) {
    const s = this.coreScale * (1 + Math.sin(time * 2) * intensity);
    this.core.scale.setScalar(s);
    this.glow.scale.setScalar(s * 1.4);
  }

  hide() {
    this.core.visible = false;
    this.glow.visible = false;
    this.envelope.visible = false;
    this.wireframe.visible = false;
  }

  show() {
    this.core.visible = true;
    this.glow.visible = true;
    this.envelope.visible = true;
    this.wireframe.visible = true;
  }

  destroy() {
    this.scene.remove(this.core);
    this.scene.remove(this.glow);
    this.scene.remove(this.envelope);
    this.scene.remove(this.wireframe);
    this.core.geometry.dispose();
    this.glow.geometry.dispose();
    this.envelope.geometry.dispose();
    this.wireframe.geometry.dispose();
    this.core.material.dispose();
    this.glow.material.dispose();
    this.envelope.material.dispose();
    this.wireframe.material.dispose();
  }
}
