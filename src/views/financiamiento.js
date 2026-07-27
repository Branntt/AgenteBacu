import { escapeHtml } from '../lib/format.js';
import { calcularFinanciamiento, calcularFacturado } from '../lib/financiamiento.js';
import { renderSimuladorPresupuesto } from '../components/simuladorPresupuesto.js';

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

function pagoMensualCardHtml(p) {
  return `
    <div class="pago-card">
      <input class="pago-nombre" data-change="pago-mensual-nombre" data-id="${escapeHtml(p.id)}" value="${escapeHtml(p.nombre)}" placeholder="Nombre (ej. Spotify)">
      <div class="field-row-2">
        <input data-change="pago-mensual-monto" data-id="${escapeHtml(p.id)}" value="${p.monto ? String(p.monto) : ''}" inputmode="numeric" placeholder="Monto">
        <input data-change="pago-mensual-dia" data-id="${escapeHtml(p.id)}" value="${p.dia_pago || ''}" inputmode="numeric" placeholder="Día del mes">
      </div>
      <div class="pago-footer">
        <span class="pago-monto-label">${fmtMoney(p.monto)} · ${p.dia_pago ? 'día ' + p.dia_pago : 'día sin definir'}</span>
        <button class="btn-text-muted" data-act="pago-mensual-eliminar" data-id="${escapeHtml(p.id)}">✕</button>
      </div>
    </div>
  `;
}

function deudaCardHtml(d) {
  return `
    <div class="deuda-card ${d.pagada ? 'pagada' : ''}">
      <input class="deuda-persona" data-change="deuda-persona" data-id="${escapeHtml(d.id)}" value="${escapeHtml(d.persona)}" placeholder="¿Quién?">
      <div class="field-row-2">
        <input data-change="deuda-monto" data-id="${escapeHtml(d.id)}" value="${d.monto ? String(d.monto) : ''}" inputmode="numeric" placeholder="Monto">
        <input data-change="deuda-nota" data-id="${escapeHtml(d.id)}" value="${escapeHtml(d.nota || '')}" placeholder="Nota (opcional)">
      </div>
      <div class="deuda-footer">
        <button class="btn-text-muted" data-act="deuda-toggle" data-id="${escapeHtml(d.id)}">${d.pagada ? '✓ Resuelta' : 'Marcar resuelta'}</button>
        <span class="deuda-monto-label">${fmtMoney(d.monto)}</span>
        <button class="btn-text-muted" data-act="deuda-eliminar" data-id="${escapeHtml(d.id)}">✕</button>
      </div>
    </div>
  `;
}

export function renderFinanciamiento(state) {
  const cuentas = state.cuentasCobro || [];
  const movimientos = state.movimientosFinanciamiento || [];
  const deudas = state.deudas || [];
  const pagosMensuales = state.pagosMensuales || [];

  const { efectivo, debes, teDeben, patrimonio } = calcularFinanciamiento(movimientos, deudas);
  const facturado = calcularFacturado(cuentas);
  const totalPagosMensuales = pagosMensuales.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const movimientosOrdenados = movimientos.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
  const tarjetasHtml = movimientosOrdenados.map(movimientoCardHtml).join('');

  const pagosOrdenados = pagosMensuales.slice().sort((a, b) => (a.dia_pago || 99) - (b.dia_pago || 99));
  const pagosHtml = pagosOrdenados.map(pagoMensualCardHtml).join('');

  const meDebenHtml = deudas.filter(d => d.direccion === 'me_deben');
  const yoDeboHtml = deudas.filter(d => d.direccion === 'debo');

  return `
    <main class="financiamiento">
      <div class="financ-head">
        <h2 class="serif" style="margin:0;font-size:32px;">Finanzas</h2>
        <button class="btn-primary" data-act="movimiento-nuevo">+ Agregar dinero</button>
      </div>

      <div class="financ-total-card ${patrimonio < 0 ? 'negativo' : ''}">
        <div style="text-align:center;">
          <span class="mono-label" style="display:block;margin-bottom:12px;">Tu dinero hoy</span>
          <div class="financ-total-value" style="font-size:48px;margin-bottom:16px;">${fmtMoney(patrimonio)}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:14px;">
            <div>
              <div class="mono-label" style="color:var(--verde);">En bolsillo</div>
              <div style="font-size:20px;color:var(--verde);">${fmtMoney(efectivo)}</div>
            </div>
            <div>
              <div class="mono-label" style="color:var(--azul);">Te deben</div>
              <div style="font-size:20px;color:var(--azul);">${fmtMoney(teDeben)}</div>
            </div>
            <div>
              <div class="mono-label" style="color:var(--rojo);">Debes</div>
              <div style="font-size:20px;color:var(--rojo);">${fmtMoney(debes)}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-footnote" style="margin:-8px 0 24px;">Facturado en total: ${fmtMoney(facturado)} (${cuentas.length} cuenta${cuentas.length === 1 ? '' : 's'} de cobro) — no cuenta como tuyo hasta que te paguen.</div>

      <div class="section-title">Efectivo real</div>
      ${movimientos.length ? `<div class="movimientos-grid">${tarjetasHtml}</div>` : `<div class="empty-state">Todavía no registraste movimientos de Bancolombia, Nequi o efectivo.</div>`}

      <div class="financ-deudas-head" style="margin-top:32px;">
        <div class="section-title" style="margin-bottom:0;">Pagos mensuales</div>
        <button class="btn-text-muted" data-act="pago-mensual-nuevo">+ Agregar</button>
      </div>
      <div class="vista-sub">Suscripciones y pagos recurrentes — solo de referencia, no afecta el patrimonio de arriba.</div>
      ${pagosMensuales.length ? `
        <div class="panel-footnote" style="margin-top:0;">${fmtMoney(totalPagosMensuales)} al mes en total</div>
        <div class="movimientos-grid">${pagosHtml}</div>
      ` : `<div class="empty-state">Todavía no registraste pagos mensuales.</div>`}

      <div class="financ-deudas-grid" style="margin-top:32px;">
        <div>
          <div class="financ-deudas-head">
            <div class="section-title" style="margin-bottom:0;">Debes</div>
            <button class="btn-text-muted" data-act="deuda-nueva" data-direccion="debo">+ Agregar</button>
          </div>
          ${yoDeboHtml.length ? yoDeboHtml.map(deudaCardHtml).join('') : '<div class="empty-note">Nada pendiente por pagar.</div>'}
        </div>
        <div>
          <div class="financ-deudas-head">
            <div class="section-title" style="margin-bottom:0;">Te deben</div>
            <button class="btn-text-muted" data-act="deuda-nueva" data-direccion="me_deben">+ Agregar</button>
          </div>
          ${meDebenHtml.length ? meDebenHtml.map(deudaCardHtml).join('') : '<div class="empty-note">Nadie te debe nada registrado.</div>'}
        </div>
      </div>

      ${renderSimuladorPresupuesto(state.presupuesto)}
    </main>
  `;
}
