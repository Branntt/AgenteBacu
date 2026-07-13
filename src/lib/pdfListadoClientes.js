import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';

const BG_DARK = '#0C0E0D';
const LINE = '#DCD9CD';
const TEXT_DARK = '#181B19';
const MUTED = '#79807A';
const MUTED_LT = '#9AA39B';
const VERDE = '#3BA478';

const ESTADO_LABEL = { prospecto: 'Prospecto', conversacion: 'En conversación', activo: 'Proyecto activo', entregado: 'Entregado' };

export function generarListadoClientesPDF(clientes) {
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

  const fechaHoy = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  const HEADER_H = 90;
  const drawHeader = () => {
    doc.setFillColor(BG_DARK);
    doc.rect(0, 0, W, HEADER_H, 'F');
    eyeIcon(MARGIN, 24, 30, 18, VERDE);
    doc.setTextColor('#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('BACU CREATIVE', MARGIN, 60);
    track('ESTUDIO AUDIOVISUAL · DIRECCIÓN CREATIVA', MARGIN, 72, 6.8, 1.0, MUTED_LT);

    const label = 'LISTADO DE CLIENTES';
    track(label, W - MARGIN - trackWidth(label, 8, 2.2), 32, 8, 2.2, VERDE);
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(MUTED_LT);
    doc.text(fechaHoy, W - MARGIN, 50, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor('#FFFFFF');
    doc.text(`${clientes.length} ${clientes.length === 1 ? 'cliente' : 'clientes'}`, W - MARGIN, 66, { align: 'right' });
  };

  const colEstado = MARGIN, colNombre = MARGIN + 90, colProyecto = MARGIN + 260, colDoc = W - MARGIN - 90;

  const drawColHeads = (y) => {
    track('ESTADO', colEstado, y, 7.3, 1.0, MUTED);
    track('CLIENTE', colNombre, y, 7.3, 1.0, MUTED);
    track('PROYECTO / SERVICIO', colProyecto, y, 7.3, 1.0, MUTED);
    track('DOCUMENTO', colDoc, y, 7.3, 1.0, MUTED);
    doc.setDrawColor(LINE);
    doc.setLineWidth(0.7);
    doc.line(MARGIN, y + 9, W - MARGIN, y + 9);
  };

  drawHeader();
  let y = HEADER_H + 34;
  drawColHeads(y);
  y += 26;

  const FOOT_H = 40;

  for (const c of clientes) {
    const proyectoLines = wrapText(c.proyecto || '—', colDoc - colProyecto - 16, 'helvetica', 'normal', 9.5);
    const notaLines = c.nota ? wrapText(c.nota, W - MARGIN - colNombre, 'helvetica', 'normal', 8.5) : [];
    const rowH = Math.max(16, proyectoLines.length * 12) + (notaLines.length ? notaLines.length * 11 + 4 : 0) + 8;

    if (y + rowH > H - FOOT_H) {
      doc.addPage();
      drawHeader();
      y = HEADER_H + 34;
      drawColHeads(y);
      y += 26;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(VERDE);
    doc.text((ESTADO_LABEL[c.estado] || c.estado || '').toUpperCase(), colEstado, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(TEXT_DARK);
    doc.text(c.nombre || 'Sin nombre', colNombre, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(TEXT_DARK);
    let py = y;
    for (const line of proyectoLines) { doc.text(line, colProyecto, py); py += 12; }

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    doc.text(c.documento || '—', colDoc, y);

    let ny = Math.max(y, py - 12) + 13;
    if (notaLines.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED);
      for (const line of notaLines) { doc.text(line, colNombre, ny); ny += 11; }
    }

    y = Math.max(ny, py) + 10;
    doc.setDrawColor('#E7E4D9');
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y - 6, W - MARGIN, y - 6);
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(MUTED);
    doc.text(`Generado desde S.A.O BACU — página ${p} de ${totalPages}`, MARGIN, H - 18);
  }

  doc.save(`Listado de clientes - ${new Date().toISOString().slice(0, 10)}.pdf`);
}
