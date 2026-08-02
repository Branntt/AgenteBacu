import { escapeHtml, fmtFecha } from '../lib/format.js';
import { renderPersonaje3DViewer } from '../components/personaje3d.js';
import { hoyStr, sumarDias } from '../lib/idea.js';
import { TIPOS_PERSONAL, TIPOS_ENERGIA, ESTADOS_CARGA, MESES } from '../data/constants.js';

const VISTAS_INV = [
  ['personal', '🎒 Personal'],
  ['tecnologia', '💻 Tecnología'],
  ['billetera', '👛 Personales'],
  ['habitacion', '🛏️ Habitación'],
  ['garaje', '🏍️ Garaje'],
  ['equipo', '🎬 Equipo'],
  ['carga', '🔋 Centro de Carga']
];

const CATEGORIAS_EQUIPO = [
  ['camara', '🎥 Cámara'],
  ['luz', '💡 Luz'],
  ['audio', '🎙️ Audio'],
  ['soporte', '🛠️ Soporte'],
  ['otro', '📦 Otro']
];

// Fila "⚡ Requiere energía" + tipo — reutilizada por items de metas_personales (Tecnología,
// Personales) y por equipo_produccion (Audiovisual), cada uno con su propio prefijo de
// data-change (ver energia-* cases en main.js). Solo marca QUÉ necesita energía y de qué tipo;
// el % / estado / última carga se editan en Centro de Carga, no acá, para no saturar esta fila.
function energiaFilaHtml(item, prefijo) {
  const requiere = !!item.requiere_energia;
  return `
    <div class="inv-item-energia">
      <label class="inv-energia-check">
        <input type="checkbox" data-change="${prefijo}-energia-requiere" data-id="${escapeHtml(item.id)}" ${requiere ? 'checked' : ''}>
        ⚡ Requiere energía
      </label>
      ${requiere ? `
        <select class="inv-tipo-select" data-change="${prefijo}-energia-tipo" data-id="${escapeHtml(item.id)}" title="Tipo de energía">
          <option value="">Tipo de energía…</option>
          ${TIPOS_ENERGIA.map(([v, emoji, label]) => `<option value="${v}" ${item.tipo_energia === v ? 'selected' : ''}>${emoji} ${label}</option>`).join('')}
        </select>
      ` : ''}
    </div>
  `;
}

// Un item del inventario. Vive en metas_personales con categoria inv_* ; cumplida = equipado.
// opts.equipable: además de ▲/▼, lo hace draggable (ver drag-and-drop en main.js).
// opts.conTipo: selector de categoría de ropa (TIPOS_PERSONAL) — solo Personal lo usa.
// opts.conEnergia: fila "requiere energía" — solo items de primer nivel en Tecnología/Personales.
function itemHtml(m, opts = {}) {
  const { equipable, conTipo, conEnergia } = opts;
  return `
    <div class="inv-item ${m.cumplida ? 'equipado' : ''}" ${equipable ? `draggable="true" data-id="${escapeHtml(m.id)}"` : ''}>
      ${equipable ? `<button class="inv-equipar" data-act="inv-equipar" data-id="${escapeHtml(m.id)}" title="${m.cumplida ? 'Quitar equipado' : 'Equipar'}">${m.cumplida ? '▼' : '▲'}</button>` : ''}
      <input class="inv-nombre" data-change="meta-personal-titulo" data-id="${escapeHtml(m.id)}" value="${escapeHtml(m.titulo)}" placeholder="Nombre del item…">
      ${conTipo ? `
        <select class="inv-tipo-select" data-change="meta-personal-tipo" data-id="${escapeHtml(m.id)}" title="Categoría">
          ${TIPOS_PERSONAL.map(([v, emoji, label]) => `<option value="${v}" ${(m.tipo || 'otro') === v ? 'selected' : ''}>${emoji} ${label}</option>`).join('')}
        </select>
      ` : ''}
      <button class="inv-quitar" data-act="meta-personal-eliminar" data-id="${escapeHtml(m.id)}" title="Eliminar">✕</button>
    </div>
    ${conEnergia ? energiaFilaHtml(m, 'meta') : ''}
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
      ${g.items.map(m => itemHtml(m, { equipable: true, conTipo: true })).join('')}
    </div>
  `;
  const ladoIzqHtml = gruposEquipados.filter((_, i) => i % 2 === 0).map(grupoEquipadoHtml).join('') || '<div class="empty-note">Nada equipado</div>';
  const ladoDerHtml = gruposEquipados.filter((_, i) => i % 2 === 1).map(grupoEquipadoHtml).join('') || '<div class="empty-note">Nada equipado</div>';

  // El personaje 3D es el único "avatar" — se soltó el avatar SVG simple (a pedido del
  // usuario, 2026-08-01). Si todavía no existe ninguno, renderPersonaje3DViewer ya se encarga
  // de mostrar el estado vacío con el botón "Crear personaje 3D (beta)", no hace falta un
  // camino aparte acá.
  const centroHtml = renderPersonaje3DViewer(state);

  // Mochila: un apartado fijo por cada categoría (aunque esté vacía, para poder ir
  // llenándola) — "Otro" al final agrupa lo que no encaje en ninguna de las anteriores.
  const mochilaCategoriasHtml = TIPOS_PERSONAL.map(([tipo, emoji, label]) => {
    const itemsTipo = mochila.filter(m => (m.tipo || 'otro') === tipo);
    return `
      <div class="inv-categoria">
        <div class="inv-categoria-titulo">${emoji} ${label}</div>
        <div class="inv-grid">
          ${itemsTipo.map(m => itemHtml(m, { equipable: true, conTipo: true })).join('')}
          <button class="inv-slot-add" data-act="inv-agregar" data-value="personal" data-tipo="${tipo}">+ ${label}</button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="inv-escena" data-drop="equipar">
      <div class="inv-lado">${ladoIzqHtml}</div>
      ${centroHtml}
      <div class="inv-lado">${ladoDerHtml}</div>
    </div>

    ${state.avatarGlbUrl ? `
      <div class="vista-sub" style="margin-top:-20px;margin-bottom:24px;">Personaje 3D (beta) — ya queda guardado en este navegador/dispositivo. Todavía no se pone encima la ropa del inventario automáticamente, eso necesitaría piezas de ropa en 3D que hoy no existen.</div>
    ` : ''}

    <div class="section-title">Mochila — objetos personales</div>
    <div class="vista-sub">Tu ropa y objetos personales, por categoría. Arrastrá un item sobre el personaje para equiparlo (o soltalo acá para devolverlo a la mochila) — ▲/▼ hacen lo mismo si no podés arrastrar (celular).</div>
    <div class="inv-categorias" data-drop="mochila">
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
      ${items.map(m => itemHtml(m, {})).join('')}
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

// Tecnología y Personales (billetera) comparten esta forma: items de primer nivel que pueden
// contener piezas adentro (ej. "Computador de Mesa" → Ryzen 5, RAM, fuente...; "Cartera" →
// cédula, tarjetas...). Un solo nivel de anidamiento (parent_id), no hijos-de-hijos — ver
// supabase-migracion-item-parent.sql. Los hijos no tienen ni tipo ni energía propia, esas
// cosas se marcan en el item padre (el computador completo "requiere energía", no cada pieza).
function itemConHijosHtml(item, todos, categoriaValue) {
  const hijos = todos.filter(h => h.parent_id === item.id);
  return `
    <div class="inv-item-padre">
      ${itemHtml(item, { conEnergia: true })}
      ${hijos.length ? `<div class="inv-item-hijos">${hijos.map(h => itemHtml(h, {})).join('')}</div>` : ''}
      <button class="inv-slot-add inv-slot-add-hijo" data-act="inv-agregar" data-value="${categoriaValue}" data-parent="${escapeHtml(item.id)}">+ pieza adentro</button>
    </div>
  `;
}

function renderConHijos(items, categoriaValue, emoji, titulo, descripcion, labelAgregar) {
  const raiz = items.filter(m => !m.parent_id);
  return `
    <div class="section-title">${emoji} ${titulo}</div>
    <div class="vista-sub">${descripcion}</div>
    <div class="inv-grid">
      ${raiz.map(m => itemConHijosHtml(m, items, categoriaValue)).join('')}
      <button class="inv-slot-add" data-act="inv-agregar" data-value="${categoriaValue}">+ ${labelAgregar}</button>
    </div>
  `;
}

// Cámaras, luces, audio y soporte del estudio — a diferencia del resto de Inventario
// (que es "¿es mío?"), acá lo que importa es "¿quién lo tiene ahora mismo?". Vive en su
// propia tabla equipo_produccion, no en metas_personales. Es también la única fuente para el
// grupo "Audiovisual" del inventario personal — no se duplica Sony A6400/DJI RS4/etc. como
// items nuevos en metas_personales, a pedido explícito del usuario (2026-08-01).
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
      ${energiaFilaHtml(e, 'equipo')}
    </div>
  `;
}

function renderEquipo(items) {
  const disponibles = items.filter(e => !(e.prestado_a || '').trim()).length;
  return `
    <div class="section-title">🎬 Equipo de producción</div>
    <div class="vista-sub">Cámaras, luces, audio y soporte del estudio — quién tiene qué en este momento. También es la fuente del equipo audiovisual que aparece en 🔋 Centro de Carga.</div>
    ${items.length ? `<div class="mono-label" style="margin-bottom:12px;">${disponibles} de ${items.length} disponibles ahora</div>` : ''}
    <div class="equipo-lista">
      ${items.length ? items.map(equipoItemHtml).join('') : '<div class="empty-note">Nada registrado todavía.</div>'}
    </div>
    <button class="inv-slot-add" data-act="equipo-nuevo" style="margin-top:10px;">+ Equipo</button>
  `;
}

// ---------------- Centro de Carga ----------------
// Junta lo marcado "requiere energía" en metas_personales (Tecnología/Personales) y en
// equipo_produccion (Audiovisual) — nunca se agrega nada acá a mano, es 100% derivado de esa
// marca en el item original (ver energiaFilaHtml arriba). "tabla" queda pegado a cada fila
// para saber qué prefijo de data-change usar (meta-energia-* / equipo-energia-*, ver main.js).
function itemsConEnergia(state) {
  const deMetas = (state.metasPersonales || [])
    .filter(m => m.requiere_energia)
    .map(m => ({ id: m.id, nombre: m.titulo, tipoEnergia: m.tipo_energia, carga: m.carga_porcentaje, estado: m.estado_carga, ultimaCarga: m.ultima_carga, tabla: 'meta' }));
  const deEquipo = (state.equipoProduccion || [])
    .filter(e => e.requiere_energia)
    .map(e => ({ id: e.id, nombre: e.nombre, tipoEnergia: e.tipo_energia, carga: e.carga_porcentaje, estado: e.estado_carga, ultimaCarga: e.ultima_carga, tabla: 'equipo' }));
  return deMetas.concat(deEquipo);
}

function colorDeCarga(pct) {
  if (pct >= 60) return 'var(--verde)';
  if (pct >= 30) return 'var(--amarillo)';
  return 'var(--rojo)';
}

function cargaCardHtml(it) {
  const tipoInfo = TIPOS_ENERGIA.find(([v]) => v === it.tipoEnergia);
  const estadoInfo = ESTADOS_CARGA.find(([v]) => v === it.estado);
  const pct = (it.carga === null || it.carga === undefined) ? null : Math.max(0, Math.min(100, it.carga));
  return `
    <div class="carga-card">
      <div class="carga-card-top">
        <span class="carga-card-nombre">${escapeHtml(it.nombre || '(sin nombre)')}</span>
        <span class="mono-label">${tipoInfo ? tipoInfo[1] + ' ' + tipoInfo[2] : 'Sin tipo de energía'}</span>
      </div>
      ${pct !== null ? `
        <div class="carga-barra"><div class="carga-barra-fill" style="width:${pct}%;background:${colorDeCarga(pct)};"></div></div>
      ` : '<div class="empty-note">Sin porcentaje registrado</div>'}
      <div class="carga-card-fila">
        <input type="number" min="0" max="100" class="carga-input-pct" data-change="${it.tabla}-energia-carga" data-id="${escapeHtml(it.id)}" value="${pct === null ? '' : pct}" placeholder="%">
        <select data-change="${it.tabla}-energia-estado" data-id="${escapeHtml(it.id)}">
          <option value="">Estado…</option>
          ${ESTADOS_CARGA.map(([v, emoji, label]) => `<option value="${v}" ${it.estado === v ? 'selected' : ''}>${emoji} ${label}</option>`).join('')}
        </select>
      </div>
      <div class="carga-card-fila">
        <span class="mono-label">${estadoInfo ? estadoInfo[1] + ' ' + estadoInfo[2] : '⚪ Sin estado'}</span>
        <input type="date" class="carga-input-fecha" data-change="${it.tabla}-energia-ultima-carga" data-id="${escapeHtml(it.id)}" value="${it.ultimaCarga || ''}" title="Última carga">
      </div>
    </div>
  `;
}

// Alertas: batería baja, estado problemático, o mucho tiempo sin cargarse (14 días — ver nota
// en CLAUDE.md, es un umbral fijo elegido a mano, no configurable todavía).
function alertasCarga(items, hoy) {
  const alertas = [];
  items.forEach(it => {
    const nombre = it.nombre || 'Un item';
    if (it.carga !== null && it.carga !== undefined && it.carga < 30) {
      alertas.push(`🔴 ${escapeHtml(nombre)} está al ${it.carga}%`);
    }
    if (['descargado', 'sin_bateria', 'requiere_pilas'].includes(it.estado)) {
      const info = ESTADOS_CARGA.find(([v]) => v === it.estado);
      alertas.push(`${info[1]} ${escapeHtml(nombre)}: ${info[2].toLowerCase()}`);
    }
    if (it.ultimaCarga) {
      const dias = Math.round((new Date(hoy) - new Date(it.ultimaCarga)) / 86400000);
      if (dias > 14) alertas.push(`⏱️ ${escapeHtml(nombre)} sin cargarse hace ${dias} días`);
    }
  });
  return alertas;
}

// No hay (ni puede haber, sin datos de qué equipo va a cada rodaje) un chequeo item-por-item
// contra un rodaje específico — esto es más simple: si hay un rodaje en los próximos 7 días Y
// algo marcado con energía no está "listo", se avisa en general. Ver pregunta al usuario del
// 2026-08-01 sobre el alcance de este módulo.
function proximoRodajeConflicto(ideas, items, hoy) {
  const limite = sumarDias(hoy, 7);
  const proximo = (ideas || [])
    .filter(i => i.fechaRodaje && i.fechaRodaje >= hoy && i.fechaRodaje <= limite)
    .sort((a, b) => a.fechaRodaje.localeCompare(b.fechaRodaje))[0];
  if (!proximo) return null;
  const noListos = items.filter(it => it.estado !== 'listo' && (it.estado || (it.carga !== null && it.carga !== undefined && it.carga < 100)));
  if (!noListos.length) return null;
  return { proximo, noListos };
}

function renderCentroCarga(state) {
  const hoy = hoyStr();
  const items = itemsConEnergia(state);
  const alertas = alertasCarga(items, hoy);
  const conflicto = proximoRodajeConflicto(state.ideas, items, hoy);
  const listos = items.filter(it => it.estado === 'listo').length;

  if (!items.length) {
    return `
      <div class="section-title">🔋 Centro de Carga</div>
      <div class="vista-sub">Acá aparece automáticamente todo lo que marques "⚡ Requiere energía" en Tecnología, Personales o Equipo — nada se agrega a mano acá.</div>
      <div class="empty-note">Todavía no marcaste ningún objeto como "requiere energía".</div>
    `;
  }

  return `
    <div class="section-title">🔋 Centro de Carga</div>
    <div class="vista-sub">Todo lo que necesita energía, en un solo lugar — para saber en 10 segundos si está listo para una producción.</div>

    <div class="mono-label" style="margin-bottom:16px;">${listos} de ${items.length} listos para grabar</div>

    ${conflicto ? `
      <div class="carga-alerta carga-alerta-rodaje">⚠️ Tenés un rodaje el ${fmtFecha(conflicto.proximo.fechaRodaje, MESES)} ("${escapeHtml(conflicto.proximo.titulo || 'sin título')}") y ${conflicto.noListos.length} objeto${conflicto.noListos.length === 1 ? ' no está listo' : 's no están listos'} — el equipo audiovisual no está listo para la producción.</div>
    ` : ''}

    ${alertas.length ? `
      <div class="carga-alertas">
        ${alertas.map(a => `<div class="carga-alerta">${a}</div>`).join('')}
      </div>
    ` : ''}

    <div class="carga-grid">
      ${items.map(cargaCardHtml).join('')}
    </div>
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
  else if (vista === 'tecnologia') contenido = renderConHijos(items('tecnologia'), 'tecnologia', '💻', 'Tecnología', 'Tus equipos de cómputo y electrónica — abrí una pieza adentro de otra (ej. las partes del computador de mesa).', 'Equipo');
  else if (vista === 'billetera') contenido = renderConHijos(items('billetera'), 'billetera', '👛', 'Personales', 'Documentos, tarjetas y lo que cargás encima — metelos dentro de otro item (ej. lo que hay dentro de la cartera).', 'Item');
  else if (vista === 'equipo') contenido = renderEquipo(state.equipoProduccion || []);
  else if (vista === 'carga') contenido = renderCentroCarga(state);
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
