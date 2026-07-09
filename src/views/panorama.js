import { MARCAS, PREGUNTAS, PIPELINE, MESES } from '../data/constants.js';
import { fmtFecha, escapeHtml } from '../lib/format.js';
import { hoyStr } from '../lib/idea.js';

export function renderPanorama(state) {
  const ideas = state.ideas;
  const [anio, mesNum] = state.month.split('-').map(Number);
  const diasMes = new Date(anio, mesNum, 0).getDate();
  const enMes = ideas.filter(i => i.fecha && i.fecha.startsWith(state.month) && i.estado !== 'descartada');
  const diasConPub = new Set(enMes.map(i => i.fecha)).size;
  const hoy = hoyStr();
  const muestraMetricas = !state.modoCalma;

  const marcasHtml = Object.keys(MARCAS).map(k => {
    const M = MARCAS[k];
    const propias = ideas.filter(i => i.marca === k || i.colab === k);
    const nDesarrollo = propias.filter(i => i.estado === 'desarrollo').length;
    const nListas = propias.filter(i => i.estado === 'lista' && !i.fecha).length;
    const nProgramadas = propias.filter(i => i.fecha && i.estado === 'lista').length;
    const prox = propias.filter(i => i.fecha && i.fecha >= hoy && i.estado !== 'descartada' && i.estado !== 'publicada').sort((a, b) => a.fecha < b.fecha ? -1 : 1)[0];
    const proxima = prox ? `${fmtFecha(prox.fecha, MESES)} · ${escapeHtml(prox.titulo)}` : 'nada programado — está bien';

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
          <div><div class="marca-metric-value">${nListas}</div><div class="marca-metric-label">listas</div></div>
          <div><div class="marca-metric-value verde">${nProgramadas}</div><div class="marca-metric-label">programadas</div></div>
        </div>` : ''}
        <div class="marca-next"><span class="mono-label" style="display:inline;margin-bottom:0;">Próxima → </span>${proxima}</div>
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
      <div class="hero-grid">
        <h1 class="hero-title serif">Un calendario dice qué publicar.<br>Un sistema decide <em>qué merece existir</em>.</h1>
        <div class="hero-stats">
          <div>
            <div class="stat-value">${enMes.length}</div>
            <div class="mono-label">publicaciones en ${MESES[mesNum - 1]}</div>
          </div>
          <div>
            <div class="stat-value muted">${diasMes - diasConPub}</div>
            <div class="mono-label">días en silencio — a propósito</div>
          </div>
        </div>
      </div>

      <div class="section-title">Las marcas</div>
      <div class="marcas-grid">${marcasHtml}</div>

      <div class="rules-grid">
        <div class="panel">
          <div class="section-title">La regla — cuatro preguntas</div>
          <div style="display:flex; flex-direction:column; gap:14px;">${preguntasHtml}</div>
          <div class="rule-footnote">Un «no» a cualquiera → la idea no entra al calendario.</div>
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
