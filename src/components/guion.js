import { MARCAS, FAMILIAS_GUION, familiaDeFormato } from '../data/constants.js';
import { escapeHtml } from '../lib/format.js';

function camposFijosHtml(idea, fam) {
  const g = idea.guion || {};
  return fam.campos.map(c => `
    <div class="field">
      <label class="field-label">${escapeHtml(c.label)}</label>
      <textarea class="nota-field" data-change="guion-campo" data-id="${idea.id}" data-campo="${c.key}" rows="${c.key === 'cuerpo' ? 6 : 2}" placeholder="${escapeHtml(c.placeholder)}">${escapeHtml(g[c.key] || '')}</textarea>
    </div>
  `).join('');
}

function notasHtml(idea, fam) {
  const g = idea.guion || {};
  return `
    <div class="field">
      <label class="field-label">${escapeHtml(fam.notas.label)}</label>
      <textarea class="nota-field" data-change="guion-campo" data-id="${idea.id}" data-campo="notas" rows="5" placeholder="${escapeHtml(fam.notas.placeholder)}">${escapeHtml(g.notas || '')}</textarea>
    </div>
  `;
}

function itemsHtml(idea, fam) {
  const items = (idea.guion || {}).items || [];
  const rows = items.length ? items.map((it, idx) => `
    <div class="guion-item">
      <div class="guion-item-head">
        <span class="mono-label" style="margin-bottom:0;">${fam.itemLabel} ${idx + 1}</span>
        <button class="btn-text-muted" data-act="guion-item-quitar" data-id="${idea.id}" data-idx="${idx}">Quitar</button>
      </div>
      <input value="${escapeHtml(it.principal || '')}" data-change="guion-item-campo" data-id="${idea.id}" data-idx="${idx}" data-campo="principal" placeholder="${escapeHtml(fam.campoPrincipal.placeholder)}">
      <input value="${escapeHtml(it.secundario || '')}" data-change="guion-item-campo" data-id="${idea.id}" data-idx="${idx}" data-campo="secundario" placeholder="${escapeHtml(fam.campoSecundario.placeholder)}">
    </div>
  `).join('') : `<div class="col-empty">Todavía no hay ${fam.itemLabel.toLowerCase()}s.</div>`;

  return `
    <div class="field">
      <label class="field-label">${escapeHtml(fam.label)}</label>
      <div class="guion-items">${rows}</div>
      <button class="btn-ghost" data-act="guion-item-agregar" data-id="${idea.id}">+ ${fam.itemLabel}</button>
    </div>
  `;
}

export function renderGuion(state) {
  const idea = state.ideas.find(i => i.id === state.guionId);
  if (!idea) return '';

  const fam = FAMILIAS_GUION[familiaDeFormato(idea.formato)];
  const M = MARCAS[idea.marca];
  const cuerpo = fam.notas ? notasHtml(idea, fam) : (fam.campos ? camposFijosHtml(idea, fam) : itemsHtml(idea, fam));

  return `
    <div class="drawer-overlay">
      <div class="drawer-backdrop" data-act="guion-cerrar"></div>
      <div class="drawer" role="dialog" aria-modal="true" aria-label="Editor de guion">
        <div class="drawer-top">
          <span class="chip"><span class="dot" style="width:8px;height:8px;background:${M.color};margin-right:6px;"></span>${escapeHtml(M.nombre)} · ${escapeHtml(idea.formato)}</span>
          <button class="btn-close" data-act="guion-cerrar">✕</button>
        </div>

        <div class="field">
          <label class="field-label">Idea</label>
          <div class="rule-text" style="font-size:19px;">${escapeHtml(idea.titulo || 'Sin título')}</div>
        </div>

        <div class="panel-footnote" style="margin-top:0;">${escapeHtml(fam.descripcion)}</div>

        ${cuerpo}

        <div class="drawer-footer">
          <span class="mono-label" style="margin-bottom:0;">Estado actual: ${idea.estado === 'desarrollo' ? 'En desarrollo' : idea.estado}</span>
          <button class="btn-primary" data-act="guion-marcar-lista" data-id="${idea.id}">Marcar lista para producir</button>
        </div>
      </div>
    </div>
  `;
}
