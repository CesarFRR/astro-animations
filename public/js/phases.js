export const PHASES = [
  { key: "equilibrium", duration: 18 },
  { key: "pairProduction", duration: 12 },
  { key: "collapse", duration: 14 },
  { key: "thermonuclear", duration: 10 },
  { key: "explosion", duration: 12 },
  { key: "remnant", duration: 34 }
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

export function getProgressForPhase(phaseKey) {
  let accumulated = 0;
  for (const phase of PHASES) {
    if (phase.key === phaseKey) return accumulated / TOTAL_DURATION;
    accumulated += phase.duration;
  }
  return 1;
}

// Smooth interpolation helper
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
