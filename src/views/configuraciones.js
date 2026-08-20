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
      <div class="seccion-titulo">Google Calendar</div>
      <p style="font-size:12px;opacity:0.75;line-height:1.5;margin:0 0 12px;">
        Crea un calendario aparte llamado "S.A.O BACU" en tu cuenta de Google y lo llena con lo que ya ves acá:
        rodajes, grabaciones de clientes y entregas con fecha. Es de un solo sentido — lo que edites en Google
        no vuelve a la app, cada sincronización lo vuelve a dejar igual a lo que hay acá.
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
      </p>

      ${state.googleError ? `<div style="color:var(--rojo);font-size:12px;margin-bottom:12px;">${escapeHtml(state.googleError)}</div>` : ''}

      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        ${state.googleConectado
          ? `<button class="btn-ghost" data-act="google-sincronizar" ${state.googleSincronizando ? 'disabled' : ''}>${state.googleSincronizando ? 'Sincronizando…' : 'Sincronizar ahora'}</button>
             <button class="btn-text-muted" data-act="google-desconectar">Desconectar</button>`
          : `<button class="btn-primary" data-act="google-conectar" ${state.googleSincronizando || !state.googleClientId ? 'disabled' : ''}>${state.googleSincronizando ? 'Conectando…' : 'Conectar con Google Calendar'}</button>`
        }
      </div>

      ${ultimaSync ? `
        <p style="font-size:11px;opacity:0.6;margin:12px 0 0;">
          Última sincronización: ${ultimaSync}${resumen ? ` — ${resumen.sincronizados} evento(s), ${resumen.borrados} eliminado(s)` : ''}
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
