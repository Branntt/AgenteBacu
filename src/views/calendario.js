import { MARCAS, MESES } from '../data/constants.js';
import { escapeHtml } from '../lib/format.js';
import { hoyStr, sumarDias, valida } from '../lib/idea.js';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const VISTAS = [['mes', 'Mes'], ['semana', 'Semana'], ['agenda', 'Agenda']];
const FILTROS = [['todas', 'Todas'], ['brant', 'Brant'], ['bacu', 'Bacu'], ['novena', 'Novena']];

function entryHtml(i, tipo) {
  const M = MARCAS[i.marca];
  const marcaTxt = M.nombre + (i.colab ? ' + ' + MARCAS[i.colab].nombre : '');
  const ok = valida(i);
  const prioridadAlta = i.prioridad === 'Alta' && i.estado !== 'publicada' && i.estado !== 'descartada';
  const flags = (ok ? '<span class="cal-flag ok" title="Validada">✓</span>' : '')
    + (prioridadAlta ? '<span class="cal-flag alta" title="Prioridad alta">⚠</span>' : '');
  const tag = tipo === 'rodaje' ? '<span class="cal-entry-tag">Rodaje</span>' : '';

  return `
    <div class="cal-entry ${tipo === 'rodaje' ? 'is-rodaje' : ''}" data-act="idea-abrir" data-id="${escapeHtml(i.id)}">
      <span class="cal-entry-bar" style="background:${M.color}"></span>
      <div class="cal-entry-title">${tag}${escapeHtml(i.titulo)}</div>
      <div class="cal-entry-meta">${escapeHtml(i.formato)} · ${escapeHtml(marcaTxt)}${flags ? `<span class="cal-entry-flags">${flags}</span>` : ''}</div>
    </div>
  `;
}

function entradasDeDia(ideas, fs) {
  const publicacion = ideas.filter(i => i.fecha === fs && i.estado !== 'descartada').map(i => entryHtml(i, 'publicacion'));
  const rodaje = ideas.filter(i => i.fechaRodaje === fs && i.estado !== 'descartada').map(i => entryHtml(i, 'rodaje'));
  return rodaje.concat(publicacion);
}

function tieneEntradas(ideas, fs) {
  return ideas.some(i => i.estado !== 'descartada' && (i.fecha === fs || i.fechaRodaje === fs));
}

function controlesHtml(state) {
  const vistaHtml = VISTAS.map(([v, label]) => `
    <button class="segmented-btn ${state.calVista === v ? 'active' : ''}" data-act="cal-vista-set" data-vista="${v}">${label}</button>
  `).join('');
  const filtroHtml = FILTROS.map(([v, label]) => `
    <button class="filtro-btn ${state.filtroCalendario === v ? 'active' : ''}" data-act="filtro-calendario-set" data-filtro="${v}">${label}</button>
  `).join('');
  return `
    <div class="cal-controls">
      <div class="segmented">${vistaHtml}</div>
      <div class="filtros">${filtroHtml}</div>
    </div>
  `;
}

function renderMes(state, ideas) {
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
    const entries = esMes ? entradasDeDia(ideas, fs) : [];
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

function renderSemana(state, ideas) {
  const hoy = hoyStr();
  const dias = [];
  for (let c = 0; c < 7; c++) {
    const fs = sumarDias(state.semanaInicio, c);
    const [, , dnum] = fs.split('-').map(Number);
    const entries = entradasDeDia(ideas, fs);
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

function renderAgenda(state, ideas) {
  const [anio, mesNum] = state.month.split('-').map(Number);
  const diasMes = new Date(anio, mesNum, 0).getDate();
  const hoy = hoyStr();

  const dias = [];
  for (let dnum = 1; dnum <= diasMes; dnum++) {
    const fs = state.month + '-' + String(dnum).padStart(2, '0');
    if (!tieneEntradas(ideas, fs)) continue;
    dias.push({ dnum, fs, esHoy: fs === hoy, entries: entradasDeDia(ideas, fs) });
  }

  if (!dias.length) {
    return `<div class="cal-agenda-empty">Sin publicaciones ni rodajes programados este mes.<br>Cada espacio vacío es una decisión editorial, no un descuido.</div>`;
  }

  const mesLabel = MESES[mesNum - 1];
  return `<div class="cal-agenda">${dias.map(d => `
    <div class="cal-agenda-day ${d.esHoy ? 'today' : ''}">
      <div class="cal-agenda-date">${d.dnum} ${mesLabel.slice(0, 3)}${d.esHoy ? ' <span class="today-mark">· hoy</span>' : ''}</div>
      ${d.entries.join('')}
    </div>
  `).join('')}</div>`;
}

export function renderCalendario(state) {
  const ideas = state.ideas.filter(i => state.filtroCalendario === 'todas' || i.marca === state.filtroCalendario || i.colab === state.filtroCalendario);

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
    contenido = renderSemana(state, ideas);
    fechasPeriodo = Array.from({ length: 7 }, (_, i) => sumarDias(state.semanaInicio, i));
    diasPeriodo = 7;
    statsLabel = 'esta semana';
  } else {
    const [anio, mesNum] = state.month.split('-').map(Number);
    titulo = state.calVista === 'agenda' ? `Agenda — ${mesTitulo}` : mesTitulo;
    contenido = state.calVista === 'agenda' ? renderAgenda(state, ideas) : renderMes(state, ideas);
    diasPeriodo = new Date(anio, mesNum, 0).getDate();
    fechasPeriodo = Array.from({ length: diasPeriodo }, (_, i) => state.month + '-' + String(i + 1).padStart(2, '0'));
    statsLabel = 'este mes';
  }

  const statsIdeas = ideas.filter(i => i.fecha && fechasPeriodo.includes(i.fecha) && i.estado !== 'descartada');
  const rodajesPeriodo = ideas.filter(i => i.fechaRodaje && fechasPeriodo.includes(i.fechaRodaje) && i.estado !== 'descartada');
  const diasConPub = new Set(statsIdeas.map(i => i.fecha)).size;
  const prioridadAltaPendiente = statsIdeas.filter(i => i.prioridad === 'Alta' && i.estado !== 'publicada').length;
  const statsHtml = `${statsIdeas.length} publicaciones ${statsLabel} · ${diasPeriodo - diasConPub} días sin publicar · ${rodajesPeriodo.length} rodajes · ${prioridadAltaPendiente} con prioridad alta pendiente`;

  const mesRealLabel = MESES[new Date().getMonth()];
  const hoyBtnLabel = mesRealLabel.charAt(0).toUpperCase() + mesRealLabel.slice(1);

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
