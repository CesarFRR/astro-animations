import * as THREE from "three";

export function crearTexturaTierraSimple() {
  const W = 1024;
  const H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1d4e79";
  ctx.fillRect(0, 0, W, H);

  const ux = (u) => u * W;
  const vy = (v) => (1 - v) * H;

  ctx.strokeStyle = "rgba(180, 215, 245, 0.28)";
  ctx.lineWidth = 1;
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

  ctx.strokeStyle = "rgba(230, 240, 250, 0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, vy(0.5));
  ctx.lineTo(W, vy(0.5));
  ctx.stroke();

  ctx.strokeStyle = "#ff3b30";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ux(0.5), 0);
  ctx.lineTo(ux(0.5), H);
  ctx.stroke();

  ctx.fillStyle = "#ff3b30";
  ctx.beginPath();
  ctx.arc(ux(0.5), vy(0.5), 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
