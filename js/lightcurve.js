export class LightCurve {
  constructor(svgId) {
    this.svg = document.getElementById(svgId);
    this.width = 400;
    this.height = 200;
    this.padding = { top: 15, right: 20, bottom: 30, left: 40 };
    this.marker = null;
    this.showComparison = true;
    this.init();
  }

  init() {
    this.svg.innerHTML = "";
    const { width, height, padding } = this;
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    // Grid
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (plotH * i) / 5;
      const line = this.createLine(padding.left, y, width - padding.right, y, "rgba(255,255,255,0.08)", 1);
      this.svg.appendChild(line);
    }
    for (let i = 0; i <= 5; i++) {
      const x = padding.left + (plotW * i) / 5;
      const line = this.createLine(x, padding.top, x, height - padding.bottom, "rgba(255,255,255,0.08)", 1);
      this.svg.appendChild(line);
    }

    // Axes
    const xAxis = this.createLine(padding.left, height - padding.bottom, width - padding.right, height - padding.bottom, "rgba(140,170,210,0.5)", 1.5);
    const yAxis = this.createLine(padding.left, padding.top, padding.left, height - padding.bottom, "rgba(140,170,210,0.5)", 1.5);
    this.svg.appendChild(xAxis);
    this.svg.appendChild(yAxis);

    // Labels
    this.addText("Luminosidad relativa", 16, height / 2, -90, "rgba(200,220,255,0.7)", "12px");
    this.addText("Tiempo (días)", width / 2, height - 2, 0, "rgba(200,220,255,0.7)", "12px");

    // X ticks
    for (let i = 0; i <= 4; i++) {
      const days = i * 50;
      const x = padding.left + (plotW * i) / 4;
      this.addText(days.toString(), x, height - padding.bottom + 16, 0, "rgba(180,200,230,0.7)", "11px");
    }

    // Curves
    this.curvePisn = this.drawCurve(t => this.pisnValue(t), "#facc15", 2.5);
    this.curveSNIa = this.drawCurve(t => this.snIaValue(t), "#4facfe", 1.5, true);
    this.curveSNII = this.drawCurve(t => this.snIIValue(t), "#f97316", 1.5, true);

    // Legend inside SVG
    this.addLegendRect(230, 8, "#facc15", "PISn");
    this.addLegendRect(280, 8, "#4facfe", "SN Ia");
    this.addLegendRect(330, 8, "#f97316", "SN II");

    // Marker
    this.marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.marker.setAttribute("r", "5");
    this.marker.setAttribute("fill", "#fff");
    this.marker.setAttribute("stroke", "#facc15");
    this.marker.setAttribute("stroke-width", "2");
    this.svg.appendChild(this.marker);

    this.updateComparison();
    this.setMarker(0);
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

  addText(str, x, y, rotate, fill, size) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("fill", fill);
    text.setAttribute("font-size", size);
    text.setAttribute("text-anchor", "middle");
    if (rotate) text.setAttribute("transform", `rotate(${rotate}, ${x}, ${y})`);
    text.textContent = str;
    this.svg.appendChild(text);
  }

  addLegendRect(x, y, color, label) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", 10);
    rect.setAttribute("height", 10);
    rect.setAttribute("fill", color);
    this.svg.appendChild(rect);
    this.addText(label, x + 24, y + 10, 0, "rgba(200,220,255,0.85)", "11px");
  }

  mapX(t) {
    const { padding } = this;
    return padding.left + (t / 200) * (this.width - padding.left - padding.right);
  }

  mapY(lum) {
    const { padding } = this;
    return this.height - padding.bottom - lum * (this.height - padding.top - padding.bottom);
  }

  drawCurve(fn, color, width, dashed = false) {
    let d = "";
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * 200;
      const x = this.mapX(t);
      const y = this.mapY(fn(t));
      d += (i === 0 ? "M" : "L") + `${x},${y} `;
    }
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", width);
    if (dashed) path.setAttribute("stroke-dasharray", "4 3");
    this.svg.appendChild(path);
    return path;
  }

  // Curva PISn: lenta, ancha, pico ~100 días
  pisnValue(t) {
    if (t < 20) return 0.05 + 0.05 * (t / 20);
    return 1.05 * Math.exp(-Math.pow((t - 100) / 55, 2)) + 0.02;
  }

  // SN Ia: pico rápido ~20 días, luego declive
  snIaValue(t) {
    if (t < 8) return 0.1 + 0.6 * (t / 8);
    return 0.7 * Math.exp(-(t - 18) / 25) + 0.02;
  }

  // SN II: más bajo, pico ~40 días, lento
  snIIValue(t) {
    if (t < 15) return 0.08 + 0.15 * (t / 15);
    return 0.28 * Math.exp(-(t - 40) / 40) + 0.02;
  }

  setMarker(progress) {
    // progress 0..1 mapeado a tiempo 0..200 días
    const t = progress * 200;
    const x = this.mapX(t);
    const y = this.mapY(this.pisnValue(t));
    this.marker.setAttribute("cx", x);
    this.marker.setAttribute("cy", y);
  }

  toggleComparison() {
    this.showComparison = !this.showComparison;
    this.updateComparison();
  }

  updateComparison() {
    const visible = this.showComparison ? "visible" : "hidden";
    this.curveSNIa.setAttribute("visibility", visible);
    this.curveSNII.setAttribute("visibility", visible);
  }
}
