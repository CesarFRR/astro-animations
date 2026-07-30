export const captions = {
  equilibrium: {
    title: "Equilibrio",
    text:
      "Una estrella supermasiva (130–250 M☉) de baja metalicidad sostiene sus capas exteriores gracias a la presión de radiación de rayos gamma producidos en su núcleo, donde la temperatura supera los 3×10⁸ K."
  },
  pairProduction: {
    title: "Producción de pares",
    text:
      "Cuando los rayos gamma son lo suficientemente energéticos, pueden convertirse en pares electrón–positrón (γ → e⁻ + e⁺). Esto drena temporalmente parte de la presión de radiación que sostiene la estrella."
  },
  collapse: {
    title: "Inestabilidad y colapso parcial",
    text:
      "A menos presión, el núcleo se contrae; al contraerse se calienta más y emite rayos gamma aún más energéticos, creando más pares. Es una retroalimentación descontrolada: el núcleo pierde soporte."
  },
  thermonuclear: {
    title: "Fuga termonuclear",
    text:
      "El calor comprimido enciende la fusión detonante del oxígeno y elementos pesados. En pocos segundos se libera tanta energía que supera la energía de enlace gravitacional de toda la estrella."
  },
  explosion: {
    title: "Explosión y disrupción total",
    text:
      "La estrella es destruida por completo. No queda un agujero negro ni una estrella de neutrones: toda la masa es expulsada al espacio interestelar, arrastrando una enorme cantidad de ⁵⁶Ni."
  },
  remnant: {
    title: "Remanente nebular y curva de luz",
    text:
      "El material expulsado se expande como una nebulosa. El decaimiento ⁵⁶Ni → ⁵⁶Co → ⁵⁶Fe alimenta una curva de luz extremadamente ancha y luminosa, que alcanza su máximo meses después."
  }
};

export function updateCaption(phaseKey) {
  const data = captions[phaseKey] || captions.equilibrium;
  document.getElementById("phase-title").textContent = data.title;
  document.getElementById("phase-caption").textContent = data.text;
}
