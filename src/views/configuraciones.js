import { TEMA_OPTIONS } from '../data/constants.js';
import { escapeHtml } from '../lib/format.js';
import { APP_VERSION } from '../lib/version.js';

function fmtFechaHora(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function seccionGoogleCalendar(state) {
  const ultimaSync = fmtFechaHora(state.googleUltimaSync);
  const resumen = state.googleUltimoResumen;
  return `
    <div class="finanzas-seccion" style="margin-bottom:24px;max-width:420px;">
      <div class="seccion-titulo">Google (Calendar + Sheets)</div>
      <p style="font-size:12px;opacity:0.75;line-height:1.5;margin:0 0 12px;">
        Una sola conexión con tu cuenta de Google habilita dos botones separados, cada uno con su
        propio botón — conectar por sí solo no dispara ninguno de los dos: <b>"Sincronizar calendario ahora"</b>
        (empuja rodajes/grabaciones/entregas hacia un calendario de Google) e <b>"Importar ahora"</b> (trae tu
        Parrilla de Contenido de Google Sheets hacia Clientes/Calendario — ver abajo). Si solo querés usar uno
        de los dos, simplemente no toques el botón del otro — nada pasa solo.
      </p>

      <label style="font-size:11px;opacity:0.7;display:block;margin-bottom:6px;">Client ID de Google (OAuth)</label>
      <input
        type="text"
        data-change="google-client-id"
        value="${escapeHtml(state.googleClientId || '')}"
        placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"
        style="width:100%;margin-bottom:6px;"
        ${state.googleConectado ? 'disabled' : ''}
      >
      <p style="font-size:11px;opacity:0.6;line-height:1.5;margin:0 0 14px;">
        Se crea una vez en <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" style="color:var(--verde);">Google Cloud Console</a> →
        "Crear credenciales" → "ID de cliente de OAuth" → tipo "Aplicación web" → agregando este sitio en
        "Orígenes autorizados de JavaScript". Se pega acá una sola vez, queda guardado en este dispositivo.
        Si ya estabas conectado desde antes de que existiera la importación de Sheets, tenés que
        "Desconectar" y volver a "Conectar" una vez — el permiso viejo no incluye leer Sheets.
      </p>

      ${state.googleError ? `<div style="color:var(--rojo);font-size:12px;margin-bottom:12px;">${escapeHtml(state.googleError)}</div>` : ''}

      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        ${state.googleConectado
          ? `<button class="btn-ghost" data-act="google-sincronizar" ${state.googleSincronizando ? 'disabled' : ''}>${state.googleSincronizando ? 'Sincronizando…' : 'Sincronizar calendario ahora'}</button>
             <button class="btn-text-muted" data-act="google-desconectar">Desconectar</button>`
          : `<button class="btn-primary" data-act="google-conectar" ${state.googleSincronizando || !state.googleClientId ? 'disabled' : ''}>${state.googleSincronizando ? 'Conectando…' : 'Conectar con Google'}</button>`
        }
      </div>

      ${ultimaSync ? `
        <p style="font-size:11px;opacity:0.6;margin:12px 0 0;">
          Última sincronización de calendario: ${ultimaSync}${resumen ? ` — ${resumen.sincronizados} evento(s), ${resumen.borrados} eliminado(s)` : ''}
        </p>
      ` : ''}
    </div>
    ${state.googleConectado ? seccionGoogleSheets(state) : ''}
  `;
}

function seccionGoogleSheets(state) {
  const ultimo = state.googleUltimoImport;
  const ultimoFecha = ultimo ? fmtFechaHora(ultimo.cuando) : null;
  return `
    <div class="finanzas-seccion" style="margin-bottom:24px;max-width:420px;">
      <div class="seccion-titulo">Importar Parrilla de Contenido (Google Sheets)</div>
      <p style="font-size:12px;opacity:0.75;line-height:1.5;margin:0 0 12px;">
        Trae lo planeado en la pestaña "Parrilla de Contenido" de tu Google Sheet hacia Clientes/Calendario.
        Solo agrega o actualiza — nunca borra nada acá, aunque borres una fila del Sheet. El estado de una
        idea que ya progresaste adentro de la app tampoco se toca. Es manual a propósito: lo corrés vos
        cuando quieras traer lo nuevo, no pasa solo.
      </p>

      <label style="font-size:11px;opacity:0.7;display:block;margin-bottom:6px;">ID de la hoja de Google Sheets</label>
      <input
        type="text"
        data-change="google-sheet-id"
        value="${escapeHtml(state.googleSheetId || '')}"
        placeholder="El código largo en la URL de tu Sheet"
        style="width:100%;margin-bottom:6px;"
      >
      <p style="font-size:11px;opacity:0.6;line-height:1.5;margin:0 0 14px;">
        Es la parte entre <code>/d/</code> y <code>/edit</code> en la URL de tu hoja:
        docs.google.com/spreadsheets/d/<b>ESTE-PEDAZO</b>/edit. La hoja debe tener una pestaña llamada
        exactamente "Parrilla de Contenido", con las mismas columnas de la plantilla.
      </p>

      ${state.googleImportError ? `<div style="color:var(--rojo);font-size:12px;margin-bottom:12px;">${escapeHtml(state.googleImportError)}</div>` : ''}

      <button class="btn-primary" data-act="google-importar" ${state.googleImportando || !state.googleSheetId ? 'disabled' : ''}>
        ${state.googleImportando ? 'Importando…' : 'Importar ahora'}
      </button>

      ${ultimoFecha ? `
        <p style="font-size:11px;opacity:0.6;margin:12px 0 0;">
          Última importación: ${ultimoFecha} — ${ultimo.creadas} idea(s) nueva(s), ${ultimo.actualizadas} actualizada(s),
          ${ultimo.clientesCreados} cliente(s) nuevo(s)${ultimo.saltadas ? `, ${ultimo.saltadas} fila(s) sin título saltada(s)` : ''}.
        </p>
      ` : ''}
    </div>
  `;
}

export function renderConfiguraciones(state) {
  const temaOptions = TEMA_OPTIONS.map(t => `<option value="${escapeHtml(t)}" ${state.tema === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('');

  return `
    <main class="configuraciones">
      <button class="btn-ghost" data-act="nav-go" data-view="${escapeHtml(state.vistaPreviaConfig || 'panorama')}" style="margin-bottom:20px;">← Volver</button>
      <h2 class="serif" style="margin:0;font-size:32px;">Configuraciones</h2>
      <div class="vista-sub">Ajustes de la app — antes vivían sueltos en el encabezado de todas las pestañas.</div>

      <div class="finanzas-seccion" style="margin-bottom:24px;max-width:420px;">
        <div class="seccion-titulo">Tema</div>
        <select id="tema-select" data-change="tema" style="width:100%;">${temaOptions}</select>
      </div>

      <div class="finanzas-seccion" style="margin-bottom:24px;max-width:420px;">
        <div class="seccion-titulo">Modo calma</div>
        <label style="display:flex;align-items:center;gap:10px;">
          <input type="checkbox" id="calma-checkbox" data-change="calma" ${state.modoCalma ? 'checked' : ''}>
          Oculta métricas y números para bajarle el ruido a la cabeza
        </label>
      </div>

      ${seccionGoogleCalendar(state)}

      <div class="finanzas-seccion" style="max-width:420px;">
        <div class="seccion-titulo">Versión</div>
        <div style="opacity:0.7;font-size:13px;margin-bottom:10px;">
          Esta app está corriendo <b id="app-version-visible">${escapeHtml(APP_VERSION)}</b>.
          Si acá no ves la última, cerrá la app del todo y volvé a abrirla.
        </div>
        <button class="btn-ghost" data-act="buscar-actualizacion">Buscar actualización</button>
      </div>

      ${state.session ? `
        <div class="finanzas-seccion" style="max-width:420px;">
          <div class="seccion-titulo">Sesión</div>
          <div style="opacity:0.7;font-size:13px;margin-bottom:12px;">${escapeHtml(state.session.user.email)}</div>
          <button class="btn-delete" data-act="logout">Salir</button>
        </div>
      ` : ''}
    </main>
  `;
}
