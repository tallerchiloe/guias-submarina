/**
 * Guías de Despacho · Submarina Chiloé
 * Backend en Google Apps Script: guarda la base de datos en una planilla
 * de Google Drive, entrega el número correlativo (01, 02, 03...) y guarda
 * los PDF en una carpeta de Drive.
 *
 * PASOS:
 *  1. Pega este código en un proyecto nuevo de https://script.google.com
 *  2. Ejecuta la función "configurar" (una sola vez) y autoriza los permisos.
 *  3. Mira el registro (Ver > Registros de ejecución): ahí sale tu CLAVE.
 *  4. Implementar > Nueva implementación > Aplicación web
 *     Ejecutar como: Yo · Quién tiene acceso: Cualquier persona
 *  5. Copia la URL de la aplicación web y pégala en la página (botón ⚙).
 */

const NUMERO_INICIAL = 1;          // Primera guía = 01
const NOMBRE_HOJA = 'Guias';
const ENCABEZADOS = ['N° Guía', 'Fecha', 'Centro de cultivo', 'Piloto',
                     'Detalle', 'Observaciones', 'Creada el', 'PDF'];

/** Ejecutar UNA vez: crea carpeta, planilla y clave de acceso. */
function configurar() {
  const p = PropertiesService.getScriptProperties();

  let carpeta;
  if (p.getProperty('FOLDER_ID')) {
    carpeta = DriveApp.getFolderById(p.getProperty('FOLDER_ID'));
  } else {
    carpeta = DriveApp.createFolder('Submarina Chiloé - Guías de Despacho');
    p.setProperty('FOLDER_ID', carpeta.getId());
  }

  if (!p.getProperty('PDF_FOLDER_ID')) {
    const pdfs = carpeta.createFolder('PDF');
    p.setProperty('PDF_FOLDER_ID', pdfs.getId());
  }

  if (!p.getProperty('SHEET_ID')) {
    const ss = SpreadsheetApp.create('Base de datos - Guías de Despacho');
    const hoja = ss.getSheets()[0];
    hoja.setName(NOMBRE_HOJA);
    hoja.appendRow(ENCABEZADOS);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, ENCABEZADOS.length)
        .setFontWeight('bold').setBackground('#0b3c5d').setFontColor('#ffffff');
    hoja.getRange('A:A').setNumberFormat('00');
    DriveApp.getFileById(ss.getId()).moveTo(carpeta);
    p.setProperty('SHEET_ID', ss.getId());
  }

  if (!p.getProperty('CLAVE')) {
    p.setProperty('CLAVE', Utilities.getUuid().replace(/-/g, '').slice(0, 10));
  }

  Logger.log('Listo ✅');
  Logger.log('CLAVE de acceso (pégala en la página): ' + p.getProperty('CLAVE'));
  Logger.log('Carpeta en Drive: ' + carpeta.getUrl());
  Logger.log('Planilla: ' + SpreadsheetApp.openById(p.getProperty('SHEET_ID')).getUrl());
}

function doGet() {
  return ContentService.createTextOutput('API Guías de Despacho Submarina Chiloé funcionando.');
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const p = PropertiesService.getScriptProperties();
    if (!p.getProperty('CLAVE')) throw new Error('Falta ejecutar "configurar" en Apps Script.');
    if (req.clave !== p.getProperty('CLAVE')) throw new Error('Clave incorrecta.');

    switch (req.accion) {
      case 'ping':       return json({ ok: true });
      case 'crear':      return json(crearGuia(req.datos || {}));
      case 'guardarPdf': return json(guardarPdf(req.numero, req.nombre, req.base64));
      case 'listar':     return json(listar());
      default: throw new Error('Acción desconocida: ' + req.accion);
    }
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

/** Reserva el siguiente número correlativo y registra la guía. */
function crearGuia(d) {
  if (!d.centro) throw new Error('Falta el centro de cultivo.');
  if (!d.piloto) throw new Error('Falta el piloto.');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000); // evita números repetidos si dos personas crean a la vez
  try {
    const hoja = obtenerHoja();
    const numero = Math.max(ultimoNumero(hoja) + 1, NUMERO_INICIAL);
    const detalle = (d.items || [])
      .map(i => [i.cantidad, i.unidad, i.descripcion].filter(Boolean).join(' '))
      .join(' | ');
    hoja.appendRow([numero, d.fecha || '', d.centro, d.piloto, detalle,
                    d.observaciones || '', new Date(), '']);
    SpreadsheetApp.flush();
    return { ok: true, numero: numero };
  } finally {
    lock.releaseLock();
  }
}

function guardarPdf(numero, nombre, base64) {
  if (!numero || !base64) throw new Error('Faltan datos del PDF.');
  const p = PropertiesService.getScriptProperties();
  const carpeta = DriveApp.getFolderById(p.getProperty('PDF_FOLDER_ID'));
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'application/pdf',
                                 nombre || ('Guia_' + numero + '.pdf'));
  const archivo = carpeta.createFile(blob);

  const hoja = obtenerHoja();
  const fila = filaDeNumero(hoja, Number(numero));
  if (fila) hoja.getRange(fila, 8).setValue(archivo.getUrl());
  return { ok: true, url: archivo.getUrl() };
}

function listar() {
  const hoja = obtenerHoja();
  const n = hoja.getLastRow() - 1;
  if (n < 1) return { ok: true, guias: [], centros: [], pilotos: [] };
  const filas = hoja.getRange(2, 1, n, 8).getValues();
  const tz = Session.getScriptTimeZone();
  const fmt = v => v instanceof Date ? Utilities.formatDate(v, tz, 'dd-MM-yyyy') : String(v || '');
  const unicos = col => [...new Set(filas.map(f => String(f[col] || '').trim()).filter(Boolean))].sort();

  const guias = filas.slice(-100).reverse().map(f => ({
    numero: f[0], fecha: fmt(f[1]), centro: f[2], piloto: f[3], pdf: f[7]
  }));
  return { ok: true, guias: guias, centros: unicos(2), pilotos: unicos(3) };
}

// ---------- utilidades ----------
function obtenerHoja() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return SpreadsheetApp.openById(id).getSheetByName(NOMBRE_HOJA);
}

function ultimoNumero(hoja) {
  const n = hoja.getLastRow() - 1;
  if (n < 1) return 0;
  return hoja.getRange(2, 1, n, 1).getValues()
    .reduce((max, [v]) => Math.max(max, Number(v) || 0), 0);
}

function filaDeNumero(hoja, numero) {
  const n = hoja.getLastRow() - 1;
  if (n < 1) return 0;
  const vals = hoja.getRange(2, 1, n, 1).getValues();
  for (let i = vals.length - 1; i >= 0; i--) if (Number(vals[i][0]) === numero) return i + 2;
  return 0;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
