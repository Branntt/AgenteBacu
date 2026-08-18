// Categorías de gastos detectadas automáticamente
const CATEGORIA_MAP = {
  comida: ['comida', 'restaurante', 'uber eats', 'pizza', 'groceries', 'mercado', 'supermercado', 'almuerzo', 'desayuno', 'cena', 'café', 'coffee', 'food'],
  transporte: ['uber', 'taxi', 'gasolina', 'gasolinera', 'transporte', 'bus', 'metro', 'parking', 'peaje'],
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
