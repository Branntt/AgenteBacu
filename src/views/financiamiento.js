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

// Paleta única de Finanzas: verde = entra plata, rojo = sale plata/deudas, azul = informativo
function card(accent, contenido, extra = '') {
  return `<div style="background:var(--panel2);border:1px solid var(--line);border-left:3px solid ${accent};border-radius:8px;padding:16px;${extra}">${contenido}</div>`;
}

function filaMonto(etiqueta, monto, color) {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;border-bottom:1px solid var(--line);">
      <span>${etiqueta}</span>
      <span style="font-weight:bold;color:${color};">${monto}</span>
    </div>
  `;
}

export function renderFinanciamiento(state) {
  const movimientos = state.movimientosFinanciamiento || [];
  const deudas = state.deudas || [];
  const clientes = state.clientes || [];
  const gastosVivirSolo = state.gastosVivirSolo || [];
  const gastosRecurrentes = state.gastosRecurrentes || [];

  // Cálculos financieros — misma función que usa Panorama, para que ambas pantallas concuerden
  const { efectivo, debes, teDeben, patrimonio } = calcularFinanciamiento(movimientos, deudas, clientes, state.cuentasCobro || []);

  // Deudas separadas
  const yoDeboHtml = deudas.filter(d => d.direccion === 'debo');
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

      <!-- 2️⃣ REGISTRO DE FINANZAS -->
      <div class="finanzas-seccion" style="margin-bottom:24px;">
        ${renderTablaFinanzas(movimientos)}
      </div>

      <!-- 3️⃣ GASTOS MENSUALES RECURRENTES -->
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

      <!-- 3️⃣ ASEO PERSONAL (DÍA 28) -->
      <div class="finanzas-seccion" style="margin-bottom:24px;">
        <div class="seccion-titulo">🧴 Aseo Personal (Día 28)</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(190px, 1fr));gap:10px;margin-bottom:12px;">
          ${[
            ['👁️ Contorno ojos', '~1 mes de duración', '$80k/mes', false],
            ['🧴 Desodorante', 'Aún dura', '$50k/mes', true],
            ['🧼 Jabón cara', '$90k cada 2 meses', '$45k/mes', false],
            ['🧴 Shampú', 'Aún dura', '$15k/mes', true],
            ['🪒 Cuchillas', '$18k cada 2 meses', '$9k/mes', false]
          ].map(([nombre, nota, precio, agotado]) => card('#8E5BE8', `
            <div style="font-size:13px;font-weight:bold;">${nombre}</div>
            <div style="font-size:11px;opacity:0.6;margin-top:4px;">${nota}</div>
            <div style="font-size:14px;font-weight:bold;color:#8E5BE8;margin-top:6px;">${precio}</div>
          `, `padding:12px;${agotado ? 'opacity:0.35;' : ''}`)).join('')}
        </div>
        ${card('#8E5BE8', `
          <div style="text-align:center;">
            <span style="opacity:0.7;font-size:13px;">Promedio mensual de aseo: </span>
            <span style="font-size:18px;font-weight:bold;color:#8E5BE8;">$199.000</span>
            <span style="opacity:0.5;font-size:11px;"> · se reinicia cada 28</span>
          </div>
        `)}
      </div>

      <!-- 4️⃣ DEUDAS PERSONALES -->
      ${yoDeboHtml.length > 0 ? `
      <div class="finanzas-seccion" style="margin-bottom:24px;">
        <div class="seccion-titulo">⚠️ Debes Pagar · ${fmtMoney(yoDebenTotal)}</div>
        ${card('var(--rojo)', yoDeboHtml.map(d => filaMonto(escapeHtml(d.persona), fmtMoney(d.monto), 'var(--rojo)')).join(''))}
      </div>
      ` : ''}

      <!-- ══════════ SEPARADOR: AQUÍ TERMINA LO REAL ══════════ -->
      <div style="display:flex;align-items:center;gap:16px;margin:56px 0 24px;">
        <div style="flex:1;border-top:2px dashed var(--line2);"></div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:0.6;">Simulación · hipotético</div>
        <div style="flex:1;border-top:2px dashed var(--line2);"></div>
      </div>

      <!-- 5️⃣ SIMULACIÓN: SI VIVIERAS SOLO -->
      <div class="finanzas-seccion" style="border:2px dashed var(--line2);border-radius:12px;padding:20px;">
        <div class="seccion-titulo">🎯 Simulación: Si vivieras solo</div>
        <p style="margin:0 0 20px;font-size:12px;opacity:0.6;">Esto no es tu situación actual — es lo que costaría el mes si vivieras solo.</p>

        <!-- GASTOS BÁSICOS -->
        <div style="margin-bottom:20px;">
          <div style="font-size:13px;font-weight:bold;margin-bottom:10px;color:#EFC94C;">🏠 GASTOS BÁSICOS</div>
          ${card('#EFC94C', `
            ${[1,2,3,8,9,10,6,7].map(idx => {
              const g = gastosVivirSolo.find(x => x.id === `g${idx}`);
              if (!g) return '';
              return filaMonto(`${g.emoji} ${escapeHtml(g.nombre)}`, fmtMoney(g.monto), 'var(--text)');
            }).join('')}
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0 2px;font-weight:bold;color:#EFC94C;">
              <span>Subtotal Básicos</span>
              <span>${fmtMoney(700000+450000+150000+50000+80000+50000+120000+100000)}</span>
            </div>
          `)}
        </div>

        <!-- GASTOS RECURRENTES -->
        <div style="margin-bottom:20px;">
          <div style="font-size:13px;font-weight:bold;margin-bottom:10px;color:#E8641B;">💼 GASTOS RECURRENTES</div>
          ${card('#E8641B', `
            ${gastosRecurrentes.map(g => filaMonto(`${g.emoji} ${escapeHtml(g.nombre)}`, fmtMoney(g.monto), 'var(--text)')).join('')}
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0 2px;font-weight:bold;color:#E8641B;">
              <span>Subtotal Recurrentes</span>
              <span>${fmtMoney(gastosRecurrentesTotal)}</span>
            </div>
          `)}
        </div>

        <!-- ASEO PERSONAL -->
        <div style="margin-bottom:20px;">
          <div style="font-size:13px;font-weight:bold;margin-bottom:10px;color:#8E5BE8;">🧴 ASEO PERSONAL</div>
          ${card('#8E5BE8', `
            ${[
              ['🧴 Contorno de ojos', '$80.000'],
              ['🧼 Jabón para la cara', '$45.000'],
              ['🧴 Shampú', '$15.000'],
              ['🧴 Desodorante', '$50.000'],
              ['🪒 Cuchillas', '$9.000']
            ].map(([nombre, precio]) => filaMonto(nombre, precio, 'var(--text)')).join('')}
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0 2px;font-weight:bold;color:#8E5BE8;">
              <span>Subtotal Aseo</span>
              <span>$199.000</span>
            </div>
          `)}
        </div>

        <!-- TOTAL FINAL -->
        <div style="background:var(--panel2);border:2px solid var(--rojo);padding:24px;border-radius:8px;font-size:14px;text-align:center;">
          <div style="opacity:0.75;margin-bottom:10px;font-weight:bold;">TOTAL MENSUAL SI VIVIERAS SOLO</div>
          <div style="font-size:36px;font-weight:bold;color:var(--rojo);">${fmtMoney(2643706)}</div>
          <div style="font-size:12px;opacity:0.6;margin-top:8px;">Básicos + Recurrentes + Aseo Personal</div>
        </div>

        <!-- ANÁLISIS: ¿PUEDES VIVIR SOLO? -->
        ${
          (() => {
            const gastoMensual = 2643706;
            const efectivoActual = efectivo || 0;
            const mesesPosibles = Math.floor(efectivoActual / gastoMensual);

            let mensaje = '';
            let color = 'var(--rojo)';

            if (efectivoActual < 0) {
              mensaje = '❌ NO PUEDES VIVIR SOLO: Tienes un déficit actual de ' + fmtMoney(Math.abs(efectivoActual)) + '. Necesitas primero generar ingresos.';
            } else if (mesesPosibles === 0) {
              mensaje = '⚠️ CRÍTICO: Tu efectivo actual (' + fmtMoney(efectivoActual) + ') no alcanza ni para un mes completo viviendo solo.';
              color = '#E8641B';
            } else if (mesesPosibles < 3) {
              mensaje = '⚠️ LIMITADO: Tu efectivo actual (' + fmtMoney(efectivoActual) + ') te alcanza para ' + mesesPosibles + ' mes(es) viviendo solo. Necesitas incrementar ingresos.';
              color = '#E8641B';
            } else if (mesesPosibles < 6) {
              mensaje = '🟡 POSIBLE A CORTO PLAZO: Tu efectivo actual (' + fmtMoney(efectivoActual) + ') te alcanza para ' + mesesPosibles + ' meses viviendo solo. Necesitas un plan de ingresos.';
              color = '#EFC94C';
            } else if (mesesPosibles < 12) {
              mensaje = '🟢 POSIBLE 6+ MESES: Tu efectivo actual (' + fmtMoney(efectivoActual) + ') te alcanza para ' + mesesPosibles + ' meses viviendo solo. Buen respaldo.';
              color = 'var(--verde)';
            } else {
              mensaje = '✅ POSIBLE 1+ AÑO: Tu efectivo actual (' + fmtMoney(efectivoActual) + ') te alcanza para ' + Math.floor(mesesPosibles / 12) + ' año(s) y ' + (mesesPosibles % 12) + ' mes(es) viviendo solo. Tienes buena autonomía.';
              color = 'var(--verde)';
            }

            return `
              <div style="margin-top:16px;">
                ${card(color, `<div style="font-size:12px;line-height:1.6;color:${color};font-weight:bold;">${mensaje}</div>`)}
              </div>
            `;
          })()
        }
      </div>

    </main>
  `;
}
