import { escapeHtml } from '../lib/format.js';

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
