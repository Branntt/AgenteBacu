import { escapeHtml } from '../lib/format.js';
import { calcularEstres, calcularStatsGamificacion, getGreeting, getHabitStreak, getStreakBadge, calcularQuickCheck } from '../lib/bienestar.js';
import { hoyStr } from '../lib/idea.js';

const NIVELES = [
  ['ligera', 'Carga ligera', 'var(--verde)', 'Se resuelven rápido — no te quitan el sueño.'],
  ['media', 'Carga media', '#EFC94C', 'Piden tiempo y foco, pero están bajo control.'],
  ['pesada', 'Carga pesada', 'var(--rojo)', 'Vencidas o urgentes. Aquí se va tu cabeza.']
];

// SVG progress ring constants
const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R; // ≈ 326.73

function habitoHtml(h, hoy) {
  const hecho = h.fecha === hoy;
  const streak = getHabitStreak(h.id);
  const badge = getStreakBadge(streak.count);
  const streakLabel = streak.count > 0 ? `${streak.count}d` : '';

  return `
    <div class="qc-habito ${hecho ? 'qc-hecho' : ''}" data-id="${escapeHtml(h.id)}">
      <button class="qc-check" data-act="habito-toggle" data-id="${escapeHtml(h.id)}" title="${hecho ? 'Desmarcar' : 'Marcar hecho hoy'}">
        <span class="qc-check-icon">${hecho ? '✓' : ''}</span>
      </button>
      <div class="qc-habito-info">
        <input class="qc-habito-nombre" data-change="meta-personal-titulo" data-id="${escapeHtml(h.id)}" value="${escapeHtml(h.titulo)}" placeholder="Nombre del hábito…">
        ${badge ? `<span class="qc-streak" title="Racha: ${streak.count} día${streak.count === 1 ? '' : 's'}">${badge} ${streakLabel}</span>` : ''}
      </div>
      <button class="qc-quitar" data-act="meta-personal-eliminar" data-id="${escapeHtml(h.id)}" title="Quitar">✕</button>
    </div>
  `;
}

export function renderBienestar(state) {
  const hoy = hoyStr();
  const e = calcularEstres(state);
  const qc = calcularQuickCheck(e.habitos, hoy);
  const greeting = getGreeting();

  // SVG ring offset (0 = full, RING_C = empty)
  const ringOffset = RING_C - (RING_C * qc.pct / 100);

  // Determinar título motivador según progreso
  let tituloMotivador = '🎮 ¡MISIÓN DEL DÍA!';
  if (e.objetivosLogrados === e.totalHabitos && e.totalHabitos > 0) {
    tituloMotivador = '🏆 ¡MISIÓN COMPLETADA!';
  } else if (e.objetivosLogrados > 0) {
    tituloMotivador = `🚀 ${e.objetivosLogrados}/${e.totalHabitos} OBJETIVOS`;
  }

  // Centro de clasificación: las ideas repartidas por cuánto pesan
  const clasificacionHtml = NIVELES.map(([clave, label, color, nota]) => {
    const items = e.ideasClasificadas.filter(x => x.nivel === clave);
    const lista = items.length
      ? items.map(x => `
          <div class="clasif-item" data-act="idea-abrir" data-id="${escapeHtml(x.idea.id)}">
            <span class="clasif-item-titulo">${escapeHtml(x.idea.titulo || 'Sin título')}</span>
            <span class="clasif-item-pts" style="color:${color};">${x.puntos}</span>
          </div>
        `).join('')
      : '<div class="empty-note">Nada aquí.</div>';
    return `
      <div class="clasif-col">
        <div class="clasif-head">
          <span><span class="dot" style="width:8px;height:8px;background:${color};margin-right:8px;"></span>${label}</span>
          <span class="banco-col-count">${items.length}</span>
        </div>
        <div class="desarrollo-col-sub">${nota}</div>
        <div class="clasif-lista">${lista}</div>
      </div>
    `;
  }).join('');

  const fuentesHtml = e.fuentes.length ? e.fuentes.map(f => `
    <div class="fuente-row" data-act="nav-go" data-view="${f.view}" data-vista="${f.vista || ''}">
      <div class="fuente-top">
        <span class="fuente-label">${f.emoji} ${f.label}</span>
        <span class="fuente-pts">${f.puntos} pts</span>
      </div>
      <div class="fuente-barra"><div class="fuente-fill" style="width:${Math.round(f.puntos / e.maxFuente * 100)}%;background:${e.color};"></div></div>
      <div class="fuente-detalle">${escapeHtml(f.detalle)}</div>
    </div>
  `).join('') : '<div class="empty-note">Nada te está pesando ahora mismo. Disfrútalo.</div>';

  const topHtml = e.items.slice(0, 8).map((it, n) => `
    <div class="peso-row" data-act="nav-go" data-view="${it.view}" data-vista="${it.vista || ''}">
      <span class="peso-num">${String(n + 1).padStart(2, '0')}</span>
      <div class="peso-cuerpo">
        <div class="peso-titulo">${escapeHtml(it.titulo)}</div>
        <div class="peso-motivo">${escapeHtml(it.motivo)}</div>
      </div>
      <span class="peso-pts">${it.puntos}</span>
    </div>
  `).join('') || '<div class="empty-note">Sin pendientes registrados.</div>';

  const habitosHtml = e.habitos.length
    ? e.habitos.map(h => habitoHtml(h, hoy)).join('')
    : '<div class="empty-note">Agrega tu primer hábito abajo.</div>';

  return `
    <main class="bienestar">
      <!-- CONFETTI CANVAS (se activa con JS al completar 100%) -->
      <canvas id="qc-confetti-canvas" aria-hidden="true"></canvas>

      <div class="jugador-header">
        <div class="titulo-principal">${tituloMotivador}</div>
        <div class="stats-rápido">
          <div class="stat-box-mini">
            <div class="stat-icon">⭐</div>
            <div class="stat-valor">${e.nivelActual}</div>
            <div class="stat-etiqueta">Nivel</div>
          </div>
          <div class="stat-box-mini">
            <div class="stat-icon">✨</div>
            <div class="stat-valor">${e.xpTotal}</div>
            <div class="stat-etiqueta">XP</div>
          </div>
          <div class="stat-box-mini">
            <div class="stat-icon">🔥</div>
            <div class="stat-valor">${e.rachaActual}</div>
            <div class="stat-etiqueta">Racha</div>
          </div>
        </div>
      </div>

      <div class="jugador-progreso">
        <div class="nivel-info">
          <span class="nivel-actual">Nivel ${e.nivelActual}</span>
          <span class="xp-info">${e.xpEnNivel}/${e.xpParaProximo} XP</span>
        </div>
        <div class="barra-nivel">
          <div class="barra-fill" style="width:${e.progreso}%;"></div>
        </div>
        <div class="nivel-siguiente">Próximo nivel en ${e.xpParaProximo - e.xpEnNivel} XP</div>
      </div>

      <h2 class="serif" style="margin:0 0 6px;font-size:32px;">Bienestar</h2>
      <div class="vista-sub">Cuánto te está pesando la cabeza hoy, y de dónde viene exactamente.</div>

      <!-- QUICK CHECK: HÁBITOS DE HOY con SVG ring -->
      <div class="qc-section">
        <div class="qc-hero">
          <div class="qc-ring-wrap">
            <svg class="qc-ring-svg" viewBox="0 0 120 120" width="120" height="120">
              <circle class="qc-ring-bg" cx="60" cy="60" r="${RING_R}" />
              <circle class="qc-ring-fill" cx="60" cy="60" r="${RING_R}"
                style="stroke-dasharray:${RING_C.toFixed(2)};stroke-dashoffset:${ringOffset.toFixed(2)};"
                data-ring-c="${RING_C.toFixed(2)}" />
            </svg>
            <div class="qc-ring-label">
              <span class="qc-ring-pct">${qc.pct}%</span>
            </div>
          </div>
          <div class="qc-hero-text">
            <div class="qc-greeting">${greeting}</div>
            <div class="qc-hero-title">Quick Check</div>
            <div class="qc-hero-sub">${qc.hechos}/${qc.total} hábitos hoy</div>
            ${qc.pct === 100 && qc.total > 0 ? '<div class="qc-complete-badge">🏆 ¡DÍA PERFECTO!</div>' : ''}
          </div>
        </div>

        <div class="qc-lista" id="qc-lista">
          ${habitosHtml}
          <button class="qc-nuevo-btn" data-act="habito-nuevo">+ Nuevo hábito</button>
        </div>

        ${qc.pct === 100 && qc.total > 0 ? `
          <div class="qc-celebrate-msg">
            <span>🎉 ¡Todos los hábitos completados! Cada día así construye tu mejor versión.</span>
          </div>
        ` : qc.hechos > 0 ? `
          <div class="qc-progress-msg">
            <span>💪 ¡Vas bien! Te faltan ${qc.total - qc.hechos} hábito${qc.total - qc.hechos === 1 ? '' : 's'} para completar el día.</span>
          </div>
        ` : ''}
      </div>

      <!-- MEDIDOR GAMIFICADO -->
      <div class="estres-card-game" style="border-color:${e.color};box-shadow:0 0 24px ${e.color}33;">
        <div class="estres-game-header">
          <div class="estres-game-title">NIVEL DE ESTRÉS</div>
          <div class="estres-badge" style="background:${e.color};">${e.pct}%</div>
        </div>

        <div class="estres-circle-container">
          <div class="estres-circle" style="--percentage:${e.pct};--color:${e.color};">
            <div class="estres-circle-inner" style="background:linear-gradient(135deg, ${e.color}, ${e.color}88);">
              <div class="estres-circle-text">
                <div class="estres-valor" style="color:${e.color};">${e.pct}%</div>
                <div class="estres-nivel" style="color:${e.color};">${e.nivel}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="estres-stats">
          <div class="stat-item">
            <span class="stat-label">Carga total</span>
            <span class="stat-value">${e.bruto} pts</span>
          </div>
          ${e.alivio > 0 ? `
            <div class="stat-item bonus">
              <span class="stat-label">🎉 Alivio hoy</span>
              <span class="stat-value" style="color:var(--verde);">−${e.alivio} pts</span>
            </div>
          ` : `
            <div class="stat-item">
              <span class="stat-label">💡 Tip</span>
              <span class="stat-value">Completa hábitos hoy</span>
            </div>
          `}
        </div>
      </div>

      <!-- DE DÓNDE VIENE -->
      <div class="section-title">De dónde viene</div>
      <div class="vista-sub">Toca una fuente para ir a resolverla.</div>
      <div class="fuentes-grid">${fuentesHtml}</div>

      <!-- CENTRO DE CLASIFICACIÓN -->
      <div class="section-title">Centro de clasificación de ideas</div>
      <div class="vista-sub">Cada idea pesa según en qué módulo está, si tiene fecha vencida y su prioridad.</div>
      <div class="clasif-grid">${clasificacionHtml}</div>

      <!-- LO QUE MÁS PESA -->
      <div class="section-title">Lo que más te pesa ahora</div>
      <div class="vista-sub">Si resuelves los tres primeros, el medidor baja de verdad.</div>
      <div class="pesos-lista">${topHtml}</div>
    </main>
  `;
}
