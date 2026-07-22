function logBar(value, min, max) {
  const t = (Math.log10(Math.max(value, min)) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
  return Math.max(0, Math.min(100, t * 100));
}

function fmt(value) {
  if (value >= 1000) return Math.round(value).toLocaleString("es-CO");
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(1);
  if (value >= 1) return value.toFixed(2);
  return value.toPrecision(2);
}

export function updateHud(tempGK, coreMass, neutrinoFlux, coreRadiusKm) {
  document.getElementById("t-bar").style.width = `${logBar(tempGK, 0.01, 1000)}%`;
  document.getElementById("t-value").textContent = `${fmt(tempGK)} GK`;

  document.getElementById("m-bar").style.width = `${logBar(coreMass, 0.1, 20)}%`;
  document.getElementById("m-value").textContent = `${fmt(coreMass)} M☉`;

  document.getElementById("n-bar").style.width = `${Math.max(0, Math.min(100, neutrinoFlux))}%`;
  document.getElementById("n-value").textContent = `${neutrinoFlux.toFixed(0)}%`;

  document.getElementById("r-bar").style.width = `${logBar(coreRadiusKm, 5, 3000)}%`;
  document.getElementById("r-value").textContent = `${fmt(coreRadiusKm)} km`;
}
