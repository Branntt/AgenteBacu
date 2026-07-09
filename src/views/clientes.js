import { escapeHtml } from '../lib/format.js';

const ESTADO_COLORS = { prospecto: 'var(--muted)', conversacion: 'var(--novena)', activo: 'var(--verde)', entregado: 'var(--brant)' };

export function renderClientes(state) {
  const clientes = state.clientes || [];
  const cards = clientes.map(c => `
    <div class="cliente-card">
      <div class="cliente-top">
        <select data-change="cliente-estado" data-id="${c.id}">
          <option value="prospecto" ${c.estado === 'prospecto' ? 'selected' : ''}>Prospecto</option>
          <option value="conversacion" ${c.estado === 'conversacion' ? 'selected' : ''}>En conversación</option>
          <option value="activo" ${c.estado === 'activo' ? 'selected' : ''}>Proyecto activo</option>
          <option value="entregado" ${c.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
        </select>
        <span class="dot" style="width:10px;height:10px;background:${ESTADO_COLORS[c.estado] || 'var(--muted)'}"></span>
      </div>
      <input class="cliente-nombre" data-change="cliente-nombre" data-id="${c.id}" value="${escapeHtml(c.nombre)}" placeholder="Nombre del cliente">
      <input class="cliente-proyecto" data-change="cliente-proyecto" data-id="${c.id}" value="${escapeHtml(c.proyecto)}" placeholder="Proyecto / servicio">
      <textarea class="cliente-nota" data-change="cliente-nota" data-id="${c.id}" rows="2" placeholder="Siguiente paso concreto…">${escapeHtml(c.nota)}</textarea>
      <div class="cliente-footer">
        <button class="btn-text-muted" data-act="cliente-eliminar" data-id="${c.id}">Eliminar</button>
      </div>
    </div>
  `).join('');

  return `
    <main class="clientes">
      <div class="clientes-head">
        <h2 class="serif" style="margin:0;font-size:32px;">Clientes</h2>
        <button class="btn-primary" data-act="cliente-nuevo">+ Nuevo cliente</button>
      </div>
      <div class="vista-sub">Cada caso de estudio publicado en Bacu debería producir el siguiente nombre en esta lista.</div>
      ${clientes.length ? `<div class="clientes-grid">${cards}</div>` : `<div class="empty-state">Todavía no hay clientes.<br>El primero llega con el primer caso de estudio publicado.</div>`}
    </main>
  `;
}
