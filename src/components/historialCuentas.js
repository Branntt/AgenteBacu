import { escapeHtml } from '../lib/format.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  return '$' + v.toLocaleString('es-CO');
}

export function renderHistorialCuentas(state) {
  if (!state.historialAbierto) return '';

  const q = state.historialBusqueda.trim().toLowerCase();
  const cuentas = state.cuentasCobro
    .filter(cc => !q || cc.cliente_nombre.toLowerCase().includes(q) || cc.numero.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => b.numero.localeCompare(a.numero));

  const filasHtml = cuentas.map(cc => `
    <div class="historial-item">
      <div class="historial-item-main">
        <span class="historial-numero">N.º ${escapeHtml(cc.numero)}</span>
        <span class="historial-cliente">${escapeHtml(cc.cliente_nombre)}</span>
        <span class="historial-fecha">${escapeHtml(cc.fecha)}</span>
      </div>
      <div class="historial-item-side">
        <span class="historial-total">${fmtMoney(cc.total)}</span>
        <button class="btn-ghost" data-act="cc-historial-descargar" data-id="${escapeHtml(cc.id)}">Descargar PDF</button>
      </div>
    </div>
  `).join('');

  return `
    <div class="drawer-overlay">
      <div class="drawer-backdrop" data-act="historial-cerrar"></div>
      <div class="drawer historial-cuentas" role="dialog" aria-modal="true" aria-label="Historial de cuentas de cobro">
        <div class="drawer-top">
          <span class="chip">Historial de cuentas de cobro</span>
          <button class="btn-close" data-act="historial-cerrar">✕</button>
        </div>

        <div class="field">
          <label class="field-label">Buscar por cliente o número</label>
          <input data-change="historial-busqueda" value="${escapeHtml(state.historialBusqueda)}" placeholder="Ej. Sebastian o 202607">
        </div>

        <div class="historial-lista">
          ${cuentas.length ? filasHtml : `<div class="col-empty">${state.cuentasCobro.length ? 'Ninguna cuenta coincide con la búsqueda.' : 'Todavía no generaste ninguna cuenta de cobro.'}</div>`}
        </div>
      </div>
    </div>
  `;
}
