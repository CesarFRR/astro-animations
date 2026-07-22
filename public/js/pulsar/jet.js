import * as THREE from "three";

export class DustJet {
  constructor(group, dir, count = 3000) {
    this.dir = dir;
    this.data = [];
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const spread = 0.1 + t * 2.5;
      const angle = Math.random() * Math.PI * 2;
      const dist = t * 280 + Math.random() * 20;
      const speed = 0.2 + Math.random() * 0.8;
      this.data.push({ spread, angle, dist, speed, t });
      pos[i * 3] = Math.cos(angle) * spread;
      pos[i * 3 + 1] = dir * dist;
      pos[i * 3 + 2] = Math.sin(angle) * spread;
      const rgb = new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.6, 0.4 + (0.2 + t * 0.8) * 0.5);
      col[i * 3] = rgb.r; col[i * 3 + 1] = rgb.g; col[i * 3 + 2] = rgb.b;
      sizes[i] = 0.02 + t * 0.15 + Math.random() * 0.08;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.2, vertexColors: true, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    this.mesh = new THREE.Points(geo, mat);
    this.mesh.position.y = dir * 0.5;
    group.add(this.mesh);
  }

  update(dt, speed) {
    const pos = this.mesh.geometry.attributes.position.array;
    for (let i = 0; i < this.data.length; i++) {
      const p = this.data[i];
      p.dist += dt * speed * p.speed * 25;
      if (p.dist > 300) {
        p.dist = 0;
        p.t = Math.random();
        p.spread = 0.3 + p.t * 1.8;
        p.angle = Math.random() * Math.PI * 2;
        p.speed = 0.3 + Math.random() * 0.7;
      }
      pos[i * 3] = Math.cos(p.angle) * p.spread;
      pos[i * 3 + 1] = this.dir * p.dist;
      pos[i * 3 + 2] = Math.sin(p.angle) * p.spread;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }
}
