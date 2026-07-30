export const captions = {
  supergiant: {
    title: "Supergigante roja",
    text:
      "Una estrella de más de ~25 masas solares vive rápido y muere joven: apenas unos millones de años. Tras agotar el hidrógeno, se hincha como supergigante roja y fusiona elementos cada vez más pesados en su núcleo, uno tras otro."
  },
  onionLayers: {
    title: "Capas de cebolla",
    text:
      "La estrella se convierte en una cebolla de capas de fusión: hidrógeno, helio, carbono, neón, oxígeno y silicio quemando a la vez. El producto final es hierro, el núcleo más estable de todos: fusionarlo no libera energía, la consume. El núcleo de hierro inerte crece hasta ~1.5–2 M☉."
  },
  coreCollapse: {
    title: "Colapso del núcleo de hierro",
    text:
      "Sin fusión que lo sostenga, el núcleo colapsa en menos de un segundo: los fotones desintegran los núcleos de hierro y los electrones se fusionan con los protones (p + e⁻ → n + νₑ). Se emiten ~10⁵⁸ neutrinos y el núcleo pasa de ~1.500 km a unos 30 km."
  },
  explosion: {
    title: "Supernova de colapso",
    text:
      "Al alcanzar la densidad nuclear el colapso se frena y rebota: la onda de choque, alimentada por los neutrinos, expulsa las capas externas. Pero en estrellas muy masivas el choque puede atascarse y parte del material vuelve a caer (fallback)."
  },
  blackHole: {
    title: "Nace el agujero negro",
    text:
      "El núcleo supera el límite TOV (~2.5 M☉) y el colapso es imparable. La superficie se enrojece por el redshift gravitacional y la contracción parece congelarse: el horizonte emerge desde el centro antes del colapso total. La luz queda atrapada y la estrella se desvanece en una sombra de ~2.6 radios. Nace un agujero negro estelar."
  },
  accretionDisk: {
    title: "Disco de acreción y jets",
    text:
      "La materia que cae de nuevo forma un disco de acreción a millones de grados que brilla en rayos X, con chorros relativistas polares a ~0.99c. La curvatura extrema del espacio-tiempo dobla la imagen del disco trasero por encima y por debajo del agujero: un lado se ve más brillante por efecto Doppler."
  }
};

export function updateCaption(phaseKey) {
  const data = captions[phaseKey] || captions.supergiant;
  document.getElementById("phase-title").textContent = data.title;
  document.getElementById("phase-caption").textContent = data.text;
}
