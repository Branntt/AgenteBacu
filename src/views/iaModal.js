import { MARCAS } from '../data/constants.js';
import { escapeHtml } from '../lib/format.js';

function renderIdeaPreview(idea) {
  return `
    <div class="idea-card" style="margin-bottom:10px;">
      <div class="idea-card-top">
        <span class="dot" style="width:9px;height:9px;background:${MARCAS[idea.marca || 'brant'].color}"></span>
        <span class="idea-marca">${escapeHtml(MARCAS[idea.marca || 'brant'].nombre)}</span>
      </div>
      <div class="idea-title">${escapeHtml(idea.titulo || 'Sin título')}</div>
      <div class="idea-meta">${escapeHtml(idea.formato)}</div>
    </div>
  `;
}

export function renderIAModal(state) {
  const D = state.iaDraft;
  if (!D) return '';

  const marcaOpts = Object.entries(MARCAS).map(([k, v]) => `<option value="${k}" ${D.marca === k ? 'selected' : ''}>${v.nombre}</option>`).join('');
  const modos = [['idea', '1 idea'], ['quincena', 'Quincena completa (7)']];
  const modoOpts = modos.map(([v, label]) => `<option value="${v}" ${D.modo === v ? 'selected' : ''}>${label}</option>`).join('');

  const resultado = state.iaResultado;
  const contenidoResultado = resultado ? `
    <div style="margin-top:20px;">
      <h3 style="margin:0 0 10px 0;">Ideas generadas:</h3>
      ${resultado.map(renderIdeaPreview).join('')}
      <button class="btn-primary" style="width:100%;margin-top:10px;" data-act="ia-confirmar" ${state.iaBusy ? 'disabled' : ''}>
        Confirmar y crear
      </button>
    </div>
  ` : '';

  const errorMsg = state.iaError ? `<div style="color:var(--rojo);margin:10px 0;">${escapeHtml(state.iaError)}</div>` : '';

  return `
    <div class="drawer-overlay" data-act="ia-cerrar">
      <div class="drawer" data-no-nav="true">
        <div class="drawer-head">
          <h3 style="margin:0;">Generar ideas con IA</h3>
          <button class="close-btn" data-act="ia-cerrar">✕</button>
        </div>
        <div class="drawer-body">
          <label>Marca:</label>
          <select data-change="ia-set-marca" style="width:100%;margin-bottom:15px;">
            ${marcaOpts}
          </select>

          <label>Modo de generación:</label>
          <select data-change="ia-set-modo" style="width:100%;margin-bottom:15px;">
            ${modoOpts}
          </select>

          <label>Tema o brief (opcional):</label>
          <textarea
            data-change="ia-set-tema"
            style="width:100%;height:60px;margin-bottom:15px;padding:8px;border:1px solid var(--border);border-radius:4px;font-family:inherit;"
            placeholder="Ejemplo: Hacer un reel sobre productividad con ángulo de procrastinación"
          >${escapeHtml(D.tema || '')}</textarea>

          <label>Formato específico (opcional):</label>
          <input
            type="text"
            data-change="ia-set-formato"
            style="width:100%;margin-bottom:15px;padding:8px;border:1px solid var(--border);border-radius:4px;"
            placeholder="Ej: Reel, Carrusel, Fotografía"
            value="${escapeHtml(D.formato || '')}"
          />

          ${errorMsg}

          <button class="btn-primary" style="width:100%;" data-act="ia-generar" ${state.iaBusy ? 'disabled' : ''}>
            ${state.iaBusy ? 'Generando...' : '✦ Generar'}
          </button>

          ${contenidoResultado}
        </div>
      </div>
    </div>
  `;
}
