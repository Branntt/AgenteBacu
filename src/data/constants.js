export const MARCAS = {
  brant: {
    nombre: 'Brant',
    handle: '@branntt._',
    rol: 'Marca personal',
    color: 'var(--naranja)',
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
    color: 'var(--rojo)',
    esencia: 'No es una empresa: es un movimiento. Artistas, sesiones, eventos y cultura. Que la gente quiera participar, no solo consumir.'
  }
};

export const OBJETIVOS = ['Autoridad', 'Excelencia', 'Historia', 'Proceso real', 'Inspirar', 'Conversación', 'Identidad', 'Comunidad', 'Clientes', 'Impulsar artistas', 'Cultura creativa'];

export const FORMATOS = ['Reel', 'Post', 'Carrusel', 'Fotografía', 'Documento', 'Historia', 'Live', 'Artículo', 'Estrategia', 'Making Of', 'Mini documental', 'Entrevista', 'Moodboard', 'Voice Over', 'Cubrimiento'];

export const PIPELINE = ['Idea', 'Validación', 'Preproducción', 'Producción', 'Edición', 'Revisión', 'Programación', 'Publicación', 'Análisis', 'Aprendizajes'];

// Conceptos rápidos para la descripción de ítems en una cuenta de cobro — atajos, el campo sigue siendo de texto libre.
export const CONCEPTOS_COBRO = [
  'Fotografía', 'Video', 'Podcast', 'Producción audiovisual', 'Dirección creativa',
  'Edición de video', 'Cubrimiento de evento', 'Sesión de fotos', 'Reel para redes',
  'Diseño gráfico', 'Motion graphics', 'Locución', 'Guionización', 'Alquiler de equipo', 'Desplazamiento'
];

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

// Las 4 reglas del sistema — más fuertes que preguntas: si una se rompe, el sistema deja de decir la verdad.
// Panel fijo en Panorama — no confundir con PREGUNTAS_VALIDACION (checklist por idea).
export const REGLAS_SISTEMA = [
  'Si no está en el sistema, no existe: toda idea, cliente o peso entra aquí el mismo día.',
  'Nada avanza de módulo sin terminar el anterior — cero saltos, cero "después lo muevo".',
  'Cada fecha vencida se responde el mismo día: se mueve, se reagenda o se descarta. Nunca se ignora.',
  'La Tabla de Finanzas es la verdad absoluta: si un número no cuadra ahí, se corrige antes de seguir.'
];

// Checklist de 4 preguntas por idea de contenido (drawer de detalle) — hay que responder Sí a
// las 4 (más tener al menos un objetivo marcado) para que la idea quede "✓ Validada" y pueda
// entrar al Calendario (ver valida() en lib/idea.js). Antes esto reutilizaba por error
// REGLAS_SISTEMA (preguntaba, por idea, si "la Tabla de Finanzas es la verdad absoluta" — no
// tenía sentido). Aplica a las 3 marcas por igual.
export const PREGUNTAS_VALIDACION = [
  '¿Sabes exactamente qué quieres que sienta o haga quien lo vea?',
  '¿Se puede grabar con lo que tienes ahora mismo, sin esperar nada?',
  '¿Es distinto a lo último que publicaste de esta marca?',
  '¿Vale la pena el tiempo que te va a tomar hacerlo?'
];

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const ENFOQUE = [];

// Categorías de "objetos personales" en Inventario (campo `tipo` en metas_personales,
// separado de `categoria` que ya distingue personal/habitación/garaje/etc). Pedidas por el
// usuario el 2026-08-01 para poder ver/cambiar cada tipo de prenda por separado, junto al
// personaje. 'otro' va al final a propósito: agrupa lo que no encaja (ej. "Mochila"), y es
// el valor por defecto para items viejos sin `tipo` asignado (ver tipoInfo en inventario.js).
export const TIPOS_PERSONAL = [
  ['camisa', '👕', 'Camisa'],
  ['pantalon', '👖', 'Pantalón'],
  ['buzo', '🧥', 'Buzo'],
  ['zapatos', '👟', 'Zapatos'],
  ['medias', '🧦', 'Medias'],
  ['gorra', '🧢', 'Gorra'],
  ['gafas', '🕶️', 'Gafas'],
  ['audifonos', '🎧', 'Audífonos'],
  ['aretes', '💎', 'Aretes'],
  ['piercing_ceja', '📌', 'Piercing de ceja'],
  ['otro', '🎒', 'Otro']
];

// Centro de Carga (2026-08-01) — tipos de energía que puede usar un objeto (metas_personales
// o equipo_produccion, ver ambas migraciones supabase-migracion-centro-carga.sql) y los
// estados posibles de carga. Ambos son arrays [valor, emoji, label] para llenar <select>s,
// mismo patrón que TIPOS_PERSONAL — extender la lista alcanza para agregar un tipo nuevo.
export const TIPOS_ENERGIA = [
  ['bateria_interna', '🔋', 'Batería interna'],
  ['bateria_extraible', '🔋', 'Batería extraíble'],
  ['np_fw50', '🔋', 'NP-FW50'],
  ['np_f', '🔋', 'NP-F'],
  ['pilas_aa', '🪫', 'Pilas AA'],
  ['pilas_aaa', '🪫', 'Pilas AAA'],
  ['corriente', '🔌', 'Corriente directa'],
  ['usb_c', '🔌', 'USB-C'],
  ['micro_usb', '🔌', 'Micro USB'],
  ['lightning', '🔌', 'Lightning']
];

export const ESTADOS_CARGA = [
  ['listo', '🟢', 'Listo para grabar'],
  ['en_carga', '🟡', 'En carga'],
  ['cargando_lento', '🟡', 'Cargando lentamente'],
  ['descargado', '🔴', 'Descargado'],
  ['sin_bateria', '⚫', 'Sin batería instalada'],
  ['requiere_pilas', '🔴', 'Requiere pilas'],
  ['mantenimiento', '⚫', 'En mantenimiento']
];

export const CATEGORIAS_META = [
  ['camara', 'Cámara'],
  ['luces', 'Luces'],
  ['edicion', 'Edición'],
  ['perifericos', 'Periféricos'],
  ['personal', 'Personal'],
  ['destreza', 'Destrezas'],
  ['logro', 'Logros']
];

// Items iniciales de "Mejora de equipo" — se insertan solos en metas_personales si no existen aún
export const METAS_EQUIPO_SEED = [
  { categoria: 'camara', titulo: 'Sony A7 IV' },
  { categoria: 'camara', titulo: 'Sony FX3' },
  { categoria: 'camara', titulo: 'Monitor' },
  { categoria: 'camara', titulo: 'Kit de limpieza' },
  { categoria: 'camara', titulo: 'Bolso audiovisual' },
  { categoria: 'camara', titulo: 'Trípode' },
  { categoria: 'camara', titulo: 'Matte box' },
  { categoria: 'camara', titulo: 'Disparador flash' },
  { categoria: 'camara', titulo: 'Difusor flash' },
  { categoria: 'luces', titulo: 'Godox ML150Bi' },
  { categoria: 'luces', titulo: 'Godox ML100R' },
  { categoria: 'luces', titulo: 'Softbox x2' },
  { categoria: 'luces', titulo: 'Trípodes de luz x2' },
  { categoria: 'luces', titulo: 'V-Mount x2' },
  { categoria: 'luces', titulo: 'Extensiones' },
  { categoria: 'edicion', titulo: 'iPhone 17 Pro Max' },
  { categoria: 'edicion', titulo: 'Tarjeta gráfica' },
  { categoria: 'edicion', titulo: 'MacBook' },
  { categoria: 'edicion', titulo: 'iPad' },
  { categoria: 'perifericos', titulo: 'Agarre Ronin' },
  { categoria: 'perifericos', titulo: 'Ronin RS5' },
  { categoria: 'perifericos', titulo: 'Gafas Meta' },
  { categoria: 'perifericos', titulo: 'Soporte stream' },
  { categoria: 'perifericos', titulo: 'PS5' },
  { categoria: 'personal', titulo: 'Estudio audiovisual' },
  { categoria: 'personal', titulo: 'Moto' },
  { categoria: 'personal', titulo: 'Incienso' },
  { categoria: 'personal', titulo: 'Almohada' },
  { categoria: 'personal', titulo: 'Pantalonetas' },
  { categoria: 'personal', titulo: 'Panel de corte' },
  { categoria: 'destreza', titulo: 'Inglés' },
  // Deseos (pestaña Metas): cosas que me compraría
  { categoria: 'deseo_vehiculo', titulo: 'Moto de mayor cilindraje' },
  { categoria: 'deseo_vehiculo', titulo: 'Carro' },
  { categoria: 'deseo_camara', titulo: 'Sony A7S III' },
  // Inventario (pestaña Inventario): items con categoria inv_* ; cumplida = equipado
  { categoria: 'inv_garaje', titulo: 'Best 125' },
  // Objetos personales (2026-08-01, a partir de fotos que pasó el usuario) — quedan como
  // cualquier otro item del inventario: editables/borrables desde la pestaña, esto solo
  // los precarga una vez.
  { categoria: 'inv_personal', titulo: 'Gorra negra', tipo: 'gorra' },
  { categoria: 'inv_personal', titulo: 'Lentes de sol', tipo: 'gafas' },
  { categoria: 'inv_personal', titulo: 'Bandana / cubrecuello' },
  { categoria: 'inv_personal', titulo: 'Mochila' },
  // Bienestar: hábitos diarios. `fecha` guarda el último día cumplido, por eso se reinician solos.
  { categoria: 'habito', titulo: 'Dormir 7 horas' },
  { categoria: 'habito', titulo: 'Moverme / entrenar' },
  { categoria: 'habito', titulo: 'Comer bien' },
  { categoria: 'habito', titulo: 'Respirar 5 minutos' },
  { categoria: 'habito', titulo: 'Salir a caminar' },
  { categoria: 'habito', titulo: 'Sin celular antes de dormir' }
];

export const COLORES_TAREA = { verde: 'var(--verde)', brant: 'var(--brant)', novena: 'var(--novena)', rojo: 'var(--rojo)', muted: 'var(--muted)' };

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
  titular: 'Brandon S. Cárdenas G.',
  nequi: '',
  daviplata: ''
};

// Cada formato de idea se agrupa en una familia de guion: mismos campos de escritura,
// porque un Reel y un Voice Over se escriben igual (gancho/cuerpo/cierre) aunque
// se produzcan distinto, mientras que una Entrevista necesita preguntas, no párrafos.
export const FAMILIAS_GUION = {
  corto: {
    label: 'Guion corto',
    descripcion: 'Gancho, cuerpo y cierre — para piezas que se ven o escuchan de un tirón.',
    formatos: ['Reel', 'Voice Over', 'Historia', 'Post'],
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
    formatos: ['Documento', 'Artículo', 'Estrategia'],
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

// Horario fijo de clases 2026-2 (UNAB), se repite cada semana dentro del rango del semestre.
// dia: 1=Lunes ... 7=Domingo, igual que el orden de DIAS_SEMANA en calendario.js.
export const HORARIO_CLASES = {
  inicio: '2026-08-03',
  fin: '2026-11-21',
  clases: [
    { dia: 2, horaInicio: '07:00', horaFin: '09:59', materia: 'Gestión Audiovisual', profesor: 'Ella Cardona Cadena', salon: 'LABCREACIO', lugar: 'Bloque N · El Jardín, UNAB' },
    { dia: 2, horaInicio: '14:00', horaFin: '15:59', materia: 'Investigación Documental', profesor: 'Camilo Arenas Villabona', salon: 'LABCREACIO', lugar: 'Bloque N · El Jardín, UNAB' },
    { dia: 2, horaInicio: '16:00', horaFin: '17:59', materia: 'Formas del Documental', profesor: 'Camilo Arenas Villabona', salon: 'N43', lugar: 'Bloque N · El Jardín, UNAB' },
    { dia: 3, horaInicio: '13:00', horaFin: '17:59', materia: 'Diseño de Proyecto de Grado en Documental', profesor: 'René Palomino Rodríguez', salon: 'N41', lugar: 'Bloque N · El Jardín, UNAB' },
    { dia: 4, horaInicio: '08:00', horaFin: '09:59', materia: 'Seminario Creativo', profesor: 'Sergio Abello Gómez', salon: 'N41', lugar: 'Bloque N · El Jardín, UNAB' }
  ]
};

// Iconos para items del inventario por tipo/categoría
export const ICONOS_ITEMS = {
  // Ropa
  camisa: '👔',
  pantalon: '👖',
  buzo: '🧥',
  zapatos: '👟',
  medias: '🧦',
  gorra: '🧢',
  gafas: '🕶️',
  audifonos: '🎧',
  aretes: '💍',
  piercing_ceja: '💎',
  otro: '📦',
  // Tecnología
  computador: '💻',
  laptop: '💻',
  telefono: '📱',
  tablet: '📱',
  monitor: '🖥️',
  teclado: '⌨️',
  raton: '🖱️',
  // Equipo Audiovisual
  camara: '📷',
  video: '📹',
  microfono: '🎤',
  tripode: '🎥',
  luz: '💡',
  bateria: '🔋',
  drone: '🚁',
  // Equipo de Producción
  sony: '📷',
  dji: '🚁',
  rode: '🎤',
  luces: '💡',
  carril: '🎬',
  // Personales
  cartera: '👛',
  mochila: '🎒',
  reloj: '⌚',
  default: '📦'
};

export function obtenerIconoItem(tipo, nombre) {
  if (!tipo) tipo = 'otro';
  return ICONOS_ITEMS[tipo] || ICONOS_ITEMS[tipo.toLowerCase()] || ICONOS_ITEMS.default;
}
