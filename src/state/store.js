import { loadValue, persistValue } from '../lib/storage.js';
import { parseN } from '../lib/format.js';
import { mesActual, hoyStr, lunesDe, sumarDias } from '../lib/idea.js';
import { supabase } from '../lib/supabaseClient.js';
import { generarCuentaCobroPDF, OBSERVACIONES_DEFAULT } from '../lib/pdfInvoice.js';
import { generarListadoClientesPDF } from '../lib/pdfListadoClientes.js';
import { MESES, COLORES_TAREA, familiaDeFormato, METAS_EQUIPO_SEED } from '../data/constants.js';
import { AVATAR_DEFAULT } from '../components/avatar.js';
import { generarIdea } from '../lib/ia.js';

export const state = {
  view: loadValue('app.view', 'calendario'),
  month: loadValue('ui.month', mesActual()),
  ideas: [],
  snaps: [],
  clientes: [],
  selId: null,
  guionId: null,
  clienteSelId: null,
  menuAbierto: false,
  filtroGuiones: loadValue('ui.filtroGuiones', 'todas'),
  guionesVista: loadValue('ui.guionesVista', 'general'),
  filtroCalendario: loadValue('ui.filtroCalendario', 'todas'),
  calVista: loadValue('ui.calVista', 'mes'),
  invVista: loadValue('ui.invVista', 'personal'),
  avatar: loadValue('ui.avatar', AVATAR_DEFAULT),
  avatarEditor: false,
  uniBloquesAbiertos: {},
  semanaInicio: loadValue('ui.semanaInicio', lunesDe(hoyStr())),
  snapDraft: null,
  rodajeDraft: null,
  cuentaCobroDraft: null,
  iaDraft: null,
  iaBusy: false,
  iaError: null,
  iaResultado: null,
  revisionIdeasModal: false,
  revisionIdeasPendientes: [],
  notificacionBacu: null,
  cuentasCobro: [],
  movimientosFinanciamiento: [],
  deudas: [],
  pagosMensuales: [],
  gastosMenuales: [],
  metasPersonales: [],
  metasMensuales: [],
  tareas: [],
  presupuesto: {
    arriendo: 700000,
    servicios: 200000,
    comida: 450000,
    transporte: 120000,
    personales: 100000,
    entretenimiento: 80000,
    telefono: 50000,
    salud: 100000,
    ahorro: 200000,
    ingresosMensuales: 0
  },
  gastosVivirSolo: [
    { id: 'g1', nombre: 'Arriendo (CRÍTICO)', emoji: '🏠', monto: 700000, dia_vencimiento: 1 },
    { id: 'g2', nombre: 'Mercado/Comida (CRÍTICO)', emoji: '🍽️', monto: 450000, dia_vencimiento: 1 },
    { id: 'g3', nombre: 'Transporte', emoji: '🚌', monto: 120000, dia_vencimiento: 1 },
    { id: 'g4', nombre: 'Entretenimiento', emoji: '🎉', monto: 200000, dia_vencimiento: 1 },
    { id: 'g5', nombre: 'Gasolina', emoji: '⛽', monto: 100000, dia_vencimiento: 5 },
    { id: 'g6', nombre: 'Internet', emoji: '📡', monto: 80000, dia_vencimiento: 8 },
    { id: 'g7', nombre: 'Seguros/Gastos médicos', emoji: '🏥', monto: 100000, dia_vencimiento: 10 },
    { id: 'g8', nombre: 'Luz (CRÍTICO)', emoji: '💡', monto: 150000, dia_vencimiento: 12 },
    { id: 'g9', nombre: 'Agua (CRÍTICO)', emoji: '💧', monto: 50000, dia_vencimiento: 12 },
    { id: 'g10', nombre: 'Teléfono', emoji: '📱', monto: 50000, dia_vencimiento: 15 },
    { id: 'g11', nombre: 'Ropa', emoji: '👕', monto: 150000, dia_vencimiento: 15 },
    { id: 'g12', nombre: 'Mango (gato)', emoji: '🐱', monto: 140000, dia_vencimiento: 1 },
    { id: 'g13', nombre: 'Gym', emoji: '💪', monto: 100000, dia_vencimiento: 1 },
    { id: 'g14', nombre: 'CapCut', emoji: '✂️', monto: 29866, dia_vencimiento: 1 },
    { id: 'g15', nombre: 'Claude (suscripción)', emoji: '🤖', monto: 99888, dia_vencimiento: 2 },
    { id: 'g16', nombre: 'Lightroom', emoji: '🖼️', monto: 8515, dia_vencimiento: 6 },
    { id: 'g17', nombre: 'Apple.com', emoji: '🍎', monto: 9022, dia_vencimiento: 15 },
    { id: 'g18', nombre: 'Gmail', emoji: '📧', monto: 2015, dia_vencimiento: 16 },
    { id: 'g19', nombre: 'Google Play', emoji: '🎮', monto: 8900, dia_vencimiento: 21 },
    { id: 'g20', nombre: 'Manejo tarjeta', emoji: '💳', monto: 11000, dia_vencimiento: 11 },
    { id: 'g21', nombre: 'Spotify (÷6)', emoji: '🎵', monto: 5000, dia_vencimiento: 12 },
    { id: 'g22', nombre: 'Aseo Personal (Shampú 15k/2m + Jabón 45k/2m + Cuchillas 9k/2m + Desodorante 50k + Contorno 80k)', emoji: '🧴', monto: 199000, dia_vencimiento: 28 }
  ],
  gastosRecurrentes: [
    { id: 'gr1', nombre: 'Mango (gato - comida + arena)', emoji: '🐱', monto: 140000, dia_vencimiento: 1 },
    { id: 'gr2', nombre: 'Gym', emoji: '💪', monto: 100000, dia_vencimiento: 1 },
    { id: 'gr3', nombre: 'CapCut', emoji: '✂️', monto: 29866, dia_vencimiento: 1 },
    { id: 'gr4', nombre: 'Claude (suscripción)', emoji: '🤖', monto: 99888, dia_vencimiento: 2 },
    { id: 'gr5', nombre: 'Manejo tarjeta', emoji: '💳', monto: 11000, dia_vencimiento: 11 },
    { id: 'gr6', nombre: 'Spotify (plan familiar ÷6)', emoji: '🎵', monto: 5000, dia_vencimiento: 12 },
    { id: 'gr7', nombre: 'Lightroom', emoji: '🖼️', monto: 8515, dia_vencimiento: 6 },
    { id: 'gr8', nombre: 'Apple.com', emoji: '🍎', monto: 9022, dia_vencimiento: 15 },
    { id: 'gr9', nombre: 'Gmail', emoji: '📧', monto: 2015, dia_vencimiento: 16 },
    { id: 'gr10', nombre: 'Google Play', emoji: '🎮', monto: 8900, dia_vencimiento: 21 }
  ],
  historialAbierto: false,
  historialBusqueda: '',
  tema: loadValue('sistemaEditorial.tema', 'Cine crudo'),
  modoCalma: loadValue('sistemaEditorial.modoCalma', false),
  saveError: false,

  session: null,
  authReady: false,
  authBusy: false,
  authError: null,
  authInfo: null,
  dataReady: false
};

const listeners = [];
export function subscribe(fn) { listeners.push(fn); }
function notify() { listeners.forEach(fn => fn()); }

// Claves de interfaz que se recuerdan entre sesiones (cada pestaña vuelve donde quedó)
const UI_PERSIST = ['month', 'filtroGuiones', 'guionesVista', 'filtroCalendario', 'calVista', 'semanaInicio', 'invVista', 'avatar'];

function setState(patch) {
  Object.assign(state, patch);
  for (const k of UI_PERSIST) {
    if (k in patch) persistValue('ui.' + k, patch[k]);
  }
  notify();
}

function marcarGuardado(ok) {
  if (state.saveError !== !ok) setState({ saveError: !ok });
  else notify();
}

// ---- conversión de columnas (snake_case en la base -> camelCase en la app) ----
function fromDbIdea(row) {
  const { fecha_rodaje, ...rest } = row;
  return { ...rest, fechaRodaje: fecha_rodaje };
}
function toDbIdea(idea) {
  const { fechaRodaje, ...rest } = idea;
  return { ...rest, fecha_rodaje: fechaRodaje ?? null };
}
function toDbPatch(patch) {
  if (!('fechaRodaje' in patch)) return patch;
  const { fechaRodaje, ...rest } = patch;
  return { ...rest, fecha_rodaje: fechaRodaje ?? null };
}

function fechaALabel(fechaStr) {
  const [anio, mesNum, diaNum] = fechaStr.split('-').map(Number);
  return `${diaNum} de ${MESES[mesNum - 1]} de ${anio}`;
}

// ---- auth ----
export async function initAuth() {
  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  state.authReady = true;
  notify();
  if (state.session) cargarDatos();

  supabase.auth.onAuthStateChange((_event, session) => {
    const teniaSesion = !!state.session;
    state.session = session;
    notify();
    if (session && !teniaSesion) cargarDatos();
    if (!session) setState({ ideas: [], snaps: [], clientes: [], dataReady: false });
  });
}

async function cargarDatos() {
  const [ideasRes, snapsRes, clientesRes, cuentasRes, movimientosRes, deudasRes, pagosMensualesRes, metasPersonalesRes, metasMensualesRes, tareasRes] = await Promise.all([
    supabase.from('ideas').select('*').order('id'),
    supabase.from('snaps').select('*').order('fecha'),
    supabase.from('clientes').select('*').order('id'),
    supabase.from('cuentas_cobro').select('*').order('numero'),
    supabase.from('movimientos_financiamiento').select('*').order('fecha'),
    supabase.from('deudas').select('*').order('created_at'),
    supabase.from('pagos_mensuales').select('*').order('dia_pago'),
    supabase.from('metas_personales').select('*').order('created_at'),
    supabase.from('metas_mensuales').select('*'),
    supabase.from('tareas').select('*').order('created_at')
  ]);
  state.ideas = (ideasRes.data || []).map(fromDbIdea);
  state.snaps = snapsRes.data || [];
  state.clientes = clientesRes.data || [];
  state.cuentasCobro = cuentasRes.data || [];
  state.movimientosFinanciamiento = movimientosRes.data || [];
  state.deudas = deudasRes.data || [];
  state.pagosMensuales = pagosMensualesRes.data || [];
  state.metasPersonales = metasPersonalesRes.data || [];
  state.metasMensuales = metasMensualesRes.data || [];
  state.tareas = tareasRes.data || [];
  state.dataReady = true;
  notify();
  suscribirRealtime();
  verificarIdeasPorFecha();
  sembrarMetasEquipo();
}

// Inserta los items de "Mejora de equipo" que aún no existan (una sola vez, comparando por título)
function sembrarMetasEquipo() {
  const existentes = new Set(state.metasPersonales.map(m => (m.titulo || '').trim().toLowerCase()));
  const faltantes = METAS_EQUIPO_SEED.filter(s => !existentes.has(s.titulo.toLowerCase()));
  if (!faltantes.length) return;
  const rows = faltantes.map((s, i) => ({ id: 'mp' + Date.now() + '-' + i, categoria: s.categoria, titulo: s.titulo, fecha: null, cumplida: false }));
  state.metasPersonales = state.metasPersonales.concat(rows);
  notify();
  supabase.from('metas_personales').insert(rows).then(({ error }) => marcarGuardado(!error));
}

function verificarIdeasPorFecha() {
  const hoy = hoyStr();
  const revisadas = loadValue('bacu.ideasRevisadas', []);

  // Ideas cuya fecha (rodaje o publicación) ya pasó — solo se excluyen descartadas
  const estadosFinalesIdea = ['descartada'];
  const ideasVencidas = state.ideas
    .filter(i => {
      const f = i.fechaRodaje || i.fecha;
      return f && f < hoy && !estadosFinalesIdea.includes(i.estado) && !revisadas.includes(i.id);
    })
    .map(i => ({ tipo: 'idea', id: i.id, titulo: i.titulo, marca: i.marca, estado: i.estado, fecha: i.fechaRodaje || i.fecha }));

  // Grabaciones de clientes con fecha pasada — se pregunta sin importar el estado
  const estadosYaGrabados = ['conversacion'];
  const grabacionesVencidas = state.clientes
    .filter(c => c.fecha_grabacion && c.fecha_grabacion < hoy && !estadosYaGrabados.includes(c.estado) && !revisadas.includes(c.id))
    .map(c => ({ tipo: 'cliente', id: c.id, titulo: c.nombre + (c.proyecto ? ' — ' + c.proyecto : ''), marca: null, estado: c.estado, fecha: c.fecha_grabacion }));

  const pendientes = ideasVencidas.concat(grabacionesVencidas);
  console.log('[BACU] pendientes por revisar:', pendientes.length, pendientes);

  if (pendientes.length > 0) {
    setState({ revisionIdeasPendientes: pendientes, notificacionBacu: 'pregunta' });
  }
}

function suscribirRealtime() {
  supabase.channel('sync-ideas').on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, payload => {
    if (payload.eventType === 'DELETE') {
      state.ideas = state.ideas.filter(i => i.id !== payload.old.id);
    } else {
      const idea = fromDbIdea(payload.new);
      const existe = state.ideas.some(i => i.id === idea.id);
      state.ideas = existe ? state.ideas.map(i => i.id === idea.id ? idea : i) : [idea].concat(state.ideas);
    }
    notify();
  }).subscribe();

  supabase.channel('sync-clientes').on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, payload => {
    if (payload.eventType === 'DELETE') {
      state.clientes = state.clientes.filter(c => c.id !== payload.old.id);
    } else {
      const existe = state.clientes.some(c => c.id === payload.new.id);
      state.clientes = existe ? state.clientes.map(c => c.id === payload.new.id ? payload.new : c) : [payload.new].concat(state.clientes);
    }
    notify();
  }).subscribe();

  supabase.channel('sync-snaps').on('postgres_changes', { event: '*', schema: 'public', table: 'snaps' }, payload => {
    if (payload.eventType === 'DELETE') {
      state.snaps = state.snaps.filter(s => s.id !== payload.old.id);
    } else {
      const existe = state.snaps.some(s => s.id === payload.new.id);
      state.snaps = existe ? state.snaps.map(s => s.id === payload.new.id ? payload.new : s) : state.snaps.concat([payload.new]);
    }
    notify();
  }).subscribe();

  supabase.channel('sync-cuentas-cobro').on('postgres_changes', { event: '*', schema: 'public', table: 'cuentas_cobro' }, payload => {
    if (payload.eventType === 'DELETE') {
      state.cuentasCobro = state.cuentasCobro.filter(c => c.id !== payload.old.id);
    } else {
      const existe = state.cuentasCobro.some(c => c.id === payload.new.id);
      state.cuentasCobro = existe ? state.cuentasCobro.map(c => c.id === payload.new.id ? payload.new : c) : state.cuentasCobro.concat([payload.new]);
    }
    notify();
  }).subscribe();

  supabase.channel('sync-movimientos-financiamiento').on('postgres_changes', { event: '*', schema: 'public', table: 'movimientos_financiamiento' }, payload => {
    if (payload.eventType === 'DELETE') {
      state.movimientosFinanciamiento = state.movimientosFinanciamiento.filter(m => m.id !== payload.old.id);
    } else {
      const existe = state.movimientosFinanciamiento.some(m => m.id === payload.new.id);
      state.movimientosFinanciamiento = existe ? state.movimientosFinanciamiento.map(m => m.id === payload.new.id ? payload.new : m) : state.movimientosFinanciamiento.concat([payload.new]);
    }
    notify();
  }).subscribe();

  supabase.channel('sync-deudas').on('postgres_changes', { event: '*', schema: 'public', table: 'deudas' }, payload => {
    if (payload.eventType === 'DELETE') {
      state.deudas = state.deudas.filter(d => d.id !== payload.old.id);
    } else {
      const existe = state.deudas.some(d => d.id === payload.new.id);
      state.deudas = existe ? state.deudas.map(d => d.id === payload.new.id ? payload.new : d) : state.deudas.concat([payload.new]);
    }
    notify();
  }).subscribe();

  supabase.channel('sync-pagos-mensuales').on('postgres_changes', { event: '*', schema: 'public', table: 'pagos_mensuales' }, payload => {
    if (payload.eventType === 'DELETE') {
      state.pagosMensuales = state.pagosMensuales.filter(p => p.id !== payload.old.id);
    } else {
      const existe = state.pagosMensuales.some(p => p.id === payload.new.id);
      state.pagosMensuales = existe ? state.pagosMensuales.map(p => p.id === payload.new.id ? payload.new : p) : state.pagosMensuales.concat([payload.new]);
    }
    notify();
  }).subscribe();

  supabase.channel('sync-metas-personales').on('postgres_changes', { event: '*', schema: 'public', table: 'metas_personales' }, payload => {
    if (payload.eventType === 'DELETE') {
      state.metasPersonales = state.metasPersonales.filter(m => m.id !== payload.old.id);
    } else {
      const existe = state.metasPersonales.some(m => m.id === payload.new.id);
      state.metasPersonales = existe ? state.metasPersonales.map(m => m.id === payload.new.id ? payload.new : m) : state.metasPersonales.concat([payload.new]);
    }
    notify();
  }).subscribe();

  supabase.channel('sync-metas-mensuales').on('postgres_changes', { event: '*', schema: 'public', table: 'metas_mensuales' }, payload => {
    if (payload.eventType === 'DELETE') {
      state.metasMensuales = state.metasMensuales.filter(m => m.id !== payload.old.id);
    } else {
      const existe = state.metasMensuales.some(m => m.id === payload.new.id);
      state.metasMensuales = existe ? state.metasMensuales.map(m => m.id === payload.new.id ? payload.new : m) : state.metasMensuales.concat([payload.new]);
    }
    notify();
  }).subscribe();

  supabase.channel('sync-tareas').on('postgres_changes', { event: '*', schema: 'public', table: 'tareas' }, payload => {
    if (payload.eventType === 'DELETE') {
      state.tareas = state.tareas.filter(t => t.id !== payload.old.id);
    } else {
      const existe = state.tareas.some(t => t.id === payload.new.id);
      state.tareas = existe ? state.tareas.map(t => t.id === payload.new.id ? payload.new : t) : state.tareas.concat([payload.new]);
    }
    notify();
  }).subscribe();
}

export const actions = {
  setView: v => { persistValue('app.view', v); setState({ view: v }); },
  menuToggle: () => setState({ menuAbierto: !state.menuAbierto }),
  menuCerrar: () => setState({ menuAbierto: false }),
  setFiltroGuiones: v => setState({ filtroGuiones: v }),
  setGuionesVista: v => setState({ guionesVista: v }),
  abrirMarca: marca => setState({ view: 'guiones', filtroGuiones: marca, guionesVista: 'general' }),

  setTema: v => { const ok = persistValue('sistemaEditorial.tema', v); setState({ tema: v }); marcarGuardado(ok); },
  setModoCalma: v => { const ok = persistValue('sistemaEditorial.modoCalma', v); setState({ modoCalma: v }); marcarGuardado(ok); },
  descartarAvisoGuardado: () => setState({ saveError: false }),

  login: async (email, password) => {
    persistValue('sistemaEditorial.ultimoEmail', email);
    setState({ authBusy: true, authError: null, authInfo: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setState({ authBusy: false, authError: 'No pudimos iniciar sesión. Revisá el email y la contraseña.' });
    else setState({ authBusy: false, authError: null });
  },
  logout: async () => { await supabase.auth.signOut(); },

  nuevaIdea: () => {
    const nueva = { id: 'u' + Date.now(), marca: 'brant', colab: '', titulo: '', nota: '', gancho: '', objetivos: [], formato: 'Reel', estado: 'desarrollo', fecha: null, fechaRodaje: null, preguntas: [null, null, null, null], tiempo: '', grabacion: false, edicion: false, prioridad: 'Media', etapa: 0 };
    state.ideas = [nueva].concat(state.ideas);
    setState({ selId: nueva.id, view: 'guiones' });
    supabase.from('ideas').insert(toDbIdea(nueva)).then(({ error }) => marcarGuardado(!error));
  },
  rodajeRapidoAbrir: fecha => setState({ rodajeDraft: { titulo: '', marca: 'brant', fecha: fecha || hoyStr(), empresa: '', documento: '', precio: 0 } }),
  rodajeRapidoCerrar: () => setState({ rodajeDraft: null }),
  rodajeRapidoSetCampo: (campo, val) => setState({ rodajeDraft: { ...state.rodajeDraft, [campo]: val } }),
  rodajeRapidoGuardar: () => {
    const D = state.rodajeDraft;
    if (!D || !D.titulo.trim()) return;
    const nueva = {
      id: 'u' + Date.now(), marca: D.marca, colab: '', titulo: D.titulo, nota: '', gancho: '',
      objetivos: [], formato: 'Cubrimiento', estado: 'desarrollo', fecha: null, fechaRodaje: D.fecha,
      preguntas: [null, null, null, null], tiempo: '', grabacion: true, edicion: false, prioridad: 'Media', etapa: 0
    };
    state.ideas = [nueva].concat(state.ideas);
    supabase.from('ideas').insert(toDbIdea(nueva)).then(({ error }) => marcarGuardado(!error));

    const nombreEmpresa = (D.empresa || '').trim();
    if (nombreEmpresa) {
      const documento = (D.documento || '').trim();
      // No se toca clientes.fecha_grabacion acá: ya queda cubierto por la idea de arriba (fechaRodaje) y ponerla también duplicaría la entrada en el Calendario (ver entradasDeDia en calendario.js).
      let cliente = state.clientes.find(c => (c.nombre || '').trim().toLowerCase() === nombreEmpresa.toLowerCase());
      if (cliente) {
        if (documento && !cliente.documento) {
          const clienteId = cliente.id;
          state.clientes = state.clientes.map(c => c.id === clienteId ? { ...c, documento } : c);
          cliente = { ...cliente, documento };
          supabase.from('clientes').update({ documento }).eq('id', clienteId).then(({ error }) => marcarGuardado(!error));
        }
      } else {
        cliente = { id: 'c' + Date.now(), nombre: nombreEmpresa, documento, estado: 'activo', proyecto: D.titulo, nota: '' };
        state.clientes = [cliente].concat(state.clientes);
        supabase.from('clientes').insert(cliente).then(({ error }) => marcarGuardado(!error));
      }

      const precio = Number(D.precio) || 0;
      if (precio > 0) {
        const fecha = hoyStr();
        const prefijo = fecha.slice(0, 4) + fecha.slice(5, 7);
        const delMes = state.cuentasCobro.filter(cc => cc.numero.startsWith(prefijo)).length;
        const numero = delMes === 0 ? prefijo : `${prefijo}-${delMes + 1}`;
        const registro = {
          id: 'cc' + Date.now(),
          numero,
          fecha,
          fecha_vencimiento: null,
          observaciones: OBSERVACIONES_DEFAULT,
          cliente_id: cliente.id,
          cliente_nombre: cliente.nombre,
          cliente_documento: cliente.documento || '',
          items: [{ descripcion: D.titulo, cantidad: 1, valor: precio }],
          total: precio
        };
        state.cuentasCobro = state.cuentasCobro.concat([registro]);
        supabase.from('cuentas_cobro').insert(registro).then(({ error }) => marcarGuardado(!error));

        generarCuentaCobroPDF({
          numero,
          fechaLabel: fechaALabel(fecha),
          fechaVencimientoLabel: '',
          cliente: cliente.nombre,
          documento: cliente.documento || '',
          items: registro.items,
          total: precio,
          observaciones: OBSERVACIONES_DEFAULT
        });
      }
    }

    setState({ rodajeDraft: null });
  },

  abrirIdea: id => setState({ selId: id }),
  cerrarDrawer: () => setState({ selId: null }),
  updIdea: (id, patch) => {
    state.ideas = state.ideas.map(i => i.id === id ? { ...i, ...patch } : i);
    notify();
    supabase.from('ideas').update(toDbPatch(patch)).eq('id', id).then(({ error }) => marcarGuardado(!error));
  },
  eliminarIdea: id => {
    if (!window.confirm('¿Eliminar esta idea definitivamente?')) return;
    state.ideas = state.ideas.filter(x => x.id !== id);
    setState({ selId: null });
    supabase.from('ideas').delete().eq('id', id).then(({ error }) => marcarGuardado(!error));
  },
  toggleObjetivo: (id, idx) => {
    const idea = state.ideas.find(i => i.id === id);
    if (!idea) return;
    const objetivos = idea.objetivos.includes(idx) ? idea.objetivos.filter(x => x !== idx) : idea.objetivos.concat([idx]);
    actions.updIdea(id, { objetivos });
  },
  setPregunta: (id, qi, val) => {
    const idea = state.ideas.find(i => i.id === id);
    if (!idea) return;
    const preguntas = idea.preguntas.slice();
    preguntas[qi] = preguntas[qi] === val ? null : val;
    actions.updIdea(id, { preguntas });
  },
  setMetrica: (id, campo, val) => {
    const idea = state.ideas.find(i => i.id === id);
    if (!idea) return;
    actions.updIdea(id, { metricas: { ...(idea.metricas || {}), [campo]: val } });
  },

  abrirGuion: id => setState({ guionId: id }),
  cerrarGuion: () => setState({ guionId: null }),
  setGuionCampo: (id, campo, val) => {
    const idea = state.ideas.find(i => i.id === id);
    if (!idea) return;
    actions.updIdea(id, { guion: { ...(idea.guion || {}), [campo]: val } });
  },
  addGuionItem: id => {
    const idea = state.ideas.find(i => i.id === id);
    if (!idea) return;
    const items = ((idea.guion || {}).items || []).concat([{ principal: '', secundario: '' }]);
    actions.updIdea(id, { guion: { ...(idea.guion || {}), items } });
  },
  updGuionItem: (id, idx, campo, val) => {
    const idea = state.ideas.find(i => i.id === id);
    if (!idea) return;
    const items = ((idea.guion || {}).items || []).slice();
    items[idx] = { ...items[idx], [campo]: val };
    actions.updIdea(id, { guion: { ...(idea.guion || {}), items } });
  },
  removeGuionItem: (id, idx) => {
    const idea = state.ideas.find(i => i.id === id);
    if (!idea) return;
    const items = ((idea.guion || {}).items || []).filter((_, i2) => i2 !== idx);
    actions.updIdea(id, { guion: { ...(idea.guion || {}), items } });
  },

  cambiaMes: delta => {
    const [anio, mesNum] = state.month.split('-').map(Number);
    let y = anio, m = mesNum + delta;
    if (m === 0) { m = 12; y--; }
    if (m === 13) { m = 1; y++; }
    setState({ month: y + '-' + String(m).padStart(2, '0') });
  },
  irAHoy: () => setState({ month: mesActual(), semanaInicio: lunesDe(hoyStr()) }),

  setCalVista: v => setState({ calVista: v }),
  invSetVista: v => setState({ invVista: v }),
  avatarSet: (campo, valor) => setState({ avatar: { ...AVATAR_DEFAULT, ...state.avatar, [campo]: valor } }),
  avatarEditorToggle: () => setState({ avatarEditor: !state.avatarEditor }),
  uniToggleBloque: idx => {
    const abiertos = { ...state.uniBloquesAbiertos, [idx]: !state.uniBloquesAbiertos[idx] };
    setState({ uniBloquesAbiertos: abiertos });
  },

  // Hábitos (Bienestar): `fecha` guarda el último día cumplido — marcar hoy = fecha de hoy
  habitoNuevo: () => actions.metaPersonalNueva('habito'),
  habitoToggle: id => {
    const h = state.metasPersonales.find(m => m.id === id);
    if (!h) return;
    const hoy = hoyStr();
    actions.updMetaPersonal(id, { fecha: h.fecha === hoy ? null : hoy });
  },
  setFiltroCalendario: v => setState({ filtroCalendario: v }),
  cambiaSemana: delta => setState({ semanaInicio: sumarDias(state.semanaInicio, delta * 7) }),

  nuevoCliente: () => {
    const c = { id: 'c' + Date.now(), nombre: '', estado: 'prospecto', proyecto: '', nota: '' };
    state.clientes = [c].concat(state.clientes);
    setState({ view: 'clientes', clienteSelId: c.id });
    supabase.from('clientes').insert(c).then(({ error }) => marcarGuardado(!error));
  },
  updCliente: (id, patch) => {
    const cliente = state.clientes.find(c => c.id === id);
    state.clientes = state.clientes.map(c => c.id === id ? { ...c, ...patch } : c);
    notify();
    supabase.from('clientes').update(patch).eq('id', id).then(({ error }) => marcarGuardado(!error));

    // Si cambias estado a "ya_pagos" (Ya pagó), crea automáticamente un movimiento de ingreso
    if (patch.estado === 'ya_pagos' && cliente && cliente.estado !== 'ya_pagos') {
      const totalCliente = state.cuentasCobro
        .filter(cc => cc.cliente_id === id)
        .reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);

      if (totalCliente > 0) {
        const movimiento = {
          id: 'mv' + Date.now(),
          fecha: hoyStr(),
          fuente: 'bancolombia',
          tipo: 'ingreso',
          monto: totalCliente,
          nota: `Pago de ${cliente.nombre || 'cliente'} — ${cliente.proyecto || 'proyecto'}`
        };
        state.movimientosFinanciamiento = [movimiento].concat(state.movimientosFinanciamiento);
        supabase.from('movimientos_financiamiento').insert(movimiento).then(({ error }) => marcarGuardado(!error));
      }
    }
  },
  eliminarCliente: id => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    state.clientes = state.clientes.filter(x => x.id !== id);
    setState({ clienteSelId: state.clienteSelId === id ? null : state.clienteSelId });
    supabase.from('clientes').delete().eq('id', id).then(({ error }) => marcarGuardado(!error));
  },
  abrirCliente: id => setState({ clienteSelId: id }),
  cerrarClienteDetalle: () => setState({ clienteSelId: null }),
  exportarListadoClientes: () => generarListadoClientesPDF(state.clientes),

  cuentaCobroAbrir: cliente => setState({
    cuentaCobroDraft: {
      clienteId: cliente.id,
      clienteNombre: cliente.nombre || '',
      documento: cliente.documento || '',
      fecha: hoyStr(),
      fechaVencimiento: '',
      observaciones: OBSERVACIONES_DEFAULT,
      items: [{ descripcion: '', cantidad: '1', valor: '' }]
    }
  }),
  cuentaCobroCerrar: () => setState({ cuentaCobroDraft: null }),
  cuentaCobroSetCampo: (campo, val) => setState({ cuentaCobroDraft: { ...state.cuentaCobroDraft, [campo]: val } }),
  cuentaCobroAddItem: () => {
    const items = state.cuentaCobroDraft.items.concat([{ descripcion: '', cantidad: '1', valor: '' }]);
    setState({ cuentaCobroDraft: { ...state.cuentaCobroDraft, items } });
  },
  cuentaCobroUpdItem: (idx, campo, val) => {
    const items = state.cuentaCobroDraft.items.slice();
    items[idx] = { ...items[idx], [campo]: val };
    setState({ cuentaCobroDraft: { ...state.cuentaCobroDraft, items } });
  },
  cuentaCobroRemoveItem: idx => {
    const items = state.cuentaCobroDraft.items.filter((_, i) => i !== idx);
    setState({ cuentaCobroDraft: { ...state.cuentaCobroDraft, items } });
  },
  cuentaCobroGenerar: () => {
    const D = state.cuentaCobroDraft;
    if (!D || !D.clienteNombre.trim() || !D.items.length) return;
    const total = D.items.reduce((sum, it) => sum + (Number(it.cantidad) || 1) * (Number(it.valor) || 0), 0);
    if (!total) return;

    const prefijo = D.fecha.slice(0, 4) + D.fecha.slice(5, 7);
    const delMes = state.cuentasCobro.filter(cc => cc.numero.startsWith(prefijo)).length;
    const numero = delMes === 0 ? prefijo : `${prefijo}-${delMes + 1}`;
    const fechaLabel = fechaALabel(D.fecha);
    const observaciones = D.observaciones && D.observaciones.trim() ? D.observaciones.trim() : OBSERVACIONES_DEFAULT;

    const registro = {
      id: 'cc' + Date.now(),
      numero,
      fecha: D.fecha,
      fecha_vencimiento: D.fechaVencimiento || null,
      observaciones,
      cliente_id: D.clienteId || null,
      cliente_nombre: D.clienteNombre,
      cliente_documento: D.documento || '',
      items: D.items.map(it => ({ descripcion: it.descripcion, cantidad: Number(it.cantidad) || 1, valor: Number(it.valor) || 0 })),
      total
    };
    state.cuentasCobro = state.cuentasCobro.concat([registro]);
    setState({ cuentaCobroDraft: null });
    supabase.from('cuentas_cobro').insert(registro).then(({ error }) => marcarGuardado(!error));

    generarCuentaCobroPDF({
      numero,
      fechaLabel,
      fechaVencimientoLabel: D.fechaVencimiento ? fechaALabel(D.fechaVencimiento) : '',
      cliente: D.clienteNombre,
      documento: D.documento,
      items: D.items.map(it => ({ descripcion: it.descripcion, cantidad: it.cantidad, valor: it.valor })),
      total,
      observaciones
    });
  },

  historialAbrir: () => setState({ historialAbierto: true, historialBusqueda: '' }),
  historialCerrar: () => setState({ historialAbierto: false }),
  historialSetBusqueda: v => setState({ historialBusqueda: v }),
  cuentaCobroDescargar: cc => {
    generarCuentaCobroPDF({
      numero: cc.numero,
      fechaLabel: fechaALabel(cc.fecha),
      fechaVencimientoLabel: cc.fecha_vencimiento ? fechaALabel(cc.fecha_vencimiento) : '',
      cliente: cc.cliente_nombre,
      documento: cc.cliente_documento,
      items: cc.items,
      total: cc.total,
      observaciones: cc.observaciones
    });
  },

  movimientoNuevo: () => {
    const m = { id: 'mv' + Date.now(), fecha: hoyStr(), fuente: 'bancolombia', tipo: 'ingreso', monto: 0, nota: '' };
    state.movimientosFinanciamiento = [m].concat(state.movimientosFinanciamiento);
    setState({ view: 'financiamiento' });
    supabase.from('movimientos_financiamiento').insert(m).then(({ error }) => marcarGuardado(!error));
  },
  movimientoAgregar: (mov) => {
    const m = { id: 'mv' + Date.now(), fecha: mov.fecha, fuente: 'bancolombia', tipo: mov.tipo, monto: mov.monto, nota: mov.nota };
    state.movimientosFinanciamiento = [m].concat(state.movimientosFinanciamiento);
    notify();
    supabase.from('movimientos_financiamiento').insert(m).then(({ error }) => marcarGuardado(!error));
  },
  updMovimiento: (id, patch) => {
    state.movimientosFinanciamiento = state.movimientosFinanciamiento.map(m => m.id === id ? { ...m, ...patch } : m);
    notify();
    supabase.from('movimientos_financiamiento').update(patch).eq('id', id).then(({ error }) => marcarGuardado(!error));
  },
  eliminarMovimiento: id => {
    if (!window.confirm('¿Eliminar este movimiento?')) return;
    state.movimientosFinanciamiento = state.movimientosFinanciamiento.filter(m => m.id !== id);
    notify();
    supabase.from('movimientos_financiamiento').delete().eq('id', id).then(({ error }) => marcarGuardado(!error));
  },

  deudaNueva: direccion => {
    const d = { id: 'dd' + Date.now(), persona: '', monto: 0, direccion, nota: '', pagada: false };
    state.deudas = [d].concat(state.deudas);
    setState({ view: 'financiamiento' });
    supabase.from('deudas').insert(d).then(({ error }) => marcarGuardado(!error));
  },
  updDeuda: (id, patch) => {
    state.deudas = state.deudas.map(d => d.id === id ? { ...d, ...patch } : d);
    notify();
    supabase.from('deudas').update(patch).eq('id', id).then(({ error }) => marcarGuardado(!error));
  },
  toggleDeudaPagada: id => {
    const d = state.deudas.find(x => x.id === id);
    if (d) actions.updDeuda(id, { pagada: !d.pagada });
  },
  eliminarDeuda: id => {
    state.deudas = state.deudas.filter(d => d.id !== id);
    notify();
    supabase.from('deudas').delete().eq('id', id).then(({ error }) => marcarGuardado(!error));
  },

  pagoMensualNuevo: () => {
    const p = { id: 'pm' + Date.now(), nombre: '', monto: 0, dia_pago: null };
    state.pagosMensuales = state.pagosMensuales.concat([p]);
    notify();
    supabase.from('pagos_mensuales').insert(p).then(({ error }) => marcarGuardado(!error));
  },
  updPagoMensual: (id, patch) => {
    state.pagosMensuales = state.pagosMensuales.map(p => p.id === id ? { ...p, ...patch } : p);
    notify();
    supabase.from('pagos_mensuales').update(patch).eq('id', id).then(({ error }) => marcarGuardado(!error));
  },
  eliminarPagoMensual: id => {
    state.pagosMensuales = state.pagosMensuales.filter(p => p.id !== id);
    notify();
    supabase.from('pagos_mensuales').delete().eq('id', id).then(({ error }) => marcarGuardado(!error));
  },

  metaPersonalNueva: categoria => {
    const m = { id: 'mp' + Date.now(), categoria, titulo: '', fecha: null, cumplida: false };
    state.metasPersonales = state.metasPersonales.concat([m]);
    notify();
    supabase.from('metas_personales').insert(m).then(({ error }) => marcarGuardado(!error));
  },
  updMetaPersonal: (id, patch) => {
    state.metasPersonales = state.metasPersonales.map(m => m.id === id ? { ...m, ...patch } : m);
    notify();
    supabase.from('metas_personales').update(patch).eq('id', id).then(({ error }) => marcarGuardado(!error));
  },
  eliminarMetaPersonal: id => {
    state.metasPersonales = state.metasPersonales.filter(m => m.id !== id);
    notify();
    supabase.from('metas_personales').delete().eq('id', id).then(({ error }) => marcarGuardado(!error));
  },

  setMetaMensual: (marca, mes, valor) => {
    const id = marca + '_' + mes;
    const registro = { id, marca, mes, meta_publicaciones: valor };
    const existe = state.metasMensuales.some(m => m.id === id);
    state.metasMensuales = existe ? state.metasMensuales.map(m => m.id === id ? registro : m) : state.metasMensuales.concat([registro]);
    notify();
    supabase.from('metas_mensuales').upsert(registro).then(({ error }) => marcarGuardado(!error));
  },

  tareaNueva: () => {
    const colores = Object.keys(COLORES_TAREA);
    const color = colores[state.tareas.length % colores.length];
    const t = { id: 'tk' + Date.now(), texto: '', color, hecha: false };
    state.tareas = state.tareas.concat([t]);
    notify();
    supabase.from('tareas').insert(t).then(({ error }) => marcarGuardado(!error));
  },
  updTarea: (id, patch) => {
    state.tareas = state.tareas.map(t => t.id === id ? { ...t, ...patch } : t);
    notify();
    supabase.from('tareas').update(patch).eq('id', id).then(({ error }) => marcarGuardado(!error));
  },
  toggleTarea: id => {
    const t = state.tareas.find(x => x.id === id);
    if (t) actions.updTarea(id, { hecha: !t.hecha });
  },
  eliminarTarea: id => {
    state.tareas = state.tareas.filter(t => t.id !== id);
    notify();
    supabase.from('tareas').delete().eq('id', id).then(({ error }) => marcarGuardado(!error));
  },

  snapAbre: () => {
    const snaps = state.snaps.slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1);
    const last = snaps[snaps.length - 1] || {};
    const g = (k, f) => (last[k] ? String(last[k][f]) : '');
    setState({ snapDraft: { fecha: hoyStr(), brantSeg: g('brant', 'seg'), brantVis: g('brant', 'vis'), bacuSeg: g('bacu', 'seg'), bacuVis: g('bacu', 'vis'), novenaSeg: g('novena', 'seg'), novenaVis: g('novena', 'vis') } });
  },
  snapCierra: () => setState({ snapDraft: null }),
  snapSetFecha: v => setState({ snapDraft: { ...state.snapDraft, fecha: v } }),
  snapSetCampo: (key, v) => setState({ snapDraft: { ...state.snapDraft, [key]: v } }),
  snapGuarda: () => {
    const D = state.snapDraft;
    if (!D) return;
    const datos = {
      fecha: D.fecha || hoyStr(),
      brant: { seg: parseN(D.brantSeg), vis: parseN(D.brantVis) },
      bacu: { seg: parseN(D.bacuSeg), vis: parseN(D.bacuVis) },
      novena: { seg: parseN(D.novenaSeg), vis: parseN(D.novenaVis) }
    };
    const existente = state.snaps.find(s => s.fecha === datos.fecha);
    if (existente) {
      const actualizado = { ...existente, ...datos };
      state.snaps = state.snaps.map(s => s.id === existente.id ? actualizado : s);
      setState({ snapDraft: null });
      supabase.from('snaps').update(datos).eq('id', existente.id).then(({ error }) => marcarGuardado(!error));
    } else {
      const nuevo = { id: 's' + Date.now(), ...datos };
      state.snaps = state.snaps.concat([nuevo]);
      setState({ snapDraft: null });
      supabase.from('snaps').insert(nuevo).then(({ error }) => marcarGuardado(!error));
    }
  },

  iaAbrir: () => setState({
    iaDraft: { marca: state.filtroGuiones !== 'todas' ? state.filtroGuiones : 'brant', tema: '', modo: 'idea', formato: '' },
    iaResultado: null,
    iaError: null
  }),
  iaCerrar: () => setState({ iaDraft: null, iaResultado: null, iaError: null }),

  // Revisión de ideas por fecha
  abrirRevisionIdeas: (ideas) => setState({ revisionIdeasModal: true, revisionIdeasPendientes: ideas }),
  cerrarRevisionIdeas: () => setState({ revisionIdeasModal: false, revisionIdeasPendientes: [] }),

  cerrarNotificacionBacu: () => setState({ notificacionBacu: null }),
  // Marca el item como revisado, lo saca de la cola y muestra feedback breve
  _bacuAvanzarCola: (itemId, feedback) => {
    const revisadas = loadValue('bacu.ideasRevisadas', []);
    if (!revisadas.includes(itemId)) {
      revisadas.push(itemId);
      persistValue('bacu.ideasRevisadas', revisadas);
    }
    const pendientes = state.revisionIdeasPendientes.filter(i => i.id !== itemId);
    setState({ revisionIdeasPendientes: pendientes, notificacionBacu: feedback });
    setTimeout(() => {
      setState({ notificacionBacu: state.revisionIdeasPendientes.length ? 'pregunta' : null });
    }, 1800);
  },

  // El usuario elige directamente el módulo destino
  bacuSetEstado: (itemId, nuevoEstado, label) => {
    const item = state.revisionIdeasPendientes.find(p => p.id === itemId);
    if (item && item.tipo === 'cliente') {
      actions.updCliente(itemId, { estado: nuevoEstado });
    } else {
      actions.updIdea(itemId, { estado: nuevoEstado });
    }
    actions._bacuAvanzarCola(itemId, 'ok:' + (label || nuevoEstado));
  },

  // No se hizo: libera la fecha vencida para reagendar, sin cambiar el estado
  bacuPosponer: (itemId) => {
    const hoy = hoyStr();
    const item = state.revisionIdeasPendientes.find(p => p.id === itemId);
    if (item && item.tipo === 'cliente') {
      actions.updCliente(itemId, { fecha_grabacion: null });
    } else {
      const idea = state.ideas.find(i => i.id === itemId);
      const patch = {};
      if (idea && idea.fechaRodaje && idea.fechaRodaje < hoy) patch.fechaRodaje = null;
      if (idea && idea.fecha && idea.fecha < hoy) patch.fecha = null;
      if (Object.keys(patch).length) actions.updIdea(itemId, patch);
    }
    actions._bacuAvanzarCola(itemId, 'pospuesto');
  },
  actualizarEstadoIdea: (ideaId, nuevoEstado) => {
    const idea = state.ideas.find(i => i.id === ideaId);
    if (!idea) return;

    // Actualizar estado localmente
    const updated = { ...idea, estado: nuevoEstado };
    const idx = state.ideas.indexOf(idea);
    state.ideas[idx] = updated;

    // Guardar en Supabase
    supabase.from('ideas').update({ estado: nuevoEstado }).eq('id', ideaId).then(() => notify());

    // Marcar como revisada en sessionStorage
    const revisadas = JSON.parse(sessionStorage.getItem('ideas_revisadas') || '[]');
    if (!revisadas.includes(ideaId)) {
      revisadas.push(ideaId);
      sessionStorage.setItem('ideas_revisadas', JSON.stringify(revisadas));
    }
  },
  iaSetCampo: (campo, val) => setState({ iaDraft: { ...state.iaDraft, [campo]: val } }),

  iaGenerar: async () => {
    const D = state.iaDraft;
    if (!D) return;
    setState({ iaBusy: true, iaError: null });
    try {
      const ideas = await generarIdea(D);
      setState({ iaBusy: false, iaResultado: ideas });
    } catch (e) {
      setState({ iaBusy: false, iaError: 'No se pudo generar. Intenta de nuevo.' });
    }
  },

  iaConfirmar: () => {
    const D = state.iaDraft;
    const ideas = state.iaResultado;
    if (!D || !ideas || !ideas.length) return;
    const nuevas = ideas.map((idea, i) => ({
      id: 'u' + Date.now() + '_' + i,
      marca: D.marca,
      colab: '',
      titulo: idea.titulo,
      nota: '',
      gancho: '',
      objetivos: idea.objetivos || [],
      formato: idea.formato,
      estado: 'desarrollo',
      fecha: null,
      fechaRodaje: null,
      preguntas: [null, null, null, null],
      tiempo: '',
      grabacion: false,
      edicion: false,
      prioridad: 'Media',
      etapa: 0,
      guion: idea.guion
    }));
    state.ideas = nuevas.concat(state.ideas);
    setState({ iaDraft: null, iaResultado: null, view: 'guiones', filtroGuiones: D.marca });
    nuevas.forEach((idea) => {
      supabase.from('ideas').insert(toDbIdea(idea)).then(({ error }) => marcarGuardado(!error));
    });
  },

  updPresupuesto: (campo, valor) => {
    state.presupuesto = { ...state.presupuesto, [campo]: parseN(valor) };
    notify();
  },

  gastoNuevo: () => {
    const id = 'g' + Date.now();
    state.gastosVivirSolo = state.gastosVivirSolo.concat([
      { id, nombre: 'Nuevo gasto', emoji: '💰', monto: 0, dia_vencimiento: 1 }
    ]);
    notify();
  },

  eliminarGasto: (id) => {
    state.gastosVivirSolo = state.gastosVivirSolo.filter(g => g.id !== id);
    notify();
  },

  updGasto: (id, campo, valor) => {
    const gasto = state.gastosVivirSolo.find(g => g.id === id);
    if (gasto) {
      gasto[campo] = campo === 'monto' || campo === 'dia_vencimiento' ? parseN(valor) : valor;
      notify();
    }
  }
};
