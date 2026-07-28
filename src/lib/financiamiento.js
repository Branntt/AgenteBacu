// El total de "bolsillo" sale SOLO de movimientos reales (Bancolombia/Nequi/efectivo que el
// usuario registra a mano), deudas personales, y clientes que deben dinero.
// Lo facturado se muestra aparte, como referencia, no como dinero disponible.
export function calcularFinanciamiento(movimientos, deudas, clientes, cuentasCobro) {
  const efectivo = (movimientos || []).reduce((sum, m) => sum + (m.tipo === 'gasto' ? -1 : 1) * (Number(m.monto) || 0), 0);
  const debes = (deudas || []).filter(d => d.direccion === 'debo' && !d.pagada).reduce((sum, d) => sum + (Number(d.monto) || 0), 0);
  const deudaAFavor = (deudas || []).filter(d => d.direccion === 'me_deben' && !d.pagada).reduce((sum, d) => sum + (Number(d.monto) || 0), 0);

  // Cuentas de cobro de clientes que TODAVÍA están en "por_pagar". Las de clientes en
  // ya_pagos/entregado no cuentan acá — esa plata ya se sumó a `efectivo` cuando se marcaron
  // pagadas (ver updCliente en store.js); sumarlas también acá las contaría dos veces.
  const idsPorPagar = new Set((clientes || []).filter(c => c.estado === 'por_pagar').map(c => c.id));
  const clientesDeben = (cuentasCobro || []).filter(cc => idsPorPagar.has(cc.cliente_id)).reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);

  const teDeben = deudaAFavor + clientesDeben;
  return { efectivo, debes, teDeben, patrimonio: efectivo + teDeben - debes };
}

export function calcularFacturado(cuentasCobro) {
  return (cuentasCobro || []).reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);
}
