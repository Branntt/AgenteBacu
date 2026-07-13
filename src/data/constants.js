export const MARCAS = {
  brant: {
    nombre: 'Brant',
    handle: '@branntt._',
    rol: 'Marca personal',
    color: 'var(--brant)',
    esencia: 'No vende servicios: construye reputación. Dirección creativa, filosofía, procesos y visión. Que te sigan por cómo piensas.'
  },
  bacu: {
    nombre: 'Bacu Creative',
    handle: '@bacu_creative',
    rol: 'Estudio creativo',
    color: 'var(--verde)',
    esencia: 'Vende resultados. Cine, detalle y confianza: casos de estudio, procesos reales y trabajo terminado que atrae mejores clientes.'
  },
  novena: {
    nombre: 'Novena Crew',
    handle: '@novenacrew_',
    rol: 'Productora & comunidad',
    color: 'var(--novena)',
    esencia: 'No es una empresa: es un movimiento. Artistas, sesiones, eventos y cultura. Que la gente quiera participar, no solo consumir.'
  }
};

export const OBJETIVOS = ['Autoridad', 'Excelencia', 'Historia', 'Proceso real', 'Inspirar', 'Conversación', 'Identidad', 'Comunidad', 'Clientes', 'Impulsar artistas', 'Cultura creativa'];

export const FORMATOS = ['Reel', 'Carrusel', 'Fotografía', 'Documento', 'Historia', 'Live', 'Artículo', 'Making Of', 'Mini documental', 'Entrevista', 'Moodboard', 'Voice Over', 'Cubrimiento'];

export const PIPELINE = ['Idea', 'Validación', 'Preproducción', 'Producción', 'Edición', 'Revisión', 'Programación', 'Publicación', 'Análisis', 'Aprendizajes'];

export const ETAPA_HINTS = [
  'Captura el núcleo: ¿cuál es la historia?',
  'Pasa las cuatro preguntas antes de invertir tiempo.',
  'Preproducción: guion o escaleta, locación, lista de planos, qué necesitas grabar.',
  'Producción: graba de más solo lo que sirva a la historia. Audio limpio primero.',
  'Edición: corta al hueso. Si el gancho no está en 2 segundos, reordena.',
  'Revisión: velo en el celular, sin audio, como lo verá la gente.',
  'Programación: portada, caption con el gancho, colaboración activada si aplica.',
  'Publicado. No mires métricas las primeras 24 h.',
  'Análisis: alcance, guardados, seguidores nuevos → regístralos abajo.',
  'Aprendizajes: escribe qué repites y qué no. Eso alimenta las próximas ideas.'
];

export const PREGUNTAS = [
  '¿Vale la pena que exista dentro de cinco años?',
  '¿Fortalece la identidad de la marca o solo llena un espacio?',
  '¿Alguien la guardaría o recordaría una semana después?',
  'Si solo publicaras una vez esta semana, ¿elegirías esta pieza?'
];

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const ENFOQUE = [];

export const TEMA_MAP = { 'Cine crudo': 'cine', 'Galería clara': 'galeria' };
export const TEMA_OPTIONS = ['Cine crudo', 'Galería clara'];

// Datos fijos de quien emite las cuentas de cobro — se completan solos en cada PDF.
export const EMISOR = {
  nombre: 'Brandon S. Cárdenas García',
  rol: 'REALIZADOR AUDIOVISUAL',
  cc: 'C.C. 1.095.791.525 de Floridablanca',
  ccCorto: 'C.C. 1.095.791.525',
  nit: 'NIT — no aplica',
  direccion: ['Carrera 37 #100-23, Altos de Tajamar,', 'Portería 1, T6 · Apto 802'],
  ciudad: 'Bucaramanga',
  telefono: 'Cel. 322 310 4935',
  contacto: '@bacu_creative · brandoncardenasof@gmail.com',
  banco: 'Bancolombia',
  tipoCuenta: 'Ahorros',
  numeroCuenta: '078-251189-21',
  titular: 'Brandon S. Cárdenas G.'
};

// Cada formato de idea se agrupa en una familia de guion: mismos campos de escritura,
// porque un Reel y un Voice Over se escriben igual (gancho/cuerpo/cierre) aunque
// se produzcan distinto, mientras que una Entrevista necesita preguntas, no párrafos.
export const FAMILIAS_GUION = {
  corto: {
    label: 'Guion corto',
    descripcion: 'Gancho, cuerpo y cierre — para piezas que se ven o escuchan de un tirón.',
    formatos: ['Reel', 'Voice Over', 'Historia'],
    campos: [
      { key: 'gancho', label: 'Gancho — primeros 2 segundos', placeholder: '¿Por qué alguien deja de hacer scroll?' },
      { key: 'cuerpo', label: 'Cuerpo — el desarrollo', placeholder: 'Qué se dice, en qué orden.' },
      { key: 'cierre', label: 'Cierre — llamada a la acción', placeholder: '¿Qué queremos que haga quien lo vio?' }
    ]
  },
  slides: {
    label: 'Guion de slides',
    descripcion: 'Una idea por tarjeta, en el orden en que se deslizan.',
    formatos: ['Carrusel', 'Moodboard'],
    itemLabel: 'Slide',
    campoPrincipal: { key: 'principal', label: 'Texto de la slide', placeholder: 'Lo que dice esta tarjeta' },
    campoSecundario: { key: 'secundario', label: 'Nota visual (opcional)', placeholder: 'Referencia, imagen, color' }
  },
  preguntas: {
    label: 'Preguntas y temas',
    descripcion: 'Lista de preguntas o temas a cubrir, no un libreto cerrado.',
    formatos: ['Entrevista', 'Live'],
    itemLabel: 'Pregunta',
    campoPrincipal: { key: 'principal', label: 'Pregunta o tema', placeholder: '¿Qué le preguntamos?' },
    campoSecundario: { key: 'secundario', label: 'Contexto (opcional)', placeholder: 'Por qué importa esta pregunta' }
  },
  escaleta: {
    label: 'Escaleta narrativa',
    descripcion: 'Escena por escena, como se va a contar la historia.',
    formatos: ['Mini documental', 'Making Of'],
    itemLabel: 'Escena',
    campoPrincipal: { key: 'principal', label: 'Título de la escena', placeholder: 'Qué pasa en esta escena' },
    campoSecundario: { key: 'secundario', label: 'Qué se ve / se graba', placeholder: 'Plano, locación, sonido' }
  },
  largo: {
    label: 'Texto largo',
    descripcion: 'Título y cuerpo, como un ensayo.',
    formatos: ['Documento', 'Artículo'],
    campos: [
      { key: 'titulo', label: 'Título', placeholder: 'Título del texto' },
      { key: 'cuerpo', label: 'Cuerpo del texto', placeholder: 'El texto completo, de principio a fin.' }
    ]
  },
  shotlist: {
    label: 'Shot list',
    descripcion: 'Lista de tomas necesarias antes de grabar.',
    formatos: ['Fotografía'],
    itemLabel: 'Toma',
    campoPrincipal: { key: 'principal', label: 'Descripción de la toma', placeholder: 'Qué se fotografía' },
    campoSecundario: { key: 'secundario', label: 'Locación / referencia', placeholder: 'Dónde, con qué luz' }
  },
  cubrimiento: {
    label: 'Cubrimiento (sin guion)',
    descripcion: 'Cobertura en vivo — no se escribe, se anota qué no perderse.',
    formatos: ['Cubrimiento'],
    notas: { label: 'Qué no perderse', placeholder: 'Momentos clave a capturar: quién, qué pasa, en qué orden aproximado.' }
  }
};

export function familiaDeFormato(formato) {
  return Object.keys(FAMILIAS_GUION).find(k => FAMILIAS_GUION[k].formatos.includes(formato)) || 'corto';
}
