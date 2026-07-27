import { escapeHtml, fmtFecha } from '../lib/format.js';
import { MESES, MARCAS } from '../data/constants.js';

export function renderNotificacionBacu(state) {
  if (!state.notificacionBacu) return '';

  // Feedback tras responder
  if (state.notificacionBacu === 'grabé' || state.notificacionBacu === 'procrastiné') {
    const grabo = state.notificacionBacu === 'grabé';
    return `
      <div class="bacu-noti" style="border-left-color:${grabo ? 'var(--verde)' : 'var(--naranja)'};">
        <div class="bacu-noti-titulo">BACU</div>
        <div style="font-size:14px;font-weight:bold;text-align:center;padding:6px 0;">
          ${grabo ? '✅ ¡Grabaste! Pasa a edición 🔥' : '⏰ Quedó pendiente. Fecha liberada para reagendar 💪'}
        </div>
      </div>
      ${estiloNoti()}
    `;
  }

  // Pregunta por el primer item pendiente (idea o grabación de cliente)
  const item = (state.revisionIdeasPendientes || [])[0];
  if (!item) return '';

  const M = item.marca ? MARCAS[item.marca] : null;
  const total = state.revisionIdeasPendientes.length;
  const tipoLabel = item.tipo === 'cliente' ? 'GRABACIÓN CLIENTE' : 'IDEA';

  return `
    <div class="bacu-noti">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="bacu-noti-titulo">BACU · ${tipoLabel}</div>
        <button data-act="cerrar-notificacion-bacu" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:4px 8px;">✕</button>
      </div>
      <div style="font-size:15px;font-weight:bold;margin:6px 0 2px;">🎬 ¿Grabaste o procrastinaste?</div>
      <div style="font-size:12px;opacity:0.85;margin-bottom:12px;">
        ${M ? `<span class="dot" style="width:8px;height:8px;background:${M.color};margin-right:6px;"></span>` : '🎥 '}
        ${escapeHtml(item.titulo || 'Sin título')} · era para el ${escapeHtml(fmtFecha(item.fecha, MESES))}${total > 1 ? ` · ${total} pendientes` : ''}
      </div>
      <div style="display:flex;gap:10px;">
        <button data-act="grabe-bacu" data-id="${escapeHtml(item.id)}" class="bacu-noti-btn" style="border-color:var(--verde);color:var(--verde);">
          ✅ Grabé
        </button>
        <button data-act="procrastine-bacu" data-id="${escapeHtml(item.id)}" class="bacu-noti-btn" style="border-color:var(--naranja);color:var(--naranja);">
          ⏰ Procrastiné
        </button>
      </div>
    </div>
    ${estiloNoti()}
  `;
}

function estiloNoti() {
  return `
    <style>
      .bacu-noti {
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        width: min(430px, calc(100vw - 24px));
        background: var(--panel);
        color: var(--text);
        border: 1px solid var(--line2);
        border-left: 4px solid var(--verde);
        border-radius: 10px;
        padding: 14px 16px;
        z-index: 10000;
        box-shadow: 0 6px 24px rgba(0,0,0,0.45);
        animation: bacuSlide .3s ease-out;
      }
      .bacu-noti-titulo {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10px;
        letter-spacing: 2.5px;
        color: var(--verde);
      }
      .bacu-noti-btn {
        flex: 1;
        padding: 12px;
        background: none;
        border: 1.5px solid;
        border-radius: 8px;
        font-weight: bold;
        font-size: 13px;
        cursor: pointer;
        min-height: 44px;
      }
      @keyframes bacuSlide {
        from { transform: translateX(-50%) translateY(-16px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
    </style>
  `;
}
