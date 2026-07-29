const FUENTES = ['bancolombia', 'nequi', 'efectivo'];

// Vencida = tenía fecha límite/vencimiento y ya pasó. Un solo lugar para esta pregunta
// porque cuentas_cobro y deudas usan nombres de campo distintos (fecha_vencimiento vs
// fecha_limite) — ya hubo un bug por revisar solo uno de los dos en un solo lado.
export function esVencida(item, hoy) {
  const fecha = item.fecha_vencimiento || item.fecha_limite;
  return !!(hoy && fecha && fecha < hoy);
}

// El total de "bolsillo" sale SOLO de movimientos reales (Bancolombia/Nequi/efectivo que el
// usuario registra a mano), deudas personales, y cuentas de cobro sin pagar.
// Lo facturado se muestra aparte, como referencia, no como dinero disponible.
export function calcularFinanciamiento(movimientos, deudas, cuentasCobro, hoy) {
  const porFuente = { bancolombia: 0, nequi: 0, efectivo: 0 };
  (movimientos || []).forEach(m => {
    const valor = (m.tipo === 'salida' ? -1 : 1) * (Number(m.monto) || 0);
    const f = FUENTES.includes(m.fuente) ? m.fuente : 'bancolombia';
    porFuente[f] += valor;
  });
  const efectivo = porFuente.bancolombia + porFuente.nequi + porFuente.efectivo;

  // Lo que debes (direccion:'debo') SÍ sigue contando aunque se venza — que se pase la
  // fecha no te libera de una deuda propia, si acaso la hace más segura de pagar. La
  // asimetría es a propósito: solo lo que TE deben pierde certeza al vencerse.
  const debes = (deudas || []).filter(d => d.direccion === 'debo' && !d.pagada).reduce((sum, d) => sum + (Number(d.monto) || 0), 0);

  // El estado de pago vive en la factura, no en el cliente: un cliente recurrente puede tener
  // facturas viejas ya pagadas y una nueva sin pagar al mismo tiempo. Marcar una factura pagada
  // (individualmente o en bloque al mover el cliente a "ya_pagos") ya suma esa plata a
  // `efectivo` — ver marcarCuentaCobroPagada en store.js — así que acá solo entran las que
  // siguen sin pagar, para no contarlas dos veces.
  const meDeben = (deudas || []).filter(d => d.direccion === 'me_deben' && !d.pagada);
  const pendientes = cuentasCobroPendientes(cuentasCobro);

  // Una deuda/factura a tu favor que se vence deja de sumarse sola al patrimonio: cobrarla
  // ya no es seguro (2026-07-29, a pedido del usuario — Sol vencida no es lo mismo que
  // Sebastián con fecha futura, y antes ambas sumaban igual). Se queda visible en "Ya
  // deberían haberte pagado" (financiamiento.js), pero fuera del número de confianza hasta
  // que el usuario decida qué pasó: renegociar la fecha (deja de estar vencida) o eliminarla
  // (deuda-eliminar / cc-eliminar) si no va a caer.
  const meDebenAlDia = meDeben.filter(d => !esVencida(d, hoy));
  const pendientesAlDia = pendientes.filter(cc => !esVencida(cc, hoy));
  const deudaAFavor = meDebenAlDia.reduce((sum, d) => sum + (Number(d.monto) || 0), 0);
  const clientesDeben = pendientesAlDia.reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);

  const teDebenVencido = meDeben.filter(d => esVencida(d, hoy)).reduce((sum, d) => sum + (Number(d.monto) || 0), 0)
    + pendientes.filter(cc => esVencida(cc, hoy)).reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);

  // Futuro pago: de lo que te deben, la parte con fecha límite puesta y todavía por venir —
  // plata ya casi segura (ej. "Sebastián paga el 5 de agosto"), no solo una deuda abierta sin fecha.
  const futuroPago = hoy
    ? pendientesAlDia.filter(cc => cc.fecha_vencimiento && cc.fecha_vencimiento >= hoy).reduce((sum, cc) => sum + (Number(cc.total) || 0), 0)
    : 0;

  const teDeben = deudaAFavor + clientesDeben;
  return { efectivo, porFuente, debes, teDeben, teDebenVencido, futuroPago, patrimonio: efectivo + teDeben - debes };
}

export function cuentasCobroPendientes(cuentasCobro) {
  return (cuentasCobro || []).filter(cc => !cc.pagada);
}

export function calcularFacturado(cuentasCobro) {
  return (cuentasCobro || []).reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);
}
