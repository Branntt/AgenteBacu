import { escapeHtml } from '../lib/format.js';
import { calcularFinanciamiento, cuentasCobroPendientes, esVencida } from '../lib/financiamiento.js';
import { renderTablaFinanzas } from '../components/tablaFinanzas.js';
import { hoyStr } from '../lib/idea.js';

function fmtMoney(n) {
  const v = Number(n) || 0;
  const sign = v < 0 ? '-' : '';
  return sign + '$' + Math.abs(v).toLocaleString('es-CO');
}

function fmtFecha(fecha) {
  if (!fecha) return '';
  const [año, mes, día] = fecha.split('-');
  return `${día}/${mes}`;
}

// Paleta única de Finanzas: verde = entra plata, rojo = sale plata/deudas, azul = informativo.
// min-width:0 es necesario porque este helper se usa como hijo de grids de 3
// columnas iguales (1fr 1fr 1fr) — sin esto, un monto largo (ej. $12.345.678)
// fuerza su columna a crecer más de lo que el grid le asignó y el recuadro
// termina saliéndose del contenedor en pantallas angostas.
function card(accent, contenido, extra = '') {
  return `<div style="background:var(--panel2);border:1px solid var(--line);border-left:3px solid ${accent};border-radius:8px;padding:16px;min-width:0;${extra}">${contenido}</div>`;
}

// Fecha límite: input más grande y con borde propio (el anterior, sin borde y
// diminuto, era fácil de tocar mal en celular y confundía "esto es editable").
const FECHA_LIMITE_STYLE = "background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:6px 8px;color:inherit;font-family:'IBM Plex Mono',monospace;font-size:12px;color-scheme:dark;min-height:32px;";

function botonEliminar(act, id) {
  return `<button data-act="${act}" data-id="${escapeHtml(id)}" title="Quitar" style="font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid var(--line);background:var(--panel);cursor:pointer;color:var(--muted);white-space:nowrap;">✕</button>`;
}

// A qué cuenta llega el pago de una factura — se elige ANTES de marcarla pagada. Antes
// toggleCuentaCobroPagada siempre registraba el ingreso como 'bancolombia' sin importar
// dónde llegara de verdad, y el desglose por cuenta en Financiamiento quedaba mal.
const FUENTES_PAGO = [['bancolombia', 'Bancolombia'], ['nequi', 'Nequi'], ['efectivo', 'Efectivo']];
function selectFuentePago(cc) {
  const id = escapeHtml(cc.id);
  const actual = cc.fuente_pago || 'bancolombia';
  return `<select data-change="cc-fuente-pago" data-id="${id}" title="¿A qué cuenta llega el pago?" style="${FECHA_LIMITE_STYLE}">
    ${FUENTES_PAGO.map(([v, label]) => `<option value="${v}" ${actual === v ? 'selected' : ''}>${label}</option>`).join('')}
  </select>`;
}

// Fila de una cuenta de cobro pendiente, con su propia fecha límite editable
// (antes solo se podía fijar al crearla — nunca después) y un botón para
// deshacerla si se creó por error (ej. desde Rodaje rápido).
function filaFacturaHtml(cc) {
  const id = escapeHtml(cc.id);
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;border-bottom:1px solid var(--line);gap:10px;flex-wrap:wrap;">
      <span>${escapeHtml(cc.cliente_nombre || 'Sin nombre')} <span style="opacity:0.5;font-size:11px;">· cuenta ${escapeHtml(cc.numero)} · ${fmtFecha(cc.fecha)}</span></span>
      <span style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0;">
        <input type="date" data-change="cc-fecha-vencimiento" data-id="${id}" value="${escapeHtml(cc.fecha_vencimiento || '')}" min="2026-01-01" title="Fecha límite de pago" style="${FECHA_LIMITE_STYLE}">
        <span style="font-weight:bold;color:var(--azul);">${fmtMoney(cc.total)}</span>
        ${selectFuentePago(cc)}
        ${botonMarcarPagada('cc-toggle-pagada', cc.id)}
        ${botonEliminar('cc-eliminar', cc.id)}
      </span>
    </div>
  `;
}

function botonMarcarPagada(act, id) {
  return `<button data-act="${act}" data-id="${escapeHtml(id)}" style="font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid var(--line);background:var(--panel);cursor:pointer;color:var(--verde);white-space:nowrap;">Marcar pagada</button>`;
}

// Tarjeta editable de deuda personal — persona, monto y fecha límite (esta
// última alimenta el peso de estrés en Bienestar: entre más atrasada, más pesa).
// El monto se muestra formateado ($ y separador de miles); parseN ya limpia
// cualquier símbolo al guardar, así que escribir encima sigue funcionando.
function deudaCardHtml(d) {
  const id = escapeHtml(d.id);
  return `
    <div class="deuda-card ${d.pagada ? 'pagada' : ''}">
      <input class="deuda-persona" data-change="deuda-persona" data-id="${id}" value="${escapeHtml(d.persona || '')}" placeholder="¿Con quién es esta deuda?">
      <div class="deuda-footer" style="flex-wrap:wrap;">
        <input class="deuda-monto-label" data-change="deuda-monto" data-id="${id}" value="${d.monto ? fmtMoney(d.monto) : ''}" placeholder="Monto" inputmode="numeric" style="background:none;border:none;width:110px;color:inherit;">
        <input type="date" data-change="deuda-fecha-limite" data-id="${id}" value="${escapeHtml(d.fecha_limite || '')}" min="2026-01-01" title="Fecha límite" style="${FECHA_LIMITE_STYLE}">
        ${botonMarcarPagada('deuda-toggle', d.id)}
        ${botonEliminar('deuda-eliminar', d.id)}
      </div>
    </div>
  `;
}

// Tarjeta editable de un pago mensual/suscripción real (tabla pagos_mensuales) — antes
// esta sección leía un array de suscripciones hardcodeado en store.js, sin forma de
// agregar/editar/eliminar nada; esa tabla y sus acciones (pagoMensualNuevo/updPagoMensual/
// eliminarPagoMensual) y hasta el CSS (.pago-card/.pago-footer) ya existían, solo faltaba
// esta tarjeta para conectarlos.
function pagoCardHtml(p) {
  const id = escapeHtml(p.id);
  return `
    <div class="pago-card">
      <input class="pago-nombre" data-change="pago-mensual-nombre" data-id="${id}" value="${escapeHtml(p.nombre || '')}" placeholder="Nombre del pago o suscripción">
      <div class="pago-footer" style="flex-wrap:wrap;">
        <input class="pago-monto-label" data-change="pago-mensual-monto" data-id="${id}" value="${p.monto ? fmtMoney(p.monto) : ''}" placeholder="Monto" inputmode="numeric" style="background:none;border:none;width:110px;color:inherit;">
        <input type="number" data-change="pago-mensual-dia" data-id="${id}" value="${p.dia_pago || ''}" min="1" max="31" placeholder="Día" title="Día del mes en que se cobra" style="${FECHA_LIMITE_STYLE}width:64px;">
        ${botonEliminar('pago-mensual-eliminar', p.id)}
      </div>
    </div>
  `;
}

export function renderFinanciamiento(state) {
  const movimientos = state.movimientosFinanciamiento || [];
  const deudas = state.deudas || [];
  const cuentasCobro = state.cuentasCobro || [];
  const pagosMensuales = state.pagosMensuales || [];
  const hoy = hoyStr();

  // Cálculos financieros — misma función que usa Panorama, para que ambas pantallas concuerden.
  // teDeben/patrimonio YA excluyen lo vencido (ver esVencida en lib/financiamiento.js) — una
  // factura o deuda a tu favor que se pasó de fecha deja de sumarse sola al número de confianza
  // hasta que decidas qué pasó con ella (renegociar la fecha o eliminarla).
  const { efectivo, porFuente, debes, teDeben, teDebenVencido, futuroPago, patrimonio } = calcularFinanciamiento(movimientos, deudas, cuentasCobro, hoy);

  // Quién te debe: cuentas de cobro sin pagar (por cliente) + deudas personales a tu favor.
  // El estado de pago vive en cada factura, no en el cliente — ver calcularFinanciamiento.
  const facturasPendientes = cuentasCobroPendientes(cuentasCobro);
  const meDebenHtml = deudas.filter(d => d.direccion === 'me_deben' && !d.pagada);

  // Ya deberían pagar (fecha límite vencida) vs. aún no vence — no es la misma urgencia. Aplica
  // por igual a facturas de clientes y a deudas personales a favor (ej. Sol vs. Sebastián: una
  // lleva rato vencida, la otra tiene fecha futura acordada). Esta separación visual es también
  // la separación que usa el cálculo del patrimonio — misma función esVencida en ambos lados.
  const facturasVencidas = facturasPendientes.filter(cc => esVencida(cc, hoy));
  const facturasPorVencer = facturasPendientes.filter(cc => !esVencida(cc, hoy));
  const deudasVencidas = meDebenHtml.filter(d => esVencida(d, hoy));
  const deudasPorVencer = meDebenHtml.filter(d => !esVencida(d, hoy));

  // Deudas que tú debes pagar
  const yoDeboHtml = deudas.filter(d => d.direccion === 'debo' && !d.pagada);
  const yoDebenTotal = yoDeboHtml.reduce((sum, d) => sum + (Number(d.monto) || 0), 0);

  // Pagos mensuales/suscripciones — solo referencia, no entra en patrimonio (igual que antes).
  const pagosMensualesTotal = pagosMensuales.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  // Por pagar — quién te debe qué, en una sola línea bajo el resumen (no solo el total).
  const porPagarLista = facturasPendientes.map(cc => ({ nombre: cc.cliente_nombre || 'Sin nombre', monto: cc.total }))
    .concat(meDebenHtml.map(d => ({ nombre: d.persona || 'Sin nombre', monto: d.monto })));
  const porPagarHtml = porPagarLista.length ? `
    <div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin-top:10px;font-family:'IBM Plex Mono',monospace;font-size:11px;opacity:0.75;">
      ${porPagarLista.map(p => `<span>${escapeHtml(p.nombre)} <b style="color:var(--azul);">${fmtMoney(p.monto)}</b></span>`).join('')}
    </div>
  ` : '';

  const vista = state.finanzasVista || 'ingresos';
  const TABS = [['ingresos', '💵 Ingresos'], ['gastos', '💸 Gastos'], ['deudas', '⚠️ Deudas']];
  const tabsHtml = TABS.map(([v, label]) => `
    <button class="inv-tab ${vista === v ? 'active' : ''}" data-act="finanzas-vista" data-value="${v}">${label}</button>
  `).join('');

  const vistaIngresosHtml = `
    <!-- QUIÉN TE DEBE -->
    <div class="finanzas-seccion" style="margin-bottom:24px;">
      <div class="financ-deudas-head">
        <div class="seccion-titulo" style="margin-bottom:0;">🔵 Quién te debe · ${fmtMoney(teDeben)}</div>
        <button class="btn-ghost" data-act="deuda-nueva" data-direccion="me_deben">+ Deuda a mi favor</button>
      </div>
      ${facturasVencidas.length || deudasVencidas.length ? `
        <div class="mono-label" style="color:var(--rojo);margin-bottom:6px;">⏰ Ya deberían haberte pagado · ${fmtMoney(teDebenVencido)} <span style="opacity:0.7;font-weight:normal;">(no cuenta en tu patrimonio)</span></div>
        ${card('var(--rojo)', facturasVencidas.map(filaFacturaHtml).join('') + deudasVencidas.map(deudaCardHtml).join(''), 'margin-bottom:16px;')}
      ` : ''}
      ${facturasPorVencer.length || deudasPorVencer.length ? `
        <div class="mono-label" style="color:var(--azul);margin-bottom:6px;">🔵 Aún no vence · ${fmtMoney(facturasPorVencer.reduce((s, cc) => s + (Number(cc.total) || 0), 0) + deudasPorVencer.reduce((s, d) => s + (Number(d.monto) || 0), 0))}</div>
        ${card('var(--azul)', facturasPorVencer.map(filaFacturaHtml).join('') + deudasPorVencer.map(deudaCardHtml).join(''), 'margin-bottom:10px;')}
      ` : ''}
      ${facturasPendientes.length === 0 && meDebenHtml.length === 0 ? '<div style="opacity:0.5;font-size:12px;">Nadie te debe ahora mismo 🎉</div>' : ''}
    </div>
    <div class="finanzas-seccion" style="margin-bottom:24px;">${renderTablaFinanzas(movimientos, 'entrada')}</div>
  `;

  const vistaGastosHtml = `
    <div class="finanzas-seccion" style="margin-bottom:24px;">${renderTablaFinanzas(movimientos, 'salida')}</div>
    <div class="finanzas-seccion" style="margin-bottom:24px;">
      <div class="financ-deudas-head">
        <div class="seccion-titulo" style="margin-bottom:0;">💰 Pagos Mensuales / Suscripciones</div>
        <button class="btn-ghost" data-act="pago-mensual-nuevo">+ Agregar pago</button>
      </div>
      ${pagosMensuales.length ? pagosMensuales.map(pagoCardHtml).join('') : '<div style="opacity:0.5;font-size:12px;">Nada registrado todavía — agrega tus suscripciones y pagos fijos del mes.</div>'}
      ${pagosMensuales.length ? card('#E8641B', `
        <div style="text-align:center;">
          <span style="opacity:0.7;font-size:13px;">Total mensual: </span>
          <span style="font-size:18px;font-weight:bold;color:#E8641B;">${fmtMoney(pagosMensualesTotal)}</span>
        </div>
      `, 'margin-top:10px;') : ''}
    </div>
  `;

  const vistaDeudasHtml = `
    <div class="finanzas-seccion" style="margin-bottom:24px;">
      <div class="financ-deudas-head">
        <div class="seccion-titulo" style="margin-bottom:0;">⚠️ Debes Pagar · ${fmtMoney(yoDebenTotal)}</div>
        <button class="btn-ghost" data-act="deuda-nueva" data-direccion="debo">+ Debo</button>
      </div>
      ${yoDeboHtml.length ? yoDeboHtml.map(deudaCardHtml).join('') : '<div style="opacity:0.5;font-size:12px;">No debes nada registrado ahora mismo</div>'}
    </div>
  `;

  const vistaHtml = vista === 'gastos' ? vistaGastosHtml : vista === 'deudas' ? vistaDeudasHtml : vistaIngresosHtml;

  return `
    <main class="financiamiento">
      <!-- HEADER -->
      <div class="financ-head" style="margin-bottom:32px;">
        <h2 class="serif" style="margin:0;font-size:32px;">Finanzas</h2>
        <p style="margin:8px 0 0 0;font-size:14px;opacity:0.7;">Tu situación financiera actual</p>
      </div>

      <!-- SITUACIÓN HOY — siempre visible, sin importar la pestaña -->
      <div class="finanzas-seccion" style="margin-bottom:24px;">
        <div class="seccion-titulo">📊 Tu Situación Hoy</div>

        <div style="background:var(--panel2);border:2px solid ${patrimonio >= 0 ? 'var(--verde)' : 'var(--rojo)'};box-shadow:0 0 24px ${patrimonio >= 0 ? 'rgba(31,175,116,0.25)' : 'rgba(217,54,46,0.25)'};padding:clamp(20px,6vw,40px) clamp(14px,5vw,32px);border-radius:12px;text-align:center;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:0.7;margin-bottom:12px;">Patrimonio Neto</div>
          <div style="font-size:clamp(32px,9vw,64px);font-weight:bold;margin-bottom:32px;line-height:1.15;overflow-wrap:break-word;color:${patrimonio >= 0 ? 'var(--verde)' : 'var(--rojo)'};">${fmtMoney(patrimonio)}</div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:13px;">
            ${card('var(--verde)', `
              <div style="opacity:0.7;margin-bottom:6px;">En bolsillo</div>
              <div style="font-size:clamp(14px,4vw,18px);font-weight:bold;overflow-wrap:break-word;color:var(--verde);">${fmtMoney(efectivo)}</div>
            `)}
            ${card('var(--azul)', `
              <div style="opacity:0.7;margin-bottom:6px;">Te deben</div>
              <div style="font-size:clamp(14px,4vw,18px);font-weight:bold;overflow-wrap:break-word;color:var(--azul);">${fmtMoney(teDeben)}</div>
              <div style="font-size:9px;opacity:0.55;margin-top:3px;">no está en tu patrimonio</div>
            `)}
            ${card('var(--rojo)', `
              <div style="opacity:0.7;margin-bottom:6px;">Debes</div>
              <div style="font-size:clamp(14px,4vw,18px);font-weight:bold;overflow-wrap:break-word;color:var(--rojo);">${fmtMoney(debes)}</div>
            `)}
          </div>

          <div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin-top:20px;font-family:'IBM Plex Mono',monospace;font-size:11px;opacity:0.75;">
            <span>Bancolombia <b style="color:var(--verde);">${fmtMoney(porFuente.bancolombia)}</b></span>
            <span>Nequi <b style="color:var(--verde);">${fmtMoney(porFuente.nequi)}</b></span>
            <span>Efectivo <b style="color:var(--verde);">${fmtMoney(porFuente.efectivo)}</b></span>
          </div>
          ${futuroPago > 0 ? `<div style="margin-top:10px;font-family:'IBM Plex Mono',monospace;font-size:11px;opacity:0.75;">🗓️ Futuro pago (ya con fecha) <b style="color:var(--azul);">${fmtMoney(futuroPago)}</b></div>` : ''}
          ${porPagarHtml}
        </div>
      </div>

      <!-- SUBMENÚ: una pestaña a la vez, nada de scroll interminable -->
      <div class="inv-tabs">${tabsHtml}</div>
      ${vistaHtml}
    </main>
  `;
}
