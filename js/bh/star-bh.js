import * as THREE from "three";

// Estrella masiva con estructura de cebolla (capas de fusión) y colapso.
export class BhStar {
  constructor(group) {
    this.group = group;

    // Core
    const coreGeo = new THREE.SphereGeometry(1, 48, 48);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffddaa, transparent: true, opacity: 0.98 });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core);

    // Glow
    const glowGeo = new THREE.SphereGeometry(1.3, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffcc66, transparent: true, opacity: 0.22,
      blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.group.add(this.glow);

    // Envelope (supergiant red atmosphere)
    const envGeo = new THREE.SphereGeometry(1, 48, 48);
    const envMat = new THREE.MeshBasicMaterial({
      color: 0xff5533, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false
    });
    this.envelope = new THREE.Mesh(envGeo, envMat);
    this.group.add(this.envelope);

    // Onion layers: H, He, C, Ne/O, Si, Fe (innermost = core itself)
    // Radii in scene units (core radius = 1); colored translucent shells.
    const layerDefs = [
      { r: 1.6, color: 0x9933ff, name: "Si" },
      { r: 2.4, color: 0xff3333, name: "O/Ne" },
      { r: 3.3, color: 0xff9933, name: "C" },
      { r: 4.4, color: 0xffee66, name: "He" },
      { r: 5.6, color: 0x6699ff, name: "H" }
    ];
    this.layers = layerDefs.map(def => {
      const geo = new THREE.SphereGeometry(def.r, 32, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: def.color, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      this.group.add(mesh);
      return { mesh, def };
    });

    // Shockwave ring
    const ringGeo = new THREE.RingGeometry(2.5, 2.85, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.shock = new THREE.Mesh(ringGeo, ringMat);
    this.shock.rotation.x = Math.PI / 2;
    this.shock.visible = false;
    this.group.add(this.shock);

    this.coreScale = 1;
  }

  setCore(scale, color, glowColor, glowOpacity) {
    this.coreScale = scale;
    this.core.scale.setScalar(scale);
    this.glow.scale.setScalar(scale * 1.3);
    this.core.material.color.set(color);
    this.glow.material.color.set(glowColor);
    this.glow.material.opacity = glowOpacity;
  }

  setEnvelope(scale, color, opacity) {
    this.envelope.scale.setScalar(scale);
    this.envelope.material.color.set(color);
    this.envelope.material.opacity = opacity;
  }

  setLayers(visibility, squeeze = 1) {
    for (const { mesh, def } of this.layers) {
      mesh.material.opacity = visibility * 0.22;
      mesh.scale.setScalar(squeeze);
      mesh.visible = visibility > 0.01;
    }
  }

  fireShock() {
    this.shock.visible = true;
    this.shock.scale.setScalar(1);
    this.shock.material.opacity = 0.95;
    this.shockAge = 0;
  }

  updateShock(dt) {
    if (!this.shock.visible) return;
    this.shockAge += dt;
    const t = Math.min(1, this.shockAge / 2.2);
    this.shock.scale.setScalar(1 + t * 14);
    this.shock.material.opacity = Math.max(0, 0.95 - t * 1.3);
    if (t >= 1) this.shock.visible = false;
  }

  pulse(time, amount) {
    const s = this.coreScale * (1 + Math.sin(time * 2.2) * amount);
    this.core.scale.setScalar(s);
    this.glow.scale.setScalar(s * 1.3);
  }

  show() {
    this.core.visible = true;
    this.glow.visible = true;
    this.envelope.visible = true;
  }

  hide() {
    this.core.visible = false;
    this.glow.visible = false;
    this.envelope.visible = false;
    this.setLayers(0);
    this.shock.visible = false;
  }
}
