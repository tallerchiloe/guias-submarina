# Guías de Despacho · Submarina Chiloé

Página web (GitHub Pages) para crear guías de despacho en PDF con número correlativo
(01, 02, 03…), logo de Submarina Chiloé en el encabezado, y base de datos en Google Drive.

**Cómo funciona:** la página arma el PDF → un script de Google (Apps Script) entrega el
número siguiente, registra la guía en una planilla de Drive y guarda una copia del PDF
en una carpeta de Drive.

```
index.html               ← la página (formulario + historial)
guia-pdf.js              ← diseño del PDF
logo.png                 ← TU LOGO (agrégalo con este nombre)
Code.gs ← "base de datos" en Google Drive
```

## 1. Base de datos en Google Drive (10 min, una sola vez)

1. Entra a <https://script.google.com> con la cuenta de Google de la empresa → **Nuevo proyecto**.
2. Borra lo que aparece y pega todo el contenido de `Code.gs`. Guarda (💾).
3. Arriba, elige la función **`configurar`** y presiona **Ejecutar**. Acepta los permisos
   (si dice "Google no verificó esta app": *Configuración avanzada → Ir al proyecto*).
4. En el **Registro de ejecución** aparece tu **CLAVE**. Anótala.
   En tu Drive se crea la carpeta *Submarina Chiloé - Guías de Despacho* con la planilla y la subcarpeta *PDF*.
5. **Implementar → Nueva implementación →** tipo **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
6. Copia la **URL de la aplicación web** (termina en `/exec`).

## 2. Página en GitHub Pages

1. En GitHub crea un repositorio nuevo (ej. `guias-submarina`).
2. **Add file → Upload files**: sube `index.html`, `guia-pdf.js`, `logo.png` (y si quieres la carpeta `google-apps-script` como respaldo).
3. **Settings → Pages →** Source: *Deploy from a branch*, Branch: `main` / `(root)` → Save.
4. En 1–2 minutos queda en `https://TU-USUARIO.github.io/guias-submarina/`.

## 3. Primer uso

Abre la página, presiona **⚙ Configurar**, pega la URL y la CLAVE → *Guardar y probar*.
Se hace una vez por computador/celular.

## Notas

- El correlativo lo asigna Google con bloqueo, así que nunca se repiten números aunque dos personas generen a la vez.
- Para empezar en otro número (ej. si ya llevan 57 guías en papel), cambia `NUMERO_INICIAL` en `Code.gs` y vuelve a implementar (*Implementar → Gestionar implementaciones → Editar → Nueva versión*).
- Cada vez que cambies `Code.gs` debes publicar una **nueva versión** de la implementación.
- "Vista previa" genera un borrador sin gastar número.
- Documento de control interno: no reemplaza la Guía de Despacho Electrónica del SII.
