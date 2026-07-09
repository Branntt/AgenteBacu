export function valida(idea) {
  return idea.preguntas.every(p => p === true) && idea.objetivos.length > 0;
}

export function hoyStr() {
  const hoy = new Date();
  return hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
}

export function mesActual() {
  const n = new Date();
  return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0');
}
