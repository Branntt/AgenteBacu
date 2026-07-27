import { escapeHtml } from '../lib/format.js';
import { calcularFinanciamiento } from '../lib/financiamiento.js';
import { renderTablaFinanzas } from '../components/tablaFinanzas.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  const sign = v < 0 ? '-' : '';
  return sign + '$' + Math.abs(v).toLocaleString('es-CO');
}

export function renderFinanciamiento(state) {
  const movimientos = state.movimientosFinanciamiento || [];
  const deudas = state.deudas || [];
  const clientes = state.clientes || [];
  const gastosVivirSolo = state.gastosVivirSolo || [];

  // Cálculos financieros
  const clientesPorPagar = clientes.filter(c => c.estado === 'por_pagar').reduce((sum, c) => sum + (Number(c.precio) || 0), 0);
  const deudaAFavor = deudas.filter(d => d.direccion === 'me_deben').reduce((sum, d) => sum + (Number(d.monto) || 0), 0);
  const teDeben = clientesPorPagar + deudaAFavor;

  const { efectivo, debes } = calcularFinanciamiento(movimientos, deudas);
  const patrimonio = efectivo + teDeben - debes;

  // Deudas separadas
  const yoDeboHtml = deudas.filter(d => d.direccion === 'debo');
  const yoDebenTotal = yoDeboHtml.reduce((sum, d) => sum + (Number(d.monto) || 0), 0);

  // Gastos mensuales totales
  const gastosMensualesTotal = gastosVivirSolo.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);

  // Simular si viviera solo
  const mesesParaVivir = efectivo > 0 ? Math.floor(efectivo / gastosMensualesTotal) : 0;

  return `
    <main class="financiamiento">
      <!-- HEADER -->
      <div class="financ-head" style="margin-bottom:32px;">
        <h2 class="serif" style="margin:0;font-size:32px;">Finanzas</h2>
        <p style="margin:8px 0 0 0;font-size:14px;opacity:0.7;">Tu situación financiera actual</p>
      </div>

      <!-- 1️⃣ GASTOS MENSUALES (LO PRIMERO) -->
      <div class="finanzas-seccion" style="background:linear-gradient(135deg, rgba(255,107,107,0.1), rgba(255,149,0,0.1));border-left:4px solid var(--rojo);margin-bottom:24px;">
        <div class="seccion-titulo">💰 Gastos Mensuales (Si vivieras solo)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          ${gastosVivirSolo.map(g => `
            <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;font-size:13px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span>${escapeHtml(g.concepto || 'Gasto')}</span>
                <span style="font-weight:bold;color:var(--rojo);">${fmtMoney(g.monto)}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="background:rgba(0,0,0,0.3);padding:14px;border-radius:8px;font-size:14px;text-align:center;">
          <div style="color:var(--rojo);font-weight:bold;font-size:20px;">${fmtMoney(gastosMensualesTotal)}</div>
          <div style="opacity:0.7;margin-top:4px;">Total mensual necesario</div>
        </div>
        ${mesesParaVivir > 0 ? `
        <div style="background:rgba(76,175,80,0.2);padding:12px;border-radius:8px;margin-top:12px;text-align:center;font-size:13px;color:var(--verde);">
          <strong>Con tu dinero actual, podrías vivir ${mesesParaVivir} mes${mesesParaVivir !== 1 ? 'es' : ''}</strong>
        </div>
        ` : ''}
      </div>

      <!-- 2️⃣ SITUACIÓN FINANCIERA HOY (RESUMEN) -->
      <div class="finanzas-seccion" style="margin-bottom:24px;">
        <div class="seccion-titulo">📊 Tu Situación Hoy</div>
        <div class="financ-total-card ${patrimonio < 0 ? 'negativo' : ''}" style="padding:32px;border-radius:12px;text-align:center;">
          <div style="font-size:14px;opacity:0.8;margin-bottom:12px;">Patrimonio Neto</div>
          <div style="font-size:56px;font-weight:bold;margin-bottom:32px;color:${patrimonio >= 0 ? 'var(--verde)' : 'var(--rojo)'};">${fmtMoney(patrimonio)}</div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:13px;">
            <div style="background:rgba(76,175,80,0.15);padding:16px;border-radius:8px;border-left:3px solid var(--verde);">
              <div style="opacity:0.8;margin-bottom:6px;">En bolsillo</div>
              <div style="font-size:18px;font-weight:bold;color:var(--verde);">${fmtMoney(efectivo)}</div>
            </div>
            <div style="background:rgba(33,150,243,0.15);padding:16px;border-radius:8px;border-left:3px solid var(--azul);">
              <div style="opacity:0.8;margin-bottom:6px;">Te deben</div>
              <div style="font-size:18px;font-weight:bold;color:var(--azul);">${fmtMoney(teDeben)}</div>
            </div>
            <div style="background:rgba(255,107,107,0.15);padding:16px;border-radius:8px;border-left:3px solid var(--rojo);">
              <div style="opacity:0.8;margin-bottom:6px;">Debes</div>
              <div style="font-size:18px;font-weight:bold;color:var(--rojo);">${fmtMoney(debes)}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3️⃣ TABLA INTELIGENTE (LA VERDAD ABSOLUTA) -->
      <div class="finanzas-seccion" style="margin-bottom:24px;">
        ${renderTablaFinanzas(movimientos)}
      </div>

      <!-- 4️⃣ DEUDAS PERSONALES -->
      ${yoDeboHtml.length > 0 ? `
      <div class="finanzas-seccion" style="background:rgba(255,107,107,0.1);border-left:4px solid var(--rojo);">
        <div class="seccion-titulo">⚠️ Debes Pagar - ${fmtMoney(yoDebenTotal)}</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${yoDeboHtml.map(d => `
            <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
              <span>${escapeHtml(d.persona)}</span>
              <span style="font-weight:bold;color:var(--rojo);">${fmtMoney(d.monto)}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

    </main>
  `;
}
