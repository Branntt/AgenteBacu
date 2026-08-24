import { escapeHtml } from '../lib/format.js';
import { LISTA_PARA_QUIEN_ID } from './datalistClientes.js';

// Anotar una idea = responder cuatro preguntas, las que el usuario pidió: para quién es, en
// qué consiste, cómo se graba y qué espera de ella. Se contesta lo que se sepa en el momento
// —solo el título es obligatorio— y el resto se completa después en el detalle: una idea que
// se te ocurre caminando tiene que poder quedar anotada en segundos.
const CAMPOS = [
  ['idea-para-quien', '¿Para quién es?', 'Un cliente o una de tus marcas', false],
  ['idea-consiste', '¿En qué consiste la idea?', 'De qué se trata, en una o dos frases', true],
  ['idea-como-grabar', '¿Cómo la vas a grabar?', 'Dónde, con qué, qué planos, qué necesitás', true],
  ['idea-que-espero', '¿Qué esperás de este video?', 'Qué querés que pase cuando lo vean', true]
];

export function renderNuevaIdea(state) {
  if (!state.nuevaIdeaAbierta) return '';

  const camposHtml = CAMPOS.map(([id, label, placeholder, esTexto]) => `
    <div class="field">
      <label class="field-label" for="${id}">${escapeHtml(label)}</label>
      ${esTexto
        ? `<textarea id="${id}" rows="2" placeholder="${escapeHtml(placeholder)}"></textarea>`
        : `<input id="${id}" placeholder="${escapeHtml(placeholder)}" list="${LISTA_PARA_QUIEN_ID}" autocomplete="off">`}
    </div>
  `).join('');

  return `
    <div class="drawer-overlay">
      <div class="drawer-backdrop" data-act="nueva-idea-cerrar"></div>
      <div class="drawer nuevo-contenido" role="dialog" aria-modal="true" aria-label="Nueva idea">
        <div class="drawer-top">
          <span class="chip">💡 Nueva idea</span>
          <button class="btn-close" data-act="nueva-idea-cerrar">✕</button>
        </div>

        <div class="field">
          <label class="field-label" for="idea-titulo">Título</label>
          <input id="idea-titulo" placeholder="Cómo la vas a llamar" autocomplete="off">
        </div>

        <div class="field">
          <label class="field-label" for="idea-fecha">📅 Fecha (opcional)</label>
          <input id="idea-fecha" type="date" min="2026-01-01" style="color-scheme:dark;" autocomplete="off">
          <div style="font-size:11px;opacity:0.55;margin-top:4px;">Si le pones fecha, el aviso aparece en el Calendario ese día (y se ve igual en el cel y el compu).</div>
        </div>

        ${camposHtml}

        <button class="btn-primary" data-act="nueva-idea-guardar" style="width:100%;margin-top:14px;">Guardar idea</button>
        <div style="font-size:11px;opacity:0.55;margin-top:8px;">Con el título alcanza. Lo demás lo podés completar después.</div>
      </div>
    </div>
  `;
}
