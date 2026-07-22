// Fases de una supernova de colapso de núcleo que deja un agujero negro.
// Estrella progenitora: >25-40 M☉. Física: estructura de cebolla de fusión,
// núcleo de hierro inerte, colapso, captura electrónica, neutrinos,
// shock (posiblemente atascado con fallback), colapso a BH, disco de acreción.

export const PHASES = [
  { key: "supergiant", duration: 12 },
  { key: "onionLayers", duration: 14 },
  { key: "coreCollapse", duration: 12 },
  { key: "explosion", duration: 12 },
  { key: "blackHole", duration: 14 },
  { key: "accretionDisk", duration: 36 }
];

export const TOTAL_DURATION = PHASES.reduce((acc, p) => acc + p.duration, 0);

export function getPhaseAt(globalProgress) {
  const clamped = Math.max(0, Math.min(1, globalProgress));
  const totalTime = TOTAL_DURATION * clamped;
  let accumulated = 0;
  for (const phase of PHASES) {
    if (totalTime < accumulated + phase.duration) {
      const localProgress = (totalTime - accumulated) / phase.duration;
      return { key: phase.key, localProgress, globalProgress: clamped };
    }
    accumulated += phase.duration;
  }
  return { key: PHASES[PHASES.length - 1].key, localProgress: 1, globalProgress: 1 };
}

// Día en la curva de luz (la supernova ocurre en el día ~0)
export function phaseDay(phase, local) {
  switch (phase) {
    case "explosion": return lerp(0, 10, local);
    case "blackHole": return lerp(10, 25, local);
    case "accretionDisk": return lerp(25, 150, local);
    default: return 0;
  }
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInCubic(t) {
  return t * t * t;
}
