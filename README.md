# Astro Animations

Animaciones 3D interactivas de eventos cósmicos. Supernovas, agujeros negros, púlsares y más.

## Stack

- **Framework:** Astro (SSG)
- **Gráficos:** Three.js
- **Animaciones:** GSAP
- **Estilos:** CSS Global

## Estructura del Proyecto

```
astro-animations/
├── src/
│   ├── pages/           # Rutas y páginas
│   │   ├── index.astro  # Catálogo de animaciones
│   │   └── animations/  # Páginas de cada animación
│   ├── layouts/         # Layouts reutilizables
│   ├── components/      # Componentes (Canvas3D, HUD, etc.)
│   ├── data/            # Datos de animaciones (animations.ts)
│   ├── scripts/         # Lógica de cada animación
│   └── styles/          # Estilos globales
└── public/              # Assets estáticos
```

## Agregar una Nueva Animación

### 1. Agregar datos al catálogo

Edita `src/data/animations.ts` y agrega un nuevo objeto al array `animations`:

```typescript
{
  id: 'mi-animacion',
  title: 'Título de la Animación',
  description: 'Descripción breve del fenómeno cósmico.',
  category: 'supernova', // 'supernova' | 'estrella' | 'agujero-negro' | 'pulsar' | 'nebulosa'
  tags: ['Etiqueta 1', 'Etiqueta 2'],
  thumbnail: '/thumbnails/mi-animacion.jpg',
  difficulty: 'intermedio', // 'basico' | 'intermedio' | 'avanzado'
  duration: '3-5 min'
}
```

### 2. Crear el script de animación

Crea un archivo en `src/scripts/mi-animacion.ts`:

```typescript
import * as THREE from 'three';
import gsap from 'gsap';

export class MiAnimacion {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private timeline: gsap.core.Timeline;
  
  constructor(canvas: HTMLCanvasElement) {
    // Inicializar Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    
    this.timeline = gsap.timeline({ paused: true });
    
    this.init();
    this.createObjects();
    this.setupTimeline();
  }
  
  private init() {
    this.camera.position.z = 5;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
  }
  
  private createObjects() {
    // Crear objetos 3D aquí
  }
  
  private setupTimeline() {
    // Configurar animaciones con GSAP
    this.timeline.to(/* objeto */, {
      /* propiedades */
    }, 0); // tiempo en segundos
  }
  
  public update(progress: number) {
    // progress: 0 a 1
    this.timeline.progress(progress);
    
    // Actualizar HUD
    this.updateHUD(progress);
  }
  
  private updateHUD(progress: number) {
    const phaseTitle = document.getElementById('phase-title');
    const phaseCaption = document.getElementById('phase-caption');
    
    // Lógica para actualizar fases
    if (progress < 0.3) {
      phaseTitle && (phaseTitle.textContent = 'Fase 1');
    } else if (progress < 0.6) {
      phaseTitle && (phaseTitle.textContent = 'Fase 2');
    } else {
      phaseTitle && (phaseTitle.textContent = 'Fase 3');
    }
  }
  
  public render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  public dispose() {
    this.renderer.dispose();
  }
}
```

### 3. Conectar con el controlador

En la página de animación, el script se conecta automáticamente al `AnimationController`:

```typescript
// Obtener progreso del controlador
const progress = window.animationController.getProgress();
animation.update(progress);

// Renderizar
animation.render();
```

### 4. Opcional: Agregar fallback

Para dispositivos sin WebGL, crea una imagen estática en `public/fallback/`:

```
public/fallback/mi-animacion.jpg
```

## Comandos

```bash
# Desarrollo
npm run dev

# Compilar para producción
npm run build

# Ver build de producción
npm run preview

# Verificar tipos
npm run check
```

## Deployment

El proyecto genera archivos estáticos en `dist/`. Puedes desplegar en:

- **GitHub Pages:** Configura el action de GitHub
- **Netlify:** Conecta el repo
- **Vercel:** Importa el proyecto

Para GitHub Pages, asegúrate de que `astro.config.mjs` tenga el `base` correcto:

```javascript
export default defineConfig({
  site: 'https://tu-usuario.github.io',
  base: '/astro-animations',
  output: 'static'
});
```
