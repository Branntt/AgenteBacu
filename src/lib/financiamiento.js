const FUENTES = ['bancolombia', 'nequi', 'efectivo'];

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

  const debes = (deudas || []).filter(d => d.direccion === 'debo' && !d.pagada).reduce((sum, d) => sum + (Number(d.monto) || 0), 0);
  const deudaAFavor = (deudas || []).filter(d => d.direccion === 'me_deben' && !d.pagada).reduce((sum, d) => sum + (Number(d.monto) || 0), 0);

  // El estado de pago vive en la factura, no en el cliente: un cliente recurrente puede tener
  // facturas viejas ya pagadas y una nueva sin pagar al mismo tiempo. Marcar una factura pagada
  // (individualmente o en bloque al mover el cliente a "ya_pagos") ya suma esa plata a
  // `efectivo` — ver marcarCuentaCobroPagada en store.js — así que acá solo entran las que
  // siguen sin pagar, para no contarlas dos veces.
  const pendientes = cuentasCobroPendientes(cuentasCobro);
  const clientesDeben = pendientes.reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);

  // Futuro pago: de lo que te deben, la parte con fecha límite puesta y todavía por venir —
  // plata ya casi segura (ej. "Sebastián paga el 5 de agosto"), no solo una deuda abierta sin fecha.
  const futuroPago = hoy
    ? pendientes.filter(cc => cc.fecha_vencimiento && cc.fecha_vencimiento >= hoy).reduce((sum, cc) => sum + (Number(cc.total) || 0), 0)
    : 0;

  const teDeben = deudaAFavor + clientesDeben;
  return { efectivo, porFuente, debes, teDeben, futuroPago, patrimonio: efectivo + teDeben - debes };
}

export function cuentasCobroPendientes(cuentasCobro) {
  return (cuentasCobro || []).filter(cc => !cc.pagada);
}

export function calcularFacturado(cuentasCobro) {
  return (cuentasCobro || []).reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);
}
