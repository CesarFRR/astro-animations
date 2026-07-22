import * as THREE from "three";

export class EquatorialRing {
  constructor(group) {
    const geo = new THREE.RingGeometry(2.5, 4.5, 80);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x88bbff, transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.x = -Math.PI / 2;
    group.add(this.mesh);

    const g2 = new THREE.RingGeometry(2.2, 5.0, 80);
    const m2 = new THREE.MeshBasicMaterial({
      color: 0x6699cc, transparent: true, opacity: 0.04,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    });
    this.glow = new THREE.Mesh(g2, m2);
    this.glow.rotation.x = -Math.PI / 2;
    group.add(this.glow);
  }

  setOpacity(main, glow) {
    this.mesh.material.opacity = main;
    this.glow.material.opacity = glow;
  }
}
