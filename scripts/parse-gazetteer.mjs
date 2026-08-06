/**
 * Parser del gazetteer USGS → JSON de zonas para etiquetas 3D.
 *
 * Uso:
 *   node scripts/parse-gazetteer.mjs <cuerpo>
 *
 * donde <cuerpo> es una clave de CONFIG (por ejemplo "luna" o "marte").
 * Lee el DBF del gazetteer, filtra tipos, calcula importancia y escribe
 * el JSON en public/data/<cuerpo>-zonas.json
 *
 * El DBF se descarga del S3 del USGS. Para la luna:
 *   https://asc-planetarynames-data.s3.us-west-2.amazonaws.com/MOON_nomenclature_center_pts.zip
 *
 * Formato binario DBF: header 32 bytes → descriptores de campo (32 bytes c/u) →
 * registros. Cada registro empieza con 1 byte de flag (0x20 = no borrado).
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ====== Config por cuerpo ======
const CONFIG = {
  luna: {
    dbf: "/tmp/opencode/moon_nomen/MOON_nomenclature_center_pts.dbf",
    salida: "public/data/luna-zonas.json",
    tipos: new Set([
      "Mare, maria", "Oceanus, oceani", "Lacus, lacūs", "Palus, paludes",
      "Sinus, sinūs", "Crater, craters", "Mons, montes", "Vallis, valles",
      "Rupes, rupēs", "Catena, catenae", "Planitia, planitiae",
      "Promontorium, promontoria",
    ]),
    tag: {
      "Mare, maria": "Mar", "Oceanus, oceani": "Océano", "Lacus, lacūs": "Lago",
      "Palus, paludes": "Pantano", "Sinus, sinūs": "Seno",
      "Crater, craters": "Cráter", "Mons, montes": "Montes",
      "Vallis, valles": "Valle", "Rupes, rupēs": "Escarpe",
      "Catena, catenae": "Catena", "Planitia, planitiae": "Planicie",
      "Promontorium, promontoria": "Promontorio",
    },
    minDiam: { "Crater, craters": 20 },
    // Importancia 0 (ultra-importantes visibles desde lejos)
    imp0: new Set([
      "Oceanus Procellarum", "Mare Imbrium", "Mare Serenitatis", "Mare Tranquillitatis",
      "Mare Crisium", "Mare Fecunditatis", "Mare Frigoris", "Mare Nubium", "Mare Australe",
      "Mare Orientale", "Mare Moscoviense", "Mare Humorum",
      "Tycho", "Copernicus", "Aristarchus", "Clavius", "Plato", "Tsiolkovskiy", "Korolev",
    ]),
    // Umbrales de diámetro (km) para importancia 1 y 2
    diamImp1: 180,
    diamImp2: 80,
    // Tipos que son "área" (siempre imp1 independiente del diámetro)
    tiposAreaImp1: ["Mar", "Océano", "Montes"],
    historicos: [
      { n: "Apolo 11 — Tranquillity Base", t: "Aterrizaje", lat: 0.67, lon: 23.47, imp: 0, icono: "flag", o: "Primer aterrizaje tripulado (1969). Armstrong y Aldrin dieron el primer paso humano en la Luna." },
      { n: "Apolo 12", t: "Aterrizaje", lat: -3.01, lon: 339.42, imp: 0, icono: "flag", o: "Segundo aterrizaje tripulado (1969), junto a la Surveyor 3." },
      { n: "Apolo 14", t: "Aterrizaje", lat: -3.65, lon: 342.53, imp: 0, icono: "flag", o: "Aterrizó en Fra Mauro (1971)." },
      { n: "Apolo 15", t: "Aterrizaje", lat: 26.13, lon: 3.63, imp: 0, icono: "flag", o: "Primera misión con el rover lunar LRV (1971), en Hadley-Apeninos." },
      { n: "Apolo 16", t: "Aterrizaje", lat: -8.97, lon: 15.5, imp: 0, icono: "flag", o: "Aterrizó en las tierras altas de Descartes (1972)." },
      { n: "Apolo 17", t: "Aterrizaje", lat: 20.19, lon: 30.77, imp: 0, icono: "flag", o: "Última misión tripulada (1972), en Taurus-Littrow." },
      { n: "Chang'e 4 — Yutu-2", t: "Robot", lat: -45.44, lon: 177.6, imp: 0, icono: "robot", o: "Primer aterrizaje en el lado lejano (2019). Rover Yutu-2." },
      { n: "Chang'e 3 — Yutu", t: "Robot", lat: 44.12, lon: 340.49, imp: 1, icono: "robot", o: "Primer aterrizaje suave chino (2013). Rover Yutu." },
      { n: "Chandrayaan-3 — Pragyan", t: "Robot", lat: -69.37, lon: 32.32, imp: 1, icono: "robot", o: "Primer aterrizaje de la India cerca del polo sur (2023). Rover Pragyan." },
      { n: "Lunokhod 1", t: "Robot", lat: 38.32, lon: 325.0, imp: 2, icono: "robot", o: "Primer rover controlado remotamente (Luna 17, 1970)." },
      { n: "Lunokhod 2", t: "Robot", lat: 25.51, lon: 30.43, imp: 2, icono: "robot", o: "Rover soviético (Luna 21, 1973), recorrió 39 km." },
      { n: "Surveyor 1", t: "Sonda", lat: -2.46, lon: 316.98, imp: 2, icono: "satelite", o: "Primera sonda estadounidense en aterrizar suave (1966)." },
      { n: "Surveyor 3", t: "Sonda", lat: -2.94, lon: 339.4, imp: 2, icono: "satelite", o: "Visitada por el Apolo 12 en 1969." },
      { n: "Surveyor 5", t: "Sonda", lat: 1.41, lon: 23.2, imp: 2, icono: "satelite", o: "Sonda de aterrizaje (1967)." },
      { n: "Luna 2", t: "Impacto", lat: 29.1, lon: 0.0, imp: 2, icono: "impacto", o: "Primer objeto artificial en alcanzar la Luna (1959, estrellado)." },
      { n: "Luna 9", t: "Aterrizaje", lat: 7.13, lon: 295.63, imp: 2, icono: "satelite", o: "Primer aterrizaje suave en la Luna (1966)." },
      { n: "Luna 16", t: "Sonda", lat: -0.68, lon: 56.3, imp: 2, icono: "satelite", o: "Primera sonda en traer muestras de forma robótica (1970)." },
      { n: "Luna 17 / Lunokhod 1", t: "Sonda", lat: 38.32, lon: 325.0, imp: 2, icono: "satelite", o: "Aterrizó y desplegó el Lunokhod 1 (1970)." },
      { n: "Luna 24", t: "Sonda", lat: 12.71, lon: 62.21, imp: 2, icono: "satelite", o: "Trajo muestras del Mare Crisium (1976)." },
      { n: "Ranger 7", t: "Impacto", lat: -10.63, lon: 339.34, imp: 2, icono: "impacto", o: "Primera sonda estadounidense en impactar deliberadamente (1964)." },
      { n: "Ranger 8", t: "Impacto", lat: 2.72, lon: 24.77, imp: 2, icono: "impacto", o: "Impactó en el Mare Tranquillitatis (1965)." },
      { n: "Ranger 9", t: "Impacto", lat: -12.83, lon: 357.6, imp: 2, icono: "impacto", o: "Impactó dentro del cráter Alfonsus (1965)." },
      { n: "SMART-1", t: "Impacto", lat: -46.2, lon: 277.9, imp: 2, icono: "impacto", o: "Sonda europea que impactó en el lago de Excelencia (2006)." },
      { n: "Beresheet", t: "Impacto", lat: 32.6, lon: 19.35, imp: 2, icono: "impacto", o: "Sonda israelí que se estrelló en el Mare Serenitatis (2019)." },
      { n: "Chandrayaan-2 Vikram", t: "Impacto", lat: -70.88, lon: 22.78, imp: 2, icono: "impacto", o: "Aterrizador indio que se estrelló cerca del polo sur (2019)." },
      { n: "Chang'e 5", t: "Sonda", lat: 43.06, lon: 308.08, imp: 2, icono: "satelite", o: "Trajo muestras del Oceanus Procellarum (2020)." },
      { n: "Hakuto-R M1", t: "Impacto", lat: 47.58, lon: 44.42, imp: 2, icono: "impacto", o: "Aterrizador japonés que se estrelló (2023)." },
      { n: "SLIM", t: "Aterrizaje", lat: -13.32, lon: 25.25, imp: 2, icono: "robot", o: "Aterrizador japonés 'Moon Sniper', precisión de 55 m (2024)." },
      { n: "Polo Sur", t: "Región", lat: -90.0, lon: 0.0, imp: 0, icono: "estrella", o: "Región polar con cráteres permanentemente sombreados y posible hielo de agua." },
    ],
  },
  // Plantilla para otros cuerpos (marte, mercurio, ...):
  // marte: {
  //   dbf: "/ruta/al/MARS_nomenclature_center_pts.dbf",
  //   salida: "public/data/marte-zonas.json",
  //   tipos: new Set([...]), tag: {...}, minDiam: {...},
  //   imp0: new Set([...]), diamImp1: 150, diamImp2: 60,
  //   tiposAreaImp1: [...], historicos: [...],
  // },
};

// ====== Parser DBF ======
function leerDbf(ruta) {
  const b = readFileSync(ruta);
  const nRecords = b.readUInt32LE(4);
  const headerLen = b.readUInt16LE(8);
  const recLen = b.readUInt16LE(10);

  const fields = [];
  let off = 32;
  while (off < headerLen - 1) {
    const name = b.toString("latin1", off, off + 11).replace(/\0/g, "").trim();
    const type = String.fromCharCode(b[off + 11]);
    const len = b[off + 16];
    fields.push({ name, type, len });
    off += 32;
  }

  function readRecord(o) {
    const row = {};
    let p = o + 1; // skip record flag byte
    for (const f of fields) {
      const raw = b.toString("latin1", p, p + f.len).trim();
      if (f.type === "N") row[f.name] = raw ? parseFloat(raw) : null;
      else row[f.name] = raw;
      p += f.len;
    }
    return row;
  }

  const rows = [];
  for (let i = 0; i < nRecords; i++) {
    const r = readRecord(headerLen + i * recLen);
    if (r.name) rows.push(r);
  }
  return rows;
}

// ====== Clasificación ======
function clasificar(cfg, rows) {
  const out = [];
  for (const r of rows) {
    if (!cfg.tipos.has(r.type)) continue;
    if (r.name.includes("Satellite Feature")) continue;
    const minD = cfg.minDiam[r.type] || 0;
    if (r.diameter && r.diameter < minD) continue;

    let lon = r.center_lon;
    if (lon < 0) lon += 360;
    let lat = r.center_lat;

    const d = r.diameter || 0;
    const t = cfg.tag[r.type];
    let imp = 3;
    if (cfg.tiposAreaImp1.includes(t)) imp = 1;
    else if (d >= cfg.diamImp1) imp = 1;
    else if (d >= cfg.diamImp2) imp = 2;
    else imp = 3;
    if (cfg.imp0.has(r.name.trim())) imp = 0;

    out.push({
      n: r.name.trim(),
      t: t,
      lat: Math.round(lat * 10) / 10,
      lon: Math.round(lon * 10) / 10,
      d: Math.round(d),
      imp: imp,
      o: r.origin || "",
    });
  }

  for (const h of cfg.historicos || []) {
    out.push({ n: h.n, t: h.t, lat: h.lat, lon: h.lon, d: 0, imp: h.imp, icono: h.icono, o: h.o || "" });
  }

  out.sort((a, b) => a.imp - b.imp || b.d - a.d);
  return out;
}

// ====== Main ======
const cuerpo = process.argv[2] || "luna";
const cfg = CONFIG[cuerpo];
if (!cfg) {
  console.error("Config no encontrada para:", cuerpo, "— claves:", Object.keys(CONFIG).join(", "));
  process.exit(1);
}

const rows = leerDbf(cfg.dbf);
const out = clasificar(cfg, rows);
const salida = join(ROOT, cfg.salida);
writeFileSync(salida, JSON.stringify(out));

console.log(`[${cuerpo}] total zonas:`, out.length);
for (let i = 0; i <= 3; i++) {
  console.log(`  imp${i}:`, out.filter((z) => z.imp === i).length);
}
console.log("tipos:", [...new Set(out.map((z) => z.t))].join(", "));
console.log("escrito en:", cfg.salida);
