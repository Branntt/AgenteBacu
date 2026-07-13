import { escapeHtml } from '../lib/format.js';

const ESTADO_COLORS = { prospecto: 'var(--muted)', conversacion: 'var(--novena)', activo: 'var(--verde)', entregado: 'var(--brant)' };

export function renderClientes(state) {
  const clientes = state.clientes || [];
  const cards = clientes.map(c => `
    <div class="cliente-card">
      <div class="cliente-top">
        <select data-change="cliente-estado" data-id="${escapeHtml(c.id)}">
          <option value="prospecto" ${c.estado === 'prospecto' ? 'selected' : ''}>Prospecto</option>
          <option value="conversacion" ${c.estado === 'conversacion' ? 'selected' : ''}>En conversación</option>
          <option value="activo" ${c.estado === 'activo' ? 'selected' : ''}>Proyecto activo</option>
          <option value="entregado" ${c.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
        </select>
        <span class="dot" style="width:10px;height:10px;background:${ESTADO_COLORS[c.estado] || 'var(--muted)'}"></span>
      </div>
      <input class="cliente-nombre" data-change="cliente-nombre" data-id="${escapeHtml(c.id)}" value="${escapeHtml(c.nombre)}" placeholder="Nombre del cliente">
      <input class="cliente-proyecto" data-change="cliente-proyecto" data-id="${escapeHtml(c.id)}" value="${escapeHtml(c.proyecto)}" placeholder="Proyecto / servicio">
      <input class="cliente-proyecto" data-change="cliente-documento" data-id="${escapeHtml(c.id)}" value="${escapeHtml(c.documento || '')}" placeholder="C.C. / NIT (para cuentas de cobro)">
      <textarea class="cliente-nota" data-change="cliente-nota" data-id="${escapeHtml(c.id)}" rows="2" placeholder="Siguiente paso concreto…">${escapeHtml(c.nota)}</textarea>
      <div class="cliente-footer">
        <button class="btn-ghost" data-act="cc-abrir" data-id="${escapeHtml(c.id)}">Cuenta de cobro</button>
        <button class="btn-text-muted" data-act="cliente-eliminar" data-id="${escapeHtml(c.id)}">Eliminar</button>
      </div>
    </div>
  `).join('');

  return `
    <main class="clientes">
      <div class="clientes-head">
        <h2 class="serif" style="margin:0;font-size:32px;">Clientes</h2>
        <div style="display:flex;gap:10px;">
          <button class="btn-ghost" data-act="historial-abrir" ${state.cuentasCobro.length ? '' : 'disabled'}>Historial de cobros</button>
          <button class="btn-ghost" data-act="clientes-exportar" ${clientes.length ? '' : 'disabled'}>Exportar listado</button>
          <button class="btn-primary" data-act="cliente-nuevo">+ Nuevo cliente</button>
        </div>
      </div>
      <div class="vista-sub">Cada caso de estudio publicado en Bacu debería producir el siguiente nombre en esta lista.</div>
      ${clientes.length ? `<div class="clientes-grid">${cards}</div>` : `<div class="empty-state">Todavía no hay clientes.<br>El primero llega con el primer caso de estudio publicado.</div>`}
    </main>
  `;
}
