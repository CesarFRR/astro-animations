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

export class ParticleManager {
  constructor(scene) {
    this.scene = scene;

    // Gamma particles
    this.gammaCount = 400;
    this.gammaGeo = new THREE.BufferGeometry();
    this.gammaPos = new Float32Array(this.gammaCount * 3);
    this.gammaVel = [];
    this.gammaLife = new Float32Array(this.gammaCount);
    this.gammaActive = new Float32Array(this.gammaCount);
    for (let i = 0; i < this.gammaCount; i++) {
      this.resetGamma(i, true);
    }
    this.gammaGeo.setAttribute("position", new THREE.BufferAttribute(this.gammaPos, 3));
    const gammaMat = new THREE.PointsMaterial({
      color: 0x00f2ff,
      size: 0.12,
      map: createCircleTexture("#00f2ff"),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.gammaPoints = new THREE.Points(this.gammaGeo, gammaMat);
    this.scene.add(this.gammaPoints);

    // Pair particles (electrons blue, positrons red)
    this.pairCount = 120;
    this.pairGeo = new THREE.BufferGeometry();
    this.pairPos = new Float32Array(this.pairCount * 3);
    this.pairVel = [];
    this.pairType = new Int8Array(this.pairCount); // -1 electron, +1 positron
    this.pairLife = new Float32Array(this.pairCount);
    this.pairActive = new Float32Array(this.pairCount);
    for (let i = 0; i < this.pairCount; i++) this.pairActive[i] = 0;
    this.pairGeo.setAttribute("position", new THREE.BufferAttribute(this.pairPos, 3));
    const pairMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.22,
      map: createCircleTexture("#ffffff"),
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.pairColors = new Float32Array(this.pairCount * 3);
    this.pairGeo.setAttribute("color", new THREE.BufferAttribute(this.pairColors, 3));
    this.pairPoints = new THREE.Points(this.pairGeo, pairMat);
    this.scene.add(this.pairPoints);

    // Ejecta particles (explosion debris)
    this.ejectaCount = 4000;
    this.ejectaGeo = new THREE.BufferGeometry();
    this.ejectaPos = new Float32Array(this.ejectaCount * 3);
    this.ejectaVel = [];
    this.ejectaLife = new Float32Array(this.ejectaCount);
    this.ejectaActive = new Float32Array(this.ejectaCount);
    this.ejectaColor = new Float32Array(this.ejectaCount * 3);
    for (let i = 0; i < this.ejectaCount; i++) this.ejectaActive[i] = 0;
    this.ejectaGeo.setAttribute("position", new THREE.BufferAttribute(this.ejectaPos, 3));
    this.ejectaGeo.setAttribute("color", new THREE.BufferAttribute(this.ejectaColor, 3));
    const ejectaMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.ejectaPoints = new THREE.Points(this.ejectaGeo, ejectaMat);
    this.scene.add(this.ejectaPoints);

    // Nickel-56 particles
    this.nickelCount = 800;
    this.nickelGeo = new THREE.BufferGeometry();
    this.nickelPos = new Float32Array(this.nickelCount * 3);
    this.nickelVel = [];
    this.nickelLife = new Float32Array(this.nickelCount);
    this.nickelActive = new Float32Array(this.nickelCount);
    for (let i = 0; i < this.nickelCount; i++) this.nickelActive[i] = 0;
    this.nickelGeo.setAttribute("position", new THREE.BufferAttribute(this.nickelPos, 3));
    const nickelMat = new THREE.PointsMaterial({
      color: 0xfacc15,
      size: 0.18,
      map: createCircleTexture("#facc15"),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.nickelPoints = new THREE.Points(this.nickelGeo, nickelMat);
    this.scene.add(this.nickelPoints);

    this.time = 0;
  }

  randomPointInSphere(r) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const radius = r * Math.cbrt(Math.random());
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
  }

  resetGamma(i, initial = false) {
    const r = Math.random() * 0.9;
    const pos = this.randomPointInSphere(r);
    this.gammaPos[i * 3] = pos.x;
    this.gammaPos[i * 3 + 1] = pos.y;
    this.gammaPos[i * 3 + 2] = pos.z;
    const dir = pos.clone().normalize();
    const speed = 0.5 + Math.random() * 1.5;
    this.gammaVel[i] = dir.multiplyScalar(speed);
    this.gammaLife[i] = initial ? Math.random() * 2 : 0.6 + Math.random() * 1.2;
    this.gammaActive[i] = 1;
  }

  spawnPair(origin, intensity) {
    // spawn pairs near origin based on intensity (0..1)
    let spawned = 0;
    const target = Math.floor(intensity * 8) + 1;
    for (let i = 0; i < this.pairCount && spawned < target; i++) {
      if (this.pairActive[i]) continue;
      const dir = this.randomPointInSphere(1).normalize();
      const r = 0.2 + Math.random() * 0.8;
      const pos = dir.clone().multiplyScalar(r);
      this.pairPos[i * 3] = pos.x + origin.x;
      this.pairPos[i * 3 + 1] = pos.y + origin.y;
      this.pairPos[i * 3 + 2] = pos.z + origin.z;
      const perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
      if (perp.lengthSq() < 0.1) perp.set(1, 0, 0);
      const speed = 0.15 + Math.random() * 0.25;
      const sign = Math.random() < 0.5 ? -1 : 1;
      this.pairType[i] = sign;
      this.pairVel[i] = perp.multiplyScalar(sign * speed);
      this.pairLife[i] = 0.6 + Math.random() * 0.9;
      this.pairActive[i] = 1;
      const color = new THREE.Color(sign < 0 ? 0x3b82f6 : 0xef4444);
      this.pairColors[i * 3] = color.r;
      this.pairColors[i * 3 + 1] = color.g;
      this.pairColors[i * 3 + 2] = color.b;
      spawned++;
    }
    this.pairGeo.attributes.color.needsUpdate = true;
  }

  spawnEjecta(count, speedScale = 1, nickelFraction = 0.3) {
    let spawned = 0;
    for (let i = 0; i < this.ejectaCount && spawned < count; i++) {
      if (this.ejectaActive[i]) continue;
      const dir = this.randomPointInSphere(1).normalize();
      const r = 2.5 + Math.random() * 1.2;
      const pos = dir.clone().multiplyScalar(r);
      this.ejectaPos[i * 3] = pos.x;
      this.ejectaPos[i * 3 + 1] = pos.y;
      this.ejectaPos[i * 3 + 2] = pos.z;
      const speed = (1.2 + Math.random() * 2.5) * speedScale;
      this.ejectaVel[i] = dir.multiplyScalar(speed);
      this.ejectaLife[i] = 3 + Math.random() * 4;
      this.ejectaActive[i] = 1;
      const isNi = Math.random() < nickelFraction;
      const color = isNi ? new THREE.Color(0xfacc15) : new THREE.Color().setHSL(0.05 + Math.random() * 0.08, 0.8, 0.5);
      this.ejectaColor[i * 3] = color.r;
      this.ejectaColor[i * 3 + 1] = color.g;
      this.ejectaColor[i * 3 + 2] = color.b;
      spawned++;
    }
    this.ejectaGeo.attributes.color.needsUpdate = true;
  }

  spawnNickel(count, speedScale = 1) {
    let spawned = 0;
    for (let i = 0; i < this.nickelCount && spawned < count; i++) {
      if (this.nickelActive[i]) continue;
      const dir = this.randomPointInSphere(1).normalize();
      const r = 1.5 + Math.random() * 1.5;
      const pos = dir.clone().multiplyScalar(r);
      this.nickelPos[i * 3] = pos.x;
      this.nickelPos[i * 3 + 1] = pos.y;
      this.nickelPos[i * 3 + 2] = pos.z;
      const speed = (0.9 + Math.random() * 2.2) * speedScale;
      this.nickelVel[i] = dir.multiplyScalar(speed);
      this.nickelLife[i] = 6 + Math.random() * 4;
      this.nickelActive[i] = 1;
      spawned++;
    }
  }

  update(dt, phaseProgress, phaseName) {
    this.time += dt;

    // Gamma behavior depends on phase
    const gammaVisible = phaseName === "equilibrium" || phaseName === "pairProduction" || phaseName === "collapse" || phaseName === "thermonuclear";
    for (let i = 0; i < this.gammaCount; i++) {
      if (!gammaVisible) {
        this.gammaActive[i] = 0;
        continue;
      }
      if (!this.gammaActive[i]) {
        this.resetGamma(i);
      }
      this.gammaPos[i * 3] += this.gammaVel[i].x * dt;
      this.gammaPos[i * 3 + 1] += this.gammaVel[i].y * dt;
      this.gammaPos[i * 3 + 2] += this.gammaVel[i].z * dt;
      this.gammaLife[i] -= dt;
      const r = Math.sqrt(
        this.gammaPos[i * 3] ** 2 +
        this.gammaPos[i * 3 + 1] ** 2 +
        this.gammaPos[i * 3 + 2] ** 2
      );
      if (this.gammaLife[i] <= 0 || r > 3.5) this.resetGamma(i);
    }
    this.gammaGeo.attributes.position.needsUpdate = true;

    // Pair behavior
    for (let i = 0; i < this.pairCount; i++) {
      if (!this.pairActive[i]) continue;
      const idx = i * 3;
      this.pairPos[idx] += this.pairVel[i].x * dt;
      this.pairPos[idx + 1] += this.pairVel[i].y * dt;
      this.pairPos[idx + 2] += this.pairVel[i].z * dt;
      this.pairLife[i] -= dt;
      if (this.pairLife[i] <= 0) this.pairActive[i] = 0;
    }
    this.pairGeo.attributes.position.needsUpdate = true;

    // Ejecta
    for (let i = 0; i < this.ejectaCount; i++) {
      if (!this.ejectaActive[i]) continue;
      const idx = i * 3;
      this.ejectaVel[i].multiplyScalar(0.999); // slight drag
      this.ejectaPos[idx] += this.ejectaVel[i].x * dt;
      this.ejectaPos[idx + 1] += this.ejectaVel[i].y * dt;
      this.ejectaPos[idx + 2] += this.ejectaVel[i].z * dt;
      this.ejectaLife[i] -= dt;
      if (this.ejectaLife[i] <= 0) this.ejectaActive[i] = 0;
    }
    this.ejectaGeo.attributes.position.needsUpdate = true;

    // Nickel
    for (let i = 0; i < this.nickelCount; i++) {
      if (!this.nickelActive[i]) continue;
      const idx = i * 3;
      this.nickelVel[i].multiplyScalar(0.9995);
      this.nickelPos[idx] += this.nickelVel[i].x * dt;
      this.nickelPos[idx + 1] += this.nickelVel[i].y * dt;
      this.nickelPos[idx + 2] += this.nickelVel[i].z * dt;
      this.nickelLife[i] -= dt;
      if (this.nickelLife[i] <= 0) this.nickelActive[i] = 0;
    }
    this.nickelGeo.attributes.position.needsUpdate = true;

    // Auto-pair spawning during collapse and thermonuclear
    if (phaseName === "pairProduction" || phaseName === "collapse") {
      const intensity = phaseName === "collapse" ? 0.6 + phaseProgress * 0.35 : 0.2 + phaseProgress * 0.4;
      this.spawnPair(new THREE.Vector3(0, 0, 0), intensity);
    }
  }

  setOpacity(phaseName) {
    this.gammaPoints.visible = phaseName !== "remnant";
    this.pairPoints.visible = phaseName !== "remnant" && phaseName !== "explosion";
  }

  reset() {
    for (let i = 0; i < this.gammaCount; i++) this.resetGamma(i, true);
    for (let i = 0; i < this.pairCount; i++) this.pairActive[i] = 0;
    for (let i = 0; i < this.ejectaCount; i++) this.ejectaActive[i] = 0;
    for (let i = 0; i < this.nickelCount; i++) this.nickelActive[i] = 0;
  }
}
