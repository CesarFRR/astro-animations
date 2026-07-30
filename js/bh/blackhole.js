import * as THREE from "three";

// Agujero negro mejorado con física de los shaders de referencia:
// - Perfil del disco Shakura-Sunyaev (zero-torque): flux = (1-√(1/x))/x³,
//   pico en x = 49/36 ≈ 1.36 r_in. Temperatura T ∝ x^-3/4 · (1-√(1/x))^1/4.
// - Temperatura → color cuerpo negro (3000 K naranja → 30000 K azul-blanco).
// - Doppler beaming: lado que se acerca más brillante y azul (T/δ), el que se
//   aleja más tenue y rojo. Clamp cinematográfico [0.62, 1.48] como en
//   Interstellar para mantener el disco equilibrado.
// - Borde interno del disco en el ISCO (3 rs para Schwarzschild).
// - Disco "doblado" por geometría (vertex trick, sin raytracing).
// - Jets parabólicos (R ∝ z^0.58, Asada & Nakamura) con nudos de
//   reconfinamiento (ondas estacionarias sin²).

const DISK_INNER = 3.0;
const DISK_OUTER = 8.5;
const BEND_HEIGHT = 2.5;

function buildHalfDisk(thetaStart, thetaEnd, bendFn) {
  const radialSegs = 12;
  const angularSegs = 80;
  const positions = [];
  const indices = [];
  const radii = [];
  const thetas = [];

  for (let i = 0; i <= radialSegs; i++) {
    const r = DISK_INNER + ((DISK_OUTER - DISK_INNER) * i) / radialSegs;
    for (let j = 0; j <= angularSegs; j++) {
      const theta = thetaStart + ((thetaEnd - thetaStart) * j) / angularSegs;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      const y = bendFn ? bendFn(r, theta) : 0;
      positions.push(x, y, z);
      radii.push(r / DISK_INNER); // x = r / r_in
      thetas.push(theta);
    }
  }
  for (let i = 0; i < radialSegs; i++) {
    for (let j = 0; j < angularSegs; j++) {
      const a = i * (angularSegs + 1) + j;
      const b = a + angularSegs + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("aRadius", new THREE.Float32BufferAttribute(radii, 1));
  geo.setAttribute("aTheta", new THREE.Float32BufferAttribute(thetas, 1));
  geo.setIndex(indices);
  return geo;
}

const diskVertexShader = `
  attribute float aRadius;
  attribute float aTheta;
  varying float vX;
  varying float vTheta;
  void main() {
    vX = max(aRadius, 1.0001);
    vTheta = aTheta;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const diskFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  varying float vX;
  varying float vTheta;

  // Temperatura (kK) -> color cuerpo negro aproximado
  vec3 tempToColor(float T) {
    vec3 c1 = vec3(1.0, 0.35, 0.08);  // ~3000 K naranja-rojo
    vec3 c2 = vec3(1.0, 0.75, 0.45);  // ~6000 K amarillo
    vec3 c3 = vec3(1.0, 0.95, 0.9);   // ~12000 K blanco
    vec3 c4 = vec3(0.72, 0.84, 1.0);  // ~30000 K azul-blanco
    if (T < 6000.0) return mix(c1, c2, clamp((T - 3000.0) / 3000.0, 0.0, 1.0));
    if (T < 12000.0) return mix(c2, c3, (T - 6000.0) / 6000.0);
    return mix(c3, c4, clamp((T - 12000.0) / 18000.0, 0.0, 1.0));
  }

  void main() {
    // Perfil Shakura-Sunyaev (zero-torque): flujo y temperatura
    float flux = max(1.0 - inversesqrt(vX), 0.0) / (vX * vX * vX);
    flux *= 14.0;
    float T = 22000.0 * 2.0491 * pow(vX, -0.75) * pow(max(1.0 - inversesqrt(vX), 0.02), 0.25);

    // Turbulencia: espiral logarítmica + ruido senoidal multi-octava, en frame co-rotante
    float phase = vTheta - uTime * 1.1 / pow(vX, 1.5); // Ω ∝ r^-3/2 (Kepler)
    float n = sin(phase * 3.0 + vX * 14.0 + uTime * 0.4) * 0.5
            + sin(phase * 7.0 - vX * 30.0 - uTime * 0.7) * 0.3
            + sin(phase * 13.0 + vX * 55.0 + uTime * 1.1) * 0.2;
    float swirl = sin(12.0 * phase + 8.0 * log(vX) + 3.0 * n);
    float isco = exp(-0.8 * max(vX - 1.0, 0.0)); // micro-caos cerca del ISCO
    float plasma = 0.5 + 0.5 * n;
    float turb = (0.45 + 1.2 * plasma) * (0.82 + 0.18 * swirl) * (1.0 + 0.6 * isco);

    // Doppler beaming (fijo respecto al observador): lado sin(vTheta) > 0 se acerca
    float v = 0.5 * inversesqrt(max(vX, 1.01)); // velocidad aprox (fracción de c)
    float delta = clamp(1.0 + v * sin(vTheta), 0.62, 1.48); // clamp cinematográfico
    float beam = pow(delta, 1.8);
    T /= delta; // el lado que se acerca se ve más azul; el que se aleja, más rojo

    // Inner glow (borde caliente) + fades
    float innerGlow = exp(-6.0 * (vX - 1.0));
    float edge = smoothstep(1.0, 1.06, vX) * (1.0 - smoothstep(2.2, 2.6, vX) * 0.8);

    float I = flux * turb * beam * (1.0 + 0.6 * innerGlow) * edge;
    vec3 color = tempToColor(T) * I * 0.65;
    gl_FragColor = vec4(color, uOpacity * clamp(I * 0.7, 0.0, 1.0));
  }
`;

const jetVertexShader = `
  varying float vY;
  varying float vR;
  void main() {
    vY = uv.y;
    vR = length(position.xz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const jetFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  varying float vY;
  varying float vR;
  void main() {
    float z = vY * 9.0;
    // Nudos de reconfinamiento: ondas estacionarias sin² con envolvente
    float knot = sin(3.14159 * z / 2.6); knot *= knot;
    float env = smoothstep(1.0, 3.0, z) * (1.0 - smoothstep(5.5, 8.0, z));
    float knots = 1.0 + 0.5 * knot * env;
    // Temperatura: base caliente (35000 K) -> lejos fría (12000 K)
    float T = mix(35000.0, 12000.0, smoothstep(1.0, 8.0, z));
    vec3 cHot = vec3(0.75, 0.87, 1.0);
    vec3 cCold = vec3(0.45, 0.6, 1.0);
    vec3 color = mix(cHot, cCold, smoothstep(1.0, 8.0, z));
    float flicker = 0.85 + 0.15 * sin(uTime * 7.0 + z * 4.0);
    float fade = pow(1.0 - vY, 1.4) * smoothstep(0.0, 0.06, vY);
    gl_FragColor = vec4(color * knots * flicker, uOpacity * fade * knots);
  }
`;

export class BlackHole {
  constructor(group) {
    this.group = new THREE.Group();
    this.group.visible = false;
    group.add(this.group);

    // Event horizon: pure black sphere (r = 1 rs)
    const horizonGeo = new THREE.SphereGeometry(1, 48, 48);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.horizon = new THREE.Mesh(horizonGeo, horizonMat);
    this.group.add(this.horizon);

    // Photon ring (photon sphere at 1.5 rs)
    const ringGeo = new THREE.TorusGeometry(1.5, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.photonRing = new THREE.Mesh(ringGeo, ringMat);
    this.group.add(this.photonRing);

    // Disk group (tilted ~18° for the Interstellar look)
    this.diskGroup = new THREE.Group();
    this.diskGroup.rotation.x = 0.32;
    this.diskTilt = 0.32;
    this.group.add(this.diskGroup);

    this.diskUniforms = {
      uTime: { value: 0 },
      uOpacity: { value: 0 }
    };
    const diskMat = new THREE.ShaderMaterial({
      vertexShader: diskVertexShader,
      fragmentShader: diskFragmentShader,
      uniforms: this.diskUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    // Front half: flat
    const frontGeo = buildHalfDisk(0, Math.PI, null);
    this.diskFront = new THREE.Mesh(frontGeo, diskMat);
    this.diskGroup.add(this.diskFront);

    // Back half: bent upwards over the BH (vertex trick)
    const backGeo = buildHalfDisk(Math.PI, 2 * Math.PI, (r, theta) => {
      const arc = Math.sin(theta - Math.PI);
      const innerBoost = 1 + (1 - (r - DISK_INNER) / (DISK_OUTER - DISK_INNER)) * 0.5;
      return BEND_HEIGHT * Math.pow(arc, 1.5) * innerBoost;
    });
    this.diskBack = new THREE.Mesh(backGeo, diskMat);
    this.diskGroup.add(this.diskBack);

    // Inner rim: hot bright torus at the ISCO
    const rimGeo = new THREE.TorusGeometry(DISK_INNER, 0.16, 16, 100);
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0xfff3dd, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.innerRim = new THREE.Mesh(rimGeo, rimMat);
    this.diskGroup.add(this.innerRim);

    // Jets: parabolic lathe profile R(z) ∝ z^0.58 (Asada & Nakamura)
    this.jetUniforms = {
      uTime: { value: 0 },
      uOpacity: { value: 0 }
    };
    const jetMat = new THREE.ShaderMaterial({
      vertexShader: jetVertexShader,
      fragmentShader: jetFragmentShader,
      uniforms: this.jetUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const profile = [];
    for (let i = 0; i <= 24; i++) {
      const z = (i / 24) * 9;
      profile.push(new THREE.Vector2(0.12 + 0.85 * Math.pow(z / 9, 0.58), z));
    }
    const jetGeo = new THREE.LatheGeometry(profile, 24);
    this.jetTop = new THREE.Mesh(jetGeo, jetMat);
    this.jetBottom = new THREE.Mesh(jetGeo, jetMat);
    this.jetBottom.rotation.z = Math.PI;
    this.group.add(this.jetTop);
    this.group.add(this.jetBottom);

    // Jet particles
    this.jetPCount = 220;
    this.jetPGeo = new THREE.BufferGeometry();
    this.jetPPos = new Float32Array(this.jetPCount * 3);
    this.jetPSpeed = new Float32Array(this.jetPCount);
    this.jetPSide = new Float32Array(this.jetPCount);
    for (let i = 0; i < this.jetPCount; i++) this.resetJetParticle(i, true);
    this.jetPGeo.setAttribute("position", new THREE.BufferAttribute(this.jetPPos, 3));
    const jetPMat = new THREE.PointsMaterial({
      color: 0xaaccff, size: 0.12, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.jetPoints = new THREE.Points(this.jetPGeo, jetPMat);
    this.jetPointsMat = jetPMat;
    this.group.add(this.jetPoints);

    // Ergosphere subtle glow
    const ergoGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const ergoMat = new THREE.MeshBasicMaterial({
      color: 0x4466ff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false
    });
    this.ergo = new THREE.Mesh(ergoGeo, ergoMat);
    this.group.add(this.ergo);

    this.time = 0;
    this.intensity = 0;
  }

  resetJetParticle(i, randomY = false) {
    const side = Math.random() < 0.5 ? 1 : -1;
    this.jetPSide[i] = side;
    const y = randomY ? (0.5 + Math.random() * 8) * side : 0.5 * side;
    this.jetPPos[i * 3] = (Math.random() - 0.5) * 0.3;
    this.jetPPos[i * 3 + 1] = y;
    this.jetPPos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    this.jetPSpeed[i] = 5 + Math.random() * 4;
  }

  setIntensity(t) {
    this.intensity = t;
    this.group.visible = t > 0.01;
    const s = 0.2 + 0.8 * t;
    this.group.scale.setScalar(s);
    this.photonRing.material.opacity = t * 0.9;
    this.ergo.material.opacity = t * 0.12;
    this.diskUniforms.uOpacity.value = t * 0.9;
    this.innerRim.material.opacity = t * 0.95;
    this.jetUniforms.uOpacity.value = t * 0.75;
    this.jetPointsMat.opacity = t * 0.9;
  }

  update(dt) {
    if (!this.group.visible) return;
    this.time += dt;
    this.diskUniforms.uTime.value = this.time;
    this.jetUniforms.uTime.value = this.time;
    this.photonRing.material.opacity = this.intensity * (0.75 + 0.15 * Math.sin(this.time * 3));
    this.photonRing.rotation.y += dt * 0.3;
    this.innerRim.rotation.y += dt * 0.8;
    for (let i = 0; i < this.jetPCount; i++) {
      this.jetPPos[i * 3 + 1] += this.jetPSide[i] * this.jetPSpeed[i] * dt;
      if (Math.abs(this.jetPPos[i * 3 + 1]) > 9) this.resetJetParticle(i);
    }
    this.jetPGeo.attributes.position.needsUpdate = true;
  }
}
