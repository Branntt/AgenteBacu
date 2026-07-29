import { escapeHtml } from '../lib/format.js';
import { hoyStr, sumarDias } from '../lib/idea.js';
import { COLORES_TAREA } from '../data/constants.js';

function cintaRealHtml(t) {
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

function cintaSugeridaHtml(s) {
  return `
    <div class="tarea-cinta sugerida" style="background:none;border:1px dashed var(--line2);color:var(--muted);">
      <span class="tarea-texto" style="width:auto;max-width:220px;white-space:normal;">${escapeHtml(s.texto)}</span>
      <span class="tarea-fecha" style="width:auto;">${escapeHtml(s.fecha || '')}</span>
      <button class="tarea-agregar" style="padding:4px 8px;margin:0;" data-act="tarea-aceptar-sugerencia" data-texto="${escapeHtml(s.texto)}" data-fecha="${escapeHtml(s.fecha || '')}">+ A la pared</button>
    </div>
  `;
}

function grupoHtml(titulo, items, vacio) {
  const cuerpo = items.length
    ? items.map(it => it.sugerida ? cintaSugeridaHtml(it) : cintaRealHtml(it)).join('')
    : `<div class="vista-sub" style="margin:0;">${vacio}</div>`;
  return `
    <div class="section-title" style="margin-top:28px;">${titulo}${items.length ? ' — ' + items.length : ''}</div>
    <div class="tareas-pared">${cuerpo}</div>
  `;
}

export function renderPared(state) {
  const hoy = hoyStr();
  const limiteSemana = sumarDias(hoy, 7);

  const reales = (state.tareas || []).map(t => ({ ...t, sugerida: false }));

  // Sugeridas: cualquier grabación agendada (idea o cliente) que todavía no tenga
  // su propia cinta real de "editar" en la pared. Se calculan cada vez, no se
  // guardan solas — un toque en "+ A la pared" las vuelve una tarea real.
  const yaEnPared = new Set(reales.map(t => t.texto + '|' + (t.fecha || '')));

  const sugeridasIdeas = (state.ideas || [])
    .filter(i => i.fechaRodaje && i.estado !== 'descartada')
    .map(i => ({ texto: `Editar: ${i.titulo || '(sin título)'}`, fecha: sumarDias(i.fechaRodaje, 7), sugerida: true }));

  const sugeridasClientes = (state.clientes || [])
    .filter(c => c.fecha_grabacion && c.estado !== 'entregado')
    .map(c => ({ texto: `Editar: ${c.nombre}${c.proyecto ? ' — ' + c.proyecto : ''}`, fecha: sumarDias(c.fecha_grabacion, 7), sugerida: true }));

  const sugeridas = sugeridasIdeas.concat(sugeridasClientes)
    .filter(s => !yaEnPared.has(s.texto + '|' + s.fecha));

  const todas = reales.concat(sugeridas);
  const activas = todas.filter(t => !t.hecha);

  const urgente = activas.filter(t => t.fecha && t.fecha < hoy);
  const hoyLista = activas.filter(t => t.fecha === hoy);
  const semana = activas.filter(t => t.fecha && t.fecha > hoy && t.fecha <= limiteSemana);
  const masAdelante = activas.filter(t => t.fecha && t.fecha > limiteSemana);
  const sinFecha = activas.filter(t => !t.fecha);
  const hechas = todas.filter(t => t.hecha);

  return `
    <main class="pared">
      <h2 class="serif" style="margin:0;font-size:32px;">Pared</h2>
      <div class="vista-sub">Tu sistema de cintas en la pared, pero digital. Tócalas para marcarlas hechas.</div>

      <div class="panel" style="margin-bottom:8px;max-width:260px;">
        <span class="mono-label">⏰ Atraso</span>
        <div class="vital-value ${urgente.length ? 'alto' : 'ok'}" style="margin-top:6px;">${urgente.length}</div>
        <div class="vista-sub" style="margin:6px 0 0;">${urgente.length ? 'cinta' + (urgente.length === 1 ? '' : 's') + ' atrasada' + (urgente.length === 1 ? '' : 's') : 'nada atrasado — vas bien'}</div>
      </div>

      ${grupoHtml('Urgente — atrasadas', urgente, 'Nada atrasado.')}
      ${grupoHtml('Hoy', hoyLista, 'Nada para hoy.')}
      ${grupoHtml('Esta semana', semana, 'Nada esta semana.')}
      ${masAdelante.length ? grupoHtml('Más adelante', masAdelante, '') : ''}
      ${grupoHtml('Sin fecha', sinFecha, 'Nada suelto.')}

      <div class="tareas-pared" style="margin-top:8px;">
        <button class="tarea-agregar" data-act="tarea-nueva">+ Tarea</button>
      </div>

      ${hechas.length ? `
        <div class="section-title" style="margin-top:28px;opacity:0.6;">Hechas</div>
        <div class="tareas-pared">${hechas.map(cintaRealHtml).join('')}</div>
      ` : ''}
    </main>
  `;
}
