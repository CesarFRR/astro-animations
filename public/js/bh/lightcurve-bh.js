// Curva de luz: hipernova asociada a BH (tipo SN 1998bw, Ic-bl),
// comparada con una SN II-P normal (meseta) y una supernova fallida
// (fallback casi total: apenas brilla). Eje X: días 0-150.

export class BhLightCurve {
  constructor(svgId) {
    this.svg = document.getElementById(svgId);
    this.width = 400;
    this.height = 200;
    this.padding = { top: 15, right: 20, bottom: 30, left: 45 };
    this.showComparison = true;
    this.init();
  }

  hypernovaL(t) { // colapsar / hipernova Ic-bl: pico ~18 días
    if (t < 5) return 0.05 + 0.1 * (t / 5);
    return 0.92 * Math.exp(-Math.pow((t - 18) / 26, 2)) + 0.03;
  }

  snIIPL(t) { // SN II-P: meseta ~80 días
    if (t < 10) return 0.05 + 0.4 * (t / 10);
    if (t < 80) return 0.45;
    return 0.45 * Math.exp(-(t - 80) / 25) + 0.02;
  }

  failedL(t) { // supernova fallida: apenas un destello
    if (t < 3) return 0.02 + 0.1 * (t / 3);
    return 0.12 * Math.exp(-(t - 3) / 12) + 0.01;
  }

  mapX(t) {
    return this.padding.left + (t / 150) * (this.width - this.padding.left - this.padding.right);
  }

  mapY(lum) {
    return this.height - this.padding.bottom - lum * (this.height - this.padding.top - this.padding.bottom);
  }

  createLine(x1, y1, x2, y2, stroke, width) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1); line.setAttribute("y1", y1);
    line.setAttribute("x2", x2); line.setAttribute("y2", y2);
    line.setAttribute("stroke", stroke);
    line.setAttribute("stroke-width", width);
    return line;
  }

  addText(str, x, y, rotate, fill, size, anchor = "middle") {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x); text.setAttribute("y", y);
    text.setAttribute("fill", fill);
    text.setAttribute("font-size", size);
    text.setAttribute("text-anchor", anchor);
    if (rotate) text.setAttribute("transform", `rotate(${rotate}, ${x}, ${y})`);
    text.textContent = str;
    this.svg.appendChild(text);
  }

  drawCurve(fn, color, width, dashed = false) {
    let d = "";
    for (let i = 0; i <= 150; i++) {
      const x = this.mapX(i);
      const y = this.mapY(fn(i));
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

  addLegendRect(x, y, color, label) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x); rect.setAttribute("y", y);
    rect.setAttribute("width", 10); rect.setAttribute("height", 10);
    rect.setAttribute("fill", color);
    this.svg.appendChild(rect);
    this.addText(label, x + 14, y + 10, 0, "rgba(200,220,255,0.85)", "9.5px", "start");
  }

  init() {
    this.svg.innerHTML = "";
    const { width, height, padding } = this;

    for (let i = 0; i <= 5; i++) {
      const y = padding.top + ((height - padding.top - padding.bottom) * i) / 5;
      this.svg.appendChild(this.createLine(padding.left, y, width - padding.right, y, "rgba(255,255,255,0.07)", 1));
    }
    this.svg.appendChild(this.createLine(padding.left, height - padding.bottom, width - padding.right, height - padding.bottom, "rgba(140,170,210,0.5)", 1.5));
    this.svg.appendChild(this.createLine(padding.left, padding.top, padding.left, height - padding.bottom, "rgba(140,170,210,0.5)", 1.5));

    this.addText("Tiempo (días)", width / 2, height - 2, 0, "rgba(200,220,255,0.7)", "11px");
    this.addText("Luminosidad relativa", 14, height / 2, -90, "rgba(200,220,255,0.7)", "11px");
    for (let i = 0; i <= 3; i++) {
      this.addText(String(i * 50), this.mapX(i * 50), height - padding.bottom + 15, 0, "rgba(180,200,230,0.7)", "10px");
    }

    this.curveMain = this.drawCurve(t => this.hypernovaL(t), "#facc15", 2.5);
    this.curveIIP = this.drawCurve(t => this.snIIPL(t), "#4facfe", 1.5, true);
    this.curveFailed = this.drawCurve(t => this.failedL(t), "#888888", 1.5, true);

    this.addLegendRect(150, 8, "#facc15", "Hipernova BH");
    this.addLegendRect(240, 8, "#4facfe", "SN II-P");
    this.addLegendRect(305, 8, "#888888", "SN fallida");

    this.marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.marker.setAttribute("r", "5");
    this.marker.setAttribute("fill", "#fff");
    this.marker.setAttribute("stroke", "#facc15");
    this.marker.setAttribute("stroke-width", "2");
    this.svg.appendChild(this.marker);

    this.updateComparison();
    this.setMarker(0);
  }

  setMarker(day) {
    this.marker.setAttribute("cx", this.mapX(day));
    this.marker.setAttribute("cy", this.mapY(this.hypernovaL(day)));
  }

  toggleComparison() {
    this.showComparison = !this.showComparison;
    this.updateComparison();
  }

  updateComparison() {
    const v = this.showComparison ? "visible" : "hidden";
    this.curveIIP.setAttribute("visibility", v);
    this.curveFailed.setAttribute("visibility", v);
  }
}
