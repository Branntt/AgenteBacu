import { escapeHtml } from '../lib/format.js';
import { hoyStr } from '../lib/idea.js';
import { calcularRedClientes, rangoDeCliente, BENEFICIOS } from '../lib/clienteStats.js';
import { renderCuentasDeCliente } from './cuentasDeCliente.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  return (v < 0 ? '-' : '') + '$' + Math.abs(v).toLocaleString('es-CO');
}

function fmtFecha(f) {
  if (!f) return '';
  const [a, m, d] = f.split('-');
  return `${d}/${m}/${a.slice(2)}`;
}

// Los seis lados del hexágono son los seis beneficios (ver BENEFICIOS en lib/clienteStats).
// [clave, corto, emoji, nombre, ayuda] — usamos nombre completo alrededor del hexágono.
const EJES = BENEFICIOS.map(([clave, corto, emoji, nombre, ayuda]) => [clave, corto, emoji, nombre, ayuda]);

// Hexágono INTERACTIVO: se arrastra cada punto (vértice) para cambiar el valor de ese beneficio.
// El punto vive sobre su eje — solo se mueve entre el centro (valor 1) y el borde (valor 99).
// data-attrs con la clave permite a main.js identificar qué campo se está editando al soltarlo.
function hexagonoHtml(attrs, color, clienteId) {
  const cx = 130, cy = 130, r = 92;
  const punto = (i, radio) => {
    const ang = (Math.PI / 3) * i - Math.PI / 2;
    return [cx + Math.cos(ang) * radio, cy + Math.sin(ang) * radio];
  };
  const anillo = f => EJES.map((_, i) => punto(i, r * f).map(n => n.toFixed(1)).join(',')).join(' ');
  const forma = EJES.map(([clave], i) => punto(i, r * (attrs[clave] / 99)).map(n => n.toFixed(1)).join(',')).join(' ');

  // Etiquetas alrededor: nombre completo del beneficio con emoji + número (más grande, legible).
  const etiquetas = EJES.map(([clave, corto, emoji, nombre], i) => {
    const [x, y] = punto(i, r + 26);
    return `
      <g class="hex-label" data-clave="${clave}">
        <text x="${x.toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="10" font-family="'IBM Plex Mono',monospace" fill="var(--muted)">${emoji} ${nombre}</text>
        <text x="${x.toFixed(1)}" y="${(y + 8).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="700" font-family="'IBM Plex Mono',monospace" fill="${color}" class="hex-label-num" data-num="${clave}">${attrs[clave]}</text>
      </g>
    `;
  }).join('');

  // Puntos arrastrables: cada uno vive sobre su eje, del centro al borde del hexágono.
  const puntos = EJES.map(([clave], i) => {
    const [px, py] = punto(i, r * (attrs[clave] / 99));
    return `<circle class="hex-drag" data-hex-drag="${clave}" data-eje="${i}" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="8" fill="${color}" stroke="#fff" stroke-width="2"/>`;
  }).join('');

  return `
    <svg viewBox="0 0 260 260" class="carta-hex carta-hex-interactivo" role="application"
         aria-label="Hexágono interactivo — arrastra los puntos para ajustar los beneficios"
         data-hex-cliente="${escapeHtml(clienteId)}" data-hex-cx="${cx}" data-hex-cy="${cy}" data-hex-r="${r}">
      ${[0.25, 0.5, 0.75, 1].map(f => `<polygon points="${anillo(f)}" fill="none" stroke="var(--line)" stroke-width="1"/>`).join('')}
      ${EJES.map((_, i) => { const [x, y] = punto(i, r); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width="1"/>`; }).join('')}
      <polygon class="carta-hex-forma" points="${forma}" fill="${color}" fill-opacity="0.35" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
      ${puntos}
      ${etiquetas}
    </svg>
  `;
}

// Un slider por beneficio, con el nombre completo bien visible. Se usa tanto en la mini
// carta (vista de la Red) como en la carta completa: los seis beneficios se deslizan
// directamente. Al soltar, main.js dispara actions.clienteBeneficio con el nuevo valor.
function slidersBeneficios(attrs, cliente, color) {
  return `
    <div class="carta-sliders-lista" style="--carta-color:${color};">
      ${BENEFICIOS.map(([clave, corto, emoji, nombre]) => `
        <div class="carta-slider-fila">
          <label for="ben-${escapeHtml(clave)}-${escapeHtml(cliente.id)}" class="carta-slider-nombre">
            <span class="carta-slider-emoji">${emoji}</span>
            <span>${escapeHtml(nombre)}</span>
          </label>
          <input id="ben-${escapeHtml(clave)}-${escapeHtml(cliente.id)}" type="range" min="1" max="99"
                 value="${attrs[clave]}" data-change="cliente-beneficio"
                 data-id="${escapeHtml(cliente.id)}" data-campo="${escapeHtml(clave)}"
                 aria-label="${escapeHtml(nombre)}">
          <span class="carta-slider-num" data-slider-num="${escapeHtml(clave)}-${escapeHtml(cliente.id)}">${attrs[clave]}</span>
        </div>
      `).join('')}
    </div>
  `;
}

export function renderMiniCarta(item, expandido = false) {
  const { cliente, attrs } = item;
  const rango = rangoDeCliente(attrs.global);
  // Mini carta minimalista: por defecto se ve solo el número global + emoji del rango
  // + nombre. Al tocar el chevron se expanden los seis sliders. Al tocar el nombre se
  // abre la carta completa como siempre.
  return `
    <div class="carta-mini carta-mini-min ${expandido ? 'carta-mini-abierta' : ''}"
         style="--carta-color:${rango.color};" data-cliente-id="${escapeHtml(cliente.id)}">
      <button class="carta-mini-header" data-act="carta-abrir" data-id="${escapeHtml(cliente.id)}"
              title="Abrir carta completa">
        <span class="carta-mini-glob">${attrs.global}</span>
        <span class="carta-mini-nombre">${escapeHtml(cliente.nombre || 'Sin nombre')}</span>
        ${item.porCobrar > 0 ? `<span class="carta-mini-deb" title="Te debe ${fmtMoney(item.porCobrar)}">●</span>` : ''}
      </button>
      <button class="carta-mini-toggle" data-act="carta-mini-toggle" data-id="${escapeHtml(cliente.id)}"
              title="${expandido ? 'Ocultar beneficios' : 'Ajustar beneficios'}">
        ${expandido ? '▲' : '▼'}
      </button>
      ${expandido ? `<div class="carta-mini-panel">${slidersBeneficios(attrs, cliente, rango.color)}</div>` : ''}
    </div>
  `;
}

// Plantilla de producción: los pasos que sigue cualquier trabajo, con lo técnico de cada uno.
// Es fija a propósito — sirve para no tener que acordarse de nada, que es justo lo que se
// olvida el día del rodaje. El paso donde está el cliente ahora se marca según su estado.
const PASOS = [
  ['idea', '💡', 'Idea y estrategia', ['Qué historia se cuenta y para quién', 'Qué formato: reel, carrusel, fotos, cubrimiento', 'Qué espera el cliente de esta pieza', 'Referencias o moodboard acordado']],
  ['preproduccion', '📐', 'Preproducción', ['Guion o escaleta escrita', 'Locación confirmada y con permiso', 'Lista de planos', 'Equipo separado: cámara, lentes, luces, audio', 'Baterías cargadas y tarjetas formateadas', 'Hora de citación acordada por escrito']],
  ['grabacion', '🎥', 'Día de rodaje', ['Audio limpio antes que imagen bonita', 'Grabar los planos de la lista primero', 'Recurso extra: detalles, manos, ambiente', 'Respaldar las tarjetas antes de salir del sitio']],
  ['edicion', '✂️', 'Edición', ['Primer corte al hueso', 'Gancho en los primeros 2 segundos', 'Color y audio parejos', 'Revisar en el celular, sin sonido']],
  ['entrega', '📤', 'Entrega y aprobación', ['Enviar para visto bueno', 'Anotar los cambios pedidos', 'Entregar archivos finales en su formato']],
  ['publicacion', '📅', 'Publicación', ['Fecha de publicación acordada', 'Portada elegida', 'Copy con el gancho', 'Colaboración activada si aplica']],
  ['cobro', '💰', 'Cobro', ['Cuenta de cobro enviada', 'Pago recibido y marcado', 'Guardar la pieza como caso de estudio']]
];

// A qué paso corresponde cada estado del cliente, para saber dónde está parado.
const ESTADO_A_PASO = {
  prospecto: 0, conversacion: 0, grabacion: 2, proyecto_edicion: 3,
  confirmar_entrega: 4, por_pagar: 6, ya_pagos: 6, entregado: 6, activo: 1
};

function planHtml(cliente) {
  const actual = ESTADO_A_PASO[cliente.estado] ?? 0;
  return PASOS.map(([clave, emoji, titulo, items], i) => {
    const estado = i < actual ? 'hecho' : (i === actual ? 'ahora' : 'falta');
    return `
      <div class="carta-paso carta-paso-${estado}">
        <div class="carta-paso-head">
          <span class="carta-paso-punto">${i < actual ? '✓' : emoji}</span>
          <span class="carta-paso-titulo">${escapeHtml(titulo)}</span>
          ${i === actual ? '<span class="carta-paso-aqui">acá vas</span>' : ''}
        </div>
        <ul class="carta-paso-lista">${items.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
      </div>
    `;
  }).join('');
}

export function renderCartaCompleta(item, state) {
  const { cliente, attrs } = item;
  const rango = rangoDeCliente(attrs.global);
  const hoy = hoyStr();

  const pendientes = [];
  item.ideas.filter(i => i.estado !== 'ya_pago' && i.estado !== 'descartada').forEach(i =>
    pendientes.push({ icono: '💡', texto: i.titulo || 'Idea sin título', detalle: 'idea anotada' }));
  item.facturas.filter(f => !f.pagada).forEach(f =>
    pendientes.push({ icono: '💸', texto: fmtMoney(f.total), detalle: 'sin cobrar · ' + fmtFecha(f.fecha) }));
  if (cliente.fecha_grabacion && cliente.fecha_grabacion >= hoy) {
    pendientes.push({ icono: '🎥', texto: 'Grabación agendada', detalle: fmtFecha(cliente.fecha_grabacion) });
  }

  const historial = item.facturas.slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  return `
    <div class="carta-full" style="--carta-color:${rango.color};">
      <button class="btn-ghost carta-volver" data-act="carta-cerrar">← Volver a la red</button>

      <div class="carta-header">
        <div class="carta-ovr">
          <div class="carta-ovr-num">${attrs.global}</div>
          <div class="carta-ovr-label">${rango.emoji} ${escapeHtml(rango.nombre)}</div>
        </div>
        <div class="carta-identidad">
          <div class="carta-nombre">${escapeHtml(cliente.nombre || 'Sin nombre')}</div>
          ${cliente.documento ? `<div class="carta-doc">${escapeHtml(cliente.documento)}</div>` : ''}
          <div class="carta-resumen">
            <span>${fmtMoney(item.cobrado)} cobrado</span>
            <span>${item.trabajos} trabajo${item.trabajos === 1 ? '' : 's'}</span>
            ${item.porCobrar > 0 ? `<span class="carta-debe">${fmtMoney(item.porCobrar)} sin cobrar</span>` : ''}
          </div>
        </div>
      </div>

      <!-- Un solo cuadro: hexágono como visualización + los seis sliders con nombre completo.
           El hexágono se dibuja arriba (sin ser arrastrable acá para no chocar con los sliders);
           debajo, los seis beneficios se deslizan y el hex se actualiza en vivo. -->
      <div class="carta-stats carta-stats-uno">
        <div class="carta-stats-titulo">🎚️ En qué te beneficia</div>
        <div class="vista-sub" style="margin-bottom:6px;">Estas seis son tu criterio, no un cálculo. El global es su promedio.</div>
        ${hexagonoHtml(attrs, rango.color, cliente.id)}
        ${slidersBeneficios(attrs, cliente, rango.color)}
      </div>

      <!-- La carta es para mirar; para tocar los datos del cliente y cobrarle está su ficha,
           que es la misma de siempre. Sin estos dos botones la Red quedaba como un tercer
           lugar sin salida: había que volver a "Por estado" y buscar al cliente de nuevo. -->
      <div class="carta-acciones">
        <button class="btn-ghost" data-act="cliente-abrir" data-id="${escapeHtml(cliente.id)}">✏️ Editar datos</button>
      </div>

      ${renderCuentasDeCliente(state, cliente)}

      <div class="section-title">📌 Lo que tenés pendiente con ${escapeHtml(cliente.nombre || 'este cliente')}</div>
      ${pendientes.length ? `
        <div class="carta-pendientes">
          ${pendientes.map(p => `
            <div class="carta-pendiente">
              <span class="carta-pendiente-icono">${p.icono}</span>
              <span class="carta-pendiente-texto">${escapeHtml(p.texto)}</span>
              <span class="carta-pendiente-detalle">${escapeHtml(p.detalle)}</span>
            </div>
          `).join('')}
        </div>
      ` : '<div class="empty-note">Nada pendiente con él ahora mismo.</div>'}

      <div class="section-title">🗺️ Cómo se hace un trabajo, paso a paso</div>
      <div class="vista-sub">La misma ruta para todos: lo técnico ya está escrito para no tener que acordarse el día del rodaje.</div>
      <div class="carta-plan">${planHtml(cliente)}</div>

      <div class="section-title">🧾 Trabajos hechos y cómo los cobraste</div>
      ${historial.length ? `
        <div class="carta-historial">
          ${historial.map(f => `
            <div class="carta-hist-fila">
              <span class="carta-hist-fecha">${fmtFecha(f.fecha)}</span>
              <span class="carta-hist-concepto">${escapeHtml((f.items && f.items[0] && f.items[0].descripcion) || 'Trabajo')}</span>
              <span class="carta-hist-monto ${f.pagada ? 'pagada' : 'debe'}">${fmtMoney(f.total)}${f.pagada ? '' : ' · sin cobrar'}</span>
            </div>
          `).join('')}
        </div>
      ` : '<div class="empty-note">Todavía no le has facturado nada.</div>'}
    </div>
  `;
}

// Agrupa la red por tier (Leyenda/Oro/Plata/Bronce/Nuevo). Es la lectura rápida:
// "quiénes son los que funcionan y quiénes no". Un tier con cero clientes no se muestra.
const TIERS = [
  { clave: 'leyenda', nombre: 'Leyenda', emoji: '👑', min: 85 },
  { clave: 'oro',     nombre: 'Oro',     emoji: '🥇', min: 70 },
  { clave: 'plata',   nombre: 'Plata',   emoji: '🥈', min: 50 },
  { clave: 'bronce',  nombre: 'Bronce',  emoji: '🥉', min: 30 },
  { clave: 'nuevo',   nombre: 'Nuevo',   emoji: '🌱', min: 0  }
];

function tierDeGlobal(g) {
  for (const t of TIERS) if (g >= t.min) return t.clave;
  return 'nuevo';
}

export function renderRedClientes(state) {
  const red = calcularRedClientes(state.clientes, state.cuentasCobro, state.ideas);
  if (!red.length) {
    return '<main class="clientes"><div class="empty-note">Todavía no hay clientes guardados. Cada rodaje que cobres crea uno.</div></main>';
  }

  const abierta = state.cartaClienteId && red.find(r => r.cliente.id === state.cartaClienteId);
  if (abierta) return `<main class="clientes">${renderCartaCompleta(abierta, state)}</main>`;

  const totalCobrado = red.reduce((s, r) => s + r.cobrado, 0);
  const totalPorCobrar = red.reduce((s, r) => s + r.porCobrar, 0);
  const filtroTier = state.redFiltroTier || 'todos'; // 'todos' o clave de tier
  const abiertos = state.redAbiertos || {}; // { [clienteId]: true }

  // Filtrado por tier. 'todos' agrupa por tier (mejores arriba); un tier específico solo muestra ese.
  const filtrada = filtroTier === 'todos' ? red : red.filter(r => tierDeGlobal(r.attrs.global) === filtroTier);

  // Chips de filtro con el conteo real de cada tier.
  const conteos = { todos: red.length };
  for (const t of TIERS) conteos[t.clave] = red.filter(r => tierDeGlobal(r.attrs.global) === t.clave).length;

  const chips = `
    <div class="red-chips" role="tablist" aria-label="Filtrar por rango">
      <button class="red-chip ${filtroTier === 'todos' ? 'red-chip-on' : ''}" data-act="red-filtro-tier" data-tier="todos">
        Todos <span class="red-chip-num">${conteos.todos}</span>
      </button>
      ${TIERS.filter(t => conteos[t.clave] > 0).map(t => `
        <button class="red-chip ${filtroTier === t.clave ? 'red-chip-on' : ''}" data-act="red-filtro-tier" data-tier="${t.clave}">
          ${t.emoji} ${t.nombre} <span class="red-chip-num">${conteos[t.clave]}</span>
        </button>
      `).join('')}
    </div>
  `;

  // Cuando el filtro es 'todos', agrupamos por tier con un separador. Con un tier específico,
  // es una sola lista sin separadores para no saturar.
  let cuerpo;
  if (filtroTier === 'todos') {
    cuerpo = TIERS.map(t => {
      const items = filtrada.filter(r => tierDeGlobal(r.attrs.global) === t.clave);
      if (!items.length) return '';
      return `
        <div class="red-grupo">
          <div class="red-grupo-titulo">${t.emoji} ${t.nombre}<span class="red-grupo-num">${items.length}</span></div>
          <div class="carta-grid">${items.map(it => renderMiniCarta(it, !!abiertos[it.cliente.id])).join('')}</div>
        </div>
      `;
    }).join('');
  } else {
    cuerpo = `<div class="carta-grid">${filtrada.map(it => renderMiniCarta(it, !!abiertos[it.cliente.id])).join('')}</div>`;
  }

  return `
    <main class="clientes">
      <div class="vista-sub" style="margin-bottom:10px;">
        ${red.length} cliente${red.length === 1 ? '' : 's'} · ${fmtMoney(totalCobrado)} cobrado${totalPorCobrar > 0 ? ` · <b style="color:var(--rojo);">${fmtMoney(totalPorCobrar)} sin cobrar</b>` : ''}
      </div>
      ${chips}
      ${cuerpo}
    </main>
  `;
}
