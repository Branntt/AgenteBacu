import { escapeHtml } from '../lib/format.js';
import { renderAvatarSVG, renderAvatarEditor } from '../components/avatar.js';
import { renderPersonaje3DViewer } from '../components/personaje3d.js';
import { TIPOS_PERSONAL } from '../data/constants.js';

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
// conTipo (solo en Personal) agrega el selector de categoría — Habitación/Garaje no lo usan.
function itemHtml(m, equipable, conTipo) {
  return `
    <div class="inv-item ${m.cumplida ? 'equipado' : ''}">
      ${equipable ? `<button class="inv-equipar" data-act="inv-equipar" data-id="${escapeHtml(m.id)}" title="${m.cumplida ? 'Quitar equipado' : 'Equipar'}">${m.cumplida ? '▼' : '▲'}</button>` : ''}
      <input class="inv-nombre" data-change="meta-personal-titulo" data-id="${escapeHtml(m.id)}" value="${escapeHtml(m.titulo)}" placeholder="Nombre del item…">
      ${conTipo ? `
        <select class="inv-tipo-select" data-change="meta-personal-tipo" data-id="${escapeHtml(m.id)}" title="Categoría">
          ${TIPOS_PERSONAL.map(([v, emoji, label]) => `<option value="${v}" ${(m.tipo || 'otro') === v ? 'selected' : ''}>${emoji} ${label}</option>`).join('')}
        </select>
      ` : ''}
      <button class="inv-quitar" data-act="meta-personal-eliminar" data-id="${escapeHtml(m.id)}" title="Eliminar">✕</button>
    </div>
  `;
}

function renderPersonal(items, state) {
  const equipados = items.filter(m => m.cumplida);
  const mochila = items.filter(m => !m.cumplida);

  // Junto al personaje: solo las categorías con algo puesto (para no llenar la vitrina de
  // etiquetas vacías), agrupadas por tipo y repartidas alternadamente a cada lado.
  const gruposEquipados = TIPOS_PERSONAL
    .map(([tipo, emoji, label]) => ({ tipo, emoji, label, items: equipados.filter(m => (m.tipo || 'otro') === tipo) }))
    .filter(g => g.items.length);
  const grupoEquipadoHtml = g => `
    <div class="inv-categoria-mini">
      <div class="inv-categoria-mini-titulo">${g.emoji} ${g.label}</div>
      ${g.items.map(m => itemHtml(m, true, true)).join('')}
    </div>
  `;
  const ladoIzqHtml = gruposEquipados.filter((_, i) => i % 2 === 0).map(grupoEquipadoHtml).join('') || '<div class="empty-note">Nada equipado</div>';
  const ladoDerHtml = gruposEquipados.filter((_, i) => i % 2 === 1).map(grupoEquipadoHtml).join('') || '<div class="empty-note">Nada equipado</div>';

  // Un solo lugar para "el avatar": si ya existe un personaje 3D guardado, ocupa el centro
  // de la vitrina (con los mismos objetos equipados a los lados); si no, se ve el avatar
  // SVG de siempre con un acceso para probar el 3D. No son dos secciones separadas.
  const tienePersonaje3D = !!state.avatarGlbUrl;
  const centroHtml = tienePersonaje3D ? renderPersonaje3DViewer(state) : `
    <div class="inv-avatar">
      <div class="inv-avatar-figura">${renderAvatarSVG(state.avatar, 150)}</div>
      <div class="inv-avatar-nombre mono-label">BRANDON</div>
      <div class="inv-avatar-sub">${equipados.length} equipado${equipados.length === 1 ? '' : 's'}</div>
      <div class="personaje3d-botones">
        <button class="btn-ghost" data-act="avatar-editor-toggle" style="min-height:0;font-size:11px;padding:7px 12px;">${state.avatarEditor ? 'Listo' : '✎ Personalizar'}</button>
        <button class="btn-ghost" data-act="personaje3d-abrir" style="min-height:0;font-size:11px;padding:7px 12px;">🧍 Probar en 3D (beta)</button>
      </div>
    </div>
  `;

  // Mochila: un apartado fijo por cada categoría (aunque esté vacía, para poder ir
  // llenándola) — "Otro" al final agrupa lo que no encaje en ninguna de las anteriores.
  const mochilaCategoriasHtml = TIPOS_PERSONAL.map(([tipo, emoji, label]) => {
    const itemsTipo = mochila.filter(m => (m.tipo || 'otro') === tipo);
    return `
      <div class="inv-categoria">
        <div class="inv-categoria-titulo">${emoji} ${label}</div>
        <div class="inv-grid">
          ${itemsTipo.map(m => itemHtml(m, true, true)).join('')}
          <button class="inv-slot-add" data-act="inv-agregar" data-value="personal" data-tipo="${tipo}">+ ${label}</button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="inv-escena">
      <div class="inv-lado">${ladoIzqHtml}</div>
      ${centroHtml}
      <div class="inv-lado">${ladoDerHtml}</div>
    </div>

    ${tienePersonaje3D ? `
      <div class="vista-sub" style="margin-top:-20px;margin-bottom:24px;">Personaje 3D (beta) — ya queda guardado en este navegador/dispositivo. Todavía no se pone encima la ropa del inventario automáticamente, eso necesitaría piezas de ropa en 3D que hoy no existen.</div>
    ` : (state.avatarEditor ? renderAvatarEditor(state.avatar) : '')}

    <div class="section-title">Mochila — objetos personales</div>
    <div class="vista-sub">Tu ropa y objetos personales, por categoría. ▲ equipa el item (aparece a tu lado), ▼ lo devuelve a la mochila.</div>
    <div class="inv-categorias">
      ${mochilaCategoriasHtml}
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
