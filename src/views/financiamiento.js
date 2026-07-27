import { escapeHtml } from '../lib/format.js';
import { calcularFinanciamiento } from '../lib/financiamiento.js';
import { renderVivirSoloSimulador } from '../components/vivirSoloSimulador.js';
import { renderTablaFinanzas } from '../components/tablaFinanzas.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  const sign = v < 0 ? '-' : '';
  return sign + '$' + Math.abs(v).toLocaleString('es-CO');
}

function deudaRowHtml(d) {
  return `
    <div class="deuda-row">
      <div class="deuda-persona">${escapeHtml(d.persona)}</div>
      <div class="deuda-monto">${fmtMoney(d.monto)}</div>
      <div class="deuda-estado ${d.pagada ? 'pagada' : ''}">
        ${d.pagada ? '✓ PAGADA' : ''}
      </div>
    </div>
  `;
}

export function renderFinanciamiento(state) {
  const movimientos = state.movimientosFinanciamiento || [];
  const deudas = state.deudas || [];
  const clientes = state.clientes || [];
  const gastosVivirSolo = state.gastosVivirSolo || [];

  // Te deben = clientes en por_pagar + deudas me_deben
  const clientesPorPagar = clientes.filter(c => c.estado === 'por_pagar').reduce((sum, c) => sum + (Number(c.precio) || 0), 0);
  const deudaAFavor = deudas.filter(d => d.direccion === 'me_deben').reduce((sum, d) => sum + (Number(d.monto) || 0), 0);
  const teDeben = clientesPorPagar + deudaAFavor;

  const { efectivo, debes, patrimonio: _ } = calcularFinanciamiento(movimientos, deudas);
  const patrimonio = efectivo + teDeben - debes;

  const meDebenHtml = deudas.filter(d => d.direccion === 'me_deben');
  const yoDeboHtml = deudas.filter(d => d.direccion === 'debo');

  return `
    <main class="financiamiento">
      <div class="financ-head">
        <h2 class="serif" style="margin:0;font-size:32px;">Finanzas</h2>
      </div>

      <!-- SECCIÓN 0: TABLA DE FINANZAS (LA VERDAD ABSOLUTA) -->
      <div class="finanzas-seccion">
        ${renderTablaFinanzas(movimientos)}
      </div>

      <!-- SECCIÓN 1: SITUACIÓN HOY -->
      <div class="finanzas-seccion">
        <div class="seccion-titulo">📊 Situación hoy</div>
        <div class="financ-total-card ${patrimonio < 0 ? 'negativo' : ''}">
          <div style="text-align:center;">
            <div class="mono-label" style="display:block;margin-bottom:12px;">Tu situación financiera</div>
            <div class="financ-total-value" style="font-size:48px;margin-bottom:24px;">${fmtMoney(patrimonio)}</div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:14px;margin-bottom:24px;">
              <div>
                <div class="mono-label" style="color:var(--verde);">En bolsillo</div>
                <div style="font-size:20px;color:var(--verde);font-weight:bold;">${fmtMoney(efectivo)}</div>
              </div>
              <div>
                <div class="mono-label" style="color:var(--azul);">Te deben</div>
                <div style="font-size:20px;color:var(--azul);font-weight:bold;">${fmtMoney(teDeben)}</div>
              </div>
              <div>
                <div class="mono-label" style="color:var(--rojo);">Debes (real)</div>
                <div style="font-size:20px;color:var(--rojo);font-weight:bold;">${fmtMoney(debes)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 2: SI VIVIERAS SOLO -->
      <div class="finanzas-seccion">
        ${renderVivirSoloSimulador(gastosVivirSolo, efectivo)}
      </div>

      <!-- SECCIÓN 3: DEBES PAGAR -->
      ${yoDeboHtml.length > 0 ? `
      <div class="finanzas-seccion">
        <div class="seccion-titulo">⚠️ Debes pagar (${yoDeboHtml.length}) - Total: ${fmtMoney(yoDeboHtml.reduce((sum, d) => sum + (Number(d.monto) || 0), 0))}</div>
        <div class="deudas-list">
          ${yoDeboHtml.map(deudaRowHtml).join('')}
        </div>
      </div>
      ` : ''}

      <!-- SECCIÓN 4: TE DEBEN PAGAR -->
      ${meDebenHtml.length > 0 ? `
      <div class="finanzas-seccion">
        <div class="seccion-titulo">✅ Te deben pagar (${meDebenHtml.length}) - Total: ${fmtMoney(meDebenHtml.reduce((sum, d) => sum + (Number(d.monto) || 0), 0))}</div>
        <div class="deudas-list">
          ${meDebenHtml.map(deudaRowHtml).join('')}
        </div>
      </div>
      ` : ''}

    </main>
  `;
}
