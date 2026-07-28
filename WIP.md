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

## Background estelar unificado

Actualmente hay **dos** implementaciones del cielo de fondo:

| Archivo | Usado por | Estrellas | Rango | Colores | Twinkle |
|---|---|---|---|---|---|
| `public/js/shared/background.js` | Supernova, BH, WD | 2500 | 40–140 | Temperatura simple | ❌ |
| `public/js/pulsar/starfield.js` | Crab, Vela | 5000 | 60–560 | Tipos espectrales (OBAFGKM) | ✅ individual |

El `pulsar/starfield.js` es muy superior (más estrellas, colores realistas por tipo espectral,
profundidad de campo, parpadeo individual). La tarea pendiente es:

- [ ] Reemplazar `shared/background.js` con una versión unificada basada en `pulsar/starfield.js`
- [ ] Exportar `updateTwinkle()` como parte del módulo compartido
- [ ] Asegurar que todas las animaciones (Supernova, BH, WD, pulsares) importen desde el mismo sitio

El nuevo módulo unificado debería vivir en `public/js/shared/background.js` pero con
la calidad del `pulsar/starfield.js`.

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
