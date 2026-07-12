import { state, actions, subscribe, initAuth } from './state/store.js';
import { TEMA_MAP } from './data/constants.js';
import { renderHeader } from './components/header.js';
import { renderDetalle } from './components/detalle.js';
import { renderGuion } from './components/guion.js';
import { renderRodajeRapido } from './components/rodajeRapido.js';
import { renderCuentaCobro } from './components/cuentaCobro.js';
import { renderLogin } from './views/login.js';
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
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function capturarFoco() {
  const el = document.activeElement;
  if (!el || el === document.body || !root.contains(el)) return null;
  const attrs = ['data-change', 'data-act', 'data-id', 'data-campo', 'data-idx', 'data-key', 'id'];
  const sel = attrs.map(a => el.getAttribute(a) ? `[${a}="${CSS.escape(el.getAttribute(a))}"]` : '').join('');
  if (!sel) return null;
  return { selector: el.tagName.toLowerCase() + sel, start: el.selectionStart, end: el.selectionEnd };
}

function restaurarFoco(info) {
  if (!info) return;
  const el = root.querySelector(info.selector);
  if (!el) return;
  el.focus();
  if (typeof info.start === 'number' && el.setSelectionRange) {
    try { el.setSelectionRange(info.start, info.end); } catch (e) {}
  }
}

let drawerAbiertoAntes = false;

function render() {
  const temaAttr = TEMA_MAP[state.tema] || 'cine';
  const scroll = root.scrollTop;
  const foco = capturarFoco();

  if (!state.authReady) {
    root.innerHTML = `<div class="app-root" data-tema="${temaAttr}"><div class="carga-pantalla">Cargando…</div></div>`;
    return;
  }

  if (!state.session) {
    root.innerHTML = `<div class="app-root" data-tema="${temaAttr}">${renderLogin(state)}</div>`;
    restaurarFoco(foco);
    return;
  }

  if (!state.dataReady) {
    root.innerHTML = `<div class="app-root" data-tema="${temaAttr}">${renderHeader(state)}<div class="carga-pantalla">Sincronizando datos…</div></div>`;
    return;
  }

  const view = VIEWS[state.view] || renderPanorama;
  root.innerHTML = `
    <div class="app-root" data-tema="${temaAttr}">
      ${state.saveError ? `
        <div class="save-error-banner" role="alert">
          <span>No se pudo guardar el último cambio. Puede que el almacenamiento del navegador esté lleno o en modo privado.</span>
          <button data-act="descartar-aviso-guardado">✕</button>
        </div>
      ` : ''}
      ${renderHeader(state)}
      ${view(state)}
      ${renderDetalle(state)}
      ${renderGuion(state)}
      ${renderRodajeRapido(state)}
      ${renderCuentaCobro(state)}
    </div>
  `;
  root.scrollTop = scroll;
  restaurarFoco(foco);

  const drawerAbiertoAhora = !!(state.selId || state.guionId || state.rodajeDraft || state.cuentaCobroDraft);
  if (drawerAbiertoAhora && !drawerAbiertoAntes) {
    const drawer = root.querySelector('.drawer');
    const primero = drawer && drawer.querySelector(FOCUSABLE);
    if (primero) primero.focus();
  }
  drawerAbiertoAntes = drawerAbiertoAhora;
}

subscribe(render);
render();
initAuth();

document.addEventListener('keydown', e => {
  const drawerAbierto = state.selId || state.guionId || state.rodajeDraft || state.cuentaCobroDraft;
  if (!drawerAbierto) return;

  if (e.key === 'Escape') {
    if (state.selId) actions.cerrarDrawer();
    if (state.guionId) actions.cerrarGuion();
    if (state.rodajeDraft) actions.rodajeRapidoCerrar();
    if (state.cuentaCobroDraft) actions.cuentaCobroCerrar();
    return;
  }

  if (e.key === 'Tab') {
    const drawer = root.querySelector('.drawer');
    if (!drawer) return;
    const focusables = Array.from(drawer.querySelectorAll(FOCUSABLE));
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

root.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const { act, id, view, marca, filtro, idx, value, vista, fecha } = el.dataset;

  switch (act) {
    case 'nav-go': actions.setView(view); break;
    case 'nueva-idea': actions.nuevaIdea(); break;
    case 'marca-abrir': actions.abrirMarca(marca); break;
    case 'filtro-set': actions.setFiltro(filtro); break;
    case 'idea-abrir': actions.abrirIdea(id); break;
    case 'idea-eliminar': actions.eliminarIdea(id); break;
    case 'cal-prev': state.calVista === 'semana' ? actions.cambiaSemana(-1) : actions.cambiaMes(-1); break;
    case 'cal-next': state.calVista === 'semana' ? actions.cambiaSemana(1) : actions.cambiaMes(1); break;
    case 'cal-hoy': actions.irAHoy(); break;
    case 'cal-vista-set': actions.setCalVista(vista); break;
    case 'filtro-calendario-set': actions.setFiltroCalendario(filtro); break;
    case 'cliente-nuevo': actions.nuevoCliente(); break;
    case 'cliente-eliminar': actions.eliminarCliente(id); break;
    case 'snap-abre': actions.snapAbre(); break;
    case 'snap-cierra': actions.snapCierra(); break;
    case 'snap-guarda': actions.snapGuarda(); break;
    case 'obj-toggle': actions.toggleObjetivo(id, Number(idx)); break;
    case 'prio-set': actions.updIdea(id, { prioridad: value }); break;
    case 'pregunta-set': actions.setPregunta(id, Number(idx), value === 'true'); break;
    case 'fecha-quitar': actions.updIdea(id, { fecha: null }); break;
    case 'fecha-rodaje-quitar': actions.updIdea(id, { fechaRodaje: null }); break;
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
    case 'descartar-aviso-guardado': actions.descartarAvisoGuardado(); break;
    case 'logout': actions.logout(); break;
    case 'auth-toggle-modo': actions.authToggleModo(); break;
    case 'rodaje-rapido-abrir': actions.rodajeRapidoAbrir(fecha); break;
    case 'rodaje-rapido-cerrar': actions.rodajeRapidoCerrar(); break;
    case 'rodaje-rapido-guardar': actions.rodajeRapidoGuardar(); break;
    case 'cc-abrir': {
      const cliente = state.clientes.find(c => c.id === id);
      if (cliente) actions.cuentaCobroAbrir(cliente);
      break;
    }
    case 'cc-cerrar': actions.cuentaCobroCerrar(); break;
    case 'cc-generar': actions.cuentaCobroGenerar(); break;
    case 'cc-item-agregar': actions.cuentaCobroAddItem(); break;
    case 'cc-item-quitar': actions.cuentaCobroRemoveItem(Number(idx)); break;
  }
});

root.addEventListener('submit', e => {
  const loginForm = e.target.closest('[data-form="login"]');
  const signupForm = e.target.closest('[data-form="signup"]');
  const form = loginForm || signupForm;
  if (!form) return;
  e.preventDefault();
  const email = form.querySelector('[name="email"]').value;
  const password = form.querySelector('[name="password"]').value;
  if (signupForm) actions.signup(email, password);
  else actions.login(email, password);
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
      case 'idea-colab': {
        const idea = state.ideas.find(i => i.id === id);
        actions.updIdea(id, { colab: idea && value === idea.marca ? '' : value });
        break;
      }
      case 'idea-formato': actions.updIdea(id, { formato: value }); break;
      case 'idea-tiempo': actions.updIdea(id, { tiempo: value }); break;
      case 'idea-fecha': actions.updIdea(id, { fecha: value || null }); break;
      case 'idea-fecha-rodaje': actions.updIdea(id, { fechaRodaje: value || null }); break;
      case 'idea-estado': actions.updIdea(id, { estado: value }); break;
      case 'idea-metrica': actions.setMetrica(id, campo, value); break;
      case 'idea-aprendizaje': actions.updIdea(id, { aprendizaje: value }); break;
      case 'cliente-nombre': actions.updCliente(id, { nombre: value }); break;
      case 'cliente-proyecto': actions.updCliente(id, { proyecto: value }); break;
      case 'cliente-documento': actions.updCliente(id, { documento: value }); break;
      case 'cliente-nota': actions.updCliente(id, { nota: value }); break;
      case 'cliente-estado': actions.updCliente(id, { estado: value }); break;
      case 'snap-fecha': actions.snapSetFecha(value); break;
      case 'snap-campo': actions.snapSetCampo(key, value); break;
      case 'tema': actions.setTema(value); break;
      case 'calma': actions.setModoCalma(value); break;
      case 'guion-campo': actions.setGuionCampo(id, campo, value); break;
      case 'guion-item-campo': actions.updGuionItem(id, Number(idx), campo, value); break;
      case 'rodaje-rapido-campo': actions.rodajeRapidoSetCampo(campo, value); break;
      case 'cc-campo': actions.cuentaCobroSetCampo(campo, value); break;
      case 'cc-item-campo': actions.cuentaCobroUpdItem(Number(idx), campo, value); break;
    }
    return;
  }
});
