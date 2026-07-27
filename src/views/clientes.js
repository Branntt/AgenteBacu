import { escapeHtml } from '../lib/format.js';

const ESTADO_COLORS = { prospecto: 'var(--muted)', conversacion: 'var(--novena)', proyecto_edicion: 'var(--azul)', entregado: 'var(--brant)', por_pagar: 'var(--rojo)' };
const COLUMNAS = [
  ['prospecto', 'Prospectos', 'Posibles clientes'],
  ['conversacion', 'En conversación para contratación', 'En negociación'],
  ['proyecto_edicion', 'Proyecto por editar', 'En revisión antes de entregar'],
  ['entregado', 'Entregados', 'Proyectos completados']
];

function clienteCardHtml(c) {
  return `
    <div class="cliente-card-mini" data-act="cliente-abrir" data-id="${escapeHtml(c.id)}">
      <div class="cliente-mini-nombre">${escapeHtml(c.nombre || 'Sin nombre')}</div>
      <div class="cliente-mini-proyecto">${escapeHtml(c.proyecto || 'Proyecto sin definir')}</div>
      ${c.nota ? `<div class="cliente-mini-nota">${escapeHtml(c.nota)}</div>` : ''}
    </div>
  `;
}

export function renderClientes(state) {
  const clientes = state.clientes || [];

  const statsHtml = COLUMNAS.map(([estado, label]) => `${clientes.filter(c => c.estado === estado).length} ${label.toLowerCase()}`).join(' · ');

  const colsHtml = COLUMNAS.map(([estado, titulo, sub]) => {
    const items = clientes.filter(c => c.estado === estado);
    const itemsHtml = items.length
      ? items.map(clienteCardHtml).join('')
      : `<div class="col-empty">Vacío por ahora.</div>`;
    return `
      <div class="banco-col">
        <div class="banco-col-head">
          <span><span class="dot" style="width:8px;height:8px;background:${ESTADO_COLORS[estado]};margin-right:8px;"></span>${titulo}</span>
          <span class="banco-col-count">${items.length}</span>
        </div>
        <div class="desarrollo-col-sub">${sub}</div>
        <div class="banco-col-body">${itemsHtml}</div>
      </div>
    `;
  }).join('');

  return `
    <main class="banco">
      <div class="banco-head">
        <h2 class="serif" style="margin:0;font-size:32px;">Clientes</h2>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn-ghost" data-act="historial-abrir" ${state.cuentasCobro.length ? '' : 'disabled'}>Historial de cobros</button>
          <button class="btn-ghost" data-act="clientes-exportar" ${clientes.length ? '' : 'disabled'}>Exportar listado</button>
          <button class="btn-primary" data-act="cliente-nuevo">+ Nuevo cliente</button>
        </div>
      </div>
      <div class="vista-sub">${clientes.length ? statsHtml : 'Cada caso de estudio publicado en Bacu debería producir el siguiente nombre en esta lista.'}</div>
      <div class="banco-grid">${colsHtml}</div>
    </main>
  `;
}
