import { escapeHtml } from '../lib/format.js';
import { ATTRS_AUTOCOMPLETAR } from './datalistClientes.js';
import { renderCuentasDeCliente } from './cuentasDeCliente.js';

// Mismos 9 estados que COLUMNAS/ESTADO_COLORS en views/clientes.js — faltaban 3 acá
// (grabacion, confirmar_entrega, descartado), así que un cliente en esos estados mostraba el
// chip "Prospecto" por el fallback de abajo, aunque estuviera en grabación o ya descartado.
const ESTADO_LABELS = {
  prospecto: 'Prospecto',
  conversacion: 'En conversación para contratación',
  grabacion: 'Grabación',
  proyecto_edicion: 'Proyecto por editar',
  confirmar_entrega: 'Por confirmar entrega',
  por_pagar: 'Por pagar',
  ya_pagos: 'Ya pagos',
  entregado: 'Ya pagos', // alias viejo de ya_pagos
  descartado: 'Descartada',
};

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
          <input class="title-field" data-change="cliente-nombre" data-id="${id}" value="${escapeHtml(c.nombre)}" placeholder="Nombre del cliente" ${ATTRS_AUTOCOMPLETAR}>
        </div>

        ${renderCuentasDeCliente(state, c)}

        <div class="field">
          <label class="field-label">Proyecto / servicio</label>
          <input data-change="cliente-proyecto" data-id="${id}" value="${escapeHtml(c.proyecto)}" placeholder="Qué le vas a entregar">
        </div>

        <div class="field">
          <label class="field-label">Precio</label>
          <input data-change="cliente-precio" data-id="${id}" value="${c.precio ? String(c.precio) : ''}" inputmode="numeric" placeholder="Monto que cuesta el proyecto">
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
            <option value="conversacion" ${c.estado === 'conversacion' ? 'selected' : ''}>En conversación para contratación</option>
            <option value="grabacion" ${c.estado === 'grabacion' ? 'selected' : ''}>Grabación</option>
            <option value="proyecto_edicion" ${c.estado === 'proyecto_edicion' ? 'selected' : ''}>Proyecto por editar</option>
            <option value="confirmar_entrega" ${c.estado === 'confirmar_entrega' ? 'selected' : ''}>Por confirmar entrega</option>
            <option value="por_pagar" ${c.estado === 'por_pagar' ? 'selected' : ''}>Por pagar / Por entregar</option>
            <option value="ya_pagos" ${c.estado === 'ya_pagos' || c.estado === 'entregado' ? 'selected' : ''}>Ya pagos / Entregados</option>
            <option value="descartado" ${c.estado === 'descartado' ? 'selected' : ''}>Descartada</option>
          </select>
          <button class="btn-delete" data-act="cliente-eliminar" data-id="${id}">Eliminar</button>
        </div>
      </div>
    </div>
  `;
}
