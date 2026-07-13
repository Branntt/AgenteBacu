import { escapeHtml } from '../lib/format.js';
import { CONCEPTOS_COBRO } from '../data/constants.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  return v ? '$' + v.toLocaleString('es-CO') : '';
}

export function renderCuentaCobro(state) {
  const D = state.cuentaCobroDraft;
  if (!D) return '';

  const total = D.items.reduce((sum, it) => sum + (Number(it.cantidad) || 1) * (Number(it.valor) || 0), 0);

  const conceptosHtml = idx => CONCEPTOS_COBRO.map(c => `<button type="button" class="cc-concepto-chip" data-act="cc-item-concepto" data-idx="${idx}" data-value="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');

  const itemsHtml = D.items.map((it, idx) => `
    <div class="cc-item">
      <input class="cc-desc" data-change="cc-item-campo" data-idx="${idx}" data-campo="descripcion" value="${escapeHtml(it.descripcion)}" placeholder="Ej. Producción de video profesional">
      <input class="cc-cant" data-change="cc-item-campo" data-idx="${idx}" data-campo="cantidad" value="${escapeHtml(it.cantidad)}" inputmode="numeric" placeholder="Cant.">
      <input class="cc-valor" data-change="cc-item-campo" data-idx="${idx}" data-campo="valor" value="${escapeHtml(it.valor)}" inputmode="numeric" placeholder="Valor unitario">
      ${D.items.length > 1 ? `<button class="btn-text-muted" data-act="cc-item-quitar" data-idx="${idx}">✕</button>` : '<span></span>'}
    </div>
    <div class="cc-conceptos">${conceptosHtml(idx)}</div>
  `).join('');

  return `
    <div class="drawer-overlay">
      <div class="drawer-backdrop" data-act="cc-cerrar"></div>
      <div class="drawer cuenta-cobro" role="dialog" aria-modal="true" aria-label="Cuenta de cobro">
        <div class="drawer-top">
          <span class="chip">Cuenta de cobro</span>
          <button class="btn-close" data-act="cc-cerrar">✕</button>
        </div>

        <div class="field-row-2">
          <div class="field">
            <label class="field-label">Cliente</label>
            <input data-change="cc-campo" data-campo="clienteNombre" value="${escapeHtml(D.clienteNombre)}" placeholder="Nombre del cliente">
          </div>
          <div class="field">
            <label class="field-label">C.C. / NIT</label>
            <input data-change="cc-campo" data-campo="documento" value="${escapeHtml(D.documento)}" placeholder="Número de documento">
          </div>
        </div>

        <div class="field-row-2">
          <div class="field">
            <label class="field-label">Fecha</label>
            <input type="date" data-change="cc-campo" data-campo="fecha" value="${escapeHtml(D.fecha)}" style="color-scheme:dark;">
          </div>
          <div class="field">
            <label class="field-label">Vence (opcional)</label>
            <input type="date" data-change="cc-campo" data-campo="fechaVencimiento" value="${escapeHtml(D.fechaVencimiento || '')}" style="color-scheme:dark;">
          </div>
        </div>

        <div class="field">
          <label class="field-label">Ítems — descripción, cantidad y valor unitario</label>
          <div class="cc-items">${itemsHtml}</div>
          <button class="btn-ghost" data-act="cc-item-agregar">+ Ítem</button>
        </div>

        <div class="cc-total">
          <span>Total</span>
          <span class="cc-total-valor">${fmtMoney(total) || '$0'}</span>
        </div>

        <div class="field">
          <label class="field-label">Observaciones</label>
          <textarea data-change="cc-campo" data-campo="observaciones" rows="2">${escapeHtml(D.observaciones || '')}</textarea>
        </div>

        <div class="panel-footnote" style="margin-top:0;">Se genera el PDF con tus datos de emisor ya cargados y se descarga al instante.</div>

        <div class="drawer-footer">
          <button class="btn-ghost" data-act="cc-cerrar">Cancelar</button>
          <button class="btn-primary" data-act="cc-generar">Generar PDF</button>
        </div>
      </div>
    </div>
  `;
}
