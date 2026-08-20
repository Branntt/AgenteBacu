import { escapeHtml } from '../lib/format.js';

function fmtMoney(n) { return '$' + (Number(n) || 0).toLocaleString('es-CO'); }

function fmtFecha(f) {
  if (!f) return '';
  const [a, m, d] = String(f).split('-');
  return `${d}/${m}/${a}`;
}

// Las cuentas de cobro de UN cliente, con su total, cada una descargable, y el botón para
// hacerle una nueva.
//
// Es un solo bloque usado en los dos menús donde aparece un cliente —su ficha y Rodaje
// rápido— para que los dos se vean y funcionen igual. Antes la ficha decía "1 cuenta de
// cobro" como texto muerto: para verla había que salir, ir a Clientes › Por estado y abrir
// un historial que además mezclaba las de todos los clientes.
export function renderCuentasDeCliente(state, cliente) {
  if (!cliente) return '';

  const nombre = (cliente.nombre || '').trim().toLowerCase();
  const cuentas = (state.cuentasCobro || [])
    .filter(cc => cc.cliente_id === cliente.id || (cc.cliente_nombre || '').trim().toLowerCase() === nombre)
    .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));

  const total = cuentas.reduce((s, cc) => s + (Number(cc.total) || 0), 0);
  const sinCobrar = cuentas.filter(cc => !cc.pagada).reduce((s, cc) => s + (Number(cc.total) || 0), 0);
  const id = escapeHtml(cliente.id);

  return `
    <div class="cuentas-cliente">
      <div class="cuentas-cliente-head">
        <div>
          <div class="mono-label">Cuentas de cobro</div>
          <div class="cuentas-cliente-total">
            ${fmtMoney(total)} en ${cuentas.length} cuenta${cuentas.length === 1 ? '' : 's'}
            ${sinCobrar > 0 ? `<span class="cuentas-cliente-debe">· ${fmtMoney(sinCobrar)} sin cobrar</span>` : ''}
          </div>
        </div>
        <button class="btn-primary" data-act="cc-abrir" data-id="${id}">🧾 Nueva</button>
      </div>

      ${cuentas.length ? `
        <div class="cuentas-cliente-lista">
          ${cuentas.map(cc => `
            <div class="cuentas-cliente-fila">
              <div class="cuentas-cliente-datos">
                <span class="cuentas-cliente-num">${escapeHtml(cc.numero || 'sin número')}</span>
                <span class="cuentas-cliente-fecha">${fmtFecha(cc.fecha)}</span>
              </div>
              <span class="cuentas-cliente-monto ${cc.pagada ? 'pagada' : 'debe'}">${fmtMoney(cc.total)}${cc.pagada ? ' ✓' : ''}</span>
              <button class="btn-ghost cuentas-cliente-pdf" data-act="cc-historial-descargar" data-id="${escapeHtml(cc.id)}" title="Descargar PDF">PDF</button>
            </div>
          `).join('')}
        </div>
      ` : '<div class="cuentas-cliente-vacio">Todavía no le has hecho ninguna.</div>'}
    </div>
  `;
}
