import * as THREE from "three";

export function createGalaxyTexture() {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.3, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

export function createGalaxies(group, count = 24) {
  const tex = createGalaxyTexture();
  const palette = [0xcfe0ff, 0xffe6c8, 0xffffff, 0xd8ccff, 0xffd8b0];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex, color: palette[Math.floor(Math.random() * palette.length)],
      transparent: true, opacity: 0.1 + Math.random() * 0.2,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    const r = 80 + Math.random() * 80;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    sprite.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
    const s = 2 + Math.random() * 5;
    sprite.scale.set(s * (1 + Math.random()), s * 0.55, 1);
    sprite.material.rotation = Math.random() * Math.PI;
    group.add(sprite);
  }
}

export function createStarfield(group, count = 2500) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 40 + Math.random() * 100;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    const temp = 0.5 + Math.random() * 0.5;
    colors[i * 3] = 0.85 + Math.random() * 0.15;
    colors[i * 3 + 1] = 0.85 + Math.random() * 0.15 - (1 - temp) * 0.3;
    colors[i * 3 + 2] = temp * 0.8 + 0.2;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.15, transparent: true, opacity: 0.8,
    vertexColors: true,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const points = new THREE.Points(geo, mat);
  group.add(points);
  return points;
}