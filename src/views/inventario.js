import { escapeHtml } from '../lib/format.js';
import { renderAvatarSVG, renderAvatarEditor } from '../components/avatar.js';

const VISTAS_INV = [
  ['personal', '🎒 Personal'],
  ['habitacion', '🛏️ Habitación'],
  ['garaje', '🏍️ Garaje'],
  ['equipo', '🎬 Equipo']
];

const CATEGORIAS_EQUIPO = [
  ['camara', '🎥 Cámara'],
  ['luz', '💡 Luz'],
  ['audio', '🎙️ Audio'],
  ['soporte', '🛠️ Soporte'],
  ['otro', '📦 Otro']
];

// Un item del inventario. Vive en metas_personales con categoria inv_* ; cumplida = equipado.
function itemHtml(m, equipable) {
  return `
    <div class="inv-item ${m.cumplida ? 'equipado' : ''}">
      ${equipable ? `<button class="inv-equipar" data-act="inv-equipar" data-id="${escapeHtml(m.id)}" title="${m.cumplida ? 'Quitar equipado' : 'Equipar'}">${m.cumplida ? '▼' : '▲'}</button>` : ''}
      <input class="inv-nombre" data-change="meta-personal-titulo" data-id="${escapeHtml(m.id)}" value="${escapeHtml(m.titulo)}" placeholder="Nombre del item…">
      <button class="inv-quitar" data-act="meta-personal-eliminar" data-id="${escapeHtml(m.id)}" title="Eliminar">✕</button>
    </div>
  `;
}

function renderPersonal(items, state) {
  const equipados = items.filter(m => m.cumplida);
  const mochila = items.filter(m => !m.cumplida);
  const izq = equipados.filter((_, i) => i % 2 === 0);
  const der = equipados.filter((_, i) => i % 2 === 1);

  return `
    <div class="inv-escena">
      <div class="inv-lado">${izq.map(m => itemHtml(m, true)).join('') || '<div class="empty-note">Nada equipado</div>'}</div>
      <div class="inv-avatar">
        <div class="inv-avatar-figura">${renderAvatarSVG(state.avatar, 150)}</div>
        <div class="inv-avatar-nombre mono-label">BRANDON</div>
        <div class="inv-avatar-sub">${equipados.length} equipado${equipados.length === 1 ? '' : 's'}</div>
        <button class="btn-ghost" data-act="avatar-editor-toggle" style="margin-top:10px;font-size:11px;padding:7px 12px;min-height:0;">
          ${state.avatarEditor ? 'Listo' : '✎ Personalizar'}
        </button>
      </div>
      <div class="inv-lado">${der.map(m => itemHtml(m, true)).join('') || '<div class="empty-note">Nada equipado</div>'}</div>
    </div>

    ${state.avatarEditor ? renderAvatarEditor(state.avatar) : ''}

    <div class="section-title">Mochila — objetos personales</div>
    <div class="vista-sub">Tu ropa y objetos personales. ▲ equipa el item (aparece a tu lado), ▼ lo devuelve a la mochila.</div>
    <div class="inv-grid">
      ${mochila.map(m => itemHtml(m, true)).join('')}
      <button class="inv-slot-add" data-act="inv-agregar" data-value="personal">+ Item</button>
    </div>

    <div style="margin-top:32px;">
      <button class="btn-ghost" data-act="inv-vista" data-value="garaje">🏍️ Ir al garaje — ver la moto</button>
    </div>
  `;
}

function renderHabitacion(items) {
  return `
    <div class="section-title">🛏️ Mi habitación</div>
    <div class="vista-sub">Los objetos de la habitación que son míos.</div>
    <div class="inv-grid">
      ${items.map(m => itemHtml(m, false)).join('')}
      <button class="inv-slot-add" data-act="inv-agregar" data-value="habitacion">+ Objeto</button>
    </div>
  `;
}

function renderGaraje(items) {
  return `
    <div class="section-title">🏍️ Garaje</div>
    <div class="vista-sub">Tus vehículos.</div>
    <div class="inv-garaje-grid">
      ${items.map(m => `
        <div class="inv-vehiculo">
          <div class="inv-vehiculo-icono">🏍️</div>
          <input class="inv-nombre" data-change="meta-personal-titulo" data-id="${escapeHtml(m.id)}" value="${escapeHtml(m.titulo)}" placeholder="Vehículo…" style="text-align:center;font-weight:bold;">
          <button class="inv-quitar" data-act="meta-personal-eliminar" data-id="${escapeHtml(m.id)}" title="Eliminar">✕</button>
        </div>
      `).join('')}
      <button class="inv-slot-add" data-act="inv-agregar" data-value="garaje" style="min-height:120px;">+ Vehículo</button>
    </div>
  `;
}

// Cámaras, luces, audio y soporte del estudio — a diferencia del resto de Inventario
// (que es "¿es mío?"), acá lo que importa es "¿quién lo tiene ahora mismo?". Vive en su
// propia tabla equipo_produccion, no en metas_personales.
function equipoItemHtml(e) {
  const prestado = !!(e.prestado_a || '').trim();
  return `
    <div class="equipo-card ${prestado ? 'prestado' : ''}">
      <div class="equipo-fila">
        <select class="equipo-categoria" data-change="equipo-categoria" data-id="${escapeHtml(e.id)}">
          ${CATEGORIAS_EQUIPO.map(([v, label]) => `<option value="${v}" ${e.categoria === v ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
        <input class="equipo-nombre" data-change="equipo-nombre" data-id="${escapeHtml(e.id)}" value="${escapeHtml(e.nombre || '')}" placeholder="Nombre del equipo…">
        <button class="btn-text-muted" data-act="equipo-eliminar" data-id="${escapeHtml(e.id)}" title="Eliminar">✕</button>
      </div>
      <div class="equipo-fila">
        <span class="equipo-estado ${prestado ? 'rojo' : 'verde'}">${prestado ? '● Prestado' : '● Disponible'}</span>
        <input class="equipo-prestado" data-change="equipo-prestado" data-id="${escapeHtml(e.id)}" value="${escapeHtml(e.prestado_a || '')}" placeholder="¿A quién o en qué rodaje? (vacío = disponible)">
      </div>
    </div>
  `;
}

function renderEquipo(items) {
  const disponibles = items.filter(e => !(e.prestado_a || '').trim()).length;
  return `
    <div class="section-title">🎬 Equipo de producción</div>
    <div class="vista-sub">Cámaras, luces, audio y soporte del estudio — quién tiene qué en este momento.</div>
    ${items.length ? `<div class="mono-label" style="margin-bottom:12px;">${disponibles} de ${items.length} disponibles ahora</div>` : ''}
    <div class="equipo-lista">
      ${items.length ? items.map(equipoItemHtml).join('') : '<div class="empty-note">Nada registrado todavía.</div>'}
    </div>
    <button class="inv-slot-add" data-act="equipo-nuevo" style="margin-top:10px;">+ Equipo</button>
  `;
}

export function renderInventario(state) {
  const vista = state.invVista || 'personal';
  const items = cat => (state.metasPersonales || []).filter(m => m.categoria === 'inv_' + cat);

  const tabsHtml = VISTAS_INV.map(([v, label]) => `
    <button class="inv-tab ${vista === v ? 'active' : ''}" data-act="inv-vista" data-value="${v}">${label}</button>
  `).join('');

  let contenido;
  if (vista === 'habitacion') contenido = renderHabitacion(items('habitacion'));
  else if (vista === 'garaje') contenido = renderGaraje(items('garaje'));
  else if (vista === 'equipo') contenido = renderEquipo(state.equipoProduccion || []);
  else contenido = renderPersonal(items('personal'), state);

  return `
    <main class="inventario">
      <h2 class="serif" style="margin:0 0 6px;font-size:32px;">Inventario</h2>
      <div class="vista-sub">Los items de tu vida: se ponen, se quitan, se equipan.</div>
      <div class="inv-tabs">${tabsHtml}</div>
      ${contenido}
    </main>
  `;
}
