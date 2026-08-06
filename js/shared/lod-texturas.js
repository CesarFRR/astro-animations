import * as THREE from "three";

const ANISO = 8;

// materiales: [{ material, uniform }] — texturas que se intercambian en lockstep.
// niveles: [{ max: number|null, texs?: THREE.Texture[], urls?: string[], srgb?: boolean }]
// cada elemento texs/urls es paralelo a materiales. El nivel base (texs) se usa de inicio.
// Las texturas se quedan en cache al cargarse (sin dispose): el zoom repetido no recarga nada.
export function crearLODTierra(materiales, niveles) {
  const loader = new THREE.TextureLoader();
  const cache = niveles.map((n) => n.texs || null);
  const cargando = niveles.map(() => null);
  let actual = niveles.findIndex((n) => n.texs !== null);
  if (actual < 0) actual = 0;
  let forzado = null;

  function cargar(i) {
    const n = niveles[i];
    if (cache[i] || cargando[i] || !n.urls) return Promise.resolve(cache[i]);
    cargando[i] = Promise.all(
      n.urls.map(
        (url) =>
          new Promise((resolve, reject) => {
            loader.load(url, (t) => {
              if (n.srgb) t.colorSpace = THREE.SRGBColorSpace;
              t.anisotropy = ANISO;
              resolve(t);
            }, undefined, reject);
          })
      )
    ).then((ts) => {
      cache[i] = ts;
      cargando[i] = null;
      return ts;
    }, (err) => {
      console.warn(`[LOD] error cargando nivel ${i}:`, err);
      cargando[i] = null;
      return null;
    });
    return cargando[i];
  }

  function nivelDeseado(dist) {
    let n = 0;
    for (let i = 0; i < niveles.length; i++) {
      if (dist <= (niveles[i].max ?? Infinity)) n = i;
    }
    return n;
  }

  function aplicar(i) {
    const ts = cache[i];
    if (!ts) return false;
    for (let k = 0; k < materiales.length; k++) {
      const m = materiales[k];
      if (m.set) {
        m.set(ts[k % ts.length]);
      } else if (m.prop) {
        if (m.material[m.prop] !== ts[k % ts.length]) {
          m.material[m.prop] = ts[k % ts.length];
          m.material.needsUpdate = true;
        }
      } else if (m.uniformPrev) {
        const t = ts[k % ts.length];
        if (m.linear) {
          t.colorSpace = THREE.NoColorSpace;
          t.needsUpdate = true;
        }
        m.material.uniforms[m.uniformPrev].value = m.material.uniforms[m.uniform].value;
        m.material.uniforms[m.uniform].value = t;
        m.material.uniforms[m.uniformBlend].value = 0.0;
      } else {
        m.material.uniforms[m.uniform].value = ts[k % ts.length];
      }
    }
    actual = i;
    return true;
  }

  function forzar(nivel) {
    forzado = nivel;
    cargar(nivel).then(() => aplicar(nivel));
  }

  function volverAuto() {
    forzado = null;
  }

  function precargarTodo() {
    for (let i = 0; i < niveles.length; i++) cargar(i);
  }

  function actualizarLOD(dt, dist) {
    for (let k = 0; k < materiales.length; k++) {
      const m = materiales[k];
      if (m.uniformBlend) {
        m.material.uniforms[m.uniformBlend].value = Math.min(
          1.0,
          m.material.uniforms[m.uniformBlend].value + dt * 1.5
        );
      }
    }
    if (forzado !== null) {
      if (actual !== forzado && !aplicar(forzado)) cargar(forzado);
      return;
    }
    const deseado = nivelDeseado(dist);
    if (deseado === actual) return;
    if (cache[deseado]) {
      aplicar(deseado);
      return;
    }
    const carga = cargar(deseado);
    if (carga) carga.then((ts) => {
      if (ts && nivelDeseado(dist) === deseado) aplicar(deseado);
    });
    let retroceso = deseado - 1;
    while (retroceso > actual && !cache[retroceso]) retroceso--;
    if (retroceso > actual) aplicar(retroceso);
  }

  return { actualizarLOD, forzar, volverAuto, precargarTodo };
}
