---
name: Astro Animations
description: Simulaciones 3D educativas de fenómenos astrofísicos
colors:
  bg: "#020408"
  bg-raised: "#0d1520"
  border: "rgba(80, 150, 255, 0.12)"
  text: "#e6f0ff"
  text-secondary: "#8aa4c8"
  accent: "#4facfe"
  accent-red: "#e84d3d"
typography:
  display:
    fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 400
    lineHeight: 1
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  xs: "0.35rem"
  sm: "0.5rem"
  md: "0.85rem"
  lg: "1.25rem"
  xl: "1.5rem"
components:
  card-default:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "0"
  card-hover:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "0"
  filter-btn:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "0.4rem 0.85rem"
  filter-btn-active:
    backgroundColor: "rgba(79, 172, 254, 0.12)"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0.4rem 0.85rem"
  input-search:
    backgroundColor: "rgba(255, 255, 255, 0.06)"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem 0.5rem 2.5rem"
---

# Design System: Astro Animations

## Overview

**Creative North Star: "El Centro de Control"**

Una interfaz sobria y rigurosa que evoca la instrumentación de una sala de control de misión. El fondo espacial profundo y el starfield animado recuerdan que estás observando el cosmos real, no un simulador genérico. Las tarjetas del catálogo son como monitores en una consola: presentan información clara, precisa, sin adornos innecesarios.

**Key Characteristics:**

- Fondo oscuro profundo (#020408) que maximiza el contraste con el contenido
- Starfield animado con colores espectrales reales como textura ambiental
- Tarjetas sólidas sin transparencia, con bordes sutiles azulados
- Tipografía limpia de sistema, sin florituras
- Azul NASA (#4facfe) como único acento funcional
- Jerarquía visual plana: sin sombras, sin glassmorphism decorativo

## Colors

Paleta nocturna institucional. El fondo es casi negro, las tarjetas son grises azulados oscuros sólidos, y el acento azul se reserva para interacción y énfasis.

### Primary
- **Azul Control** (#4facfe): Acento principal. Usado en bordes de hover, estado activo de filtros, y el acento del logo. Nunca como color de relleno.

### Neutral
- **Fondo Espacio** (#020408): Fondo de página. Casi negro con un susurro de azul. Proporciona contraste máximo para el texto claro.
- **Superficie Elevada** (#0d1520): Fondo de tarjetas y contenedores. Sólido, sin transparencia. Gris azulado oscuro que se distingue del fondo sin competir.
- **Texto Estelar** (#e6f0ff): Color de texto primario. Blanco azulado suave.
- **Texto Secundario** (#8aa4c8): Color de texto secundario y metadatos. Gris azulado medio.

### Border & Lines
- **Borde Tenue** (rgba(80, 150, 255, 0.12)): Borde predeterminado de tarjetas, inputs y separadores. Azul muy tenue y translúcido.

### Accent Secundario
- **Rojo Alerta** (#e84d3d): Reservado para estados de error o advertencia. No usado actualmente en el catálogo.

### Named Rules
**La Regla del Azul Único.** El acento azul se usa solo en bordes interactivos y estados activos. Nunca como fondo de tarjeta, relleno decorativo o gradiente. Su rareza es lo que lo hace significativo.

**La Regla de la Superficie Sólida.** Las tarjetas y paneles tienen fondo sólido. Sin transparencia, sin blur, sin glassmorphism. La claridad informativa gana sobre la decoración.

## Typography

**Display Font:** Segoe UI (con fallback a system-ui, -apple-system, BlinkMacSystemFont, sans-serif)
**Body Font:** Segoe UI / system stack

Sin fuentes importadas ni personalizadas. La tipografía se resuelve completamente del stack del sistema operativo, garantizando carga instantánea y máxima legibilidad en cada plataforma.

### Hierarchy
- **Display** (700, 1.1rem, 1): Logo del sitio. Solo en la top bar.
- **Title** (600, 0.95rem, 1.4): Títulos de tarjetas de animación. Máximo 2 líneas con ellipsis.
- **Body** (400, 0.9rem, 1.5): Descripciones y texto de sección.
- **Label** (400, 0.78rem, 1): Metadatos de tarjetas (dificultad, categoría). También etiquetas pequeñas (0.7rem) y texto de footer (0.8rem).

### Named Rules
**La Regla del Stack del Sistema.** No se importan fuentes externas. La tipografía es la del sistema operativo del usuario. Esto asegura renderizado inmediato sin FOIT y máxima legibilidad nativa.

## Layout

El layout del catálogo es de ancho completo con contenido centrado.

- **Max-width del contenido:** 1400px
- **Grid de catálogo:** `repeat(auto-fill, minmax(300px, 1fr))` — 4 columnas en desktop, 3 en pantallas medias, 1 en móvil
- **Gap del grid:** 1.25rem (1rem en tablet, 0.85rem en móvil)
- **Top bar:** sticky, con backdrop-filter: blur(12px), altura compacta (0.75rem padding vertical)
- **Filtros:** horizontal wrap con gap 0.5rem, borde inferior separador
- **Padding principal:** 1.5rem (1rem en móvil)

## Elevation & Depth

**Sin sombras.** El sistema es plano por diseño. La profundidad se comunica mediante:
- **Tonal layering:** El fondo (#020408) vs las tarjetas (#0d1520) crean la jerarquía visual
- **Bordes sutiles:** 1px rgba(80, 150, 255, 0.12) en tarjetas y elementos interactivos
- **Respuesta hover:** Las tarjetas se elevan -2px en hover con un brillo sutil en el borde (rgba(79, 172, 254, 0.3))

### Named Rules
**La Regla Plana por Defecto.** Las superficies son planas en reposo. No hay sombras, no hay elevación ficticia. La profundidad existe solo como respuesta a interacción (hover).

## Shapes

- **Tarjetas:** Esquinas de 12px (xl). Sin bordes superiores marcados.
- **Filtros (píldoras):** Esquinas de 6px (md). Forma rectangular suave, no circular.
- **Tags:** Esquinas de 4px (sm). Minimales, casi rectangulares.
- **Input de búsqueda:** Esquinas de 8px (lg).
- **Thumbnails:** Aspect ratio 16:9, esquinas heredadas de la tarjeta (12px via overflow).

## Components

### Tarjetas de Animación
- **Forma:** Rectangular con esquinas redondeadas (12px)
- **Fondo:** #0d1520 sólido
- **Borde:** 1px rgba(80, 150, 255, 0.12)
- **Hover:** translateY(-2px), border-color rgba(79, 172, 254, 0.3), transición 0.25s
- **Thumbnail:** 16:9, gradiente (#0a1628 → #1a2a4a), icono de categoría como placeholder
- **Cuerpo:** padding 0.85rem, display flex columna con gap 0.35rem
- **Tags:** gap 0.35rem, wrap, margin-top auto para empujar al fondo

### Filtros (Botones de Categoría)
- **Forma:** Rectangular con esquinas redondeadas (6px)
- **Default:** Fondo transparente, borde 1px rgba(80, 150, 255, 0.12), texto secundario
- **Hover:** Borde rgba(79, 172, 254, 0.3), texto primario
- **Activo:** Fondo rgba(79, 172, 254, 0.12), borde #4facfe, texto primario
- **Icono:** 0.85rem, emoji de categoría

### Top Bar
- **Fondo:** rgba(5, 7, 10, 0.7) con backdrop-filter blur(12px)
- **Borde inferior:** 1px rgba(80, 150, 255, 0.12)
- **Sticky:** fija en la parte superior
- **Logo:** 1.1rem, 700 weight. La "a" de "animations" en azul acento

### Input de Búsqueda
- **Fondo:** rgba(255, 255, 255, 0.06)
- **Borde:** 1px rgba(80, 150, 255, 0.12)
- **Focus:** borde cambia a #4facfe
- **Placeholder:** color text-secondary

## Do's and Don'ts

### Do:
- **Do** usar el fondo #020408 como base — proporciona el contraste necesario para el texto claro
- **Do** mantener tarjetas sólidas sin transparencia para máxima legibilidad
- **Do** reservar el azul acento para estados interactivos (hover, active, focus)
- **Do** usar el stack de fuente del sistema para carga instantánea
- **Do** mantener el starfield como textura ambiental sutil (opacidad ≤0.7)

### Don't:
- **Don't** usar sombras en tarjetas o contenedores — la profundidad se logra con capas tonales
- **Don't** usar glassmorphism o blur decorativo en tarjetas
- **Don't** importar fuentes externas
- **Don't** usar el acento azul como fondo de elementos grandes
- **Don't** poner gradientes en el texto
- **Don't** usar ilustraciones vectoriales sketch-style
