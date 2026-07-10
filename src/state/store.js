import { loadValue, persistValue } from '../lib/storage.js';
import { parseN } from '../lib/format.js';
import { mesActual, hoyStr, lunesDe, sumarDias } from '../lib/idea.js';
import { supabase } from '../lib/supabaseClient.js';

export const state = {
  view: 'calendario',
  month: mesActual(),
  ideas: [],
  snaps: [],
  clientes: [],
  selId: null,
  guionId: null,
  filtro: 'todas',
  filtroDesarrollo: 'todas',
  filtroCalendario: 'todas',
  calVista: 'mes',
  semanaInicio: lunesDe(hoyStr()),
  snapDraft: null,
  tema: loadValue('sistemaEditorial.tema', 'Cine crudo'),
  modoCalma: loadValue('sistemaEditorial.modoCalma', false),
  saveError: false,

  session: null,
  authReady: false,
  authBusy: false,
  authError: null,
  dataReady: false
};

const listeners = [];
export function subscribe(fn) { listeners.push(fn); }
function notify() { listeners.forEach(fn => fn()); }

function setState(patch) {
  Object.assign(state, patch);
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
  const [ideasRes, snapsRes, clientesRes] = await Promise.all([
    supabase.from('ideas').select('*').order('id'),
    supabase.from('snaps').select('*').order('fecha'),
    supabase.from('clientes').select('*').order('id')
  ]);
  state.ideas = (ideasRes.data || []).map(fromDbIdea);
  state.snaps = snapsRes.data || [];
  state.clientes = clientesRes.data || [];
  state.dataReady = true;
  notify();
  suscribirRealtime();
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
}

export const actions = {
  setView: v => setState({ view: v }),
  setFiltro: v => setState({ filtro: v }),
  abrirMarca: marca => setState({ view: 'banco', filtro: marca }),

  setTema: v => { const ok = persistValue('sistemaEditorial.tema', v); setState({ tema: v }); marcarGuardado(ok); },
  setModoCalma: v => { const ok = persistValue('sistemaEditorial.modoCalma', v); setState({ modoCalma: v }); marcarGuardado(ok); },
  descartarAvisoGuardado: () => setState({ saveError: false }),

  login: async (email, password) => {
    setState({ authBusy: true, authError: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setState({ authBusy: false, authError: 'No pudimos iniciar sesión. Revisá el email y la contraseña.' });
    else setState({ authBusy: false, authError: null });
  },
  logout: async () => { await supabase.auth.signOut(); },

  nuevaIdea: () => {
    const nueva = { id: 'u' + Date.now(), marca: 'brant', colab: '', titulo: '', nota: '', gancho: '', objetivos: [], formato: 'Reel', estado: 'desarrollo', fecha: null, fechaRodaje: null, preguntas: [null, null, null, null], tiempo: '', grabacion: false, edicion: false, prioridad: 'Media', etapa: 0 };
    state.ideas = [nueva].concat(state.ideas);
    setState({ selId: nueva.id, view: (state.view === 'banco' || state.view === 'desarrollo') ? state.view : 'banco' });
    supabase.from('ideas').insert(toDbIdea(nueva)).then(({ error }) => marcarGuardado(!error));
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

  setFiltroDesarrollo: v => setState({ filtroDesarrollo: v }),
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
  setFiltroCalendario: v => setState({ filtroCalendario: v }),
  cambiaSemana: delta => setState({ semanaInicio: sumarDias(state.semanaInicio, delta * 7) }),

  nuevoCliente: () => {
    const c = { id: 'c' + Date.now(), nombre: '', estado: 'prospecto', proyecto: '', nota: '' };
    state.clientes = [c].concat(state.clientes);
    setState({ view: 'clientes' });
    supabase.from('clientes').insert(c).then(({ error }) => marcarGuardado(!error));
  },
  updCliente: (id, patch) => {
    state.clientes = state.clientes.map(c => c.id === id ? { ...c, ...patch } : c);
    notify();
    supabase.from('clientes').update(patch).eq('id', id).then(({ error }) => marcarGuardado(!error));
  },
  eliminarCliente: id => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    state.clientes = state.clientes.filter(x => x.id !== id);
    notify();
    supabase.from('clientes').delete().eq('id', id).then(({ error }) => marcarGuardado(!error));
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
  }
};
