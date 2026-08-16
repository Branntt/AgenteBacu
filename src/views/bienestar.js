import { escapeHtml } from '../lib/format.js';
import { calcularEstres, getGreeting, getHabitStreak, getStreakBadge, calcularQuickCheck, ordenarHabitos, getBloqueHabito, calcularAnalisisSemanal } from '../lib/bienestar.js';
import { hoyStr } from '../lib/idea.js';

const NIVELES = [
  ['ligera', 'Carga ligera', 'var(--verde)', 'Se resuelven rápido.'],
  ['media', 'Carga media', '#EFC94C', 'Piden tiempo y foco.'],
  ['pesada', 'Carga pesada', 'var(--rojo)', 'Vencidas o urgentes.']
];

const BLOQUE_META = {
  manana: { emoji: '☀️', label: 'Mañana' },
  dia:    { emoji: '🌤️', label: 'Día' },
  noche:  { emoji: '🌙', label: 'Noche' }
};

// SVG progress ring constants
const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R; // ≈ 326.73

function habitoHtml(h, hoy) {
  const hecho = h.fecha === hoy;
  const streak = getHabitStreak(h.id);
  const badge = getStreakBadge(streak.count);
  const streakLabel = streak.count > 0 ? `${streak.count}d` : '';
  const bloque = getBloqueHabito(h);

  return `
    <div class="qc-habito ${hecho ? 'qc-hecho' : ''}" data-id="${escapeHtml(h.id)}">
      <button class="qc-check" data-act="habito-toggle" data-id="${escapeHtml(h.id)}" title="${hecho ? 'Desmarcar' : 'Marcar hecho hoy'}">
        <span class="qc-check-icon">${hecho ? '✓' : ''}</span>
      </button>
      <div class="qc-habito-info">
        <input class="qc-habito-nombre" data-change="meta-personal-titulo" data-id="${escapeHtml(h.id)}" value="${escapeHtml(h.titulo)}" placeholder="Nombre del hábito…">
        ${badge ? `<span class="qc-streak" title="Racha: ${streak.count} día${streak.count === 1 ? '' : 's'}">${badge} ${streakLabel}</span>` : ''}
      </div>
      <select class="qc-bloque-select" data-change="meta-personal-bloque" data-id="${escapeHtml(h.id)}" title="Bloque del día">
        <option value="manana" ${bloque === 'manana' ? 'selected' : ''}>☀️</option>
        <option value="dia" ${bloque === 'dia' ? 'selected' : ''}>🌤️</option>
        <option value="noche" ${bloque === 'noche' ? 'selected' : ''}>🌙</option>
      </select>
      <button class="qc-quitar" data-act="meta-personal-eliminar" data-id="${escapeHtml(h.id)}" title="Quitar">✕</button>
    </div>
  `;
}

export function renderBienestar(state) {
  const hoy = hoyStr();
  const e = calcularEstres(state);
  const sortedHabitos = ordenarHabitos(e.habitos);
  const qc = calcularQuickCheck(sortedHabitos, hoy);
  const greeting = getGreeting();

  // SVG ring offset (0 = full, RING_C = empty)
  const ringOffset = RING_C - (RING_C * qc.pct / 100);

  // Agrupar hábitos por bloque del día
  const bloques = { manana: [], dia: [], noche: [] };
  sortedHabitos.forEach(h => {
    const b = getBloqueHabito(h);
    (bloques[b] || bloques.dia).push(h);
  });

  // Render hábitos agrupados por bloque
  const bloquesHtml = Object.entries(bloques)
    .filter(([, items]) => items.length > 0)
    .map(([key, items]) => {
      const meta = BLOQUE_META[key] || BLOQUE_META.dia;
      const hechos = items.filter(h => h.fecha === hoy).length;
      const total = items.length;
      const todoListo = hechos === total;
      return `
        <div class="qc-bloque ${todoListo ? 'qc-bloque-listo' : ''}">
          <div class="qc-bloque-head">
            <span class="qc-bloque-emoji">${meta.emoji}</span>
            <span class="qc-bloque-label">${meta.label}</span>
            <span class="qc-bloque-count">${hechos}/${total}</span>
          </div>
          <div class="qc-bloque-items">
            ${items.map(h => habitoHtml(h, hoy)).join('')}
          </div>
        </div>
      `;
    }).join('');

  // Motivational text
  let motivText = '';
  if (qc.pct === 100 && qc.total > 0) {
    motivText = `<div class="qc-celebrate-msg"><span>🎉 ¡Todos los hábitos completados! Cada día así construye tu mejor versión.</span></div>`;
  } else if (qc.hechos > 0) {
    const faltan = qc.total - qc.hechos;
    motivText = `<div class="qc-progress-msg"><span>💪 ¡Vas bien! Te falta${faltan === 1 ? '' : 'n'} ${faltan} hábito${faltan === 1 ? '' : 's'}.</span></div>`;
  }

  // ── Análisis semanal ──
  const analisis = calcularAnalisisSemanal(sortedHabitos, hoy);

  let analisisHtml = '';
  if (analisis) {
    const rendBarsHtml = analisis.rendimiento.map(r => {
      const barColor = r.pct >= 70 ? 'var(--verde)' : (r.pct >= 40 ? '#EFC94C' : 'var(--rojo)');
      return `
        <div class="as-rend-row">
          <span class="as-rend-label">${escapeHtml(r.titulo)}</span>
          <div class="as-rend-bar-wrap">
            <div class="as-rend-bar" style="width:${r.pct}%;background:${barColor};"></div>
          </div>
          <span class="as-rend-pct">${r.pct}%</span>
        </div>
      `;
    }).join('');

    const deltaSign = analisis.delta > 0 ? '+' : '';
    const deltaColor = analisis.delta > 0 ? 'var(--verde)' : (analisis.delta < 0 ? 'var(--rojo)' : 'var(--muted)');

    analisisHtml = `
      <div class="as-section">
        <div class="as-title">ANÁLISIS SEMANAL</div>

        <div class="as-grid">
          <div class="as-card">
            <div class="as-card-icon">📊</div>
            <div class="as-card-val" style="color:var(--verde);">${analisis.consistencia}%</div>
            <div class="as-card-label">CONSISTENCIA</div>
          </div>
          <div class="as-card">
            <div class="as-card-icon">🏆</div>
            <div class="as-card-val">${analisis.mejorDiaLabel}</div>
            <div class="as-card-label">MEJOR DÍA</div>
          </div>
          <div class="as-card">
            <div class="as-card-icon">⚡</div>
            <div class="as-card-val">${analisis.completadosSemana}/${analisis.totalPosibleSemana}</div>
            <div class="as-card-label">COMPLETADOS</div>
          </div>
          <div class="as-card">
            <div class="as-card-icon">📈</div>
            <div class="as-card-val" style="color:${deltaColor};">${deltaSign}${analisis.delta}%</div>
            <div class="as-card-label">VS SEMANA ANT.</div>
          </div>
        </div>

        <div class="as-rend-title">RENDIMIENTO POR HÁBITO</div>
        <div class="as-rend-list">
          ${rendBarsHtml}
        </div>

        <div class="as-insight">
          ${escapeHtml(analisis.insight)}
        </div>
      </div>
    `;
  }

  // ── Clasificación de ideas (optimizada: inline compact) ──
  const clasificacionHtml = NIVELES.map(([clave, label, color]) => {
    const items = e.ideasClasificadas.filter(x => x.nivel === clave);
    if (!items.length) return '';
    const lista = items.map(x => `
      <div class="clasif-row" data-act="idea-abrir" data-id="${escapeHtml(x.idea.id)}">
        <span class="clasif-dot" style="background:${color};"></span>
        <span class="clasif-row-titulo">${escapeHtml(x.idea.titulo || 'Sin título')}</span>
        <span class="clasif-row-pts">${x.puntos}</span>
      </div>
    `).join('');
    return `
      <div class="clasif-group">
        <div class="clasif-group-head">
          <span class="clasif-group-label">${label}</span>
          <span class="clasif-group-count">${items.length}</span>
        </div>
        ${lista}
      </div>
    `;
  }).join('') || '<div class="empty-note">Sin ideas activas.</div>';

  // ── Fuentes de estrés ──
  const fuentesHtml = e.fuentes.length ? e.fuentes.map(f => `
    <div class="fuente-chip" data-act="nav-go" data-view="${f.view}" data-vista="${f.vista || ''}">
      <span class="fuente-chip-emoji">${f.emoji}</span>
      <div class="fuente-chip-body">
        <span class="fuente-chip-label">${f.label}</span>
        <span class="fuente-chip-pts">${f.puntos} pts</span>
      </div>
    </div>
  `).join('') : '';

  // ── Top items que más pesan ──
  const topHtml = e.items.slice(0, 5).map((it, n) => `
    <div class="peso-row" data-act="nav-go" data-view="${it.view}" data-vista="${it.vista || ''}">
      <span class="peso-num">${n + 1}</span>
      <div class="peso-cuerpo">
        <div class="peso-titulo">${escapeHtml(it.titulo)}</div>
        <div class="peso-motivo">${escapeHtml(it.motivo)}</div>
      </div>
      <span class="peso-pts">${it.puntos}</span>
    </div>
  `).join('') || '<div class="empty-note">Sin pendientes.</div>';

  return `
    <main class="bienestar">
      <canvas id="qc-confetti-canvas" aria-hidden="true"></canvas>

      <!-- ═══ SECCIÓN 1: RUTINA DEL DÍA (lo más importante) ═══ -->
      <div class="rutina-hero">
        <div class="rutina-hero-top">
          <div class="rutina-ring-wrap">
            <svg class="qc-ring-svg" viewBox="0 0 120 120" width="100" height="100">
              <circle class="qc-ring-bg" cx="60" cy="60" r="${RING_R}" />
              <circle class="qc-ring-fill" cx="60" cy="60" r="${RING_R}"
                style="stroke-dasharray:${RING_C.toFixed(2)};stroke-dashoffset:${ringOffset.toFixed(2)};"
                data-ring-c="${RING_C.toFixed(2)}" />
            </svg>
            <div class="qc-ring-label">
              <span class="qc-ring-pct">${qc.pct}%</span>
            </div>
          </div>
          <div class="rutina-hero-info">
            <div class="qc-greeting">${greeting}</div>
            <div class="rutina-hero-title">Mi rutina</div>
            <div class="rutina-hero-sub">${qc.hechos} de ${qc.total} hábitos hoy</div>
            ${qc.pct === 100 && qc.total > 0 ? '<div class="qc-complete-badge">🏆 ¡DÍA PERFECTO!</div>' : ''}
          </div>
        </div>
      </div>

      <div class="qc-section">
        <div class="qc-bloques" id="qc-lista">
          ${bloquesHtml}
          <button class="qc-nuevo-btn" data-act="habito-nuevo">+ Nuevo hábito</button>
        </div>
        ${motivText}
      </div>

      <!-- ═══ SECCIÓN 2: ANÁLISIS SEMANAL ═══ -->
      ${analisisHtml}

      <!-- ═══ SECCIÓN 3: NIVEL DE ESTRÉS ═══ -->
      <div class="estres-compact" style="border-color:${e.color};">
        <div class="estres-compact-left">
          <div class="estres-compact-title">Estrés</div>
          <div class="estres-compact-pct" style="color:${e.color};">${e.pct}%</div>
          <div class="estres-compact-nivel" style="color:${e.color};">${e.nivel}</div>
        </div>
        <div class="estres-compact-right">
          <div class="estres-compact-stat">
            <span class="estres-compact-stat-label">Carga</span>
            <span class="estres-compact-stat-val">${e.bruto} pts</span>
          </div>
          ${e.alivio > 0 ? `
            <div class="estres-compact-stat estres-alivio">
              <span class="estres-compact-stat-label">Alivio</span>
              <span class="estres-compact-stat-val" style="color:var(--verde);">−${e.alivio}</span>
            </div>
          ` : ''}
          <div class="estres-compact-stat">
            <span class="estres-compact-stat-label">Neto</span>
            <span class="estres-compact-stat-val">${e.neto} pts</span>
          </div>
        </div>
      </div>

      ${fuentesHtml ? `
        <div class="section-label">De dónde viene</div>
        <div class="fuentes-chips">${fuentesHtml}</div>
      ` : ''}

      ${e.items.length ? `
        <div class="section-label">Lo que más pesa</div>
        <div class="pesos-lista">${topHtml}</div>
      ` : ''}

      <!-- ═══ SECCIÓN 4: CENTRO DE CLASIFICACIÓN DE IDEAS (optimizado) ═══ -->
      <div class="section-label">Clasificación de ideas</div>
      <div class="clasif-compact">${clasificacionHtml}</div>
    </main>
  `;
}
