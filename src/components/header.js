import { TEMA_OPTIONS } from '../data/constants.js';
import { escapeHtml } from '../lib/format.js';

const NAV = [
  ['calendario', 'Calendario'],
  ['clientes', 'Clientes'],
  ['guiones', 'Estrategia'],
  ['financiamiento', 'Finanzas'],
  ['inventario', 'Inventario'],
  ['bienestar', 'Bienestar'],
  ['metas', 'Metas'],
  ['universidad', 'Universidad'],
  ['panorama', 'Panorama']
];

export function renderHeader(state) {
  const navHtml = NAV.map(([v, label]) => `
    <button class="nav-btn ${state.view === v ? 'active' : ''}" data-act="nav-go" data-view="${v}">${label}</button>
  `).join('');

  const temaOptions = TEMA_OPTIONS.map(t => `<option value="${escapeHtml(t)}" ${state.tema === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('');

  return `
    <header class="app-header">
      <button class="hamburguesa ${state.menuAbierto ? 'activo' : ''}" data-act="menu-toggle" aria-label="${state.menuAbierto ? 'Cerrar menú' : 'Abrir menú'}" aria-expanded="${state.menuAbierto}">
        <span></span><span></span><span></span>
      </button>
      <div class="brand">
        <svg width="34" height="20" viewBox="0 0 40 24" class="brand-mark" aria-hidden="true"><path fill-rule="evenodd" fill="currentColor" d="M4.41,12 A18,18 0 0,1 35.59,12 A18,18 0 0,1 4.41,12 Z M25.5,12 A5.5,5.5 0 1,0 14.5,12 A5.5,5.5 0 1,0 25.5,12 Z"></path></svg>
        <div class="brand-title">S.A.O BACU</div>
      </div>
      <nav class="nav ${state.menuAbierto ? 'nav-abierto' : ''}">${navHtml}</nav>
      ${state.menuAbierto ? '<div class="nav-backdrop" data-act="menu-cerrar"></div>' : ''}
      <div class="settings">
        <select id="tema-select" data-change="tema">${temaOptions}</select>
        <label><input type="checkbox" id="calma-checkbox" data-change="calma" ${state.modoCalma ? 'checked' : ''}> Modo calma</label>
        ${state.session ? `<button class="btn-text-muted" data-act="logout" title="${escapeHtml(state.session.user.email)}">Salir</button>` : ''}
      </div>
      <button class="btn-ghost" data-act="rodaje-rapido-abrir">+ Rodaje rápido</button>
      <button class="btn-primary" data-act="nueva-idea">+ Nueva idea</button>
    </header>
  `;
}
