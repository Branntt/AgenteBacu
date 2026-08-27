const NAV = [
  ['calendario', 'Calendario'],
  ['clientes', 'Clientes'],
  ['financiamiento', 'Finanzas'],
  ['finanzas_personales', 'Mi Finanzas'],
  ['inventario', 'Inventario'],
  ['bienestar', 'Bienestar'],
  ['metas', 'Metas'],
  ['universidad', 'Universidad'],
  ['panorama', 'Panorama'],
  ['pared', 'Pared']
];

export function renderHeader(state) {
  const navHtml = NAV.map(([v, label]) => `
    <button class="nav-btn ${state.view === v ? 'active' : ''}" data-act="nav-go" data-view="${v}">${label}</button>
  `).join('');

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
      <button class="btn-ghost" data-act="nav-go" data-view="configuraciones" title="Configuraciones" aria-label="Configuraciones">⚙️</button>
      <!-- El botón de anotar idea vive únicamente en la pestaña Clientes: es ahí donde se
           trabaja el contenido de cada cliente. En el resto de vistas (calendario, finanzas,
           etc.) no aparece, para mantener cada pestaña enfocada en lo suyo. -->
      ${state.view === 'clientes' ? `
        <button class="btn-primary" data-act="nueva-idea" title="Anotar una idea">💡 Idea</button>
      ` : ''}
    </header>
  `;
}
