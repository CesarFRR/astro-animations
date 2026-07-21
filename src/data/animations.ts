export interface Animation {
  id: string;
  title: string;
  description: string;
  category: 'supernova' | 'estrella' | 'agujero-negro' | 'pulsar' | 'nebulosa';
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
    id: 'pulsar',
    title: 'Púlsar y su Haz de Radiación',
    description: 'Una estrella de neutrones que gira a velocidades extremas, emitiendo pulsos regulares de radiación electromagnética.',
    category: 'pulsar',
    tags: ['Estrella de neutrones', 'Rotación rápida', 'Haz de radiación'],
    thumbnail: '/thumbnails/pulsar.jpg',
    difficulty: 'intermedio',
    duration: '2-3 min'
  },
  {
    id: 'supernova-ia',
    title: 'Supernova Tipo Ia',
    description: 'Una enana blanca en un sistema binario acumula masa hasta alcanzar el límite de Chandrasekhar y explota termonuclearmente.',
    category: 'supernova',
    tags: ['Binaria', 'Límite de Chandrasekhar', 'Candle estándar'],
    thumbnail: '/thumbnails/supernova-ia.jpg',
    difficulty: 'intermedio',
    duration: '3-4 min'
  },
  {
    id: 'supernova-ii',
    title: 'Supernova Tipo II (Colapso de Núcleo)',
    description: 'Una supergigante roja agota su combustible nuclear y su núcleo colapsa, provocando una violenta explosión.',
    category: 'supernova',
    tags: ['Supergigante roja', 'Onda de choque', 'Remanente de supernova'],
    thumbnail: '/thumbnails/supernova-ii.jpg',
    difficulty: 'intermedio',
    duration: '3-5 min'
  }
];

export const categories = [
  { id: 'todas', name: 'Todas', icon: '🌌' },
  { id: 'supernova', name: 'Supernovas', icon: '💥' },
  { id: 'estrella', name: 'Estrellas', icon: '⭐' },
  { id: 'agujero-negro', name: 'Agujeros Negros', icon: '🕳️' },
  { id: 'pulsar', name: 'Púlsares', icon: '💫' },
  { id: 'nebulosa', name: 'Nebulosas', icon: '🌀' }
];
