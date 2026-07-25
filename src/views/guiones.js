import { MARCAS, MESES, FAMILIAS_GUION, familiaDeFormato } from '../data/constants.js';
import { fmtFecha, escapeHtml } from '../lib/format.js';
import { valida } from '../lib/idea.js';

const FILTROS = [['todas', 'Todas'], ['brant', 'Brant'], ['bacu', 'Bacu'], ['novena', 'Novena']];
const VISTAS = [['general', 'Vista general'], ['tipo', 'Por tipo de guion']];
const COLUMNAS = [['desarrollo', 'En desarrollo'], ['lista', 'Lista para producir'], ['publicada', 'Publicada'], ['descartada', 'Descartada']];

function cardGeneral(i, calma) {
  const M = MARCAS[i.marca];
  const ok = valida(i);
  const metaParts = [i.formato];
  if (i.tiempo) metaParts.push(i.tiempo);
  if (i.fecha) metaParts.push('→ ' + fmtFecha(i.fecha, MESES));
  if (!calma && i.prioridad === 'Alta') metaParts.push('prioridad alta');
  const marcaTxt = M.nombre + (i.colab ? ' + ' + MARCAS[i.colab].nombre : '');
  const valClass = i.estado === 'descartada' ? 'no' : (ok ? 'ok' : 'pend');
  const valTxt = i.estado === 'descartada' ? 'No pasó el filtro' : (ok ? '✓ Validada' : '○ Sin validar');

  return `
    <div class="idea-card" data-act="idea-abrir" data-id="${escapeHtml(i.id)}">
      <div class="idea-card-top">
        <span class="dot" style="width:9px;height:9px;background:${M.color}"></span>
        <span class="idea-marca">${escapeHtml(marcaTxt)}</span>
      </div>
      <div class="idea-title">${escapeHtml(i.titulo || 'Sin título')}</div>
      <div class="idea-meta">${escapeHtml(metaParts.join(' · '))}</div>
      <span class="idea-val ${valClass}">${valTxt}</span>
    </div>
  `;
}

function tieneContenido(idea) {
  const g = idea.guion;
  if (!g) return false;
  if (g.items && g.items.length) return g.items.some(it => (it.principal || '').trim());
  return Object.keys(g).some(k => k !== 'items' && (g[k] || '').trim());
}

function cardTipo(i) {
  const M = MARCAS[i.marca];
  const listo = tieneContenido(i);
  return `
    <div class="idea-card" data-act="guion-abrir" data-id="${escapeHtml(i.id)}">
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

function renderGeneral(state, ideas) {
  const colsHtml = COLUMNAS.map(([estado, titulo]) => {
    const items = ideas.filter(i => i.estado === estado);
    const itemsHtml = items.length
      ? items.map(i => cardGeneral(i, state.modoCalma)).join('')
      : `<div class="col-empty">Vacío.<br>Mejor que mediocre.</div>`;
    return `
      <div class="banco-col">
        <div class="banco-col-head"><span>${titulo}</span><span class="banco-col-count">${items.length}</span></div>
        <div class="banco-col-body">${itemsHtml}</div>
      </div>
    `;
  }).join('');

  return `<div class="banco-grid">${colsHtml}</div>`;
}

function renderPorTipo(ideas) {
  const enDesarrollo = ideas.filter(i => i.estado === 'desarrollo');
  const columnasHtml = Object.keys(FAMILIAS_GUION).map(key => {
    const fam = FAMILIAS_GUION[key];
    const items = enDesarrollo.filter(i => familiaDeFormato(i.formato) === key);
    const itemsHtml = items.length
      ? items.map(cardTipo).join('')
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

  return `<div class="desarrollo-grid">${columnasHtml}</div>`;
}

export function renderGuiones(state) {
  const filtro = state.filtroGuiones;
  const ideas = state.ideas.filter(i => filtro === 'todas' || i.marca === filtro || i.colab === filtro);
  const vista = state.guionesVista || 'general';

  const vistaOpts = VISTAS.map(([v, label]) => `<option value="${v}" ${vista === v ? 'selected' : ''}>${label}</option>`).join('');
  const filtroOpts = FILTROS.map(([v, label]) => `<option value="${v}" ${filtro === v ? 'selected' : ''}>${label}</option>`).join('');

  const subtitulo = vista === 'tipo'
    ? 'Ideas en desarrollo, clasificadas por el tipo de guion que necesitan. Abre una para escribirlo.'
    : 'Todas las ideas, ordenadas por qué tan listas están para producirse.';
  const contenido = vista === 'tipo' ? renderPorTipo(ideas) : renderGeneral(state, ideas);

  return `
    <main class="banco ${vista === 'tipo' ? 'desarrollo' : ''}">
      <div class="banco-head">
        <h2 class="serif" style="margin:0;font-size:32px;">Guiones</h2>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <select class="vista-select" data-change="guiones-vista-set">${vistaOpts}</select>
          <div class="filtros"><select class="filtro-select" data-change="filtro-guiones-set">${filtroOpts}</select></div>
        </div>
      </div>
      <div class="vista-sub">${subtitulo}</div>
      ${contenido}
    </main>
  `;
}
