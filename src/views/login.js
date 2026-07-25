export function renderLogin(state) {
  return `
    <div class="login-screen">
      <div class="login-box">
        <div class="brand" style="margin-bottom:28px;">
          <svg width="34" height="20" viewBox="0 0 40 24" class="brand-mark" aria-hidden="true"><path fill-rule="evenodd" fill="currentColor" d="M4.41,12 A18,18 0 0,1 35.59,12 A18,18 0 0,1 4.41,12 Z M25.5,12 A5.5,5.5 0 1,0 14.5,12 A5.5,5.5 0 1,0 25.5,12 Z"></path></svg>
          <div class="brand-title">S.A.O BACU</div>
        </div>
        ${state.authError ? `<div class="login-error">${state.authError}</div>` : ''}
        ${state.authInfo ? `<div class="login-info">${state.authInfo}</div>` : ''}
        <form data-form="login">
          <div class="field">
            <label class="field-label">Email</label>
            <input type="email" name="email" required autocomplete="username">
          </div>
          <div class="field">
            <label class="field-label">Contraseña</label>
            <input type="password" name="password" required autocomplete="current-password" minlength="6">
          </div>
          <button type="submit" class="btn-primary" style="width:100%;margin-top:8px;" ${state.authBusy ? 'disabled' : ''}>
            ${state.authBusy ? 'Un momento…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  `;
}
