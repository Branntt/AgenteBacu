// El total de "bolsillo" sale SOLO de movimientos reales (Bancolombia/Nequi/efectivo que el
// usuario registra a mano) y de deudas — nunca de cuentas_cobro, porque facturar no es cobrar.
// Lo facturado se muestra aparte, como referencia, no como dinero disponible.
export function calcularFinanciamiento(movimientos, deudas) {
  const efectivo = (movimientos || []).reduce((sum, m) => sum + (m.tipo === 'gasto' ? -1 : 1) * (Number(m.monto) || 0), 0);
  const debes = (deudas || []).filter(d => d.direccion === 'debo' && !d.pagada).reduce((sum, d) => sum + (Number(d.monto) || 0), 0);
  const teDeben = (deudas || []).filter(d => d.direccion === 'me_deben' && !d.pagada).reduce((sum, d) => sum + (Number(d.monto) || 0), 0);
  return { efectivo, debes, teDeben, patrimonio: efectivo + teDeben - debes };
}

export function calcularFacturado(cuentasCobro) {
  return (cuentasCobro || []).reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);
}
