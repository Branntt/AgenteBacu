import { state, actions, subscribe } from './state/store.js';
import { TEMA_MAP } from './data/constants.js';
import { renderHeader } from './components/header.js';
import { renderDetalle } from './components/detalle.js';
import { renderGuion } from './components/guion.js';
import { renderPanorama } from './views/panorama.js';
import { renderBanco } from './views/banco.js';
import { renderDesarrollo } from './views/desarrollo.js';
import { renderCalendario } from './views/calendario.js';
import { renderClientes } from './views/clientes.js';
import { renderSeguimiento } from './views/seguimiento.js';

const VIEWS = {
  panorama: renderPanorama,
  banco: renderBanco,
  desarrollo: renderDesarrollo,
  calendario: renderCalendario,
  clientes: renderClientes,
  seguimiento: renderSeguimiento
};

const root = document.getElementById('app');

function render() {
  const temaAttr = TEMA_MAP[state.tema] || 'cine';
  const view = VIEWS[state.view] || renderPanorama;
  const scroll = root.scrollTop;
  root.innerHTML = `
    <div class="app-root" data-tema="${temaAttr}">
      ${renderHeader(state)}
      ${view(state)}
      ${renderDetalle(state)}
      ${renderGuion(state)}
    </div>
  `;
  root.scrollTop = scroll;
}

subscribe(render);
render();

root.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const { act, id, view, marca, filtro, idx, value } = el.dataset;

  switch (act) {
    case 'nav-go': actions.setView(view); break;
    case 'nueva-idea': actions.nuevaIdea(); break;
    case 'marca-abrir': actions.abrirMarca(marca); break;
    case 'filtro-set': actions.setFiltro(filtro); break;
    case 'idea-abrir': actions.abrirIdea(id); break;
    case 'idea-eliminar': actions.eliminarIdea(id); break;
    case 'cal-prev': actions.cambiaMes(-1); break;
    case 'cal-next': actions.cambiaMes(1); break;
    case 'cal-hoy': actions.irAHoy(); break;
    case 'cliente-nuevo': actions.nuevoCliente(); break;
    case 'cliente-eliminar': actions.eliminarCliente(id); break;
    case 'snap-abre': actions.snapAbre(); break;
    case 'snap-cierra': actions.snapCierra(); break;
    case 'snap-guarda': actions.snapGuarda(); break;
    case 'obj-toggle': actions.toggleObjetivo(id, Number(idx)); break;
    case 'prio-set': actions.updIdea(id, { prioridad: value }); break;
    case 'pregunta-set': actions.setPregunta(id, Number(idx), value === 'true'); break;
    case 'fecha-quitar': actions.updIdea(id, { fecha: null }); break;
    case 'etapa-set': actions.updIdea(id, { etapa: Number(idx) }); break;
    case 'grab-toggle': {
      const idea = state.ideas.find(i => i.id === id);
      if (idea) actions.updIdea(id, { grabacion: !idea.grabacion });
      break;
    }
    case 'ed-toggle': {
      const idea = state.ideas.find(i => i.id === id);
      if (idea) actions.updIdea(id, { edicion: !idea.edicion });
      break;
    }
    case 'drawer-cerrar': actions.cerrarDrawer(); break;
    case 'ir-a-guion': actions.cerrarDrawer(); actions.abrirGuion(id); break;
    case 'filtro-desarrollo-set': actions.setFiltroDesarrollo(filtro); break;
    case 'guion-abrir': actions.abrirGuion(id); break;
    case 'guion-cerrar': actions.cerrarGuion(); break;
    case 'guion-item-agregar': actions.addGuionItem(id); break;
    case 'guion-item-quitar': actions.removeGuionItem(id, Number(idx)); break;
    case 'guion-marcar-lista': actions.updIdea(id, { estado: 'lista' }); actions.cerrarGuion(); break;
  }
});

root.addEventListener('change', e => {
  const el = e.target.closest('[data-change]');
  if (el) {
    const { change, id, campo, key, idx } = el.dataset;
    const value = el.type === 'checkbox' ? el.checked : el.value;

    switch (change) {
      case 'idea-titulo': actions.updIdea(id, { titulo: value }); break;
      case 'idea-nota': actions.updIdea(id, { nota: value }); break;
      case 'idea-gancho': actions.updIdea(id, { gancho: value }); break;
      case 'idea-marca': {
        const idea = state.ideas.find(i => i.id === id);
        const colab = idea && idea.colab === value ? '' : (idea ? idea.colab : '');
        actions.updIdea(id, { marca: value, colab });
        break;
      }
      case 'idea-colab': actions.updIdea(id, { colab: value }); break;
      case 'idea-formato': actions.updIdea(id, { formato: value }); break;
      case 'idea-tiempo': actions.updIdea(id, { tiempo: value }); break;
      case 'idea-fecha': actions.updIdea(id, { fecha: value || null }); break;
      case 'idea-estado': actions.updIdea(id, { estado: value }); break;
      case 'idea-metrica': actions.setMetrica(id, campo, value); break;
      case 'idea-aprendizaje': actions.updIdea(id, { aprendizaje: value }); break;
      case 'cliente-nombre': actions.updCliente(id, { nombre: value }); break;
      case 'cliente-proyecto': actions.updCliente(id, { proyecto: value }); break;
      case 'cliente-nota': actions.updCliente(id, { nota: value }); break;
      case 'cliente-estado': actions.updCliente(id, { estado: value }); break;
      case 'snap-fecha': actions.snapSetFecha(value); break;
      case 'snap-campo': actions.snapSetCampo(key, value); break;
      case 'tema': actions.setTema(value); break;
      case 'calma': actions.setModoCalma(value); break;
      case 'guion-campo': actions.setGuionCampo(id, campo, value); break;
      case 'guion-item-campo': actions.updGuionItem(id, Number(idx), campo, value); break;
    }
    return;
  }
});
