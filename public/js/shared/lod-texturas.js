import * as THREE from "three";

const ANISO = 8;

// niveles: [{ min: number|null, max: number|null, tex?: THREE.Texture, url?: string, liberar?: boolean }]
// el primer nivel con tex se usa como base; los demas se cargan al acercarse.
export function crearLODTierra(mesh, niveles) {
  const loader = new THREE.TextureLoader();
  const cache = niveles.map((n) => n.tex || null);
  const cargando = niveles.map(() => null);
  let actual = 0;
  let cross = null;

  function cargar(i) {
    const n = niveles[i];
    if (cache[i] || cargando[i] || !n.url) return;
    cargando[i] = new Promise((resolve) => {
      loader.load(n.url, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = ANISO;
        cache[i] = t;
        cargando[i] = null;
        resolve();
      });
    });
  }

  function cambiar(i) {
    const target = cache[i];
    if (!target || i === actual || cross) return;
    const mat = mesh.material.clone();
    mat.map = target;
    mat.transparent = true;
    mat.opacity = 0;
    mat.depthWrite = false;
    const nuevo = new THREE.Mesh(mesh.geometry, mat);
    nuevo.scale.copy(mesh.scale);
    mesh.parent.add(nuevo);
    cross = { mesh: nuevo, mat, origen: actual, destino: i };
    actual = i;
  }

  function liberar(i) {
    const n = niveles[i];
    if (n.liberar && cache[i]) {
      cache[i].dispose();
      cache[i] = null;
    }
  }

  return function actualizarLOD(dt, dist) {
    if (cross) {
      cross.mat.opacity = Math.min(1, cross.mat.opacity + dt * 2.2);
      if (cross.mat.opacity >= 1) {
        cross.mat.opacity = 1;
        cross.mat.depthWrite = true;
        const viejo = mesh.material;
        mesh.material = cross.mat;
        mesh.parent.remove(cross.mesh);
        if (cross.origen > cross.destino) liberar(cross.origen);
        viejo.dispose();
        cross = null;
      }
      return;
    }

    let nivel = 0;
    for (let i = 0; i < niveles.length; i++) {
      const n = niveles[i];
      const okMin = n.min === null || dist >= n.min;
      const okMax = n.max === null || dist <= n.max;
      if (okMin && okMax) nivel = i;
    }
    if (nivel === actual) return;
    if (!cache[nivel]) {
      cargar(nivel);
      return;
    }
    cambiar(nivel);
  };
}
