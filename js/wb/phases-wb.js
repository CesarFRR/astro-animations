// Fases de la muerte de una estrella de ~1 masa solar (tipo el Sol).
// NO es una supernova: la estrella expulsa su envoltura (nebulosa planetaria)
// y deja su núcleo como una enana blanca que se enfría lentamente.

export const PHASES = [
  { key: "mainSequence", duration: 16 },
  { key: "redGiant", duration: 14 },
  { key: "heliumFlash", duration: 10 },
  { key: "agb", duration: 12 },
  { key: "planetaryNebula", duration: 14 },
  { key: "whiteDwarf", duration: 34 }
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

// Edad de la estrella en mil millones de años (Gyr) según fase y progreso local.
export function phaseAge(phase, local) {
  switch (phase) {
    case "mainSequence": return lerp(0.005, 10.0, local);
    case "redGiant": return lerp(10.0, 10.1, local);
    case "heliumFlash": return lerp(10.1, 10.15, local);
    case "agb": return lerp(10.15, 10.25, local);
    case "planetaryNebula": return lerp(10.25, 10.3, local);
    case "whiteDwarf": return lerp(10.3, 14.0, local);
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
