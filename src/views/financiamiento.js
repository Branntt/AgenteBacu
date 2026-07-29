import { escapeHtml } from '../lib/format.js';
import { calcularFinanciamiento, cuentasCobroPendientes } from '../lib/financiamiento.js';
import { renderTablaFinanzas } from '../components/tablaFinanzas.js';

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

// Paleta única de Finanzas: verde = entra plata, rojo = sale plata/deudas, azul = informativo
function card(accent, contenido, extra = '') {
  return `<div style="background:var(--panel2);border:1px solid var(--line);border-left:3px solid ${accent};border-radius:8px;padding:16px;${extra}">${contenido}</div>`;
}

function filaMonto(etiqueta, monto, color, accionHtml = '') {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;border-bottom:1px solid var(--line);gap:12px;">
      <span>${etiqueta}</span>
      <span style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
        <span style="font-weight:bold;color:${color};">${monto}</span>
        ${accionHtml}
      </span>
    </div>
  `;
}

function botonMarcarPagada(act, id) {
  return `<button data-act="${act}" data-id="${escapeHtml(id)}" style="font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid var(--line);background:var(--panel);cursor:pointer;color:var(--verde);white-space:nowrap;">Marcar pagada</button>`;
}

// Tarjeta editable de deuda personal — persona, monto y fecha límite (esta
// última alimenta el peso de estrés en Bienestar: entre más atrasada, más pesa).
function deudaCardHtml(d) {
  const id = escapeHtml(d.id);
  return `
    <div class="deuda-card ${d.pagada ? 'pagada' : ''}">
      <input class="deuda-persona" data-change="deuda-persona" data-id="${id}" value="${escapeHtml(d.persona || '')}" placeholder="¿Con quién es esta deuda?">
      <div class="deuda-footer">
        <input class="deuda-monto-label" data-change="deuda-monto" data-id="${id}" value="${d.monto ? String(d.monto) : ''}" placeholder="Monto" inputmode="numeric" style="background:none;border:none;width:110px;color:inherit;">
        <input type="date" data-change="deuda-fecha-limite" data-id="${id}" value="${escapeHtml(d.fecha_limite || '')}" min="2026-01-01" title="Fecha límite" style="background:none;border:none;color:inherit;font-family:'IBM Plex Mono',monospace;font-size:11px;opacity:0.8;color-scheme:dark;">
        ${botonMarcarPagada('deuda-toggle', d.id)}
      </div>
    </div>
  `;
}

export function renderFinanciamiento(state) {
  const movimientos = state.movimientosFinanciamiento || [];
  const deudas = state.deudas || [];
  const cuentasCobro = state.cuentasCobro || [];
  const gastosRecurrentes = state.gastosRecurrentes || [];

  // Cálculos financieros — misma función que usa Panorama, para que ambas pantallas concuerden
  const { efectivo, debes, teDeben, patrimonio } = calcularFinanciamiento(movimientos, deudas, cuentasCobro);

  // Quién te debe: cuentas de cobro sin pagar (por cliente) + deudas personales a tu favor.
  // El estado de pago vive en cada factura, no en el cliente — ver calcularFinanciamiento.
  const facturasPendientes = cuentasCobroPendientes(cuentasCobro);
  const meDebenHtml = deudas.filter(d => d.direccion === 'me_deben' && !d.pagada);

  // Deudas que tú debes pagar
  const yoDeboHtml = deudas.filter(d => d.direccion === 'debo' && !d.pagada);
  const yoDebenTotal = yoDeboHtml.reduce((sum, d) => sum + (Number(d.monto) || 0), 0);

  // Movimientos ordenados por fecha (más recientes primero)
  const movOrdenados = [...movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const gastos = movOrdenados.filter(m => m.tipo === 'salida');
  const ingresos = movOrdenados.filter(m => m.tipo === 'entrada');

  const totalGastos = gastos.reduce((sum, m) => sum + (Number(m.monto) || 0), 0);
  const totalIngresos = ingresos.reduce((sum, m) => sum + (Number(m.monto) || 0), 0);

  // Gastos recurrentes totales
  const gastosRecurrentesTotal = gastosRecurrentes.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);

  return `
    <main class="financiamiento">
      <!-- HEADER -->
      <div class="financ-head" style="margin-bottom:32px;">
        <h2 class="serif" style="margin:0;font-size:32px;">Finanzas</h2>
        <p style="margin:8px 0 0 0;font-size:14px;opacity:0.7;">Tu situación financiera actual</p>
      </div>

      <!-- 1️⃣ SITUACIÓN HOY — lo primero que ven los ojos -->
      <div class="finanzas-seccion" style="margin-bottom:24px;">
        <div class="seccion-titulo">📊 Tu Situación Hoy</div>

        <div style="background:var(--panel2);border:2px solid ${patrimonio >= 0 ? 'var(--verde)' : 'var(--rojo)'};box-shadow:0 0 24px ${patrimonio >= 0 ? 'rgba(31,175,116,0.25)' : 'rgba(217,54,46,0.25)'};padding:40px 32px;border-radius:12px;text-align:center;margin-bottom:16px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:0.7;margin-bottom:12px;">Patrimonio Neto</div>
          <div style="font-size:64px;font-weight:bold;margin-bottom:32px;line-height:1;color:${patrimonio >= 0 ? 'var(--verde)' : 'var(--rojo)'};">${fmtMoney(patrimonio)}</div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:13px;">
            ${card('var(--verde)', `
              <div style="opacity:0.7;margin-bottom:6px;">En bolsillo</div>
              <div style="font-size:18px;font-weight:bold;color:var(--verde);">${fmtMoney(efectivo)}</div>
            `)}
            ${card('var(--azul)', `
              <div style="opacity:0.7;margin-bottom:6px;">Te deben</div>
              <div style="font-size:18px;font-weight:bold;color:var(--azul);">${fmtMoney(teDeben)}</div>
            `)}
            ${card('var(--rojo)', `
              <div style="opacity:0.7;margin-bottom:6px;">Debes</div>
              <div style="font-size:18px;font-weight:bold;color:var(--rojo);">${fmtMoney(debes)}</div>
            `)}
          </div>
        </div>

        <!-- Gastos e Ingresos -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          ${card('var(--rojo)', `
            <div style="font-size:14px;font-weight:bold;margin-bottom:12px;color:var(--rojo);">💸 Gastos · ${fmtMoney(totalGastos)}</div>
            <div style="display:flex;flex-direction:column;">
              ${gastos.slice(0, 10).map(m => filaMonto(
                `${escapeHtml(m.nota || 'Gasto')} <span style="opacity:0.5;font-size:11px;">· ${fmtFecha(m.fecha)}</span>`,
                fmtMoney(m.monto), 'var(--rojo)'
              )).join('')}
              ${gastos.length === 0 ? '<div style="opacity:0.5;font-size:12px;">Sin gastos registrados</div>' : ''}
            </div>
          `)}
          ${card('var(--verde)', `
            <div style="font-size:14px;font-weight:bold;margin-bottom:12px;color:var(--verde);">💵 Pagos Recibidos · ${fmtMoney(totalIngresos)}</div>
            <div style="display:flex;flex-direction:column;">
              ${ingresos.slice(0, 10).map(m => filaMonto(
                `${escapeHtml(m.nota || 'Ingreso')} <span style="opacity:0.5;font-size:11px;">· ${fmtFecha(m.fecha)}</span>`,
                fmtMoney(m.monto), 'var(--verde)'
              )).join('')}
              ${ingresos.length === 0 ? '<div style="opacity:0.5;font-size:12px;">Sin ingresos registrados</div>' : ''}
            </div>
          `)}
        </div>
      </div>

      <!-- 2️⃣ QUIÉN TE DEBE -->
      <div class="finanzas-seccion" style="margin-bottom:24px;">
        <div class="financ-deudas-head">
          <div class="seccion-titulo" style="margin-bottom:0;">🔵 Quién te debe · ${fmtMoney(teDeben)}</div>
          <button class="btn-ghost" data-act="deuda-nueva" data-direccion="me_deben">+ Deuda a mi favor</button>
        </div>
        ${facturasPendientes.length === 0 ? '' : card('var(--azul)', `
          ${facturasPendientes.map(cc => filaMonto(
            `${escapeHtml(cc.cliente_nombre || 'Sin nombre')} <span style="opacity:0.5;font-size:11px;">· cuenta ${escapeHtml(cc.numero)} · ${fmtFecha(cc.fecha)}</span>`,
            fmtMoney(cc.total), 'var(--azul)',
            botonMarcarPagada('cc-toggle-pagada', cc.id)
          )).join('')}
        `, 'margin-bottom:10px;')}
        ${meDebenHtml.length ? meDebenHtml.map(deudaCardHtml).join('') : (facturasPendientes.length === 0 ? '<div style="opacity:0.5;font-size:12px;">Nadie te debe ahora mismo 🎉</div>' : '')}
      </div>

      <!-- 3️⃣ REGISTRO DE FINANZAS -->
      <div class="finanzas-seccion" style="margin-bottom:24px;">
        ${renderTablaFinanzas(movimientos)}
      </div>

      <!-- 4️⃣ GASTOS MENSUALES RECURRENTES -->
      <div class="finanzas-seccion" style="margin-bottom:24px;">
        <div class="seccion-titulo">💰 Gastos Mensuales Recurrentes</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:10px;margin-bottom:12px;">
          ${gastosRecurrentes.map(g => card('#E8641B', `
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:13px;font-weight:bold;">${g.emoji} ${escapeHtml(g.nombre)}</div>
                <div style="font-size:10px;opacity:0.55;margin-top:4px;">Día ${g.dia_vencimiento}</div>
              </div>
              <div style="font-size:14px;font-weight:bold;color:#E8641B;">${fmtMoney(g.monto)}</div>
            </div>
          `, 'padding:12px;')).join('')}
        </div>
        ${card('#E8641B', `
          <div style="text-align:center;">
            <span style="opacity:0.7;font-size:13px;">Total recurrentes del mes: </span>
            <span style="font-size:18px;font-weight:bold;color:#E8641B;">${fmtMoney(gastosRecurrentesTotal)}</span>
          </div>
        `)}
      </div>

      <!-- 5️⃣ DEUDAS PERSONALES -->
      <div class="finanzas-seccion" style="margin-bottom:24px;">
        <div class="financ-deudas-head">
          <div class="seccion-titulo" style="margin-bottom:0;">⚠️ Debes Pagar · ${fmtMoney(yoDebenTotal)}</div>
          <button class="btn-ghost" data-act="deuda-nueva" data-direccion="debo">+ Debo</button>
        </div>
        ${yoDeboHtml.length ? yoDeboHtml.map(deudaCardHtml).join('') : '<div style="opacity:0.5;font-size:12px;">No debes nada registrado ahora mismo</div>'}
      </div>

    </main>
  `;
}
