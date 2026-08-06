import * as THREE from "three";
import { createScene } from "/astro-animations/js/shared/setup.js";
import { createStarfield, updateTwinkle } from "/astro-animations/js/shared/starfield.js";
import { crearTierraSola, updateTierraSola } from "/astro-animations/js/shared/tierra-sol-luna.js";
import { crearNavegacionTeclado } from "/astro-animations/js/shared/navegacion.js";
import { crearLODTierra } from "/astro-animations/js/shared/lod-texturas.js";
import { crearCapasTierra } from "/astro-animations/js/shared/capas-tierra.js";
import { initPanelOpciones } from "/astro-animations/js/shared/panel-opciones.js";

// ===== Explorador de la Tierra reutilizable =====
// Motor de vuelo libre compartido por "tierra-libre" (capasActivas: false)
// y "tierra-capas" (capasActivas: true). Solo cambia la configuración
// inicial: posición de cámara, distancia mínima y estado del toggle de capas.

export function iniciarExploradorTierra(opts = {}) {
  const {
    cameraPos = [2.2, 1.3, 4.5],
    minDistance = 1.5,
    maxDistance = 80,
    capasActivas = false,
  } = opts;

  const { renderer, scene, camera, controls, composer } = createScene({
    bloomStrength: 0.0,
    bloomRadius: 0.5,
    bloomThreshold: 0.6,
    fogDensity: 0.003,
    cameraPos,
  });

  controls.minDistance = minDistance;
  controls.maxDistance = maxDistance;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 1.1;
  controls.minPolarAngle = 0.05;
  controls.maxPolarAngle = Math.PI - 0.05;

  const sf = createStarfield(scene, 4000, 60, 500);

  const tierra = crearTierraSola(scene, { sunDir: new THREE.Vector3(1.3, 0.45, 0.9).normalize() });
  const navegar = crearNavegacionTeclado(camera, controls);
  const lodTierra = crearLODTierra(
    [
      { material: tierra.mesh.material, prop: "map" },
      { set: (t) => { tierra.uniforms.uNight.value = t; } },
      { material: tierra.nubes1.material, uniform: "uClouds", uniformPrev: "uCloudsPrev", uniformBlend: "uCloudBlend", linear: true },
    ],
    [
      { max: null, texs: [tierra.tex.dia, tierra.tex.noche, tierra.tex.nubes] },
      {
        max: 4.0,
        urls: [
          "/astro-animations/textures/max/4k_earth_daymap.webp",
          "/astro-animations/textures/max/4k_earth_nightmap.webp",
          "/astro-animations/textures/max/4k_earth_clouds.webp",
        ],
        srgb: true,
      },
      {
        max: 3.0,
        urls: [
          "/astro-animations/textures/max/8k_earth_daymap.webp",
          "/astro-animations/textures/max/8k_earth_nightmap.webp",
          "/astro-animations/textures/max/8k_earth_clouds.webp",
        ],
        srgb: true,
      },
    ]
  );
  lodTierra.precargarTodo();

  // Capas internas: siempre se crean; el toggle decide si se muestran.
  renderer.localClippingEnabled = true;
  const capas = crearCapasTierra(scene, { radio: tierra.radio });
  capas.grupo.position.set(0, 0, 0);
  let capasActivo = false;

  // Planos de recorte en ESPACIO DEL MUNDO. El hueco de la tajada debe quedar
  // hacia el espectador o hacia el lado iluminado (el sol), así que los planos
  // se orientan según la cámara o la dirección del sol, NO según la rotación
  // del spin: las paredes quedan fijas en el mundo mientras la Tierra rota
  // bajo ellas.
  const planos = capas.planos; // planos locales (hueco en x>0,y>0,z>0)
  const planosMundo = planos.map(() => new THREE.Plane());
  const tmpQuat = new THREE.Quaternion();
  const tmpVec = new THREE.Vector3();
  const dirHueco = new THREE.Vector3(1, 1, 1).normalize();

  // Dirección objetivo de la tajada: hacia la cámara por defecto; si estamos
  // en modo "solo día" (uModo=1), hacia el sol para que el corte quede en la
  // parte iluminada.
  function direccionTajada() {
    const modo = tierra.uniforms.uModo.value;
    if (modo === 1) return tierra.uniforms.uSunDir.value.clone().normalize();
    return tmpVec.copy(camera.position).normalize();
  }

  // Refresca planosMundo según la dirección actual de la cámara/sol, orienta
  // el grupo de paredes con el mismo quaternion y sube los valores a los
  // ShaderMaterial custom (vPosW en el fragment está en el mundo).
  function sincronizarPlanosMundo() {
    tmpQuat.setFromUnitVectors(dirHueco, direccionTajada());
    capas.grupo.quaternion.copy(tmpQuat);
    planos.forEach((p, i) => {
      planosMundo[i].copy(p);
      planosMundo[i].normal.applyQuaternion(tmpQuat);
    });
    [
      { material: tierra.mesh?.material },
      { material: tierra.nubes1?.material },
      { material: tierra.atmosfera?.material },
    ].forEach(({ material }) => {
      if (!material || !material.uniforms || !material.uniforms.uClipPlanes) return;
      planosMundo.forEach((p, i) => {
        material.uniforms.uClipPlanes.value[i].set(p.normal.x, p.normal.y, p.normal.z, p.constant);
      });
    });
  }

  // (Des)activa el recorte en un material con los planos de mundo actuales.
  function aplicarClipMaterial(material, activa) {
    if (material.uniforms && material.uniforms.uClipPlanes && material.uniforms.uClipActivo) {
      material.uniforms.uClipActivo.value = activa ? 1.0 : 0.0;
      if (activa) {
        planosMundo.forEach((p, i) => {
          material.uniforms.uClipPlanes.value[i].set(p.normal.x, p.normal.y, p.normal.z, p.constant);
        });
      }
      return;
    }
    if (activa) {
      material.clippingPlanes = planosMundo;
      material.clipIntersection = true;
    } else {
      material.clippingPlanes = [];
      material.clipIntersection = false;
    }
    // Forzar la recompilación del shader: tres inyecta los chunks de clipping
    // solo si numClippingPlanes cambia, y con customProgramCacheKey/onBeforeCompile
    // hay que marcarlo explícitamente.
    material.needsUpdate = true;
  }

  function mostrarCapas(activa) {
    capasActivo = activa;
    if (activa) {
      // La superficie texturizada, las nubes y la atmósfera se recortan con
      // los mismos planos de mundo: se ve la Tierra con mares y continentes
      // "abierta", con las paredes de las capas por dentro de la tajada.
      sincronizarPlanosMundo();
      aplicarClipMaterial(tierra.mesh.material, true);
      aplicarClipMaterial(tierra.nubes1.material, true);
      if (tierra.atmosfera) aplicarClipMaterial(tierra.atmosfera.material, true);
      if (tierra.nubes1 && optNubes) tierra.nubes1.visible = optNubes.checked;
      capas.setVisible(true);
    } else {
      aplicarClipMaterial(tierra.mesh.material, false);
      aplicarClipMaterial(tierra.nubes1.material, false);
      if (tierra.atmosfera) aplicarClipMaterial(tierra.atmosfera.material, false);
      tierra.nubes1.visible = optNubes ? optNubes.checked : true;
      if (tierra.atmosfera) {
        const activa = optAtmosfera ? optAtmosfera.checked : true;
        tierra.atmosfera.visible = activa;
        if (tierra.uniforms.uAtmActivo) tierra.uniforms.uAtmActivo.value = activa && (tierra.uniforms.uModo.value !== 2) ? 1.0 : 0.0;
      }
      capas.setVisible(false);
    }
  }

  let playing = true;
  let rotar = true;
  let speed = 0.1;
  const playBtn = document.getElementById("btn-play");
  const speedSelect = document.getElementById("speed");
  playBtn.addEventListener("click", () => {
    playing = !playing;
    playBtn.textContent = playing ? "⏸" : "▶";
  });
  speedSelect.addEventListener("change", (e) => {
    speed = parseFloat(e.target.value);
  });

  function setSeg(botones, clave, valor) {
    botones.forEach((b) => b.classList.toggle("active", b.dataset[clave] === String(valor)));
  }

  function actualizarAtmosfera() {
    const activa = optAtmosfera.checked && (tierra.uniforms.uModo.value !== 2);
    if (tierra.atmosfera) tierra.atmosfera.visible = activa;
    if (tierra.uniforms.uAtmActivo) tierra.uniforms.uAtmActivo.value = activa ? 1.0 : 0.0;
  }

  const optNubes = document.getElementById("opt-nubes");
  const optAtmosfera = document.getElementById("opt-atmosfera");
  const optRelieve = document.getElementById("opt-relieve");
  const optCapas = document.getElementById("opt-capas");
  const segIlum = document.querySelectorAll("#opt-iluminacion button");
  const segCalidad = document.querySelectorAll("#opt-calidad button");

  optNubes?.addEventListener("change", (e) => {
    tierra.nubes1.visible = e.target.checked;
  });
  optAtmosfera?.addEventListener("change", actualizarAtmosfera);
  optRelieve?.addEventListener("change", (e) => {
    tierra.mesh.material.normalMap = e.target.checked ? tierra.tex.normal : null;
    tierra.mesh.material.needsUpdate = true;
  });
  optCapas?.addEventListener("change", (e) => {
    mostrarCapas(e.target.checked);
  });
  segIlum.forEach((b) => {
    b.addEventListener("click", () => {
      const modo = Number(b.dataset.modo);
      tierra.uniforms.uModo.value = modo;
      setSeg(segIlum, "modo", modo);
      actualizarAtmosfera();
    });
  });
  segCalidad.forEach((b) => {
    b.addEventListener("click", () => {
      const cal = b.dataset.calidad;
      setSeg(segCalidad, "calidad", cal);
      if (cal === "auto") lodTierra.volverAuto();
      else if (cal === "bajo") lodTierra.forzar(0);
      else if (cal === "equilibrado") lodTierra.forzar(1);
      else lodTierra.forzar(2);
    });
  });

  if (capasActivas) {
    mostrarCapas(true);
    if (optCapas) optCapas.checked = true;
  }

  initPanelOpciones();

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    if (playing && rotar) {
      updateTierraSola(tierra.sim, tierra, dt * speed);
    }
    if (capasActivo) sincronizarPlanosMundo();
    navegar(dt);
    const dist = camera.position.distanceTo(controls.target);

    // Adjust rotation speed based on distance
    const rotPrecision = THREE.MathUtils.smoothstep(dist, 1.6, 6.0);
    controls.rotateSpeed = THREE.MathUtils.lerp(0.1, 1.0, rotPrecision);

    const reliefZoom = 1 - THREE.MathUtils.smoothstep(dist, 1.6, 3.0);
    const normalScale = THREE.MathUtils.lerp(0.1, 1.5, reliefZoom);
    tierra.mesh.material.normalScale.set(normalScale, normalScale);

    lodTierra.actualizarLOD(dt, dist);
    updateTwinkle(sf, clock.elapsedTime);
    controls.update();
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }
  animate();

  return { renderer, scene, camera, controls, tierra, capas, mostrarCapas, lodTierra };
}