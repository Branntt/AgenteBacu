// Sistema de estrés: convierte la carga real de la app (ideas, clientes, plata, universidad)
// en puntos. Los hábitos cumplidos hoy restan. Todo se calcula al vuelo, nada se guarda.
import { hoyStr, lunesDe, sumarDias, fstr } from './idea.js';
import { HORARIO_CLASES, METAS_EQUIPO_SEED } from '../data/constants.js';
import { loadValue, persistValue } from './storage.js';

// Cuánto pesa mentalmente una idea según en qué módulo está
const PESO_IDEA = {
  prospecto: 1, desarrollo: 2, lista: 2,
  grabar: 4, produccion: 4,
  edicion: 5, entrega: 4, por_pagar: 3
};
const PESO_CLIENTE = {
  prospecto: 1, conversacion: 3, grabacion: 4,
  proyecto_edicion: 5, confirmar_entrega: 4, por_pagar: 5
};

const PESO_VENCIDA = 8;          // una fecha que ya pasó es lo que más pesa
const PESO_ALTA_SIN_FECHA = 4;   // prioridad alta sin agendar
const PESO_TAREA = 3;
const PESO_TAREA_VENCIDA = 6;
const PESO_CLASE = 2;
const ALIVIO_HABITO = 5;         // cada hábito cumplido hoy resta esto
const TOPE = 150;                // puntos que equivalen al 100% del medidor

const ESTADOS_IDEA_CERRADOS = ['descartada', 'ya_pago', 'publicada'];
const ESTADOS_CLIENTE_CERRADOS = ['descartado', 'ya_pagos', 'entregado'];

// Nombres legibles de cada módulo (para no mostrar claves crudas como "por_pagar")
const LABEL_MODULO = {
  prospecto: 'Prospecto',
  desarrollo: 'En desarrollo', lista: 'En desarrollo',
  conversacion: 'En conversación',
  grabar: 'Grabación', produccion: 'Grabación', grabacion: 'Grabación',
  edicion: 'Proyecto por editar', proyecto_edicion: 'Proyecto por editar',
  entrega: 'Por confirmar entrega', confirmar_entrega: 'Por confirmar entrega',
  por_pagar: 'Por pagar'
};
const nombreModulo = estado => LABEL_MODULO[estado] || estado || 'sin módulo';

export function clasificarIdea(idea, hoy) {
  const base = PESO_IDEA[idea.estado] != null ? PESO_IDEA[idea.estado] : 2;
  const fechas = [idea.fechaRodaje, idea.fecha].filter(Boolean);
  const vencida = fechas.some(f => f < hoy);
  const altaSinFecha = idea.prioridad === 'Alta' && !idea.fecha && !idea.fechaRodaje;

  let puntos = base;
  const motivos = [];
  if (vencida) { puntos += PESO_VENCIDA; motivos.push('fecha vencida'); }
  if (altaSinFecha) { puntos += PESO_ALTA_SIN_FECHA; motivos.push('prioridad alta sin fecha'); }

  const nivel = puntos >= 9 ? 'pesada' : (puntos >= 4 ? 'media' : 'ligera');
  return { puntos, nivel, vencida, motivos };
}

function clasesEstaSemana() {
  const inicio = lunesDe(hoyStr());
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const fs = sumarDias(inicio, i);
    if (fs < HORARIO_CLASES.inicio || fs > HORARIO_CLASES.fin) continue;
    const [a, m, d] = fs.split('-').map(Number);
    const dow = new Date(a, m - 1, d).getDay();
    const diaISO = dow === 0 ? 7 : dow;
    n += HORARIO_CLASES.clases.filter(c => c.dia === diaISO).length;
  }
  return n;
}

export function calcularEstres(state) {
  const hoy = hoyStr();
  const fuentes = [];
  const items = [];

  // ---- Ideas ----
  const ideas = (state.ideas || []).filter(i => !ESTADOS_IDEA_CERRADOS.includes(i.estado));
  const ideasClasificadas = ideas.map(i => ({ idea: i, ...clasificarIdea(i, hoy) }));
  const puntosIdeas = ideasClasificadas.reduce((s, x) => s + x.puntos, 0);
  const vencidasIdeas = ideasClasificadas.filter(x => x.vencida).length;
  if (ideas.length) {
    fuentes.push({
      clave: 'ideas', label: 'Ideas y producción', emoji: '🎬', puntos: puntosIdeas, view: 'clientes', vista: 'marcas',
      detalle: `${ideas.length} activa${ideas.length === 1 ? '' : 's'}${vencidasIdeas ? ` · ${vencidasIdeas} vencida${vencidasIdeas === 1 ? '' : 's'}` : ''}`
    });
  }
  ideasClasificadas.forEach(x => items.push({
    titulo: x.idea.titulo || 'Idea sin título',
    puntos: x.puntos,
    motivo: x.motivos.length ? x.motivos.join(' · ') : 'en ' + nombreModulo(x.idea.estado),
    view: 'clientes', vista: 'marcas'
  }));

  // ---- Clientes ----
  const clientes = (state.clientes || []).filter(c => !ESTADOS_CLIENTE_CERRADOS.includes(c.estado));
  let puntosClientes = 0;
  clientes.forEach(c => {
    let p = PESO_CLIENTE[c.estado] != null ? PESO_CLIENTE[c.estado] : 2;
    const motivos = [];
    if (c.fecha_grabacion && c.fecha_grabacion < hoy) { p += PESO_VENCIDA; motivos.push('grabación vencida'); }
    puntosClientes += p;
    items.push({
      titulo: c.nombre || 'Cliente sin nombre',
      puntos: p,
      motivo: motivos.length ? motivos.join(' · ') : 'en ' + nombreModulo(c.estado),
      view: 'clientes', vista: 'externos'
    });
  });
  if (clientes.length) {
    fuentes.push({
      clave: 'clientes', label: 'Clientes', emoji: '👥', puntos: puntosClientes, view: 'clientes', vista: 'externos',
      detalle: `${clientes.length} en proceso`
    });
  }

  // ---- Dinero ----
  const deudas = state.deudas || [];
  const deudasDebo = deudas.filter(d => d.direccion === 'debo' && !d.pagada);
  const debes = deudasDebo.reduce((s, d) => s + (Number(d.monto) || 0), 0);
  const porCobrar = (state.clientes || []).filter(c => c.estado === 'por_pagar').reduce((s, c) => s + (Number(c.precio) || 0), 0);
  const puntosDebesBase = Math.min(25, Math.round(debes / 40000));
  // Una deuda con fecha límite vencida pesa tanto como cualquier otra fecha
  // vencida en el sistema (PESO_VENCIDA) — antes solo pesaba por el monto,
  // sin importar si llevaba 3 semanas atrasada o vencía mañana.
  const deudasVencidas = deudasDebo.filter(d => d.fecha_limite && d.fecha_limite < hoy);
  const puntosDebesAtraso = deudasVencidas.length * PESO_VENCIDA;
  const puntosDebes = puntosDebesBase + puntosDebesAtraso;
  const puntosCobrar = Math.min(15, Math.round(porCobrar / 60000));
  const puntosDinero = puntosDebes + puntosCobrar;
  if (puntosDinero > 0) {
    const partes = [];
    if (puntosDebes) partes.push('debes $' + debes.toLocaleString('es-CO') + (deudasVencidas.length ? ` · ${deudasVencidas.length} atrasada${deudasVencidas.length === 1 ? '' : 's'}` : ''));
    if (puntosCobrar) partes.push('te deben $' + porCobrar.toLocaleString('es-CO'));
    fuentes.push({ clave: 'dinero', label: 'Dinero', emoji: '💰', puntos: puntosDinero, view: 'financiamiento', detalle: partes.join(' · ') });
    // Cada deuda atrasada sale con su propio nombre en "lo que más pesa" — no se
    // diluye dentro del total genérico, igual que ideas/clientes/cintas vencidas.
    deudasVencidas.forEach(d => items.push({
      titulo: (d.persona || 'Deuda sin nombre') + ' — $' + (Number(d.monto) || 0).toLocaleString('es-CO'),
      puntos: PESO_VENCIDA,
      motivo: 'deuda atrasada',
      view: 'financiamiento'
    }));
    if (puntosDebesBase) items.push({ titulo: 'Deudas por pagar', puntos: puntosDebesBase, motivo: '$' + debes.toLocaleString('es-CO') + ' pendientes', view: 'financiamiento' });
    if (puntosCobrar) items.push({ titulo: 'Plata por cobrar', puntos: puntosCobrar, motivo: '$' + porCobrar.toLocaleString('es-CO') + ' sin recibir', view: 'financiamiento' });
  }

  // ---- Universidad (solo clases — las tareas ya tienen su propia fuente abajo) ----
  const nClases = clasesEstaSemana();
  const puntosUni = nClases * PESO_CLASE;
  if (puntosUni > 0) {
    fuentes.push({
      clave: 'universidad', label: 'Universidad', emoji: '🎓', puntos: puntosUni, view: 'calendario',
      detalle: `${nClases} clase${nClases === 1 ? '' : 's'} esta semana`
    });
  }

  // ---- Pared (tus cintas — antes se contaban como "Universidad" por error) ----
  const tareas = state.tareas || [];
  const tareasPend = tareas.filter(t => !t.hecha && t.fecha);
  const tareasVencidas = tareasPend.filter(t => t.fecha < hoy);
  const puntosPared = (tareasPend.length - tareasVencidas.length) * PESO_TAREA
    + tareasVencidas.length * PESO_TAREA_VENCIDA;
  if (puntosPared > 0) {
    fuentes.push({
      clave: 'pared', label: 'Pared', emoji: '📌', puntos: puntosPared, view: 'pared',
      detalle: `${tareasPend.length} cinta${tareasPend.length === 1 ? '' : 's'} con fecha${tareasVencidas.length ? ` · ${tareasVencidas.length} atrasada${tareasVencidas.length === 1 ? '' : 's'}` : ''}`
    });
  }
  tareasPend.forEach(t => items.push({
    titulo: t.texto || 'Cinta sin nombre',
    puntos: t.fecha < hoy ? PESO_TAREA_VENCIDA : PESO_TAREA,
    motivo: t.fecha < hoy ? 'cinta atrasada' : 'cinta para el ' + t.fecha.slice(8) + '/' + t.fecha.slice(5, 7),
    view: 'pared'
  }));

  // ---- Hábitos: alivian ----
  const habitos = (state.metasPersonales || []).filter(m => m.categoria === 'habito');
  const habitosHoy = habitos.filter(h => h.fecha === hoy);
  const alivio = habitosHoy.length * ALIVIO_HABITO;

  const bruto = fuentes.reduce((s, f) => s + f.puntos, 0);
  const neto = Math.max(0, bruto - alivio);
  const pct = Math.min(100, Math.round((neto / TOPE) * 100));

  let nivel, color;
  if (pct <= 25) { nivel = 'En calma'; color = 'var(--verde)'; }
  else if (pct <= 50) { nivel = 'Manejable'; color = '#2E55E0'; }
  else if (pct <= 75) { nivel = 'Con tensión'; color = '#E8641B'; }
  else { nivel = 'Sobrecargado'; color = 'var(--rojo)'; }

  // ---- Gamificación: puntos, nivel, racha ----
  const stats = calcularStatsGamificacion(habitos, hoy);

  return {
    bruto, alivio, neto, pct, nivel, color,
    fuentes: fuentes.sort((a, b) => b.puntos - a.puntos),
    items: items.sort((a, b) => b.puntos - a.puntos),
    ideasClasificadas,
    habitos, habitosHoy: habitosHoy.length,
    maxFuente: Math.max(1, ...fuentes.map(f => f.puntos)),
    ...stats
  };
}

// ---- Saludo según la hora del día ----
export function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Buenos días ☀️';
  if (h >= 12 && h < 18) return 'Buenas tardes 🌤️';
  return 'Buenas noches 🌙';
}

// ---- Racha por hábito (calculada con localStorage) ----
// Guarda { count, lastDate } por hábito para saber cuántos días seguidos se cumplió.
export function getHabitStreak(habitId) {
  return loadValue('habito.racha.' + habitId, { count: 0, lastDate: null });
}

export function updateHabitStreak(habitId, marking, hoy) {
  const streak = getHabitStreak(habitId);
  if (marking) {
    // Calcular ayer
    const [y, m, d] = hoy.split('-').map(Number);
    const ayer = fstr(new Date(y, m - 1, d - 1));
    if (streak.lastDate === ayer) {
      streak.count += 1;
    } else if (streak.lastDate === hoy) {
      // Ya se marcó hoy, no incrementar
    } else {
      streak.count = 1;
    }
    streak.lastDate = hoy;
  } else {
    // Desmarcar: decrementar
    if (streak.lastDate === hoy) {
      streak.count = Math.max(0, streak.count - 1);
      // Restaurar lastDate a ayer si la racha sigue
      if (streak.count > 0) {
        const [y, m, d] = hoy.split('-').map(Number);
        streak.lastDate = fstr(new Date(y, m - 1, d - 1));
      } else {
        streak.lastDate = null;
      }
    }
  }
  persistValue('habito.racha.' + habitId, streak);
  return streak;
}

// Badge de racha: más días, mejor badge
export function getStreakBadge(count) {
  if (count >= 30) return '👑';
  if (count >= 14) return '💎';
  if (count >= 7) return '⚡';
  if (count >= 1) return '🔥';
  return '';
}

// Porcentaje y datos del Quick Check
export function calcularQuickCheck(habitos, hoy) {
  const total = habitos.length;
  const hechos = habitos.filter(h => h.fecha === hoy).length;
  const pct = total > 0 ? Math.round((hechos / total) * 100) : 0;
  return { total, hechos, pct };
}

export function calcularStatsGamificacion(habitos, hoy) {
  // Puntos por cada hábito completado hoy
  const puntoPorHabito = 10;
  const totalHabitos = habitos.length;
  const habitosHoy = habitos.filter(h => h.fecha === hoy);
  const xpHoy = habitosHoy.length * puntoPorHabito;

  // XP acumulado (simulado basado en histórico)
  // En un sistema real, esto vendría de una tabla de histórico
  // Por ahora, calculamos un XP estimado basado en cuántos hábitos tiene
  const xpTotal = totalHabitos * 50 + xpHoy;

  // Nivel: cada 100 XP = 1 nivel
  const puntosPorNivel = 100;
  const nivelActual = Math.floor(xpTotal / puntosPorNivel) + 1;
  const xpEnNivel = xpTotal % puntosPorNivel;
  const xpParaProximo = puntosPorNivel;
  const progreso = Math.round((xpEnNivel / xpParaProximo) * 100);

  // Racha: días consecutivos completando todos los hábitos
  // Por ahora calculamos una racha simulada
  // En un sistema real, verificaríamos el histórico día a día
  const rachaActual = habitosHoy.length === totalHabitos && totalHabitos > 0 ? 1 : 0;
  const maxRacha = Math.floor(totalHabitos / 2) + 1;

  return {
    xpHoy,
    xpTotal,
    nivelActual,
    xpEnNivel,
    xpParaProximo,
    progreso,
    rachaActual,
    maxRacha,
    totalHabitos,
    objetivosLogrados: habitosHoy.length
  };
}

// ---- Orden canónico de hábitos (según el seed) ----
// Los hábitos se muestran en el orden del día: mañana → día → noche.
// Construimos un mapa título→posición a partir del seed para ordenar los
// hábitos del usuario aunque se hayan insertado en cualquier orden.
const HABIT_ORDER = (() => {
  const seeds = METAS_EQUIPO_SEED.filter(s => s.categoria === 'habito');
  const map = {};
  seeds.forEach((s, i) => { map[s.titulo.toLowerCase()] = i; });
  return map;
})();

const HABIT_BLOCK = (() => {
  const seeds = METAS_EQUIPO_SEED.filter(s => s.categoria === 'habito');
  const map = {};
  seeds.forEach(s => { map[s.titulo.toLowerCase()] = s.bloque || 'dia'; });
  return map;
})();

export function ordenarHabitos(habitos) {
  return [...habitos].sort((a, b) => {
    const posA = HABIT_ORDER[(a.titulo || '').toLowerCase()] ?? 999;
    const posB = HABIT_ORDER[(b.titulo || '').toLowerCase()] ?? 999;
    return posA - posB;
  });
}

export function getBloqueHabito(habito) {
  return HABIT_BLOCK[(habito.titulo || '').toLowerCase()] || 'dia';
}
