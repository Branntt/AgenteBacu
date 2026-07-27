import { MARCAS, MESES, HORARIO_CLASES } from '../data/constants.js';
import { escapeHtml } from '../lib/format.js';
import { hoyStr, sumarDias, valida } from '../lib/idea.js';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const VISTAS = [['mes', 'Mes'], ['semana', 'Semana'], ['agenda', 'Agenda']];
const FILTROS = [['todas', 'Todas'], ['brant', 'Brant'], ['bacu', 'Bacu'], ['novena', 'Novena']];

// Filtro de marca activo (se fija en renderCalendario) — con una marca elegida, clases/tareas se ocultan
let filtroActivo = 'todas';

function entryHtml(i, tipo) {
  const M = MARCAS[i.marca];
  const marcaTxt = M.nombre + (i.colab ? ' + ' + MARCAS[i.colab].nombre : '');
  const ok = valida(i);
  const prioridadAlta = i.prioridad === 'Alta' && i.estado !== 'publicada' && i.estado !== 'descartada';
  const flags = (ok ? '<span class="cal-flag ok" title="Validada">✓</span>' : '')
    + (prioridadAlta ? '<span class="cal-flag alta" title="Prioridad alta">⚠</span>' : '');
  const tag = tipo === 'rodaje' ? `<span class="cal-entry-tag" style="color:${M.color};border-color:${M.color}">Rodaje</span>` : '';
  const icono = tipo === 'rodaje' ? '🎬' : '📢';

  return `
    <div class="cal-entry ${tipo === 'rodaje' ? 'is-rodaje' : ''}" ${tipo === 'rodaje' ? `style="border-color:${M.color}"` : ''} data-act="idea-abrir" data-id="${escapeHtml(i.id)}">
      <span class="cal-entry-bar" style="background:${M.color}"></span>
      <span class="cal-entry-icon" aria-hidden="true">${icono}</span>
      <div class="cal-entry-title"><span class="cal-entry-title-icon" aria-hidden="true">${icono}</span>${tag}${escapeHtml(i.titulo)}</div>
      <div class="cal-entry-meta">
        <span class="cal-entry-meta-text">${escapeHtml(i.formato)} · ${escapeHtml(marcaTxt)}</span>
        ${flags ? `<span class="cal-entry-flags">${flags}</span>` : ''}
      </div>
    </div>
  `;
}

// Grabación agendada desde la ficha de un cliente (pestaña Clientes) — se muestra en el calendario en modo solo lectura.
function entryClienteHtml(c) {
  return `
    <div class="cal-entry is-rodaje" style="border-color:var(--verde)" data-act="nav-go" data-view="clientes" title="Editar en la pestaña Clientes">
      <span class="cal-entry-bar" style="background:var(--verde)"></span>
      <span class="cal-entry-icon" aria-hidden="true">🎥</span>
      <div class="cal-entry-title"><span class="cal-entry-title-icon" aria-hidden="true">🎥</span><span class="cal-entry-tag" style="color:var(--verde);border-color:var(--verde)">Grabación</span>${escapeHtml(c.nombre || 'Cliente')}</div>
      <div class="cal-entry-meta"><span class="cal-entry-meta-text">${escapeHtml(c.proyecto || 'Proyecto sin definir')}</span></div>
    </div>
  `;
}

function clientesDeDia(clientes, fs) {
  return clientes.filter(c => c.fecha_grabacion === fs && c.estado !== 'conversacion');
}

// Tarea con fecha de entrega (Panorama) — pendiente por hacer, se ve acá para no tener que entrar a Panorama.
function entryTareaHtml(t) {
  return `
    <div class="cal-entry is-tarea" data-act="nav-go" data-view="panorama" title="Editar en Panorama">
      <span class="cal-entry-bar" style="background:var(--rojo)"></span>
      <span class="cal-entry-icon" aria-hidden="true">📌</span>
      <div class="cal-entry-title"><span class="cal-entry-title-icon" aria-hidden="true">📌</span><span class="cal-entry-tag entrega">Entrega</span>${escapeHtml(t.texto || 'Tarea')}</div>
    </div>
  `;
}

function tareasDeDia(tareas, fs) {
  return tareas.filter(t => t.fecha === fs && !t.hecha);
}

// Clase recurrente del horario fijo (src/data/constants.js) — solo lectura, dentro del rango del semestre.
function entryClaseHtml(clase) {
  return `
    <div class="cal-entry is-clase" data-act="clase-info" title="Horario fijo de clase">
      <span class="cal-entry-bar" style="background:var(--azul)"></span>
      <span class="cal-entry-icon" aria-hidden="true">🎓</span>
      <div class="cal-entry-title"><span class="cal-entry-title-icon" aria-hidden="true">🎓</span><span class="cal-entry-tag clase">${escapeHtml(clase.horaInicio)}–${escapeHtml(clase.horaFin)}</span>${escapeHtml(clase.materia)}</div>
      <div class="cal-entry-meta"><span class="cal-entry-meta-text">${escapeHtml(clase.profesor)}</span></div>
      <div class="cal-entry-meta"><span class="cal-entry-meta-text wrap">📍 Salón ${escapeHtml(clase.salon)} · ${escapeHtml(clase.lugar)}</span></div>
    </div>
  `;
}

function clasesDeDia(fs) {
  // Las clases son de Brant: se ven en "Todas" y en el filtro "Brant"
  if (filtroActivo !== 'todas' && filtroActivo !== 'brant') return [];
  if (fs < HORARIO_CLASES.inicio || fs > HORARIO_CLASES.fin) return [];
  const [anio, mes, dia] = fs.split('-').map(Number);
  const dow = new Date(anio, mes - 1, dia).getDay();
  const diaISO = dow === 0 ? 7 : dow;
  return HORARIO_CLASES.clases.filter(c => c.dia === diaISO).sort((a, b) => a.horaInicio < b.horaInicio ? -1 : 1);
}

function entradasDeDia(ideas, clientes, tareas, fs) {
  const publicacion = ideas.filter(i => i.fecha === fs && i.estado !== 'descartada').map(i => entryHtml(i, 'publicacion'));
  const rodaje = ideas.filter(i => i.fechaRodaje === fs && i.estado !== 'descartada').map(i => entryHtml(i, 'rodaje'));
  const grabaciones = clientesDeDia(clientes, fs).map(entryClienteHtml);
  const clases = clasesDeDia(fs).map(entryClaseHtml);
  const entregas = tareasDeDia(tareas, fs).map(entryTareaHtml);
  // Orden del día: entregas → grabaciones → rodajes → publicaciones, y las clases (atenuadas) al final
  return entregas.concat(grabaciones, rodaje, publicacion, clases);
}

function tieneEntradas(ideas, clientes, tareas, fs) {
  return ideas.some(i => i.estado !== 'descartada' && (i.fecha === fs || i.fechaRodaje === fs))
    || clientesDeDia(clientes, fs).length > 0
    || clasesDeDia(fs).length > 0
    || tareasDeDia(tareas, fs).length > 0;
}

function controlesHtml(state) {
  const vistaOpts = VISTAS.map(([v, label]) => `<option value="${v}" ${state.calVista === v ? 'selected' : ''}>${label}</option>`).join('');
  const filtroOpts = FILTROS.map(([v, label]) => `<option value="${v}" ${state.filtroCalendario === v ? 'selected' : ''}>${label}</option>`).join('');
  return `
    <div class="cal-controls">
      <select class="vista-select" data-change="cal-vista-set">${vistaOpts}</select>
      <select class="filtro-select" data-change="filtro-calendario-set">${filtroOpts}</select>
    </div>
  `;
}

function renderMes(state, ideas, clientes, tareas) {
  const [anio, mesNum] = state.month.split('-').map(Number);
  const diasMes = new Date(anio, mesNum, 0).getDate();
  const hoy = hoyStr();
  const first = new Date(anio, mesNum - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  const totalCeldas = Math.ceil((lead + diasMes) / 7) * 7;

  const dias = [];
  for (let c = 0; c < totalCeldas; c++) {
    const dnum = c - lead + 1;
    const esMes = dnum >= 1 && dnum <= diasMes;
    const fs = esMes ? state.month + '-' + String(dnum).padStart(2, '0') : null;
    const esHoy = fs === hoy;
    const entries = esMes ? entradasDeDia(ideas, clientes, tareas, fs) : [];
    dias.push({ dnum, esMes, fs, esHoy, entries });
  }

  const dowHtml = DIAS_SEMANA.map(ds => `<div class="cal-dow">${ds}</div>`).join('');
  const celdasHtml = dias.map(d => `
    <div class="cal-cell ${d.esMes ? 'clickable' : ''}" ${d.esMes ? `data-act="rodaje-rapido-abrir" data-fecha="${d.fs}"` : ''}>
      <span class="cal-daynum ${d.esHoy ? 'today' : (!d.esMes ? 'out' : '')}">${d.esMes ? d.dnum : ''}</span>
      ${d.entries.join('')}
    </div>
  `).join('');

  return `<div class="cal-grid">${dowHtml}${celdasHtml}</div>`;
}

function renderSemana(state, ideas, clientes, tareas) {
  const hoy = hoyStr();
  const dias = [];
  for (let c = 0; c < 7; c++) {
    const fs = sumarDias(state.semanaInicio, c);
    const [, , dnum] = fs.split('-').map(Number);
    const entries = entradasDeDia(ideas, clientes, tareas, fs);
    dias.push({ fs, dnum, esHoy: fs === hoy, entries });
  }

  const colsHtml = dias.map((d, i) => `
    <div class="cal-week-col">
      <div class="cal-week-head ${d.esHoy ? 'today' : ''}">
        <span class="cal-dow">${DIAS_SEMANA[i]}</span>
        <span class="cal-daynum ${d.esHoy ? 'today' : ''}">${d.dnum}</span>
      </div>
      <div class="cal-week-body clickable" data-act="rodaje-rapido-abrir" data-fecha="${d.fs}">
        ${d.entries.length ? d.entries.join('') : '<div class="col-empty">Tocá para agendar.</div>'}
      </div>
    </div>
  `).join('');

  return `<div class="cal-week">${colsHtml}</div>`;
}

function renderAgenda(state, ideas, clientes, tareas) {
  const [anio, mesNum] = state.month.split('-').map(Number);
  const diasMes = new Date(anio, mesNum, 0).getDate();
  const hoy = hoyStr();

  const dias = [];
  for (let dnum = 1; dnum <= diasMes; dnum++) {
    const fs = state.month + '-' + String(dnum).padStart(2, '0');
    if (!tieneEntradas(ideas, clientes, tareas, fs)) continue;
    dias.push({ dnum, fs, esHoy: fs === hoy, entries: entradasDeDia(ideas, clientes, tareas, fs) });
  }

  if (!dias.length) {
    return `<div class="cal-agenda-empty">Sin publicaciones ni rodajes programados este mes.<br>Cada espacio vacío es una decisión editorial, no un descuido.</div>`;
  }

  const mesLabel = MESES[mesNum - 1];
  const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return `<div class="cal-agenda">${dias.map(d => `
    <div class="cal-agenda-day ${d.esHoy ? 'today' : ''}">
      <div class="cal-agenda-date">${DIAS_SEMANA[new Date(anio, mesNum - 1, d.dnum).getDay()]} ${d.dnum} de ${mesLabel}${d.esHoy ? ' <span class="today-mark">· hoy</span>' : ''}</div>
      ${d.entries.join('')}
    </div>
  `).join('')}</div>`;
}

export function renderCalendario(state) {
  filtroActivo = state.filtroCalendario;
  const ideas = state.ideas.filter(i => filtroActivo === 'todas' || i.marca === filtroActivo || i.colab === filtroActivo);
  // Grabaciones de clientes son trabajo Bacu: solo se ven en "Todas" o "Bacu". Tareas y clases, solo en "Todas".
  const clientes = (filtroActivo === 'todas' || filtroActivo === 'bacu') ? (state.clientes || []) : [];
  const tareas = filtroActivo === 'todas' ? (state.tareas || []) : [];

  let titulo, contenido, fechasPeriodo, diasPeriodo, statsLabel;
  const mesLabel = MESES[Number(state.month.split('-')[1]) - 1];
  const mesTitulo = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1) + ' ' + state.month.split('-')[0];

  if (state.calVista === 'semana') {
    const fin = sumarDias(state.semanaInicio, 6);
    const [ay, am, ad] = state.semanaInicio.split('-').map(Number);
    const [by, bm, bd] = fin.split('-').map(Number);
    titulo = am === bm
      ? `${ad}–${bd} ${MESES[am - 1].slice(0, 3)} ${ay}`
      : `${ad} ${MESES[am - 1].slice(0, 3)} – ${bd} ${MESES[bm - 1].slice(0, 3)} ${by}`;
    contenido = renderSemana(state, ideas, clientes, tareas);
    fechasPeriodo = Array.from({ length: 7 }, (_, i) => sumarDias(state.semanaInicio, i));
    diasPeriodo = 7;
    statsLabel = 'esta semana';
  } else {
    const [anio, mesNum] = state.month.split('-').map(Number);
    titulo = state.calVista === 'agenda' ? `Agenda — ${mesTitulo}` : mesTitulo;
    contenido = state.calVista === 'agenda' ? renderAgenda(state, ideas, clientes, tareas) : renderMes(state, ideas, clientes, tareas);
    diasPeriodo = new Date(anio, mesNum, 0).getDate();
    fechasPeriodo = Array.from({ length: diasPeriodo }, (_, i) => state.month + '-' + String(i + 1).padStart(2, '0'));
    statsLabel = 'este mes';
  }

  const statsIdeas = ideas.filter(i => i.fecha && fechasPeriodo.includes(i.fecha) && i.estado !== 'descartada');
  const rodajesPeriodo = ideas.filter(i => i.fechaRodaje && fechasPeriodo.includes(i.fechaRodaje) && i.estado !== 'descartada');
  const diasConPub = new Set(statsIdeas.map(i => i.fecha)).size;
  const prioridadAltaPendiente = statsIdeas.filter(i => i.prioridad === 'Alta' && i.estado !== 'publicada').length;
  const statsHtml = `${statsIdeas.length} publicaciones ${statsLabel} · ${diasPeriodo - diasConPub} días sin publicar · ${rodajesPeriodo.length} rodajes · ${prioridadAltaPendiente} con prioridad alta pendiente`;

  const mesVisibleNum = state.calVista === 'semana' ? Number(state.semanaInicio.split('-')[1]) : Number(state.month.split('-')[1]);
  const mesVisibleLabel = MESES[mesVisibleNum - 1];
  const hoyBtnLabel = mesVisibleLabel.charAt(0).toUpperCase() + mesVisibleLabel.slice(1);

  return `
    <main class="calendario">
      <div class="cal-head">
        <h2 class="serif" style="margin:0;font-size:32px;">${titulo}</h2>
        <div class="cal-nav">
          <button data-act="cal-prev">←</button>
          <button class="hoy-btn" data-act="cal-hoy" title="Ir a hoy">${hoyBtnLabel}</button>
          <button data-act="cal-next">→</button>
        </div>
      </div>
      <div class="cal-stats">${statsHtml}</div>
      ${controlesHtml(state)}
      ${contenido}
    </main>
  `;
}
