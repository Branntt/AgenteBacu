export function calcularTotalFinanciamiento(cuentasCobro, movimientos) {
  const totalTrabajos = (cuentasCobro || []).reduce((sum, cc) => sum + (Number(cc.total) || 0), 0);
  const totalMovimientos = (movimientos || []).reduce((sum, m) => sum + (m.tipo === 'gasto' ? -1 : 1) * (Number(m.monto) || 0), 0);
  return { totalTrabajos, totalMovimientos, total: totalTrabajos + totalMovimientos };
}
