import { MARCAS, ENFOQUE, MESES } from '../data/constants.js';
import { fmtNum, fmtFecha, escapeHtml } from '../lib/format.js';

export function renderSeguimiento(state) {
  const snaps = (state.snaps || []).slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  const last = snaps[snaps.length - 1];
  const prev = snaps[snaps.length - 2];
  const D = state.snapDraft;

  const formHtml = D ? `
    <div class="snap-form">
      <div class="snap-form-head">
        <span>Nuevo registro — copia los números de Instagram</span>
        <input type="date" data-change="snap-fecha" value="${escapeHtml(D.fecha)}">
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

  const cuentasHtml = Object.keys(MARCAS).map(k => {
    const M = MARCAS[k];
    const cur = last && last[k] ? last[k] : null;
    const antes = prev && prev[k] ? prev[k] : null;
    const d = cur && antes ? cur.seg - antes.seg : null;
    const maxSeg = Math.max(1, ...snaps.map(s => (s[k] && s[k].seg) || 0));
    const deltaClass = d == null ? 'na' : (d >= 0 ? 'up' : 'down');
    const deltaTxt = d == null ? 'primer registro' : (d >= 0 ? '+' + fmtNum(d) : fmtNum(d));
    const barsHtml = snaps.map(s => {
      const h = Math.max(3, Math.round(((s[k] && s[k].seg) || 0) / maxSeg * 34));
      return `<span class="bar" style="background:${M.color};height:${h}px"></span>`;
    }).join('');

    return `
      <div class="cuenta-card">
        <div class="cuenta-top">
          <span class="dot" style="background:${M.color}"></span>
          <span class="mono">${M.handle}</span>
        </div>
        <div class="cuenta-nums">
          <span class="cuenta-value">${cur ? fmtNum(cur.seg) : '—'}</span>
          <span class="cuenta-delta ${deltaClass}">${deltaTxt}</span>
        </div>
        <div class="cuenta-meta">seguidores · ${cur ? fmtNum(cur.vis) : '—'} vis/30d</div>
        <div class="cuenta-bars">${barsHtml}</div>
      </div>
    `;
  }).join('');

  const enfoqueHtml = ENFOQUE.length ? ENFOQUE.map(ef => `
    <div class="enfoque-row">
      <span class="enfoque-num">0${ef.n}</span>
      <div>
        <div class="enfoque-title">${escapeHtml(ef.titulo)}</div>
        <div class="enfoque-text">${escapeHtml(ef.texto)}</div>
      </div>
    </div>
  `).join('') : `<div class="empty-note">Todavía no hay suficientes registros para sacar conclusiones. Cargá seguidores y alcance seguido y esto se va a ir llenando solo.</div>`;

  const hoyMes = new Date();
  const mesActualLabel = MESES[hoyMes.getMonth()].charAt(0).toUpperCase() + MESES[hoyMes.getMonth()].slice(1) + ' ' + hoyMes.getFullYear();

  const snapRows = snaps.slice().reverse().map(s => {
    const resumen = ['brant', 'bacu', 'novena'].map(k => (s[k] ? fmtNum(s[k].seg) : '—')).join(' / ');
    return `<div class="historial-row"><span class="fecha">${fmtFecha(s.fecha, MESES)}</span><span>${resumen}</span></div>`;
  }).join('');

  const publicadas = state.ideas.filter(i => i.estado === 'publicada');
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

  return `
    <main class="seguimiento">
      <div class="seg-head">
        <h2 class="serif" style="margin:0;font-size:32px;">Seguimiento</h2>
        <button class="btn-primary" data-act="snap-abre">+ Registro</button>
      </div>
      <div class="vista-sub">Seguidores y alcance por marca, mes a mes.</div>
      ${formHtml}
      <div class="cuentas-grid">${cuentasHtml}</div>
      <div class="seg-bottom">
        <div class="panel">
          <div class="section-title">Enfoque de crecimiento — ${mesActualLabel}</div>
          <div style="display:flex; flex-direction:column; gap:16px;">${enfoqueHtml}</div>
        </div>
        <div class="side-col">
          <div class="panel">
            <div class="section-title">Historial</div>
            <div style="display:flex; flex-direction:column; gap:10px;">${snapRows}</div>
          </div>
          <div class="panel">
            <div class="section-title">Qué funcionó — publicadas</div>
            <div style="display:flex; flex-direction:column; gap:12px;">${topPubsHtml}</div>
          </div>
        </div>
      </div>
    </main>
  `;
}
