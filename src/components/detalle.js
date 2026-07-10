import { MARCAS, OBJETIVOS, FORMATOS, PIPELINE, ETAPA_HINTS, PREGUNTAS } from '../data/constants.js';
import { escapeHtml } from '../lib/format.js';
import { valida } from '../lib/idea.js';

const ESTADO_LABELS = { desarrollo: 'En desarrollo', lista: 'Lista para producir', publicada: 'Publicada', descartada: 'Descartada' };

export function renderDetalle(state) {
  const selIdea = state.ideas.find(i => i.id === state.selId);
  if (!selIdea) return '';

  const id = selIdea.id;
  const ok = valida(selIdea);
  const met = selIdea.metricas || {};

  const colabOpts = [{ v: '', label: 'Ninguna' }].concat(
    Object.keys(MARCAS).filter(k => k !== selIdea.marca).map(k => ({ v: k, label: MARCAS[k].nombre }))
  );

  const estadoChip = ESTADO_LABELS[selIdea.estado] + (selIdea.colab ? ' · compartida' : '');

  const objChipsHtml = OBJETIVOS.map((label, oi) => {
    const active = selIdea.objetivos.includes(oi);
    return `<button class="chip-toggle ${active ? 'active' : ''}" data-act="obj-toggle" data-id="${id}" data-idx="${oi}">${escapeHtml(label)}</button>`;
  }).join('');

  const prios = ['Alta', 'Media', 'Baja'].map(p => `
    <button class="prio-btn ${selIdea.prioridad === p ? 'active' : ''}" data-act="prio-set" data-id="${id}" data-value="${p}">${p}</button>
  `).join('');

  const pregsHtml = PREGUNTAS.map((texto, qi) => {
    const v = selIdea.preguntas[qi];
    return `
      <div class="pregunta-row">
        <span class="pregunta-text">${escapeHtml(texto)}</span>
        <div class="pregunta-btns">
          <button class="${v === true ? 'si-active' : ''}" data-act="pregunta-set" data-id="${id}" data-idx="${qi}" data-value="true">Sí</button>
          <button class="${v === false ? 'no-active' : ''}" data-act="pregunta-set" data-id="${id}" data-idx="${qi}" data-value="false">No</button>
        </div>
      </div>
    `;
  }).join('');

  const validaClass = ok ? 'ok' : (selIdea.preguntas.some(p => p === false) ? 'no' : 'pend');
  const validaTxt = ok
    ? '✓ Validada — puede entrar al calendario'
    : (selIdea.preguntas.some(p => p === false)
      ? '✕ No pasa el filtro. Descártala o replantéala.'
      : '○ Pendiente: ' + (selIdea.objetivos.length === 0 ? 'elige al menos un objetivo' : 'responde las cuatro preguntas'));

  const fechaHtml = ok ? `
    <div class="fecha-row">
      <input type="date" data-change="idea-fecha" data-id="${id}" value="${escapeHtml(selIdea.fecha || '')}">
      <button class="btn-ghost" data-act="fecha-quitar" data-id="${id}">Quitar</button>
    </div>
  ` : `
    <div class="fecha-blocked">⌀ Bloqueada. Cuatro «sí» + un objetivo estratégico para entrar al calendario.</div>
  `;

  const etapasHtml = PIPELINE.map((label, ei) => `
    <button class="etapa-btn ${ei <= selIdea.etapa ? 'done' : ''}" data-act="etapa-set" data-id="${id}" data-idx="${ei}">${String(ei + 1).padStart(2, '0')} ${escapeHtml(label)}</button>
  `).join('');

  const resultadosHtml = selIdea.estado === 'publicada' ? `
    <div class="validation-box">
      <div class="section-title">Resultados — análisis y aprendizajes</div>
      <div class="resultados-grid">
        <div class="resultado-field"><span>Alcance</span><input data-change="idea-metrica" data-id="${id}" data-campo="alcance" value="${escapeHtml(met.alcance || '')}" placeholder="12.4k"></div>
        <div class="resultado-field"><span>Guardados</span><input data-change="idea-metrica" data-id="${id}" data-campo="guardados" value="${escapeHtml(met.guardados || '')}" placeholder="318"></div>
        <div class="resultado-field"><span>Seguidores +</span><input data-change="idea-metrica" data-id="${id}" data-campo="seguidores" value="${escapeHtml(met.seguidores || '')}" placeholder="62"></div>
      </div>
      <textarea data-change="idea-aprendizaje" data-id="${id}" rows="2" placeholder="¿Qué repites? ¿Qué no vuelves a hacer?">${escapeHtml(selIdea.aprendizaje || '')}</textarea>
    </div>
  ` : '';

  return `
    <div class="drawer-overlay">
      <div class="drawer-backdrop" data-act="drawer-cerrar"></div>
      <div class="drawer" role="dialog" aria-modal="true" aria-label="Detalle de idea">
        <div class="drawer-top">
          <span class="chip">${estadoChip}</span>
          <button class="btn-close" data-act="drawer-cerrar">✕</button>
        </div>

        <div class="field">
          <label class="field-label">Idea principal</label>
          <textarea class="title-field" data-change="idea-titulo" data-id="${id}" rows="2">${escapeHtml(selIdea.titulo)}</textarea>
        </div>

        <div class="field-row-2">
          <div class="field">
            <label class="field-label">Marca</label>
            <select data-change="idea-marca" data-id="${id}">
              <option value="brant" ${selIdea.marca === 'brant' ? 'selected' : ''}>Brant</option>
              <option value="bacu" ${selIdea.marca === 'bacu' ? 'selected' : ''}>Bacu Creative</option>
              <option value="novena" ${selIdea.marca === 'novena' ? 'selected' : ''}>Novena Crew</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Compartida con</label>
            <select data-change="idea-colab" data-id="${id}">
              ${colabOpts.map(co => `<option value="${co.v}" ${(selIdea.colab || '') === co.v ? 'selected' : ''}>${co.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="field">
          <label class="field-label">Notas — la historia primero, el formato después</label>
          <textarea class="nota-field" data-change="idea-nota" data-id="${id}" rows="3">${escapeHtml(selIdea.nota)}</textarea>
        </div>

        <button class="btn-ghost" data-act="ir-a-guion" data-id="${id}" style="align-self:flex-start;">Escribir guion →</button>

        <div class="field">
          <label class="field-label">Objetivo estratégico — mínimo uno</label>
          <div class="chips-wrap">${objChipsHtml}</div>
        </div>

        <div class="field-row-2">
          <div class="field">
            <label class="field-label">Formato</label>
            <select data-change="idea-formato" data-id="${id}">
              ${FORMATOS.map(fo => `<option value="${fo}" ${selIdea.formato === fo ? 'selected' : ''}>${fo}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label class="field-label">Tiempo de producción</label>
            <input data-change="idea-tiempo" data-id="${id}" value="${escapeHtml(selIdea.tiempo)}" placeholder="p. ej. 4 h / 2 días">
          </div>
        </div>

        <div class="field">
          <label class="field-label">Gancho — primeros 2 segundos / primera línea</label>
          <input data-change="idea-gancho" data-id="${id}" value="${escapeHtml(selIdea.gancho || '')}" placeholder="¿Por qué alguien deja de hacer scroll?">
        </div>

        <div class="toggle-row">
          <button class="toggle-btn" data-act="grab-toggle" data-id="${id}"><span class="${selIdea.grabacion ? 'on' : ''}">${selIdea.grabacion ? '●' : '○'} Grabación nueva</span></button>
          <button class="toggle-btn" data-act="ed-toggle" data-id="${id}"><span class="${selIdea.edicion ? 'on' : ''}">${selIdea.edicion ? '●' : '○'} Edición</span></button>
          ${prios}
        </div>

        <div class="field">
          <label class="field-label">Fecha de rodaje</label>
          <div class="fecha-row">
            <input type="date" data-change="idea-fecha-rodaje" data-id="${id}" value="${escapeHtml(selIdea.fechaRodaje || '')}" style="flex:1; color-scheme:dark;">
            ${selIdea.fechaRodaje ? `<button class="btn-ghost" data-act="fecha-rodaje-quitar" data-id="${id}">Quitar</button>` : ''}
          </div>
        </div>

        <div class="validation-box">
          <div class="section-title">Validación — las cuatro preguntas</div>
          <div style="display:flex; flex-direction:column; gap:14px;">${pregsHtml}</div>
          <div style="margin-top:18px; padding-top:14px; border-top:1px solid var(--line);">
            <span class="valida-txt ${validaClass}">${validaTxt}</span>
          </div>
        </div>

        <div class="field">
          <label class="field-label">Fecha de publicación</label>
          ${fechaHtml}
        </div>

        <div class="field">
          <label class="field-label">Etapa de producción</label>
          <div class="etapas-wrap">${etapasHtml}</div>
          <div class="etapa-hint">${ETAPA_HINTS[selIdea.etapa] || ''}</div>
        </div>

        ${resultadosHtml}

        <div class="drawer-footer">
          <select data-change="idea-estado" data-id="${id}">
            <option value="desarrollo" ${selIdea.estado === 'desarrollo' ? 'selected' : ''}>En desarrollo</option>
            <option value="lista" ${selIdea.estado === 'lista' ? 'selected' : ''}>Lista para producir</option>
            <option value="publicada" ${selIdea.estado === 'publicada' ? 'selected' : ''}>Publicada</option>
            <option value="descartada" ${selIdea.estado === 'descartada' ? 'selected' : ''}>Descartada</option>
          </select>
          <button class="btn-delete" data-act="idea-eliminar" data-id="${id}">Eliminar</button>
        </div>
      </div>
    </div>
  `;
}
