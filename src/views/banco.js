import { MARCAS, MESES } from '../data/constants.js';
import { fmtFecha, escapeHtml } from '../lib/format.js';
import { valida } from '../lib/idea.js';

const FILTROS = [['todas', 'Todas'], ['brant', 'Brant'], ['bacu', 'Bacu'], ['novena', 'Novena']];
const COLUMNAS = [['desarrollo', 'En desarrollo'], ['lista', 'Lista para producir'], ['publicada', 'Publicada'], ['descartada', 'Descartada']];

function cardHtml(i, calma) {
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
    <div class="idea-card" data-act="idea-abrir" data-id="${i.id}">
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

export function renderBanco(state) {
  const ideas = state.ideas;
  const filtradas = ideas.filter(i => state.filtro === 'todas' || i.marca === state.filtro || i.colab === state.filtro);

  const filtrosHtml = FILTROS.map(([v, label]) => `
    <button class="filtro-btn ${state.filtro === v ? 'active' : ''}" data-act="filtro-set" data-filtro="${v}">${label}</button>
  `).join('');

  const colsHtml = COLUMNAS.map(([estado, titulo]) => {
    const items = filtradas.filter(i => i.estado === estado);
    const itemsHtml = items.length
      ? items.map(i => cardHtml(i, state.modoCalma)).join('')
      : `<div class="col-empty">Vacío.<br>Mejor que mediocre.</div>`;
    return `
      <div class="banco-col">
        <div class="banco-col-head"><span>${titulo}</span><span class="banco-col-count">${items.length}</span></div>
        <div class="banco-col-body">${itemsHtml}</div>
      </div>
    `;
  }).join('');

  return `
    <main class="banco">
      <div class="banco-head">
        <h2 class="serif" style="margin:0;font-size:32px;">Banco de ideas</h2>
        <div class="filtros">${filtrosHtml}</div>
      </div>
      <div class="vista-sub">Todas las ideas, ordenadas por qué tan listas están para producirse.</div>
      <div class="banco-grid">${colsHtml}</div>
    </main>
  `;
}
