# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro 4 (SSG) + Three.js + GSAP. Despliegue en GitHub Pages con `base: /astro-animations/`.

## Users

**Primario:** Público mixto — entusiastas de la astronomía, estudiantes de secundaria/universidad, y docentes que buscan material didáctico interactivo.

El usuario más exigente es un profesor universitario que necesita recursos visuales rigurosos para sus cursos. Debe sentir que esto *le sirve para la clase*, no que es un juguete.

**Contexto de uso:** Navegador sin instalación. El usuario llega desde una búsqueda, una recomendación o un enlace compartido. Decide en segundos si esto es serio o no.

## Product Purpose

Simulaciones 3D educativas de fenómenos astrofísicos. Cada animación combina visualización 3D interactiva, narrativa por fases, datos reales y audio sincronizado para explicar eventos cósmicos complejos de forma intuitiva.

## Positioning

Lo que distingue a Astro Animations de un video de YouTube o un simulador tipo Universe Sandbox:

1. **Educativo y narrativo** — fases guiadas con texto explicativo, no solo un visual bonito.
2. **Interactivo en 3D** — el usuario orbita, rota y explora la escena libremente.
3. **Astronomía real** — frecuencias, masas, distancias reales; audio auténtico de púlsares.
4. **Accesible** — funciona en cualquier navegador moderno sin instalar nada.

## Operating Context

- Navegador web moderno (escritorio principalmente, responsive en tablets/móvil).
- Sin necesidad de registro, cuenta ni backend.
- Despliegue estático en GitHub Pages.
- El catálogo (home) es la puerta de entrada: debe comunicar seriedad y valor educativo en el primer vistazo.

## Capabilities and Constraints

- **5 animaciones actuales:** Supernova de Pares, Agujero Negro, Enana Blanca, Púlsar del Cangrejo, Púlsar de Vela.
- **Todas las animaciones** comparten un layout común: canvas 3D fullscreen + HUD + panel de fases + controles.
- **Pulsares** tienen audio real sincronizado (archivos OGG).
- **Rendimiento:** limitado por GPU integrada (escenario de prueba: AMD Radeon Vega 11). Las animaciones deben correr fluidas en hardware modesto.
- **Sin backend, sin base de datos, sin registro de usuarios.**
- **Catalogo con filtros** por categoría (supernova, estrella, agujero negro, pulsar, nebulosa).
- Thumbnails actualmente son gradientes CSS (placeholder).

## Brand Commitments

- **Nombre:** "Astro Animations" — no cambiar.
- **Tono:** serio, riguroso, pero accesible y atractivo. Nada "goofy". Que un profesor lo encuentre digno de usar en clase.
- **Paleta existente:** fondo oscuro espacial (`#05070a`), azul acento (`#4facfe`), texto claro (`#e6f0ff`). Se puede evolucionar pero mantener la identidad oscura-espacial.
- **Sin claims inventados.** Los datos astronómicos deben ser reales.
- **Idioma:** español (castellano).

## Evidence on Hand

- 5 animaciones funcionales con código fuente completo.
- Audio real de púlsares (archivos OGG).
- Script de scaffolding (`npm run generate`) para crear nuevas animaciones.
- Estructura de datos de catálogo en `src/data/animations.ts`.

## Product Principles

1. **El rigor primero.** Cada animación debe estar respaldada por datos reales y física correcta, no solo por efectos visuales.
2. **Segundo = valor.** El usuario debe entender qué es esto y por qué importa en los primeros segundos.
3. **Interactividad con propósito.** El 3D no es un adorno: la capacidad de orbitar y explorar es parte de la comprensión.
4. **Accesibilidad sin fricción.** Sin registro, sin instalación, sin barreras.
5. **Crecer con intención.** Cada nueva animación añade un fenómeno astrofísico distinto, no una variación trivial.

## Accessibility & Inclusion

- Controles de pausa y velocidad en todas las animaciones.
- Textos explicativos acompañan cada fase (no solo visual).
- Sin barreras de registro o pago.
- Se prioriza el contraste (fondo oscuro + texto claro) para legibilidad.