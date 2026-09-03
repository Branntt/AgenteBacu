import { loadValue } from '../lib/storage.js';
import { escapeHtml } from '../lib/format.js';

function brandHtml() {
  return `
    <div class="brand" style="margin-bottom:28px;">
      <svg width="34" height="20" viewBox="0 0 40 24" class="brand-mark" aria-hidden="true"><path fill-rule="evenodd" fill="currentColor" d="M4.41,12 A18,18 0 0,1 35.59,12 A18,18 0 0,1 4.41,12 Z M25.5,12 A5.5,5.5 0 1,0 14.5,12 A5.5,5.5 0 1,0 25.5,12 Z"></path></svg>
      <div class="brand-title">S.A.O BACU</div>
    </div>
  `;
}

function avisosHtml(state) {
  return `
    ${state.authError ? `<div class="login-error">${state.authError}</div>` : ''}
    ${state.authInfo ? `<div class="login-info">${state.authInfo}</div>` : ''}
  `;
}

// Pantalla de "olvidé mi contraseña" — pide el email y dispara resetPasswordForEmail.
// No hay forma de recuperar/ver la contraseña actual (Supabase no lo permite ni debería),
// así que esto es la única salida de un login trabado sin tener que pedirle a alguien
// que entre al dashboard de Supabase a mano.
function renderRecuperar(state) {
  const ultimoEmail = loadValue('sistemaEditorial.ultimoEmail', '');
  return `
    <div class="login-screen">
      <div class="login-box">
        ${brandHtml()}
        <div class="vista-sub" style="margin-bottom:16px;">Escribí tu email y te mandamos un link para poner una contraseña nueva.</div>
        ${avisosHtml(state)}
        <form data-form="recuperar">
          <div class="field">
            <label class="field-label">Email</label>
            <input type="email" name="email" required autocomplete="username" value="${escapeHtml(ultimoEmail)}">
          </div>
          <button type="submit" class="btn-primary" style="width:100%;margin-top:8px;" ${state.authBusy ? 'disabled' : ''}>
            ${state.authBusy ? 'Enviando…' : 'Enviar link de recuperación'}
          </button>
        </form>
        <button type="button" class="btn-text-muted" data-act="auth-ir-login" style="width:100%;margin-top:14px;">Volver a iniciar sesión</button>
      </div>
    </div>
  `;
}

export function renderLogin(state) {
  if (state.authModo === 'recuperar') return renderRecuperar(state);

  const ultimoEmail = loadValue('sistemaEditorial.ultimoEmail', '');
  return `
    <div class="login-screen">
      <div class="login-box">
        ${brandHtml()}
        ${avisosHtml(state)}
        <form data-form="login">
          <div class="field">
            <label class="field-label">Email</label>
            <input type="email" name="email" required autocomplete="username" value="${escapeHtml(ultimoEmail)}">
          </div>
          <div class="field">
            <label class="field-label">Contraseña</label>
            <input type="password" name="password" required autocomplete="current-password" minlength="6">
          </div>
          <button type="submit" class="btn-primary" style="width:100%;margin-top:8px;" ${state.authBusy ? 'disabled' : ''}>
            ${state.authBusy ? 'Un momento…' : 'Iniciar sesión'}
          </button>
        </form>
        <button type="button" class="btn-text-muted" data-act="auth-ir-recuperar" style="width:100%;margin-top:14px;">¿Olvidaste tu contraseña?</button>
      </div>
    </div>
  `;
}

// Pantalla post-click del link del correo de recuperación — Supabase ya deja una sesión
// temporal activa (por eso initAuth() detecta el modo por el hash #type=recovery, no por
// esto), acá solo se pide la contraseña nueva y se guarda con auth.updateUser().
export function renderNuevaPassword(state) {
  return `
    <div class="login-screen">
      <div class="login-box">
        ${brandHtml()}
        <div class="vista-sub" style="margin-bottom:16px;">Escribí tu nueva contraseña.</div>
        ${avisosHtml(state)}
        <form data-form="nueva-password">
          <div class="field">
            <label class="field-label">Nueva contraseña</label>
            <input type="password" name="password" required autocomplete="new-password" minlength="6">
          </div>
          <button type="submit" class="btn-primary" style="width:100%;margin-top:8px;" ${state.authBusy ? 'disabled' : ''}>
            ${state.authBusy ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  `;
}
