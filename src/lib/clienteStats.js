import { hoyStr } from './idea.js';

// Estadísticas de un cliente, al estilo de una carta de FIFA: seis atributos de 1 a 99 y un
// global. Todo sale de datos reales que ya están en la app —cuentas de cobro, ideas,
// fechas— salvo Influencia, que no se puede deducir de ninguna tabla y la pone el usuario.
//
// Los atributos son RELATIVOS a tu propia cartera: el que más te ha pagado marca el 99 y el
// resto se mide contra él. Un número absoluto no diría nada (¿500.000 es mucho?); comparado
// con tus otros clientes, sí.

const TOPE = 99;
const PISO = 1;

function escala(valor, maximo) {
  if (!maximo || maximo <= 0) return PISO;
  return Math.max(PISO, Math.min(TOPE, Math.round((valor / maximo) * TOPE)));
}

function diasEntre(desde, hasta) {
  if (!desde || !hasta) return null;
  const [a1, m1, d1] = desde.split('-').map(Number);
  const [a2, m2, d2] = hasta.split('-').map(Number);
  return Math.round((new Date(a2, m2 - 1, d2) - new Date(a1, m1 - 1, d1)) / 86400000);
}

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

// Los seis atributos + el global. `maximos` viene de toda la cartera, para que la escala sea
// comparativa (ver calcularRedClientes).
export function atributosDeCliente(datos, maximos, hoy = hoyStr()) {
  const influenciaManual = Number(datos.cliente.influencia);

  const dias = datos.ultima ? diasEntre(datos.ultima, hoy) : null;
  // Actividad: 99 recién trabajado, y va cayendo hasta el piso al año de silencio.
  const actividad = dias == null ? PISO : Math.max(PISO, Math.min(TOPE, Math.round(TOPE - (dias / 365) * (TOPE - PISO))));

  // Puntualidad: qué proporción de lo facturado ya te lo pagó. Sin facturas todavía no hay
  // nada que juzgar, así que arranca en la mitad en vez de castigar a un cliente nuevo.
  const facturado = datos.cobrado + datos.porCobrar;
  const puntualidad = datos.trabajos === 0 ? 50 : escala(datos.cobrado, facturado);

  const atributos = {
    dinero: escala(datos.cobrado, maximos.cobrado),
    volumen: escala(datos.trabajos, maximos.trabajos),
    ticket: escala(datos.ticket, maximos.ticket),
    actividad,
    puntualidad,
    // Influencia es la única que no sale de los datos: cuánto te abre puertas ese cliente.
    // Por defecto queda en la mitad, para que la carta no mienta diciendo que es 0.
    influencia: Number.isFinite(influenciaManual) ? Math.max(PISO, Math.min(TOPE, influenciaManual)) : 50
  };

  // El global pesa más lo que de verdad sostiene el negocio: la plata y que vuelva.
  const global = Math.round(
    atributos.dinero * 0.30 + atributos.volumen * 0.20 + atributos.actividad * 0.20 +
    atributos.ticket * 0.10 + atributos.puntualidad * 0.10 + atributos.influencia * 0.10
  );

  return { ...atributos, global: Math.max(PISO, Math.min(TOPE, global)) };
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
  const datos = (clientes || []).map(c => datosDeCliente(c, cuentasCobro, ideas));
  const maximos = {
    cobrado: Math.max(0, ...datos.map(d => d.cobrado)),
    trabajos: Math.max(0, ...datos.map(d => d.trabajos)),
    ticket: Math.max(0, ...datos.map(d => d.ticket))
  };
  return datos
    .map(d => ({ ...d, attrs: atributosDeCliente(d, maximos, hoy) }))
    .sort((a, b) => b.attrs.global - a.attrs.global);
}
