import * as THREE from "three";

function createCircleTexture(colorStr = "#ffffff") {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, colorStr);
  grad.addColorStop(0.5, colorStr);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export class WbParticles {
  constructor(group) {
    this.group = group;

    // Core photons (visible during main sequence / helium burning)
    this.photonCount = 350;
    this.photonGeo = new THREE.BufferGeometry();
    this.photonPos = new Float32Array(this.photonCount * 3);
    this.photonVel = [];
    this.photonLife = new Float32Array(this.photonCount);
    this.photonActive = new Uint8Array(this.photonCount);
    for (let i = 0; i < this.photonCount; i++) this.resetPhoton(i, true);
    this.photonGeo.setAttribute("position", new THREE.BufferAttribute(this.photonPos, 3));
    const photonMat = new THREE.PointsMaterial({
      color: 0xffe9a0,
      size: 0.1,
      map: createCircleTexture("#ffe9a0"),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.photonPoints = new THREE.Points(this.photonGeo, photonMat);
    this.group.add(this.photonPoints);

    // Stellar wind (red giant / AGB): slow outflow from the envelope
    this.windCount = 900;
    this.windGeo = new THREE.BufferGeometry();
    this.windPos = new Float32Array(this.windCount * 3);
    this.windVel = [];
    this.windLife = new Float32Array(this.windCount);
    this.windActive = new Uint8Array(this.windCount);
    for (let i = 0; i < this.windCount; i++) this.windActive[i] = 0;
    this.windGeo.setAttribute("position", new THREE.BufferAttribute(this.windPos, 3));
    const windMat = new THREE.PointsMaterial({
      color: 0xff7744,
      size: 0.14,
      map: createCircleTexture("#ff7744"),
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.windPoints = new THREE.Points(this.windGeo, windMat);
    this.group.add(this.windPoints);

    // Planetary nebula shells: H-alpha red, OIII green, NII blue
    this.nebulaCount = 3000;
    this.nebulaGeo = new THREE.BufferGeometry();
    this.nebulaPos = new Float32Array(this.nebulaCount * 3);
    this.nebulaVel = [];
    this.nebulaLife = new Float32Array(this.nebulaCount);
    this.nebulaActive = new Uint8Array(this.nebulaCount);
    this.nebulaColor = new Float32Array(this.nebulaCount * 3);
    for (let i = 0; i < this.nebulaCount; i++) this.nebulaActive[i] = 0;
    this.nebulaGeo.setAttribute("position", new THREE.BufferAttribute(this.nebulaPos, 3));
    this.nebulaGeo.setAttribute("color", new THREE.BufferAttribute(this.nebulaColor, 3));
    this.nebulaMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      map: createCircleTexture("#ffffff"),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.nebulaPoints = new THREE.Points(this.nebulaGeo, this.nebulaMat);
    this.group.add(this.nebulaPoints);

    // UV photons from the hot core (ionize the nebula)
    this.uvCount = 500;
    this.uvGeo = new THREE.BufferGeometry();
    this.uvPos = new Float32Array(this.uvCount * 3);
    this.uvVel = [];
    this.uvLife = new Float32Array(this.uvCount);
    this.uvActive = new Uint8Array(this.uvCount);
    for (let i = 0; i < this.uvCount; i++) this.uvActive[i] = 0;
    this.uvGeo.setAttribute("position", new THREE.BufferAttribute(this.uvPos, 3));
    const uvMat = new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.12,
      map: createCircleTexture("#99ccff"),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.uvPoints = new THREE.Points(this.uvGeo, uvMat);
    this.group.add(this.uvPoints);
  }

  randomDir() {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    return new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi));
  }

  resetPhoton(i, initial = false) {
    const pos = this.randomDir().multiplyScalar(Math.random() * 0.9);
    this.photonPos[i * 3] = pos.x;
    this.photonPos[i * 3 + 1] = pos.y;
    this.photonPos[i * 3 + 2] = pos.z;
    this.photonVel[i] = pos.clone().normalize().multiplyScalar(0.4 + Math.random() * 1.2);
    this.photonLife[i] = initial ? Math.random() * 2 : 0.8 + Math.random() * 1.4;
    this.photonActive[i] = 1;
  }

  spawnWind(count, innerR, speedBase) {
    let spawned = 0;
    for (let i = 0; i < this.windCount && spawned < count; i++) {
      if (this.windActive[i]) continue;
      const dir = this.randomDir();
      const pos = dir.clone().multiplyScalar(innerR * (0.8 + Math.random() * 0.4));
      this.windPos[i * 3] = pos.x;
      this.windPos[i * 3 + 1] = pos.y;
      this.windPos[i * 3 + 2] = pos.z;
      this.windVel[i] = dir.multiplyScalar(speedBase * (0.5 + Math.random()));
      this.windLife[i] = 3 + Math.random() * 4;
      this.windActive[i] = 1;
      spawned++;
    }
  }

  spawnNebula(count, speedScale = 1) {
    let spawned = 0;
    for (let i = 0; i < this.nebulaCount && spawned < count; i++) {
      if (this.nebulaActive[i]) continue;
      const dir = this.randomDir();
      const pos = dir.clone().multiplyScalar(1.2 + Math.random() * 1.8);
      this.nebulaPos[i * 3] = pos.x;
      this.nebulaPos[i * 3 + 1] = pos.y;
      this.nebulaPos[i * 3 + 2] = pos.z;
      this.nebulaVel[i] = dir.multiplyScalar((0.6 + Math.random() * 1.6) * speedScale);
      this.nebulaLife[i] = 20 + Math.random() * 15;
      this.nebulaActive[i] = 1;
      // H-alpha red dominates, OIII green shell, some NII blue
      const r = Math.random();
      const color = r < 0.5
        ? new THREE.Color(0xff3355)
        : r < 0.85
          ? new THREE.Color(0x33ff99)
          : new THREE.Color(0x3399ff);
      this.nebulaColor[i * 3] = color.r;
      this.nebulaColor[i * 3 + 1] = color.g;
      this.nebulaColor[i * 3 + 2] = color.b;
      spawned++;
    }
    this.nebulaGeo.attributes.color.needsUpdate = true;
  }

  spawnUv(count, speedBase = 2.5) {
    let spawned = 0;
    for (let i = 0; i < this.uvCount && spawned < count; i++) {
      if (this.uvActive[i]) continue;
      const dir = this.randomDir();
      const pos = dir.clone().multiplyScalar(0.2 + Math.random() * 0.3);
      this.uvPos[i * 3] = pos.x;
      this.uvPos[i * 3 + 1] = pos.y;
      this.uvPos[i * 3 + 2] = pos.z;
      this.uvVel[i] = dir.multiplyScalar(speedBase * (0.6 + Math.random()));
      this.uvLife[i] = 4 + Math.random() * 3;
      this.uvActive[i] = 1;
      spawned++;
    }
  }

  update(dt, phase, local) {
    // Photons: only during main sequence and helium burning
    const photonsOn = phase === "mainSequence" || phase === "heliumFlash";
    for (let i = 0; i < this.photonCount; i++) {
      if (!photonsOn) { this.photonActive[i] = 0; continue; }
      if (!this.photonActive[i]) this.resetPhoton(i);
      this.photonPos[i * 3] += this.photonVel[i].x * dt;
      this.photonPos[i * 3 + 1] += this.photonVel[i].y * dt;
      this.photonPos[i * 3 + 2] += this.photonVel[i].z * dt;
      this.photonLife[i] -= dt;
      const r = Math.hypot(this.photonPos[i * 3], this.photonPos[i * 3 + 1], this.photonPos[i * 3 + 2]);
      if (this.photonLife[i] <= 0 || r > 3.2) this.resetPhoton(i);
    }
    this.photonPoints.visible = photonsOn;
    this.photonGeo.attributes.position.needsUpdate = true;

    // Wind: red giant and AGB
    const windOn = phase === "redGiant" || phase === "agb";
    if (windOn) {
      const innerR = phase === "agb" ? 4.5 : 3.2;
      const speed = phase === "agb" ? 1.2 : 0.7;
      this.spawnWind(Math.ceil(6 + local * 10), innerR, speed);
    }
    for (let i = 0; i < this.windCount; i++) {
      if (!this.windActive[i]) continue;
      this.windPos[i * 3] += this.windVel[i].x * dt;
      this.windPos[i * 3 + 1] += this.windVel[i].y * dt;
      this.windPos[i * 3 + 2] += this.windVel[i].z * dt;
      this.windLife[i] -= dt;
      if (this.windLife[i] <= 0) this.windActive[i] = 0;
    }
    this.windPoints.visible = windOn || phase === "planetaryNebula";
    this.windGeo.attributes.position.needsUpdate = true;

    // Nebula: spawned at planetary nebula phase, persists into white dwarf
    if (phase === "planetaryNebula") {
      this.spawnNebula(Math.ceil(40 + local * 160), 1.4);
    }
    let nebulaAlive = 0;
    for (let i = 0; i < this.nebulaCount; i++) {
      if (!this.nebulaActive[i]) continue;
      this.nebulaPos[i * 3] += this.nebulaVel[i].x * dt;
      this.nebulaPos[i * 3 + 1] += this.nebulaVel[i].y * dt;
      this.nebulaPos[i * 3 + 2] += this.nebulaVel[i].z * dt;
      this.nebulaLife[i] -= dt;
      if (this.nebulaLife[i] <= 0) this.nebulaActive[i] = 0;
      else nebulaAlive++;
    }
    // Nebula fades as it disperses during the white dwarf phase
    if (phase === "whiteDwarf") {
      this.nebulaMat.opacity = Math.max(0.12, 0.85 - local * 0.75);
    } else if (phase === "planetaryNebula") {
      this.nebulaMat.opacity = 0.85;
    }
    this.nebulaPoints.visible = phase === "planetaryNebula" || phase === "whiteDwarf";
    this.nebulaGeo.attributes.position.needsUpdate = true;

    // UV photons: planetary nebula + white dwarf
    const uvOn = phase === "planetaryNebula" || phase === "whiteDwarf";
    if (uvOn && nebulaAlive > 0) this.spawnUv(Math.ceil(4 + local * 8), 2.5);
    for (let i = 0; i < this.uvCount; i++) {
      if (!this.uvActive[i]) continue;
      this.uvPos[i * 3] += this.uvVel[i].x * dt;
      this.uvPos[i * 3 + 1] += this.uvVel[i].y * dt;
      this.uvPos[i * 3 + 2] += this.uvVel[i].z * dt;
      this.uvLife[i] -= dt;
      if (this.uvLife[i] <= 0) this.uvActive[i] = 0;
    }
    this.uvPoints.visible = uvOn;
    this.uvGeo.attributes.position.needsUpdate = true;
  }

  reset() {
    for (let i = 0; i < this.photonCount; i++) this.resetPhoton(i, true);
    for (let i = 0; i < this.windCount; i++) this.windActive[i] = 0;
    for (let i = 0; i < this.nebulaCount; i++) this.nebulaActive[i] = 0;
    for (let i = 0; i < this.uvCount; i++) this.uvActive[i] = 0;
    this.nebulaMat.opacity = 0.85;
  }
}
