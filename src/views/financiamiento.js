import { escapeHtml } from '../lib/format.js';
import { calcularFinanciamiento, cuentasCobroPendientes, esVencida } from '../lib/financiamiento.js';
import { renderTablaFinanzas } from '../components/tablaFinanzas.js';
import { obtenerEmoji, agruparPorCategoria, calcularResumen, rubroPresupuestoDeCategoria } from '../lib/transacciones.js';
import { renderSimuladorPresupuesto } from '../components/simuladorPresupuesto.js';
import { hoyStr, lunesDe, sumarDias } from '../lib/idea.js';
import { MESES } from '../data/constants.js';

// Rubros del presupuesto (ver state.presupuesto) en el orden en que se muestran — 'ahorro' no
// entra: no es un gasto que se detecte en transacciones, es la meta de lo que debería sobrar.
const RUBROS_PRESUPUESTO = [
  ['arriendo', '🏠 Arriendo'],
  ['servicios', '💡 Servicios'],
  ['comida', '🍽️ Comida'],
  ['transporte', '🚗 Transporte'],
  ['telefono', '📱 Teléfono'],
  ['salud', '⚕️ Salud'],
  ['entretenimiento', '🎬 Entretenimiento'],
  ['personales', '🧴 Personales'],
];

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
    <div class="deuda-card ${d.pagada ? 'pagada' : ''} ${d.urgente ? 'urgente' : ''}">
      <div class="deuda-header-fila">
        <input class="deuda-persona" data-change="deuda-persona" data-id="${id}" value="${escapeHtml(d.persona || '')}" placeholder="¿Con quién es esta deuda?">
        <button class="deuda-urgente-toggle ${d.urgente ? 'activo' : ''}" data-act="deuda-urgente-toggle" data-id="${id}" title="${d.urgente ? 'Quitar urgente' : 'Marcar urgente'}">🔥</button>
      </div>
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
// pagado_mes: ¿ya se marcó pagado ESTE mes calendario? (ultimo_pago vive en la
// misma fila, se compara el prefijo YYYY-MM contra hoy — no hay una fila por mes,
// solo la última fecha en que se marcó, que alcanza para saber "¿ya salió o no?").
function pagoCardHtml(p) {
  const id = escapeHtml(p.id);
  const hoy = hoyStr();
  const pagadoMes = !!(p.ultimo_pago && p.ultimo_pago.slice(0, 7) === hoy.slice(0, 7));
  const vencido = !pagadoMes && p.dia_pago && Number(p.dia_pago) < Number(hoy.slice(8, 10));
  return `
    <div class="pago-card ${vencido ? 'vencido' : ''} ${pagadoMes ? 'pagado-mes' : ''}">
      <input class="pago-nombre" data-change="pago-mensual-nombre" data-id="${id}" value="${escapeHtml(p.nombre || '')}" placeholder="Nombre del pago o suscripción">
      <div class="pago-footer" style="flex-wrap:wrap;">
        <input class="pago-monto-label" data-change="pago-mensual-monto" data-id="${id}" value="${p.monto ? fmtMoney(p.monto) : ''}" placeholder="Monto" inputmode="numeric" style="background:none;border:none;width:110px;color:inherit;">
        <input type="number" data-change="pago-mensual-dia" data-id="${id}" value="${p.dia_pago || ''}" min="1" max="31" placeholder="Día" title="Día del mes en que se cobra" style="${FECHA_LIMITE_STYLE}width:64px;">
        ${pagadoMes
          ? `<span class="pago-estado" style="color:var(--verde);">✓ Pagado este mes</span>`
          : `<button data-act="pago-mensual-marcar-pagado" data-id="${id}" class="pago-estado" style="padding:4px 10px;border-radius:6px;border:1px solid var(--line);background:var(--panel);cursor:pointer;color:${vencido ? 'var(--rojo)' : 'var(--verde)'};">${vencido ? '⚠️ Vencido — marcar pagado' : 'Marcar pagado'}</button>`
        }
        ${botonEliminar('pago-mensual-eliminar', p.id)}
      </div>
    </div>
  `;
}

export function renderFinanciamiento(state) {
  const movimientos = state.movimientosFinanciamiento || [];
  const transacciones = state.transacciones || [];
  const deudas = state.deudas || [];
  const cuentasCobro = state.cuentasCobro || [];
  const pagosMensuales = state.pagosMensuales || [];
  const saldosCuentas = state.saldosCuentas || [];
  const hoy = hoyStr();

  // Cálculos financieros — misma función que usa Panorama, para que ambas pantallas concuerden.
  // teDeben/patrimonio YA excluyen lo vencido (ver esVencida en lib/financiamiento.js) — una
  // factura o deuda a tu favor que se pasó de fecha deja de sumarse sola al número de confianza
  // hasta que decidas qué pasó con ella (renegociar la fecha o eliminarla).
  const { efectivo, porFuente, debes, teDeben, teDebenVencido, futuroPago, patrimonio } = calcularFinanciamiento(movimientos, deudas, cuentasCobro, hoy, transacciones, saldosCuentas);
  const corteDe = fuente => (saldosCuentas.find(s => s.fuente === fuente) || {}).fecha_corte || null;

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
  // Las urgentes primero (ej. Edinson $600k antes que Andre $15k, aunque Andre sea más viejo).
  const yoDeboHtml = deudas.filter(d => d.direccion === 'debo' && !d.pagada)
    .sort((a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0));
  const yoDebenTotal = yoDeboHtml.reduce((sum, d) => sum + (Number(d.monto) || 0), 0);

  // Pagos mensuales/suscripciones — solo referencia, no entra en patrimonio (igual que antes).
  const pagosMensualesTotal = pagosMensuales.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  // Comprometido = lo fijo que todavía falta salir este mes (arriendo, servicios,
  // suscripciones — cualquier pago_mensual no marcado pagado este mes, tenga o no día fijado)
  // + lo que debes a alguien (deudas 'debo'). "Debes" (arriba) ya resta esto último del
  // patrimonio; acá se suma también lo fijo pendiente para responder "de lo que tengo en el
  // bolsillo, ¿cuánto ya tiene dueño" — antes esa plata no se distinguía de la disponible.
  const pagosMensualesPendientesDelMes = pagosMensuales.filter(p => !(p.ultimo_pago && p.ultimo_pago.slice(0, 7) === hoy.slice(0, 7)));
  const comprometido = pagosMensualesPendientesDelMes.reduce((sum, p) => sum + (Number(p.monto) || 0), 0) + debes;
  const disponibleReal = efectivo - comprometido;

  // Recordatorios de pago próximo — director de finanzas activo, no solo un archivo pasivo:
  // avisa ANTES de que algo se venza, no solo lo marca en rojo después (ver pagoCardHtml).
  // Vive fuera de la pestaña "Fijos" a propósito, en 'Tu Situación Hoy', para que se vea sin
  // importar en qué pestaña estés — es justo lo que un aviso urgente no debería depender de.
  const hoyDia = Number(hoy.slice(8, 10));
  const pagosVencidosSinPagar = [];
  const pagosPorVencerPronto = [];
  pagosMensuales.forEach(p => {
    const pagadoMes = !!(p.ultimo_pago && p.ultimo_pago.slice(0, 7) === hoy.slice(0, 7));
    if (pagadoMes || !p.dia_pago) return;
    const dia = Number(p.dia_pago);
    if (dia < hoyDia) pagosVencidosSinPagar.push(p);
    else if (dia - hoyDia <= 3) pagosPorVencerPronto.push({ ...p, diasFaltan: dia - hoyDia });
  });
  const recordatorioPagosHtml = (pagosVencidosSinPagar.length || pagosPorVencerPronto.length) ? `
    <div class="finanzas-seccion" style="margin-bottom:24px;">
      ${card('var(--rojo)', `
        <div style="font-weight:600;margin-bottom:10px;">🔔 Pagos que necesitan tu atención</div>
        ${pagosVencidosSinPagar.map(p => `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0;font-size:13px;">
            <span>⚠️ <b>${escapeHtml(p.nombre || 'Sin nombre')}</b> <span style="opacity:0.6;">— venció el ${p.dia_pago}, sigue sin marcar pagado</span></span>
            <b style="color:var(--rojo);white-space:nowrap;">${fmtMoney(p.monto)}</b>
          </div>
        `).join('')}
        ${pagosPorVencerPronto.map(p => `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0;font-size:13px;">
            <span>🗓️ <b>${escapeHtml(p.nombre || 'Sin nombre')}</b> <span style="opacity:0.6;">— vence ${p.diasFaltan === 0 ? 'HOY' : p.diasFaltan === 1 ? 'mañana' : `en ${p.diasFaltan} días`}</span></span>
            <b style="color:var(--azul);white-space:nowrap;">${fmtMoney(p.monto)}</b>
          </div>
        `).join('')}
      `)}
    </div>
  ` : '';

  // Por pagar — quién te debe qué, en una sola línea bajo el resumen (no solo el total).
  const porPagarLista = facturasPendientes.map(cc => ({ nombre: cc.cliente_nombre || 'Sin nombre', monto: cc.total }))
    .concat(meDebenHtml.map(d => ({ nombre: d.persona || 'Sin nombre', monto: d.monto })));
  const porPagarHtml = porPagarLista.length ? `
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--line);">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.6;margin-bottom:8px;">Por cobrar</div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;">
        ${porPagarLista.map(p => `
          <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(46,85,224,0.12);border:1px solid rgba(46,85,224,0.3);border-radius:20px;padding:5px 12px;font-size:12px;max-width:100%;min-width:0;">
            <span style="overflow-wrap:break-word;min-width:0;">${escapeHtml(p.nombre)}</span> <b style="color:var(--azul);white-space:nowrap;">${fmtMoney(p.monto)}</b>
          </span>
        `).join('')}
      </div>
    </div>
  ` : '';

  // --- Día a día: el registro de gastos e ingresos, mismo bolsillo que el patrimonio de arriba ---
  const mesActualStr = hoy.slice(0, 7);
  const transHoy = transacciones.filter(t => t.fecha === hoy);
  const transMes = transacciones.filter(t => (t.fecha || '').startsWith(mesActualStr));
  const resumenHoy = calcularResumen(transHoy);
  const resumenMes = calcularResumen(transMes);
  const categoriasMes = agruparPorCategoria(transMes.filter(t => t.tipo === 'gasto'));
  const gastosMesTotal = resumenMes.gastos;
  const categoriasOrdenadas = Object.entries(categoriasMes)
    .map(([nombre, d]) => ({ nombre, total: d.total, count: d.count }))
    .sort((a, b) => b.total - a.total);
  const ultimasTrans = transacciones.slice()
    .sort((a, b) => (a.fecha === b.fecha ? String(b.created_at || '').localeCompare(String(a.created_at || '')) : (a.fecha < b.fecha ? 1 : -1)))
    .slice(0, 12);
  const sinMovimientos = movimientos.length === 0 && transacciones.length === 0;

  // --- Presupuesto: cuánto de "en bolsillo" ya tiene dueño ---
  // Cada gasto del mes se reparte en el rubro del presupuesto que le corresponde (ver
  // rubroPresupuestoDeCategoria) para poder responder "esta plata, ¿para qué es" — antes solo
  // se veía el total gastado por categoría de transacción, sin comparar contra lo presupuestado.
  const presupuesto = state.presupuesto || {};
  const gastadoPorRubro = {};
  transMes.filter(t => t.tipo === 'gasto').forEach(t => {
    const rubro = rubroPresupuestoDeCategoria(t.categoria);
    gastadoPorRubro[rubro] = (gastadoPorRubro[rubro] || 0) + (Number(t.monto) || 0);
  });

  const vista = state.finanzasVista || 'dia';
  const TABS = [['dia', '📆 Día a día'], ['presupuesto', '🎯 Presupuesto'], ['ingresos', '💵 Te deben'], ['gastos', '💸 Fijos'], ['deudas', '⚠️ Deudas'], ['historial', '📚 Historial']];
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

  // Meta de ahorro: 'ahorro' en el presupuesto es lo que te propusiste guardar este mes; lo
  // que de verdad guardaste es el neto real (ingresos - gastos registrados). Si el neto es
  // negativo no hay nada que ahorrar todavía — se muestra $0 de progreso, no un número negativo
  // restando de la meta, que sería confuso.
  const metaAhorro = Number(presupuesto.ahorro) || 0;
  const ahorradoReal = Math.max(0, resumenMes.neto);
  const pctAhorro = metaAhorro > 0 ? Math.min(100, Math.round((ahorradoReal / metaAhorro) * 100)) : 0;
  const cumplioMetaAhorro = metaAhorro > 0 && ahorradoReal >= metaAhorro;

  // Presupuesto de ESTA semana — adaptativo: sale de disponibleReal (ya neto de fijos
  // pendientes y deudas, ver arriba), le resta la porción de la meta de ahorro que le toca a
  // esta semana (lo que falta del mes ÷ semanas que quedan en el mes, no 1/4 fijo — si ya
  // ahorraste temprano, las semanas siguientes quedan más sueltas), y reparte lo que sobra
  // entre los días que faltan de la semana (lunes a domingo, igual criterio que Calendario).
  const inicioSemana = lunesDe(hoy);
  const [añoHoyNum, mesHoyNum, diaHoyNum] = hoy.split('-').map(Number);
  const diasEnElMes = new Date(añoHoyNum, mesHoyNum, 0).getDate();
  const semanasRestantesEnMes = Math.max(1, (diasEnElMes - diaHoyNum + 1) / 7);
  const ahorroPrevistoSemana = Math.max(0, metaAhorro - ahorradoReal) / semanasRestantesEnMes;
  const presupuestoLibreSemana = disponibleReal - ahorroPrevistoSemana;
  const diasTranscurridosSemana = Math.round((new Date(hoy) - new Date(inicioSemana)) / 86400000) + 1;
  const diasRestantesSemana = 7 - diasTranscurridosSemana + 1;
  const gastoEstaSemana = transacciones.filter(t => t.tipo === 'gasto' && t.fecha >= inicioSemana && t.fecha <= hoy).reduce((s, t) => s + (Number(t.monto) || 0), 0);
  const restanteSemana = presupuestoLibreSemana - gastoEstaSemana;
  const limiteDiarioPlano = presupuestoLibreSemana / 7;
  const limiteDiarioRestante = diasRestantesSemana > 0 ? restanteSemana / diasRestantesSemana : restanteSemana;
  const semaforoSemana = limiteDiarioRestante <= 0 ? '🔴' : limiteDiarioRestante < limiteDiarioPlano * 0.6 ? '🟡' : '🟢';
  const colorSemaforo = semaforoSemana === '🔴' ? 'var(--rojo)' : semaforoSemana === '🟡' ? '#EFC94C' : 'var(--verde)';

  // Presupuesto vs. real: por cada rubro, lo que te propusiste gastar este mes contra lo que
  // ya llevas gastado — la barra se pone roja si te pasaste, y "Sin asignar" muestra qué falta
  // por presupuestar entre lo que ya gastaste en categorías sin rubro fijo.
  const vistaPresupuestoHtml = `
    <div class="finanzas-seccion" style="margin-bottom:24px;">
      ${card(colorSemaforo, `
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:10px;">
          <div style="font-weight:600;">${semaforoSemana} Presupuesto de esta semana</div>
          <b style="white-space:nowrap;color:${colorSemaforo};">${fmtMoney(restanteSemana)} <span style="opacity:0.6;font-weight:normal;font-size:12px;">libres</span></b>
        </div>
        <div style="font-size:24px;font-weight:bold;color:${colorSemaforo};margin-bottom:6px;">${fmtMoney(limiteDiarioRestante)}<span style="font-size:12px;font-weight:normal;opacity:0.6;"> / día, los ${diasRestantesSemana} días que quedan</span></div>
        <div style="font-size:11px;opacity:0.65;line-height:1.5;">
          Disponible real ${fmtMoney(disponibleReal)} − ahorro previsto de esta semana ${fmtMoney(ahorroPrevistoSemana)} = ${fmtMoney(presupuestoLibreSemana)} para toda la semana.
          Ya gastaste ${fmtMoney(gastoEstaSemana)} desde el lunes.
        </div>
      `)}
    </div>
    ${metaAhorro > 0 ? `
    <div class="finanzas-seccion" style="margin-bottom:24px;">
      ${card(cumplioMetaAhorro ? 'var(--verde)' : 'var(--azul)', `
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:10px;">
          <div style="font-weight:600;">💰 Meta de ahorro — este mes</div>
          <b style="white-space:nowrap;color:${cumplioMetaAhorro ? 'var(--verde)' : 'var(--azul)'};">${fmtMoney(ahorradoReal)} <span style="opacity:0.6;font-weight:normal;font-size:12px;">/ ${fmtMoney(metaAhorro)}</span></b>
        </div>
        <div style="height:10px;background:var(--panel);border-radius:5px;overflow:hidden;">
          <div style="height:100%;width:${pctAhorro}%;background:${cumplioMetaAhorro ? 'var(--verde)' : 'var(--azul)'};border-radius:5px;transition:width 0.3s;"></div>
        </div>
        <div style="font-size:11px;opacity:0.7;margin-top:8px;">
          ${cumplioMetaAhorro ? '🎉 ¡Ya cumpliste tu meta de ahorro de este mes!' : `Te faltan ${fmtMoney(metaAhorro - ahorradoReal)} para llegar a tu meta.`}
        </div>
      `)}
    </div>
    ` : ''}
    <div class="finanzas-seccion" style="margin-bottom:24px;">
      <div class="seccion-titulo">🎯 Presupuesto vs. Real — Este mes</div>
      ${card('var(--verde)', RUBROS_PRESUPUESTO.map(([rubro, label]) => {
        const presupuestado = Number(presupuesto[rubro]) || 0;
        const gastado = gastadoPorRubro[rubro] || 0;
        const pct = presupuestado > 0 ? Math.round((gastado / presupuestado) * 100) : (gastado > 0 ? 100 : 0);
        const seExcedio = presupuestado > 0 && gastado > presupuestado;
        const color = seExcedio ? 'var(--rojo)' : 'var(--verde)';
        return `
          <div style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:13px;margin-bottom:5px;">
              <span>${label}</span>
              <b style="white-space:nowrap;color:${color};">${fmtMoney(gastado)} <span style="opacity:0.6;font-weight:normal;font-size:11px;">/ ${fmtMoney(presupuestado)}</span></b>
            </div>
            <div style="height:7px;background:var(--panel);border-radius:4px;overflow:hidden;">
              <div style="height:100%;width:${Math.min(pct, 100)}%;background:${color};border-radius:4px;"></div>
            </div>
            ${seExcedio ? `<div style="font-size:10px;color:var(--rojo);margin-top:3px;">Te pasaste por ${fmtMoney(gastado - presupuestado)}</div>` : ''}
          </div>
        `;
      }).join(''))}
    </div>
    <div class="finanzas-seccion" style="margin-bottom:24px;">
      ${renderSimuladorPresupuesto(presupuesto)}
    </div>
  `;

  // --- Historial: los 12 meses del año, siempre navegables, aunque estén vacíos ---
  // Junta las dos tablas que mueven plata (transacciones + movimientos_financiamiento, ver
  // calcularFinanciamiento) en una sola línea de tiempo por mes — "la verdad y solo la verdad":
  // nada de lo registrado alguna vez desaparece, solo se archiva por mes para poder mirarlo
  // sin que ensucie el saldo de hoy (ver saldos_cuentas / fecha_corte).
  const mesSeleccionado = state.historialMes || hoy.slice(0, 7);
  // Antes esto era const añoActual = hoy.slice(0,4), fijo — los 12 botones de mes siempre
  // eran del año en curso sin ninguna forma de navegar a otro. Ahora sale del mes
  // seleccionado, así que las flechas de abajo (mismo action historial-mes, cambiando el
  // año y dejando el mes) sí pueden moverlo a un año distinto.
  const [añoMostrado, mesMostradoNum] = mesSeleccionado.split('-');
  const entradasUnificadas = transacciones.map(t => ({
    fecha: t.fecha, monto: Number(t.monto) || 0, esIngreso: t.tipo === 'ingreso',
    descripcion: t.descripcion || obtenerEmoji(t.categoria), fuente: t.fuente, origen: 'día a día',
  })).concat(movimientos.map(m => ({
    fecha: m.fecha, monto: Number(m.monto) || 0, esIngreso: m.tipo === 'entrada',
    descripcion: m.nota || '(sin nota)', fuente: m.fuente, origen: 'registro anterior',
  })));
  const mesesConDatos = new Set(entradasUnificadas.map(e => (e.fecha || '').slice(0, 7)));
  const mesesBotonesHtml = MESES.map((nombre, i) => {
    const key = `${añoMostrado}-${String(i + 1).padStart(2, '0')}`;
    const tieneDatos = mesesConDatos.has(key);
    return `<button class="inv-tab ${mesSeleccionado === key ? 'active' : ''}" data-act="historial-mes" data-value="${key}" style="position:relative;">
      ${nombre.slice(0, 3)}${tieneDatos ? '<span style="position:absolute;top:4px;right:6px;width:5px;height:5px;border-radius:50%;background:var(--verde);"></span>' : ''}
    </button>`;
  }).join('');
  const añoAnteriorKey = `${Number(añoMostrado) - 1}-${mesMostradoNum}`;
  const añoSiguienteKey = `${Number(añoMostrado) + 1}-${mesMostradoNum}`;

  const entradasDelMes = entradasUnificadas.filter(e => (e.fecha || '').startsWith(mesSeleccionado))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ingresosMes = entradasDelMes.filter(e => e.esIngreso).reduce((s, e) => s + e.monto, 0);
  const gastosDelMesHist = entradasDelMes.filter(e => !e.esIngreso).reduce((s, e) => s + e.monto, 0);
  const categoriasDelMesHist = agruparPorCategoria(transacciones.filter(t => t.tipo === 'gasto' && (t.fecha || '').startsWith(mesSeleccionado)));
  const categoriasDelMesOrdenadas = Object.entries(categoriasDelMesHist)
    .map(([nombre, d]) => ({ nombre, total: d.total, count: d.count }))
    .sort((a, b) => b.total - a.total);
  const [añoMes, mesNum] = mesSeleccionado.split('-');
  const nombreMesSeleccionado = `${MESES[Number(mesNum) - 1]} ${añoMes}`;
  // Única definición — antes existía una copia idéntica más abajo (resumenCardHist), que
  // solo se usaba acá arriba; unificadas en resumenCard, la que también usa vistaDiaHtml.
  const resumenCard = (label, valor, color) => card(color, `
    <div style="opacity:0.7;font-size:11px;margin-bottom:4px;">${label}</div>
    <div style="font-size:19px;font-weight:bold;color:${color};overflow-wrap:break-word;">${fmtMoney(valor)}</div>
  `, 'padding:12px 14px;');

  const vistaHistorialHtml = `
    <div class="finanzas-seccion" style="margin-bottom:24px;">
      <div class="seccion-titulo" style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <span>📚 Historial ${añoMostrado}</span>
        <span style="display:flex;gap:6px;">
          <button class="btn-ghost" data-act="historial-mes" data-value="${añoAnteriorKey}" title="Año anterior" style="padding:4px 10px;min-height:0;">←</button>
          <button class="btn-ghost" data-act="historial-mes" data-value="${añoSiguienteKey}" title="Año siguiente" style="padding:4px 10px;min-height:0;">→</button>
        </span>
      </div>
      <div class="inv-tabs" style="flex-wrap:wrap;">${mesesBotonesHtml}</div>
    </div>
    <div class="finanzas-seccion" style="margin-bottom:24px;">
      <div class="seccion-titulo" style="text-transform:capitalize;">${nombreMesSeleccionado}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
        ${resumenCard('Entró', ingresosMes, 'var(--verde)')}
        ${resumenCard('Salió', gastosDelMesHist, 'var(--rojo)')}
        ${resumenCard('Neto', ingresosMes - gastosDelMesHist, (ingresosMes - gastosDelMesHist) >= 0 ? 'var(--verde)' : 'var(--rojo)')}
      </div>
      ${categoriasDelMesOrdenadas.length ? card('var(--rojo)', categoriasDelMesOrdenadas.map(c => {
        const pct = gastosDelMesHist > 0 ? Math.round((c.total / gastosDelMesHist) * 100) : 0;
        return `
          <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:13px;margin-bottom:5px;">
              <span style="min-width:0;overflow-wrap:break-word;">${obtenerEmoji(c.nombre)} ${escapeHtml(c.nombre)} <span style="opacity:0.5;font-size:11px;">· ${c.count}</span></span>
              <b style="white-space:nowrap;">${fmtMoney(c.total)} <span style="opacity:0.6;font-weight:normal;font-size:11px;">${pct}%</span></b>
            </div>
            <div style="height:7px;background:var(--panel);border-radius:4px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:var(--rojo);border-radius:4px;"></div>
            </div>
          </div>
        `;
      }).join(''), 'margin-bottom:16px;') : ''}
      ${entradasDelMes.length ? card('var(--azul)', entradasDelMes.map(e => `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);">
          <div style="min-width:0;">
            <div style="font-size:13px;overflow-wrap:break-word;">${escapeHtml(e.descripcion)}</div>
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;opacity:0.55;margin-top:2px;">${fmtFecha(e.fecha)} · ${escapeHtml(e.fuente || '')} · <span style="opacity:0.7;">${e.origen}</span></div>
          </div>
          <b style="white-space:nowrap;color:${e.esIngreso ? 'var(--verde)' : 'var(--rojo)'};">${e.esIngreso ? '+' : '−'}${fmtMoney(e.monto)}</b>
        </div>
      `).join('')) : '<div style="opacity:0.5;font-size:12px;">Nada registrado en este mes.</div>'}
    </div>
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


  // Registrar un gasto/ingreso del día. Cae en la MISMA cuenta que el patrimonio de arriba
  // (ver calcularFinanciamiento): no hay saldo inicial inventado en ninguna parte, el saldo
  // es la suma de lo que se registró. Si arrancás de cero, el primer movimiento es tu saldo
  // de hoy registrado como ingreso.
  const formularioHtml = card('var(--verde)', `
    <div class="mono-label" style="margin-bottom:10px;">➕ Registrar movimiento</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;">
      <input type="date" id="fecha-trans" value="${hoy}" title="Fecha" style="background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:9px 10px;color:inherit;font-size:13px;min-width:0;width:100%;color-scheme:dark;">
      <input type="text" id="desc-trans" placeholder="En qué fue (ej: almuerzo)" style="background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:9px 10px;color:inherit;font-size:13px;min-width:0;width:100%;color-scheme:dark;">
      <input type="number" inputmode="numeric" id="monto-trans" placeholder="Monto" style="background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:9px 10px;color:inherit;font-size:13px;min-width:0;width:100%;color-scheme:dark;">
      <select id="tipo-trans" style="background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:9px 10px;color:inherit;font-size:13px;min-width:0;width:100%;color-scheme:dark;">
        <option value="gasto">📤 Gasto</option>
        <option value="ingreso">📥 Ingreso</option>
      </select>
      <select id="fuente-trans" style="background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:9px 10px;color:inherit;font-size:13px;min-width:0;width:100%;color-scheme:dark;">
        <option value="nequi">📱 Nequi</option>
        <option value="bancolombia">🏦 Bancolombia</option>
        <option value="efectivo">💵 Efectivo</option>
      </select>
    </div>
    <button class="btn-primary" data-act="transaccion-agregar" style="width:100%;margin-top:10px;">Registrar</button>
    <div style="font-size:11px;opacity:0.55;margin-top:8px;">La categoría se detecta sola por lo que escribas.</div>
  `, 'margin-bottom:16px;');

  const vistaDiaHtml = `
    ${sinMovimientos ? card('var(--azul)', `
      <div style="font-size:13px;line-height:1.5;">
        <b>Todavía no hay nada registrado.</b><br>
        Tu saldo arranca en <b>${fmtMoney(0)}</b> porque se calcula sumando lo que registres, no hay un número puesto a mano.
        Registrá tu saldo de hoy como un <b>ingreso</b> por cada cuenta (ej. Nequi 125.000, Bancolombia 2.000) y de ahí en adelante solo sumás y restás lo del día.
      </div>
    `, 'margin-bottom:16px;') : ''}

    ${formularioHtml}

    <div class="finanzas-seccion" style="margin-bottom:24px;">
      <div class="seccion-titulo">📆 Hoy</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${resumenCard('Entró', resumenHoy.ingresos, 'var(--verde)')}
        ${resumenCard('Salió', resumenHoy.gastos, 'var(--rojo)')}
        ${resumenCard('Neto', resumenHoy.neto, resumenHoy.neto >= 0 ? 'var(--verde)' : 'var(--rojo)')}
      </div>
    </div>

    <div class="finanzas-seccion" style="margin-bottom:24px;">
      <div class="seccion-titulo">📈 Este mes</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
        ${resumenCard('Entró', resumenMes.ingresos, 'var(--verde)')}
        ${resumenCard('Salió', resumenMes.gastos, 'var(--rojo)')}
        ${resumenCard('Neto', resumenMes.neto, resumenMes.neto >= 0 ? 'var(--verde)' : 'var(--rojo)')}
      </div>
      ${categoriasOrdenadas.length ? `
        <div class="mono-label" style="margin-bottom:8px;">En qué se fue la plata</div>
        ${card('var(--rojo)', categoriasOrdenadas.map(c => {
          const pct = gastosMesTotal > 0 ? Math.round((c.total / gastosMesTotal) * 100) : 0;
          return `
            <div style="margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:13px;margin-bottom:5px;">
                <span style="min-width:0;overflow-wrap:break-word;">${obtenerEmoji(c.nombre)} ${escapeHtml(c.nombre)} <span style="opacity:0.5;font-size:11px;">· ${c.count}</span></span>
                <b style="white-space:nowrap;">${fmtMoney(c.total)} <span style="opacity:0.6;font-weight:normal;font-size:11px;">${pct}%</span></b>
              </div>
              <div style="height:7px;background:var(--panel);border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:var(--rojo);border-radius:4px;"></div>
              </div>
            </div>
          `;
        }).join(''))}
      ` : '<div style="opacity:0.5;font-size:12px;">Sin gastos registrados este mes.</div>'}
    </div>

    <div class="finanzas-seccion" style="margin-bottom:24px;">
      <div class="seccion-titulo">📝 Últimos movimientos</div>
      ${ultimasTrans.length ? card('var(--azul)', ultimasTrans.map(t => `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);">
          <div style="min-width:0;">
            <div style="font-size:13px;overflow-wrap:break-word;">${obtenerEmoji(t.categoria)} ${escapeHtml(t.descripcion || 'Sin descripción')}</div>
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;opacity:0.55;margin-top:2px;">${fmtFecha(t.fecha)} · ${escapeHtml(t.fuente || '')}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <b style="white-space:nowrap;color:${t.tipo === 'ingreso' ? 'var(--verde)' : 'var(--rojo)'};">${t.tipo === 'ingreso' ? '+' : '−'}${fmtMoney(t.monto)}</b>
            ${botonEliminar('transaccion-eliminar', t.id)}
          </div>
        </div>
      `).join('')) : '<div style="opacity:0.5;font-size:12px;">Nada registrado todavía.</div>'}
    </div>
  `;

  const vistaHtml = vista === 'gastos' ? vistaGastosHtml
    : vista === 'deudas' ? vistaDeudasHtml
    : vista === 'ingresos' ? vistaIngresosHtml
    : vista === 'presupuesto' ? vistaPresupuestoHtml
    : vista === 'historial' ? vistaHistorialHtml
    : vistaDiaHtml;

  return `
    <main class="financiamiento">
      <!-- HEADER -->
      <div class="financ-head" style="margin-bottom:32px;">
        <h2 class="serif" style="margin:0;font-size:32px;">Finanzas</h2>
        <p style="margin:8px 0 0 0;font-size:14px;opacity:0.7;">Gastos, ingresos y deudas en un solo lugar</p>
      </div>

      <!-- SITUACIÓN HOY — siempre visible, sin importar la pestaña -->
      <div class="finanzas-seccion" style="margin-bottom:24px;">
        <div class="seccion-titulo">📊 Tu Situación Hoy</div>

        <div style="background:var(--panel2);border:2px solid ${patrimonio >= 0 ? 'var(--verde)' : 'var(--rojo)'};box-shadow:0 0 24px ${patrimonio >= 0 ? 'rgba(31,175,116,0.25)' : 'rgba(217,54,46,0.25)'};padding:clamp(20px,6vw,40px) clamp(14px,5vw,32px);border-radius:12px;text-align:center;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:0.7;margin-bottom:12px;">Patrimonio Neto</div>
          <div style="font-size:clamp(32px,9vw,64px);font-weight:bold;margin-bottom:32px;line-height:1.15;overflow-wrap:break-word;color:${patrimonio >= 0 ? 'var(--verde)' : 'var(--rojo)'};">${fmtMoney(patrimonio)}</div>

          <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;text-align:left;">
            ${card('var(--verde)', `
              <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;">
                <span style="opacity:0.7;">En bolsillo</span>
                <span style="font-size:18px;font-weight:bold;white-space:nowrap;color:var(--verde);">${fmtMoney(efectivo)}</span>
              </div>
            `, 'padding:12px 16px;')}
            ${card(disponibleReal >= 0 ? 'var(--verde)' : 'var(--rojo)', `
              <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;">
                <span style="opacity:0.7;">Disponible real</span>
                <span style="font-size:18px;font-weight:bold;white-space:nowrap;color:${disponibleReal >= 0 ? 'var(--verde)' : 'var(--rojo)'};">${fmtMoney(disponibleReal)}</span>
              </div>
              <div style="font-size:9px;opacity:0.55;margin-top:3px;text-align:right;">bolsillo menos comprometido (${fmtMoney(comprometido)}: fijos pendientes + lo que debes)</div>
            `, 'padding:12px 16px;')}
            ${card('var(--azul)', `
              <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;">
                <span style="opacity:0.7;">Te deben</span>
                <span style="font-size:18px;font-weight:bold;white-space:nowrap;color:var(--azul);">${fmtMoney(teDeben)}</span>
              </div>
              <div style="font-size:9px;opacity:0.55;margin-top:3px;text-align:right;">no está en tu patrimonio</div>
            `, 'padding:12px 16px;')}
            ${card('var(--rojo)', `
              <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;">
                <span style="opacity:0.7;">Debes</span>
                <span style="font-size:18px;font-weight:bold;white-space:nowrap;color:var(--rojo);">${fmtMoney(debes)}</span>
              </div>
            `, 'padding:12px 16px;')}
          </div>

          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:20px;">
            ${[['🏦', 'bancolombia', 'Bancolombia', porFuente.bancolombia], ['📱', 'nequi', 'Nequi', porFuente.nequi], ['💵', 'efectivo', 'Efectivo', porFuente.efectivo]].map(([icono, fuente, label, monto]) => {
              const corte = corteDe(fuente);
              return `
              <div style="background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px 4px;text-align:center;min-width:0;">
                <div style="font-size:16px;margin-bottom:4px;">${icono}</div>
                <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:0.5px;text-transform:uppercase;opacity:0.6;margin-bottom:3px;">${label}</div>
                <input class="saldo-cuenta-input" data-change="saldo-cuenta" data-fuente="${fuente}" value="${monto ? fmtMoney(monto) : '$0'}" inputmode="numeric" title="Corregir el saldo real de ${label} — hoy" style="background:none;border:none;text-align:center;width:100%;color:var(--verde);font-weight:bold;font-family:'IBM Plex Mono',monospace;font-size:11px;padding:0;">
                <div style="font-size:8px;opacity:0.45;margin-top:2px;">${corte ? `desde ${fmtFecha(corte)}` : 'toca y fija tu saldo real'}</div>
              </div>
            `;
            }).join('')}
          </div>
          ${futuroPago > 0 ? `<div style="margin-top:14px;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:11px;opacity:0.75;">🗓️ Futuro pago (ya con fecha) <b style="color:var(--azul);">${fmtMoney(futuroPago)}</b></div>` : ''}
          ${porPagarHtml}
        </div>
      </div>

      ${recordatorioPagosHtml}

      <!-- SUBMENÚ: una pestaña a la vez, nada de scroll interminable -->
      <div class="inv-tabs">${tabsHtml}</div>
      ${vistaHtml}
    </main>
  `;
}
