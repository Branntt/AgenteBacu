import { escapeHtml } from '../lib/format.js';

const ESTADO_COLORS = { prospecto: 'var(--muted)', conversacion: 'var(--novena)', proyecto_edicion: 'var(--azul)', entregado: 'var(--brant)', por_pagar: 'var(--rojo)', ya_pagos: 'var(--verde)' };
const COLUMNAS = [
  ['prospecto', 'Prospectos', 'Posibles clientes'],
  ['conversacion', 'En conversación para contratación', 'En negociación'],
  ['proyecto_edicion', 'Proyecto por editar', 'En revisión antes de entregar'],
  ['entregado', 'Entregados', 'Proyectos completados'],
  ['por_pagar', 'Por pagar', 'Pendiente de cobro'],
  ['ya_pagos', 'Ya pagos', 'Historial de pagos']
];

function fmtMoney(n) {
  const v = Number(n) || 0;
  return '$' + Math.abs(v).toLocaleString('es-CO');
}

function clienteCardHtml(c, cuentasCliente) {
  const totalCliente = cuentasCliente.reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);
  return `
    <div class="cliente-card-mini" data-act="cliente-abrir" data-id="${escapeHtml(c.id)}">
      <div class="cliente-mini-nombre">${escapeHtml(c.nombre || 'Sin nombre')}</div>
      <div class="cliente-mini-proyecto">${escapeHtml(c.proyecto || 'Proyecto sin definir')}</div>
      ${c.estado === 'por_pagar' ? `<div class="cliente-mini-monto">${fmtMoney(totalCliente)}</div>` : ''}
      ${c.nota ? `<div class="cliente-mini-nota">${escapeHtml(c.nota)}</div>` : ''}
    </div>
  `;
}

export function renderClientes(state) {
  const clientes = state.clientes || [];
  const cuentasCobro = state.cuentasCobro || [];

  const statsHtml = COLUMNAS.map(([estado, label]) => `${clientes.filter(c => c.estado === estado).length} ${label.toLowerCase()}`).join(' · ');

  const colsHtml = COLUMNAS.map(([estado, titulo, sub]) => {
    const items = clientes.filter(c => c.estado === estado);
    const itemsHtml = items.length
      ? items.map(c => {
        const cuentasCliente = cuentasCobro.filter(cc => cc.cliente_id === c.id);
        return clienteCardHtml(c, cuentasCliente);
      }).join('')
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
