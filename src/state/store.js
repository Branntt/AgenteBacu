import { seedIdeas, seedSnaps, seedClientes } from '../data/seed.js';
import { load, persist, loadValue, persistValue } from '../lib/storage.js';
import { parseN } from '../lib/format.js';
import { mesActual, hoyStr } from '../lib/idea.js';

export const state = {
  view: 'panorama',
  month: mesActual(),
  ideas: load('sistemaEditorial.v1', seedIdeas()),
  snaps: load('sistemaEditorial.snaps.v1', seedSnaps()),
  clientes: load('sistemaEditorial.clientes.v1', seedClientes()),
  selId: null,
  filtro: 'todas',
  snapDraft: null,
  tema: loadValue('sistemaEditorial.tema', 'Cine oscuro'),
  modoCalma: loadValue('sistemaEditorial.modoCalma', false)
};

const listeners = [];
export function subscribe(fn) { listeners.push(fn); }
function notify() { listeners.forEach(fn => fn()); }

function setState(patch) {
  Object.assign(state, patch);
  notify();
}

function saveIdeas(ideas) { setState({ ideas }); persist('sistemaEditorial.v1', ideas); }
function saveSnaps(snaps) { setState({ snaps }); persist('sistemaEditorial.snaps.v1', snaps); }
function saveClientes(clientes) { setState({ clientes }); persist('sistemaEditorial.clientes.v1', clientes); }

export const actions = {
  setView: v => setState({ view: v }),
  setFiltro: v => setState({ filtro: v }),
  abrirMarca: marca => setState({ view: 'banco', filtro: marca }),

  setTema: v => { persistValue('sistemaEditorial.tema', v); setState({ tema: v }); },
  setModoCalma: v => { persistValue('sistemaEditorial.modoCalma', v); setState({ modoCalma: v }); },

  nuevaIdea: () => {
    const nueva = { id: 'u' + Date.now(), marca: 'brant', colab: '', titulo: '', nota: '', gancho: '', objetivos: [], formato: 'Reel', estado: 'desarrollo', fecha: null, preguntas: [null, null, null, null], tiempo: '', grabacion: false, edicion: false, prioridad: 'Media', etapa: 0 };
    saveIdeas([nueva].concat(state.ideas));
    setState({ selId: nueva.id, view: state.view === 'panorama' ? 'banco' : state.view });
  },
  abrirIdea: id => setState({ selId: id }),
  cerrarDrawer: () => setState({ selId: null }),
  updIdea: (id, patch) => saveIdeas(state.ideas.map(i => i.id === id ? { ...i, ...patch } : i)),
  eliminarIdea: id => {
    if (window.confirm('¿Eliminar esta idea definitivamente?')) {
      saveIdeas(state.ideas.filter(x => x.id !== id));
      setState({ selId: null });
    }
  },
  toggleObjetivo: (id, idx) => {
    const idea = state.ideas.find(i => i.id === id);
    if (!idea) return;
    const objetivos = idea.objetivos.includes(idx) ? idea.objetivos.filter(x => x !== idx) : idea.objetivos.concat([idx]);
    saveIdeas(state.ideas.map(i => i.id === id ? { ...i, objetivos } : i));
  },
  setPregunta: (id, qi, val) => {
    const idea = state.ideas.find(i => i.id === id);
    if (!idea) return;
    const preguntas = idea.preguntas.slice();
    preguntas[qi] = preguntas[qi] === val ? null : val;
    saveIdeas(state.ideas.map(i => i.id === id ? { ...i, preguntas } : i));
  },
  setMetrica: (id, campo, val) => {
    const idea = state.ideas.find(i => i.id === id);
    if (!idea) return;
    saveIdeas(state.ideas.map(i => i.id === id ? { ...i, metricas: { ...(i.metricas || {}), [campo]: val } } : i));
  },

  cambiaMes: delta => {
    const [anio, mesNum] = state.month.split('-').map(Number);
    let y = anio, m = mesNum + delta;
    if (m === 0) { m = 12; y--; }
    if (m === 13) { m = 1; y++; }
    setState({ month: y + '-' + String(m).padStart(2, '0') });
  },
  irAHoy: () => setState({ month: mesActual() }),

  nuevoCliente: () => {
    const c = { id: 'c' + Date.now(), nombre: '', estado: 'prospecto', proyecto: '', nota: '' };
    saveClientes([c].concat(state.clientes));
    setState({ view: 'clientes' });
  },
  updCliente: (id, patch) => saveClientes(state.clientes.map(c => c.id === id ? { ...c, ...patch } : c)),
  eliminarCliente: id => {
    if (window.confirm('¿Eliminar este cliente?')) saveClientes(state.clientes.filter(x => x.id !== id));
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
    const nuevo = {
      id: 's' + Date.now(), fecha: D.fecha || hoyStr(),
      brant: { seg: parseN(D.brantSeg), vis: parseN(D.brantVis) },
      bacu: { seg: parseN(D.bacuSeg), vis: parseN(D.bacuVis) },
      novena: { seg: parseN(D.novenaSeg), vis: parseN(D.novenaVis) }
    };
    saveSnaps(state.snaps.filter(s => s.fecha !== nuevo.fecha).concat([nuevo]));
    setState({ snapDraft: null });
  }
};
