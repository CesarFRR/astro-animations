// Curva de luminosidad (L/L☉, log) vs edad (años, log) para una estrella de ~1 M☉.
// Muestra el track: secuencia principal plana, subida de gigante roja,
// rama horizontal, pico AGB y el largo enfriamiento de la enana blanca.

export class WbLightCurve {
  constructor(svgId) {
    this.svg = document.getElementById(svgId);
    this.width = 400;
    this.height = 200;
    this.padding = { top: 15, right: 20, bottom: 30, left: 45 };
    this.logAgeMin = 6.7; // 5e6 años
    this.logAgeMax = 10.2; // 1.6e10 años
    this.logLMin = -5;
    this.logLMax = 4;
    this.showComparison = true;
    this.init();
  }

  // Luminosidad del track evolutivo según edad en Gyr
  trackL(ageGyr) {
    if (ageGyr < 10.0) return 1 + ageGyr * 0.1; // MS: 1 → 2
    if (ageGyr < 10.1) { // gigante roja: 2 → 2300
      const t = (ageGyr - 10.0) / 0.1;
      return 2 * Math.pow(1150, t);
    }
    if (ageGyr < 10.15) { // flash de helio + rama horizontal: 2300 → 60
      const t = (ageGyr - 10.1) / 0.05;
      return 2300 * Math.pow(60 / 2300, t);
    }
    if (ageGyr < 10.25) { // AGB: 60 → 5000
      const t = (ageGyr - 10.15) / 0.1;
      return 60 * Math.pow(5000 / 60, t);
    }
    if (ageGyr < 10.3) { // caída post-AGB / nebulosa: 5000 → 100
      const t = (ageGyr - 10.25) / 0.05;
      return 5000 * Math.pow(100 / 5000, t);
    }
    // Enfriamiento de la enana blanca (ley tipo Mestel: L ∝ t^-1.4)
    return 100 * Math.pow((ageGyr - 10.3) / 0.0001 + 1, -1.4);
  }

  // Curva de enfriamiento puro (comparación, solo zona WD)
  mestelL(ageGyr) {
    if (ageGyr < 10.3) return null;
    return 100 * Math.pow((ageGyr - 10.3) / 0.001 + 1, -1.4);
  }

  mapX(ageGyr) {
    const logAge = Math.log10(Math.max(ageGyr, 1e-3) * 1e9); // años
    const t = (logAge - this.logAgeMin) / (this.logAgeMax - this.logAgeMin);
    return this.padding.left + t * (this.width - this.padding.left - this.padding.right);
  }

  mapY(lumSolar) {
    const logL = Math.log10(Math.max(lumSolar, 1e-5));
    const t = (logL - this.logLMin) / (this.logLMax - this.logLMin);
    return this.height - this.padding.bottom - t * (this.height - this.padding.top - this.padding.bottom);
  }

  createLine(x1, y1, x2, y2, stroke, width) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", stroke);
    line.setAttribute("stroke-width", width);
    return line;
  }

  addText(str, x, y, rotate, fill, size, anchor = "middle") {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("fill", fill);
    text.setAttribute("font-size", size);
    text.setAttribute("text-anchor", anchor);
    if (rotate) text.setAttribute("transform", `rotate(${rotate}, ${x}, ${y})`);
    text.textContent = str;
    this.svg.appendChild(text);
  }

  init() {
    this.svg.innerHTML = "";
    const { width, height, padding } = this;

    // Grid horizontal (decadas de luminosidad)
    for (let e = this.logLMin; e <= this.logLMax; e += 1) {
      const y = this.mapY(Math.pow(10, e));
      this.svg.appendChild(this.createLine(padding.left, y, width - padding.right, y, "rgba(255,255,255,0.07)", 1));
    }
    // Grid vertical (decadas de edad)
    for (let a = 7; a <= 10; a++) {
      const x = this.padding.left + ((a - this.logAgeMin) / (this.logAgeMax - this.logAgeMin)) * (width - padding.left - padding.right);
      this.svg.appendChild(this.createLine(x, padding.top, x, height - padding.bottom, "rgba(255,255,255,0.07)", 1));
    }

    // Axes
    this.svg.appendChild(this.createLine(padding.left, height - padding.bottom, width - padding.right, height - padding.bottom, "rgba(140,170,210,0.5)", 1.5));
    this.svg.appendChild(this.createLine(padding.left, padding.top, padding.left, height - padding.bottom, "rgba(140,170,210,0.5)", 1.5));

    // Labels
    this.addText("Edad (años)", width / 2, height - 2, 0, "rgba(200,220,255,0.7)", "11px");
    this.addText("L (L☉)", 12, height / 2, -90, "rgba(200,220,255,0.7)", "11px");
    for (let a = 7; a <= 10; a++) {
      const x = this.padding.left + ((a - this.logAgeMin) / (this.logAgeMax - this.logAgeMin)) * (width - padding.left - padding.right);
      this.addText(`10${superscript(a)}`, x, height - padding.bottom + 14, 0, "rgba(180,200,230,0.7)", "9px");
    }
    for (const e of [-4, -2, 0, 2, 4]) {
      const y = this.mapY(Math.pow(10, e));
      this.addText(`10${superscript(e)}`, padding.left - 6, y + 3, 0, "rgba(180,200,230,0.7)", "9px", "end");
    }

    // Curva del track completo
    let d = "";
    const steps = 400;
    for (let i = 0; i <= steps; i++) {
      const age = 0.005 + (i / steps) * (14 - 0.005);
      const x = this.mapX(age);
      const y = this.mapY(this.trackL(age));
      d += (i === 0 ? "M" : "L") + `${x},${y} `;
    }
    const track = document.createElementNS("http://www.w3.org/2000/svg", "path");
    track.setAttribute("d", d);
    track.setAttribute("fill", "none");
    track.setAttribute("stroke", "#4facfe");
    track.setAttribute("stroke-width", 2.5);
    this.svg.appendChild(track);

    // Curva de enfriamiento Mestel (comparación, dashed)
    let d2 = "";
    let first = true;
    for (let i = 0; i <= steps; i++) {
      const age = 10.3 + (i / steps) * (14 - 10.3);
      const l = this.mestelL(age);
      if (l === null) continue;
      const x = this.mapX(age);
      const y = this.mapY(l);
      d2 += (first ? "M" : "L") + `${x},${y} `;
      first = false;
    }
    this.mestelPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.mestelPath.setAttribute("d", d2);
    this.mestelPath.setAttribute("fill", "none");
    this.mestelPath.setAttribute("stroke", "#facc15");
    this.mestelPath.setAttribute("stroke-width", 1.5);
    this.mestelPath.setAttribute("stroke-dasharray", "4 3");
    this.svg.appendChild(this.mestelPath);

    // Leyenda
    this.addLegendRect(235, 8, "#4facfe", "Track 1 M☉");
    this.addLegendRect(320, 8, "#facc15", "Enfriam. WD");

    // Marcador
    this.marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.marker.setAttribute("r", "5");
    this.marker.setAttribute("fill", "#fff");
    this.marker.setAttribute("stroke", "#4facfe");
    this.marker.setAttribute("stroke-width", "2");
    this.svg.appendChild(this.marker);

    this.updateComparison();
    this.setMarker(0.005);
  }

  addLegendRect(x, y, color, label) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", 10);
    rect.setAttribute("height", 10);
    rect.setAttribute("fill", color);
    this.svg.appendChild(rect);
    this.addText(label, x + 24, y + 10, 0, "rgba(200,220,255,0.85)", "10px");
  }

  setMarker(ageGyr) {
    this.marker.setAttribute("cx", this.mapX(ageGyr));
    this.marker.setAttribute("cy", this.mapY(this.trackL(ageGyr)));
  }

  toggleComparison() {
    this.showComparison = !this.showComparison;
    this.updateComparison();
  }

  updateComparison() {
    this.mestelPath.setAttribute("visibility", this.showComparison ? "visible" : "hidden");
  }
}

function superscript(n) {
  const map = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  return String(n).split("").map(c => map[c] || c).join("");
}
