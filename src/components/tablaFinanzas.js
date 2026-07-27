import { escapeHtml } from '../lib/format.js';
import { hoyStr } from '../lib/idea.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  return '$' + Math.abs(v).toLocaleString('es-CO');
}

function fmtFecha(fecha) {
  if (!fecha) return '';
  const [año, mes, día] = fecha.split('-');
  return `${día}/${mes}`;
}

export function renderTablaFinanzas(movimientos) {
  const mov = (movimientos || []).sort((a, b) => b.fecha.localeCompare(a.fecha));

  let balance = 0;
  const movConBalance = mov.map(m => {
    const valor = m.tipo === 'entrada' ? Number(m.monto) || 0 : -(Number(m.monto) || 0);
    balance += valor;
    return { ...m, balance };
  });

  const totalEntradas = mov.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + (Number(m.monto) || 0), 0);
  const totalSalidas = mov.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + (Number(m.monto) || 0), 0);
  const balanceFinal = totalEntradas - totalSalidas;

  return `
    <div class="tabla-finanzas">
      <div class="tabla-titulo">📊 Registro de Finanzas (La verdad absoluta)</div>
      <div class="tabla-subtitulo">Cada movimiento de dinero se registra aquí inmediatamente</div>

      <!-- FORMULARIO DE REGISTRO -->
      <div style="background:rgba(33,150,243,0.1);padding:16px;border-radius:8px;margin-bottom:16px;">
        <div style="font-size:13px;font-weight:bold;margin-bottom:12px;color:var(--azul);">📝 Registrar Movimiento</div>
        <div style="display:grid;grid-template-columns:110px 180px 110px 110px auto;gap:10px;align-items:end;">
          <div>
            <label style="font-size:11px;opacity:0.7;">Fecha</label>
            <input type="date" data-change="mov-fecha" value="${hoyStr()}" style="width:100%;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:inherit;font-family:inherit;font-size:12px;" />
          </div>
          <div>
            <label style="font-size:11px;opacity:0.7;">Concepto</label>
            <input type="text" data-change="mov-nota" placeholder="Ej: Comida..." style="width:100%;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:inherit;font-family:inherit;font-size:12px;" />
          </div>
          <div>
            <label style="font-size:11px;opacity:0.7;">Monto</label>
            <input type="number" data-change="mov-monto" placeholder="0" min="0" step="100" style="width:100%;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:inherit;font-family:inherit;font-size:12px;" />
          </div>
          <div>
            <label style="font-size:11px;opacity:0.7;">Tipo</label>
            <select data-change="mov-tipo" style="width:100%;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:inherit;font-family:inherit;font-size:12px;">
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
          </div>
          <button class="btn-primary" data-act="movimiento-agregar-rapido" style="white-space:nowrap;font-size:12px;padding:6px 12px;">Guardar</button>
        </div>
      </div>

      <div class="tabla-container">
        <table class="tabla-movimientos">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th style="text-align:right;color:var(--verde);">Entrada</th>
              <th style="text-align:right;color:var(--rojo);">Salida</th>
              <th style="text-align:right;color:var(--azul);font-weight:bold;">Balance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${movConBalance.map(m => `
              <tr class="tabla-row">
                <td class="tabla-fecha">${fmtFecha(m.fecha)}</td>
                <td class="tabla-concepto">${escapeHtml(m.nota || 'Sin descripción')}</td>
                <td class="tabla-entrada" style="text-align:right;color:var(--verde);">
                  ${m.tipo === 'entrada' ? fmtMoney(m.monto) : '—'}
                </td>
                <td class="tabla-salida" style="text-align:right;color:var(--rojo);">
                  ${m.tipo === 'salida' ? fmtMoney(m.monto) : '—'}
                </td>
                <td class="tabla-balance" style="text-align:right;font-weight:bold;color:${m.balance >= 0 ? 'var(--azul)' : 'var(--rojo)'};">
                  ${fmtMoney(m.balance)}
                </td>
                <td class="tabla-acciones-row">
                  <button class="btn-text-muted" data-act="movimiento-eliminar" data-id="${escapeHtml(m.id)}" style="font-size:12px;">✕</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="tabla-totales">
        <div class="total-card">
          <div class="total-label">Total Entradas</div>
          <div class="total-valor" style="color:var(--verde);">${fmtMoney(totalEntradas)}</div>
        </div>
        <div class="total-card">
          <div class="total-label">Total Salidas</div>
          <div class="total-valor" style="color:var(--rojo);">${fmtMoney(totalSalidas)}</div>
        </div>
        <div class="total-card" style="border:2px solid var(--azul);">
          <div class="total-label">Balance Final</div>
          <div class="total-valor" style="font-size:24px;color:var(--azul);">${fmtMoney(balanceFinal)}</div>
        </div>
      </div>
    </div>
  `;
}
