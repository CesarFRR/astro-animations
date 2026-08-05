# Astro Animations — WIP & Roadmap

Simulaciones 3D educativas de fenómenos astrofísicos.  
Stack: [Astro](https://astro.build) + [Three.js](https://threejs.org) + [GSAP](https://gsap.com)

---

## Cómo empezar (si clonas esto)

```bash
git clone <repo>
cd astro-animations
npm install
npm run dev        # local → http://localhost:4321/astro-animations/
npm run build      # build producción → dist/
npm run preview    # previsualizar build
npm run generate   # scaffolding para nueva animación
```

---

## Lo que hay ahora (10 animaciones)

| Animación | Tipo | Estado |
|---|---|---|
| Supernova de Inestabilidad de Pares | supernova | ✅ Completa |
| Supernova → Agujero Negro | agujero-negro | ✅ Completa |
| Gigante Roja → Enana Blanca | estrella | ✅ Completa |
| Púlsar del Cangrejo (PSR B0531+21) | pulsar | ✅ Completa |
| Púlsar de Vela (PSR B0833-45) | pulsar | ✅ Completa |
| Sistema Tierra–Sol–Luna (Base) | sistema-solar | ✅ Completa (clic-para-enfocar incluido) |
| Rotación — Día Sidéreo vs Solar | sistema-solar | ✅ Completa |
| Tierra — Vuelo Libre | sistema-solar | ✅ Completa (controles tipo Google Earth: WASD + pan + zoom; layout inmersivo `ExplorerLayout` sin widgets) |
| Sol — La Estrella Madre | sistema-solar | ✅ Completa (bloom + corona sprite procedural) |
| Luna — Rotación Síncrona | sistema-solar | ✅ Completa |

**Layout inmersivo:** `src/layouts/ExplorerLayout.astro` — solo canvas + top-bar + controles
(play/velocidad), sin HUD ni widgets. Para animaciones de un solo cuerpo. Los helpers
`crearTierraSola` / `crearLunaSola` / `updateTierraSola` / `updateLunaSola` viven en
`tierra-sol-luna.js` (malla 96×64, anisotropy 8, atmósfera fresnel, luz puntual decay 1).

---

## ⚙️ Workflow del repo

- **Solo commits locales.** Nada de `git push` ni `npm run deploy` salvo que se pida explícitamente.
- Los fuentes de referencia descargados viven en `ejemplos-proyectos-comunidad/` (no se versionan análisis de repos ajenos).

---

## 🌍 Serie Tierra–Sol–Luna (movimientos de la Tierra)

Sobre una base de sistema Tierra–Sol–Luna (texturas reales 2K, órbitas correctas),
cada animación explica un movimiento concreto. Fuente del contenido:
`ejemplos-proyectos-comunidad/Movimientos de la Tierra - Wikipedia.pdf`.

| # | Animación | Concepto | Datos clave (PDF) | Textura Tierra | Dificultad |
|---|---|---|---|---|---|
| 1 | `rotacion-dia` | Rotación: día sidéreo vs solar | 23h 56m 4.1s (estrellas) vs 24h (Sol); giro O→E, levógiro visto desde el polo norte; +3m56s por el avance orbital | media (2K) | baja |
| 2 | `traslacion-orbita` | Traslación elíptica | 365d 5h 48m 45s (año tropical); elipse de 930M km, e≈0.0167; perihelio ~3 ene (147.5M km), afelio ~4 jul (152.6M km); 106,200 km/h (29.5 km/s); Sol en un foco (Kepler) | media (2K) | baja |
| 3 | `estaciones` | Oblicuidad de la eclíptica (23.5°) | Ángulo de incidencia + horas de luz → estaciones; meses de luz/oscuridad en los polos; solsticios y equinoccios | media (2K, con líneas de trópicos/ecuador) | media |
| 4 | `eclipses` | Eclipse solar y lunar | Nodos de la órbita lunar (i=5.16°); umbra/penumbra; eclipse solar (Luna entre Sol y Tierra) y lunar (Tierra entre Sol y Luna) | simple (1K, sin satélite) + sombras | media-alta |
| 5 | `precesion-nutacion` | Precesión de los equinoccios + nutación + Chandler | Precesión: 25,772 años, levógira, cono del eje; nutación: 18.6 años, ~9", 1,385 bucles por vuelta (Bradley); Chandler: 0.7", 433 días (1891) | simple (1K) + esfera celeste con líneas | alta |
| 6 | `ciclos-milankovic` | Variaciones orbitales | Oblicuidad 22.1°–24.5°; excentricidad; precesión del perihelio (3.84"/siglo, ~112,000 años); insolación a 65°N (sedimentos marinos/Vostok) | simple (1K) | media-alta |
| 7 | `coordenadas-ecuatoriales` | Sistema de coordenadas ecuatoriales | Esfera celeste: ecuador celeste, eclíptica (oblicuidad), polos celestes, AR/Dec, meridiano, horizonte del observador | **simple** (color/plano, sin detalles — el foco son las líneas) | media |

**Prioridad sugerida:** 1 → 2 → 3 → 4 → 7 → 5 → 6 (de lo simple a lo complejo; 7 necesita la esfera celeste que ya se construye en 5).

### Base técnica común

- Reutilizar `public/js/shared/setup.js` (escena + bloom + OrbitControls) y `public/js/shared/starfield.js`.
- **Órbitas reales (opcional):** portar ideas de `sistema_solar/` (jsorrery): VSOP87 para la Tierra, ELP-2000/82B para la Luna, inclinación 23°26'21", precesión del eje en `getTilt()` (25,800 años), nodos lunares con avance de 360°/18.6 años. Para fines educativos basta Kepler simplificado + corrección de nodos.
- **Texturas:** descargar desde Solar System Scope / NASA Visible Earth a `public/textures/` en **2K** (nunca 8K). Para conceptos con muchos overlays (5, 6, 7): usar la **tierra simple real 1K** de `public/textures/simple/` (set de Three.js Journey, 6 webp: día 55KB, bump, specular, luces nocturnas, nubes, nubes-alpha + sprite de estrella) — el foco es la explicación, no el render. Cargador: `cargarTexturasSimples(manager)` en `public/js/shared/textura-simple.js`. La textura procedural (cuadrícula + meridiano rojo) queda para la rotación.
- **Plantillas solo como referencia visual/técnica** (iluminación de eyes-nasa, layers, astronomía de jsorrery). No copiar código minificado.

### Pendientes de esta serie

- [x] Descargar texturas (Solar System Scope, CC BY 4.0) → `public/textures/` en WebP
- [x] Atmósfera fresnel (halo azul día / crepúsculo naranja) — portada del ejemplo oficial three.js `webgpu_tsl_earth` (Three.js Journey + SSS). `ShaderMaterial` GLSL ~30 líneas, opción `atmosfera: false` para desactivarla
- [x] Clic-para-enfocar en la base: `visible=false` al resto + cámara con lerp (raycaster por `userData.cuerpo`)
- [x] Animación 1: rotación (sidéreo vs solar) → `rotacion-tierra`
- [x] Assets Tierra simple 1K (set Three.js Journey) → `public/textures/simple/*.webp` (1.1MB JPG → 328KB)
- [ ] Crear módulo compartido `public/js/shared/orbits.js` (Kepler + VSOP simplificado + elementos de la Luna)
- [ ] Crear módulo compartido `public/js/shared/esfera-celeste.js` (líneas eclíptica/ecuador/polos para 5 y 7)
- [ ] Animación 2: traslación (perihelio/afelio)
- [ ] Animación 3: estaciones
- [ ] Animación 4: eclipses
- [ ] Animación 7: coordenadas ecuatoriales
- [ ] Animación 5: precesión + nutación + Chandler
- [ ] Animación 6: ciclos de Milanković

---

## ⚡ Optimización & Rendimiento (análisis 04-ago)

> Fuente: video "Most Optimization Advice Misses the REAL Problem" (SimonDev) +
> sesión con Gemini sobre texturas. Aplicado a nuestra base el mismo día.

### Filosofía (del video)

1. **Presupuesto de frame**: 60fps = 16.6 ms por frame. Todo (render + post + partículas) vive ahí.
2. **Perfilar antes de optimizar** (CPU vs GPU): nunca optimizar a ciegas. DevTools profiler basta para JS.
3. **"Don't do the work"**: nada es más rápido que no hacerlo → culling, LOD, ocultar lo no visible.
4. **Peor caso ≠ caso promedio**: las explosiones de la supernova (miles de partículas) serán nuestro peor caso — se resuelve con **instancing + presupuesto de partículas**, no con LOD.
5. **Rendimientos decrecientes**: cuando la escena es trivialmente barata (nuestro caso hoy), parar — la ganancia de seguir no vale el código.

### Lo que ya aplicamos a la base (✅)

| Mejora | Detalle |
|---|---|
| WebP (q85) | 3.3MB → 1.2MB; Tierra 166KB, Sol 270KB, Luna 628KB, nubes 130KB |
| Nubes 1K + AdditiveBlending | Las partes negras se vuelven transparentes sin canal alfa; `depthWrite: false` |
| Geometría compartida | Tierra y nubes usan la misma `SphereGeometry` (nubes con `scale 1.02`) |
| LoadingManager | Exportado desde `createBase`; evita planetas en blanco |
| SRGBColorSpace + mipmaps | Ya activos (defaults correctos de Three.js) |
| Starfield en un solo `BufferGeometry` | 4,000 estrellas = 1 draw call |

### Aclaración importante (BufferGeometry ≠ optimización)

`BufferGeometry` es solo el **formato de datos** de geometría en Three.js (todo lo es
internamente); no "desrenderiza" nada. Lo que sí funciona:

- **`object.visible = false`** → el objeto no se envía a la GPU (costo cero). Es el
  "don't draw what you can't see" del video. Para el modo enfoque: ocultar Sol/Luna/órbitas.
- **Frustum culling**: Three.js ya descarta automáticamente lo que queda fuera de cámara.
- **Prefetch + cache de textura**: el lag al cambiar texturas viene de decodificar/subir a
  GPU en el hilo principal; cargándola antes (`TextureLoader` cache) el cambio es instantáneo.
- **`THREE.LOD`** (el de Halo Reach): intercambia malla/textura por distancia. Brillará
  cuando la escena tenga muchos objetos (asteroides, anillos, partículas); hoy (5-20 mallas)
  sería premature optimization.

### Plan "calidad solo en lo visible" (para la base)

1. Clic en un cuerpo → cámara se acerca (GSAP) + `visible=false` al resto del sistema.
2. Textura fina precargada con antelación (prefetch en hover o al inicio en segundo plano).
3. Cuando la escena crezca: `THREE.LOD` por cuerpo (malla 128/64/32 + textura 2K/1K).

---

## Plantillas de referencia (`ejemplos-proyectos-comunidad/`)

| Carpeta | Qué es | Qué aporta |
|---|---|---|
| `eyes-nasa-*` (earth, moon, sun, all-solar-system) | NASA Eyes on the Solar System (F12 dump) | **Calidad visual**: capas/layers, iluminación, texturas, entidades; lag inicial por cantidad de elementos |
| `solarSystemScope-*` (earth, all-solar-system) | Solar System Scope (Three.js minificado) | Texturas estilo y render planetario atractivo |
| `sistema_solar` (jsorrery) | JSOrrery (Three.js, mvezina) | **Astronomía real**: VSOP87 (Tierra), ELP-2000 (Luna), elementos orbitales por cuerpo, tilt + precesión, nodos lunares 18.6 años, ΔT |
| `earth-revolutions-around-sun` | Derivado jsorrery (escenarios Apolo/NEO) | Escenarios orbitales reales (elementos osculantes, misiones) |
| `theskylive-solar-system` | TheSkyLive | Posiciones en tiempo real (referencia de datos) |
| `seasons-earth`, `solar-time` | Conceptos estaciones/tiempo solar | Guion educativo (referencia de contenido) |
| `threejs-example-earth-webgpu.html` | Ejemplo oficial three.js (TSL/WebGPU, Three.js Journey) | **Atmósfera fresnel** (portada a GLSL en `createBase`) + origen del set de texturas 1K en `simple/` |

---

## Pendientes / Bugs conocidos

- [ ] `public/js/main.js` (Supernova) tiene lógica duplicada con `src/scripts/supernova-pares.ts`
- [ ] Three.js se carga por CDN (unpkg) — migrar a bundle de Vite
- [ ] Las animaciones pulsar (crab, vela) comparten ~90% de código pero están duplicadas
- [ ] `public/js/pulsar-vela.html` y `public/js/pulsar/crab.js` usan estilos/páginas separadas del sistema Astro
- [ ] Sin thumbnails reales en el catálogo (solo gradientes CSS)
- [ ] Componente `Canvas3D.astro` / `canvas3d.ts` existe pero ninguna animación activa lo usa
- [ ] Sin Service Worker → no funciona offline
- [ ] Sin tests

---

## Lienzo de fondo estelar

Actualmente hay **dos** implementaciones del cielo de fondo. La idea es elegir la mejor
y que sirva de lienzo para todas las animaciones:

| Archivo | Usado por | Estrellas | Rango | Colores | Twinkle |
|---|---|---|---|---|---|
| `public/js/shared/background.js` | Supernova, BH, WD | 2500 | 40–140 | Temperatura simple | ❌ |
| `public/js/pulsar/starfield.js` | Crab, Vela | **5000** | **60–560** | **Tipos espectrales (OBAFGKM)** | **✅ individual** |

**Elegido: `pulsar/starfield.js`** — más estrellas, colores realistas por tipo espectral,
profundidad de campo, parpadeo individual. Debe convertirse en el lienzo/plantilla
que todas las animaciones usen de fondo.

- [ ] Mover `pulsar/starfield.js` → `shared/starfield.js` (o similar) como módulo compartido
- [ ] Exportar `createStarfield()` y `updateTwinkle()` para que todas las animaciones los importen
- [ ] Reemplazar las llamadas a `shared/background.js` por el nuevo módulo en Supernova, BH y WD
- [ ] Eliminar `shared/background.js` una vez migrado todo

---

## Ideas para nuevas animaciones

### 1. ⭐ Nova Clásica (Binaria Enana Blanca + Compañera)
Sistema binario donde una enana blanca acretra materia hasta ignition termonuclear.
- **Fases:** Acreción → acumulación → nova → enfriamiento → ciclo
- **Feature:** Curva de luz con outburst + decay
- **Dificultad:** media

### 2. ⚡ Magnetar
Estrella de neutrones con campo magnético extremo (~10¹⁵ G).
- **Fases:** Rotación → starquake → giant flare → afterglow
- **Feature:** Eyección de corona magnética, deformación de corteza, burst de rayos gamma
- **Dificultad:** alta

### 3. 💥 Kilonova / Colisión de Estrellas de Neutrones
GW170817 — fusión de dos NS, onda gravitacional, kilonova, producción de elementos pesados.
- **Fases:** Inspiral → merger → ejecta → kilonova → remnant
- **Feature:** Onda gravitacional visualizada, producción de lantánidos, afterglow
- **Dificultad:** muy alta

### 4. 🌌 Quásar / Núcleo Galáctico Activo (AGN)
SMBH con disco de acreción y jets relativistas.
- **Fases:** Disco estable → flare → jet → variability
- **Feature:** Variabilidad óptica/rayos X, toro de polvo, líneas anchas
- **Dificultad:** alta

### 5. 🌀 Disco Protoplanetario / Formación Planetaria
De nube molecular a sistema planetario.
- **Fases:** Colapso → disco → granos → planetesimales → planetas
- **Feature:** Gap bands, migración planetaria, snow line
- **Dificultad:** media-alta

### 6. 🌠 Supernova Tipo Ia
Enana blanca que supera Chandrasekhar y detona.
- **Fases:** Acreción → deflagración → detonación → explosión → SNR
- **Feature:** Curva de luz standardizable (vela cósmica), nucleosíntesis de Fe
- **Dificultad:** media

### 7. 🔭 Lente Gravitacional
Distorsión del espacio-tiempo curva la luz de galaxias de fondo.
- **Fases:** Approach → anillo de Einstein → múltiples imágenes → caustics
- **Feature:** Malla de espacio-tiempo deformada, imágenes especulares
- **Dificultad:** media

### 8. 🛰️ Tránsito de Exoplaneta
Planeta orbitando una estrella lejana — curva de luz de tránsito.
- **Fases:** Órbita → tránsito → eclipse secundario → fase
- **Feature:** Curva de luz en tiempo real, habitabilidad, zona habitable
- **Dificultad:** baja (buena para empezar)

### 9. 🌊 Onda de choque SNR (Resto de Supernova)
Expansión de la onda de choque en el medio interestelar.
- **Fases:** Libre expansión → Sedov → snowplow → fusión con ISM
- **Feature:** Frentes de choque visibles, rayos X sincrotrón, mixing
- **Dificultad:** media

### 10. 🌑 Fusión de Agujeros Negros Binarios
Inspiral + merger + ringdown con ondas gravitacionales.
- **Fases:** Inspiral → plunge → merger → ringdown
- **Feature:** Onda gravitacional en espacio-tiempo deformado, GW chirp
- **Dificultad:** muy alta

### 11. 🔪 Capas internas de cuerpos (rebanadas en tiempo real)
Botón que revela cortes transversales de Tierra/Luna/Sol mostrando sus capas
(corteza/manto/núcleo, regolito, fotosfera/radiación/convulsión) — "slices" 3D
tipo anatomical view. Ideal para las vistas de cuerpo individual (ExplorerLayout).

---

## Iluminación y rotación de los cuerpos individuales (decisión 04-ago)

- **Sin sombras duras**: la luz principal sigue a la cámara (`luz.position.copy(camera.position)`)
  en Vuelo Libre y Luna — el cuerpo se ve siempre detallado desde cualquier ángulo.
- **Relleno desde la cámara**: `createBase` tiene `relleno` (PointLight que el main posiciona
  en la cámara) para que la rotación también muestre la cara visible iluminada.
- **Rotación OFF por defecto** en los cuerpos individuales; botón `⟳ Girar (ON/OFF)` en la
  barra de controles (el tiempo avanza solo si está activa).

---

## Roadmap técnico

### Corto plazo
- [ ] Unificar controles de velocidad entre animaciones (constante `SPEED_PRESETS`)
- [ ] Extraer lógica compartida de pulsares a módulos sin duplicación
- [ ] Integrar `public/js/pulsar-vela.html` al sistema Astro (como página `.astro`)
- [ ] Thumbnails reales con screenshots de las escenas 3D

### Medio plazo
- [ ] Migrar todas las animaciones a usar el componente `Canvas3D.astro`
- [ ] Bundle Three.js via Vite en vez de CDN
- [ ] Sistema de fases/timeline genérico reutilizable entre animaciones
- [ ] i18n (ES/EN) — al menos textos educativos
- [ ] PWA + offline support

### Largo plazo
- [ ] Soporte para VR/WebXR
- [ ] Side-by-side comparison entre fenómenos
- [ ] Exportar animación como video (WebCodecs / canvas.captureStream)
- [ ] Tests visuales con Puppeteer/Playwright
- [ ] Dashboard de analíticas de uso (qué fases visita más la gente)

---

## Cómo contribuir / agregar una animación

Usa el generador:

```bash
npm run generate
```

Sigue la estructura existente:
1. Define fases en `public/js/<id>/phases-<id>.js`
2. Crea el entry point `main-<id>.js`
3. Agrega entrada en `src/data/animations.ts`
4. Crea página en `src/pages/animaciones/<id>.astro`

Si es un pulsar:

```bash
npm run generate -- pulsar
```

---

## Build & Deploy

```bash
npm run build          # → dist/
npm run deploy         # deploy a GitHub Pages
```

El `base` está configurado como `/astro-animations/` (GitHub Pages compat).

---

## 🧠 Lecciones aprendidas (sesiones 04–05 ago) — ¡LEER ANTES DE TOCAR SHADERS/POST!

Trampas reales que costaron horas. Se documentan para no repetirlas.

### 1. `onBeforeCompile` + `#include <chunk>`: no reemplaces la línea interna del chunk

**Síntoma:** editabas `shader.fragmentShader.replace('roughnessFactor *= texelRoughness.g;', ...)` y daba `false` (no encontraba la string). La página no cambiaba nada → parecía "código muerto".

**Causa:** en three.js, `material.onBeforeCompile` recibe el shader **antes** de que se expandan los
`#include <nombre_chunk>`. Esas líneas internas viven DENTRO del chunk
(`roughnessmap_fragment`, `meshphysical_fragment`, etc.) y en ese momento el shader aún tiene el texto
literal `#include <roughnessmap_fragment>`. Por eso la string interna nunca existe ahí.

**Fix correcto:** reemplazar el **include completo** por el código inline:

```js
shader.fragmentShader = shader.fragmentShader.replace(
  '#include <roughnessmap_fragment>',
  `float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor = 0.25 + 0.10 * texelRoughness.g;
#endif`
);
```

**Diagnóstico:** `console.log(shader.fragmentShader.includes('...'))` dentro del `onBeforeCompile` es la
forma rápida de saber si el replace encontró su objetivo. El default de
`material.customProgramCacheKey()` (`onBeforeCompile.toString()`) ya diferencia shaders: **no**
sobreescribirlo a un string fijo si dos materiales tienen `onBeforeCompile` distintos (el caché de
programas los confundiría).

Keywords: `onBeforeCompile`, `customProgramCacheKey`, `#include`, roughness map, specular.

### 2. EffectComposer + UnrealBloomPass cuestan ~9 renders fullscreen por frame

**Síntoma:** gpu de la Tierra 28–44% vs 13–18% en el ejemplo oficial `webgpu_tsl_earth.html`.

**Causa:** el ejemplo oficial hace `renderer.render(scene, camera)` **directo**, sin composer. Nosotros
creábamos `EffectComposer` + `UnrealBloomPass` SIEMPRE, y el pass ejecutaba su cadena de blur completa
(4 downsamples + 4 upsamples + composite ≈ 9 renders de pantalla completa) **aunque `bloomStrength`
fuera 0.0**. Ese es el 90% del delta de GPU.

**Fix aplicado (setup.js):** el composer (y por tanto el bloom) solo se crea si `bloomStrength > 0`:

```js
const composer = bloomStrength > 0 ? new EffectComposer(renderer) : null;
bloom = composer ? new UnrealBloomPass(...) : null;
```

Y el loop usa `composer ? composer.render() : renderer.render(scene, camera)`.

**Conclusión de diseño:** si una escena no necesita post, no metas composer. Se ahorra un 15–25% de GPU.

### 3. El rendimiento del ejemplo TSL Earth viene de la simplicidad

`webgpu_tsl_earth.html` (three.js examples): `renderer.render` directo, 1 `DirectionalLight(0xffffff, 2)`,
sin shadow maps, sin fog costoso, `setPixelRatio(devicePixelRatio)`. Todo el "wow" es el shader TSL
(remap de roughness `0.25→0.35`, canal G del mapa `earth_bump_roughness_clouds_4096.jpg`, nubes desde
el canal B con `smoothstep(0.2, 1)`).

Moraleja: replicar su **pipeline** (render directo) no su estética exacta; la estética puede salir del
shader sin pagar post-procesado.

### 4. Tambien visual: el "destello intenso solo en el mar" era despliegue

El specular del mar (roughness baja 0.25) brilla más que la tierra (0.35) — normal en PBR. Pero el
**bloom** lo convertía en un punto cegador si el threshold dejaba pasar solo el mar. Al bajar el bloom,
el specular se ve difuso y también aparece en tierra firme, como el ejemplo. Confirmamos además que el
canal G del `2k_earth_bump_roughness_clouds.webp` es idéntico al jpg oficial (histogramas con `magick`).

### 5. LOD de texturas + nubes en paralelo (`crearLODTierra`)

`crearLODTierra(materiales, niveles)` intercambia texturas en lockstep sin `dispose` (las deja en cache
para el zoom repetido). Cada entrada del array `materiales` es `{ prop | set | uniform }` y cada nivel
tiene urls paralelas. Se le añadió el slot `{ material: nubes, uniform: "uClouds" }` para que el día,
la noche y las nubes cambien de resolución (8K, 4K, 2K) juntos según distancia. La nube `4k_earth_clouds`
se generó desde la 8K con `magick ... -resize 4096x2048 -quality 85`.

### 6. Panel de opciones: posicionar con `getBoundingClientRect`, nunca con distancias mágicas

Módulo compartido `public/js/shared/panel-opciones.js` → `initPanelOpciones()`:
- Lee el `getBoundingClientRect()` del `<summary>` en cada `toggle` y `resize`.
- Clampa el panel a la ventana (`margen=12`) para que **nunca** se corte por la izquierda o derecha
  (PC y móvil). Bottom = `innerHeight - top del summary + margen`, maxHeight = `top - margen`.
- Clic en la barra de controles cierra cualquier `details[open]` (fallback táctil).

Lección: `position: fixed` con offsets absolutos se rompe en móvil (viewport ≠ ventana visible); la
geometría real del botón ancla es la única robusta.

### 7. Móvil: apilar widgets con flex column, no con `bottom: Nrem` mágicos

El hueco entre los widgets y la barra de opciones venía de `bottom: 10.5rem` fijo (altura real de la
barra ≠ estimada). Fix: `.app-overlay` es `display:flex; flex-direction:column`, `.widgets-grid` es
`flex:1` y los widgets del bloque inferior usan `margin-top:auto` → quedan pegados a `.controls` sin
hueco y adaptan su altura real (timeline, wrap, etc.). Botón 👁 en `top-bar` (`widgets-hidden` sobre
`.widgets-grid`) para modo "solo título + controles".

### 8. Debug rápido en este repo (CDN + dev server)

- Los shaders NO se generan de `public/` sino del **three.module.js de unpkg** (r160 en importmap). Si
  dudas de una string: `curl -s https://unpkg.com/three@0.160.0/build/three.module.js | grep '...'`.
- Siempre `Ctrl+Shift+R` (hard reload) al iterar shaders; `Ctrl+Shift+F` en devtools es *buscar*, no
  recargar. El dev server de Astro sirve `public/` con `Cache-Control: no-cache`.
- `node --check archivo.js` valida sintaxis sin importar `three`.
- `.gitignore` no cubre `dist/` porque el deploy de GitHub Pages usa `gh-pages` desde `dist/`.
