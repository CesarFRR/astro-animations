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

export class BhParticles {
  constructor(group) {
    this.group = group;

    // Neutrinos: tiny, very fast, cyan-white
    this.nuCount = 1200;
    this.nuGeo = new THREE.BufferGeometry();
    this.nuPos = new Float32Array(this.nuCount * 3);
    this.nuVel = [];
    this.nuLife = new Float32Array(this.nuCount);
    this.nuActive = new Uint8Array(this.nuCount);
    for (let i = 0; i < this.nuCount; i++) this.nuActive[i] = 0;
    this.nuGeo.setAttribute("position", new THREE.BufferAttribute(this.nuPos, 3));
    const nuMat = new THREE.PointsMaterial({
      color: 0xaaffee, size: 0.09, map: createCircleTexture("#aaffee"),
      transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.nuPoints = new THREE.Points(this.nuGeo, nuMat);
    this.group.add(this.nuPoints);

    // Ejecta: orange-red explosion debris
    this.ejCount = 2500;
    this.ejGeo = new THREE.BufferGeometry();
    this.ejPos = new Float32Array(this.ejCount * 3);
    this.ejVel = [];
    this.ejLife = new Float32Array(this.ejCount);
    this.ejActive = new Uint8Array(this.ejCount);
    this.ejFallback = new Uint8Array(this.ejCount); // 1 = will fall back
    for (let i = 0; i < this.ejCount; i++) this.ejActive[i] = 0;
    this.ejGeo.setAttribute("position", new THREE.BufferAttribute(this.ejPos, 3));
    const ejMat = new THREE.PointsMaterial({
      color: 0xff8844, size: 0.15, map: createCircleTexture("#ff8844"),
      transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.ejPoints = new THREE.Points(this.ejGeo, ejMat);
    this.group.add(this.ejPoints);

    // Accretion stream: matter spiraling into the disk
    this.accCount = 900;
    this.accGeo = new THREE.BufferGeometry();
    this.accPos = new Float32Array(this.accCount * 3);
    this.accR = new Float32Array(this.accCount);    // orbital radius
    this.accTheta = new Float32Array(this.accCount); // angle
    this.accSpeed = new Float32Array(this.accCount);
    this.accActive = new Uint8Array(this.accCount);
    for (let i = 0; i < this.accCount; i++) this.accActive[i] = 0;
    this.accGeo.setAttribute("position", new THREE.BufferAttribute(this.accPos, 3));
    const accMat = new THREE.PointsMaterial({
      color: 0xffdd44, size: 0.13, map: createCircleTexture("#ffdd44"),
      transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.accPoints = new THREE.Points(this.accGeo, accMat);
    this.group.add(this.accPoints);
  }

  randomDir() {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    return new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi));
  }

  spawnNeutrinos(count, speedBase = 8) {
    let spawned = 0;
    for (let i = 0; i < this.nuCount && spawned < count; i++) {
      if (this.nuActive[i]) continue;
      const dir = this.randomDir();
      const pos = dir.clone().multiplyScalar(0.3);
      this.nuPos[i * 3] = pos.x;
      this.nuPos[i * 3 + 1] = pos.y;
      this.nuPos[i * 3 + 2] = pos.z;
      this.nuVel[i] = dir.multiplyScalar(speedBase * (0.7 + Math.random() * 0.6));
      this.nuLife[i] = 2 + Math.random() * 2;
      this.nuActive[i] = 1;
      spawned++;
    }
  }

  spawnEjecta(count, fallbackFraction = 0.25) {
    let spawned = 0;
    for (let i = 0; i < this.ejCount && spawned < count; i++) {
      if (this.ejActive[i]) continue;
      const dir = this.randomDir();
      const pos = dir.clone().multiplyScalar(2 + Math.random() * 2);
      this.ejPos[i * 3] = pos.x;
      this.ejPos[i * 3 + 1] = pos.y;
      this.ejPos[i * 3 + 2] = pos.z;
      this.ejVel[i] = dir.multiplyScalar(1.5 + Math.random() * 2.5);
      this.ejLife[i] = 14 + Math.random() * 10;
      this.ejActive[i] = 1;
      this.ejFallback[i] = Math.random() < fallbackFraction ? 1 : 0;
      spawned++;
    }
  }

  spawnAccretion(count) {
    let spawned = 0;
    for (let i = 0; i < this.accCount && spawned < count; i++) {
      if (this.accActive[i]) continue;
      this.accR[i] = 6 + Math.random() * 8;
      this.accTheta[i] = Math.random() * Math.PI * 2;
      this.accSpeed[i] = 0.8 + Math.random() * 1.2;
      this.accActive[i] = 1;
      spawned++;
    }
  }

  update(dt, phase, local, diskTilt) {
    // Neutrinos burst during coreCollapse and early explosion
    if (phase === "coreCollapse") this.spawnNeutrinos(Math.ceil(40 + local * 60));
    else if (phase === "explosion" && local < 0.5) this.spawnNeutrinos(30);
    for (let i = 0; i < this.nuCount; i++) {
      if (!this.nuActive[i]) continue;
      this.nuPos[i * 3] += this.nuVel[i].x * dt;
      this.nuPos[i * 3 + 1] += this.nuVel[i].y * dt;
      this.nuPos[i * 3 + 2] += this.nuVel[i].z * dt;
      this.nuLife[i] -= dt;
      if (this.nuLife[i] <= 0) this.nuActive[i] = 0;
    }
    this.nuPoints.visible = this.nuActive.some(a => a);
    this.nuGeo.attributes.position.needsUpdate = true;

    // Ejecta: spawned at explosion; part of it falls back (fallback) during blackHole phase
    if (phase === "explosion" && local < 0.3) this.spawnEjecta(120, 0.3);
    const isFallingBack = phase === "blackHole" || phase === "accretionDisk";
    for (let i = 0; i < this.ejCount; i++) {
      if (!this.ejActive[i]) continue;
      const idx = i * 3;
      if (isFallingBack && this.ejFallback[i]) {
        // Decelerate and reverse: gravity pulls matter back to the center
        const px = this.ejPos[idx], py = this.ejPos[idx + 1], pz = this.ejPos[idx + 2];
        const r = Math.hypot(px, py, pz) || 0.001;
        const g = 6 / (r * r); // fake gravity
        this.ejVel[i].x -= (px / r) * g * dt * 4;
        this.ejVel[i].y -= (py / r) * g * dt * 4;
        this.ejVel[i].z -= (pz / r) * g * dt * 4;
        if (r < 0.5) { this.ejActive[i] = 0; continue; } // swallowed by the BH
      } else {
        this.ejVel[i].multiplyScalar(0.999);
      }
      this.ejPos[idx] += this.ejVel[i].x * dt;
      this.ejPos[idx + 1] += this.ejVel[i].y * dt;
      this.ejPos[idx + 2] += this.ejVel[i].z * dt;
      this.ejLife[i] -= dt;
      if (this.ejLife[i] <= 0) this.ejActive[i] = 0;
    }
    this.ejPoints.visible = phase === "explosion" || isFallingBack;
    this.ejGeo.attributes.position.needsUpdate = true;

    // Accretion stream during accretionDisk phase: spiral inward in the disk plane
    const accreting = phase === "accretionDisk";
    if (accreting) this.spawnAccretion(Math.ceil(6 + local * 10));
    const tilt = diskTilt || 0;
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    for (let i = 0; i < this.accCount; i++) {
      if (!this.accActive[i]) continue;
      this.accR[i] -= (0.5 + 1.5 / this.accR[i]) * dt * 1.2;
      this.accTheta[i] += (this.accSpeed[i] * 2.5) / Math.max(this.accR[i], 0.5) * dt;
      if (this.accR[i] <= 1.7) { this.accActive[i] = 0; continue; } // reaches the disk
      const x = this.accR[i] * Math.cos(this.accTheta[i]);
      const z = this.accR[i] * Math.sin(this.accTheta[i]);
      // tilt the disk plane around X axis to match the visual disk
      const y = z * sinT * 0.15;
      const z2 = z * cosT;
      this.accPos[i * 3] = x;
      this.accPos[i * 3 + 1] = y;
      this.accPos[i * 3 + 2] = z2;
    }
    this.accPoints.visible = accreting;
    this.accGeo.attributes.position.needsUpdate = true;
  }

  reset() {
    for (let i = 0; i < this.nuCount; i++) this.nuActive[i] = 0;
    for (let i = 0; i < this.ejCount; i++) this.ejActive[i] = 0;
    for (let i = 0; i < this.accCount; i++) this.accActive[i] = 0;
  }
}
