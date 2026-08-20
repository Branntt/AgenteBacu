import { escapeHtml } from '../lib/format.js';
import { hoyStr } from '../lib/idea.js';
import { calcularRedClientes, rangoDeCliente, BENEFICIOS } from '../lib/clienteStats.js';

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
const EJES = BENEFICIOS.map(([clave, corto, , , ayuda]) => [clave, corto, ayuda]);

// Hexágono de atributos, dibujado a mano en SVG: sin librerías, y así se anima con CSS.
function hexagonoHtml(attrs, color) {
  const cx = 110, cy = 100, r = 74;
  const punto = (i, radio) => {
    const ang = (Math.PI / 3) * i - Math.PI / 2;
    return [cx + Math.cos(ang) * radio, cy + Math.sin(ang) * radio];
  };
  const anillo = f => EJES.map((_, i) => punto(i, r * f).map(n => n.toFixed(1)).join(',')).join(' ');
  const forma = EJES.map(([clave], i) => punto(i, r * (attrs[clave] / 99)).map(n => n.toFixed(1)).join(',')).join(' ');

  return `
    <svg viewBox="0 0 220 200" class="carta-hex" role="img" aria-label="Atributos del cliente">
      ${[0.25, 0.5, 0.75, 1].map(f => `<polygon points="${anillo(f)}" fill="none" stroke="var(--line)" stroke-width="1"/>`).join('')}
      ${EJES.map((_, i) => { const [x, y] = punto(i, r); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width="1"/>`; }).join('')}
      <polygon class="carta-hex-forma" points="${forma}" fill="${color}" fill-opacity="0.35" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
      ${EJES.map(([clave, corto], i) => {
        const [x, y] = punto(i, r + 17);
        return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="10" font-family="'IBM Plex Mono',monospace" fill="var(--muted)">${corto}</text>`;
      }).join('')}
    </svg>
  `;
}

export function renderMiniCarta(item) {
  const { cliente, attrs } = item;
  const rango = rangoDeCliente(attrs.global);
  return `
    <button class="carta-mini" data-act="carta-abrir" data-id="${escapeHtml(cliente.id)}" style="--carta-color:${rango.color};">
      <div class="carta-mini-ovr">
        <span class="carta-mini-num">${attrs.global}</span>
        <span class="carta-mini-rango">${rango.emoji}</span>
      </div>
      <div class="carta-mini-cuerpo">
        <div class="carta-mini-nombre">${escapeHtml(cliente.nombre || 'Sin nombre')}</div>
        <div class="carta-mini-meta">${item.trabajos} trabajo${item.trabajos === 1 ? '' : 's'} · ${fmtMoney(item.cobrado)}</div>
      </div>
      ${item.porCobrar > 0 ? `<span class="carta-mini-alerta" title="Te debe">${fmtMoney(item.porCobrar)}</span>` : ''}
    </button>
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

      <div class="carta-stats">
        ${hexagonoHtml(attrs, rango.color)}
        <div class="carta-barras">
          ${EJES.map(([clave, corto]) => `
            <div class="carta-barra">
              <span class="carta-barra-label">${corto}</span>
              <span class="carta-barra-track"><span class="carta-barra-fill" style="width:${attrs[clave]}%;"></span></span>
              <span class="carta-barra-num">${attrs[clave]}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- La carta es para mirar; para tocar los datos del cliente y cobrarle está su ficha,
           que es la misma de siempre. Sin estos dos botones la Red quedaba como un tercer
           lugar sin salida: había que volver a "Por estado" y buscar al cliente de nuevo. -->
      <div class="carta-acciones">
        <button class="btn-ghost" data-act="cliente-abrir" data-id="${escapeHtml(cliente.id)}">✏️ Editar datos</button>
        <button class="btn-primary" data-act="cc-abrir" data-id="${escapeHtml(cliente.id)}">🧾 Cuenta de cobro</button>
      </div>

      <div class="section-title">🎚️ En qué te beneficia</div>
      <div class="vista-sub">Estas seis son tu criterio, no un cálculo: un cliente que paga poco pero te abre puertas no vale lo mismo que uno que paga bien y te desgasta. El global es su promedio.</div>
      <div class="carta-sliders">
        ${BENEFICIOS.map(([clave, corto, emoji, nombre, ayuda]) => `
          <div class="carta-slider">
            <div class="carta-slider-top">
              <label for="ben-${escapeHtml(clave)}-${escapeHtml(cliente.id)}">${emoji} ${escapeHtml(nombre)}</label>
              <span class="carta-slider-num">${attrs[clave]}</span>
            </div>
            <input id="ben-${escapeHtml(clave)}-${escapeHtml(cliente.id)}" type="range" min="1" max="99"
                   value="${attrs[clave]}" data-change="cliente-beneficio"
                   data-id="${escapeHtml(cliente.id)}" data-campo="${escapeHtml(clave)}">
            <div class="carta-slider-ayuda">${escapeHtml(ayuda)}</div>
          </div>
        `).join('')}
      </div>

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

export function renderRedClientes(state) {
  const red = calcularRedClientes(state.clientes, state.cuentasCobro, state.ideas);
  if (!red.length) {
    return '<main class="clientes"><div class="empty-note">Todavía no hay clientes guardados. Cada rodaje que cobres crea uno.</div></main>';
  }

  const abierta = state.cartaClienteId && red.find(r => r.cliente.id === state.cartaClienteId);
  // <main> igual que las otras sub-vistas de Clientes: es el envoltorio que espera el resto
  // de la app (estilos y ancho de página cuelgan de él).
  if (abierta) return `<main class="clientes">${renderCartaCompleta(abierta, state)}</main>`;

  const totalCobrado = red.reduce((s, r) => s + r.cobrado, 0);
  const totalPorCobrar = red.reduce((s, r) => s + r.porCobrar, 0);

  return `
    <main class="clientes">
    <div class="vista-sub" style="margin-bottom:14px;">
      ${red.length} cliente${red.length === 1 ? '' : 's'} · ${fmtMoney(totalCobrado)} cobrado${totalPorCobrar > 0 ? ` · <b style="color:var(--rojo);">${fmtMoney(totalPorCobrar)} sin cobrar</b>` : ''}
    </div>
    <div class="carta-grid">${red.map(renderMiniCarta).join('')}</div>
    </main>
  `;
}
