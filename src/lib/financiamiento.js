// El total de "bolsillo" sale SOLO de movimientos reales (Bancolombia/Nequi/efectivo que el
// usuario registra a mano), deudas personales, y cuentas de cobro sin pagar.
// Lo facturado se muestra aparte, como referencia, no como dinero disponible.
export function calcularFinanciamiento(movimientos, deudas, cuentasCobro) {
  const efectivo = (movimientos || []).reduce((sum, m) => sum + (m.tipo === 'salida' ? -1 : 1) * (Number(m.monto) || 0), 0);
  const debes = (deudas || []).filter(d => d.direccion === 'debo' && !d.pagada).reduce((sum, d) => sum + (Number(d.monto) || 0), 0);
  const deudaAFavor = (deudas || []).filter(d => d.direccion === 'me_deben' && !d.pagada).reduce((sum, d) => sum + (Number(d.monto) || 0), 0);

  // El estado de pago vive en la factura, no en el cliente: un cliente recurrente puede tener
  // facturas viejas ya pagadas y una nueva sin pagar al mismo tiempo. Marcar una factura pagada
  // (individualmente o en bloque al mover el cliente a "ya_pagos") ya suma esa plata a
  // `efectivo` — ver marcarCuentaCobroPagada en store.js — así que acá solo entran las que
  // siguen sin pagar, para no contarlas dos veces.
  const clientesDeben = cuentasCobroPendientes(cuentasCobro).reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);

  const teDeben = deudaAFavor + clientesDeben;
  return { efectivo, debes, teDeben, patrimonio: efectivo + teDeben - debes };
}

export function cuentasCobroPendientes(cuentasCobro) {
  return (cuentasCobro || []).filter(cc => !cc.pagada);
}

export function calcularFacturado(cuentasCobro) {
  return (cuentasCobro || []).reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);
}
