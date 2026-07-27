import { escapeHtml } from '../lib/format.js';
import { fmtFecha } from '../lib/format.js';
import { MESES } from '../data/constants.js';

const ESTADOS_DISPONIBLES = [
  ['prospecto', '📝 Prospecto'],
  ['desarrollo', '🎨 En desarrollo'],
  ['produccion', '🎬 Por producirse'],
  ['grabar', '📹 Por grabar'],
  ['edicion', '✂️ Por editar'],
  ['entrega', '✅ Por confirmar entrega'],
  ['descartada', '❌ Descartada']
];

export function renderRevisionIdeasModal(state) {
  if (!state.revisionIdeasModal || !state.revisionIdeasPendientes.length) return '';

  const idea = state.revisionIdeasPendientes[0];
  if (!idea) return '';

  const indice = state.revisionIdeasPendientes.findIndex(i => i.id === idea.id);
  const total = state.revisionIdeasPendientes.length;

  return `
    <div class="modal-overlay" data-act="cerrar-revision-ideas">
      <div class="modal-content" style="max-width:500px;" data-no-nav="cerrar-revision-ideas">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h2 style="margin:0;font-size:18px;">Revisión de Ideas</h2>
          <button class="btn-close" data-act="cerrar-revision-ideas">✕</button>
        </div>

        <div style="background:rgba(255,152,0,0.1);padding:12px;border-radius:8px;border-left:3px solid var(--naranja);margin-bottom:16px;font-size:12px;">
          <strong>${indice + 1} de ${total}</strong> - Idea del ${escapeHtml(fmtFecha(idea.fecha, MESES))}
        </div>

        <div style="background:var(--panel);padding:16px;border-radius:8px;margin-bottom:20px;">
          <div style="font-size:13px;margin-bottom:4px;opacity:0.8;">📌 Título:</div>
          <div style="font-size:15px;font-weight:bold;margin-bottom:12px;">${escapeHtml(idea.titulo || 'Sin título')}</div>

          ${idea.nota ? `
            <div style="font-size:13px;margin-bottom:4px;opacity:0.8;">📝 Nota:</div>
            <div style="font-size:13px;margin-bottom:12px;opacity:0.9;">${escapeHtml(idea.nota)}</div>
          ` : ''}

          <div style="font-size:13px;margin-bottom:4px;opacity:0.8;">🏷️ Marca:</div>
          <div style="font-size:13px;">${escapeHtml(idea.marca)}</div>
        </div>

        <div style="margin-bottom:20px;">
          <div style="font-size:13px;font-weight:bold;margin-bottom:12px;opacity:0.9;">¿Qué pasó con esta idea?</div>
          <div style="display:grid;grid-template-columns:1fr;gap:8px;">
            ${ESTADOS_DISPONIBLES.map(([estado, label]) => `
              <button
                data-act="actualizar-estado-idea"
                data-id="${escapeHtml(idea.id)}"
                data-estado="${estado}"
                style="padding:12px;border:1px solid var(--line);background:var(--panel);border-radius:6px;text-align:left;font-size:13px;cursor:pointer;transition:all 0.2s;"
                onmouseover="this.style.background='rgba(76,175,80,0.2)';this.style.borderColor='var(--verde)';"
                onmouseout="this.style.background='var(--panel)';this.style.borderColor='var(--line)';"
              >
                ${label}
              </button>
            `).join('')}
          </div>
        </div>

        <div style="font-size:11px;opacity:0.6;text-align:center;">
          Selecciona el estado actual de esta idea
        </div>
      </div>
    </div>
  `;
}
