import * as THREE from "three";

const R_BASE = 0.05;
const R_TIP = 3.0;
const GR_BASE = 0.15;
const GR_TIP = 3.5;
const GCOLOR = new THREE.Color(0xb0d0ff);

function coreBeam(color, dir, len) {
  const top = dir > 0 ? R_TIP : R_BASE;
  const bot = dir > 0 ? R_BASE : R_TIP;
  const g = new THREE.CylinderGeometry(top, bot, len, 48, 1, false);
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
  const mesh = new THREE.Mesh(g, m);
  mesh.position.y = dir * len / 2;
  return mesh;
}

function glowTube(dir, len) {
  const top = dir > 0 ? GR_TIP : GR_BASE;
  const bot = dir > 0 ? GR_BASE : GR_TIP;
  const g = new THREE.CylinderGeometry(top, bot, len, 32, 8, true);
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const t = (y + len / 2) / len;
    const f = (dir > 0 ? t : 1 - t);
    const v = 0.01 + 0.12 * Math.pow(f, 0.5);
    c[i * 3] = GCOLOR.r * v; c[i * 3 + 1] = GCOLOR.g * v; c[i * 3 + 2] = GCOLOR.b * v;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 1,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.position.y = dir * len / 2;
  return mesh;
}

function baseGlow(dir) {
  const g = new THREE.SphereGeometry(0.35, 16, 16);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xccddff, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.position.y = dir * 0.1;
  return mesh;
}

export class PulsarBeam {
  constructor(group, color, len = 300) {
    this.north = coreBeam(color, 1, len);
    this.south = coreBeam(color, -1, len);
    this.add(group, this.north, this.south);
    this.add(group, glowTube(1, len), glowTube(-1, len));
    this.add(group, baseGlow(1), baseGlow(-1));
  }

  add(group, ...meshes) { for (const m of meshes) group.add(m); }

  setOpacity(v) {
    this.north.material.opacity = v;
    this.south.material.opacity = v;
  }
}
