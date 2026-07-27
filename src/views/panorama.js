import { MARCAS, PREGUNTAS, PIPELINE, MESES, CATEGORIAS_META, COLORES_TAREA, ENFOQUE } from '../data/constants.js';
import { fmtFecha, fmtNum, escapeHtml } from '../lib/format.js';
import { hoyStr, lunesDe, sumarDias } from '../lib/idea.js';
import { calcularFinanciamiento } from '../lib/financiamiento.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('es-CO');
}

// Aproximación de "cómo va la semana": no mide estado de ánimo, mide señales de organización
// ya presentes en los datos — cuánto hay programado y cuántas prioridades altas siguen sin fecha.
function calcularOrganizacionSemana(ideas) {
  const hoy = hoyStr();
  const inicioSemana = lunesDe(hoy);
  const finSemana = sumarDias(inicioSemana, 6);
  const enRango = f => f && f >= inicioSemana && f <= finSemana;
  const estaSemana = ideas.filter(i => i.estado !== 'descartada' && (enRango(i.fecha) || enRango(i.fechaRodaje))).length;
  const prioridadSinFecha = ideas.filter(i => i.prioridad === 'Alta' && i.estado !== 'publicada' && i.estado !== 'descartada' && !i.fecha).length;

  let label = 'Al día', clase = 'ok';
  if (prioridadSinFecha >= 3) { label = 'Cargado'; clase = 'alto'; }
  else if (prioridadSinFecha >= 1) { label = 'Con pendientes'; clase = 'medio'; }

  return { estaSemana, prioridadSinFecha, label, clase };
}

function tareaCintaHtml(t) {
  const color = COLORES_TAREA[t.color] || COLORES_TAREA.verde;
  return `
    <div class="tarea-cinta ${t.hecha ? 'hecha' : ''}" style="background:${color};">
      <button class="tarea-check" data-act="tarea-toggle" data-id="${escapeHtml(t.id)}" title="${t.hecha ? 'Marcar pendiente' : 'Marcar hecha'}">${t.hecha ? '✓' : ''}</button>
      <input class="tarea-texto" data-change="tarea-texto" data-id="${escapeHtml(t.id)}" value="${escapeHtml(t.texto)}" placeholder="¿Qué hay que hacer?">
      <input type="date" class="tarea-fecha" data-change="tarea-fecha" data-id="${escapeHtml(t.id)}" value="${escapeHtml(t.fecha || '')}" min="2026-01-01" title="Fecha de entrega (aparece en el Calendario)" style="color-scheme:dark;">
      <button class="tarea-quitar" data-act="tarea-eliminar" data-id="${escapeHtml(t.id)}" title="Quitar">✕</button>
    </div>
  `;
}

function metaPersonalHtml(m) {
  return `
    <div class="meta-personal ${m.cumplida ? 'cumplida' : ''}">
      <button class="meta-check" data-act="meta-personal-toggle" data-id="${escapeHtml(m.id)}" title="${m.cumplida ? 'Marcar pendiente' : 'Marcar cumplida'}">${m.cumplida ? '✓' : ''}</button>
      <input class="meta-titulo" data-change="meta-personal-titulo" data-id="${escapeHtml(m.id)}" value="${escapeHtml(m.titulo)}" placeholder="Nombre de la meta">
      <input type="date" class="meta-fecha" data-change="meta-personal-fecha" data-id="${escapeHtml(m.id)}" value="${escapeHtml(m.fecha || '')}" min="2026-01-01" style="color-scheme:dark;">
      <button class="btn-text-muted" data-act="meta-personal-eliminar" data-id="${escapeHtml(m.id)}">✕</button>
    </div>
  `;
}

export function renderPanorama(state) {
  const ideas = state.ideas;
  const [anio, mesNum] = state.month.split('-').map(Number);
  const diasMes = new Date(anio, mesNum, 0).getDate();
  const enMes = ideas.filter(i => i.fecha && i.fecha.startsWith(state.month) && i.estado !== 'descartada');
  const diasConPub = new Set(enMes.map(i => i.fecha)).size;
  const hoy = hoyStr();
  const muestraMetricas = !state.modoCalma;

  const orgSemana = calcularOrganizacionSemana(ideas);
  const finTotal = calcularFinanciamiento(state.movimientosFinanciamiento, state.deudas);

  const tareas = state.tareas || [];
  const tareasHtml = tareas.length ? tareas.map(tareaCintaHtml).join('') : '';

  const metasHtml = CATEGORIAS_META.map(([cat, label]) => {
    const items = (state.metasPersonales || []).filter(m => m.categoria === cat);
    return `
      <div class="metas-columna">
        <div class="metas-columna-head">
          <span class="mono-label" style="margin-bottom:0;">${label}</span>
          <button class="btn-text-muted" data-act="meta-personal-nueva" data-categoria="${cat}">+ Agregar</button>
        </div>
        <div class="metas-lista">${items.length ? items.map(metaPersonalHtml).join('') : '<div class="empty-note">Nada por aquí todavía.</div>'}</div>
      </div>
    `;
  }).join('');

  // ---- seguimiento: registros de seguidores/alcance, fusionado desde la vieja pestaña Seguimiento ----
  const snapsOrdenados = (state.snaps || []).slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  const ultimoSnap = snapsOrdenados[snapsOrdenados.length - 1];
  const penultimoSnap = snapsOrdenados[snapsOrdenados.length - 2];

  // ---- resúmenes para las tarjetas vitales ----
  // Estrategia (los estados viejos cuentan en su módulo equivalente)
  const ideasActivas = ideas.filter(i => i.estado !== 'descartada');
  const resEstrategia = {
    desarrollo: ideasActivas.filter(i => ['prospecto', 'desarrollo', 'lista'].includes(i.estado)).length,
    grabar: ideasActivas.filter(i => ['grabar', 'produccion'].includes(i.estado)).length,
    edicion: ideasActivas.filter(i => i.estado === 'edicion').length,
    porCerrar: ideasActivas.filter(i => ['entrega', 'por_pagar'].includes(i.estado)).length
  };

  // Clientes
  const cls = state.clientes || [];
  const clientesActivos = cls.filter(c => !['descartado', 'ya_pagos', 'entregado'].includes(c.estado));
  const clientesProspectos = cls.filter(c => c.estado === 'prospecto').length;
  const porCobrarTotal = cls.filter(c => c.estado === 'por_pagar').reduce((s, c) => s + (Number(c.precio) || 0), 0);

  // Totalizador de seguidores (suma de las 3 marcas en el último registro)
  const sumaSeg = snap => snap ? ['brant', 'bacu', 'novena'].reduce((s, k) => s + ((snap[k] && snap[k].seg) || 0), 0) : null;
  const totalSeg = sumaSeg(ultimoSnap);
  const totalSegAntes = sumaSeg(penultimoSnap);
  const deltaTotalSeg = totalSeg != null && totalSegAntes != null ? totalSeg - totalSegAntes : null;

  // Seguimiento de hábitos: las cintas de tareas cumplidas
  const tareasHechas = tareas.filter(t => t.hecha).length;

  // Calendario: qué hay este mes
  const rodajesMes = ideas.filter(i => i.fechaRodaje && i.fechaRodaje.startsWith(state.month) && i.estado !== 'descartada').length;
  const grabClientesMes = cls.filter(c => c.fecha_grabacion && c.fecha_grabacion.startsWith(state.month)).length;
  const entregasPendientes = tareas.filter(t => t.fecha && !t.hecha).length;

  // Estrategia por módulo (estados viejos mapeados al equivalente)
  const cuentaIdeas = estados => ideasActivas.filter(i => estados.includes(i.estado)).length;
  // Clientes por módulo
  const cuentaCls = estados => cls.filter(c => estados.includes(c.estado)).length;

  // Gastos recurrentes del mes
  const recurrentesTotal = (state.gastosRecurrentes || []).reduce((s, g) => s + (Number(g.monto) || 0), 0);

  // Fila de estadística compacta para el centro de stats
  const statRow = (label, valor, color) => `
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:5px 0;border-bottom:1px solid var(--line);">
      <span style="opacity:0.65;">${label}</span>
      <span style="font-weight:600;${color ? `color:${color};` : ''}">${valor}</span>
    </div>
  `;
  const D = state.snapDraft;

  const snapFormHtml = D ? `
    <div class="snap-form">
      <div class="snap-form-head">
        <span>Nuevo registro — copia los números de Instagram</span>
        <input type="date" data-change="snap-fecha" value="${escapeHtml(D.fecha)}" min="2026-01-01">
      </div>
      <div class="snap-fields">
        ${Object.keys(MARCAS).map(k => `
          <div class="snap-field">
            <span class="snap-field-label">${MARCAS[k].handle}</span>
            <input data-change="snap-campo" data-key="${k}Seg" value="${escapeHtml(D[k + 'Seg'])}" placeholder="Seguidores" inputmode="numeric">
            <input data-change="snap-campo" data-key="${k}Vis" value="${escapeHtml(D[k + 'Vis'])}" placeholder="Visualizaciones 30 días" inputmode="numeric">
          </div>
        `).join('')}
      </div>
      <div class="snap-actions">
        <button class="btn-primary" data-act="snap-guarda">Guardar</button>
        <button class="btn-ghost" data-act="snap-cierra">Cancelar</button>
      </div>
    </div>
  ` : '';

  const enfoqueHtml = ENFOQUE.length ? ENFOQUE.map(ef => `
    <div class="enfoque-row">
      <span class="enfoque-num">0${ef.n}</span>
      <div>
        <div class="enfoque-title">${escapeHtml(ef.titulo)}</div>
        <div class="enfoque-text">${escapeHtml(ef.texto)}</div>
      </div>
    </div>
  `).join('') : `<div class="empty-note">Todavía no hay suficientes registros para sacar conclusiones. Cargá seguidores y alcance seguido y esto se va a ir llenando solo.</div>`;

  const mesActualLabel = MESES[new Date().getMonth()].charAt(0).toUpperCase() + MESES[new Date().getMonth()].slice(1) + ' ' + new Date().getFullYear();

  const snapRowsHtml = snapsOrdenados.slice().reverse().map(s => {
    const resumen = ['brant', 'bacu', 'novena'].map(k => (s[k] ? fmtNum(s[k].seg) : '—')).join(' / ');
    return `<div class="historial-row"><span class="fecha">${fmtFecha(s.fecha, MESES)}</span><span>${resumen}</span></div>`;
  }).join('');

  const publicadas = ideas.filter(i => i.estado === 'publicada' || i.estado === 'ya_pago');
  const topPubsHtml = publicadas.length ? publicadas.map(i => {
    const m = i.metricas || {};
    const parts = [];
    if (m.alcance) parts.push(m.alcance + ' alcance');
    if (m.guardados) parts.push(m.guardados + ' guardados');
    if (m.seguidores) parts.push('+' + m.seguidores + ' seg');
    const meta = MARCAS[i.marca].nombre + ' · ' + (parts.length ? parts.join(' · ') : 'sin resultados registrados');
    return `
      <div class="top-pub" data-act="idea-abrir" data-id="${escapeHtml(i.id)}">
        <div class="top-pub-title">${escapeHtml(i.titulo)}</div>
        <div class="top-pub-meta">${escapeHtml(meta)}</div>
      </div>
    `;
  }).join('') : `<div class="empty-note">Cuando publiques, registra alcance, guardados y seguidores nuevos en cada idea publicada. Aquí verás qué repite y qué no.</div>`;

  const marcasHtml = Object.keys(MARCAS).map(k => {
    const M = MARCAS[k];
    const propias = ideas.filter(i => i.marca === k || i.colab === k);
    const nDesarrollo = propias.filter(i => ['prospecto', 'desarrollo', 'lista'].includes(i.estado)).length;
    const nListas = propias.filter(i => ['grabar', 'produccion'].includes(i.estado)).length;
    const nProgramadas = propias.filter(i => i.fecha && i.fecha >= hoy && !['descartada', 'publicada', 'ya_pago'].includes(i.estado)).length;
    const prox = propias.filter(i => i.fecha && i.fecha >= hoy && i.estado !== 'descartada' && i.estado !== 'publicada').sort((a, b) => a.fecha < b.fecha ? -1 : 1)[0];
    const proxima = prox ? `${fmtFecha(prox.fecha, MESES)} · ${escapeHtml(prox.titulo)}` : 'nada programado — está bien';

    const metaMes = (state.metasMensuales || []).find(m => m.marca === k && m.mes === state.month);
    const metaValor = metaMes ? Number(metaMes.meta_publicaciones) || 0 : 0;
    const publicadasMes = propias.filter(i => i.fecha && i.fecha.startsWith(state.month) && i.estado !== 'descartada').length;
    const progresoPct = metaValor > 0 ? Math.min(100, Math.round((publicadasMes / metaValor) * 100)) : 0;

    const curSnap = ultimoSnap && ultimoSnap[k] ? ultimoSnap[k] : null;
    const antesSnap = penultimoSnap && penultimoSnap[k] ? penultimoSnap[k] : null;
    const deltaSeg = curSnap && antesSnap ? curSnap.seg - antesSnap.seg : null;
    const maxSeg = Math.max(1, ...snapsOrdenados.map(s => (s[k] && s[k].seg) || 0));
    const deltaClass = deltaSeg == null ? 'na' : (deltaSeg >= 0 ? 'up' : 'down');
    const deltaTxt = deltaSeg == null ? 'primer registro' : (deltaSeg >= 0 ? '+' + fmtNum(deltaSeg) : fmtNum(deltaSeg));
    const barsHtml = snapsOrdenados.map(s => {
      const h = Math.max(3, Math.round(((s[k] && s[k].seg) || 0) / maxSeg * 24));
      return `<span class="bar" style="background:${M.color};height:${h}px"></span>`;
    }).join('');

    return `
      <div class="marca-card" data-act="marca-abrir" data-marca="${k}">
        <div class="marca-card-top">
          <span class="dot" style="background:${M.color}"></span>
          <span class="mono-label" style="margin-bottom:0;">${M.rol}</span>
        </div>
        <div class="marca-name serif">${escapeHtml(M.nombre)}</div>
        <div class="marca-handle">${M.handle}</div>
        <div class="marca-esencia">${escapeHtml(M.esencia)}</div>
        ${muestraMetricas ? `
        <div class="marca-metrics">
          <div><div class="marca-metric-value">${nDesarrollo}</div><div class="marca-metric-label">en desarrollo</div></div>
          <div><div class="marca-metric-value">${nListas}</div><div class="marca-metric-label">por grabar</div></div>
          <div><div class="marca-metric-value verde">${nProgramadas}</div><div class="marca-metric-label">programadas</div></div>
        </div>` : ''}
        <div class="marca-next"><span class="mono-label" style="display:inline;margin-bottom:0;">Próxima → </span>${proxima}</div>
        <div class="marca-seguimiento">
          <div class="cuenta-nums">
            <span class="cuenta-value">${curSnap ? fmtNum(curSnap.seg) : '—'}</span>
            <span class="cuenta-delta ${deltaClass}">${deltaTxt}</span>
          </div>
          <div class="cuenta-meta">seguidores · ${curSnap ? fmtNum(curSnap.vis) : '—'} vis/30d</div>
          <div class="cuenta-bars">${barsHtml}</div>
        </div>
        <div class="marca-objetivo" data-no-nav>
          <div class="marca-objetivo-head">
            <span class="mono-label" style="margin-bottom:0;">Meta este mes</span>
            <input class="marca-objetivo-input" inputmode="numeric" data-change="meta-mensual-set" data-marca="${k}" value="${metaValor || ''}" placeholder="0">
          </div>
          ${metaValor > 0 ? `
            <div class="progreso-bar"><div class="progreso-fill" style="width:${progresoPct}%;background:${M.color}"></div></div>
            <div class="progreso-label">${publicadasMes} / ${metaValor} publicaciones</div>
          ` : `<div class="progreso-label muted">Ponle un número para ver tu avance</div>`}
        </div>
      </div>
    `;
  }).join('');

  const preguntasHtml = PREGUNTAS.map((texto, n) => `
    <div class="rule-row">
      <span class="rule-num">0${n + 1}</span>
      <span class="rule-text">${escapeHtml(texto)}</span>
    </div>
  `).join('');

  const flujoHtml = PIPELINE.map((label, i) => `
    <div class="flujo-row">
      <span class="flujo-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="flujo-label">${escapeHtml(label)}</span>
    </div>
  `).join('');

  const pares = [['brant', 'bacu', 'Brant + Bacu'], ['bacu', 'novena', 'Bacu + Novena'], ['brant', 'novena', 'Brant + Novena']];
  const colabsHtml = pares.map(([a, b, par]) => {
    const n = ideas.filter(i => i.colab && ((i.marca === a && i.colab === b) || (i.marca === b && i.colab === a)) && i.estado !== 'descartada').length;
    return `
      <div class="colab-row">
        <span class="colab-par">${par}</span>
        <span class="colab-n">${n} ideas</span>
      </div>
    `;
  }).join('');

  return `
    <main class="panorama">
      <div class="section-title" style="margin-top:8px;">Centro de estadísticas</div>
      <div class="vista-sub">El resumen de todo lo importante, pestaña por pestaña. Toca una tarjeta para ir allá.</div>

      <div class="stats-centro">
        <!-- FINANZAS -->
        <div class="panel" data-act="nav-go" data-view="financiamiento" style="cursor:pointer;">
          <span class="mono-label">💰 Finanzas</span>
          <div class="vital-value ${finTotal.patrimonio < 0 ? 'alto' : 'verde'}" style="margin-bottom:10px;">${fmtMoney(finTotal.patrimonio)}</div>
          ${statRow('En bolsillo', fmtMoney(finTotal.efectivo), 'var(--verde)')}
          ${statRow('Te deben', fmtMoney(finTotal.teDeben), 'var(--azul)')}
          ${statRow('Debes', fmtMoney(finTotal.debes), 'var(--rojo)')}
          ${statRow('Recurrentes/mes', fmtMoney(recurrentesTotal), 'var(--rojo)')}
        </div>

        <!-- ESTRATEGIA -->
        <div class="panel" data-act="nav-go" data-view="guiones" style="cursor:pointer;">
          <span class="mono-label">🎬 Estrategia</span>
          <div class="vital-value" style="margin-bottom:10px;">${ideasActivas.length} idea${ideasActivas.length === 1 ? '' : 's'}</div>
          ${statRow('Prospecto', cuentaIdeas(['prospecto']))}
          ${statRow('En desarrollo', cuentaIdeas(['desarrollo', 'lista']))}
          ${statRow('Grabación', cuentaIdeas(['grabar', 'produccion']), '#1FB6CE')}
          ${statRow('Por editar', cuentaIdeas(['edicion']), '#EFC94C')}
          ${statRow('Por confirmar entrega', cuentaIdeas(['entrega']), '#E8641B')}
          ${statRow('Por pagar', cuentaIdeas(['por_pagar']), 'var(--rojo)')}
          ${statRow('Ya pagó', cuentaIdeas(['ya_pago', 'publicada']), 'var(--verde)')}
        </div>

        <!-- CLIENTES -->
        <div class="panel" data-act="nav-go" data-view="clientes" style="cursor:pointer;">
          <span class="mono-label">👥 Clientes</span>
          <div class="vital-value" style="margin-bottom:10px;">${clientesActivos.length} activo${clientesActivos.length === 1 ? '' : 's'}</div>
          ${statRow('Prospecto', cuentaCls(['prospecto']))}
          ${statRow('En conversación', cuentaCls(['conversacion']))}
          ${statRow('Grabación', cuentaCls(['grabacion']), '#1FB6CE')}
          ${statRow('Por editar', cuentaCls(['proyecto_edicion']), '#EFC94C')}
          ${statRow('Por confirmar entrega', cuentaCls(['confirmar_entrega']), '#E8641B')}
          ${statRow('Por pagar', cuentaCls(['por_pagar']) + ' · ' + fmtMoney(porCobrarTotal), 'var(--rojo)')}
          ${statRow('Cerrados', cuentaCls(['ya_pagos', 'entregado']), 'var(--verde)')}
        </div>

        <!-- CALENDARIO -->
        <div class="panel" data-act="nav-go" data-view="calendario" style="cursor:pointer;">
          <span class="mono-label">📅 Calendario — ${MESES[mesNum - 1]}</span>
          <div class="vital-value" style="margin-bottom:10px;">${enMes.length} publicación${enMes.length === 1 ? '' : 'es'}</div>
          ${statRow('Rodajes este mes', rodajesMes)}
          ${statRow('Grabaciones de clientes', grabClientesMes, '#1FB6CE')}
          ${statRow('Entregas pendientes', entregasPendientes, entregasPendientes > 0 ? 'var(--rojo)' : 'var(--verde)')}
          ${statRow('Días sin publicar', diasMes - diasConPub)}
        </div>

        <!-- SEGUIDORES -->
        <div class="panel">
          <span class="mono-label">📈 Seguidores — total</span>
          <div class="vital-value verde" style="margin-bottom:10px;">${totalSeg != null ? fmtNum(totalSeg) : '—'}</div>
          ${['brant', 'bacu', 'novena'].map(k => {
            const cur = ultimoSnap && ultimoSnap[k] ? ultimoSnap[k].seg : null;
            const antes = penultimoSnap && penultimoSnap[k] ? penultimoSnap[k].seg : null;
            const d = cur != null && antes != null ? cur - antes : null;
            const deltaTxt = d != null ? ` (${d >= 0 ? '+' : ''}${fmtNum(d)})` : '';
            return statRow(MARCAS[k].nombre, (cur != null ? fmtNum(cur) : '—') + deltaTxt, MARCAS[k].color);
          }).join('')}
          ${statRow('Cambio total', deltaTotalSeg != null ? (deltaTotalSeg >= 0 ? '+' : '') + fmtNum(deltaTotalSeg) : '—', deltaTotalSeg != null && deltaTotalSeg < 0 ? 'var(--rojo)' : 'var(--verde)')}
        </div>

        <!-- SEMANA Y HÁBITOS -->
        <div class="panel">
          <span class="mono-label">✅ Semana y hábitos</span>
          <div class="vital-value ${orgSemana.clase}" style="margin-bottom:10px;">${orgSemana.label}</div>
          ${statRow('Programadas esta semana', orgSemana.estaSemana)}
          ${statRow('Prioridad alta sin fecha', orgSemana.prioridadSinFecha, orgSemana.prioridadSinFecha > 0 ? 'var(--rojo)' : 'var(--verde)')}
          ${statRow('Tareas cumplidas', tareasHechas + ' / ' + tareas.length, tareas.length && tareasHechas === tareas.length ? 'var(--verde)' : undefined)}
          ${statRow('Metas cumplidas', (state.metasPersonales || []).filter(m => m.cumplida).length + ' / ' + (state.metasPersonales || []).length)}
        </div>
      </div>

      <div class="section-title">Tareas</div>
      <div class="vista-sub">Tu sistema de cintas en la pared, pero digital. Tócalas para marcarlas hechas.</div>
      <div class="tareas-pared">
        ${tareasHtml}
        <button class="tarea-agregar" data-act="tarea-nueva">+ Tarea</button>
      </div>

      <div class="section-title">Metas personales</div>
      <div class="metas-grid">${metasHtml}</div>

      <div class="seg-head">
        <div class="section-title" style="margin-bottom:0;">Las marcas — pipeline y seguimiento</div>
        <button class="btn-primary" data-act="snap-abre">+ Registro</button>
      </div>
      <div class="vista-sub">Dónde va cada marca: en producción, seguidores, alcance y meta del mes.</div>
      ${snapFormHtml}
      <div class="marcas-grid">${marcasHtml}</div>

      <div class="seg-bottom">
        <div class="panel">
          <div class="section-title">Enfoque de crecimiento — ${mesActualLabel}</div>
          <div style="display:flex; flex-direction:column; gap:16px;">${enfoqueHtml}</div>
        </div>
        <div class="side-col">
          <div class="panel">
            <div class="section-title">Historial de seguidores</div>
            <div style="display:flex; flex-direction:column; gap:10px;">${snapRowsHtml || '<div class="empty-note">Sin registros todavía.</div>'}</div>
          </div>
          <div class="panel">
            <div class="section-title">Qué funcionó — publicadas</div>
            <div style="display:flex; flex-direction:column; gap:12px;">${topPubsHtml}</div>
          </div>
        </div>
      </div>

      <div class="rules-grid">
        <div class="panel">
          <div class="section-title">Las 4 reglas — esto no se rompe</div>
          <div style="display:flex; flex-direction:column; gap:14px;">${preguntasHtml}</div>
          <div class="rule-footnote">Si una regla se rompe, el sistema deja de decir la verdad.</div>
        </div>
        <div class="panel">
          <div class="section-title">Flujo de producción</div>
          <div style="display:flex; flex-direction:column; gap:7px;">${flujoHtml}</div>
        </div>
        <div class="panel" style="display:flex; flex-direction:column;">
          <div class="section-title">Publicaciones compartidas</div>
          <div style="display:flex; flex-direction:column; gap:12px; flex:1;">${colabsHtml}</div>
          <div class="panel-footnote">Solo cuando benefician a ambas marcas. Nunca forzadas.</div>
        </div>
      </div>
    </main>
  `;
}
