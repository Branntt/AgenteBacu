import { escapeHtml } from '../lib/format.js';

// 4 accesos rápidos de creación (Contenido, dentro de Clientes › Tus marcas). El formato
// elegido acá es el mismo valor que usa el <select> de Formato en detalle.js — no es un
// concepto aparte, solo evita que para lo más común haya que buscarlo en una lista larga.
const CATEGORIAS = [
  ['Estrategia', '📐', 'Estrategia', 'El plan detrás de un grupo de piezas — cuánto contenido cuelga de ella se ve al abrirla.'],
  ['Fotografía', '📷', 'Fotos', 'Una sesión o entrega fotográfica.'],
  ['Carrusel', '🖼️', 'Carruseles', 'Varias tarjetas en un solo post.'],
  ['Post', '📝', 'Post', 'Una publicación suelta — lo de todos los días.']
];

export function renderNuevoContenido(state) {
  if (!state.nuevoContenidoAbierto) return '';

  const opciones = CATEGORIAS.map(([formato, emoji, label, desc]) => `
    <button class="nuevo-contenido-op" data-act="nuevo-contenido-crear" data-value="${formato}">
      <span class="nuevo-contenido-op-top"><span aria-hidden="true">${emoji}</span><span class="nuevo-contenido-op-label">${label}</span></span>
      <span class="nuevo-contenido-op-desc">${escapeHtml(desc)}</span>
    </button>
  `).join('');

  return `
    <div class="drawer-overlay">
      <div class="drawer-backdrop" data-act="nuevo-contenido-cerrar"></div>
      <div class="drawer nuevo-contenido" role="dialog" aria-modal="true" aria-label="Nuevo contenido">
        <div class="drawer-top">
          <span class="chip">Nuevo contenido</span>
          <button class="btn-close" data-act="nuevo-contenido-cerrar">✕</button>
        </div>
        <div class="nuevo-contenido-grid">${opciones}</div>
      </div>
    </div>
  `;
}
