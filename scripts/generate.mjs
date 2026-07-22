#!/usr/bin/env node
/**
 * Generates scaffolding for a new animation.
 *
 * Usage:
 *   node scripts/generate.mjs <id> [options]
 *
 * Options:
 *   --title       "Púlsar de Vela (PSR B0833-45)"
 *   --subtitle    "Estrella de neutrones · Rotación: 11.195 ms"
 *   --category    pulsar | supernova | estrella | agujero-negro | nebulosa
 *   --desc        "Una estrella de neutrones girando 89 veces por segundo..."
 *   --tags        "Estrella de neutrones,Rotación extrema,Audio 3D"
 *   --difficulty  basico | intermedio | avanzado
 *   --duration    "∞" | "3-5 min"
 *   --type        pulsar | standalone
 *
 * If called without args, prompts interactively (Node/Bun).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, "..");
const PAGES_DIR = join(ROOT, "src/pages/animaciones");
const JS_DIR = join(ROOT, "public/js");
const DATA_FILE = join(ROOT, "src/data/animations.ts");
const ANIMATION_LAYOUT = join(ROOT, "src/layouts/AnimationLayout.astro");

// ── Templates ──────────────────────────────────────────────────────────

function astroPage({ id, title, subtitle, scriptSrc, type }) {
  const isPulsar = type === "pulsar";
  const extraSections = isPulsar ? "" : `
  <section class="lightcurve-panel">
    <div class="panel-header">
      <h3>Curva de luz</h3>
      <button id="toggle-comparison" class="toggle-btn active">Comparar</button>
    </div>
    <svg id="lightcurve-svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet"></svg>
  </section>

  <section class="legend">
    <div class="legend-item"><span class="dot"></span>Partículas</div>
  </section>`;

  const controlsExtras = isPulsar ? `
    <button id="btn-mute" class="ctrl-btn">🔊 Sonido</button>` : `
    <button id="btn-restart" class="ctrl-btn">↺ Reiniciar</button>`;

  const speedOptions = isPulsar
    ? [0.1, 0.25, 0.5, 1, 2, 5, 10]
    : [0.25, 0.5, 1, 2, 2.5, 3, 4, 5];

  const timelineBlock = isPulsar ? "" : `
    <div class="timeline-wrap">
      <input id="timeline" type="range" min="0" max="1000" value="0" step="1">
      <div class="phase-labels">
        <span>Fase 1</span>
        <span>Fase 2</span>
        <span>Fase 3</span>
        <span>Fase 4</span>
        <span>Fase 5</span>
        <span>Fase 6</span>
      </div>
    </div>`;

  return `---
import AnimationLayout from '../../layouts/AnimationLayout.astro';
---
<AnimationLayout
  title="${title}"
  subtitle="${subtitle}"
  scriptSrc="${scriptSrc}"
>
  <header class="top-bar">
    <h1>${title}</h1>
    <div class="subtitle">${subtitle}</div>
    <a class="nav-link" href="/astro-animations/">← Catálogo</a>
  </header>

  <section class="phase-panel">
    <div class="phase-header">
      <h2 id="phase-title">${isPulsar ? "Rotación estable" : "Fase inicial"}</h2>
      ${isPulsar ? "" : `<button id="mobile-curve-toggle" class="mobile-only-btn" title="Mostrar/ocultar curva de luz">📈 Curva</button>`}
    </div>
    <p id="phase-caption">${subtitle}</p>
  </section>

  <section class="hud">
    <div class="gauge">
      <span class="gauge-label">Parámetro 1</span>
      <div class="gauge-bar"><div class="gauge-fill" style="width: 50%"></div></div>
      <span class="gauge-value">—</span>
    </div>
    <div class="gauge">
      <span class="gauge-label">Parámetro 2</span>
      <div class="gauge-bar"><div class="gauge-fill" style="width: 50%"></div></div>
      <span class="gauge-value">—</span>
    </div>
    <div class="gauge">
      <span class="gauge-label">Parámetro 3</span>
      <div class="gauge-bar"><div class="gauge-fill" style="width: 50%"></div></div>
      <span class="gauge-value">—</span>
    </div>
    <div class="gauge">
      <span class="gauge-label">Parámetro 4</span>
      <div class="gauge-bar"><div class="gauge-fill" style="width: 50%"></div></div>
      <span class="gauge-value">—</span>
    </div>
  </section>
  ${extraSections}
  <section class="controls">
    <button id="btn-play" class="ctrl-btn">⏸ Pausar</button>${controlsExtras}
    <div class="speed-control">
      <label for="speed">Velocidad</label>
      <select id="speed">
        ${speedOptions.map((v) => `<option value="${v}"${v === 1 ? " selected" : ""}>${v}×</option>`).join("\n        ")}
      </select>
    </div>${timelineBlock}
  </section>
</AnimationLayout>
`;
}

function pulsarEntry({ id, frequency, color = "0x99ccff", audioFile }) {
  return `import * as THREE from "three";
import { NeutronStar } from "./core.js";
import { PulsarBeam } from "./beam.js";
import { PulsarAudio } from "./audio.js";
import { createStarfield, updateTwinkle } from "./starfield.js";
import { createScene, createGroups, addPulsarLighting } from "./setup.js";

const { scene, camera, controls, composer, renderer } = createScene();
const { container, pulsar, beam } = createGroups(scene, 0.28, 0.15);

const star = new NeutronStar(pulsar, 1.2, ${color});
const beams = new PulsarBeam(beam, ${color}, 300);
const starfield = createStarfield(scene);
const lights = addPulsarLighting(scene, beam);

const audio = new PulsarAudio();
let playing = true, speed = 1, muted = false, angle = 0, time = 0;

const playBtn = document.getElementById("btn-play");
const muteBtn = document.getElementById("btn-mute");
const speedEl = document.getElementById("speed");

playBtn.addEventListener("click", () => {
  playing = !playing;
  playBtn.textContent = playing ? "\\u23F8 Pausar" : "\\u25B6 Reproducir";
});

muteBtn.addEventListener("click", () => {
  if (!audio.buffer) return;
  if (muted) { audio.play(); muteBtn.textContent = "\\u{1F50A} Sonido"; }
  else { audio.stop(); muteBtn.textContent = "\\u{1F507} Sonido"; }
  muted = !muted;
});

speedEl.addEventListener("change", () => { speed = parseFloat(speedEl.value); });

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  controls.update();
  audio.updateListener(camera);
  if (playing) {
    time += dt * speed;
    angle += dt * speed * Math.PI * 2 * 7;
    pulsar.rotation.y = angle;
    const pulse = 0.85 + 0.15 * Math.sin(((time * ${frequency}) % 1) * Math.PI * 2);
    star.material.opacity = 0.9 + 0.1 * pulse;
    const cd = new THREE.Vector3();
    camera.getWorldPosition(cd).sub(container.position).normalize();
    const bd = new THREE.Vector3(0, 1, 0).applyQuaternion(beam.quaternion).applyQuaternion(pulsar.quaternion);
    const sweep = Math.pow(Math.abs(bd.dot(cd)), 10);
    const surge = 0.3 + 0.7 * sweep;
    lights.point.intensity = (4 + 2 * pulse) * surge;
    lights.spot.intensity = 6 * surge;
    beams.setOpacity(0.75 + 0.25 * sweep);
    updateTwinkle(starfield, time);
  }
  composer.render();
}

(async () => {
  await audio.init("/astro-animations/audio/${audioFile}");
  if (audio.buffer) audio.play();
  animate();
})();
`;
}

function animationTsEntry({ id, title, description, category, tags, difficulty, duration }) {
  const formattedTags = tags.split(",").map((t) => `'${t.trim()}'`).join(", ");
  return `  {
    id: '${id}',
    title: '${title}',
    description: '${description}',
    category: '${category}',
    tags: [${formattedTags}],
    thumbnail: '/thumbnails/${id}.jpg',
    difficulty: '${difficulty}',
    duration: '${duration}'
  },`;
}

// ── Prompt helper ──────────────────────────────────────────────────────

function prompt(q) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(q, (a) => { rl.close(); resolve(a.trim()); }));
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const id = args[0];

  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      options[key] = args[i + 1] || "";
      i++;
    }
  }

  // Gather info
  const info = {};
  info.id = id || options.id || (await prompt("ID de la animación (ej: pulsar-geminga): "));
  info.title = options.title || (await prompt("Título (ej: Púlsar de Geminga): "));
  info.subtitle = options.subtitle || (await prompt("Subtítulo (ej: Estrella de neutrones · Rotación: 237 ms): "));
  info.category = options.category || (await prompt("Categoría (pulsar/supernova/estrella/agujero-negro/nebulosa) [pulsar]: ")) || "pulsar";
  info.desc = options.desc || (await prompt("Descripción para el catálogo: ")) || `Animación 3D de ${info.title}.`;
  info.tags = options.tags || (await prompt("Tags separados por coma (ej: Estrella de neutrones,Audio 3D): ")) || "";
  info.difficulty = options.difficulty || (await prompt("Dificultad (basico/intermedio/avanzado) [intermedio]: ")) || "intermedio";
  info.duration = options.duration || (await prompt("Duración (ej: ∞, 3-5 min) [∞]: ")) || "∞";
  info.type = options.type || (info.category === "pulsar" ? "pulsar" : "standalone");
  info.scriptSrc = options["script-src"] || (info.type === "pulsar" ? `js/pulsar/${info.id}.js` : `js/${info.id}/main-${info.id}.js`);

  if (info.type === "pulsar") {
    info.frequency = options.frequency || (await prompt("Frecuencia de rotación en Hz (ej: 89.33): ")) || "10";
    info.color = options.color || "0x99ccff";
    info.audioFile = options["audio-file"] || `${info.id}-sound.ogg`;
  }

  // Confirm
  console.log("\n── Resumen ──");
  console.log(`  ID:         ${info.id}`);
  console.log(`  Título:     ${info.title}`);
  console.log(`  Categoría:  ${info.category}`);
  console.log(`  Tipo:       ${info.type}`);
  console.log(`  Script:     ${info.scriptSrc}`);
  if (info.type === "pulsar") console.log(`  Frecuencia: ${info.frequency} Hz`);
  const ok = await prompt("\n¿Crear? (S/n): ");
  if (ok === "n" || ok === "N") { console.log("Cancelado."); process.exit(0); }

  // 1. Astro page
  mkdirSync(PAGES_DIR, { recursive: true });
  const pagePath = join(PAGES_DIR, `${info.id}.astro`);
  writeFileSync(pagePath, astroPage(info));
  console.log(`  ✅ ${pagePath.replace(ROOT + "/", "")}`);

  // 2. JS entry
  if (info.type === "pulsar") {
    mkdirSync(JS_DIR + "/pulsar", { recursive: true });
    const jsPath = join(JS_DIR, `pulsar/${info.id}.js`);
    writeFileSync(jsPath, pulsarEntry(info));
    console.log(`  ✅ ${jsPath.replace(ROOT + "/", "")}`);
  } else {
    const jsDir = join(JS_DIR, info.id);
    mkdirSync(jsDir, { recursive: true });
    const jsPath = join(jsDir, `main-${info.id}.js`);
    writeFileSync(jsPath, `// TODO: implement ${info.title}\nimport * as THREE from "three";\n`);
    console.log(`  ✅ ${jsPath.replace(ROOT + "/", "")} (pendiente de implementar)`);
  }

  // 3. Update animations.ts
  const dataContent = readFileSync(DATA_FILE, "utf-8");
  const entry = animationTsEntry(info);
  // Insert before the closing bracket of the array
  const updated = dataContent.replace(/\n\]\;/, `\n${entry}\n];`);
  writeFileSync(DATA_FILE, updated);
  console.log(`  ✅ ${DATA_FILE.replace(ROOT + "/", "")} (entrada añadida)`);

  // 4. Summary
  console.log(`\n✦ Creada animación: ${info.id}`);
  console.log(`  URL:  /astro-animations/animaciones/${info.id}/`);
  console.log(`  Page: ${pagePath.replace(ROOT + "/", "")}`);
  console.log(`  JS:   ${(info.type === "pulsar" ? join("public/js/pulsar", info.id + ".js") : join("public/js", info.id, `main-${info.id}.js`))}`);
  if (info.type === "pulsar") {
    console.log(`\n  Pendiente:`);
    console.log(`  1. Crea el audio en public/audio/${info.audioFile} (mono OGG)`);
    console.log(`  2. Ajusta HUD y caption en la página`);
    console.log(`  3. Agrega miniatura en public/thumbnails/${info.id}.jpg`);
  } else {
    console.log(`\n  Pendiente:`);
    console.log(`  1. Implementa los módulos JS en public/js/${info.id}/`);
    console.log(`  2. Ajusta la página`);
  }
  console.log();
}

main().catch(console.error);
