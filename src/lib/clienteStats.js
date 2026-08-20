import { hoyStr } from './idea.js';

// La carta de un cliente, al estilo de FIFA: seis atributos de 1 a 99 y un global.
//
// Los seis los pone el usuario (ver BENEFICIOS): son formas en que ese cliente lo beneficia,
// y eso es una opinión, no un dato. Lo que sí se calcula de las tablas —cuánto te ha pagado,
// cuántos trabajos, qué falta por cobrar— se muestra aparte como hechos (ver datosDeCliente).

const TOPE = 99;
const PISO = 1;

// Datos crudos de un cliente: lo que facturó, cuánto de eso cobró, cuántos trabajos, cuándo
// fue el último, y qué ideas hay anotadas a su nombre.
export function datosDeCliente(cliente, cuentasCobro, ideas) {
  const nombre = (cliente.nombre || '').trim().toLowerCase();
  const suyas = (cuentasCobro || []).filter(cc =>
    cc.cliente_id === cliente.id || (cc.cliente_nombre || '').trim().toLowerCase() === nombre);

  const pagadas = suyas.filter(cc => cc.pagada);
  const cobrado = pagadas.reduce((s, cc) => s + (Number(cc.total) || 0), 0);
  const porCobrar = suyas.filter(cc => !cc.pagada).reduce((s, cc) => s + (Number(cc.total) || 0), 0);
  const fechas = suyas.map(cc => cc.fecha).filter(Boolean).sort();

  const suyasIdeas = (ideas || []).filter(i => (i.cliente || '').trim().toLowerCase() === nombre);

  return {
    cliente,
    facturas: suyas,
    trabajos: suyas.length,
    cobrado,
    porCobrar,
    ticket: suyas.length ? Math.round((cobrado + porCobrar) / suyas.length) : 0,
    primera: fechas[0] || null,
    ultima: fechas[fechas.length - 1] || null,
    pagadas: pagadas.length,
    ideas: suyasIdeas
  };
}

// Las seis formas en que un cliente te beneficia. No son datos calculados: es un juicio que
// solo puede hacer quien trabaja con él. Un cliente que paga poco pero te abre puertas, o uno
// que paga bien pero te desgasta, valen distinto, y eso no está en ninguna tabla.
//
// Antes cuatro de los seis se calculaban de las facturas, y tenía un problema de fondo: un
// cliente recién agregado salía con todo en 1 —el mínimo— porque todavía no le habías
// facturado nada. La carta lo mostraba como el peor cliente del mundo cuando en realidad no
// se sabía nada de él todavía. Lo cobrado y los trabajos siguen a la vista en la carta, como
// hechos; para valorarlo están estos seis.
export const BENEFICIOS = [
  ['dinero', 'DIN', '💰', 'Dinero', 'Lo que te deja en el bolsillo'],
  ['puertas', 'PUE', '🚪', 'Puertas', 'A quién te conecta, qué contactos te abre'],
  ['portafolio', 'POR', '🎨', 'Portafolio', 'Qué tan bien queda para mostrar tu trabajo'],
  ['aprendizaje', 'APR', '📚', 'Aprendizaje', 'Cuánto creces técnicamente haciéndolo'],
  ['constancia', 'CON', '🔁', 'Constancia', 'Qué tan seguido vuelve — ingreso que puedes contar'],
  ['trato', 'TRA', '😌', 'Trato', 'Qué tan fácil y tranquilo es trabajar con él']
];

const POR_DEFECTO = 50;

// Los valores viven en `cliente.beneficios`. Un cliente sin valorar arranca con los seis en
// la mitad: ni bueno ni malo, que es la verdad mientras no lo hayas trabajado.
export function atributosDeCliente(datos) {
  const guardados = datos.cliente.beneficios || {};
  const attrs = {};
  for (const [clave] of BENEFICIOS) {
    const v = Number(guardados[clave]);
    attrs[clave] = Number.isFinite(v) ? Math.max(PISO, Math.min(TOPE, Math.round(v))) : POR_DEFECTO;
  }
  // Promedio simple: las seis son formas de beneficiarte y ninguna manda sobre las otras.
  // Ponderarlas escondería una opinión mía sobre qué debería importarte más.
  const suma = BENEFICIOS.reduce((s, [clave]) => s + attrs[clave], 0);
  attrs.global = Math.max(PISO, Math.min(TOPE, Math.round(suma / BENEFICIOS.length)));
  return attrs;
}

// Rango por global, con el mismo espíritu de las cartas: pocos llegan a lo más alto.
export function rangoDeCliente(global) {
  if (global >= 85) return { nombre: 'Leyenda', emoji: '👑', color: '#EFC94C' };
  if (global >= 70) return { nombre: 'Oro', emoji: '🥇', color: '#E8A317' };
  if (global >= 50) return { nombre: 'Plata', emoji: '🥈', color: '#B9C2CC' };
  if (global >= 30) return { nombre: 'Bronce', emoji: '🥉', color: '#C87F45' };
  return { nombre: 'Nuevo', emoji: '🌱', color: '#1FAF74' };
}

// Toda la cartera de una: primero los máximos, después cada carta, ordenadas por global.
export function calcularRedClientes(clientes, cuentasCobro, ideas, hoy = hoyStr()) {
  return (clientes || [])
    .map(c => { const d = datosDeCliente(c, cuentasCobro, ideas); return { ...d, attrs: atributosDeCliente(d) }; })
    .sort((a, b) => b.attrs.global - a.attrs.global || b.cobrado - a.cobrado);
}
