// Categorías de gastos detectadas automáticamente. 'arriendo', 'servicios' y 'telefono' se
// agregaron porque antes NO existían: un gasto de arriendo caía siempre en "otros" y era
// imposible ver cuánto de la plata mensual estaba comprometida en lo fijo — justo lo que hacía
// falta para poder responder "esta plata para qué es".
const CATEGORIA_MAP = {
  arriendo: ['arriendo', 'renta', 'alquiler', 'canon de arrendamiento', 'canon arriendo'],
  servicios: ['luz', 'electricidad', 'acueducto', 'alcantarillado', 'internet', 'wifi', 'gas natural', 'servicio público', 'servicios públicos', 'factura de servicios'],
  telefono: ['claro', 'movistar', 'tigo', 'recarga', 'plan de datos', 'celular', 'teléfono', 'telefono'],
  comida: ['comida', 'restaurante', 'uber eats', 'rappi', 'pizza', 'groceries', 'mercado', 'supermercado', 'almuerzo', 'desayuno', 'cena', 'café', 'coffee', 'food'],
  transporte: ['uber', 'didi', 'taxi', 'gasolina', 'gasolinera', 'transporte', 'bus', 'metro', 'parking', 'peaje'],
  entretenimiento: ['cine', 'netflix', 'spotify', 'disney', 'juego', 'game', 'concierto', 'beer', 'cerveza', 'bar', 'club'],
  suscripciones: ['netflix', 'spotify', 'claude', 'github', 'figma', 'adobe', 'capcut', 'lightroom', 'apple', 'google play', 'gym'],
  salud: ['farmacia', 'doctor', 'hospital', 'dentista', 'gym', 'yoga', 'medicinas'],
  ropa: ['zara', 'h&m', 'nike', 'adidas', 'ropa', 'zapatos', 'clothes'],
  tecnología: ['apple', 'amazon', 'best buy', 'pc', 'phone', 'laptop', 'monitor', 'teclado'],
  otros: []
};

export function detectarCategoria(descripcion) {
  if (!descripcion) return 'otros';
  const desc = descripcion.toLowerCase();

  for (const [categoria, palabras] of Object.entries(CATEGORIA_MAP)) {
    if (palabras.some(p => desc.includes(p))) {
      return categoria;
    }
  }

  return 'otros';
}

export function obtenerEmoji(categoria) {
  const emojis = {
    arriendo: '🏠',
    servicios: '💡',
    telefono: '📱',
    comida: '🍽️',
    transporte: '🚗',
    entretenimiento: '🎬',
    suscripciones: '📱',
    salud: '⚕️',
    ropa: '👕',
    tecnología: '💻',
    otros: '📦'
  };
  return emojis[categoria] || '📦';
}

// Bolsillo del presupuesto (ver state.presupuesto / simuladorPresupuesto.js) al que pertenece
// cada categoría de transacción — es lo que permite comparar "lo que me propuse gastar en
// arriendo" contra "lo que de verdad llevo gastado en arriendo este mes" en la pestaña
// Presupuesto. Las categorías sin rubro propio (ropa, tecnología, otros) caen en 'personales',
// el cajón discrecional del presupuesto.
const RUBRO_PRESUPUESTO_POR_CATEGORIA = {
  arriendo: 'arriendo',
  servicios: 'servicios',
  telefono: 'telefono',
  comida: 'comida',
  transporte: 'transporte',
  entretenimiento: 'entretenimiento',
  suscripciones: 'entretenimiento',
  salud: 'salud',
  ropa: 'personales',
  tecnología: 'personales',
  otros: 'personales'
};

export function rubroPresupuestoDeCategoria(categoria) {
  return RUBRO_PRESUPUESTO_POR_CATEGORIA[categoria] || 'personales';
}

export function agruparPorCategoria(transacciones) {
  const resultado = {};

  transacciones.forEach(t => {
    if (!resultado[t.categoria]) {
      resultado[t.categoria] = { total: 0, count: 0, items: [] };
    }
    resultado[t.categoria].total += t.monto;
    resultado[t.categoria].count += 1;
    resultado[t.categoria].items.push(t);
  });

  return resultado;
}

export function calcularResumen(transacciones) {
  const ingresos = transacciones
    .filter(t => t.tipo === 'ingreso')
    .reduce((sum, t) => sum + t.monto, 0);

  const gastos = transacciones
    .filter(t => t.tipo === 'gasto')
    .reduce((sum, t) => sum + t.monto, 0);

  return {
    ingresos,
    gastos,
    neto: ingresos - gastos
  };
}
