import * as THREE from "three";

export class WbStar {
  constructor(group) {
    this.group = group;

    // Core sphere
    const coreGeo = new THREE.SphereGeometry(1, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffdd66, transparent: true, opacity: 0.98 });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core);

    // Glow halo
    const glowGeo = new THREE.SphereGeometry(1.35, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffcc44,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.group.add(this.glow);

    // Envelope (red giant atmosphere)
    const envGeo = new THREE.SphereGeometry(1, 48, 48);
    const envMat = new THREE.MeshBasicMaterial({
      color: 0xff6633,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      depthWrite: false
    });
    this.envelope = new THREE.Mesh(envGeo, envMat);
    this.group.add(this.envelope);

    // Envelope outer wisp layer
    const wispGeo = new THREE.SphereGeometry(1.15, 32, 32);
    const wispMat = new THREE.MeshBasicMaterial({
      color: 0xcc3311,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.wisp = new THREE.Mesh(wispGeo, wispMat);
    this.group.add(this.wisp);

    this.coreScale = 1;
    this.envelopeScale = 1;
  }

  setCore(scale, color, glowColor, glowOpacity) {
    this.coreScale = scale;
    this.core.scale.setScalar(scale);
    this.glow.scale.setScalar(scale * 1.35);
    this.core.material.color.set(color);
    this.glow.material.color.set(glowColor);
    this.glow.material.opacity = glowOpacity;
  }

  setEnvelope(scale, color, opacity) {
    this.envelopeScale = scale;
    this.envelope.scale.setScalar(scale);
    this.wisp.scale.setScalar(scale * 1.15);
    this.envelope.material.color.set(color);
    this.wisp.material.color.set(color);
    this.envelope.material.opacity = opacity;
    this.wisp.material.opacity = opacity * 0.5;
  }

  pulse(time, amount) {
    const s = this.coreScale * (1 + Math.sin(time * 2.5) * amount);
    this.core.scale.setScalar(s);
    this.glow.scale.setScalar(s * 1.35);
  }

  pulseEnvelope(time, amount) {
    const s = this.envelopeScale * (1 + Math.sin(time * 1.2) * amount);
    this.envelope.scale.setScalar(s);
    this.wisp.scale.setScalar(s * 1.15);
  }

  show() {
    this.core.visible = true;
    this.glow.visible = true;
    this.envelope.visible = true;
    this.wisp.visible = true;
  }

  hide() {
    this.core.visible = false;
    this.glow.visible = false;
    this.envelope.visible = false;
    this.wisp.visible = false;
  }
}
