# Iconic CRM — memoria de continuidad

Actualizado: 2026-10-23

## Objetivo

Iconic CRM es una aplicación privada para gestionar el negocio de productos de
polo, equitación y salto: catálogo, precios, margen, proveedores, clientes,
pedidos, pagos, fotos, stock trazable y estado de cuenta.

Este directorio es la fuente de verdad del proyecto:

`/Users/kriko/Documents/ChatGPT/app`

El repo git real vive en Dropbox:

`/Users/kriko/Library/CloudStorage/Dropbox/Mi Mac (christians-MacBook-Pro.local)/Documents/ChatGPT/app`

`/Users/kriko/Documents/ChatGPT/app` es un alias. Dropbox puede dejar lecturas
o diffs brevemente desactualizados; si un archivo “vuelve” a un valor viejo,
releerlo.

## Stack y producción

- Vinext 1.0.0-beta.5 (Next-like) + React 19 + TypeScript, en Cloudflare Workers.
- D1 `iconic-crm` y R2 `iconic-crm-files`.
- Worker: `iconic-crm`. URL: `https://iconic-crm.krikodium.workers.dev`.
  Dominio de producción: `https://crm.iconicpolo.com`.
- `npm run deploy` = `vinext build` + `prepare-wrangler-deploy` +
  `wrangler deploy --config dist/server/wrangler.json --keep-vars`.
- Tras un commit **y** push, publicar en el mismo turno:

```bash
export VITE_BUILD="$(git rev-parse --short HEAD)"
npm run deploy
```

Reportar la URL del Worker. No publicar si el usuario lo pide explícitamente,
o si el deploy falla después de un reintento razonable.

- `npm run dev` usa bindings remotos (`"remote": true` en D1 y R2): el
  desarrollo local trabaja contra la **base de producción**.
- Operaciones destructivas en D1 de producción sólo con pedido explícito.
- App privada: `noindex` por metadatos + `X-Robots-Tag: noindex, nofollow`
  (`next.config.ts` y `public/_headers`). No agregar `Disallow: /` en
  `robots.txt` (está administrado por Cloudflare).

## Cómo ejecutar

Requiere Node.js 22.13 o posterior.

```bash
npm install
export VITE_BUILD="$(git rev-parse --short HEAD)"
npm run dev
```

Abrir **`http://localhost:5174/`**. Ese puerto está fijo
(`package.json` + `vite.config.ts`, `strictPort`). Si está ocupado, el
servidor falla en vez de irse al 3000 u otro. El proyecto `alquileres` a veces
toma el 5174: hay que apagarlo.

El túnel remoto de D1 se cierra solo (“Tunnel closed”). Reiniciar `npm run dev`
y comprobar con `lsof -nP -iTCP:5174 -sTCP:LISTEN`.

`.dev.vars` tiene `CRM_SHARED_KEY`. Está en `.gitignore` (el repo es público).

## Sitio público vs CRM

El sitio (iconicpolo.com) vive en
`/Users/kriko/.gemini/antigravity/scratch/iconic-polo-equipment` (Worker
`iconicpolo`).

**Las opciones del sitio mandan; los precios del CRM mandan.** El CRM se copia
del personalizador. Los precios se administran acá y el sitio los lee.

Detalle del puente: `docs/PUENTE-CON-EL-SITIO.md`.

### Secreto y rutas

Los dos Workers tienen `CRM_SHARED_KEY` (mismo valor). El sitio usa
`CRM_ORIGIN=https://crm.iconicpolo.com`. El CRM declara `CRM_SHARED_KEY` e
`ICONIC_SITE_ORIGIN` (por defecto `https://www.iconicpolo.com`).

Rutas consultadas **servidor a servidor** (nunca desde el navegador del
cliente), protegidas por `X-Iconic-Crm-Key`:

- `GET /api/solicitud?id=<32 chars>` — precarga un pedido desde una consulta
  del sitio. **No guarda el pedido**: el botón del mail es un GET y los
  proxies de correo lo disparan solos.
- `GET /api/precios` — precio de lista de los cinco configurables. **Sólo
  precio**: nunca costo ni Friends & Family.

Si la clave no coincide, ambos Workers registran 5 bytes de SHA-256 (huella),
no la longitud ni el valor.

### Traductor (`lib/solicitud.ts`)

Traduce el casco del sitio a `CascoConfigV2`. Lo que no se puede traducir no
se inventa: va a `avisos` (recuadro del formulario + notas del pedido).
Colores por hexadecimal contra la paleta de cada zona; si no está, queda el
primero y se avisa. Cubierto por `tests/solicitud.test.ts`.

Se traducen cascos y tacos. Monturas, botas y rodilleras llegan como texto y
van a las notas.

### Precios en el sitio

El sitio espeja `selectedPriceKeys()`. Si acá se agrega una opción con
recargo, hay que reflejarla en `src/data/precios.ts` del sitio o mostrará un
precio de menos.

## Casco: Print, tira de visera y fichas

### Material Print

Cuarto material del casco (`prints`). Precio: `material_prints` (sin cambio).

Un Print tiene **exactamente una** fuente:

1. `printCatalogoId` — uno de los 16 dibujos del sitio (`lib/print-catalogo.ts`,
   mismas ids y nombres). Imágenes en `public/prints/` (`<id>.webp` y
   `<id>-thumb.webp`). Si se agrega o cambia un print, actualizar los dos
   repos.
2. `printImagen` — imagen propia en R2 (`/api/images/<id>`).
3. `estampado` legado (`topographic` / `halftone` / `lightning`) — sólo para
   abrir pedidos viejos; no se ofrece al crear.

Helpers: `cascoPrintUrl`, `cascoPrintNombre`. Con Print no hay colores de
tela: sólo correaje y tapones. Sin fuente: “Elegí un print o subí una
imagen.”

`stockKey` agrupa el catálogo por `catalogo:<id>`. Una imagen propia usa la
ruta de R2. Sin print no se agrega la clave, para no romper el stock ya
cargado.

Solicitud del sitio: si `printId` está en `PRINTS_CATALOGO`, se guarda el id y
**no** se sube `printDataUrl` a R2. Si no, se sube como imagen propia.

### Tira de visera (`peakStrip`)

Zona nueva del casco (casquete, visera, banda, bajo visera, tira). Al leer un
casco viejo es **opcional**: si no viene, no se muestra. En `stockKey` entra
**sólo si tiene color**, para que el stock cargado antes de la zona siga
coincidiendo.

### Colores

“Naranja Casablanca” → “Naranja” / “Orange” (softshell, correaje, hilo).
`cascoChosenColorName` lee el nombre del catálogo, no el guardado, para que
los pedidos viejos se vean actualizados. Amarillo Girasol es `#fcce30`.

### Tipografías de bordado

`FONTS` son las 17 del sitio. Las 10 viejas están en `LEGACY_FONTS`: no se
ofrecen, se siguen aceptando al leer. No borrarlas. `FONT_DEFAULT` es
`'serif'`. Al leer un registro sin el campo se conserva `'trajan'`.

Las webfonts van por `<link>` en `app/layout.tsx`, **no** `next/font`: la
ficha las dibuja en canvas con `ctx.font`. Antes de dibujar,
`esperarTipografia()` usa `document.fonts.load`.

### Fichas exportadas (imagen / PDF)

En cascos nuevos, `configuredVisuals` **tiene** que setear `fontWeight`. Sin
eso el canvas arma `undefined 52px …` y las iniciales salen chicas, aunque en
el CRM se vean bien (el CSS cubre el tamaño). `app/ficha.tsx` usa
`tipografiaCanvas()` como red.

## Taco (desde 2026-10-27)

Quinto configurable: `cfg-taco`, categoría `tacos`. Opciones y paletas en
`lib/taco-catalog.ts` (copiadas del sitio). Precio base = taco estándar en
madera natural. Flex, peso y manija son **opcionales** (`conFlex`, `conPeso`,
`conManija`; en el sitio, botones "Estándar / Elegir") y cada uno tiene **un
único recargo** (`flex`, `peso`, `manija`) sea cual sea el valor elegido
(decisión de Christian, 2026-10-27). Si el recargo vale 0 el sitio igual ofrece
la opción, sin mostrar precio. La pintura sigue el mismo criterio: un único
recargo `pintura`, una vez si alguna zona no es Natural. Además `iniciales`.
En pantalla la manija se llama **"Grip"** (ids internos `manija`). Las
iniciales son 3 casillas con lugar fijo: una casilla vacía va como espacio en
`inicialesTexto`.

**La categoría Tacos es compartida:** además de la plantilla tiene productos
comunes (taqueras, "Tacos estándar", "Tacos personalizados"). Por eso `tacos`
**no** está en `CONFIGURED_CATEGORIES` (que esconde la categoría del selector
de productos comunes) pero sí en `KIND_BY_CATEGORY`, y `lib/server.ts` marca
como configurable sólo el id `cfg-taco`.

## Pedidos, stock y estado de cuenta

- Productos configurables (`cfg-*`) con `version`: un UPDATE debe hacer
  `version=version+1`.
- Stock: movimientos inmutables. Una entrega se vincula a la carga de la que
  sale (`source_movement_id` / `stock_load_id`). No borrar una carga con
  entregas.
- Botas: calidad (clásica / premium / texanas) × cuero (doble / triple).
  Talle estándar es el default; “a medida” es extra `a_medida` (+50 USD de
  lista). Extra `bordado`. Precio de lista: Clásica DC 500 / TC 550, Premium
  DC 650 / TC 700, Texanas aparte.
- Importes negativos en rojo (`.money-neg`). Ganancia de una cotización en
  gris (`.money-tentativo`): todavía no es plata ganada.
- Un movimiento de cuenta se puede borrar directo en D1 si el usuario lo pide
  (la UI no tiene botón para un movimiento suelto). Ejemplo: gasto
  publicitario `60fae9ae-…` del 2026-10-08, US$ 49, ya borrado.

## Convenciones de trabajo

- Responder en español, voseo (como el resto del CRM). No mezclar tuteo
  (“Elige”) con voseo (“Elegí”).
- Commitear **sólo** cuando el usuario lo pide. Excluir `.cursor/`, `output/`,
  `tsconfig.tsbuildinfo`, `.dev.vars`. Trailer:
  `Co-authored-by: Cursor <cursoragent@cursor.com>`.
- Si hay cambios ajenos sin commit en los mismos archivos, stagear sólo los
  hunks propios (aplicar sobre HEAD) y verificar en una copia limpia:

```bash
rm -rf /tmp/staged && mkdir /tmp/staged && git archive HEAD | tar -x -C /tmp/staged
# copiar sólo lo stageado
ln -s "$PWD/node_modules" /tmp/staged/node_modules
cp .dev.vars /tmp/staged/
```

Publicar desde esa copia para no subir trabajo ajeno.

- `tests/account.test.ts` falla con `node --test` (import de `./types` sin
  `.ts`). No es una regresión. Correr tests con
  `node --import tsx --test tests/*.test.ts`.
- `npx tsc --noEmit` tiene errores previos a ignorar: TS5097 (imports `.ts`),
  `app/ficha.tsx` (~463, CSS custom property), `app/forms.tsx` (~3254–3525),
  `lib/ficha.ts` si falta algún campo en un objeto de iniciales.
- Verificar UI en el navegador cuando el cambio es de interfaz. Los
  `Select` de Base UI a veces no se automatizan: cubrir con tests y decirlo.
- No tocar D1 / R2 / `CRM_SHARED_KEY` / el puente con el sitio salvo que la
  tarea lo pida.

## Mapa del código (lo que más se toca)

- `app/configure-form.tsx`: configuradores (casco, bota, montura, rodillera).
  Pedidos y stock usan el mismo `CascoForm`.
- `app/forms.tsx`: pedidos, contactos, stock, precarga de solicitud.
- `app/ficha.tsx` + `lib/ficha.ts`: ficha en pantalla y canvas (imagen/PDF).
- `lib/configure.ts`: parseo, labels, `stockKey`, precios, Print, tipografías.
- `lib/casco-catalog.ts` + `lib/casco-catalogo.json`: paletas y materiales.
- `lib/print-catalogo.ts` + `public/prints/`: 16 prints del sitio.
- `lib/solicitud.ts` + `app/api/solicitud/` + `app/api/precios/`: puente.
- `docs/PUENTE-CON-EL-SITIO.md`: contrato del puente.
- `docs/DECISIONES.md`: decisiones de dominio más viejas.

## Verificación

```bash
node --import tsx --test tests/*.test.ts
npx tsc --noEmit -p .
npm run build
```

`npm test` (script del package) sigue fallando en `tests/account.test.ts` por
el import sin extensión; no usarlo como señal de regresión.

## Pendiente / no commiteado

- `app/webapp.tsx`: el service worker sólo se registra en producción. Quedó
  sin commit a propósito (no era parte del arreglo de fichas ni del puerto).
- Completar a mano costos / F&F que siguen pendientes en el catálogo
  (taqueras, almohadillas, red, funda, tensabotas, protectores). Ver
  `docs/DECISIONES.md` y el catálogo.
