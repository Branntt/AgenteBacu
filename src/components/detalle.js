import { MARCAS, OBJETIVOS, FORMATOS, PIPELINE, ETAPA_HINTS, PREGUNTAS_VALIDACION } from '../data/constants.js';
import { escapeHtml } from '../lib/format.js';
import { valida } from '../lib/idea.js';

const ESTADO_LABELS = {
  prospecto: 'Prospecto',
  desarrollo: 'En conversación para desarrollo',
  grabar: 'Grabación',
  edicion: 'Proyecto por editar',
  entrega: 'Por confirmar entrega',
  por_pagar: 'Por pagar / Por entregar',
  ya_pago: 'Ya pagos / Entregados',
  descartada: 'Descartada',
  // estados viejos que aún pueden existir en ideas antiguas
  produccion: 'Por producirse',
  lista: 'Lista para producir',
  publicada: 'Publicada'
};

export function renderDetalle(state) {
  const selIdea = state.ideas.find(i => i.id === state.selId);
  if (!selIdea) return '';

  const id = escapeHtml(selIdea.id);
  const ok = valida(selIdea);
  const met = selIdea.metricas || {};

  const colabOpts = [{ v: '', label: 'Ninguna' }].concat(
    Object.keys(MARCAS).filter(k => k !== selIdea.marca).map(k => ({ v: k, label: MARCAS[k].nombre }))
  );

  // Una Estrategia es el plan detrás de un grupo de piezas: no se enlaza a otra (muestra
  // cuánto contenido cuelga de ella); todo lo demás puede enlazarse a una o quedar "Aparte".
  let estrategiaHtml;
  if (selIdea.formato === 'Estrategia') {
    const nHijos = state.ideas.filter(i => i.basadoEnId === selIdea.id).length;
    estrategiaHtml = `
      <div class="field">
        <label class="field-label">Contenido basado en esta estrategia</label>
        <div class="panel-footnote" style="margin:0;">${nHijos ? `${nHijos} pieza${nHijos === 1 ? '' : 's'} de contenido enlazada${nHijos === 1 ? '' : 's'} acá.` : 'Ninguna todavía — al crear un Foto/Carrusel/Post se puede elegir esta estrategia en "Basado en".'}</div>
      </div>
    `;
  } else {
    const estrategiaOpts = [{ v: '', label: 'Aparte (contenido independiente)' }].concat(
      state.ideas.filter(i => i.formato === 'Estrategia' && i.marca === selIdea.marca && i.id !== selIdea.id)
        .map(e => ({ v: e.id, label: e.titulo || 'Estrategia sin título' }))
    );
    estrategiaHtml = `
      <div class="field">
        <label class="field-label">Basado en / Estrategia</label>
        <select data-change="idea-basado-en" data-id="${id}">
          ${estrategiaOpts.map(o => `<option value="${escapeHtml(o.v)}" ${(selIdea.basadoEnId || '') === o.v ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}
        </select>
      </div>
    `;
  }

  const estadoChip = ESTADO_LABELS[selIdea.estado] + (selIdea.colab ? ' · compartida' : '');

  const objChipsHtml = OBJETIVOS.map((label, oi) => {
    const active = selIdea.objetivos.includes(oi);
    return `<button class="chip-toggle ${active ? 'active' : ''}" data-act="obj-toggle" data-id="${id}" data-idx="${oi}">${escapeHtml(label)}</button>`;
  }).join('');

  const prios = ['Alta', 'Media', 'Baja'].map(p => `
    <button class="prio-btn ${selIdea.prioridad === p ? 'active' : ''}" data-act="prio-set" data-id="${id}" data-value="${p}">${p}</button>
  `).join('');

  const pregsHtml = PREGUNTAS_VALIDACION.map((texto, qi) => {
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
      <input type="date" data-change="idea-fecha" data-id="${id}" value="${escapeHtml(selIdea.fecha || '')}" min="2026-01-01">
      <button class="btn-ghost" data-act="fecha-quitar" data-id="${id}">Quitar</button>
    </div>
  ` : `
    <div class="fecha-blocked">⌀ Bloqueada. Cuatro «sí» + un objetivo estratégico para entrar al calendario.</div>
  `;

  const etapasHtml = PIPELINE.map((label, ei) => `
    <button class="etapa-btn ${ei <= selIdea.etapa ? 'done' : ''}" data-act="etapa-set" data-id="${id}" data-idx="${ei}">${String(ei + 1).padStart(2, '0')} ${escapeHtml(label)}</button>
  `).join('');

  // 'ya_pago' es el estado terminal actual; 'publicada' es su alias viejo (ver
  // enColumnaIdea en views/guiones.js) — el selector de estado de este mismo drawer ya no
  // produce 'publicada', así que exigir solo ese valor dejaba esta sección inalcanzable
  // para cualquier idea cerrada por la UI actual.
  const resultadosHtml = (selIdea.estado === 'ya_pago' || selIdea.estado === 'publicada') ? `
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

        <!-- El brief que se responde al anotar la idea (ver components/nuevaIdea.js). Vive
             acá para poder releerlo y corregirlo cuando llega el momento de grabar: escribir
             para qué es y qué se espera no sirve de nada si después no se puede volver a ver. -->
        <div class="field">
          <label class="field-label">¿Para quién es?</label>
          <input data-change="idea-cliente" data-id="${id}" value="${escapeHtml(selIdea.cliente || '')}" placeholder="Un cliente o una de tus marcas" list="lista-para-quien" autocomplete="off">
        </div>
        <div class="field">
          <label class="field-label">¿En qué consiste?</label>
          <textarea class="nota-field" data-change="idea-consiste" data-id="${id}" rows="2" placeholder="De qué se trata">${escapeHtml(selIdea.consiste || '')}</textarea>
        </div>
        <div class="field">
          <label class="field-label">¿Cómo la vas a grabar?</label>
          <textarea class="nota-field" data-change="idea-como-grabar" data-id="${id}" rows="2" placeholder="Dónde, con qué, qué planos">${escapeHtml(selIdea.como_grabar || '')}</textarea>
        </div>
        <div class="field">
          <label class="field-label">¿Qué esperás de este video?</label>
          <textarea class="nota-field" data-change="idea-que-espero" data-id="${id}" rows="2" placeholder="Qué querés que pase cuando lo vean">${escapeHtml(selIdea.que_espero || '')}</textarea>
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

        ${estrategiaHtml}

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
            <input type="date" data-change="idea-fecha-rodaje" data-id="${id}" value="${escapeHtml(selIdea.fechaRodaje || '')}" min="2026-01-01" style="flex:1; color-scheme:dark;">
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
            <option value="prospecto" ${selIdea.estado === 'prospecto' ? 'selected' : ''}>Prospecto</option>
            <option value="desarrollo" ${selIdea.estado === 'desarrollo' || selIdea.estado === 'lista' ? 'selected' : ''}>En conversación para desarrollo</option>
            <option value="grabar" ${selIdea.estado === 'grabar' || selIdea.estado === 'produccion' ? 'selected' : ''}>Grabación</option>
            <option value="edicion" ${selIdea.estado === 'edicion' ? 'selected' : ''}>Proyecto por editar</option>
            <option value="entrega" ${selIdea.estado === 'entrega' ? 'selected' : ''}>Por confirmar entrega</option>
            <option value="por_pagar" ${selIdea.estado === 'por_pagar' ? 'selected' : ''}>Por pagar / Por entregar</option>
            <option value="ya_pago" ${selIdea.estado === 'ya_pago' || selIdea.estado === 'publicada' ? 'selected' : ''}>Ya pagos / Entregados</option>
            <option value="descartada" ${selIdea.estado === 'descartada' ? 'selected' : ''}>Descartada</option>
          </select>
          <button class="btn-delete" data-act="idea-eliminar" data-id="${id}">Eliminar</button>
        </div>
      </div>
    </div>
  `;
}
