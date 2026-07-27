import { escapeHtml, fmtFecha } from '../lib/format.js';
import { MESES, MARCAS } from '../data/constants.js';

// Orden de los módulos por tipo — las opciones son los que van adelante del actual
const PIPELINE_IDEA = [
  ['prospecto', 'Prospecto'],
  ['desarrollo', 'En desarrollo'],
  ['produccion', 'Por producirse'],
  ['grabar', 'Por grabar'],
  ['edicion', 'Por editar'],
  ['entrega', 'Por confirmar entrega']
];
const PIPELINE_CLIENTE = [
  ['prospecto', 'Prospecto'],
  ['conversacion', 'En conversación'],
  ['grabacion', 'Grabación'],
  ['proyecto_edicion', 'Proyecto por editar'],
  ['confirmar_entrega', 'Por confirmar entrega'],
  ['por_pagar', 'Por pagar'],
  ['ya_pagos', 'Ya pagó'],
  ['entregado', 'Entregado']
];

function opcionesDelanteras(item) {
  const pipeline = item.tipo === 'cliente' ? PIPELINE_CLIENTE : PIPELINE_IDEA;
  const idx = pipeline.findIndex(([e]) => e === item.estado);
  // Si el estado actual no está en el pipeline (estados viejos), ofrece todos
  return idx === -1 ? pipeline : pipeline.slice(idx + 1);
}

export function renderNotificacionBacu(state) {
  if (!state.notificacionBacu) return '';

  // Feedback tras responder
  if (typeof state.notificacionBacu === 'string' && state.notificacionBacu !== 'pregunta') {
    const ok = state.notificacionBacu.startsWith('ok:');
    const mensaje = ok
      ? `✅ Movido a ${escapeHtml(state.notificacionBacu.slice(3))} 🔥`
      : '⏰ Fecha liberada para reagendar 💪';
    return `
      <div class="bacu-noti" style="border-left-color:${ok ? 'var(--verde)' : 'var(--naranja)'};">
        <div class="bacu-noti-titulo">BACU</div>
        <div style="font-size:14px;font-weight:bold;text-align:center;padding:6px 0;">${mensaje}</div>
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
  const pipeline = item.tipo === 'cliente' ? PIPELINE_CLIENTE : PIPELINE_IDEA;
  const actualLabel = (pipeline.find(([e]) => e === item.estado) || [])[1] || item.estado || 'sin estado';
  const opciones = opcionesDelanteras(item);

  return `
    <div class="bacu-noti">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="bacu-noti-titulo">BACU · ${tipoLabel}</div>
        <button data-act="cerrar-notificacion-bacu" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:4px 8px;">✕</button>
      </div>
      <div style="font-size:15px;font-weight:bold;margin:6px 0 2px;">🎬 ¿En qué quedó esto?</div>
      <div style="font-size:12px;opacity:0.85;margin-bottom:12px;">
        ${M ? `<span class="dot" style="width:8px;height:8px;background:${M.color};margin-right:6px;"></span>` : '🎥 '}
        ${escapeHtml(item.titulo || 'Sin título')} · era para el ${escapeHtml(fmtFecha(item.fecha, MESES))} · está en <strong>${escapeHtml(actualLabel)}</strong>${total > 1 ? ` · ${total} pendientes` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${opciones.map(([estado, label]) => `
          <button data-act="bacu-set-estado" data-id="${escapeHtml(item.id)}" data-estado="${estado}" data-label="${escapeHtml(label)}" class="bacu-noti-btn" style="border-color:var(--verde);color:var(--verde);text-align:left;">
            → ${label}
          </button>
        `).join('')}
        <button data-act="bacu-posponer" data-id="${escapeHtml(item.id)}" class="bacu-noti-btn" style="border-color:var(--naranja);color:var(--naranja);text-align:left;">
          ⏰ No se hizo · liberar fecha
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
        max-height: calc(100vh - 32px);
        overflow-y: auto;
      }
      .bacu-noti-titulo {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10px;
        letter-spacing: 2.5px;
        color: var(--verde);
      }
      .bacu-noti-btn {
        padding: 11px 14px;
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
