import { escapeHtml } from '../lib/format.js';

// Grupos de la pestaña Metas. Cada categoría es una columna dentro de su grupo.
const GRUPOS = [
  {
    clave: 'equipo', titulo: '🎥 Mejora de equipo', sub: 'Lo que falta para el estudio',
    categorias: [
      ['camara', 'Cámara'],
      ['luces', 'Luces'],
      ['edicion', 'Edición'],
      ['perifericos', 'Periféricos']
    ]
  },
  {
    clave: 'deseos', titulo: '✨ Lo que quiero', sub: 'Carros, motos, cámaras — lo que me compraría',
    categorias: [
      ['deseo_vehiculo', 'Vehículos'],
      ['deseo_camara', 'Cámaras'],
      ['deseo_otros', 'Otros deseos']
    ]
  },
  {
    clave: 'crecer', titulo: '🌱 Crecimiento', sub: 'Personal y destrezas',
    categorias: [
      ['personal', 'Personal'],
      ['destreza', 'Destrezas']
    ]
  },
  {
    clave: 'logros', titulo: '🏆 Logros', sub: 'Lo que ya conseguiste, categorizado',
    categorias: [
      ['logro_equipo', 'Equipo comprado'],
      ['logro_hito', 'Hitos'],
      ['logro', 'Otros logros']
    ]
  }
];

function metaHtml(m) {
  return `
    <div class="meta-personal ${m.cumplida ? 'cumplida' : ''}">
      <button class="meta-check" data-act="meta-personal-toggle" data-id="${escapeHtml(m.id)}" title="${m.cumplida ? 'Marcar pendiente' : 'Marcar cumplida'}">${m.cumplida ? '✓' : ''}</button>
      <input class="meta-titulo" data-change="meta-personal-titulo" data-id="${escapeHtml(m.id)}" value="${escapeHtml(m.titulo)}" placeholder="Nombre…">
      <input type="date" class="meta-fecha" data-change="meta-personal-fecha" data-id="${escapeHtml(m.id)}" value="${escapeHtml(m.fecha || '')}" min="2026-01-01" style="color-scheme:dark;">
      <button class="btn-text-muted" data-act="meta-personal-eliminar" data-id="${escapeHtml(m.id)}">✕</button>
    </div>
  `;
}

function columnaHtml(cat, label, metas) {
  // 'personal' absorbe las metas viejas de categoría 'objeto'
  const items = metas.filter(m => m.categoria === cat || (cat === 'personal' && m.categoria === 'objeto'));
  return `
    <div class="metas-columna">
      <div class="metas-columna-head">
        <span class="mono-label" style="margin-bottom:0;">${label}</span>
        <button class="btn-text-muted" data-act="meta-personal-nueva" data-categoria="${cat}">+ Agregar</button>
      </div>
      <div class="metas-lista">${items.length ? items.map(metaHtml).join('') : '<div class="empty-note">Nada por aquí todavía.</div>'}</div>
    </div>
  `;
}

export function renderMetas(state) {
  const metas = state.metasPersonales || [];

  // Excluir categorías que no son metas (inventario, hábitos)
  const totalMetas = metas.filter(m => !(m.categoria || '').startsWith('inv_') && m.categoria !== 'habito');
  const cumplidas = totalMetas.filter(m => m.cumplida).length;

  const gruposHtml = GRUPOS.map(g => `
    <div class="metas-grupo">
      <div class="metas-grupo-head">
        <div class="section-title" style="margin-bottom:2px;">${g.titulo}</div>
        <div class="vista-sub" style="margin:0;">${g.sub}</div>
      </div>
      <div class="metas-grid">
        ${g.categorias.map(([cat, label]) => columnaHtml(cat, label, metas)).join('')}
      </div>
    </div>
  `).join('');

  return `
    <main class="metas-view">
      <h2 class="serif" style="margin:0 0 6px;font-size:32px;">Metas</h2>
      <div class="vista-sub">Lo que quiero, lo que estoy construyendo y lo que ya logré.</div>

      <div class="metas-resumen">
        <div class="metas-resumen-valor verde">${cumplidas}</div>
        <div class="metas-resumen-label">de ${totalMetas.length} metas cumplidas</div>
      </div>

      ${gruposHtml}
    </main>
  `;
}
