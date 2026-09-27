// Importa lo planeado en la "Parrilla de Contenido" de un Google Sheet hacia ideas/clientes
// en Supabase. Comparte la conexión OAuth con googleCalendar.js (mismo token, ver
// googleAuth.js) — conectar una vez alcanza para las dos cosas.
//
// Diseño deliberadamente conservador: esto SOLO agrega o actualiza, nunca borra nada en la
// app aunque una fila desaparezca del Sheet — a diferencia de sincronizar() en
// googleCalendar.js (que sí reconcilia y borra), acá el Sheet es una fuente que ALIMENTA a la
// app, no una que la reemplaza, y la persona pidió explícitamente que nada se corrompa ni se
// borre solo. Si una idea ya se importó antes (mismo trío marca/cliente + título + fecha de
// grabación, sin importar mayúsculas/espacios), se actualiza en vez de duplicarse; si no
// existe, se crea. El estado (`idea.estado`) de una idea ya existente NUNCA se toca acá — el
// vocabulario de estados de la Parrilla ("Idea", "Por grabar"...) no es el mismo que el de la
// app, mapear mal pisaría dónde va realmente el trabajo dentro de la app.
//
// Solo se importan los campos con equivalente directo en `ideas` (marca/cliente, título,
// formato, fecha de grabación, fecha de publicación). Cantidad, Tipo de contenido, Deadline,
// Responsables, Canal, Pago, Guion y Observaciones se quedan solo en el Sheet — no hay un
// lugar 1 a 1 para todos ellos en el esquema actual de la app, e inventar campos nuevos no es
// parte de este pedido.

import { getAccessToken } from './googleAuth.js';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const HOJA = 'Parrilla de Contenido';
// Comillas simples alrededor del nombre de la hoja: en notación A1 hacen falta apenas el
// nombre tiene un espacio (como acá) — sin esto la API lo puede interpretar mal o rechazarlo.
// B..L cubre exactamente lo que se mapea: Marca/Cliente, Título, Formato, Tipo(ignorado),
// Cantidad(ignorado), Fecha Grabación, Responsable Grabación(ignorado), Estado(ignorado),
// Deadline(ignorado), Fecha de Publicación, Responsable Edición(ignorado).
const RANGO = `'${HOJA}'!B6:L1000`;

// Mismo criterio que nuevaIdeaGuardar() en store.js para "para quién": si el nombre matchea
// una de las 3 marcas propias, es marca; si no, es un cliente externo y el trabajo queda
// como propio de Bacu (mismo default que ya usa esa función).
const MARCAS_MAP = { brant: 'brant', bacu: 'bacu', 'bacu creative': 'bacu', novena: 'novena', 'novena crew': 'novena' };
function resolverMarcaOCliente(nombreCrudo) {
  const quien = (nombreCrudo || '').trim();
  const marcaElegida = MARCAS_MAP[quien.toLowerCase()];
  return {
    marca: marcaElegida || (quien ? 'bacu' : 'brant'),
    cliente: !marcaElegida && quien ? quien : null
  };
}

// El API con UNFORMATTED_VALUE devuelve fechas como número serial (días desde 1899-12-30,
// igual que Excel) sin importar el idioma/formato regional de la hoja — más confiable que
// parsear un texto tipo "29/9/2026" que podría venir en cualquier formato según cómo esté
// configurada la hoja del usuario.
function serialAFechaISO(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const ms = Math.round((n - 25569) * 86400000); // 25569 = días entre 1899-12-30 y 1970-01-01
  const d = new Date(ms);
  if (isNaN(d)) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

async function leerFilas(sheetId) {
  const url = `${SHEETS_API}/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(RANGO)}?valueRenderOption=UNFORMATTED_VALUE`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${getAccessToken()}` } });
  if (!r.ok) {
    let detalle = '';
    try { detalle = (await r.json()).error?.message || ''; } catch (e) {}
    throw new Error(`Google Sheets respondió ${r.status}${detalle ? ': ' + detalle : ''}`);
  }
  const data = await r.json();
  return data.values || [];
}

// Clave de coincidencia — no hay ningún id estable entre el Sheet y la app (la "Clave
// calendario" del Sheet depende del Deadline, que ni siquiera se importa), así que se compara
// por contenido: mismo dueño (ya resuelto a marca o cliente, no el texto crudo — así "Bacu" y
// "Bacu Creative" en distintas corridas siguen matcheando la misma idea) + mismo título +
// misma fecha de grabación.
function claveFila(marcaOCliente, titulo, fechaRodaje) {
  return `${(marcaOCliente || '').trim().toLowerCase()}|${(titulo || '').trim().toLowerCase()}|${fechaRodaje || ''}`;
}

// state: la misma referencia state/actions que usa el resto de store.js — se pasa así para
// no duplicar acceso a Supabase acá (crear/actualizar ideas y clientes se delega a lo que ya
// existe: actions.updIdea y el mismo patrón de toDbIdea que usa rodajeRapidoGuardar).
export async function importarParrilla(sheetId, { state, actions, supabase, toDbIdea, marcarGuardado }) {
  if (!getAccessToken()) throw new Error('No hay conexión activa con Google.');
  if (!sheetId || !sheetId.trim()) throw new Error('Falta el ID de la hoja de Google Sheets.');

  const filas = await leerFilas(sheetId.trim());

  // Índice de ideas ya importadas antes, por la misma clave de contenido — para actualizar en
  // vez de duplicar en cada importación repetida.
  const existentesPorClave = new Map();
  for (const i of state.ideas || []) {
    const quien = i.cliente || i.marca || '';
    existentesPorClave.set(claveFila(quien, i.titulo, i.fechaRodaje), i.id);
  }

  let creadas = 0, actualizadas = 0, saltadas = 0, clientesCreados = 0;

  for (const fila of filas) {
    const [paraQuienCrudo, titulo, formato, , , fechaGrabacionRaw, , , , fechaPublicacionRaw] = fila;
    if (!titulo || !String(titulo).trim()) { saltadas++; continue; }

    const paraQuien = (paraQuienCrudo || '').trim();
    const { marca, cliente } = resolverMarcaOCliente(paraQuien);
    const fechaRodaje = serialAFechaISO(fechaGrabacionRaw);
    const fecha = serialAFechaISO(fechaPublicacionRaw);

    const clave = claveFila(cliente || marca, titulo, fechaRodaje);
    const idExistente = existentesPorClave.get(clave);

    if (idExistente) {
      // Actualiza solo lo descriptivo/fechas — el estado de progreso dentro de la app
      // (idea.estado) no se toca nunca desde acá, ver nota arriba. Solo se incluyen las
      // llaves con datos reales: mandar formato:undefined pisaría el valor que ya tenía la
      // idea en el estado local (el spread de updIdea no distingue "sin cambio" de "bórralo").
      const patch = { titulo: String(titulo).trim(), fecha, fechaRodaje };
      if (formato) patch.formato = formato;
      actions.updIdea(idExistente, patch);
      actualizadas++;
      continue;
    }

    const nueva = {
      id: 'u' + Date.now() + Math.random().toString(36).slice(2, 7),
      marca, colab: '', titulo: String(titulo).trim(), nota: '', gancho: '', objetivos: [],
      formato: formato || 'Cubrimiento', estado: 'desarrollo', fecha, fechaRodaje,
      preguntas: [null, null, null, null], tiempo: '', grabacion: !!fechaRodaje, edicion: false,
      prioridad: 'Media', etapa: 0
    };
    if (cliente) nueva.cliente = cliente;
    state.ideas = [nueva].concat(state.ideas);
    supabase.from('ideas').insert(toDbIdea(nueva)).then(({ error }) => marcarGuardado(!error, error));
    creadas++;

    // Cliente externo nuevo: mismo patrón exacto que rodajeRapidoGuardar en store.js — busca
    // por nombre (sin mayúsculas ni espacios de más) antes de crear, para no duplicar un
    // cliente que ya existe con una escritura distinta.
    if (cliente) {
      const yaExiste = state.clientes.some(c => (c.nombre || '').trim().toLowerCase() === cliente.toLowerCase());
      if (!yaExiste) {
        const nuevoCliente = { id: 'c' + Date.now() + Math.random().toString(36).slice(2, 7), nombre: cliente, documento: '', estado: 'activo', proyecto: String(titulo).trim(), nota: '' };
        state.clientes = [nuevoCliente].concat(state.clientes);
        supabase.from('clientes').insert(nuevoCliente).then(({ error }) => marcarGuardado(!error, error));
        clientesCreados++;
      }
    }
  }

  return { filasLeidas: filas.length, creadas, actualizadas, saltadas, clientesCreados };
}
