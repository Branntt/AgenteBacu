import { TEMA_OPTIONS } from '../data/constants.js';
import { escapeHtml } from '../lib/format.js';

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
