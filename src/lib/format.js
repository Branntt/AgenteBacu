export function fmtNum(n) {
  if (n == null) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.', ',') + ' M';
  if (n >= 10000) return Math.round(n / 100) / 10 + ' mil';
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function fmtFecha(f, meses) {
  if (!f) return null;
  const [y, m, d] = f.split('-').map(Number);
  return d + ' ' + meses[m - 1].slice(0, 3);
}

export function parseN(v) {
  const n = parseInt(String(v || '').replace(/[^\d]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
