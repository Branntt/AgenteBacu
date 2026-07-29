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

// soloTipo: 'entrada' | 'salida' | null — filtra la tabla y fija el tipo del
// formulario rápido, para las pestañas de Ingresos/Gastos en Financiamiento.
export function renderTablaFinanzas(movimientos, soloTipo = null) {
  const todos = (movimientos || []).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const mov = soloTipo ? todos.filter(m => m.tipo === soloTipo) : todos;

  let balance = 0;
  const movConBalance = mov.map(m => {
    const valor = m.tipo === 'entrada' ? Number(m.monto) || 0 : -(Number(m.monto) || 0);
    balance += valor;
    return { ...m, balance };
  });

  const totalEntradas = mov.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + (Number(m.monto) || 0), 0);
  const totalSalidas = mov.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + (Number(m.monto) || 0), 0);
  const balanceFinal = totalEntradas - totalSalidas;
  const colorTipo = soloTipo === 'entrada' ? 'var(--verde)' : 'var(--rojo)';

  const titulo = soloTipo === 'entrada' ? '💵 Registro de ingresos' : soloTipo === 'salida' ? '💸 Registro de gastos' : '📊 Registro de Finanzas (La verdad absoluta)';

  const tipoFieldHtml = soloTipo ? `<input type="hidden" data-change="mov-tipo" value="${soloTipo}">` : `
    <div>
      <label style="font-size:11px;opacity:0.7;">Tipo</label>
      <select data-change="mov-tipo" style="width:100%;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:inherit;font-family:inherit;font-size:12px;">
        <option value="entrada">Entrada</option>
        <option value="salida">Salida</option>
      </select>
    </div>
  `;

  const fuenteFieldHtml = `
    <div>
      <label style="font-size:11px;opacity:0.7;">Fuente</label>
      <select data-change="mov-fuente" style="width:100%;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:inherit;font-family:inherit;font-size:12px;">
        <option value="bancolombia">Bancolombia</option>
        <option value="nequi">Nequi</option>
        <option value="efectivo">Efectivo</option>
      </select>
    </div>
  `;

  const filaCampos = soloTipo ? '110px 1fr 110px 120px auto' : '110px 160px 110px 110px 120px auto';

  const columnasTabla = soloTipo ? `
    <th>Fecha</th>
    <th>Concepto</th>
    <th style="text-align:right;color:${colorTipo};">Monto</th>
    <th style="text-align:right;color:var(--azul);font-weight:bold;">Acumulado</th>
    <th></th>
  ` : `
    <th>Fecha</th>
    <th>Concepto</th>
    <th style="text-align:right;color:var(--verde);">Entrada</th>
    <th style="text-align:right;color:var(--rojo);">Salida</th>
    <th style="text-align:right;color:var(--azul);font-weight:bold;">Balance</th>
    <th></th>
  `;

  const filaHtml = m => soloTipo ? `
    <tr class="tabla-row">
      <td class="tabla-fecha">${fmtFecha(m.fecha)}</td>
      <td class="tabla-concepto">${escapeHtml(m.nota || 'Sin descripción')}</td>
      <td style="text-align:right;color:${colorTipo};">${fmtMoney(m.monto)}</td>
      <td class="tabla-balance" style="text-align:right;font-weight:bold;color:var(--azul);">${fmtMoney(m.balance)}</td>
      <td class="tabla-acciones-row"><button class="btn-text-muted" data-act="movimiento-eliminar" data-id="${escapeHtml(m.id)}" style="font-size:12px;">✕</button></td>
    </tr>
  ` : `
    <tr class="tabla-row">
      <td class="tabla-fecha">${fmtFecha(m.fecha)}</td>
      <td class="tabla-concepto">${escapeHtml(m.nota || 'Sin descripción')}</td>
      <td class="tabla-entrada" style="text-align:right;color:var(--verde);">${m.tipo === 'entrada' ? fmtMoney(m.monto) : '—'}</td>
      <td class="tabla-salida" style="text-align:right;color:var(--rojo);">${m.tipo === 'salida' ? fmtMoney(m.monto) : '—'}</td>
      <td class="tabla-balance" style="text-align:right;font-weight:bold;color:${m.balance >= 0 ? 'var(--azul)' : 'var(--rojo)'};">${fmtMoney(m.balance)}</td>
      <td class="tabla-acciones-row"><button class="btn-text-muted" data-act="movimiento-eliminar" data-id="${escapeHtml(m.id)}" style="font-size:12px;">✕</button></td>
    </tr>
  `;

  const totalesHtml = soloTipo ? `
    <div class="tabla-totales">
      <div class="total-card" style="border:2px solid ${colorTipo};">
        <div class="total-label">${soloTipo === 'entrada' ? 'Total Ingresos' : 'Total Gastos'}</div>
        <div class="total-valor" style="font-size:24px;color:${colorTipo};">${fmtMoney(soloTipo === 'entrada' ? totalEntradas : totalSalidas)}</div>
      </div>
    </div>
  ` : `
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
  `;

  return `
    <div class="tabla-finanzas">
      <div class="tabla-titulo">${titulo}</div>
      <div class="tabla-subtitulo">Cada movimiento de dinero se registra aquí inmediatamente</div>

      <!-- FORMULARIO DE REGISTRO -->
      <div style="background:rgba(33,150,243,0.1);padding:16px;border-radius:8px;margin-bottom:16px;">
        <div style="font-size:13px;font-weight:bold;margin-bottom:12px;color:var(--azul);">📝 Registrar ${soloTipo === 'entrada' ? 'ingreso' : soloTipo === 'salida' ? 'gasto' : 'movimiento'}</div>
        <div style="display:grid;grid-template-columns:${filaCampos};gap:10px;align-items:end;">
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
          ${tipoFieldHtml}
          ${fuenteFieldHtml}
          <button class="btn-primary" data-act="movimiento-agregar-rapido" style="white-space:nowrap;font-size:12px;padding:6px 12px;">Guardar</button>
        </div>
      </div>

      <div class="tabla-container">
        <table class="tabla-movimientos">
          <thead><tr>${columnasTabla}</tr></thead>
          <tbody>${movConBalance.map(filaHtml).join('')}</tbody>
        </table>
      </div>

      ${totalesHtml}
    </div>
  `;
}
