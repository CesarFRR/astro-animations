import * as THREE from "three";

const ANISO = 8;

// materiales: [{ material, uniform }] — texturas que se intercambian en lockstep.
// niveles: [{ max: number|null, texs?: THREE.Texture[], urls?: string[], srgb?: boolean, liberar?: boolean }]
// cada elemento texs/urls es paralelo a materiales. El nivel base (texs) se usa de inicio.
export function crearLODTierra(materiales, niveles) {
  const loader = new THREE.TextureLoader();
  const cache = niveles.map((n) => n.texs || null);
  const cargando = niveles.map(() => null);
  let actual = niveles.findIndex((n) => n.texs !== null);
  if (actual < 0) actual = 0;

  function cargar(i) {
    const n = niveles[i];
    if (cache[i] || cargando[i] || !n.urls) return;
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
    });
  }

  function aplicar(i) {
    const ts = cache[i];
    if (!ts) return;
    for (let k = 0; k < materiales.length; k++) {
      const m = materiales[k];
      m.material.uniforms[m.uniform].value = ts[k % ts.length];
    }
    if (niveles[actual].liberar && cache[actual]) {
      cache[actual].forEach((t) => t.dispose());
      cache[actual] = null;
    }
    actual = i;
  }

  return function actualizarLOD(dt, dist) {
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
  };
}
