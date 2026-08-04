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

## Lo que hay ahora (5 animaciones)

| Animación | Tipo | Estado |
|---|---|---|
| Supernova de Inestabilidad de Pares | supernova | ✅ Completa |
| Supernova → Agujero Negro | agujero-negro | ✅ Completa |
| Gigante Roja → Enana Blanca | estrella | ✅ Completa |
| Púlsar del Cangrejo (PSR B0531+21) | pulsar | ✅ Completa |
| Púlsar de Vela (PSR B0833-45) | pulsar | ✅ Completa |

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
- **Texturas:** descargar desde Solar System Scope / NASA Visible Earth a `public/textures/` en **2K** (nunca 8K). Para conceptos con muchos overlays (5, 6, 7): textura simple 1K o color sólido — el foco es la explicación, no el render.
- **Plantillas solo como referencia visual/técnica** (iluminación de eyes-nasa, layers, astronomía de jsorrery). No copiar código minificado.

### Pendientes de esta serie

- [ ] Descargar texturas (Tierra 2K, Luna 2K, Sol 2K + textura simple) a `public/textures/`
- [ ] Crear módulo compartido `public/js/shared/orbits.js` (Kepler + VSOP simplificado + elementos de la Luna)
- [ ] Crear módulo compartido `public/js/shared/esfera-celeste.js` (líneas eclíptica/ecuador/polos para 5 y 7)
- [ ] Animación 1: rotación (sidéreo vs solar)
- [ ] Animación 2: traslación (perihelio/afelio)
- [ ] Animación 3: estaciones
- [ ] Animación 4: eclipses
- [ ] Animación 7: coordenadas ecuatoriales
- [ ] Animación 5: precesión + nutación + Chandler
- [ ] Animación 6: ciclos de Milanković

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
