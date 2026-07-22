export const hudState = {
  temp: 0.3,
  pressure: 100,
  pairs: 0,
  luminosity: 0.05
};

export function updateHud(temp, pressure, pairs, luminosity) {
  hudState.temp = temp;
  hudState.pressure = pressure;
  hudState.pairs = pairs;
  hudState.luminosity = luminosity;

  document.getElementById("temp-bar").style.width = `${Math.min(100, (temp / 5) * 100)}%`;
  document.getElementById("temp-value").textContent = temp.toFixed(2);

  document.getElementById("pressure-bar").style.width = `${Math.max(0, pressure)}%`;
  document.getElementById("pressure-value").textContent = `${pressure.toFixed(0)}%`;

  document.getElementById("pairs-bar").style.width = `${Math.min(100, pairs)}%`;
  document.getElementById("pairs-value").textContent = `${pairs.toFixed(0)}%`;

  document.getElementById("lum-bar").style.width = `${Math.min(100, luminosity / 0.5)}%`;
  document.getElementById("lum-value").textContent = luminosity.toFixed(2);
}
