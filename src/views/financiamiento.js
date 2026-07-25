import { escapeHtml } from '../lib/format.js';
import { calcularTotalFinanciamiento } from '../lib/financiamiento.js';

const FUENTES = [['bancolombia', 'Bancolombia'], ['nequi', 'Nequi'], ['efectivo', 'Efectivo'], ['otro', 'Otro']];

function fmtMoney(n) {
  const v = Number(n) || 0;
  return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('es-CO');
}

function movimientoCardHtml(m) {
  const esGasto = m.tipo === 'gasto';
  const fuenteOpts = FUENTES.map(([v, label]) => `<option value="${v}" ${m.fuente === v ? 'selected' : ''}>${label}</option>`).join('');

  return `
    <div class="movimiento-card ${esGasto ? 'gasto' : ''}">
      <div class="movimiento-top">
        <select data-change="movimiento-fuente" data-id="${escapeHtml(m.id)}">${fuenteOpts}</select>
        <select data-change="movimiento-tipo" data-id="${escapeHtml(m.id)}">
          <option value="ingreso" ${!esGasto ? 'selected' : ''}>Ingreso</option>
          <option value="gasto" ${esGasto ? 'selected' : ''}>Gasto</option>
        </select>
      </div>
      <div class="field-row-2">
        <input type="date" data-change="movimiento-fecha" data-id="${escapeHtml(m.id)}" value="${escapeHtml(m.fecha)}" min="2026-01-01" style="color-scheme:dark;">
        <input data-change="movimiento-monto" data-id="${escapeHtml(m.id)}" value="${m.monto ? String(m.monto) : ''}" inputmode="numeric" placeholder="Monto">
      </div>
      <input data-change="movimiento-nota" data-id="${escapeHtml(m.id)}" value="${escapeHtml(m.nota || '')}" placeholder="Nota (opcional) — ej. pago Bacu Creative">
      <div class="movimiento-footer">
        <span class="movimiento-monto-label ${esGasto ? 'gasto' : 'ingreso'}">${esGasto ? '−' : '+'}${fmtMoney(Math.abs(Number(m.monto) || 0))}</span>
        <button class="btn-text-muted" data-act="movimiento-eliminar" data-id="${escapeHtml(m.id)}">Eliminar</button>
      </div>
    </div>
  `;
}

export function renderFinanciamiento(state) {
  const cuentas = state.cuentasCobro || [];
  const movimientos = state.movimientosFinanciamiento || [];

  const { totalTrabajos, totalMovimientos, total } = calcularTotalFinanciamiento(cuentas, movimientos);

  const movimientosOrdenados = movimientos.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
  const tarjetasHtml = movimientosOrdenados.map(movimientoCardHtml).join('');

  return `
    <main class="financiamiento">
      <div class="financ-head">
        <h2 class="serif" style="margin:0;font-size:32px;">Financiamiento</h2>
        <button class="btn-primary" data-act="movimiento-nuevo">+ Movimiento</button>
      </div>
      <div class="vista-sub">Cálculo aproximado de tu bolsillo — no es contabilidad exacta: suma lo que facturas más lo que registres de Bancolombia, Nequi o efectivo.</div>

      <div class="financ-total-card">
        <span class="mono-label">Total acumulado</span>
        <div class="financ-total-value">${fmtMoney(total)}</div>
        <div class="financ-total-breakdown">${fmtMoney(totalTrabajos)} de ${cuentas.length} cuenta${cuentas.length === 1 ? '' : 's'} de cobro · ${fmtMoney(totalMovimientos)} de ${movimientos.length} movimiento${movimientos.length === 1 ? '' : 's'} registrado${movimientos.length === 1 ? '' : 's'}</div>
      </div>

      ${movimientos.length ? `<div class="movimientos-grid">${tarjetasHtml}</div>` : `<div class="empty-state">Todavía no registraste movimientos de Bancolombia, Nequi o efectivo.<br>Los de trabajos ya se suman solos desde tus cuentas de cobro.</div>`}
    </main>
  `;
}
