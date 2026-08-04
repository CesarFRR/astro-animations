import * as THREE from "three";

const BASE = "/astro-animations";

export function cargarTexturasSimples(manager) {
  const loader = new THREE.TextureLoader(manager);
  const tex = {
    dia: loader.load(`${BASE}/textures/simple/earth_day.webp`),
    bump: loader.load(`${BASE}/textures/simple/earth_bump.webp`),
    specular: loader.load(`${BASE}/textures/simple/earth_specular.webp`),
    luces: loader.load(`${BASE}/textures/simple/earth_lights.webp`),
    nubes: loader.load(`${BASE}/textures/simple/earth_clouds.webp`),
    nubesAlpha: loader.load(`${BASE}/textures/simple/earth_clouds_alpha.webp`),
  };
  tex.dia.colorSpace = THREE.SRGBColorSpace;
  tex.luces.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function crearTexturaTierraSimple() {
  const W = 1024;
  const H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const ux = (u) => u * W;
  const vy = (v) => (1 - v) * H;

  ctx.fillStyle = "#2b6fae";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#3f7d4e";
  ctx.beginPath();
  ctx.ellipse(ux(0.28), vy(0.42), 90, 55, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ux(0.62), vy(0.35), 70, 45, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ux(0.8), vy(0.58), 55, 40, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(210, 235, 255, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ux((lon + 180) / 360);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = vy((lat + 90) / 180);
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, vy(0.5));
  ctx.lineTo(W, vy(0.5));
  ctx.stroke();

  ctx.strokeStyle = "#ff3b30";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(ux(0.5), 0);
  ctx.lineTo(ux(0.5), H);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 59, 48, 0.3)";
  ctx.beginPath();
  ctx.arc(ux(0.5), vy(0.5), 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff3b30";
  ctx.beginPath();
  ctx.arc(ux(0.5), vy(0.5), 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
