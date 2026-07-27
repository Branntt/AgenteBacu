// Sistema de estrés: convierte la carga real de la app (ideas, clientes, plata, universidad)
// en puntos. Los hábitos cumplidos hoy restan. Todo se calcula al vuelo, nada se guarda.
import { hoyStr, lunesDe, sumarDias } from './idea.js';
import { HORARIO_CLASES } from '../data/constants.js';

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
      clave: 'ideas', label: 'Ideas y producción', emoji: '🎬', puntos: puntosIdeas, view: 'guiones',
      detalle: `${ideas.length} activa${ideas.length === 1 ? '' : 's'}${vencidasIdeas ? ` · ${vencidasIdeas} vencida${vencidasIdeas === 1 ? '' : 's'}` : ''}`
    });
  }
  ideasClasificadas.forEach(x => items.push({
    titulo: x.idea.titulo || 'Idea sin título',
    puntos: x.puntos,
    motivo: x.motivos.length ? x.motivos.join(' · ') : 'en ' + nombreModulo(x.idea.estado),
    view: 'guiones'
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
      view: 'clientes'
    });
  });
  if (clientes.length) {
    fuentes.push({
      clave: 'clientes', label: 'Clientes', emoji: '👥', puntos: puntosClientes, view: 'clientes',
      detalle: `${clientes.length} en proceso`
    });
  }

  // ---- Dinero ----
  const deudas = state.deudas || [];
  const debes = deudas.filter(d => d.direccion === 'debo' && !d.pagada).reduce((s, d) => s + (Number(d.monto) || 0), 0);
  const porCobrar = (state.clientes || []).filter(c => c.estado === 'por_pagar').reduce((s, c) => s + (Number(c.precio) || 0), 0);
  const puntosDebes = Math.min(25, Math.round(debes / 40000));
  const puntosCobrar = Math.min(15, Math.round(porCobrar / 60000));
  const puntosDinero = puntosDebes + puntosCobrar;
  if (puntosDinero > 0) {
    const partes = [];
    if (puntosDebes) partes.push('debes $' + debes.toLocaleString('es-CO'));
    if (puntosCobrar) partes.push('te deben $' + porCobrar.toLocaleString('es-CO'));
    fuentes.push({ clave: 'dinero', label: 'Dinero', emoji: '💰', puntos: puntosDinero, view: 'financiamiento', detalle: partes.join(' · ') });
    if (puntosDebes) items.push({ titulo: 'Deudas por pagar', puntos: puntosDebes, motivo: '$' + debes.toLocaleString('es-CO') + ' pendientes', view: 'financiamiento' });
    if (puntosCobrar) items.push({ titulo: 'Plata por cobrar', puntos: puntosCobrar, motivo: '$' + porCobrar.toLocaleString('es-CO') + ' sin recibir', view: 'financiamiento' });
  }

  // ---- Universidad ----
  const nClases = clasesEstaSemana();
  const tareas = state.tareas || [];
  const tareasPend = tareas.filter(t => !t.hecha && t.fecha);
  const tareasVencidas = tareasPend.filter(t => t.fecha < hoy);
  const puntosUni = nClases * PESO_CLASE
    + (tareasPend.length - tareasVencidas.length) * PESO_TAREA
    + tareasVencidas.length * PESO_TAREA_VENCIDA;
  if (puntosUni > 0) {
    fuentes.push({
      clave: 'universidad', label: 'Universidad', emoji: '🎓', puntos: puntosUni, view: 'calendario',
      detalle: `${nClases} clase${nClases === 1 ? '' : 's'} esta semana${tareasPend.length ? ` · ${tareasPend.length} entrega${tareasPend.length === 1 ? '' : 's'}` : ''}`
    });
  }
  tareasPend.forEach(t => items.push({
    titulo: t.texto || 'Entrega sin nombre',
    puntos: t.fecha < hoy ? PESO_TAREA_VENCIDA : PESO_TAREA,
    motivo: t.fecha < hoy ? 'entrega vencida' : 'entrega para el ' + t.fecha.slice(8) + '/' + t.fecha.slice(5, 7),
    view: 'panorama'
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

  return {
    bruto, alivio, neto, pct, nivel, color,
    fuentes: fuentes.sort((a, b) => b.puntos - a.puntos),
    items: items.sort((a, b) => b.puntos - a.puntos),
    ideasClasificadas,
    habitos, habitosHoy: habitosHoy.length,
    maxFuente: Math.max(1, ...fuentes.map(f => f.puntos))
  };
}
