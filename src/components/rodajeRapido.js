import { MARCAS } from '../data/constants.js';
import { escapeHtml } from '../lib/format.js';

export function renderRodajeRapido(state) {
  const D = state.rodajeDraft;
  if (!D) return '';

  const marcaOpts = Object.keys(MARCAS).map(k => `<option value="${k}" ${D.marca === k ? 'selected' : ''}>${MARCAS[k].nombre}</option>`).join('');

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
            <input type="date" data-change="rodaje-rapido-campo" data-campo="fecha" value="${escapeHtml(D.fecha)}" style="color-scheme:dark;">
          </div>
        </div>

        <div class="panel-footnote" style="margin-top:0;">Se crea como "Cubrimiento" en Desarrollo — sin guion, solo notas de qué no perderse. Podés completar el resto después.</div>

        <div class="drawer-footer">
          <button class="btn-ghost" data-act="rodaje-rapido-cerrar">Cancelar</button>
          <button class="btn-primary" data-act="rodaje-rapido-guardar">Agendar rodaje</button>
        </div>
      </div>
    </div>
  `;
}
