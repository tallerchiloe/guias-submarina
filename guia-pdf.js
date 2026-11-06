/* Generador del PDF de la Guía de Despacho · Submarina Chiloé
 * Usa jsPDF + jspdf-autotable. Funciona en el navegador (window.GuiaPDF). */
(function (global) {
  'use strict';

  const AZUL = [11, 60, 93];
  const CELESTE = [232, 242, 248];
  const GRIS = [110, 110, 110];
  const BORDE = [190, 205, 215];

  function formatoNumero(n, digitos) {
    return String(n).padStart(digitos || 2, '0');
  }

  function formatoFecha(iso) {
    if (!iso) return '';
    const p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '-' + p[1] + '-' + p[0] : String(iso);
  }

  /**
   * @param lib   { jsPDF, autoTable(doc, opciones) }
   * @param datos { numero, fecha, centro, piloto, items:[{cantidad,unidad,descripcion}], observaciones }
   * @param logo  { dataUrl } o null
   */
  function generarGuiaPDF(lib, datos, logo) {
    const doc = new lib.jsPDF({ unit: 'mm', format: 'letter' });
    const tabla = opts => lib.autoTable(doc, opts);
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 15;
    const numero = typeof datos.numero === 'number' ? formatoNumero(datos.numero) : String(datos.numero);

    // ---------- Encabezado ----------
    const altoEnc = 28;
    if (logo && logo.dataUrl) {
      const p = doc.getImageProperties(logo.dataUrl);
      const esc = Math.min(112 / p.width, altoEnc / p.height);
      const w = p.width * esc, h = p.height * esc;
      doc.addImage(logo.dataUrl, p.fileType || 'PNG', M, M + (altoEnc - h) / 2, w, h);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(...AZUL);
      doc.text('SUBMARINA CHILOÉ', M, M + 15);
    }

    const bw = 64, bx = W - M - bw, by = M;
    doc.setDrawColor(...AZUL);
    doc.setLineWidth(0.6);
    doc.rect(bx, by, bw, altoEnc);
    doc.setFillColor(...AZUL);
    doc.rect(bx, by, bw, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('GUÍA DE DESPACHO', bx + bw / 2, by + 5.6, { align: 'center' });
    doc.setTextColor(...AZUL);
    doc.setFontSize(21);
    doc.text('N° ' + numero, bx + bw / 2, by + 18.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text('Documento de uso interno', bx + bw / 2, by + 24.8, { align: 'center' });

    let y = M + altoEnc + 5;
    doc.setDrawColor(...AZUL);
    doc.setLineWidth(0.8);
    doc.line(M, y, W - M, y);
    y += 5;

    // ---------- Datos ----------
    tabla({
      startY: y,
      theme: 'grid',
      margin: { left: M, right: M },
      styles: { font: 'helvetica', fontSize: 10.5, cellPadding: 2.8, lineColor: BORDE, lineWidth: 0.2, textColor: [30, 30, 30] },
      columnStyles: { 0: { cellWidth: 48, fontStyle: 'bold', fillColor: CELESTE, textColor: AZUL } },
      body: [
        ['Fecha', formatoFecha(datos.fecha)],
        ['Centro de cultivo', datos.centro || ''],
        ['Piloto', datos.piloto || '']
      ]
    });
    y = doc.lastAutoTable.finalY + 9;

    // ---------- Detalle ----------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...AZUL);
    doc.text('DETALLE DEL DESPACHO', M, y);
    y += 2.5;

    const filas = (datos.items || [])
      .filter(i => i && (i.cantidad || i.descripcion))
      .map(i => [String(i.cantidad || ''), String(i.descripcion || '')]);
    while (filas.length < 6) filas.push(['', '']);

    tabla({
      startY: y,
      theme: 'grid',
      margin: { left: M, right: M },
      head: [['Cant.', 'Detalle']],
      body: filas,
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 2.5, minCellHeight: 8, lineColor: BORDE, lineWidth: 0.2, textColor: [30, 30, 30] },
      headStyles: { fillColor: AZUL, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      columnStyles: { 0: { cellWidth: 24, halign: 'center' } },
      alternateRowStyles: { fillColor: [248, 251, 253] }
    });
    y = doc.lastAutoTable.finalY + 9;

    // ---------- Observaciones ----------
    if (datos.observaciones && String(datos.observaciones).trim()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...AZUL);
      doc.text('OBSERVACIONES', M, y);
      y += 2.5;
      tabla({
        startY: y,
        theme: 'grid',
        margin: { left: M, right: M },
        body: [[String(datos.observaciones)]],
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 3, lineColor: BORDE, lineWidth: 0.2, textColor: [30, 30, 30] }
      });
      y = doc.lastAutoTable.finalY + 9;
    }

    // ---------- Firmas ----------
    const altoF = 56;
    if (y + altoF > H - 18) { doc.addPage(); y = M; }
    const yF = Math.max(y, H - 18 - altoF);
    const anchoF = (W - 2 * M - 10) / 2;

    function cajaFirma(x, titulo, lineas) {
      doc.setDrawColor(...AZUL);
      doc.setLineWidth(0.4);
      doc.rect(x, yF, anchoF, altoF);
      doc.setFillColor(...CELESTE);
      doc.rect(x, yF, anchoF, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...AZUL);
      doc.text(titulo, x + anchoF / 2, yF + 4.8, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(40, 40, 40);
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.2);
      lineas.forEach((l, i) => {
        const ly = yF + 16 + i * 9.5;
        doc.text(l.etiqueta, x + 4, ly);
        const ex = x + 4 + doc.getTextWidth(l.etiqueta) + 2;
        if (l.valor) doc.text(l.valor, ex, ly);
        else doc.line(ex, ly + 0.8, x + anchoF - 4, ly + 0.8);
      });
      // Espacio amplio para la firma
      const lf = yF + altoF - 9;
      doc.setDrawColor(60, 60, 60);
      doc.setLineWidth(0.3);
      doc.line(x + 10, lf, x + anchoF - 10, lf);
      doc.setFontSize(8.5);
      doc.setTextColor(...GRIS);
      doc.text('Firma', x + anchoF / 2, lf + 4.5, { align: 'center' });
    }

    cajaFirma(M, 'ENTREGA', [
      { etiqueta: 'Piloto:', valor: datos.piloto || '' },
      { etiqueta: 'RUT:' }
    ]);
    cajaFirma(M + anchoF + 10, 'RETIRA (INSUMOS / ROV)', [
      { etiqueta: 'Nombre:', valor: datos.retira || '' },
      { etiqueta: 'RUT:' }
    ]);

    // ---------- Pie de página ----------
    const paginas = doc.getNumberOfPages();
    for (let i = 1; i <= paginas; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...GRIS);
      doc.text('Submarina Chiloé · Guía de Despacho N° ' + numero +
               ' · Documento de control interno, sin validez tributaria', W / 2, H - 8, { align: 'center' });
    }
    return doc;
  }

  const api = { generarGuiaPDF, formatoNumero, formatoFecha };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GuiaPDF = api;
})(typeof window !== 'undefined' ? window : globalThis);
