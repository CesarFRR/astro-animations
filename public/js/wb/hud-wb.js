function logBar(value, min, max) {
  const t = (Math.log10(value) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
  return Math.max(0, Math.min(100, t * 100));
}

function fmt(value) {
  if (value >= 1000) return Math.round(value).toLocaleString("es-CO");
  if (value >= 10) return value.toFixed(0);
  if (value >= 1) return value.toFixed(1);
  return value.toPrecision(2);
}

export function updateHud(tempK, lumSolar, radiusSolar, ageGyr) {
  document.getElementById("t-bar").style.width = `${logBar(tempK, 2000, 200000)}%`;
  document.getElementById("t-value").textContent = `${fmt(tempK)} K`;

  document.getElementById("l-bar").style.width = `${logBar(lumSolar, 1e-4, 1e4)}%`;
  document.getElementById("l-value").textContent = `${fmt(lumSolar)} L☉`;

  document.getElementById("r-bar").style.width = `${logBar(radiusSolar, 0.005, 400)}%`;
  document.getElementById("r-value").textContent = `${fmt(radiusSolar)} R☉`;

  document.getElementById("a-bar").style.width = `${Math.min(100, (ageGyr / 14) * 100)}%`;
  document.getElementById("a-value").textContent = `${ageGyr.toFixed(2)} Gyr`;
}
