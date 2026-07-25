import { escapeHtml } from '../lib/format.js';

const ESTADO_LABELS = { prospecto: 'Prospecto', conversacion: 'En conversación', activo: 'Proyecto activo', entregado: 'Entregado' };

export function renderClienteDetalle(state) {
  const c = (state.clientes || []).find(x => x.id === state.clienteSelId);
  if (!c) return '';

  const id = escapeHtml(c.id);

  return `
    <div class="drawer-overlay">
      <div class="drawer-backdrop" data-act="cliente-detalle-cerrar"></div>
      <div class="drawer" role="dialog" aria-modal="true" aria-label="Cliente">
        <div class="drawer-top">
          <span class="chip">${ESTADO_LABELS[c.estado] || 'Prospecto'}</span>
          <button class="btn-close" data-act="cliente-detalle-cerrar">✕</button>
        </div>

        <div class="field">
          <label class="field-label">Nombre</label>
          <input class="title-field" data-change="cliente-nombre" data-id="${id}" value="${escapeHtml(c.nombre)}" placeholder="Nombre del cliente">
        </div>

        <div class="field">
          <label class="field-label">Proyecto / servicio</label>
          <input data-change="cliente-proyecto" data-id="${id}" value="${escapeHtml(c.proyecto)}" placeholder="Qué le vas a entregar">
        </div>

        <div class="field">
          <label class="field-label">C.C. / NIT</label>
          <input data-change="cliente-documento" data-id="${id}" value="${escapeHtml(c.documento || '')}" placeholder="Para las cuentas de cobro">
        </div>

        <div class="field">
          <label class="field-label">Fecha de grabación</label>
          <input type="date" data-change="cliente-fecha-grabacion" data-id="${id}" value="${escapeHtml(c.fecha_grabacion || '')}" min="2026-01-01" style="color-scheme:dark;">
          <span class="panel-footnote" style="margin:4px 0 0;">${c.estado === 'conversacion' ? 'En conversación: no aparece en el Calendario todavía.' : 'Aparece automáticamente en el Calendario.'}</span>
        </div>

        <div class="field">
          <label class="field-label">Siguiente paso</label>
          <textarea class="nota-field" data-change="cliente-nota" data-id="${id}" rows="3" placeholder="Siguiente paso concreto…">${escapeHtml(c.nota)}</textarea>
        </div>

        <div class="drawer-footer">
          <select data-change="cliente-estado" data-id="${id}">
            <option value="prospecto" ${c.estado === 'prospecto' ? 'selected' : ''}>Prospecto</option>
            <option value="conversacion" ${c.estado === 'conversacion' ? 'selected' : ''}>En conversación</option>
            <option value="activo" ${c.estado === 'activo' ? 'selected' : ''}>Proyecto activo</option>
            <option value="entregado" ${c.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
          </select>
          <button class="btn-ghost" data-act="cc-abrir" data-id="${id}">Cuenta de cobro</button>
          <button class="btn-delete" data-act="cliente-eliminar" data-id="${id}">Eliminar</button>
        </div>
      </div>
    </div>
  `;
}
