import { escapeHtml } from '../lib/format.js';
import { hoyStr } from '../lib/idea.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  return '$' + Math.abs(v).toLocaleString('es-CO');
}

// Emojis visuales para cada categoría — hacen las metas más reconocibles de un vistazo
const EMOJI_CATEGORIA = {
  camara: '📷', luces: '💡', edicion: '✂️', perifericos: '⌨️',
  deseo_vehiculo: '🚗', deseo_camara: '📸', deseo_otros: '🎁',
  personal: '🧠', destreza: '💪',
  logro_equipo: '✅', logro_hito: '🎯', logro: '⭐'
};

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

// Un paso suelto del plan de una meta — texto libre + su propio check, para que
// "alcanzar la meta" sea una serie de pasos marcables y no un solo check de golpe.
function pasoHtml(metaId, paso, idx) {
  const mid = escapeHtml(metaId);
  return `
    <div class="meta-paso ${paso.hecho ? 'hecho' : ''}">
      <button class="meta-paso-check" data-act="meta-paso-toggle" data-id="${mid}" data-idx="${idx}" title="${paso.hecho ? 'Marcar pendiente' : 'Marcar hecho'}">${paso.hecho ? '✓' : ''}</button>
      <input class="meta-paso-texto" data-change="meta-paso-texto" data-id="${mid}" data-idx="${idx}" value="${escapeHtml(paso.texto || '')}" placeholder="Paso del plan…">
      <button class="btn-text-muted meta-paso-quitar" data-act="meta-paso-eliminar" data-id="${mid}" data-idx="${idx}">✕</button>
    </div>
  `;
}

function metaHtml(m) {
  const pasos = m.pasos || [];
  const hechos = pasos.filter(p => p.hecho).length;
  const totalPasos = pasos.length;
  const progreso = totalPasos > 0 ? Math.round((hechos / totalPasos) * 100) : 0;
  const mid = escapeHtml(m.id);

  // Progreso en $ — independiente del de pasos de arriba (una meta puede tener las dos cosas,
  // o ninguna). Solo se muestra si se cargó un monto_objetivo; sin eso, la meta se queda como
  // el checklist de siempre.
  const objetivo = Number(m.monto_objetivo) || 0;
  const ahorrado = Number(m.monto_ahorrado) || 0;
  const faltante = Math.max(0, objetivo - ahorrado);
  const pctAhorro = objetivo > 0 ? Math.min(100, Math.round((ahorrado / objetivo) * 100)) : 0;
  let recomendacionSemanal = null;
  if (faltante > 0 && m.fecha) {
    const diasFaltan = Math.round((new Date(m.fecha + 'T00:00:00') - new Date(hoyStr() + 'T00:00:00')) / 86400000);
    if (diasFaltan > 0) recomendacionSemanal = faltante / Math.max(1, diasFaltan / 7);
  }

  // Usar emoji de la categoría, o extraer del título si existe
  let emoji = EMOJI_CATEGORIA[m.categoria] || '🎯';
  const titleMatch = m.titulo?.match(/^([\p{Emoji}])\s/u);
  if (titleMatch) emoji = titleMatch[1];

  return `
    <div class="meta-card ${m.cumplida ? 'cumplida' : ''}">
      <!-- Cabecera visual: emoji + título + controles -->
      <div class="meta-card-header">
        <div class="meta-emoji-titulo">
          <span class="meta-emoji">${emoji}</span>
          <input class="meta-titulo" data-change="meta-personal-titulo" data-id="${mid}" value="${escapeHtml(m.titulo)}" placeholder="Nombre…">
        </div>
        <div class="meta-controles">
          <input type="date" class="meta-fecha" data-change="meta-personal-fecha" data-id="${mid}" value="${escapeHtml(m.fecha || '')}" min="2026-01-01" placeholder="Fecha" title="Fecha objetivo">
          <button class="meta-check" data-act="meta-personal-toggle" data-id="${mid}" title="${m.cumplida ? 'Marcar pendiente' : 'Marcar cumplida'}">${m.cumplida ? '✓' : '○'}</button>
          <button class="btn-text-muted" data-act="meta-personal-eliminar" data-id="${mid}">✕</button>
        </div>
      </div>

      <!-- Barra de progreso (si hay pasos) -->
      ${totalPasos > 0 ? `
        <div class="meta-progreso-container">
          <div class="meta-barra-progreso">
            <div class="meta-barra-fill" style="width:${progreso}%;"></div>
          </div>
          <div class="meta-progreso-texto">${hechos}/${totalPasos} pasos</div>
        </div>
      ` : ''}

      <!-- Descripción de beneficio (campo de texto) -->
      <input type="text" class="meta-descripcion" data-change="meta-personal-descripcion" data-id="${mid}"
        value="${escapeHtml(m.descripcion || '')}" placeholder="ej: 8 horas de trabajo = comprar una luz">

      <!-- Ahorro en $ hacia esta meta — opcional, independiente del progreso por pasos -->
      <div style="display:flex;gap:8px;margin:10px 0;">
        <label style="flex:1;font-size:10px;letter-spacing:0.5px;text-transform:uppercase;opacity:0.6;">
          Objetivo $
          <input type="text" inputmode="numeric" data-change="meta-personal-monto-objetivo" data-id="${mid}"
            value="${objetivo ? fmtMoney(objetivo) : ''}" placeholder="ej: 4.000.000" style="display:block;width:100%;margin-top:3px;">
        </label>
        <label style="flex:1;font-size:10px;letter-spacing:0.5px;text-transform:uppercase;opacity:0.6;">
          Ahorrado $
          <input type="text" inputmode="numeric" data-change="meta-personal-monto-ahorrado" data-id="${mid}"
            value="${ahorrado ? fmtMoney(ahorrado) : ''}" placeholder="0" style="display:block;width:100%;margin-top:3px;">
        </label>
      </div>
      ${objetivo > 0 ? `
        <div class="meta-progreso-container">
          <div class="meta-barra-progreso">
            <div class="meta-barra-fill" style="width:${pctAhorro}%;background:var(--verde);"></div>
          </div>
          <div class="meta-progreso-texto">${fmtMoney(ahorrado)} / ${fmtMoney(objetivo)} · ${pctAhorro}%</div>
        </div>
        ${faltante <= 0
          ? `<div style="font-size:11px;color:var(--verde);margin-top:4px;">🎉 ¡Ya juntaste el objetivo!</div>`
          : recomendacionSemanal
            ? `<div style="font-size:11px;opacity:0.7;margin-top:4px;">Te faltan ${fmtMoney(faltante)} — necesitás ahorrar ~${fmtMoney(recomendacionSemanal)}/semana para llegar a tiempo (${escapeHtml(m.fecha)}).</div>`
            : `<div style="font-size:11px;opacity:0.7;margin-top:4px;">Te faltan ${fmtMoney(faltante)}${m.fecha ? ' — esa fecha ya pasó o es hoy.' : ' — poné una fecha objetivo para calcular cuánto ahorrar por semana.'}</div>`
        }
      ` : ''}

      <!-- La lista de pasos de abajo siempre se muestra completa, no hay estado de -->
      <!-- colapsado/expandido en ningún lado — este botón solo agrega un paso más. -->
      <!-- Antes decía "+ Ver pasos" pasados los 3 pasos, prometiendo un toggle que no existe. -->
      ${pasos.length > 0 ? `
        <div class="meta-pasos-toggle">
          <button class="meta-paso-agregar" data-act="meta-paso-agregar" data-id="${mid}">
            + Agregar paso
          </button>
        </div>
        <div class="meta-pasos">
          ${pasos.map((p, i) => pasoHtml(m.id, p, i)).join('')}
        </div>
      ` : `
        <button class="meta-paso-agregar" data-act="meta-paso-agregar" data-id="${mid}">+ Agregar pasos</button>
      `}
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
