export const captions = {
  mainSequence: {
    title: "Secuencia principal",
    text:
      "Una estrella como el Sol (menos de ~8 masas solares) pasa unos 10 mil millones de años fusionando hidrógeno en helio en su núcleo, en perfecto equilibrio entre gravedad y presión de radiación."
  },
  redGiant: {
    title: "Gigante roja",
    text:
      "Al agotarse el hidrógeno del núcleo, este se contrae y se calienta mientras las capas externas se expanden hasta cientos de veces su tamaño y se enfrían (~3.200 K), tornándose rojizas. Engulliría a Mercurio y Venus."
  },
  heliumFlash: {
    title: "Flash de helio",
    text:
      "El núcleo, degenerado, alcanza los 100 millones de K y el helio se enciende de forma explosiva (reacción triple-alfa), fusionándose en carbono y oxígeno. Luego la estrella se estabiliza brevemente."
  },
  agb: {
    title: "Rama asintótica gigante",
    text:
      "Agotado el helio, la estrella vuelve a hincharse y pulsa. Vientos estelares intensos (hasta 10⁻⁵ M☉/año) comienzan a arrancar sus capas externas, enriquecidas en carbono y elementos pesados."
  },
  planetaryNebula: {
    title: "Nebulosa planetaria",
    text:
      "La envoltura expulsada forma una nebulosa planetaria (el nombre es histórico: no tiene nada que ver con planetas). El núcleo desnudo, a más de 100.000 K, emite ultravioleta que hace brillar el gas: verde por oxígeno ionizado, rojo por hidrógeno."
  },
  whiteDwarf: {
    title: "Enana blanca",
    text:
      "El núcleo expuesto es una enana blanca: casi la masa del Sol al tamaño de la Tierra, sostenida por electrones degenerados. Sin fusión, se enfría durante miles de millones de años: por la ley de Wien su color pasa de blanco-azulado a amarillo, naranja y rojo, cada vez más tenue. Terminará como una enana negra, algo que aún no existe en el universo."
  }
};

export function updateCaption(phaseKey) {
  const data = captions[phaseKey] || captions.mainSequence;
  document.getElementById("phase-title").textContent = data.title;
  document.getElementById("phase-caption").textContent = data.text;
}
