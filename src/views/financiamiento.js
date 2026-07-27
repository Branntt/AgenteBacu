import { escapeHtml } from '../lib/format.js';
import { calcularFinanciamiento } from '../lib/financiamiento.js';
import { renderTablaFinanzas } from '../components/tablaFinanzas.js';
import { hoyStr, mesActual } from '../lib/idea.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  const sign = v < 0 ? '-' : '';
  return sign + '$' + Math.abs(v).toLocaleString('es-CO');
}

function fmtFecha(fecha) {
  if (!fecha) return '';
  const [año, mes, día] = fecha.split('-');
  return `${día}/${mes}`;
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

  // Movimientos ordenados por fecha (más recientes primero)
  const movOrdenados = [...movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const gastos = movOrdenados.filter(m => m.tipo === 'salida');
  const ingresos = movOrdenados.filter(m => m.tipo === 'entrada');

  const totalGastos = gastos.reduce((sum, m) => sum + (Number(m.monto) || 0), 0);
  const totalIngresos = ingresos.reduce((sum, m) => sum + (Number(m.monto) || 0), 0);

  // Gastos si viviera solo
  const gastosMensualesTotal = gastosVivirSolo.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
  const mesesParaVivir = efectivo > 0 && gastosMensualesTotal > 0 ? Math.floor(efectivo / gastosMensualesTotal) : 0;

  return `
    <main class="financiamiento">
      <!-- HEADER -->
      <div class="financ-head" style="margin-bottom:32px;">
        <h2 class="serif" style="margin:0;font-size:32px;">Finanzas</h2>
        <p style="margin:8px 0 0 0;font-size:14px;opacity:0.7;">Tu situación financiera actual</p>
      </div>

      <!-- 0️⃣ REGISTRO DE FINANZAS (PRIMERO) -->
      <div class="finanzas-seccion" style="margin-bottom:24px;">
        ${renderTablaFinanzas(movimientos)}
      </div>

      <!-- 1️⃣ SITUACIÓN HOY (con Gastos + Ingresos) -->
      <div class="finanzas-seccion" style="margin-bottom:24px;">
        <div class="seccion-titulo">📊 Tu Situación Hoy</div>

        <div class="financ-total-card ${patrimonio < 0 ? 'negativo' : ''}" style="padding:32px;border-radius:12px;text-align:center;margin-bottom:24px;">
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

        <!-- Tabla de Gastos e Ingresos -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <!-- GASTOS -->
          <div style="background:rgba(255,107,107,0.1);border-left:4px solid var(--rojo);border-radius:8px;padding:16px;">
            <div style="font-size:14px;font-weight:bold;margin-bottom:12px;color:var(--rojo);">💸 Gastos - ${fmtMoney(totalGastos)}</div>
            <div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;">
              ${gastos.slice(0, 10).map(m => `
                <div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:6px;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div>${escapeHtml(m.nota || 'Gasto')}</div>
                    <div style="opacity:0.6;font-size:11px;">${fmtFecha(m.fecha)}</div>
                  </div>
                  <div style="font-weight:bold;color:var(--rojo);">${fmtMoney(m.monto)}</div>
                </div>
              `).join('')}
              ${gastos.length === 0 ? '<div style="opacity:0.5;font-size:12px;">Sin gastos registrados</div>' : ''}
            </div>
          </div>

          <!-- INGRESOS -->
          <div style="background:rgba(76,175,80,0.1);border-left:4px solid var(--verde);border-radius:8px;padding:16px;">
            <div style="font-size:14px;font-weight:bold;margin-bottom:12px;color:var(--verde);">💵 Pagos Recibidos - ${fmtMoney(totalIngresos)}</div>
            <div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;">
              ${ingresos.slice(0, 10).map(m => `
                <div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:6px;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div>${escapeHtml(m.nota || 'Ingreso')}</div>
                    <div style="opacity:0.6;font-size:11px;">${fmtFecha(m.fecha)}</div>
                  </div>
                  <div style="font-weight:bold;color:var(--verde);">${fmtMoney(m.monto)}</div>
                </div>
              `).join('')}
              ${ingresos.length === 0 ? '<div style="opacity:0.5;font-size:12px;">Sin ingresos registrados</div>' : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- 2️⃣ GASTOS MENSUALES REALES (ESTE MES) -->
      <div class="finanzas-seccion" style="background:rgba(255,152,0,0.1);border-left:4px solid var(--naranja);margin-bottom:24px;">
        <div class="seccion-titulo">💰 Gastos Mensuales Reales - ${mesActual()}</div>
        ${gastos.length > 0 ? `
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:16px;">
          ${gastos.map(g => `
            <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;border-left:3px solid var(--rojo);">
              <div style="display:flex;justify-content:space-between;align-items:start;">
                <div style="flex:1;">
                  <div style="font-weight:bold;">${escapeHtml(g.nota || 'Gasto')}</div>
                  <div style="font-size:11px;opacity:0.6;margin-top:4px;">${fmtFecha(g.fecha)}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:16px;font-weight:bold;color:var(--rojo);">${fmtMoney(g.monto)}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        ` : `<div style="opacity:0.5;font-size:13px;text-align:center;padding:20px;">Sin gastos registrados este mes</div>`}

        <div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;margin-top:16px;text-align:center;font-size:13px;">
          <div style="opacity:0.7;">Total gastado este mes:</div>
          <div style="font-size:20px;font-weight:bold;color:var(--rojo);margin-top:6px;">${fmtMoney(totalGastos)}</div>
        </div>
      </div>

      <!-- 3️⃣ DEUDAS PERSONALES -->
      ${yoDeboHtml.length > 0 ? `
      <div class="finanzas-seccion" style="background:rgba(255,107,107,0.1);border-left:4px solid var(--rojo);margin-bottom:24px;">
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

      <!-- 4️⃣ GASTOS MENSUALES (SI VIVIERAS SOLO) -->
      <div class="finanzas-seccion" style="background:linear-gradient(135deg, rgba(255,107,107,0.1), rgba(255,149,0,0.1));border-left:4px solid var(--rojo);">
        <div class="seccion-titulo">🎯 Simulación: Si vivieras solo</div>
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

    </main>
  `;
}
