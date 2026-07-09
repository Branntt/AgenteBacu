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

export function fstr(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function lunesDe(fechaStr) {
  const [y, m, d] = fechaStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const lead = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - lead);
  return fstr(date);
}

export function sumarDias(fechaStr, n) {
  const [y, m, d] = fechaStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + n);
  return fstr(date);
}
