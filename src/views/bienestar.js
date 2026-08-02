import { escapeHtml } from '../lib/format.js';
import { calcularEstres } from '../lib/bienestar.js';
import { hoyStr } from '../lib/idea.js';

const NIVELES = [
  ['ligera', 'Carga ligera', 'var(--verde)', 'Se resuelven rápido — no te quitan el sueño.'],
  ['media', 'Carga media', '#EFC94C', 'Piden tiempo y foco, pero están bajo control.'],
  ['pesada', 'Carga pesada', 'var(--rojo)', 'Vencidas o urgentes. Aquí se va tu cabeza.']
];

function habitoHtml(h, hoy) {
  const hecho = h.fecha === hoy;
  const emoji = hecho ? '🎉' : '⭕';
  return `
    <div class="habito ${hecho ? 'hecho' : ''}" data-id="${escapeHtml(h.id)}">
      <div class="habito-header">
        <button class="habito-check" data-act="habito-toggle" data-id="${escapeHtml(h.id)}" title="${hecho ? 'Desmarcar' : 'Marcar hecho hoy'}">
          <span class="habito-emoji">${emoji}</span>
        </button>
        <input class="habito-texto" data-change="meta-personal-titulo" data-id="${escapeHtml(h.id)}" value="${escapeHtml(h.titulo)}" placeholder="Nombre del hábito…">
        <button class="habito-quitar" data-act="meta-personal-eliminar" data-id="${escapeHtml(h.id)}" title="Quitar">✕</button>
      </div>
      ${hecho ? '<div class="habito-done-fx"></div>' : ''}
    </div>
  `;
}

export function renderBienestar(state) {
  const hoy = hoyStr();
  const e = calcularEstres(state);

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
      <h2 class="serif" style="margin:0 0 6px;font-size:32px;">Bienestar</h2>
      <div class="vista-sub">Cuánto te está pesando la cabeza hoy, y de dónde viene exactamente.</div>

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

      <!-- HÁBITOS GAMIFICADOS -->
      <div class="habitos-section">
        <div class="habitos-header">
          <div class="habitos-title-game">
            <span class="habitos-icon">🎮 HÁBITOS DE HOY</span>
            <div class="habitos-counter">
              <div class="counter-circle" style="background:linear-gradient(135deg, #1faf74, #1faf7488);">
                <span class="counter-num">${e.habitosHoy}</span>
                <span class="counter-total">/${e.habitos.length}</span>
              </div>
            </div>
          </div>
          ${e.habitosHoy === e.habitos.length && e.habitos.length > 0 ? '<div class="achievement-unlock">🏆 ¡TODOS COMPLETADOS!</div>' : ''}
        </div>
        <div class="vista-sub">Cada hábito cumplido = 5 puntos menos de estrés. Se reinicia cada medianoche.</div>
        <div class="habitos-grid">
          ${habitosHtml}
          <button class="inv-slot-add" data-act="habito-nuevo">+ Nuevo hábito</button>
        </div>
      </div>
    </main>
  `;
}
