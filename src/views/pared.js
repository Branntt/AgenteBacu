import { escapeHtml } from '../lib/format.js';
import { hoyStr, sumarDias } from '../lib/idea.js';
import { COLORES_TAREA } from '../data/constants.js';

const COLUMNAS_PARED = ['Urgente', 'Hoy', 'Semana', 'Guiones', 'IA', 'METAS', 'Mejoras', 'Sin fecha'];

function cintaRealHtml(t) {
  const color = COLORES_TAREA[t.color] || COLORES_TAREA.verde;
  const colActual = t.columna || 'Sin fecha';
  const opcionesColumnas = COLUMNAS_PARED.map(col =>
    `<option value="${escapeHtml(col)}" ${col === colActual ? 'selected' : ''}>${escapeHtml(col)}</option>`
  ).join('');
  return `
    <div class="tarea-cinta ${t.hecha ? 'hecha' : ''}" style="background:${color};" draggable="true" data-id="${escapeHtml(t.id)}">
      <button class="tarea-check" data-act="tarea-toggle" data-id="${escapeHtml(t.id)}" title="${t.hecha ? 'Marcar pendiente' : 'Marcar hecha'}">${t.hecha ? '✓' : ''}</button>
      <input class="tarea-texto" data-change="tarea-texto" data-id="${escapeHtml(t.id)}" value="${escapeHtml(t.texto)}" placeholder="¿Qué hay que hacer?">
      <select class="tarea-columna" data-change="tarea-columna" data-id="${escapeHtml(t.id)}" title="Mover a columna">${opcionesColumnas}</select>
      <input type="date" class="tarea-fecha" data-change="tarea-fecha" data-id="${escapeHtml(t.id)}" value="${escapeHtml(t.fecha || '')}" min="2026-01-01" title="Fecha de entrega (aparece en el Calendario)" style="color-scheme:dark;">
      <button class="tarea-quitar" data-act="tarea-eliminar" data-id="${escapeHtml(t.id)}" title="Quitar">✕</button>
    </div>
  `;
}

function columnaHtml(nombre, items) {
  const cuerpo = items.length
    ? items.map(cintaRealHtml).join('')
    : `<div class="vista-sub" style="margin:0;">Vacío</div>`;
  return `
    <div class="pared-columna">
      <div class="pared-columna-titulo">${escapeHtml(nombre)}${items.length ? ' — ' + items.length : ''}</div>
      <div class="pared-columna-items">${cuerpo}</div>
    </div>
  `;
}

export function renderPared(state) {
  const reales = (state.tareas || []).filter(t => !t.hecha);
  const hechas = (state.tareas || []).filter(t => t.hecha);

  // Agrupar por columna
  const porColumna = {};
  COLUMNAS_PARED.forEach(col => {
    porColumna[col] = reales.filter(t => (t.columna || 'Sin fecha') === col);
  });

  const columnasHtml = COLUMNAS_PARED
    .map(col => columnaHtml(col, porColumna[col]))
    .join('');

  return `
    <main class="pared">
      <h2 class="serif" style="margin:0;font-size:32px;">Pared</h2>
      <div class="vista-sub">Tu sistema de cintas en columnas. Tócalas para marcarlas hechas.</div>

      <div class="pared-grid">
        ${columnasHtml}
      </div>

      <div class="tareas-pared" style="margin-top:28px;">
        <button class="tarea-agregar" data-act="tarea-nueva">+ Tarea</button>
      </div>

      ${hechas.length ? `
        <div class="section-title" style="margin-top:28px;opacity:0.6;">Hechas — ${hechas.length}</div>
        <div class="tareas-pared">${hechas.map(cintaRealHtml).join('')}</div>
      ` : ''}
    </main>
  `;
}
