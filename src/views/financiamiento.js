import { escapeHtml } from '../lib/format.js';
import { calcularFinanciamiento, calcularFacturado } from '../lib/financiamiento.js';
import { renderVivirSoloSimulador } from '../components/vivirSoloSimulador.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  return '$' + Math.abs(v).toLocaleString('es-CO');
}

function deudaRowHtml(d) {
  return `
    <div class="deuda-row">
      <div class="deuda-persona">${escapeHtml(d.persona)}</div>
      <div class="deuda-monto">${fmtMoney(d.monto)}</div>
      <div class="deuda-estado ${d.pagada ? 'pagada' : ''}">
        ${d.pagada ? '✓ PAGADA' : '⏳ PENDIENTE'}
      </div>
      <div class="deuda-actions">
        <button class="btn-text-muted" data-act="deuda-toggle" data-id="${escapeHtml(d.id)}" style="font-size:12px;">
          ${d.pagada ? 'Desmarcar' : 'Marcar pagada'}
        </button>
      </div>
    </div>
  `;
}

export function renderFinanciamiento(state) {
  const movimientos = state.movimientosFinanciamiento || [];
  const deudas = state.deudas || [];
  const gastosVivirSolo = state.gastosVivirSolo || [];

  const { efectivo, debes, teDeben, patrimonio } = calcularFinanciamiento(movimientos, deudas);

  const meDebenHtml = deudas.filter(d => d.direccion === 'me_deben');
  const yoDeboHtml = deudas.filter(d => d.direccion === 'debo');

  return `
    <main class="financiamiento">
      <div class="financ-head">
        <h2 class="serif" style="margin:0;font-size:32px;">Finanzas</h2>
      </div>

      <!-- SECCIÓN 1: TU DINERO HOY -->
      <div class="finanzas-seccion">
        <div class="seccion-titulo">💰 Tu dinero hoy</div>
        <div class="financ-total-card ${patrimonio < 0 ? 'negativo' : ''}">
          <div style="text-align:center;">
            <div class="mono-label" style="display:block;margin-bottom:12px;">Patrimonio neto</div>
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
      </div>

      <!-- SECCIÓN 2: SI VIVIERAS SOLO -->
      <div class="finanzas-seccion">
        ${renderVivirSoloSimulador(gastosVivirSolo, efectivo)}
      </div>

      <!-- SECCIÓN 3: TUS DEUDAS -->
      ${yoDeboHtml.length > 0 ? `
      <div class="finanzas-seccion">
        <div class="seccion-titulo">⚠️ Debes pagar (${yoDeboHtml.length})</div>
        <div class="deudas-list">
          ${yoDeboHtml.map(deudaRowHtml).join('')}
        </div>
      </div>
      ` : ''}

      <!-- SECCIÓN 4: TE DEBEN -->
      ${meDebenHtml.length > 0 ? `
      <div class="finanzas-seccion">
        <div class="seccion-titulo">✅ Te deben (${meDebenHtml.length})</div>
        <div class="deudas-list">
          ${meDebenHtml.map(deudaRowHtml).join('')}
        </div>
      </div>
      ` : ''}

    </main>
  `;
}
