# Sistema de cuerpos celestes (planetas/lunas) — Guía de referencia

Esta guía documenta todo lo aprendido al construir la animación de la Luna, para
reutilizarlo al crear otros cuerpos (Marte, Mercurio, exoplanetas, etc.) sin
volver a cometer los mismos errores.

---

## 1. Arquitectura de archivos

```
public/js/
  shared/
    setup.js            → renderer, escena, cámara, controls, composer (genérico)
    starfield.js        → fondo de estrellas (genérico)
    navegacion.js       → teclado WASD + flechas (genérico)
    lod-texturas.js     → LOD de texturas (genérico, acepta cualquier lista)
    panel-opciones.js   → modal de opciones (genérico)
    tierra-sol-luna.js  → crearLunaSola / crearTierraSola (cuerpos esféricos)
    etiquetas-cuerpo.js → NÚCLEO GENÉRICO de etiquetas + panel Wikipedia
                          (crearEtiquetasCuerpo: radio, datosUrl, lods, escala,
                          presupuesto, región angular — sirve para cualquier cuerpo)
    luna-extras.js      → wrapper fino: config de la Luna sobre etiquetas-cuerpo
  luna/
    main-luna.js        → escena de la página luna-estudio
src/pages/animaciones/
  luna-estudio.astro    → HTML de la página (panel de opciones + script)
public/data/
  luna-zonas.json       → dataset de zonas (generado por scripts/parse-gazetteer.mjs)
public/textures/
  max/    → texturas de alta resolución (4k/8k)
  normal/ → texturas base (2k)
  simple/ → versiones simples/fallback
scripts/
  parse-gazetteer.mjs   → lee el DBF del gazetteer USGS → genera <cuerpo>-zonas.json
                          (uso: node scripts/parse-gazetteer.mjs luna|marte|...)
```

---

## 2. Gazetteer de la NASA/USGS/IAU (nombres de accidentes geográficos)

**Qué es:** la base de datos oficial con TODOS los nombres de cráteres, mares,
montes, valles, etc. de cada cuerpo del Sistema Solar, con coordenadas exactas,
diámetro y origen del nombre.

**Cómo se descarga (Luna):**
```
https://planetarynames.wr.usgs.gov/Page/MOON/target   → página con enlaces
https://asc-planetarynames-data.s3.us-west-2.amazonaws.com/MOON_nomenclature_center_pts.zip
```
Dentro del ZIP hay un **DBF** (base de datos dBase) llamado
`MOON_nomenclature_center_pts.dbf`. La Luna tiene ~9.086 features.

**Campos del DBF:** `name`, `clean_name`, `origin`, `diameter`, `center_lon`,
`center_lat`, `type`, `code`, `approval`, `ethnicity`, `quad_name`, `link`.

**Formato binario DBF:** header 32 bytes → descriptores de campo (32 bytes c/u,
11 nombre + 1 tipo + 4 len...) → registros. Cada registro empieza con 1 byte de
flag (0x20 = no borrado). Ver `scripts/parse_moon.mjs` para el parser.

**Otros cuerpos (misma estructura):** cambiar `MOON` por el código del cuerpo
(MARS, MERCURY, VENUS, JUPITER...) en la URL del ZIP y en la página del target:
```
https://planetarynames.wr.usgs.gov/Page/MARS/target
https://asc-planetarynames-data.s3.us-west-2.amazonaws.com/MARS_nomenclature_center_pts.zip
```

**Filtros usados para la Luna** (en scripts/parse-gazetteer.mjs, config `luna`):
- Tipos: Mare, Oceanus, Lacus, Palus, Sinus, Crater, Mons, Vallis, Rupes, Catena, Planitia, Promontorium.
- Cráteres solo ≥ 20 km de diámetro.
- Se excluye "Satellite Feature" (los cráteres satelitales A, B, C...).
- Importancia (imp):
  - `imp 0` (27 ultra-importantes): lista curada IMP0 (mares grandes + Tycho, Copérnico, Aristarco...).
  - `imp 1` (121): mares/montes/oceanos + cráteres ≥ 180 km.
  - `imp 2` (347): cráteres ≥ 80 km.
  - `imp 3` (resto): cráteres ≥ 20 km.
- Históricos añadidos a mano (Apolo 11-17, Chang'e, Lunokhod, sondas, etc.) con `icono`.

**Para otros cuerpos:** añadir una clave en `CONFIG` del script (mismo parser DBF,
solo cambian tipos/tags/umbrales/históricos). La clasificación por importancia es
lo que evita el error de "muchas etiquetas al tiempo".

---

## 3. LOD de etiquetas (sistema "círculos concéntricos")

Filosofía tipo Google Maps: NUNCA mostrar demasiadas etiquetas; solo las
relevantes al punto donde se hace zoom.

- **Solo cara visible:** `dot = dir.zona · dirCámara`; si `dot <= 0.15` no se dibuja (lado oculto).
- **LOD por distancia** (radio luna 0.6, umbrales calibrados para que F5 muestre 0):
  - `dist > 2.7` → nada
  - `1.8 < dist ≤ 2.7` → solo imp 0 (27)
  - `1.2 < dist ≤ 1.8` → imp 0+1
  - `0.85 < dist ≤ 1.2` → imp 0+1+2
  - `dist ≤ 0.85` → todo
- **Presupuesto:** máx ~48 etiquetas visibles (cerca) / ~14 (lejos). Nunca te tapan la luna.
- **Región angular:** `thetaMax` va de 80° (lejos) a 30° (cerca) alrededor del
  centro del zoom. Las etiquetas se concentran en el centro.
- **Prioridad:** primero imp, luego cercanía al centro (ang).
- **Escala de etiquetas:** se achican al acercarse (precisión):
  `escala = clamp(0.12 + pow(dist-0.6, 1.6) * 0.5, 0.08, 1.0)`.
- **Elbow (muy cerca, dist < 1.3):** mini-línea de 3 puntos desde el punto exacto
  de coordenadas en la superficie hasta la etiqueta. Se oculta sincronizado con su etiqueta.
- **Near plane:** las etiquetas nunca quedan a menos de 0.16 de la cámara (si no,
  desaparecen al zoom máximo por el near=0.1).
- **Etiqueta seleccionada:** nunca desaparece mientras esté en la cara visible
  (fuerza `posicionar` aunque no entre en el presupuesto).
- **Click vs drag:** se registra `pointerdown` y si el click se movió > 6px → se
  ignora (no seleccionar al arrastrar).

---

## 4. Wikipedia para descripciones

**API REST (summary) — para el fetch directo:**
```
https://es.wikipedia.org/api/rest_v1/page/summary/<Titulo>
```
Devuelve `title`, `extract`, `thumbnail.source`, `content_urls.desktop.page`.
Funciona con CORS desde el navegador (no requiere clave).

**API de acción (opensearch) — búsqueda ultrarrápida (fallback):**
```
https://es.wikipedia.org/w/api.php?action=opensearch&search=<termino>&limit=8&namespace=0&format=json&origin=*
```
Devuelve `[query, [títulos], [descripciones], [urls]]`. `origin=*` habilita CORS.

**Estrategia en luna-extras.js (`cargarWiki`):**
1. Intentar `summary/<titulo limpio>` directo.
2. Si falla → `opensearch` → elegir el mejor título por similitud.
3. Pedir el `summary` del título elegido (foto + extracto + link).

**Selección del mejor título (`mejorTitulo`):**
- Distancia de **Levenshtein** normalizada como base.
- **Bonus por substring** (Posidonius → "Posidonius (cráter)").
- **Prioridad fuerte:** un resultado `X (cráter)/(montes)/(vallis)/(mare)/(lacus)`
  que contenga el término buscado gana SIEMPRE (score 2.0 sin clamp). Evita que
  "Julius Caesar" devuelva al emperador en vez del cráter.
- Penalización: `(satélite)`, `(sonda)`, `(misión)`.
- Umbral de aceptación: `score >= 0.45`, si no → mensaje "buscar manualmente".

**Limpieza de títulos (`tituloWiki`):**
- "Apolo 11 — Tranquillity Base" → "Apolo 11" (quitar tras " — " y " / ").
- Statio IAU → misión conocida: "Statio Tranquillitatis" → "Tranquility Base",
  "Guang Han Gong" → "Chang'e 3", "Statio Shiv Shakti" → "Chandrayaan-3", etc.

**Nota de licencia:** Wikipedia es CC BY-SA; el enlace "Más información" referencia
la fuente original, evitando problemas de licencia.

---

## 5. Relieve real (normal map derivado del DEM)

**Datos fuente:** DEM de LOLA (Lunar Orbiter Laser Altimeter) del NASA CGI Moon Kit:
```
https://svs.gsfc.nasa.gov/4720   → página
https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16_uint.tif   → DEM 16 px/grado
```

**Derivación del normal map (lo que FUNCIONÓ):**
- El DEM es un TIF de 16-bit (offset +20.000, unidades de medio metro).
- Usar **sharp** (dependencia del proyecto) para leer el TIF como raw 8-bit,
  redimensionar a 4096×2048 y operar en un script Node (NO ImageMagick: su HDRI
  y `-evaluate`/`-convolve` dieron resultados impredecibles y NaN).
- Algoritmo: suavizar con blur gaussiano 3×3 → gradientes dx/dy con **wrap en X**
  (para que no haya seam en el meridiano 0) → normal = normalize(-dx·k, dy·k, 1)
  → RGB = normal·0.5+0.5 → escribir webp con sharp.
- Script original: `scripts/make_normal_tmp.mjs` (borrado; documentado aquí).
- Resultado: `public/textures/max/luna_normal_4096.webp` (~1.8 MB).

**Integración en three.js (MeshPhongMaterial):**
```js
material.normalMap = texNormal;
material.normalScale = new THREE.Vector2(s, s);  // s lerp(0.25, 0.6) según zoom
```
En `main-luna.js` el `normalScale` se adapta al zoom (bumpZoom smoothstep).

---

## 6. Otras texturas y fuentes (Tierra)

- **Día:** Solar System Scope — `https://www.solarsystemscope.com/textures/`
  (earth_daymap, moon, mars, etc.). Ficheros 2k/4k/8k, equirectangulares con
  lon 0 al centro.
- **Nubes:** `earth_clouds` (blanco con alfa) — usar `colorSpace = NoColorSpace`
  para el crossfade del LOD (lección aprendida: las nubes se veían azules).
- **Noche:** `earth_nightmap` (luces de ciudades) — en `tierra-sol-luna.js`.
- **Relieve Tierra:** `earth_normal_2048.jpg` (oficial NASA) + normalScale lerp 0.1→0.8.
- **Specular/océanos:** `8k_earth_specular_map.webp` (brillo de océanos) + destello
  de atmósfera con shader en `tierra-sol-luna.js`.

---

## 7. Lecciones aprendidas (errores que NO repetir)

1. **No usar ImageMagick para derivar normal maps** del DEM (HDRI inconsistente,
   `-evaluate` con porcentajes, NaN en canales, `-normalize` estira demasiado).
   Usar Node + sharp con operaciones explícitas.
2. **`ok` debe estar en scope**: un helper definido dentro de una función no se
   ve en otra (bug real de `buscarEnWikipedia`: `ok is not defined`).
3. **Near plane de la cámara (0.1)**: las etiquetas a menos de 0.1 de la cámara
   desaparecen. Mantener margen 0.16.
4. **Click+drag**: seleccionar en un drag accidental se siente como "pisar una mina".
   Guard de 6px.
5. **Grupo hijo del mesh que rota**: las posiciones de las etiquetas deben ser en
   espacio LOCAL de la luna; convertir la cámara a local con `invQuat` para la
   visibilidad (si no, rotación duplicada).
6. **LOD de etiquetas y LOD de texturas usan la misma distancia** (dist del centro)
   y se llaman juntos en cada frame: `actualizarLODEtiquetas(dist)` + `actualizar(camera)`.
7. **Elbows sueltos**: si la etiqueta se oculta, ocultar también su línea (sincronizado).

---

## 8. Hoja de ruta para generalizar

Hecho:
- [x] `luna-extras.js` → `etiquetas-cuerpo.js` (núcleo de etiquetas genérico).
- [x] `parse_moon.mjs` → `parse-gazetteer.mjs` parametrizado por URL/body (config por cuerpo).
- [x] `luna-extras.js` como wrapper fino (config lunar) — `main-luna.js` no cambió.

Pendiente:
- [ ] Separar `panel-detalle.js` (sidebar + Wikipedia) — ya es genérico pero vive en etiquetas-cuerpo.
- [ ] Config por cuerpo: JSON con radio, texturas, atmósfera, océanos, gazetteer.
- [ ] Página por cuerpo = config JSON + página .astro (sin tocar código).

## 9. Texturas LOD: descargar en máx calidad y derivar

**Idea (práctica y recomendada):** descargar la textura del planeta en la MÁXIMA
calidad disponible (ej. 8k o 16k) y generar las versiones 1k/2k/4k/8k desde esa
única fuente. Ventajas:
- Un solo origen de datos → coherencia total entre niveles (sin seams por fuentes distintas).
- El LOD (lod-texturas.js) intercambia archivos; al generarlos todos del mismo
  master se garantiza alineación perfecta.
- Se ahorra ancho de banda (el navegador solo descarga el nivel que necesita).

**Cómo generar con ImageMagick:**
```
magick master_8k.png -resize 2048x1024 -quality 82 out_2k.webp
magick master_8k.png -resize 4096x2048 -quality 82 out_4k.webp
magick master_8k.png -quality 82 out_8k.webp
```
(equirectangular: siempre 2:1, ej. 4096×2048, 8192×4096).

**Fuente recomendada:** Solar System Scope (`https://www.solarsystemscope.com/textures/`)
tiene hasta 8k para varios cuerpos; NASA SVS CGI Moon Kit para la Luna.

**Lección clave:** para el relieve, generar el normal map UNA vez desde el DEM
original (no desde la textura de color) y usar ese normal en todos los niveles
(ver sección 5).


