import { MARCAS, FAMILIAS_GUION, familiaDeFormato } from '../data/constants.js';
import { escapeHtml } from '../lib/format.js';

const FILTROS = [['todas', 'Todas'], ['brant', 'Brant'], ['bacu', 'Bacu'], ['novena', 'Novena']];

function tieneContenido(idea) {
  const g = idea.guion;
  if (!g) return false;
  if (g.items && g.items.length) return g.items.some(it => (it.principal || '').trim());
  return Object.keys(g).some(k => k !== 'items' && (g[k] || '').trim());
}

function cardHtml(i) {
  const M = MARCAS[i.marca];
  const listo = tieneContenido(i);
  return `
    <div class="idea-card" data-act="guion-abrir" data-id="${i.id}">
      <div class="idea-card-top">
        <span class="dot" style="width:9px;height:9px;background:${M.color}"></span>
        <span class="idea-marca">${escapeHtml(M.nombre)}</span>
      </div>
      <div class="idea-title">${escapeHtml(i.titulo || 'Sin título')}</div>
      <div class="idea-meta">${escapeHtml(i.formato)}</div>
      <span class="idea-val ${listo ? 'ok' : 'pend'}">${listo ? '✓ Guion iniciado' : '○ Guion vacío'}</span>
    </div>
  `;
}

export function renderDesarrollo(state) {
  const filtro = state.filtroDesarrollo;
  const ideas = state.ideas.filter(i => i.estado === 'desarrollo' && (filtro === 'todas' || i.marca === filtro || i.colab === filtro));

  const filtrosHtml = FILTROS.map(([v, label]) => `
    <button class="filtro-btn ${filtro === v ? 'active' : ''}" data-act="filtro-desarrollo-set" data-filtro="${v}">${label}</button>
  `).join('');

  const columnasHtml = Object.keys(FAMILIAS_GUION).map(key => {
    const fam = FAMILIAS_GUION[key];
    const items = ideas.filter(i => familiaDeFormato(i.formato) === key);
    const itemsHtml = items.length
      ? items.map(cardHtml).join('')
      : `<div class="col-empty">Vacío.<br>Nada de este tipo, todavía.</div>`;
    return `
      <div class="banco-col">
        <div class="banco-col-head">
          <span>${fam.label}</span>
          <span class="banco-col-count">${items.length}</span>
        </div>
        <div class="desarrollo-col-sub">${fam.descripcion}</div>
        <div class="banco-col-body">${itemsHtml}</div>
      </div>
    `;
  }).join('');

  return `
    <main class="banco desarrollo">
      <div class="banco-head">
        <h2 class="serif" style="margin:0;font-size:32px;">Desarrollo</h2>
        <div class="filtros">${filtrosHtml}</div>
      </div>
      <div class="vista-sub">Ideas en desarrollo, clasificadas por el tipo de guion que necesitan. Abre una para escribirlo.</div>
      <div class="desarrollo-grid">${columnasHtml}</div>
    </main>
  `;
}
