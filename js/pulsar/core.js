import * as THREE from "three";

export class NeutronStar {
  constructor(group, radius, color) {
    const geometry = new THREE.SphereGeometry(radius, 80, 80);
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1.0 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.material = material;
    group.add(this.mesh);
  }
}
