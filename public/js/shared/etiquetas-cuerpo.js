import * as THREE from "three";

const GRAD = Math.PI / 180;

const COLOR_POR_TIPO = {
  "Mar": "#56b6ff",
  "Océano": "#56b6ff",
  "Lago": "#56b6ff",
  "Seno": "#56b6ff",
  "Cráter": "#ffb454",
  "Montes": "#7ee787",
  "Valle": "#b087ff",
  "Escarpe": "#ff7b9c",
  "Catena": "#d0a0ff",
  "Planicie": "#9fd0a0",
  "Pantano": "#9fd0a0",
  "Promontorio": "#7ee787",
  "Aterrizaje": "#ffd166",
  "Robot": "#ff9e64",
  "Sonda": "#7dcfff",
  "Impacto": "#f7768e",
  "Región": "#e0af68",
  "Punto": "#ffffff",
};

const ICONOS = {
  flag: "🚩",
  robot: "🤖",
  satelite: "🛰️",
  impacto: "💥",
  estrella: "⭐",
};

function direccionGeografica(lat, lon, radio) {
  const phi = (90 - lat) * GRAD;
  const theta = lon * GRAD;
  return new THREE.Vector3(
    radio * Math.sin(phi) * Math.cos(theta),
    radio * Math.cos(phi),
    radio * Math.sin(phi) * Math.sin(theta)
  );
}

function crearNombreCanvas(nombre, color, icono) {
  const canvas = document.createElement("canvas");
  const conIcono = !!icono;
  canvas.width = conIcono ? 296 : 256;
  canvas.height = 44;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.95)";
  ctx.shadowBlur = 9;
  ctx.shadowOffsetY = 2;
  if (conIcono) {
    ctx.font = "26px sans-serif";
    ctx.shadowBlur = 6;
    ctx.fillText(icono, 4, 30);
  }
  ctx.font = "600 28px 'JetBrains Mono','Fira Code',monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(nombre, conIcono ? 44 : 4, 24);
  ctx.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  const material = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(conIcono ? 0.2 : 0.17, conIcono ? 0.03 : 0.029, 1);
  return sprite;
}

function crearLinea(color) {
  const geo = new THREE.BufferGeometry();
  const mat = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.55,
    depthTest: false,
  });
  const linea = new THREE.Line(geo, mat);
  linea.frustumCulled = false;
  return linea;
}

export function crearEtiquetasCuerpo(scene, objetivo, opts = {}) {
  const {
    radio = 0.6,
    domElement,
    onSelect = null,
    datosUrl = "/astro-animations/data/luna-zonas.json",
    // LODs: umbrales de distancia [distMax, impMax]. dist > primer umbral → nada.
    lods = [
      [2.7, -1],
      [1.8, 0],
      [1.2, 1],
      [0.85, 2],
      [-Infinity, 3],
    ],
    // Escala de etiqueta: cerca ≈ min, lejos ≈ 1 (opcional)
    escalaEtiqueta = (dist) => THREE.MathUtils.clamp(0.12 + Math.pow(Math.max(0, dist - 0.6), 1.6) * 0.5, 0.08, 1.0),
    // Presupuesto de etiquetas visibles [cerca, lejos]
    presupuestoFn = (dist) => Math.round(48 - 34 * THREE.MathUtils.smoothstep(dist, 0.75, 2.2)),
    // Región angular [cerca(°), lejos(°)]
    thetaAng = [30, 80],
    thetaRango = [0.75, 2.2],
  } = opts;
  const grupo = new THREE.Group();
  grupo.visible = true;
  objetivo.add(grupo);

  const quat = new THREE.Quaternion();
  const invQuat = new THREE.Quaternion();
  const camDir = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  // LOD por distancia: se deriva del array `lods` (ordenado de lejos a cerca)
  const impPorDist = (dist) => {
    for (const [dMax, imp] of lods) {
      if (dist > dMax) return imp;
    }
    return lods[lods.length - 1][1];
  };

  // Presupuesto de etiquetas visibles: cerca=48, lejos=14 (nunca te tapan el cuerpo)
  const presupuesto = (dist) => presupuestoFn(dist);

  // Región angular máxima alrededor del punto de zoom: se angosta al acercarse
  const thetaMax = (dist) => THREE.MathUtils.lerp(thetaAng[0], thetaAng[1], THREE.MathUtils.smoothstep(dist, thetaRango[0], thetaRango[1])) * GRAD;

  let zonas = [];
  let cargado = false;
  const items = [];

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let cameraRef = null;
  let hovered = null;
  let seleccionada = null;

  // ===== Tooltip HTML (burbuja de pantalla, no toca el sprite 3D) =====
  const tip = document.createElement("div");
  tip.className = "luna-tooltip";
  tip.style.cssText =
    "position:fixed;z-index:1000;pointer-events:none;display:none;background:rgba(5,12,20,0.92);" +
    "border-radius:8px;padding:8px 12px;font-family:'JetBrains Mono','Fira Code',monospace;" +
    "font-size:13px;color:#e8f6ff;line-height:1.5;max-width:320px;box-shadow:0 4px 16px rgba(0,0,0,0.6);" +
    "border:1px solid rgba(255,255,255,0.15);";
  tip.innerHTML = "<div class='t-nombre' style='font-weight:600;font-size:14px;'></div>" +
    "<div class='t-meta' style='font-size:12px;opacity:0.9;'></div>" +
    "<div class='t-desc' style='font-size:12px;opacity:0.75;margin-top:4px;'></div>";
  document.body.appendChild(tip);

  const worldP = new THREE.Vector3();
  function actualizarTooltip() {
    if (!hovered || !cameraRef) {
      tip.style.display = "none";
      return;
    }
    worldP.copy(hovered.dir).multiplyScalar(radio + 0.04).applyMatrix4(objetivo.matrixWorld);
    worldP.project(cameraRef);
    if (worldP.z > 1) {
      tip.style.display = "none";
      return;
    }
    const x = ((worldP.x + 1) * 0.5) * window.innerWidth;
    const y = ((1 - worldP.y) * 0.5) * window.innerHeight;
    tip.style.display = "block";
    tip.style.left = Math.min(x + 16, window.innerWidth - 340) + "px";
    tip.style.top = Math.max(y - 8, 8) + "px";
  }

  function onPointerMove(e) {
    if (!cameraRef || !cargado) return;
    const rect = domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, cameraRef);
    const candidatos = items.filter((it) => it.sprite.visible).map((it) => it.sprite);
    const hits = raycaster.intersectObjects(candidatos, false);
    if (hits.length > 0) {
      const it = hits[0].object.userData.it;
      if (hovered !== it) {
        hovered = it;
        const color = COLOR_POR_TIPO[it.zona.t] || "#ffffff";
        tip.querySelector(".t-nombre").textContent = (ICONOS[it.zona.icono] ? ICONOS[it.zona.icono] + " " : "") + it.zona.n;
        tip.querySelector(".t-nombre").style.color = color;
        const latc = it.zona.lat >= 0 ? it.zona.lat.toFixed(1) + "°N" : (-it.zona.lat).toFixed(1) + "°S";
        const meta = (it.zona.t || "").toUpperCase() + "  ·  " + latc + "  " + it.zona.lon.toFixed(0) + "°E" + (it.zona.d ? "  ·  ⌀" + it.zona.d + " km" : "");
        tip.querySelector(".t-meta").textContent = meta;
        tip.querySelector(".t-desc").textContent = it.zona.o || "";
        tip.querySelector(".t-desc").style.display = it.zona.o ? "block" : "none";
      }
      actualizarTooltip();
    } else {
      hovered = null;
      tip.style.display = "none";
    }
  }

  if (domElement) {
    domElement.addEventListener("pointermove", onPointerMove);
    domElement.addEventListener("pointerleave", () => {
      hovered = null;
      tip.style.display = "none";
    });
  }

  // ===== Click en etiqueta: detener + volar + panel =====
  const panel = crearPanel();
  const rayoClick = new THREE.Raycaster();
  const mouseClick = new THREE.Vector2();
  let ptrInicio = null;

  function onClick(e) {
    if (!cameraRef || !cargado) return;
    // Si hubo arrastre (click+drag), no seleccionar: solo clicks limpios
    if (ptrInicio) {
      const dx = e.clientX - ptrInicio.x;
      const dy = e.clientY - ptrInicio.y;
      if (Math.hypot(dx, dy) > 6) {
        ptrInicio = null;
        return;
      }
      ptrInicio = null;
    }
    const rect = domElement.getBoundingClientRect();
    mouseClick.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseClick.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    rayoClick.setFromCamera(mouseClick, cameraRef);
    const candidatos = items.filter((it) => it.sprite.visible).map((it) => it.sprite);
    const hits = rayoClick.intersectObjects(candidatos, false);
    if (hits.length === 0) return;
    const it = hits[0].object.userData.it;
    seleccionada = it;
    if (onSelect) onSelect(it, cameraRef);
    abrirPanel(it);
  }

  if (domElement) {
    domElement.addEventListener("pointerdown", (e) => {
      ptrInicio = { x: e.clientX, y: e.clientY };
    });
    domElement.addEventListener("click", onClick);
  }

  function cargarDatos() {
    if (cargado) return Promise.resolve();
    return fetch(datosUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((data) => {
        zonas = data || [];
        cargado = true;
      })
      .catch((err) => {
        console.warn("[luna-extras] error cargando zonas:", err);
      });
  }

  function actualizar(camera) {
    cameraRef = camera;
    if (!cargado) return;
    quat.copy(objetivo.quaternion);
    invQuat.copy(quat).invert();
    camDir.copy(camera.position).applyQuaternion(invQuat).normalize();
    const dist = camera.position.distanceTo(tmp.copy(objetivo.position));
    const maxImp = impPorDist(dist);
    const escala = escalaEtiqueta(dist);
    const N = presupuesto(dist);
    const tMax = thetaMax(dist);

    // Ocultar todo (etiqueta Y su elbow van sincronizados)
    for (const it of items) {
      it.sprite.visible = false;
      it.linea.visible = false;
    }

    if (maxImp < 0) {
      if (hovered) {
        hovered = null;
        tip.style.display = "none";
      }
      return;
    }

    // Recolectar candidatas: solo cara visible + dentro de la región angular
    const candidatas = [];
    for (const it of items) {
      const zona = it.zona;
      if ((zona.imp ?? 3) > maxImp) continue;
      const dot = it.dir.dot(camDir);
      if (dot <= 0.15) continue; // lado oculto
      const ang = Math.acos(Math.min(1, Math.max(-1, dot)));
      if (ang > tMax) continue; // fuera de la región de zoom
      candidatas.push({ it, ang, imp: zona.imp ?? 3 });
    }

    // Priorizar: más importante primero, luego más cerca del centro del zoom
    candidatas.sort((a, b) => a.imp - b.imp || a.ang - b.ang);
    const elegidas = candidatas.slice(0, N);

    const camLocal = camera.position.clone().applyQuaternion(invQuat);
    const pos = new THREE.Vector3();
    const haciaCam = new THREE.Vector3();
    const superficie = new THREE.Vector3();
    const medio = new THREE.Vector3();

    const posicionar = (it) => {
      it.sprite.visible = true;
      it.linea.visible = false;
      const pegado = dist < 1.3;
      const offset = pegado ? 0.02 : 0.05;
      pos.copy(it.dir).multiplyScalar(radio + offset);
      // Margen: nunca dejar la etiqueta a menos de 0.16 de la cámara (evita el near plane)
      haciaCam.copy(pos).sub(camLocal).normalize();
      const dCam = pos.distanceTo(camLocal);
      if (dCam < 0.16) pos.copy(camLocal).addScaledVector(haciaCam, 0.16);
      it.sprite.position.copy(pos);
      it.sprite.scale.copy(it.baseScale).multiplyScalar(escala);

      if (pegado) {
        // Elbow fino: del punto exacto de coordenadas en la superficie hasta la etiqueta
        superficie.copy(it.dir).multiplyScalar(radio * 0.995);
        medio.copy(superficie).lerp(pos, 0.5).addScaledVector(haciaCam, 0.04);
        it.linea.geometry.setFromPoints([superficie, medio, pos]);
        it.linea.visible = true;
      }
    };

    for (const c of elegidas) posicionar(c.it);

    // La etiqueta seleccionada nunca desaparece mientras esté en la cara visible
    if (seleccionada) {
      const dotSel = seleccionada.dir.dot(camDir);
      if (dotSel > 0.1) posicionar(seleccionada);
    }

    if (hovered && !hovered.sprite.visible) {
      hovered = null;
      tip.style.display = "none";
    }
    actualizarTooltip();
  }

  function setVisible(v) {
    grupo.visible = v;
    if (!v) {
      hovered = null;
      tip.style.display = "none";
    }
  }

  let itemsCreados = 0;
  function asegurarItems(maxImp) {
    if (maxImp < 0) return;
    const zonaVisible = (z) => (z.imp ?? 3) <= maxImp;
    let target = 0;
    for (const z of zonas) if (zonaVisible(z)) target++;
    target = Math.min(target, 500);
    let intentos = 0;
    while (itemsCreados < target && itemsCreados < zonas.length && intentos < zonas.length) {
      const zona = zonas[itemsCreados];
      intentos++;
      if (!zonaVisible(zona)) {
        itemsCreados++;
        continue;
      }
      const color = COLOR_POR_TIPO[zona.t] || "#ffffff";
      const icono = ICONOS[zona.icono] || "";
      const sprite = crearNombreCanvas(zona.n, color, icono);
      const baseTex = sprite.material.map;
      const baseScale = sprite.scale.clone();
      const linea = crearLinea(color);
      grupo.add(linea);

      const dir = direccionGeografica(zona.lat, zona.lon, 1);
      const item = {
        zona,
        sprite,
        linea,
        dir,
        baseTex,
        baseScale,
      };
      sprite.userData.it = item;
      grupo.add(sprite);
      items.push(item);
      itemsCreados++;
    }
  }

  function actualizarLODEtiquetas(dist) {
    if (!cargado) return;
    asegurarItems(impPorDist(dist));
  }

  return { grupo, actualizar, setVisible, cargarDatos, actualizarLODEtiquetas };
}

// ===== Panel lateral de detalle (click en etiqueta) =====
function crearPanel() {
  const panel = document.createElement("aside");
  panel.className = "luna-panel";
  panel.style.cssText =
    "position:fixed;top:0;right:0;width:340px;max-width:92vw;height:100%;z-index:1002;" +
    "background:rgba(6,12,22,0.94);border-left:1px solid rgba(120,180,255,0.25);" +
    "color:#e8f6ff;font-family:'JetBrains Mono','Fira Code',monospace;" +
    "transform:translateX(105%);transition:transform 0.3s ease;overflow-y:auto;display:flex;flex-direction:column;";
  panel.innerHTML = `
    <div style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;">
      <div id="luna-panel-titulo" style="font-weight:600;font-size:17px;"></div>
      <button id="luna-panel-cerrar" style="background:none;border:1px solid rgba(255,255,255,0.25);color:#fff;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:14px;">✕</button>
    </div>
    <div id="luna-panel-cuerpo" style="padding:14px 18px;font-size:13px;line-height:1.6;flex:1;"></div>
    <div id="luna-panel-mas" style="padding:12px 18px;border-top:1px solid rgba(255,255,255,0.1);display:none;">
      <a id="luna-panel-link" href="#" target="_blank" rel="noopener noreferrer"
        style="color:#7dcfff;font-size:13px;text-decoration:none;">Más información →</a>
    </div>`;
  document.body.appendChild(panel);
  panel.querySelector("#luna-panel-cerrar").addEventListener("click", () => {
    panel.style.transform = "translateX(105%)";
  });
  return panel;
}

function abrirPanel(it) {
  const panel = document.querySelector(".luna-panel");
  if (!panel) return;
  const zona = it.zona;
  const color = COLOR_POR_TIPO[zona.t] || "#ffffff";
  panel.querySelector("#luna-panel-titulo").textContent = (ICONOS[zona.icono] ? ICONOS[zona.icono] + " " : "") + zona.n;
  panel.querySelector("#luna-panel-titulo").style.color = color;

  const latc = zona.lat >= 0 ? zona.lat.toFixed(1) + "°N" : (-zona.lat).toFixed(1) + "°S";
  const lonc = zona.lon.toFixed(0) + "°E";
  const cuerpo = panel.querySelector("#luna-panel-cuerpo");

  let html = `<div style="opacity:0.9;font-size:12px;letter-spacing:0.5px;">
      ${(zona.t || "").toUpperCase()}  ·  ${latc}  ${lonc}${zona.d ? "  ·  ⌀ " + zona.d + " km" : ""}
    </div>`;
  if (zona.o) html += `<p style="margin:10px 0;opacity:0.85;">${zona.o}</p>`;
  html += `<div id="luna-panel-wiki" style="margin-top:10px;opacity:0.65;font-size:12px;">Cargando datos de Wikipedia…</div>`;
  cuerpo.innerHTML = html;

  panel.style.transform = "translateX(0)";
  cargarWiki(zona, panel);
}

// Fetch de Wikipedia (resumen + foto) para una zona lunar.
// Estrategia: 1) pedir el summary directo por título; 2) si falla, buscar con
// opensearch y elegir el título más parecido al nombre de la zona (Levenshtein
// normalizado con bonus de substring); 3) pedir el summary de ese título.
function cargarWiki(zona, panel) {
  const wikiEl = panel.querySelector("#luna-panel-wiki");
  const masEl = panel.querySelector("#luna-panel-mas");
  const linkEl = panel.querySelector("#luna-panel-link");
  if (!wikiEl) return;
  const titulo = tituloWiki(zona);

  fetch("https://es.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(titulo), {
    headers: { Accept: "application/json" },
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
    .then((s) => {
      if (!ok(s)) throw new Error("sin extract");
      pintarWiki(wikiEl, masEl, linkEl, zona, s);
    })
    .catch(() => buscarEnWikipedia(zona, titulo, wikiEl, masEl, linkEl));
}

function buscarEnWikipedia(zona, titulo, wikiEl, masEl, linkEl) {
  const ok = (s) => s && s.extract;
  const url =
    "https://es.wikipedia.org/w/api.php?action=opensearch&search=" +
    encodeURIComponent(titulo) +
    "&limit=8&namespace=0&format=json&origin=*";
  fetch(url, { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
    .then((datos) => {
      const titulos = Array.isArray(datos) && datos[1] ? datos[1] : [];
      const enlaces = Array.isArray(datos) && datos[3] ? datos[3] : [];
      const mejor = mejorTitulo(titulo, titulos);
      if (!mejor || mejor.score < 0.45) {
        throw new Error("sin coincidencia: " + (mejor ? mejor.score.toFixed(2) : "n/a"));
      }
      // Volver a pedir el summary del título elegido (para foto + extracto)
      return fetch(
        "https://es.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(mejor.titulo),
        { headers: { Accept: "application/json" } }
      ).then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))));
    })
    .then((s) => {
      if (!ok(s)) throw new Error("sin extract");
      pintarWiki(wikiEl, masEl, linkEl, zona, s);
    })
    .catch(() => {
      wikiEl.innerHTML =
        "No se pudo cargar la descripción automática de Wikipedia para esta zona. " +
        "Puedes buscarla manualmente en el enlace de abajo.";
      linkEl.href = "https://es.wikipedia.org/w/index.php?search=" + encodeURIComponent(titulo);
      masEl.style.display = "block";
    });
}

function pintarWiki(wikiEl, masEl, linkEl, zona, s) {
  let img = "";
  if (s.thumbnail && s.thumbnail.source) {
    img = `<img src="${s.thumbnail.source}" alt="${zona.n}"
      style="max-width:100%;border-radius:8px;margin:10px 0;display:block;border:1px solid rgba(255,255,255,0.12);"/>`;
  }
  wikiEl.innerHTML = img + `<p style="margin:0;opacity:0.9;">${s.extract}</p>`;
  const url = (s.content_urls && s.content_urls.desktop && s.content_urls.desktop.page) || s.content_urls?.mobile?.page;
  if (url) {
    linkEl.href = url;
    masEl.style.display = "block";
  }
}

// Devuelve el título más parecido al buscado con su score en [0,1].
// Un resultado "X (cráter)/(montes)/(mare)" que contiene el término buscado
// gana SIEMPRE (score 2.0 sin clamp): al buscar una zona lunar, ese es el
// contexto correcto aunque exista un match exacto homónimo ("Julius Caesar"
// → "Julius Caesar (cráter)" en vez del emperador).
function mejorTitulo(buscado, titulos) {
  let mejor = null;
  for (const t of titulos) {
    const a = buscado.toLowerCase().trim();
    const b = t.toLowerCase().trim();
    const base = b.split(" (")[0].toLowerCase();
    let score;
    if (/\((cráter|crater|montes?|vallis|mare|lacus)\)/.test(b) && (a.includes(base) || base.includes(a))) {
      score = 2.0;
    } else {
      const lev = levenshtein(a, b);
      const levScore = 1 - lev / Math.max(a.length, b.length);
      let sc = levScore;
      if (a.length >= 3 && b.includes(a)) sc += 0.25;
      else if (b.length >= 3 && a.includes(b)) sc += 0.25;
      if (/\((cráter|crater|montes?|vallis|mare|lacus)\)/.test(b)) sc += 0.1;
      else if (/\((satelite|satellite|satélite)\)/.test(b)) sc -= 0.2;
      else if (/\((misión|mision|sonda)\)/.test(b)) sc -= 0.05;
      score = sc;
    }
    if (!mejor || score > mejor.score) mejor = { titulo: t, score };
  }
  return mejor;
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[n];
}

function tituloWiki(zona) {
  let t = zona.n;
  // "Apolo 11 — Tranquillity Base" → "Apolo 11" ; quitar sufijos tras " — " / " / "
  t = t.split(" — ")[0].split(" / ")[0].trim();
  // Los Statio IAU tienen artículo bajo el sitio de la misión más conocida
  const statios = {
    "Statio Tranquillitatis": "Tranquility Base",
    "Guang Han Gong": "Chang'e 3",
    "Statio Shiv Shakti": "Chandrayaan-3",
    "Statio Tianhe": "Chang'e 4",
    "Statio Tianchuan": "Chang'e 5",
    "Statio Tianjiang": "Chang'e 6",
  };
  return statios[t] || t;
}