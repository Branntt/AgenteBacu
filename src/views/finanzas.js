import { escapeHtml } from '../lib/format.js';
import { detectarCategoria, obtenerEmoji, agruparPorCategoria, calcularResumen } from '../lib/transacciones.js';
import { hoyStr } from '../lib/idea.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  const sign = v < 0 ? '-' : '';
  return sign + '$' + Math.abs(v).toLocaleString('es-CO');
}

export function renderFinanzas(state) {
  const transacciones = state.transacciones || [];
  const hoy = hoyStr();

  // Transacciones de hoy
  const hoyTransacciones = transacciones.filter(t => t.fecha === hoy);
  const resumenHoy = calcularResumen(hoyTransacciones);

  // Transacciones del mes
  const mesActual = hoy.slice(0, 7); // YYYY-MM
  const mesTransacciones = transacciones.filter(t => t.fecha.startsWith(mesActual));
  const resumenMes = calcularResumen(mesTransacciones);

  // Gastos por categoría (hoy)
  const gastosHoy = hoyTransacciones.filter(t => t.tipo === 'gasto');
  const categorias = agruparPorCategoria(gastosHoy);

  // Saldo actual (iniciamos con $127,000)
  const saldoInicial = 127000;
  const saldoActual = saldoInicial + resumenMes.neto;

  // Pie chart de categorías
  const pieData = Object.entries(categorias).map(([cat, data]) => ({
    name: cat,
    value: data.total,
    emoji: obtenerEmoji(cat)
  })).sort((a, b) => b.value - a.value);

  const colores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

  return `
    <main class="finanzas">
      <!-- HEADER -->
      <div style="margin-bottom:32px;">
        <h2 class="serif" style="margin:0;font-size:32px;">💰 Finanzas</h2>
        <p style="margin:8px 0 0 0;font-size:14px;opacity:0.7;">Tracking de gastos en tiempo real</p>
      </div>

      <!-- SALDO ACTUAL -->
      <div style="background:linear-gradient(135deg, #1FAF74 0%, #16935F 100%);padding:24px;border-radius:12px;margin-bottom:24px;color:white;">
        <div style="opacity:0.9;font-size:13px;margin-bottom:8px;">Saldo Actual</div>
        <div style="font-size:48px;font-weight:bold;margin-bottom:16px;">${fmtMoney(saldoActual)}</div>
        <div style="display:flex;gap:16px;font-size:12px;">
          <div>
            <div style="opacity:0.8;">Saldo Inicial (18 ago)</div>
            <div style="font-size:18px;font-weight:bold;">$127.000</div>
          </div>
          <div>
            <div style="opacity:0.8;">Balance Mes</div>
            <div style="font-size:18px;font-weight:bold;color:${resumenMes.neto >= 0 ? '#fff' : '#FFB6C1'};">${fmtMoney(resumenMes.neto)}</div>
          </div>
        </div>
      </div>

      <!-- RESUMEN HOY -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:24px;">
        <div style="background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:16px;">
          <div style="opacity:0.7;font-size:12px;margin-bottom:4px;">Ingresos Hoy</div>
          <div style="font-size:24px;font-weight:bold;color:#1FAF74;">${fmtMoney(resumenHoy.ingresos)}</div>
        </div>
        <div style="background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:16px;">
          <div style="opacity:0.7;font-size:12px;margin-bottom:4px;">Gastos Hoy</div>
          <div style="font-size:24px;font-weight:bold;color:#f44336;">${fmtMoney(resumenHoy.gastos)}</div>
        </div>
        <div style="background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:16px;">
          <div style="opacity:0.7;font-size:12px;margin-bottom:4px;">Neto Hoy</div>
          <div style="font-size:24px;font-weight:bold;color:${resumenHoy.neto >= 0 ? '#1FAF74' : '#f44336'};">${fmtMoney(resumenHoy.neto)}</div>
        </div>
      </div>

      <!-- FORMULARIO RÁPIDO -->
      <div style="background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="font-weight:bold;margin-bottom:16px;">➕ Registrar Transacción</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <input type="text" id="desc-trans" placeholder="Descripción (ej: Comida en Mc Donald's)" style="padding:8px 12px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:inherit;font-size:13px;">
          <input type="number" id="monto-trans" placeholder="Monto" style="padding:8px 12px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:inherit;font-size:13px;">
          <select id="tipo-trans" style="padding:8px 12px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:inherit;font-size:13px;">
            <option value="gasto">📤 Gasto</option>
            <option value="ingreso">📥 Ingreso</option>
          </select>
          <select id="fuente-trans" style="padding:8px 12px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:inherit;font-size:13px;">
            <option value="nequi">Nequi</option>
            <option value="bancolombia">Bancolombia</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </div>
        <button data-act="transaccion-agregar" style="width:100%;margin-top:12px;padding:10px;background:#1FAF74;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">Registrar</button>
      </div>

      <!-- GRÁFICO DE CATEGORÍAS -->
      ${pieData.length > 0 ? `
        <div style="background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:20px;margin-bottom:24px;">
          <div style="font-weight:bold;margin-bottom:16px;">📊 Gastos Hoy por Categoría</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
            ${pieData.map((item, i) => `
              <div style="background:${colores[i % colores.length]};padding:12px;border-radius:8px;color:white;text-align:center;">
                <div style="font-size:24px;margin-bottom:4px;">${item.emoji}</div>
                <div style="font-size:11px;opacity:0.9;">${item.name}</div>
                <div style="font-size:16px;font-weight:bold;">${fmtMoney(item.value)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- RESUMEN MES -->
      <div style="background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="font-weight:bold;margin-bottom:16px;">📈 Resumen del Mes</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-size:13px;">
          <div>
            <div style="opacity:0.7;margin-bottom:4px;">Total Ingresos</div>
            <div style="font-size:20px;font-weight:bold;color:#1FAF74;">${fmtMoney(resumenMes.ingresos)}</div>
          </div>
          <div>
            <div style="opacity:0.7;margin-bottom:4px;">Total Gastos</div>
            <div style="font-size:20px;font-weight:bold;color:#f44336;">${fmtMoney(resumenMes.gastos)}</div>
          </div>
          <div>
            <div style="opacity:0.7;margin-bottom:4px;">Balance Mes</div>
            <div style="font-size:20px;font-weight:bold;color:${resumenMes.neto >= 0 ? '#1FAF74' : '#f44336'};">${fmtMoney(resumenMes.neto)}</div>
          </div>
        </div>
      </div>

      <!-- ÚLTIMAS TRANSACCIONES -->
      ${transacciones.length > 0 ? `
        <div style="background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:20px;">
          <div style="font-weight:bold;margin-bottom:16px;">📝 Últimas Transacciones</div>
          <div style="max-height:400px;overflow-y:auto;">
            ${transacciones.slice().reverse().slice(0, 10).map(t => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--line);">
                <div style="display:flex;align-items:center;gap:12px;min-width:0;">
                  <div style="font-size:20px;">${t.tipo === 'ingreso' ? '📥' : '📤'}</div>
                  <div style="min-width:0;">
                    <div style="font-size:13px;font-weight:500;">${obtenerEmoji(t.categoria)} ${escapeHtml(t.descripcion || 'Sin descripción')}</div>
                    <div style="font-size:11px;opacity:0.6;">${t.fecha}</div>
                  </div>
                </div>
                <div style="font-weight:bold;color:${t.tipo === 'ingreso' ? '#1FAF74' : '#f44336'};white-space:nowrap;">${t.tipo === 'ingreso' ? '+' : '-'}${fmtMoney(t.monto)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : '<div style="text-align:center;opacity:0.5;padding:32px;">Sin transacciones registradas</div>'}
    </main>
  `;
}
