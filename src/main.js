import { state, actions, subscribe, initAuth } from './state/store.js';
import { persistValue, loadValue } from './lib/storage.js';
import { TEMA_MAP } from './data/constants.js';
import { parseN } from './lib/format.js';
import { renderHeader } from './components/header.js';
import { renderDetalle } from './components/detalle.js';
import { renderClienteDetalle } from './components/clienteDetalle.js';
import { renderGuion } from './components/guion.js';
import { renderRodajeRapido } from './components/rodajeRapido.js';
import { renderCuentaCobro } from './components/cuentaCobro.js';
import { renderHistorialCuentas } from './components/historialCuentas.js';
import { renderLogin } from './views/login.js';
import { renderPanorama } from './views/panorama.js';
import { renderGuiones } from './views/guiones.js';
import { renderCalendario } from './views/calendario.js';
import { renderClientes } from './views/clientes.js';
import { renderFinanciamiento } from './views/financiamiento.js';
import { renderIAModal } from './views/iaModal.js';

const VIEWS = {
  panorama: renderPanorama,
  guiones: renderGuiones,
  calendario: renderCalendario,
  clientes: renderClientes,
  financiamiento: renderFinanciamiento
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
      ${renderClienteDetalle(state)}
      ${renderGuion(state)}
      ${renderRodajeRapido(state)}
      ${renderCuentaCobro(state)}
      ${renderHistorialCuentas(state)}
      ${renderIAModal(state)}
    </div>
  `;
  restaurarFoco(foco);

  const drawerAbiertoAhora = !!(state.selId || state.clienteSelId || state.guionId || state.rodajeDraft || state.cuentaCobroDraft || state.historialAbierto || state.iaDraft);
  if (drawerAbiertoAhora && !drawerAbiertoAntes) {
    const drawer = root.querySelector('.drawer');
    const primero = drawer && drawer.querySelector(FOCUSABLE);
    if (primero) primero.focus();
  }
  drawerAbiertoAntes = drawerAbiertoAhora;
}

// Guardar scroll justo antes de recargar/cerrar
window.addEventListener('beforeunload', () => {
  const y = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  persistValue('app.scroll', y);
});

let yaRestoramos = false;
const restaurarScrollAlCargar = () => {
  if (state.dataReady && state.session && !yaRestoramos) {
    yaRestoramos = true;
    const scrollGuardado = loadValue('app.scroll', 0);
    // Restaurar en el siguiente frame después de que el DOM esté completamente renderizado
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollGuardado);
    });
  }
};

subscribe(render);
render();
initAuth();
subscribe(restaurarScrollAlCargar);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

document.addEventListener('keydown', e => {
  const drawerAbierto = state.selId || state.clienteSelId || state.guionId || state.rodajeDraft || state.cuentaCobroDraft || state.iaDraft;
  if (!drawerAbierto) return;

  if (e.key === 'Escape') {
    if (state.selId) actions.cerrarDrawer();
    if (state.clienteSelId) actions.cerrarClienteDetalle();
    if (state.guionId) actions.cerrarGuion();
    if (state.rodajeDraft) actions.rodajeRapidoCerrar();
    if (state.cuentaCobroDraft) actions.cuentaCobroCerrar();
    if (state.iaDraft) actions.iaCerrar();
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
  const noNav = e.target.closest('[data-no-nav]');
  if (noNav && !noNav.contains(el)) return;
  const { act, id, view, marca, idx, value, fecha, categoria, direccion } = el.dataset;

  switch (act) {
    case 'nav-go': actions.setView(view); break;
    case 'nueva-idea': actions.nuevaIdea(); break;
    case 'marca-abrir': actions.abrirMarca(marca); break;
    case 'idea-abrir': actions.abrirIdea(id); break;
    case 'idea-eliminar': actions.eliminarIdea(id); break;
    case 'cal-prev': state.calVista === 'semana' ? actions.cambiaSemana(-1) : actions.cambiaMes(-1); break;
    case 'cal-next': state.calVista === 'semana' ? actions.cambiaSemana(1) : actions.cambiaMes(1); break;
    case 'cal-hoy': actions.irAHoy(); break;
    case 'cliente-nuevo': actions.nuevoCliente(); break;
    case 'cliente-abrir': actions.abrirCliente(id); break;
    case 'cliente-detalle-cerrar': actions.cerrarClienteDetalle(); break;
    case 'cliente-eliminar': actions.eliminarCliente(id); break;
    case 'clientes-exportar': actions.exportarListadoClientes(); break;
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
    case 'guion-abrir': actions.abrirGuion(id); break;
    case 'guion-cerrar': actions.cerrarGuion(); break;
    case 'guion-item-agregar': actions.addGuionItem(id); break;
    case 'guion-item-quitar': actions.removeGuionItem(id, Number(idx)); break;
    case 'guion-marcar-lista': actions.updIdea(id, { estado: 'lista' }); actions.cerrarGuion(); break;
    case 'descartar-aviso-guardado': actions.descartarAvisoGuardado(); break;
    case 'logout': actions.logout(); break;
    case 'rodaje-rapido-abrir': actions.rodajeRapidoAbrir(fecha); break;
    case 'rodaje-rapido-cerrar': actions.rodajeRapidoCerrar(); break;
    case 'rodaje-rapido-guardar': actions.rodajeRapidoGuardar(); break;
    case 'cc-abrir': {
      const cliente = state.clientes.find(c => c.id === id);
      if (cliente) { actions.cerrarClienteDetalle(); actions.cuentaCobroAbrir(cliente); }
      break;
    }
    case 'cc-cerrar': actions.cuentaCobroCerrar(); break;
    case 'cc-generar': actions.cuentaCobroGenerar(); break;
    case 'cc-item-agregar': actions.cuentaCobroAddItem(); break;
    case 'cc-item-quitar': actions.cuentaCobroRemoveItem(Number(idx)); break;
    case 'cc-item-concepto': actions.cuentaCobroUpdItem(Number(idx), 'descripcion', value); break;
    case 'movimiento-nuevo': actions.movimientoNuevo(); break;
    case 'movimiento-agregar-rapido': {
      const fecha = document.querySelector('[data-change="mov-fecha"]')?.value;
      const nota = document.querySelector('[data-change="mov-nota"]')?.value;
      const monto = parseN(document.querySelector('[data-change="mov-monto"]')?.value);
      const tipo = document.querySelector('[data-change="mov-tipo"]')?.value;
      if (fecha && monto > 0 && tipo) {
        actions.movimientoAgregar({ fecha, nota: nota || '', monto, tipo });
        document.querySelector('[data-change="mov-fecha"]').value = '';
        document.querySelector('[data-change="mov-nota"]').value = '';
        document.querySelector('[data-change="mov-monto"]').value = '';
      }
      break;
    }
    case 'movimiento-eliminar': actions.eliminarMovimiento(id); break;
    case 'deuda-nueva': actions.deudaNueva(direccion); break;
    case 'deuda-toggle': actions.toggleDeudaPagada(id); break;
    case 'deuda-eliminar': actions.eliminarDeuda(id); break;
    case 'gasto-nuevo': actions.gastoNuevo(); break;
    case 'gasto-eliminar': actions.eliminarGasto(id); break;
    case 'pago-mensual-nuevo': actions.pagoMensualNuevo(); break;
    case 'pago-mensual-eliminar': actions.eliminarPagoMensual(id); break;
    case 'meta-personal-nueva': actions.metaPersonalNueva(categoria); break;
    case 'meta-personal-eliminar': actions.eliminarMetaPersonal(id); break;
    case 'meta-personal-toggle': {
      const meta = state.metasPersonales.find(m => m.id === id);
      if (meta) actions.updMetaPersonal(id, { cumplida: !meta.cumplida });
      break;
    }
    case 'tarea-nueva': actions.tareaNueva(); break;
    case 'tarea-toggle': actions.toggleTarea(id); break;
    case 'tarea-eliminar': actions.eliminarTarea(id); break;
    case 'historial-abrir': actions.historialAbrir(); break;
    case 'historial-cerrar': actions.historialCerrar(); break;
    case 'cc-historial-descargar': {
      const cc = state.cuentasCobro.find(c => c.id === id);
      if (cc) actions.cuentaCobroDescargar(cc);
      break;
    }
    case 'ia-abrir': actions.iaAbrir(); break;
    case 'ia-cerrar': actions.iaCerrar(); break;
    case 'ia-generar': actions.iaGenerar(); break;
    case 'ia-confirmar': actions.iaConfirmar(); break;
  }
});

root.addEventListener('submit', e => {
  const form = e.target.closest('[data-form="login"]');
  if (!form) return;
  e.preventDefault();
  const email = form.querySelector('[name="email"]').value;
  const password = form.querySelector('[name="password"]').value;
  actions.login(email, password);
});

root.addEventListener('change', e => {
  const el = e.target.closest('[data-change]');
  if (el) {
    const { change, id, campo, key, idx, marca } = el.dataset;
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
      case 'cliente-precio': actions.updCliente(id, { precio: parseN(value) }); break;
      case 'cliente-documento': actions.updCliente(id, { documento: value }); break;
      case 'cliente-nota': actions.updCliente(id, { nota: value }); break;
      case 'cliente-fecha-grabacion': actions.updCliente(id, { fecha_grabacion: value || null }); break;
      case 'cliente-estado': actions.updCliente(id, { estado: value }); break;
      case 'snap-fecha': actions.snapSetFecha(value); break;
      case 'snap-campo': actions.snapSetCampo(key, value); break;
      case 'tema': actions.setTema(value); break;
      case 'calma': actions.setModoCalma(value); break;
      case 'guion-campo': actions.setGuionCampo(id, campo, value); break;
      case 'guion-item-campo': actions.updGuionItem(id, Number(idx), campo, value); break;
      case 'rodaje-rapido-campo': actions.rodajeRapidoSetCampo(campo, campo === 'precio' ? parseN(value) : value); break;
      case 'cc-campo': actions.cuentaCobroSetCampo(campo, value); break;
      case 'cc-item-campo': actions.cuentaCobroUpdItem(Number(idx), campo, value); break;
      case 'historial-busqueda': actions.historialSetBusqueda(value); break;
      case 'movimiento-fuente': actions.updMovimiento(id, { fuente: value }); break;
      case 'movimiento-tipo': actions.updMovimiento(id, { tipo: value }); break;
      case 'movimiento-fecha': actions.updMovimiento(id, { fecha: value }); break;
      case 'movimiento-monto': actions.updMovimiento(id, { monto: parseN(value) }); break;
      case 'movimiento-nota': actions.updMovimiento(id, { nota: value }); break;
      case 'deuda-persona': actions.updDeuda(id, { persona: value }); break;
      case 'deuda-monto': actions.updDeuda(id, { monto: parseN(value) }); break;
      case 'deuda-nota': actions.updDeuda(id, { nota: value }); break;
      case 'pago-mensual-nombre': actions.updPagoMensual(id, { nombre: value }); break;
      case 'pago-mensual-monto': actions.updPagoMensual(id, { monto: parseN(value) }); break;
      case 'pago-mensual-dia': actions.updPagoMensual(id, { dia_pago: parseN(value) || null }); break;
      case 'meta-personal-titulo': actions.updMetaPersonal(id, { titulo: value }); break;
      case 'meta-personal-fecha': actions.updMetaPersonal(id, { fecha: value || null }); break;
      case 'meta-mensual-set': actions.setMetaMensual(marca, state.month, parseN(value)); break;
      case 'tarea-texto': actions.updTarea(id, { texto: value }); break;
      case 'presupuesto-ingresos': actions.updPresupuesto('ingresosMensuales', value); break;
      case 'presupuesto-arriendo': actions.updPresupuesto('arriendo', value); break;
      case 'presupuesto-servicios': actions.updPresupuesto('servicios', value); break;
      case 'presupuesto-comida': actions.updPresupuesto('comida', value); break;
      case 'presupuesto-transporte': actions.updPresupuesto('transporte', value); break;
      case 'presupuesto-personales': actions.updPresupuesto('personales', value); break;
      case 'presupuesto-entretenimiento': actions.updPresupuesto('entretenimiento', value); break;
      case 'presupuesto-telefono': actions.updPresupuesto('telefono', value); break;
      case 'presupuesto-salud': actions.updPresupuesto('salud', value); break;
      case 'presupuesto-ahorro': actions.updPresupuesto('ahorro', value); break;
      case 'tarea-fecha': actions.updTarea(id, { fecha: value || null }); break;
      case 'cal-vista-set': actions.setCalVista(value); break;
      case 'filtro-calendario-set': actions.setFiltroCalendario(value); break;
      case 'filtro-guiones-set': actions.setFiltroGuiones(value); break;
      case 'guiones-vista-set': actions.setGuionesVista(value); break;
      case 'ia-set-marca': actions.iaSetCampo('marca', value); break;
      case 'ia-set-modo': actions.iaSetCampo('modo', value); break;
      case 'ia-set-tema': actions.iaSetCampo('tema', value); break;
      case 'ia-set-formato': actions.iaSetCampo('formato', value); break;
    }
    return;
  }
});
