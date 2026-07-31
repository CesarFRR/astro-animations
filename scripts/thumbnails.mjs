/**
 * Genera thumbnails de las animaciones visitando cada página
 * y capturando el canvas 3D como imagen PNG.
 *
 * npm install --save-dev puppeteer
 * npm run thumbnails
 *
 * Los PNGs se guardan en public/thumbnails/
 */

import { join, dirname } from "path";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const THUMB_DIR = join(ROOT, "public", "thumbnails");
const PREVIEW_PORT = 4322;
const PAGES = [
  "supernova-pares",
  "agujero-negro",
  "enana-blanca",
  "crab-pulsar",
  "pulsar-vela",
];

function startPreview() {
  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["astro", "preview", "--port", String(PREVIEW_PORT)], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const onData = (data) => {
      const text = data.toString();
      if (text.includes("Local")) resolve(proc);
    };
    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    setTimeout(() => reject(Error("Timeout")), 30000);
  });
}

async function capture(browser, id, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
    await page.waitForSelector("#space-canvas", { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 3000));
    const canvas = await page.$("#space-canvas");
    if (!canvas) { console.warn(`  ✗ ${id}: no canvas`); return null; }
    const path = join(THUMB_DIR, `${id}.png`);
    await canvas.screenshot({ path });
    console.log(`  ✓ ${id}`);
    return path;
  } catch (err) {
    console.warn(`  ✗ ${id}: ${err.message}`);
    return null;
  } finally {
    await page.close();
  }
}

let proc;
try {
  let puppeteer;
  try { puppeteer = await import("puppeteer"); }
  catch {
    console.error("Falta puppeteer. Instálalo con:\n  npm install --save-dev puppeteer");
    process.exit(1);
  }

  if (!existsSync(THUMB_DIR)) mkdirSync(THUMB_DIR, { recursive: true });

  console.log("Iniciando preview server...");
  proc = await startPreview();

  console.log("Lanzando Puppeteer...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const results = [];
  for (const id of PAGES) {
    const p = await capture(
      browser, id,
      `http://localhost:${PREVIEW_PORT}/astro-animations/animaciones/${id}/`
    );
    if (p) results.push({ id, path: p });
  }

  await browser.close();
  console.log(`\n✓ ${results.length}/${PAGES.length} thumbnails generados en ${THUMB_DIR}`);

  const map = `export const thumbnails: Record<string, string> = {\n${
    results.map((r) => `  "${r.id}": "/astro-animations/thumbnails/${r.id}.png"`).join(",\n")
  },\n};\n`;
  writeFileSync(join(ROOT, "src", "data", "thumbnails.ts"), map);
  console.log(`→ Mapa generado: src/data/thumbnails.ts`);
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
} finally {
  if (proc) proc.kill();
}
