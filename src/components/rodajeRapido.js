import { MARCAS } from '../data/constants.js';
import { escapeHtml } from '../lib/format.js';
import { ATTRS_AUTOCOMPLETAR, clientePorNombre } from './datalistClientes.js';

export function renderRodajeRapido(state) {
  const D = state.rodajeDraft;
  if (!D) return '';

  const marcaOpts = Object.keys(MARCAS).map(k => `<option value="${k}" ${D.marca === k ? 'selected' : ''}>${MARCAS[k].nombre}</option>`).join('');

  // Si el cliente escrito ya existe, se muestra lo suyo igual que en su ficha: cuánto se le
  // ha facturado, y el botón para hacerle una cuenta de cobro sin salir de acá. Antes había
  // que agendar el rodaje, buscarlo en Clientes y abrirlo, para llegar al mismo sitio.
  const clienteExistente = clientePorNombre(state.clientes, D.empresa);
  const cuentasCliente = clienteExistente
    ? (state.cuentasCobro || []).filter(cc => cc.cliente_id === clienteExistente.id)
    : [];
  const totalCliente = cuentasCliente.reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);

  return `
    <div class="drawer-overlay">
      <div class="drawer-backdrop" data-act="rodaje-rapido-cerrar"></div>
      <div class="drawer rodaje-rapido" role="dialog" aria-modal="true" aria-label="Rodaje rápido">
        <div class="drawer-top">
          <span class="chip">Rodaje rápido</span>
          <button class="btn-close" data-act="rodaje-rapido-cerrar">✕</button>
        </div>

        <div class="field">
          <label class="field-label">Qué se graba</label>
          <input data-change="rodaje-rapido-campo" data-campo="titulo" value="${escapeHtml(D.titulo)}" placeholder="Ej. Cubrimiento show de La Doncella" autofocus>
        </div>

        <div class="field-row-2">
          <div class="field">
            <label class="field-label">Marca</label>
            <select data-change="rodaje-rapido-campo" data-campo="marca">${marcaOpts}</select>
          </div>
          <div class="field">
            <label class="field-label">Fecha de rodaje</label>
            <input type="date" data-change="rodaje-rapido-campo" data-campo="fecha" value="${escapeHtml(D.fecha)}" min="2026-01-01" style="color-scheme:dark;">
          </div>
        </div>

        <div class="field">
          <label class="field-label">Cliente (opcional)</label>
          <input data-change="rodaje-rapido-campo" data-campo="empresa" value="${escapeHtml(D.empresa || '')}" placeholder="Nombre de la empresa o persona" ${ATTRS_AUTOCOMPLETAR}>
        </div>

        <div class="field-row-2">
          <div class="field">
            <label class="field-label">C.C. / NIT</label>
            <input data-change="rodaje-rapido-campo" data-campo="documento" value="${escapeHtml(D.documento || '')}" placeholder="Opcional">
          </div>
          <div class="field">
            <label class="field-label">Precio del trabajo</label>
            <input data-change="rodaje-rapido-campo" data-campo="precio" value="${D.precio ? String(D.precio) : ''}" inputmode="numeric" placeholder="Ej. 350000">
          </div>
        </div>

        ${cuentasCliente.length ? `<div class="panel-footnote" style="margin:-8px 0 16px;">Facturado en total: $${totalCliente.toLocaleString('es-CO')} · ${cuentasCliente.length} cuenta${cuentasCliente.length === 1 ? '' : 's'} de cobro</div>` : ''}

        ${clienteExistente ? `
          <button class="btn-ghost" data-act="cc-abrir" data-id="${escapeHtml(clienteExistente.id)}" style="width:100%;margin-bottom:14px;">🧾 Cuenta de cobro de ${escapeHtml(clienteExistente.nombre)}</button>
        ` : ''}

        <div class="panel-footnote" style="margin-top:0;">Se crea como "Cubrimiento" en Desarrollo — sin guion, solo notas de qué no perderse. Si pones cliente y precio, se agrega a Clientes (sumando si ya existe) y se genera la cuenta de cobro en PDF.</div>

        <div class="drawer-footer">
          <button class="btn-ghost" data-act="rodaje-rapido-cerrar">Cancelar</button>
          <button class="btn-primary" data-act="rodaje-rapido-guardar">Agendar rodaje</button>
        </div>
      </div>
    </div>
  `;
}
