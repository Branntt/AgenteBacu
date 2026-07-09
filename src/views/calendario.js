import { MARCAS, MESES } from '../data/constants.js';
import { escapeHtml } from '../lib/format.js';
import { hoyStr } from '../lib/idea.js';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function renderCalendario(state) {
  const ideas = state.ideas;
  const [anio, mesNum] = state.month.split('-').map(Number);
  const diasMes = new Date(anio, mesNum, 0).getDate();
  const hoy = hoyStr();
  const first = new Date(anio, mesNum - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  const totalCeldas = Math.ceil((lead + diasMes) / 7) * 7;

  const enMes = ideas.filter(i => i.fecha && i.fecha.startsWith(state.month) && i.estado !== 'descartada');
  const diasConPub = new Set(enMes.map(i => i.fecha)).size;

  const dowHtml = DIAS_SEMANA.map(ds => `<div class="cal-dow">${ds}</div>`).join('');

  let celdasHtml = '';
  for (let c = 0; c < totalCeldas; c++) {
    const dnum = c - lead + 1;
    const esMes = dnum >= 1 && dnum <= diasMes;
    const fstr = esMes ? state.month + '-' + String(dnum).padStart(2, '0') : null;
    const esHoy = fstr === hoy;
    const entries = esMes ? ideas.filter(i => i.fecha === fstr && i.estado !== 'descartada') : [];
    const entriesHtml = entries.map(i => {
      const M = MARCAS[i.marca];
      const meta = M.nombre + (i.colab ? ' + ' + MARCAS[i.colab].nombre : '') + ' · ' + i.formato + (i.estado === 'publicada' ? ' · publicada' : '');
      return `
        <div class="cal-entry" data-act="idea-abrir" data-id="${i.id}">
          <span class="cal-entry-bar" style="background:${M.color}"></span>
          <span class="cal-entry-title">${escapeHtml(i.titulo)}</span>
          <span class="cal-entry-meta">${escapeHtml(meta)}</span>
        </div>
      `;
    }).join('');

    celdasHtml += `
      <div class="cal-cell">
        <span class="cal-daynum ${esHoy ? 'today' : (!esMes ? 'out' : '')}">${esMes ? dnum : ''}</span>
        ${entriesHtml}
      </div>
    `;
  }

  const leyendaHtml = Object.keys(MARCAS).map(k => `
    <div class="legend-item">
      <span class="dot" style="width:9px;height:9px;background:${MARCAS[k].color}"></span>
      <span class="legend-label">${MARCAS[k].nombre}</span>
    </div>
  `).join('');

  const mesLabel = MESES[mesNum - 1];
  const calTitulo = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1) + ' ' + anio;
  const calNota = `${enMes.length} publicaciones este mes. ${diasMes - diasConPub} días sin publicar — cada espacio vacío es una decisión editorial, no un descuido.`;

  return `
    <main class="calendario">
      <div class="cal-head">
        <h2 class="serif" style="margin:0;font-size:32px;">${calTitulo}</h2>
        <div class="cal-nav">
          <button data-act="cal-prev">←</button>
          <button class="hoy-btn" data-act="cal-hoy">Hoy</button>
          <button data-act="cal-next">→</button>
        </div>
      </div>
      <div class="cal-grid">${dowHtml}${celdasHtml}</div>
      <div class="cal-footer">
        <div class="cal-note">${calNota}<br><span class="cal-quote">«Sin publicación programada. No existe una idea que aporte suficiente valor.»</span></div>
        <div class="cal-legend">${leyendaHtml}</div>
      </div>
    </main>
  `;
}
