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
          new Promise((resolve) => {
            loader.load(url, (t) => {
              if (n.srgb) t.colorSpace = THREE.SRGBColorSpace;
              t.anisotropy = ANISO;
              resolve(t);
            });
          })
      )
    ).then((ts) => {
      cache[i] = ts;
      cargando[i] = null;
      return ts;
    });
    return cargando[i];
  }

  function aplicar(i) {
    const ts = cache[i];
    if (!ts) return false;
    for (let k = 0; k < materiales.length; k++) {
      const m = materiales[k];
      m.material.uniforms[m.uniform].value = ts[k % ts.length];
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

  function actualizarLOD(dt, dist) {
    if (forzado !== null) {
      if (!aplicar(forzado)) cargar(forzado);
      return;
    }
    let nivel = 0;
    for (let i = 0; i < niveles.length; i++) {
      if (dist <= (niveles[i].max ?? Infinity)) nivel = i;
    }
    if (nivel === actual) return;
    if (!cache[nivel]) {
      cargar(nivel);
      return;
    }
    aplicar(nivel);
  }

  return { actualizarLOD, forzar, volverAuto };
}
