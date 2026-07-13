import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';
import { EMISOR } from '../data/constants.js';

const BG_DARK = '#0C0E0D';
const CREAM = '#EDE9DF';
const LINE = '#DCD9CD';
const LINE_SOFT = '#E7E4D9';
const TEXT_DARK = '#181B19';
const MUTED = '#79807A';
const MUTED_LT = '#9AA39B';
const VERDE = '#3BA478';

const NUMEROS_MIL = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
// Conversión simplificada de número a letras, suficiente para montos típicos de cuentas de cobro (miles/millones redondos o con decenas/centenas).
function numeroALetras(n) {
  if (n === 0) return 'cero pesos';
  const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const DIECI = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const DECENAS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  function tresDigitos(num) {
    if (num === 0) return '';
    if (num === 100) return 'cien';
    let out = '';
    const c = Math.floor(num / 100), resto = num % 100;
    if (c) out += CENTENAS[c] + ' ';
    if (resto >= 10 && resto < 20) out += DIECI[resto - 10];
    else {
      const d = Math.floor(resto / 10), u = resto % 10;
      if (d) out += DECENAS[d] + (u ? ' y ' : '');
      if (u) out += UNIDADES[u];
    }
    return out.trim();
  }

  function seccion(num, singular, plural) {
    if (num === 0) return '';
    if (num === 1) return singular ? singular : '';
    const texto = num === 1 ? 'un' : tresDigitos(num);
    return `${texto} ${plural}`;
  }

  const millones = Math.floor(n / 1000000);
  const miles = Math.floor((n % 1000000) / 1000);
  const cientos = n % 1000;

  let partes = [];
  if (millones) partes.push(millones === 1 ? 'un millón' : `${tresDigitos(millones)} millones`);
  if (miles) partes.push(miles === 1 ? 'mil' : `${tresDigitos(miles)} mil`);
  if (cientos) partes.push(tresDigitos(cientos));

  const texto = partes.join(' ').trim();
  return (texto.charAt(0).toUpperCase() + texto.slice(1)) + ' pesos';
}

function fmtMoney(n) {
  return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export const OBSERVACIONES_DEFAULT = 'Gracias por confiar en Bacu Creative. Documento válido como soporte de cobro por prestación de servicios.';

export function generarCuentaCobroPDF({ numero, fechaLabel, fechaVencimientoLabel, cliente, documento, items, total, observaciones }) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const MARGIN = 46;

  const track = (text, x, y, size, spacing, color) => {
    doc.setTextColor(color);
    doc.setFont('courier', 'normal');
    doc.setFontSize(size);
    let cx = x;
    for (const ch of text) {
      doc.text(ch, cx, y);
      cx += doc.getTextWidth(ch) + spacing;
    }
  };
  const trackWidth = (text, size, spacing) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(size);
    return text.split('').reduce((w, ch) => w + doc.getTextWidth(ch) + spacing, 0) - spacing;
  };
  const eyeIcon = (x, y, w, h, color) => {
    doc.setDrawColor(color);
    doc.setLineWidth(1.6);
    doc.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 'S');
    doc.setFillColor(color);
    doc.circle(x + w / 2, y + h / 2, h * 0.26, 'F');
  };
  const wrapText = (text, maxWidth, font, style, size) => {
    doc.setFont(font, style);
    doc.setFontSize(size);
    return doc.splitTextToSize(text, maxWidth);
  };

  // ---- header ----
  const HEADER_H = 128;
  doc.setFillColor(BG_DARK);
  doc.rect(0, 0, W, HEADER_H, 'F');
  eyeIcon(MARGIN, 28, 34, 20, VERDE);
  doc.setTextColor('#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.text('BACU CREATIVE', MARGIN, 68);
  track('ESTUDIO AUDIOVISUAL · DIRECCIÓN CREATIVA', MARGIN, 82, 7.3, 1.1, MUTED_LT);

  const cuentaLabel = 'CUENTA DE COBRO';
  track(cuentaLabel, W - MARGIN - trackWidth(cuentaLabel, 8, 2.2), 32, 8, 2.2, VERDE);
  doc.setTextColor('#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('N.º ' + numero, W - MARGIN, 58, { align: 'right' });
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED_LT);
  doc.text('Bucaramanga · ' + fechaLabel, W - MARGIN, 74, { align: 'right' });
  if (fechaVencimientoLabel) {
    doc.text('Vence · ' + fechaVencimientoLabel, W - MARGIN, 87, { align: 'right' });
  }

  let y = HEADER_H + 34;

  // ---- DE / PARA ----
  const colW = (W - 2 * MARGIN - 40) / 2;
  const col1 = MARGIN, col2 = MARGIN + colW + 40;

  const sectionLabel = (label, x, yy) => {
    track(label, x, yy, 8, 1.6, VERDE);
    doc.setDrawColor(LINE);
    doc.setLineWidth(0.6);
    doc.line(x, yy + 6, x + colW, yy + 6);
  };
  sectionLabel('DE · COBRA', col1, y);
  sectionLabel('PARA · DEBE', col2, y);

  let y2 = y + 22;
  doc.setTextColor(TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text(EMISOR.nombre, col1, y2);
  doc.text(cliente || 'Cliente', col2, y2);

  y2 += 15;
  track(EMISOR.rol, col1, y2, 7.3, 1.1, MUTED);
  track('CLIENTE', col2, y2, 7.3, 1.1, MUTED);

  const rowsLeft = [EMISOR.cc, EMISOR.nit, ...EMISOR.direccion, EMISOR.ciudad, EMISOR.telefono, EMISOR.contacto];
  const rowsRight = [documento ? ('C.C./NIT ' + documento) : ''];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(TEXT_DARK);
  let yy = y2 + 16;
  for (const line of rowsLeft) { if (line) doc.text(line, col1, yy); yy += 13.5; }
  let yyR = y2 + 16;
  for (const line of rowsRight) { if (line) doc.text(line, col2, yyR); yyR += 13.5; }

  y = Math.max(yy, yyR) + 14;

  // ---- LA SUMA DE ----
  const bandH = 40;
  doc.setFillColor(CREAM);
  doc.rect(MARGIN, y, W - 2 * MARGIN, bandH, 'F');
  doc.setFillColor(VERDE);
  doc.rect(MARGIN, y, 4, bandH, 'F');
  track('LA SUMA DE', MARGIN + 18, y + bandH / 2 + 3, 7.5, 1.3, MUTED);
  doc.setTextColor(TEXT_DARK);
  doc.setFont('times', 'bold');
  const totalTexto = numeroALetras(total);
  const totalTextoFit = wrapText(totalTexto, 300, 'times', 'bold', 14)[0];
  doc.setFontSize(14);
  doc.text(totalTextoFit, MARGIN + 100, y + bandH / 2 + 4);
  doc.setTextColor(VERDE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(fmtMoney(total) + ' COP', W - MARGIN - 16, y + bandH / 2 + 4, { align: 'right' });

  y += bandH + 20;

  // ---- concepto ----
  track('POR CONCEPTO DE — PRESTACIÓN DE SERVICIOS DE PRODUCCIÓN AUDIOVISUAL', MARGIN, y, 7.6, 1.0, VERDE);
  y += 20;

  const colDesc = MARGIN, colCant = MARGIN + 300, colVu = MARGIN + 355, colSub = W - MARGIN;
  track('DESCRIPCIÓN', colDesc, y, 7.3, 1.0, MUTED);
  track('CANT.', colCant, y, 7.3, 1.0, MUTED);
  track('VALOR UNITARIO', colVu, y, 7.3, 1.0, MUTED);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(MUTED);
  doc.text('SUBTOTAL', colSub, y, { align: 'right' });

  y += 9;
  doc.setDrawColor(LINE);
  doc.setLineWidth(0.7);
  doc.line(MARGIN, y, W - MARGIN, y);
  y += 18;

  for (const it of items) {
    const cant = Number(it.cantidad) || 1;
    const vu = Number(it.valor) || 0;
    const sub = cant * vu;
    doc.setTextColor(TEXT_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(it.descripcion || 'Ítem', colDesc, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(cant), colCant, y);
    doc.text(fmtMoney(vu), colVu, y);
    doc.setFont('helvetica', 'bold');
    doc.text(fmtMoney(sub), colSub, y, { align: 'right' });
    y += 20;
  }

  y += 2;
  doc.setDrawColor(LINE_SOFT);
  doc.line(MARGIN, y, W - MARGIN, y);
  y += 20;

  // ---- totales ----
  const totX = W - MARGIN - 220;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(TEXT_DARK);
  doc.text('Subtotal', totX, y);
  doc.text(fmtMoney(total), W - MARGIN, y, { align: 'right' });
  y += 16;
  doc.setTextColor(MUTED);
  doc.text('Retención en la fuente', totX, y);
  doc.text('No aplica', W - MARGIN, y, { align: 'right' });
  y += 18;

  const barH = 34;
  doc.setFillColor(BG_DARK);
  doc.rect(totX - 14, y, W - MARGIN - (totX - 14), barH, 'F');
  track('TOTAL A PAGAR', totX, y + barH / 2 + 4, 8.5, 1.4, '#FFFFFF');
  doc.setTextColor(VERDE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(fmtMoney(total), W - MARGIN - 14, y + barH / 2 + 5, { align: 'right' });

  y += barH + 26;

  // ---- bancaria / observaciones ----
  sectionLabel('INFORMACIÓN BANCARIA', col1, y);
  sectionLabel('OBSERVACIONES', col2, y);
  let yyB = y + 22;
  const banc = [['Banco', EMISOR.banco], ['Tipo de cuenta', EMISOR.tipoCuenta], ['N.º de cuenta', EMISOR.numeroCuenta], ['Titular', EMISOR.titular]];
  if (EMISOR.nequi) banc.push(['Nequi', EMISOR.nequi]);
  if (EMISOR.daviplata) banc.push(['Daviplata', EMISOR.daviplata]);
  for (const [label, val] of banc) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(MUTED);
    doc.text(label, col1, yyB);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_DARK);
    doc.text(val, col1 + colW, yyB, { align: 'right' });
    yyB += 15;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(TEXT_DARK);
  const obsLines = wrapText(observaciones || OBSERVACIONES_DEFAULT, colW, 'helvetica', 'normal', 9.5);
  let yyO = y + 22;
  for (const line of obsLines) { doc.text(line, col2, yyO); yyO += 13; }

  y = Math.max(yyB, yyO) + 24;

  // ---- firma ----
  doc.setDrawColor(LINE);
  doc.setLineWidth(0.7);
  doc.line(col1, y, col1 + 200, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(TEXT_DARK);
  doc.text(EMISOR.nombre, col1, y);
  y += 13;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(EMISOR.ccCorto, col1, y);
  eyeIcon(W - MARGIN - 26, y - 15, 26, 15, VERDE);

  // ---- footer ----
  const footH = 46;
  doc.setFillColor(CREAM);
  doc.rect(0, H - footH, W, footH, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(MUTED);
  const footLines = wrapText(
    'Este documento es una cuenta de cobro por prestación de servicios personales. No constituye factura de venta ni documento equivalente. ' +
    'Persona natural no obligada a facturar; no responsable de IVA (Art. 437 E.T.). Sujeto a retención en la fuente cuando el agente retenedor y la cuantía lo dispongan.',
    W - 2 * MARGIN, 'helvetica', 'normal', 7.6
  );
  let fy = H - footH + 16;
  for (const line of footLines) { doc.text(line, MARGIN, fy); fy += 11; }

  doc.save(`Cuenta de cobro ${numero} - ${cliente || 'cliente'}.pdf`);
}
