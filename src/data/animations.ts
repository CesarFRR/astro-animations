export interface Animation {
  id: string;
  title: string;
  description: string;
  category: 'supernova' | 'estrella' | 'agujero-negro' | 'pulsar' | 'nebulosa' | 'sistema-solar';
  tags: string[];
  thumbnail: string;
  difficulty: 'basico' | 'intermedio' | 'avanzado';
  duration: string;
}

export const animations: Animation[] = [
  {
    id: 'supernova-pares',
    title: 'Supernova de Inestabilidad de Pares',
    description: 'Una estrella masiva colapsa cuando los rayos gamma se convierten en pares electrón-positrón, eliminando la presión de radiación que la sostenía.',
    category: 'supernova',
    tags: ['Núcleo masivo', 'Pares e⁻e⁺', 'Destrucción total'],
    thumbnail: '/thumbnails/supernova-pares.jpg',
    difficulty: 'avanzado',
    duration: '3-5 min'
  },
  {
    id: 'agujero-negro',
    title: 'Supernova que deja un Agujero Negro',
    description: 'El colapso de una estrella de más de 25 masas solares forma un agujero negro con disco de acreción y jets relativistas.',
    category: 'agujero-negro',
    tags: ['Colapso gravitatorio', 'Jets relativistas', 'Disco de acreción'],
    thumbnail: '/thumbnails/agujero-negro.jpg',
    difficulty: 'avanzado',
    duration: '4-6 min'
  },
  {
    id: 'enana-blanca',
    title: 'De Gigante Roja a Enana Blanca',
    description: 'El ciclo de vida de una estrella como el Sol, desde la fusión estable hasta la eyección de la nebulosa planetaria.',
    category: 'estrella',
    tags: ['Estrella tipo solar', 'Nebulosa planetaria', 'Secuencia principal'],
    thumbnail: '/thumbnails/enana-blanca.jpg',
    difficulty: 'basico',
    duration: '2-4 min'
  },
  {
    id: 'base-tierra-sol-luna',
    title: 'Sistema Tierra–Sol–Luna (Base)',
    description: 'Piso de entorno: Tierra con eje inclinado 23.44°, Luna en órbita inclinada 5.14° y Sol, sobre órbitas keplerianas reales. Base para las animaciones de movimientos de la Tierra.',
    category: 'sistema-solar',
    tags: ['Órbitas reales', 'Oblicuidad', 'Fases lunares'],
    thumbnail: '/thumbnails/base-tierra-sol-luna.jpg',
    difficulty: 'basico',
    duration: '∞'
  },
  {
    id: 'rotacion-tierra',
    title: 'Rotación — Día Sidéreo vs Solar',
    description: 'Una vuelta sobre el eje dura 23h 56m 04s (día sidéreo), pero el Sol tarda 3m 56s más en volver al mismo meridiano: el día solar de 24h. Dos relojes miden los cruces en vivo.',
    category: 'sistema-solar',
    tags: ['Rotación', 'Día sidéreo', 'Día solar'],
    thumbnail: '/thumbnails/rotacion-tierra.jpg',
    difficulty: 'basico',
    duration: '3-5 min'
  },
  {
    id: 'tierra-libre',
    title: 'Tierra — Vuelo Libre',
    description: 'La Tierra a solas, en alta calidad: atmósfera, nubes y rotación sidérea. Controles tipo Google Earth: orbita, desplázate con WASD y acércate hasta la superficie.',
    category: 'sistema-solar',
    tags: ['Controles Google Earth', 'Atmósfera fresnel', 'Rotación'],
    thumbnail: '/thumbnails/tierra-libre.jpg',
    difficulty: 'basico',
    duration: '∞'
  },
  {
    id: 'tierra-capas',
    title: 'Tierra — Capas Internas',
    description: 'Secciona la Tierra con un plano de corte (clipping por intersección) para revelar el núcleo interno, el núcleo externo, el manto y la corteza. Mueve el corte y activa cada capa a tu ritmo.',
    category: 'sistema-solar',
    tags: ['Núcleo interno', 'Manto', 'Corteza', 'Clipping'],
    thumbnail: '/thumbnails/tierra-capas.jpg',
    difficulty: 'basico',
    duration: '∞'
  },
  {
    id: 'sol-estudio',
    title: 'Sol — La Estrella Madre',
    description: 'El Sol a solas con su corona: la fotosfera gira en ~25 días y el halo surge del bloom. Ideal para presentar la estrella de nuestro sistema.',
    category: 'sistema-solar',
    tags: ['Fotosfera', 'Rotación 25 días', 'Corona'],
    thumbnail: '/thumbnails/sol-estudio.jpg',
    difficulty: 'basico',
    duration: '∞'
  },
  {
    id: 'luna-estudio',
    title: 'Luna — Rotación Síncrona',
    description: 'La Luna a solas: gira sobre sí misma en 27.3 días, el mismo tiempo que tarda en orbitar la Tierra. Por eso siempre vemos la misma cara.',
    category: 'sistema-solar',
    tags: ['Rotación síncrona', 'Mes sidéreo', 'Relieve'],
    thumbnail: '/thumbnails/luna-estudio.jpg',
    difficulty: 'basico',
    duration: '∞'
  },
  {
    id: 'crab-pulsar',
    title: 'Púlsar del Cangrejo (PSR B0531+21)',
    description: 'El corazón de la Nebulosa del Cangrejo, una estrella de neutrones que gira 30 veces por segundo, nacida de la supernova SN 1054.',
    category: 'pulsar',
    tags: ['Estrella de neutrones', 'Resto de supernova', 'Audio 3D sincronizado'],
    thumbnail: '/thumbnails/crab-pulsar.jpg',
    difficulty: 'intermedio',
    duration: '∞'
  },
  {
    id: 'pulsar-vela',
    title: 'Púlsar de Vela (PSR B0833-45)',
    description: 'Una estrella de neutrones girando 89 veces por segundo, emitiendo pulsos de radio y rayos gamma como un faro cósmico.',
    category: 'pulsar',
    tags: ['Estrella de neutrones', 'Rotación extrema', 'Audio 3D sincronizado'],
    thumbnail: '/thumbnails/pulsar-vela.jpg',
    difficulty: 'intermedio',
    duration: '∞'
  }
];

export const categories = [
  { id: 'todas', name: 'Todas', icon: '🌌' },
  { id: 'supernova', name: 'Supernovas', icon: '💥' },
  { id: 'estrella', name: 'Estrellas', icon: '⭐' },
  { id: 'agujero-negro', name: 'Agujeros Negros', icon: '🕳️' },
  { id: 'pulsar', name: 'Púlsares', icon: '💫' },
  { id: 'sistema-solar', name: 'Sistema Solar', icon: '🌍' },
  { id: 'nebulosa', name: 'Nebulosas', icon: '🌀' }
];
