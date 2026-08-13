// Sincronización unidireccional S.A.O BACU → Google Calendar.
//
// Todo corre en el navegador (esta app no tiene backend propio, solo Supabase). Usa Google
// Identity Services (GIS) para pedir un access token con scope calendar.events, y la API REST
// de Calendar directo por fetch — sin SDK de Google, para no meter otra dependencia pesada.
//
// Diseño:
// - Un solo calendario secundario dedicado "S.A.O BACU" en la cuenta de Google del usuario
//   (no se mezcla con el calendario principal). Se crea la primera vez y su id queda guardado
//   en localStorage (google.calendarId).
// - Cada evento sincronizado lleva extendedProperties.private.agentebacu_key con una clave
//   estable (ej. "idea:<id>:rodaje") — así una re-sincronización actualiza el mismo evento en
//   vez de duplicarlo, sin necesitar guardar el id del evento de Google en Supabase.
// - La sincronización es una reconciliación completa: crea/actualiza todo lo que hoy tiene
//   fecha en la app, y borra en Google lo que ya no debería estar (fecha quitada, idea
//   descartada, tarea marcada hecha, etc.) — así Google Calendar siempre queda igual a la
//   versión más actual de la app, sin acumular basura vieja.
// - Es solo de ida (app → Google): lo que se edite directo en Google Calendar no vuelve a la
//   app, y una nueva sincronización lo pisa.

import { MARCAS } from '../data/constants.js';
import { persistValue, loadValue } from './storage.js';

const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const CAL_SUMMARY = 'S.A.O BACU';
const API = 'https://www.googleapis.com/calendar/v3';

let gisPromise = null;
let tokenClient = null;
let accessToken = null;
let tokenExpiry = 0;

function cargarGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services (¿sin conexión?).'));
    document.head.appendChild(script);
  });
  return gisPromise;
}

function pedirToken(clientId, { prompt }) {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      tokenClient = google.accounts.oauth2.initTokenClient({ client_id: clientId, scope: SCOPE, callback: () => {} });
    }
    tokenClient.callback = (resp) => {
      if (resp.error) { reject(new Error(resp.error)); return; }
      accessToken = resp.access_token;
      tokenExpiry = Date.now() + (Number(resp.expires_in) || 3600) * 1000;
      resolve(resp);
    };
    tokenClient.requestAccessToken({ prompt });
  });
}

export function estaConectado() {
  return !!accessToken && Date.now() < tokenExpiry;
}

// Primera conexión: siempre pide consentimiento explícito (popup de Google).
export async function conectar(clientId) {
  await cargarGis();
  await pedirToken(clientId, { prompt: 'consent' });
}

// Intenta renovar el token sin popup — solo funciona si el navegador ya tiene sesión de
// Google y consentimiento previo. Si falla, hay que llamar a conectar() de nuevo (con popup).
export async function reconectarSilencioso(clientId) {
  await cargarGis();
  await pedirToken(clientId, { prompt: '' });
}

export function desconectar() {
  if (accessToken && window.google?.accounts?.oauth2) {
    google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  tokenExpiry = 0;
}

function headers(json) {
  const h = { Authorization: `Bearer ${accessToken}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

async function apiFetch(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) {
    let detalle = '';
    try { detalle = (await r.json()).error?.message || ''; } catch (e) {}
    throw new Error(`Google Calendar respondió ${r.status}${detalle ? ': ' + detalle : ''}`);
  }
  return r.status === 204 ? null : r.json();
}

async function obtenerOCrearCalendario() {
  const calId = loadValue('google.calendarId', null);
  if (calId) {
    const r = await fetch(`${API}/calendars/${encodeURIComponent(calId)}`, { headers: headers(false) });
    if (r.ok) return calId;
    // Si ya no existe (por ejemplo lo borraron a mano en Google), cae a crear uno nuevo abajo.
  }
  const cal = await apiFetch(`${API}/calendars`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({
      summary: CAL_SUMMARY,
      description: 'Sincronizado automáticamente desde S.A.O BACU. No lo edites acá — se sobreescribe en cada sincronización.',
      timeZone: 'America/Bogota',
    }),
  });
  persistValue('google.calendarId', cal.id);
  return cal.id;
}

// Mismos filtros que entradasDeDia()/tieneEntradas() en views/calendario.js, aplanados sobre
// todas las fechas (no por día) — lo que se sincroniza es exactamente lo que ya se ve ahí.
function itemsASincronizar(state) {
  const items = [];

  for (const i of state.ideas || []) {
    if (i.estado === 'descartada') continue;
    const marca = MARCAS[i.marca]?.nombre || i.marca || '';
    if (i.fecha) {
      items.push({
        key: `idea:${i.id}:fecha`,
        fecha: i.fecha,
        titulo: `📢 ${i.titulo || 'Idea sin título'}`,
        descripcion: `Publicación · ${i.formato || ''} · ${marca}`,
      });
    }
    if (i.fechaRodaje) {
      items.push({
        key: `idea:${i.id}:rodaje`,
        fecha: i.fechaRodaje,
        titulo: `🎬 Rodaje: ${i.titulo || 'Idea sin título'}`,
        descripcion: `Rodaje · ${i.formato || ''} · ${marca}`,
      });
    }
  }

  for (const c of state.clientes || []) {
    if (c.estado === 'conversacion') continue;
    if (c.fecha_grabacion) {
      items.push({
        key: `cliente:${c.id}:grabacion`,
        fecha: c.fecha_grabacion,
        titulo: `🎥 Grabación: ${c.nombre || 'Cliente'}`,
        descripcion: c.proyecto || 'Proyecto sin definir',
      });
    }
  }

  for (const t of state.tareas || []) {
    if (t.hecha) continue;
    if (t.fecha) {
      items.push({
        key: `tarea:${t.id}`,
        fecha: t.fecha,
        titulo: `📌 ${t.texto || 'Tarea'}`,
        descripcion: 'Entrega',
      });
    }
  }

  return items;
}

async function buscarEventoExistente(calId, key) {
  const url = new URL(`${API}/calendars/${encodeURIComponent(calId)}/events`);
  url.searchParams.set('privateExtendedProperty', `agentebacu_key=${key}`);
  url.searchParams.set('showDeleted', 'false');
  url.searchParams.set('maxResults', '1');
  const data = await apiFetch(url, { headers: headers(false) });
  return (data.items && data.items[0]) || null;
}

async function upsertEvento(calId, item) {
  const existente = await buscarEventoExistente(calId, item.key);
  const body = {
    summary: item.titulo,
    description: item.descripcion,
    start: { date: item.fecha },
    end: { date: item.fecha },
    extendedProperties: { private: { agentebacu_key: item.key } },
  };
  const base = `${API}/calendars/${encodeURIComponent(calId)}/events`;
  const url = existente ? `${base}/${existente.id}` : base;
  await apiFetch(url, { method: existente ? 'PATCH' : 'POST', headers: headers(true), body: JSON.stringify(body) });
}

// Todos los eventos del calendario dedicado que llevan nuestra marca (agentebacu_key) — el
// calendario es chico (solo tiene lo que nosotros mismos creamos), así que traer todo y
// filtrar en el cliente es más simple que paginar con filtros del lado de Google.
async function listarSincronizados(calId) {
  let items = [];
  let pageToken;
  do {
    const url = new URL(`${API}/calendars/${encodeURIComponent(calId)}/events`);
    url.searchParams.set('maxResults', '2500');
    url.searchParams.set('showDeleted', 'false');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const data = await apiFetch(url, { headers: headers(false) });
    items = items.concat(data.items || []);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items.filter(e => e.extendedProperties?.private?.agentebacu_key);
}

// Reconciliación completa: crea/actualiza todo lo vigente, borra lo que ya no corresponde.
export async function sincronizar(state) {
  if (!estaConectado()) throw new Error('No hay conexión activa con Google Calendar.');

  const calId = await obtenerOCrearCalendario();
  const items = itemsASincronizar(state);
  const clavesActuales = new Set(items.map(i => i.key));

  for (const item of items) {
    await upsertEvento(calId, item);
  }

  const existentes = await listarSincronizados(calId);
  const aBorrar = existentes.filter(e => !clavesActuales.has(e.extendedProperties.private.agentebacu_key));
  for (const e of aBorrar) {
    await apiFetch(`${API}/calendars/${encodeURIComponent(calId)}/events/${e.id}`, { method: 'DELETE', headers: headers(false) });
  }

  const resumen = { sincronizados: items.length, borrados: aBorrar.length };
  persistValue('google.ultimaSync', new Date().toISOString());
  persistValue('google.ultimoResumen', resumen);
  return resumen;
}
