import { escapeHtml } from '../lib/format.js';

// Id único que comparten todas las casillas donde se escribe un cliente. La lista se pinta
// una sola vez, en el render principal, y no dentro de cada componente: si un mismo id de
// datalist aparece dos veces en el documento, los navegadores solo respetan el primero.
export const LISTA_CLIENTES_ID = 'lista-clientes';

// `list` engancha la casilla con la lista; autocomplete="off" evita que el navegador tape
// las sugerencias propias con las suyas (las que guardó de formularios anteriores).
export const ATTRS_AUTOCOMPLETAR = `list="${LISTA_CLIENTES_ID}" autocomplete="off"`;

// Busca un cliente por nombre exacto, sin importar mayúsculas ni espacios sobrantes: es lo
// que queda en la casilla cuando se elige una sugerencia.
export function clientePorNombre(clientes, nombre) {
  const buscado = (nombre || '').trim().toLowerCase();
  if (!buscado) return null;
  return (clientes || []).find(c => (c.nombre || '').trim().toLowerCase() === buscado) || null;
}

// Segunda lista, para la pregunta "¿para quién es?" de una idea nueva: además de los
// clientes, ofrece las tres marcas propias — una idea puede ser para un cliente o para
// Brant/Bacu/Novena, y en el momento de anotarla no hay por qué elegir entre dos casillas.
export const LISTA_PARA_QUIEN_ID = 'lista-para-quien';

export function renderDatalistParaQuien(state) {
  const marcas = [['Brant', 'tu marca personal'], ['Bacu Creative', 'el estudio'], ['Novena Crew', 'la productora']];
  const nombresMarca = new Set(marcas.map(([n]) => n.toLowerCase()));
  const clientes = (state.clientes || [])
    .map(c => (c.nombre || '').trim())
    .filter(n => n && !nombresMarca.has(n.toLowerCase()));
  const vistos = new Set();
  const unicos = clientes.filter(n => { const k = n.toLowerCase(); if (vistos.has(k)) return false; vistos.add(k); return true; })
    .sort((a, b) => a.localeCompare(b, 'es'));
  return `
    <datalist id="${LISTA_PARA_QUIEN_ID}">
      ${marcas.map(([n, d]) => `<option value="${escapeHtml(n)}">${escapeHtml(d)}</option>`).join('')}
      ${unicos.map(n => `<option value="${escapeHtml(n)}">cliente</option>`).join('')}
    </datalist>
  `;
}

export function renderDatalistClientes(state) {
  const clientes = state.clientes || [];
  if (!clientes.length) return '';

  // Sin repetidos y en orden alfabético: la misma empresa puede tener varias fichas.
  const vistos = new Set();
  const opciones = clientes
    .map(c => ({ nombre: (c.nombre || '').trim(), documento: (c.documento || '').trim() }))
    .filter(c => {
      const clave = c.nombre.toLowerCase();
      if (!c.nombre || vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  return `
    <datalist id="${LISTA_CLIENTES_ID}">
      ${opciones.map(c => `<option value="${escapeHtml(c.nombre)}">${c.documento ? escapeHtml(c.documento) : ''}</option>`).join('')}
    </datalist>
  `;
}
