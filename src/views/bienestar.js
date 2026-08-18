import { escapeHtml } from '../lib/format.js';
import { calcularEstres, getGreeting, getHabitStreak, getStreakBadge, calcularQuickCheck, ordenarHabitos, calcularAnalisisSemanal, calcularAnalisisMensual, isHabitMarkedOnDate } from '../lib/bienestar.js';
import { hoyStr, lunesDe, sumarDias } from '../lib/idea.js';

const NIVELES = [
  ['ligera', 'Carga ligera', 'var(--verde)', 'Se resuelven rápido.'],
  ['media', 'Carga media', '#EFC94C', 'Piden tiempo y foco.'],
  ['pesada', 'Carga pesada', 'var(--rojo)', 'Vencidas o urgentes.']
];

const DIAS_SEMANA_CORTO = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MESES_NOMBRE = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function habitoHtml(h, diaSeleccionado, weekPct, esDiaRetroactivo = false) {
  // Siempre verificar en el log para días pasados; para hoy, usar log O el campo fecha (ambos)
  const hecho = isHabitMarkedOnDate(h.id, diaSeleccionado) || h.fecha === diaSeleccionado;
  const streak = getHabitStreak(h.id);
  const badge = getStreakBadge(streak.count);
  const streakLabel = streak.count > 0 ? `${streak.count}d` : '';
  const barColor = weekPct >= 70 ? 'var(--verde)' : (weekPct >= 40 ? '#EFC94C' : 'var(--rojo)');
  const titleText = esDiaRetroactivo
    ? `${hecho ? 'Desmarcar' : 'Marcar'} para este día`
    : `${hecho ? 'Desmarcar' : 'Marcar hecho hoy'}`;

  return `
    <div class="bh-card ${hecho ? 'bh-done' : ''}" data-id="${escapeHtml(h.id)}">
      <button class="bh-check" data-act="habito-toggle" data-id="${escapeHtml(h.id)}" data-fecha="${diaSeleccionado}" title="${titleText}">
        <svg class="bh-check-svg" viewBox="0 0 22 22" width="22" height="22">
          <circle class="bh-check-circle" cx="11" cy="11" r="9.5" />
          <path class="bh-check-tick" d="M7 11l3 3 5-5.5" />
        </svg>
      </button>
      <div class="bh-info">
        <div class="bh-top-row">
          <input class="bh-name" data-change="meta-personal-titulo" data-id="${escapeHtml(h.id)}" value="${escapeHtml(h.titulo)}" placeholder="Nombre del hábito…">
          <div class="bh-right">
            ${badge ? `<span class="bh-streak" title="Racha: ${streak.count} día${streak.count === 1 ? '' : 's'}">${badge} ${streakLabel}</span>` : ''}
            <button class="bh-delete" data-act="meta-personal-eliminar" data-id="${escapeHtml(h.id)}" title="Quitar">✕</button>
          </div>
        </div>
        <div class="bh-bar-row">
          <div class="bh-bar-track">
            <div class="bh-bar-fill" style="width:${weekPct}%;background:${barColor};"></div>
          </div>
          <span class="bh-bar-pct">${weekPct}%</span>
        </div>
      </div>
    </div>
  `;
}

export function renderBienestar(state) {
  const hoy = hoyStr();
  const diaSeleccionado = state.diaSeleccionadoBienestar || hoy;
  const semanaSeleccionada = state.semanaSeleccionadaBienestar || lunesDe(hoy);
  const e = calcularEstres(state);
  const sortedHabitos = ordenarHabitos(e.habitos);
  const qc = calcularQuickCheck(sortedHabitos, diaSeleccionado);
  const greeting = diaSeleccionado === hoy ? getGreeting() : 'Retroactivo';

  // ── Date header info ──
  const [anio, mes, dia] = diaSeleccionado.split('-').map(Number);
  const selDate = new Date(anio, mes - 1, dia);
  const dowIdx = selDate.getDay();
  const diaLabel = DIAS_SEMANA_CORTO[dowIdx];
  const mesLabel = MESES_NOMBRE[mes - 1];

  // ── Week info for navigation ──
  const [yearSem, mesSem, diaSem] = semanaSeleccionada.split('-').map(Number);
  const domingoDeSem = sumarDias(semanaSeleccionada, 6);
  const [yearDom, mesDom, diaDom] = domingoDeSem.split('-').map(Number);
  const esSemanaPasada = semanaSeleccionada < lunesDe(hoy);
  const esSemanActual = semanaSeleccionada === lunesDe(hoy);

  // ── Week days row ──
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const fecha = sumarDias(semanaSeleccionada, i);
    const [fy, fm, fd] = fecha.split('-').map(Number);
    const dObj = new Date(fy, fm - 1, fd);
    const dow = dObj.getDay();
    weekDays.push({
      label: DIAS_SEMANA_CORTO[dow].charAt(0),
      date: fd,
      isToday: fecha === hoy,
      isSelected: fecha === diaSeleccionado,
      isPast: fecha < hoy,
      fecha: fecha,
    });
  }

  const weekDaysHtml = weekDays.map(d => `
    <div class="bh-day ${d.isToday ? 'bh-day-today' : ''} ${d.isSelected ? 'bh-day-selected' : ''} ${d.isPast && !d.isToday ? 'bh-day-past' : ''}" data-act="seleccionar-dia-bienestar" data-fecha="${d.fecha}">
      <span class="bh-day-label">${d.label}</span>
      <span class="bh-day-num">${d.date}</span>
    </div>
  `).join('');

  // ── Weekly per-habit performance (for individual progress bars) ──
  const analisis = calcularAnalisisSemanal(sortedHabitos, hoy, semanaSeleccionada);
  const weekPctMap = {};
  if (analisis) {
    analisis.rendimiento.forEach(r => { weekPctMap[r.id] = r.pct; });
  }

  // ── Flat habit list ──
  const habitListHtml = sortedHabitos
    .map(h => habitoHtml(h, diaSeleccionado, weekPctMap[h.id] || 0, diaSeleccionado !== hoy))
    .join('');

  // Motivational text
  let motivText = '';
  if (qc.pct === 100 && qc.total > 0) {
    motivText = `<div class="bh-celebrate"><span>🎉 ¡Todos los hábitos completados! Cada día así construye tu mejor versión.</span></div>`;
  } else if (qc.hechos > 0) {
    const faltan = qc.total - qc.hechos;
    motivText = `<div class="bh-progress-msg"><span>💪 ¡Vas bien! Te falta${faltan === 1 ? '' : 'n'} ${faltan} hábito${faltan === 1 ? '' : 's'}.</span></div>`;
  }

  // ── Análisis semanal ──
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

  // ── Análisis mensual ──
  const mensual = calcularAnalisisMensual(sortedHabitos, hoy);

  let mensualHtml = '';
  if (mensual) {
    const rendMensualHtml = mensual.rendimiento.map(r => {
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

    // Mini chart: barras por semana
    const semanasBarHtml = mensual.semanasData.map(s => {
      const barColor = s.pct >= 70 ? 'var(--verde)' : (s.pct >= 40 ? '#EFC94C' : 'var(--rojo)');
      return `
        <div class="am-semana-col">
          <div class="am-semana-bar-wrap">
            <div class="am-semana-bar" style="height:${s.pct}%;background:${barColor};"></div>
          </div>
          <span class="am-semana-label">${s.label}</span>
          <span class="am-semana-pct">${s.pct}%</span>
        </div>
      `;
    }).join('');

    const deltaMSign = mensual.deltaMes > 0 ? '+' : '';
    const deltaMColor = mensual.deltaMes > 0 ? 'var(--verde)' : (mensual.deltaMes < 0 ? 'var(--rojo)' : 'var(--muted)');

    mensualHtml = `
      <div class="am-section">
        <div class="am-title">📅 RESUMEN DE ${mensual.mesNombre.toUpperCase()} ${mensual.anio}</div>
        <div class="am-sub">${mensual.progresoDias}</div>

        <div class="as-grid">
          <div class="as-card">
            <div class="as-card-icon">📊</div>
            <div class="as-card-val" style="color:var(--verde);">${mensual.consistencia}%</div>
            <div class="as-card-label">CONSISTENCIA</div>
          </div>
          <div class="as-card">
            <div class="as-card-icon">⭐</div>
            <div class="as-card-val">${mensual.diasPerfectos}</div>
            <div class="as-card-label">DÍAS PERFECTOS</div>
          </div>
          <div class="as-card">
            <div class="as-card-icon">✅</div>
            <div class="as-card-val">${mensual.completadosMes}/${mensual.totalPosibleMes}</div>
            <div class="as-card-label">COMPLETADOS</div>
          </div>
          <div class="as-card">
            <div class="as-card-icon">📈</div>
            <div class="as-card-val" style="color:${deltaMColor};">${deltaMSign}${mensual.deltaMes}%</div>
            <div class="as-card-label">VS MES ANT.</div>
          </div>
        </div>

        ${mensual.semanasData.length > 1 ? `
          <div class="as-rend-title">CONSISTENCIA POR SEMANA</div>
          <div class="am-semanas-chart">
            ${semanasBarHtml}
          </div>
        ` : ''}

        <div class="as-rend-title">RENDIMIENTO POR HÁBITO</div>
        <div class="as-rend-list">
          ${rendMensualHtml}
        </div>

        <div class="as-insight">
          ${escapeHtml(mensual.resumen)}
        </div>
      </div>
    `;
  }

  // ── Clasificación de ideas ──
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

  // ── Progress bar color ──
  const pctColor = qc.pct >= 70 ? 'var(--verde)' : (qc.pct >= 40 ? '#EFC94C' : 'var(--rojo)');

  return `
    <main class="bienestar">
      <canvas id="qc-confetti-canvas" aria-hidden="true"></canvas>

      <!-- ═══ HEADER: Date + Progress ═══ -->
      <div class="bh-header">
        <div class="bh-header-top">
          <div class="bh-header-left">
            <div class="bh-greeting">${greeting}</div>
            <div class="bh-date-title">BIENESTAR</div>
            <div class="bh-date-range">${diaLabel} ${dia} de ${mesLabel}, ${anio}</div>
          </div>
          <div class="bh-header-pct">
            <span class="bh-pct-num" style="color:${pctColor};">${qc.pct}%</span>
            <span class="bh-pct-label">hoy</span>
          </div>
        </div>
        <div class="bh-week-progress">
          <div class="bh-week-bar-track">
            <div class="bh-week-bar-fill" style="width:${qc.pct}%;background:${pctColor};"></div>
          </div>
          <span class="bh-week-stat">${qc.hechos}/${qc.total} hábitos</span>
        </div>
        <div class="bh-week-nav">
          ${!esSemanActual ? `<button class="bh-week-nav-btn" data-act="cambiar-semana-bienestar" data-delta="1">↑ Semana siguiente</button>` : ''}
          ${esSemanaPasada ? `<button class="bh-week-nav-btn" data-act="volver-al-hoy">Hoy</button>` : ''}
          <button class="bh-week-nav-btn" data-act="cambiar-semana-bienestar" data-delta="-1">↓ Semana anterior</button>
        </div>
        <div class="bh-week-days">
          ${weekDaysHtml}
        </div>
        ${qc.pct === 100 && qc.total > 0 ? '<div class="bh-perfect">🏆 ¡DÍA PERFECTO!</div>' : ''}
      </div>

      <!-- ═══ HABITS LIST ═══ -->
      <div class="bh-list">
        ${habitListHtml}
        <button class="bh-add-btn" data-act="habito-nuevo">+ Nuevo hábito</button>
      </div>
      ${motivText}

      <!-- ═══ ANÁLISIS SEMANAL ═══ -->
      ${analisisHtml}

      <!-- ═══ NIVEL DE ESTRÉS ═══ -->
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

      <!-- ═══ CLASIFICACIÓN DE IDEAS ═══ -->
      <div class="section-label">Clasificación de ideas</div>
      <div class="clasif-compact">${clasificacionHtml}</div>

      <!-- ═══ RESUMEN MENSUAL ═══ -->
      ${mensualHtml}
    </main>
  `;
}
