import { escapeHtml } from '../lib/format.js';

// Detalle de una clase del horario fijo — se abre al tocar una entrada "is-clase" en el
// calendario (data-act="clase-info" en views/calendario.js). Antes ese botón no tenía
// handler y no pasaba nada al tocarlo; en vista de Mes además el profesor/salón se ocultan
// por espacio (ver .cal-grid .cal-entry.is-clase .cal-entry-meta en main.css), así que este
// drawer es la única forma de verlos ahí. Puramente informativo: el horario fijo se define
// en data/constants.js, no se edita desde la app.
export function renderClaseInfo(state) {
  const c = state.claseInfo;
  if (!c) return '';
  return `
    <div class="drawer-overlay">
      <div class="drawer-backdrop" data-act="clase-info-cerrar"></div>
      <div class="drawer" role="dialog" aria-modal="true" aria-label="Detalle de clase">
        <div class="drawer-top">
          <span class="chip">🎓 Horario fijo</span>
          <button class="btn-close" data-act="clase-info-cerrar">✕</button>
        </div>
        <div class="field">
          <label class="field-label">Materia</label>
          <div style="font-size:16px;font-weight:bold;">${escapeHtml(c.materia)}</div>
        </div>
        <div class="field-row-2">
          <div class="field">
            <label class="field-label">Horario</label>
            <div>${escapeHtml(c.horaInicio)}–${escapeHtml(c.horaFin)}</div>
          </div>
          <div class="field">
            <label class="field-label">Profesor</label>
            <div>${escapeHtml(c.profesor)}</div>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Lugar</label>
          <div>Salón ${escapeHtml(c.salon)} · ${escapeHtml(c.lugar)}</div>
        </div>
        <div class="panel-footnote" style="margin:0;">Horario fijo del semestre, de solo lectura acá.</div>
      </div>
    </div>
  `;
}
