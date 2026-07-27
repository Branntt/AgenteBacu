import { escapeHtml } from '../lib/format.js';

// Gama de 8 colores distintos, de frío a caliente según avanza el cliente; descartado = gris
const ESTADO_COLORS = {
  prospecto: 'var(--text)',          // blanco
  conversacion: '#2E55E0',           // azul
  grabacion: '#1FB6CE',              // cian
  proyecto_edicion: '#EFC94C',       // amarillo
  confirmar_entrega: '#E8641B',      // naranja fuerte (bien distinto del amarillo)
  por_pagar: '#E0312E',              // rojo (plata pendiente)
  ya_pagos: 'var(--verde)',          // verde Bacu (cerrado)
  entregado: 'var(--verde)',         // verde Bacu (estado viejo, cae en la misma columna)
  descartado: 'var(--muted)'         // gris
};
const COLUMNAS = [
  ['prospecto', 'Prospecto', 'Posibles clientes'],
  ['conversacion', 'En conversación para desarrollo', 'En negociación'],
  ['grabacion', 'Grabación', 'Por grabar o en grabación'],
  ['proyecto_edicion', 'Proyecto por editar', 'En edición'],
  ['confirmar_entrega', 'Por confirmar entrega', 'Esperando visto bueno'],
  ['por_pagar', 'Por pagar / Por entregar', 'Pendiente de cobro'],
  ['ya_pagos', 'Ya pagos / Entregados', 'Pagados y cerrados'],
  ['descartado', 'Descartada', 'No avanzó']
];

// La columna "Ya pagos / Entregados" agrupa ambos estados (entregado es el nombre viejo)
function enColumna(c, estado) {
  if (estado === 'ya_pagos') return c.estado === 'ya_pagos' || c.estado === 'entregado';
  return c.estado === estado;
}

function fmtMoney(n) {
  const v = Number(n) || 0;
  return '$' + Math.abs(v).toLocaleString('es-CO');
}

function clienteCardHtml(c, cuentasCliente) {
  const totalCliente = cuentasCliente.reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);
  const precio = Number(c.precio) || 0;
  return `
    <div class="cliente-card-mini" data-act="cliente-abrir" data-id="${escapeHtml(c.id)}">
      <div class="cliente-mini-nombre">${escapeHtml(c.nombre || 'Sin nombre')}</div>
      <div class="cliente-mini-proyecto">${escapeHtml(c.proyecto || 'Proyecto sin definir')}</div>
      ${precio > 0 ? `<div class="cliente-mini-precio">${fmtMoney(precio)}</div>` : ''}
      ${c.estado === 'por_pagar' && totalCliente > 0 ? `<div class="cliente-mini-monto">Adeudado: ${fmtMoney(totalCliente)}</div>` : ''}
      ${c.nota ? `<div class="cliente-mini-nota">${escapeHtml(c.nota)}</div>` : ''}
    </div>
  `;
}

export function renderClientes(state) {
  const clientes = state.clientes || [];
  const cuentasCobro = state.cuentasCobro || [];

  const statsHtml = COLUMNAS.map(([estado, label]) => `${clientes.filter(c => enColumna(c, estado)).length} ${label.toLowerCase()}`).join(' · ');

  const colsHtml = COLUMNAS.map(([estado, titulo, sub]) => {
    const items = clientes.filter(c => enColumna(c, estado));
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
