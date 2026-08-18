import { state, actions, subscribe, initAuth } from './state/store.js';
import { persistValue, loadValue } from './lib/storage.js';
import { TEMA_MAP } from './data/constants.js';
import { parseN } from './lib/format.js';
import { updateHabitStreak, calcularQuickCheck, logHabitToggle, syncHabitLogToday, isHabitMarkedOnDate } from './lib/bienestar.js';
import { hoyStr } from './lib/idea.js';
import { renderHeader } from './components/header.js';
import { renderDetalle } from './components/detalle.js';
import { renderClienteDetalle } from './components/clienteDetalle.js';
import { renderGuion } from './components/guion.js';
import { renderRodajeRapido } from './components/rodajeRapido.js';
import { renderCuentaCobro } from './components/cuentaCobro.js';
import { renderHistorialCuentas } from './components/historialCuentas.js';
import { renderLogin } from './views/login.js';
import { renderPanorama } from './views/panorama.js';
import { renderCalendario } from './views/calendario.js';
import { renderClientes } from './views/clientes.js';
import { renderFinanciamiento } from './views/financiamiento.js';
import { renderFinanzas } from './views/finanzas.js';
import { renderInventario } from './views/inventario.js';
import { renderBienestar } from './views/bienestar.js';
import { renderMetas } from './views/metas.js';
import { renderUniversidad } from './views/universidad.js';
import { renderPared } from './views/pared.js';
import { renderConfiguraciones } from './views/configuraciones.js';
import { renderNuevoContenido } from './components/nuevoContenido.js';
import { renderPersonaje3DCreador, sincronizarPersonaje3D } from './components/personaje3d.js';
import { renderRevisionIdeasModal } from './components/revisionIdeasModal.js';
import { renderNotificacionBacu } from './components/notificacionBacu.js';
import { renderClaseInfo } from './components/claseInfo.js';

/* ---------- Audio: sonidos sintetizados para hábitos ---------- */

let audioCtx = null;

function ensureAudio() {
  if (audioCtx) return true;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return true;
  } catch (e) { return false; }
}

function playTick() {
  if (!ensureAudio()) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1100, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

function playMiss() {
  if (!ensureAudio()) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

function playCelebrate() {
  if (!ensureAudio()) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const now = audioCtx.currentTime + i * 0.12;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  });
}

/* ---------- Confetti: canvas particles for 100% celebration ---------- */

const CONFETTI_COLORS = ['#1FAF74', '#17945F', '#EFC94C', '#FFFFFF', '#88D4AB', '#7FD1AE'];

function fireConfetti() {
  const canvas = document.getElementById('qc-confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  canvas.classList.add('qc-confetti-active');

  const particles = Array.from({ length: 70 }, () => ({
    x: canvas.width * 0.5 + (Math.random() - 0.5) * canvas.width * 0.4,
    y: canvas.height * 0.5,
    vx: (Math.random() - 0.5) * 14 * dpr,
    vy: (Math.random() * -12 - 4) * dpr,
    r: (Math.random() * 4 + 2) * dpr,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rot: Math.random() * Math.PI * 2,
    rv: (Math.random() - 0.5) * 0.2,
    life: 1,
  }));

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25 * dpr;
      p.rot += p.rv;
      p.life -= 0.012;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
      ctx.restore();
    }
    frame++;
    if (alive && frame < 180) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.classList.remove('qc-confetti-active');
    }
  }
  requestAnimationFrame(draw);
}

const VIEWS = {
  panorama: renderPanorama,
  calendario: renderCalendario,
  clientes: renderClientes,
  financiamiento: renderFinanciamiento,
  finanzas: renderFinanzas,
  inventario: renderInventario,
  bienestar: renderBienestar,
  metas: renderMetas,
  universidad: renderUniversidad,
  pared: renderPared,
  configuraciones: renderConfiguraciones
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

// ---- navegación por URL (#vista) ----
function vistaDeHash() {
  const v = window.location.hash.slice(1);
  return VIEWS[v] ? v : null;
}

let vistaHashAnterior = state.view;
let historialInicializado = false;

function sincronizarHashConVista() {
  if (!state.session) {
    if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
    return;
  }
  if (!state.dataReady || state.view === vistaHashAnterior) return;

  if (!historialInicializado) {
    // la entrada inicial del historial nunca recibió su propio hash — se lo damos
    // ahora (a la vista de la que venimos) para que "atrás" resuelva bien.
    history.replaceState({ view: vistaHashAnterior }, '', '#' + vistaHashAnterior);
    historialInicializado = true;
  }

  vistaHashAnterior = state.view;
  const nuevoHash = '#' + state.view;
  if (window.location.hash !== nuevoHash) {
    history.pushState({ view: state.view }, '', nuevoHash);
  }
}

function sincronizarVistaConHash() {
  const v = vistaDeHash();
  if (v && v !== state.view) actions.setView(v);
}

window.addEventListener('popstate', sincronizarVistaConHash);
window.addEventListener('hashchange', sincronizarVistaConHash);

const vistaInicial = vistaDeHash();
if (vistaInicial) actions.setView(vistaInicial);

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
      ${renderNuevoContenido(state)}
      ${renderPersonaje3DCreador(state)}
      ${renderRevisionIdeasModal(state)}
      ${renderNotificacionBacu(state)}
      ${renderClaseInfo(state)}
    </div>
  `;
  restaurarFoco(foco);
  sincronizarPersonaje3D(state);

  const drawerAbiertoAhora = !!(state.selId || state.clienteSelId || state.guionId || state.rodajeDraft || state.cuentaCobroDraft || state.historialAbierto || state.nuevoContenidoAbierto || state.personaje3dAbierto || state.claseInfo);
  if (drawerAbiertoAhora && !drawerAbiertoAntes) {
    const drawer = root.querySelector('.drawer');
    const primero = drawer && drawer.querySelector(FOCUSABLE);
    if (primero) primero.focus();
  }
  drawerAbiertoAntes = drawerAbiertoAhora;
}

// ---- memoria de scroll por pestaña ----
// Cada vista guarda su propia posición ('scroll.calendario', 'scroll.financiamiento', ...)
function guardarScrollVista() {
  const y = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  try { localStorage.setItem('scroll.' + state.view, String(Math.round(y))); } catch (e) {}
}
window.addEventListener('scroll', guardarScrollVista, { passive: true });

function restaurarScrollVista() {
  let y = 0;
  try { y = parseInt(localStorage.getItem('scroll.' + state.view) || '0', 10); } catch (e) {}
  const ir = () => window.scrollTo(0, y);
  requestAnimationFrame(ir);
  setTimeout(ir, 150);
}

// Al cambiar de pestaña, se restaura donde quedó esa pestaña
let vistaAnterior = state.view;
const alCambiarVista = () => {
  if (state.view !== vistaAnterior) {
    vistaAnterior = state.view;
    restaurarScrollVista();
  }
};

// Al recargar la página, se restaura el scroll de la pestaña activa
let yaRestoramos = false;
const restaurarScrollAlCargar = () => {
  if (state.dataReady && state.session && !yaRestoramos) {
    yaRestoramos = true;
    restaurarScrollVista();
    setTimeout(restaurarScrollVista, 400);
  }
};

subscribe(render);
subscribe(alCambiarVista);
subscribe(sincronizarHashConVista);
// Sync habit log once on each state change so weekly analytics capture today's data
subscribe(() => {
  const habitos = (state.metasPersonales || []).filter(m => m.categoria === 'habito');
  if (habitos.length) syncHabitLogToday(habitos, hoyStr());
});
render();
initAuth();
subscribe(restaurarScrollAlCargar);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

document.addEventListener('keydown', e => {
  const drawerAbierto = state.selId || state.clienteSelId || state.guionId || state.rodajeDraft || state.cuentaCobroDraft || state.nuevoContenidoAbierto || state.personaje3dAbierto || state.claseInfo || state.menuAbierto;
  if (!drawerAbierto) return;

  if (e.key === 'Escape') {
    if (state.selId) actions.cerrarDrawer();
    if (state.clienteSelId) actions.cerrarClienteDetalle();
    if (state.guionId) actions.cerrarGuion();
    if (state.rodajeDraft) actions.rodajeRapidoCerrar();
    if (state.cuentaCobroDraft) actions.cuentaCobroCerrar();
    if (state.nuevoContenidoAbierto) actions.nuevoContenidoCerrar();
    if (state.personaje3dAbierto) actions.personaje3dCerrar();
    if (state.claseInfo) actions.claseInfoCerrar();
    if (state.menuAbierto) actions.menuCerrar();
    return;
  }

  if (e.key === 'Tab') {
    const drawer = root.querySelector('.drawer') || root.querySelector('.nav.nav-abierto');
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
  const { act, id, view, marca, idx, value, fecha, categoria, direccion, vista, tipo } = el.dataset;

  switch (act) {
    case 'nav-go': actions.setView(view, vista); actions.menuCerrar(); break;
    case 'menu-toggle': actions.menuToggle(); break;
    case 'menu-cerrar': actions.menuCerrar(); break;
    case 'nueva-idea': actions.nuevaIdea(); break;
    case 'marca-abrir': actions.abrirMarca(marca); break;
    case 'idea-abrir': actions.abrirIdea(id); break;
    case 'idea-eliminar': actions.eliminarIdea(id); break;
    case 'cal-prev': state.calVista === 'semana' ? actions.cambiaSemana(-1) : actions.cambiaMes(-1); break;
    case 'cal-next': state.calVista === 'semana' ? actions.cambiaSemana(1) : actions.cambiaMes(1); break;
    case 'cal-hoy': actions.irAHoy(); break;
    case 'clase-info': {
      const { materia, profesor, salon, lugar, horaInicio, horaFin } = el.dataset;
      actions.claseInfoAbrir({ materia, profesor, salon, lugar, horaInicio, horaFin });
      break;
    }
    case 'clase-info-cerrar': actions.claseInfoCerrar(); break;
    case 'cliente-nuevo': actions.nuevoCliente(); break;
    case 'cliente-abrir': actions.abrirCliente(id); break;
    case 'cliente-abrir-calendario': actions.abrirClienteDesdeCalendario(id); break;
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
    case 'google-conectar': actions.googleConectar(); break;
    case 'google-desconectar': actions.googleDesconectar(); break;
    case 'google-sincronizar': actions.googleSincronizarAhora(); break;
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
      const fuente = document.querySelector('[data-change="mov-fuente"]')?.value || 'bancolombia';
      if (fecha && monto > 0 && tipo) {
        actions.movimientoAgregar({ fecha, nota: nota || '', monto, tipo, fuente });
        document.querySelector('[data-change="mov-fecha"]').value = '';
        document.querySelector('[data-change="mov-nota"]').value = '';
        document.querySelector('[data-change="mov-monto"]').value = '';
      }
      break;
    }
    case 'movimiento-eliminar': actions.eliminarMovimiento(id); break;
    case 'cc-toggle-pagada': actions.toggleCuentaCobroPagada(id); break;
    case 'deuda-nueva': actions.deudaNueva(direccion); break;
    case 'deuda-toggle': actions.toggleDeudaPagada(id); break;
    case 'deuda-eliminar': actions.eliminarDeuda(id); break;
    case 'deuda-urgente-toggle': actions.toggleDeudaUrgente(id); break;
    case 'cc-eliminar': actions.eliminarCuentaCobro(id); break;
    case 'gasto-nuevo': actions.gastoNuevo(); break;
    case 'gasto-eliminar': actions.eliminarGasto(id); break;
    case 'transaccion-agregar': {
      const descripcion = document.querySelector('[id="desc-trans"]')?.value;
      const monto = document.querySelector('[id="monto-trans"]')?.value;
      const tipo = document.querySelector('[id="tipo-trans"]')?.value;
      const fuente = document.querySelector('[id="fuente-trans"]')?.value;
      if (descripcion && monto && tipo && fuente) {
        actions.transaccionAgregar(descripcion, monto, tipo, fuente);
        document.querySelector('[id="desc-trans"]').value = '';
        document.querySelector('[id="monto-trans"]').value = '';
        document.querySelector('[id="tipo-trans"]').value = 'gasto';
        document.querySelector('[id="fuente-trans"]').value = 'nequi';
      }
      break;
    }
    case 'transaccion-eliminar': actions.transaccionEliminar(id); break;
    case 'pago-mensual-nuevo': actions.pagoMensualNuevo(); break;
    case 'pago-mensual-eliminar': actions.eliminarPagoMensual(id); break;
    case 'pago-mensual-marcar-pagado': actions.marcarPagoMensualPagado(id); break;
    case 'meta-personal-nueva': actions.metaPersonalNueva(categoria); break;
    case 'inv-vista': actions.invSetVista(value); break;
    case 'finanzas-vista': actions.finanzasSetVista(value); break;
    case 'habito-nuevo': actions.habitoNuevo(); break;
    case 'habito-toggle': {
      const h = state.metasPersonales.find(m => m.id === id);
      const hoy = hoyStr();
      const fecha = el.dataset.fecha || hoy; // Use date from attribute or default to today
      // Check if marked in log (for any date) or in fecha field (for today)
      const wasDone = h && (isHabitMarkedOnDate(h.id, fecha) || h.fecha === fecha);
      const marking = !wasDone;

      // Update streak BEFORE toggling (so we know the transition)
      updateHabitStreak(id, marking, fecha);
      // Log for weekly analytics
      logHabitToggle(id, marking, fecha);

      // Toggle the habit (updates fecha to most recent)
      if (fecha === hoy) {
        actions.habitoToggle(id);
      } else {
        actions.habitoToggleFecha(id, fecha);
      }

      // Sound feedback
      if (marking) {
        playTick();
        // Animate the row
        const row = el.closest('.bh-card') || el.closest('.qc-habito');
        if (row) {
          row.classList.remove('qc-just-checked');
          void row.offsetWidth; // force reflow
          row.classList.add('qc-just-checked');
        }
      } else {
        playMiss();
      }

      // Check for 100% completion → confetti + celebration sound (only for today)
      if (marking && fecha === hoy) {
        const habitos = state.metasPersonales.filter(m => m.categoria === 'habito');
        const qc = calcularQuickCheck(habitos, hoy);
        if (qc.pct === 100 && qc.total > 0) {
          setTimeout(() => {
            playCelebrate();
            fireConfetti();
          }, 200);
        }
      }
      break;
    }
    case 'seleccionar-dia-bienestar': {
      const fecha = el.dataset.fecha;
      if (fecha) {
        actions.seleccionarDiaBienestar(fecha);
      }
      break;
    }
    case 'cambiar-semana-bienestar': {
      const delta = parseInt(el.dataset.delta, 10) || 0;
      actions.cambiarSemanaBienestar(delta);
      break;
    }
    case 'volver-al-hoy': {
      actions.volverAlHoy();
      break;
    }
    case 'uni-toggle': actions.uniToggleBloque(Number(idx)); break;
    case 'inv-agregar': actions.metaPersonalNueva('inv_' + value, tipo, el.dataset.parent); break;
    case 'inv-equipar': {
      const item = state.metasPersonales.find(m => m.id === id);
      if (item) actions.updMetaPersonal(id, { cumplida: !item.cumplida });
      break;
    }
    case 'equipo-nuevo': actions.equipoNuevo(); break;
    case 'equipo-eliminar': actions.eliminarEquipo(id); break;
    case 'meta-personal-eliminar': actions.eliminarMetaPersonal(id); break;
    case 'meta-personal-toggle': {
      const meta = state.metasPersonales.find(m => m.id === id);
      if (meta) actions.updMetaPersonal(id, { cumplida: !meta.cumplida });
      break;
    }
    case 'meta-paso-agregar': actions.metaPasoAgregar(id); break;
    case 'meta-paso-toggle': actions.metaPasoToggle(id, Number(idx)); break;
    case 'meta-paso-eliminar': actions.metaPasoEliminar(id, Number(idx)); break;
    case 'tarea-nueva': actions.tareaNueva(); break;
    case 'tarea-aceptar-sugerencia': actions.tareaCrearDesdeSugerencia(el.dataset.texto, el.dataset.fecha); break;
    case 'tarea-toggle': actions.toggleTarea(id); break;
    case 'tarea-eliminar': actions.eliminarTarea(id); break;
    case 'historial-abrir': actions.historialAbrir(); break;
    case 'historial-cerrar': actions.historialCerrar(); break;
    case 'cc-historial-descargar': {
      const cc = state.cuentasCobro.find(c => c.id === id);
      if (cc) actions.cuentaCobroDescargar(cc);
      break;
    }
    case 'nuevo-contenido-abrir': actions.nuevoContenidoAbrir(); break;
    case 'nuevo-contenido-cerrar': actions.nuevoContenidoCerrar(); break;
    case 'nuevo-contenido-crear': actions.nuevoContenidoCrear(value); break;
    case 'personaje3d-abrir': actions.personaje3dAbrir(); break;
    case 'personaje3d-cerrar': actions.personaje3dCerrar(); break;
    case 'personaje3d-reset': actions.personaje3dReset(); break;
    case 'cerrar-revision-ideas': actions.cerrarRevisionIdeas(); break;
    case 'actualizar-estado-idea': {
      const { id, estado } = el.dataset;
      actions.actualizarEstadoIdea(id, estado);
      const pendientes = state.revisionIdeasPendientes.filter(i => i.id !== id);
      if (pendientes.length > 0) {
        actions.abrirRevisionIdeas(pendientes);
      } else {
        actions.cerrarRevisionIdeas();
      }
      break;
    }
    case 'bacu-set-estado': actions.bacuSetEstado(id, el.dataset.estado, el.dataset.label); break;
    case 'bacu-posponer': actions.bacuPosponer(id); break;
    case 'cerrar-notificacion-bacu': actions.cerrarNotificacionBacu(); break;
  }
});

// Arrastrar y soltar para equipar/desequipar en Inventario > Personal — alternativa a los
// botones ▲/▼ (que siguen funcionando igual). Un item con draggable="true" y data-id se suelta
// sobre una zona con data-drop="equipar" (el personaje) o data-drop="mochila" (la lista de
// abajo); no hay drag-and-drop nativo entre navegador y móvil táctil, así que los botones ▲/▼
// se quedan como el único camino garantizado en celular.
let dragId = null;

root.addEventListener('dragstart', e => {
  const el = e.target.closest('[draggable="true"][data-id]');
  if (!el) return;
  dragId = el.dataset.id;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragId);
});

root.addEventListener('dragover', e => {
  const zona = e.target.closest('[data-drop], .pared-columna-items');
  if (!zona) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  zona.closest('[data-drop], .pared-columna')?.classList.add('drop-activo');
});

root.addEventListener('dragleave', e => {
  const zona = e.target.closest('[data-drop], .pared-columna-items');
  if (zona) zona.closest('[data-drop], .pared-columna')?.classList.remove('drop-activo');
});

root.addEventListener('drop', e => {
  const zonaInventario = e.target.closest('[data-drop]');
  const zonaColumna = e.target.closest('.pared-columna-items')?.closest('.pared-columna');

  if (!zonaInventario && !zonaColumna) return;
  e.preventDefault();

  zonaInventario?.classList.remove('drop-activo');
  zonaColumna?.classList.remove('drop-activo');

  const idSoltado = e.dataTransfer.getData('text/plain') || dragId;
  dragId = null;
  if (!idSoltado) return;

  // Si es Pared (columnas de tareas)
  if (zonaColumna) {
    const titulo = zonaColumna.querySelector('.pared-columna-titulo')?.textContent?.trim();
    if (titulo) {
      actions.updTarea(idSoltado, { columna: titulo });
    }
    return;
  }

  // Si es Papelera (eliminar tarea)
  if (zonaInventario?.dataset.drop === 'papelera') {
    actions.eliminarTarea(idSoltado);
    return;
  }

  // Si es Inventario (equipar/mochila)
  if (zonaInventario) {
    const item = state.metasPersonales.find(m => m.id === idSoltado);
    if (!item) return;
    const equipar = zonaInventario.dataset.drop === 'equipar';
    if (item.cumplida !== equipar) actions.updMetaPersonal(idSoltado, { cumplida: equipar });
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
      case 'idea-basado-en': actions.updIdea(id, { basadoEnId: value || null }); break;
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
      case 'google-client-id': actions.setGoogleClientId(value); break;
      case 'guion-campo': actions.setGuionCampo(id, campo, value); break;
      case 'guion-item-campo': actions.updGuionItem(id, Number(idx), campo, value); break;
      case 'rodaje-rapido-campo': actions.rodajeRapidoSetCampo(campo, campo === 'precio' ? parseN(value) : value); break;
      case 'cc-campo': actions.cuentaCobroSetCampo(campo, value); break;
      case 'cc-fecha-vencimiento': actions.updCuentaCobro(id, { fecha_vencimiento: value || null }); break;
      case 'cc-fuente-pago': actions.updCuentaCobro(id, { fuente_pago: value }); break;
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
      case 'deuda-fecha-limite': actions.updDeuda(id, { fecha_limite: value || null }); break;
      case 'pago-mensual-nombre': actions.updPagoMensual(id, { nombre: value }); break;
      case 'pago-mensual-monto': actions.updPagoMensual(id, { monto: parseN(value) }); break;
      case 'pago-mensual-dia': actions.updPagoMensual(id, { dia_pago: parseN(value) || null }); break;
      case 'meta-personal-titulo': actions.updMetaPersonal(id, { titulo: value }); break;
      case 'meta-personal-bloque': actions.updMetaPersonal(id, { bloque: value || null }); break;
      case 'meta-personal-tipo': actions.updMetaPersonal(id, { tipo: value || null }); break;
      case 'meta-personal-fecha': actions.updMetaPersonal(id, { fecha: value || null }); break;
      case 'meta-personal-descripcion': actions.updMetaPersonal(id, { descripcion: value || null }); break;
      // Centro de Carga — mismos 5 campos en metas_personales y equipo_produccion, ver
      // supabase-migracion-centro-carga.sql. Dos variantes porque cada tabla tiene su propia
      // acción de update (updMetaPersonal / updEquipo), no hay un dispatcher genérico por tabla.
      case 'meta-energia-requiere': actions.updMetaPersonal(id, { requiere_energia: value }); break;
      case 'meta-energia-tipo': actions.updMetaPersonal(id, { tipo_energia: value || null }); break;
      case 'meta-energia-carga': actions.updMetaPersonal(id, { carga_porcentaje: value === '' ? null : parseN(value) }); break;
      case 'meta-energia-estado': actions.updMetaPersonal(id, { estado_carga: value || null }); break;
      case 'meta-energia-ultima-carga': actions.updMetaPersonal(id, { ultima_carga: value || null }); break;
      case 'equipo-energia-requiere': actions.updEquipo(id, { requiere_energia: value }); break;
      case 'equipo-energia-tipo': actions.updEquipo(id, { tipo_energia: value || null }); break;
      case 'equipo-energia-carga': actions.updEquipo(id, { carga_porcentaje: value === '' ? null : parseN(value) }); break;
      case 'equipo-energia-estado': actions.updEquipo(id, { estado_carga: value || null }); break;
      case 'equipo-energia-ultima-carga': actions.updEquipo(id, { ultima_carga: value || null }); break;
      case 'meta-paso-texto': actions.metaPasoTexto(id, Number(idx), value); break;
      case 'equipo-nombre': actions.updEquipo(id, { nombre: value }); break;
      case 'equipo-categoria': actions.updEquipo(id, { categoria: value }); break;
      case 'equipo-prestado': actions.updEquipo(id, { prestado_a: value }); break;
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
      case 'tarea-columna': actions.updTarea(id, { columna: value }); break;
      case 'cal-vista-set': actions.setCalVista(value); break;
      case 'filtro-calendario-set': actions.setFiltroCalendario(value); break;
      case 'filtro-guiones-set': actions.setFiltroGuiones(value); break;
      case 'guiones-vista-set': actions.setGuionesVista(value); break;
    }
    return;
  }
});
