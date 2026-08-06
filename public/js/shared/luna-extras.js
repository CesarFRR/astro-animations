import { crearEtiquetasCuerpo } from "/astro-animations/js/shared/etiquetas-cuerpo.js";

// ====== Config de la Luna (wrapper de compatibilidad) ======
// El núcleo genérico está en etiquetas-cuerpo.js; aquí se fija la configuración
// de la Luna (datos y umbrales de LOD). La escala de etiquetas, presupuesto y
// región angular usan los valores por defecto del módulo genérico.

const LODS_LUNA = [
  [2.7, -1], // dist > 2.7 → nada (F5 cae en ~2.84 → ninguna etiqueta)
  [1.8, 0], // solo imp 0 (27 super-importantes)
  [1.2, 1], // imp 0+1
  [0.85, 2], // imp 0+1+2
  [-Infinity, 3], // todo
];

export function crearExtrasLuna(scene, objetivo, opts = {}) {
  return crearEtiquetasCuerpo(scene, objetivo, {
    radio: 0.6,
    datosUrl: "/astro-animations/data/luna-zonas.json",
    lods: LODS_LUNA,
    ...opts,
  });
}
