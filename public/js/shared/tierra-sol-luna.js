import * as THREE from "three";
import { cargarTexturasSimples } from "/astro-animations/js/shared/textura-simple.js";

const TAU = Math.PI * 2;
const BASE = "/astro-animations";
const AU = 20;
const DIA_SIDEREO = 23.9345;
const DIA_SOLAR = 24.0;
const ANIO_TROPICAL = 365.2422;
const MES_SIDEREO = 27.3217;
const MES_SINODICO = 29.5306;
const PERIODO_NODOS_LUNARES = 18.6;
const TILT_ECLIPTICA = (23.44 * Math.PI) / 180;
const INCLINACION_LUNAR = (5.14 * Math.PI) / 180;
const E_TIERRA = 0.0167;

const ATM_DIA = new THREE.Color(0x4db2ff);
const ATM_CREPUSCULO = new THREE.Color(0xbc490b);

const ATM_VERTEX = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const ATM_FRAGMENT = /* glsl */ `
  uniform vec3 uSunDir;
  uniform vec3 uDayColor;
  uniform vec3 uTwilightColor;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    float fresnel = 1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir)));
    float sunOrient = dot(normalize(vNormalW), normalize(uSunDir));
    vec3 atmosColor = mix(uTwilightColor, uDayColor, smoothstep(-0.25, 0.75, sunOrient));
    float alpha = pow(clamp(1.0 - (fresnel - 0.73) / 0.27, 0.0, 1.0), 3.0)
      * smoothstep(-0.5, 1.0, sunOrient);
    gl_FragColor = vec4(atmosColor, alpha);
  }
`;

function kepler(M, e) {
  let E = M;
  for (let i = 0; i < 6; i++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }
  return E;
}

export function createBase(scene, opts = {}) {
  const {
    solRadio = 3,
    tierraRadio = 1.2,
    lunaRadio = 0.33,
    distLuna = 4,
    a = AU,
    e = E_TIERRA,
    mostrarOrbitas = true,
    mostrarNubes = true,
    atmosfera = true,
    manager = new THREE.LoadingManager(),
    tierraTextura = null,
    tierraSpecular = null,
    tierraBump = null,
  } = opts;

  const loader = new THREE.TextureLoader(manager);
  const tex = {
    sol: loader.load(`${BASE}/textures/normal/sun.webp`),
    tierra: tierraTextura || loader.load(`${BASE}/textures/normal/earth_daymap.webp`),
    nubes: loader.load(`${BASE}/textures/normal/earth_clouds.webp`),
    luna: loader.load(`${BASE}/textures/normal/moon.webp`),
  };
  tex.tierra.colorSpace = THREE.SRGBColorSpace;
  tex.nubes.colorSpace = THREE.SRGBColorSpace;
  tex.luna.colorSpace = THREE.SRGBColorSpace;

  const sol = new THREE.Group();
  const solMesh = new THREE.Mesh(
    new THREE.SphereGeometry(solRadio, 64, 48),
    new THREE.MeshBasicMaterial({ map: tex.sol })
  );
  solMesh.userData.cuerpo = "sol";
  sol.add(solMesh);
  scene.add(sol);

  const solLight = new THREE.PointLight(0xfff1d0, 900, 0, 2);
  solLight.castShadow = true;
  solLight.shadow.mapSize.set(2048, 2048);
  solLight.shadow.camera.near = 14;
  solLight.shadow.camera.far = 26;
  solLight.shadow.bias = -0.0005;
  solLight.shadow.normalBias = 0.02;
  scene.add(solLight);
  const relleno = new THREE.PointLight(0xffffff, 0.45, 0, 0);
  scene.add(relleno);
  scene.add(new THREE.AmbientLight(0x223355, 0.35));

  const tierra = new THREE.Group();
  const tierraTilt = new THREE.Group();
  tierraTilt.rotation.z = TILT_ECLIPTICA;
  const tierraSpin = new THREE.Group();
  const tierraGeo = new THREE.SphereGeometry(tierraRadio, 64, 48);
  const tierraMesh = new THREE.Mesh(
    tierraGeo,
    new THREE.MeshPhongMaterial({
      map: tex.tierra,
      specular: new THREE.Color(0x333344),
      shininess: 18,
      specularMap: tierraSpecular,
      bumpMap: tierraBump,
      bumpScale: 0.06,
    })
  );
  tierraMesh.userData.cuerpo = "tierra";
  tierraMesh.castShadow = true;
  tierraMesh.receiveShadow = true;
  tierraSpin.add(tierraMesh);
  const nubesMesh = new THREE.Mesh(
    tierraGeo,
    new THREE.MeshPhongMaterial({
      map: tex.nubes,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  nubesMesh.userData.cuerpo = "tierra";
  nubesMesh.scale.setScalar(1.02);
  nubesMesh.receiveShadow = true;
  nubesMesh.visible = mostrarNubes;
  tierraSpin.add(nubesMesh);
  tierraTilt.add(tierraSpin);
  tierra.add(tierraTilt);

  let atmosferaMesh = null;
  if (atmosfera) {
    atmosferaMesh = new THREE.Mesh(
      tierraGeo,
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uSunDir: { value: new THREE.Vector3(1, 0, 0) },
          uDayColor: { value: ATM_DIA.clone() },
          uTwilightColor: { value: ATM_CREPUSCULO.clone() },
        },
        vertexShader: ATM_VERTEX,
        fragmentShader: ATM_FRAGMENT,
      })
    );
    atmosferaMesh.userData.cuerpo = "tierra";
    atmosferaMesh.scale.setScalar(1.04);
    tierra.add(atmosferaMesh);
  }

  scene.add(tierra);

  const lunaOrbita = new THREE.Group();
  lunaOrbita.rotation.x = INCLINACION_LUNAR;
  const luna = new THREE.Group();
  const lunaMesh = new THREE.Mesh(
    new THREE.SphereGeometry(lunaRadio, 48, 32),
    new THREE.MeshPhongMaterial({ map: tex.luna, shininess: 4 })
  );
  lunaMesh.userData.cuerpo = "luna";
  lunaMesh.castShadow = true;
  lunaMesh.receiveShadow = true;
  luna.add(lunaMesh);
  lunaOrbita.add(luna);
  tierra.add(lunaOrbita);

  const orbitas = [];
  if (mostrarOrbitas) {
    const lineaMat = new THREE.LineBasicMaterial({ color: 0x4facfe, transparent: true, opacity: 0.3 });
    const lineaMatLuna = new THREE.LineBasicMaterial({ color: 0x8aa4c8, transparent: true, opacity: 0.3 });
    const ptsTierra = [];
    const b = a * Math.sqrt(1 - e * e);
    for (let i = 0; i <= 128; i++) {
      const ang = (i / 128) * TAU;
      ptsTierra.push(new THREE.Vector3(a * Math.cos(ang), 0, -b * Math.sin(ang)));
    }
    const orbitaTierra = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ptsTierra),
      lineaMat
    );
    scene.add(orbitaTierra);
    orbitas.push(orbitaTierra);

    const ptsLuna = [];
    for (let i = 0; i <= 64; i++) {
      const ang = (i / 64) * TAU;
      ptsLuna.push(new THREE.Vector3(distLuna * Math.cos(ang), 0, -distLuna * Math.sin(ang)));
    }
    const orbitaLuna = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ptsLuna),
      lineaMatLuna
    );
    lunaOrbita.add(orbitaLuna);
    orbitas.push(orbitaLuna);
  }

  const sim = {
    dias: 0,
    M: 0,
    MLuna: 0,
    nodo: 0,
    spin: 0,
    a,
    e,
    distLuna,
  };

  return { sol, solMesh, tierra, tierraTilt, tierraSpin, lunaOrbita, luna, orbitas, atmosfera: atmosferaMesh, sim, tex, manager, solRadio, tierraRadio, lunaRadio, relleno };
}

export function updateBase(sim, refs, dt) {
  sim.dias += dt;

  sim.M = (sim.M + (TAU * dt) / ANIO_TROPICAL) % TAU;
  const E = kepler(sim.M, sim.e);
  const x = sim.a * (Math.cos(E) - sim.e);
  const z = -sim.a * Math.sqrt(1 - sim.e * sim.e) * Math.sin(E);
  refs.tierra.position.set(x, 0, z);

  sim.spin = (sim.spin + (TAU * dt) / DIA_SIDEREO) % TAU;
  refs.tierraSpin.rotation.y = sim.spin;

  sim.MLuna = (sim.MLuna + (TAU * dt) / MES_SIDEREO) % TAU;
  sim.nodo = (sim.nodo - (TAU * dt) / (PERIODO_NODOS_LUNARES * ANIO_TROPICAL)) % TAU;
  refs.lunaOrbita.rotation.y = sim.nodo;
  refs.luna.position.set(
    sim.distLuna * Math.cos(sim.MLuna),
    0,
    -sim.distLuna * Math.sin(sim.MLuna)
  );

  refs.sol.rotation.y += (TAU * dt) / 25.05;

  if (refs.atmosfera) {
    refs.atmosfera.material.uniforms.uSunDir.value
      .copy(refs.sol.position)
      .sub(refs.tierra.position)
      .normalize();
  }
}

export function distanciaTierraSol(sim, a) {
  const E = kepler(sim.M, sim.e);
  return a * (1 - sim.e * Math.cos(E));
}

export function crearTierraSola(scene, opts = {}) {
  const { radio = 1.2, manager = new THREE.LoadingManager(), atmosfera = true, crepusculo = false } = opts;
  const sencillas = cargarTexturasSimples(manager);
  const loader = new THREE.TextureLoader(manager);
  const tex = {
    dia: loader.load(`${BASE}/textures/normal/earth_daymap.webp`),
    nubes: loader.load(`${BASE}/textures/normal/earth_clouds.webp`),
  };
  tex.dia.colorSpace = THREE.SRGBColorSpace;
  tex.dia.anisotropy = 8;
  tex.nubes.colorSpace = THREE.SRGBColorSpace;
  tex.nubes.anisotropy = 8;

  const tierra = new THREE.Group();
  const tierraTilt = new THREE.Group();
  tierraTilt.rotation.z = TILT_ECLIPTICA;
  const tierraSpin = new THREE.Group();
  const geo = new THREE.SphereGeometry(radio, 96, 64);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshPhongMaterial({
      map: tex.dia,
      specular: new THREE.Color(0x333344),
      shininess: 18,
      specularMap: sencillas.specular,
      bumpMap: sencillas.bump,
      bumpScale: 0.06,
    })
  );
  tierraSpin.add(mesh);
  const nubes = new THREE.Mesh(
    geo,
    new THREE.MeshPhongMaterial({
      map: tex.nubes,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  nubes.scale.setScalar(1.02);
  tierraSpin.add(nubes);
  tierraTilt.add(tierraSpin);
  tierra.add(tierraTilt);
  scene.add(tierra);

  const luz = new THREE.DirectionalLight(0xfff1d0, 1.15);
  luz.position.set(30, 15, 25);
  scene.add(luz);
  scene.add(luz.target);
  scene.add(new THREE.AmbientLight(0x223355, 0.35));

  let atmosferaMesh = null;
  if (atmosfera) {
    const dirSol = luz.position.clone().normalize();
    const twilight = crepusculo ? ATM_CREPUSCULO.clone() : ATM_DIA.clone();
    atmosferaMesh = new THREE.Mesh(
      geo,
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uSunDir: { value: dirSol },
          uDayColor: { value: ATM_DIA.clone() },
          uTwilightColor: { value: twilight },
        },
        vertexShader: ATM_VERTEX,
        fragmentShader: ATM_FRAGMENT,
      })
    );
    atmosferaMesh.scale.setScalar(1.04);
    tierra.add(atmosferaMesh);
  }

  const sim = { dias: 0 };
  return { tierra, tierraTilt, tierraSpin, nubes, atmosfera: atmosferaMesh, luz, sim, tex, manager, radio };
}

export function updateTierraSola(sim, refs, dt) {
  sim.dias += dt;
  refs.tierraSpin.rotation.y = (TAU * sim.dias) / DIA_SIDEREO;
}

export function crearLunaSola(scene, opts = {}) {
  const { radio = 0.6, manager = new THREE.LoadingManager() } = opts;
  const loader = new THREE.TextureLoader(manager);
  const tex = { luna: loader.load(`${BASE}/textures/normal/moon.webp`) };
  tex.luna.colorSpace = THREE.SRGBColorSpace;
  tex.luna.anisotropy = 8;

  const luna = new THREE.Mesh(
    new THREE.SphereGeometry(radio, 64, 48),
    new THREE.MeshPhongMaterial({ map: tex.luna, shininess: 4 })
  );
  scene.add(luna);

  const luz = new THREE.DirectionalLight(0xffffff, 1.0);
  luz.position.set(15, 10, 20);
  scene.add(luz);
  scene.add(luz.target);
  scene.add(new THREE.AmbientLight(0x223355, 0.4));

  const sim = { dias: 0 };
  return { luna, luz, sim, tex, manager, radio };
}

export function updateLunaSola(sim, refs, dt) {
  sim.dias += dt;
  refs.luna.rotation.y = (TAU * sim.dias) / MES_SIDEREO;
}
