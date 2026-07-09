import { TEMA_OPTIONS } from '../data/constants.js';
import { escapeHtml } from '../lib/format.js';

const NAV = [['panorama', 'Panorama'], ['banco', 'Banco'], ['desarrollo', 'Desarrollo'], ['calendario', 'Calendario'], ['clientes', 'Clientes'], ['seguimiento', 'Seguimiento']];

export function renderHeader(state) {
  const navHtml = NAV.map(([v, label]) => `
    <button class="nav-btn ${state.view === v ? 'active' : ''}" data-act="nav-go" data-view="${v}">
      <span>${label}</span>
    </button>
  `).join('');

  const temaOptions = TEMA_OPTIONS.map(t => `<option value="${escapeHtml(t)}" ${state.tema === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('');

  return `
    <header class="app-header">
      <div class="brand">
        <svg width="34" height="20" viewBox="0 0 40 24" class="brand-mark"><ellipse cx="20" cy="12" rx="18" ry="10" fill="none" stroke="currentColor" stroke-width="1.6"></ellipse><circle cx="20" cy="12" r="5" fill="currentColor"></circle></svg>
        <div class="brand-title">Sistema Editorial</div>
      </div>
      <nav class="nav">${navHtml}</nav>
      <div class="settings">
        <select id="tema-select" data-change="tema">${temaOptions}</select>
        <label><input type="checkbox" id="calma-checkbox" data-change="calma" ${state.modoCalma ? 'checked' : ''}> Modo calma</label>
      </div>
      <button class="btn-primary" data-act="nueva-idea">+ Nueva idea</button>
    </header>
  `;
}
