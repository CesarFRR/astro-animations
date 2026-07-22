import * as THREE from "three";

export class PulsarAudio {
  constructor() {
    this.ctx = null;
    this.source = null;
    this.buffer = null;
    this.gain = null;
    this.panner = null;
    this.prox = null;
    this.dist = null;
  }

  async init(url) {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0.35;
      this.panner = this.ctx.createPanner();
      this.panner.panningModel = "HRTF";
      this.panner.distanceModel = "inverse";
      this.panner.refDistance = 50;
      this.panner.maxDistance = 300;
      this.panner.rolloffFactor = 0.5;
      this.panner.positionX.value = 0;
      this.panner.positionY.value = 0;
      this.panner.positionZ.value = 0;
      this.prox = this.ctx.createGain();
      this.prox.gain.value = 1;
      this.dist = this.ctx.createWaveShaper();
      this.dist.curve = this._curve(0);
      this.dist.oversample = "2x";
      const res = await fetch(url);
      this.buffer = await this.ctx.decodeAudioData(await res.arrayBuffer());
    } catch (e) { console.error("Audio:", e); }
  }

  _curve(a) {
    const s = 256, c = new Float32Array(s);
    for (let i = 0; i < s; i++) {
      const x = (i / (s - 1)) * 2 - 1;
      c[i] = ((1 + a) * x) / (1 + a * Math.abs(x));
    }
    return c;
  }

  play() {
    if (!this.buffer || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.loop = true;
    this.source.connect(this.gain).connect(this.prox).connect(this.dist).connect(this.panner).connect(this.ctx.destination);
    this.source.start(0);
  }

  stop() { if (this.source) { this.source.stop(); this.source = null; } }

  updateListener(camera) {
    if (!this.ctx || !camera) return;
    const p = new THREE.Vector3();
    camera.getWorldPosition(p);
    this.ctx.listener.positionX.value = p.x;
    this.ctx.listener.positionY.value = p.y;
    this.ctx.listener.positionZ.value = -p.z;
    const d = new THREE.Vector3();
    camera.getWorldDirection(d);
    this.ctx.listener.forwardX.value = d.x;
    this.ctx.listener.forwardY.value = d.y;
    this.ctx.listener.forwardZ.value = -d.z;
    const u = camera.up.clone().applyQuaternion(camera.quaternion);
    this.ctx.listener.upX.value = u.x;
    this.ctx.listener.upY.value = u.y;
    this.ctx.listener.upZ.value = u.z;
    const dist = p.length();
    this.prox.gain.value = Math.min(4, 40 / Math.max(dist, 1));
    this.dist.curve = this._curve(Math.min(0.6, Math.max(0, (15 - dist) / 15)));
  }
}
