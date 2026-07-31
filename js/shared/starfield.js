import * as THREE from "three";

export function createStarfield(scene, count = 5000, minR = 60, maxR = 500) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const data = [];

  for (let i = 0; i < count; i++) {
    const r = minR + Math.random() * (maxR - minR);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);

    const t = Math.random();
    if (t < 0.45) {
      col[i * 3] = 0.9 + Math.random() * 0.1; col[i * 3 + 1] = 0.95 + Math.random() * 0.05; col[i * 3 + 2] = 1.0;
    } else if (t < 0.75) {
      col[i * 3] = 1; col[i * 3 + 1] = 1; col[i * 3 + 2] = 1;
    } else if (t < 0.9) {
      col[i * 3] = 1; col[i * 3 + 1] = 0.85; col[i * 3 + 2] = 0.6;
    } else {
      col[i * 3] = 1; col[i * 3 + 1] = 0.65; col[i * 3 + 2] = 0.45;
    }

    sizes[i] = 0.1 + Math.random() * 0.4;
    data.push({ baseSize: sizes[i], phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 1.5 });
  }

  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({ size: 0.6, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  return { points, data };
}

export function updateTwinkle(sf, time) {
  const sizes = sf.points.geometry.attributes.size.array;
  for (let i = 0; i < sf.data.length; i++) {
    const d = sf.data[i];
    sizes[i] = d.baseSize * (0.6 + 0.4 * Math.sin(time * d.speed + d.phase));
  }
  sf.points.geometry.attributes.size.needsUpdate = true;
}
