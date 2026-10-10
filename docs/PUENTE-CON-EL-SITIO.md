# Puente con iconicpolo.com

Estado al 2026-10-10. Este documento describe todo lo que se agregó al CRM para
conectarlo con el sitio público. Nada de esto estaba en el proyecto antes.

El sitio vive en `/Users/kriko/.gemini/antigravity/scratch/iconic-polo-equipment`
(Worker de Cloudflare `iconicpolo`). El CRM es el Worker `iconic-crm`.

---

## 1. Principio que ordena todo

**Las opciones del sitio son las que mandan; los precios del CRM son los que
mandan.** El sitio es lo que ve el cliente, así que su catálogo de opciones es
el de referencia y el CRM se adapta. Los precios son al revés: se administran
en el CRM y el sitio los lee.

---

## 2. Secreto compartido

Los dos Workers tienen el secreto **`CRM_SHARED_KEY`**, con el mismo valor. Es
lo único que protege las dos rutas nuevas. En el sitio además está la variable
`CRM_ORIGIN` (apunta a `https://crm.iconicpolo.com`).

En el CRM, `env.d.ts` declara `CRM_SHARED_KEY` e `ICONIC_SITE_ORIGIN`
(por defecto `https://www.iconicpolo.com`).

Para desarrollo local hace falta un `.dev.vars` con `CRM_SHARED_KEY`.

**Cuidado:** un encabezado ausente produce el mismo 401 que una clave
equivocada. Por eso, cuando la comparación falla, los dos Workers registran una
**huella** (5 bytes de SHA-256) de la clave; con un `wrangler tail` se ve si
difieren o si no llegó ninguna. No se registra la longitud.

---

## 3. Ruta nueva: `GET /api/solicitud?id=<32 chars>`

Archivo: `app/api/solicitud/route.ts`

Precarga un pedido a partir de una solicitud hecha en el sitio.

**Flujo completo:** el cliente arma un casco en iconicpolo.com y envía la
consulta. El Worker del sitio guarda la solicitud en su KV (prefijo `s:`, vence
a los 90 días) y el mail que llega a info@iconicpolo.com trae un botón
**"Crear el pedido en el CRM"** que apunta a
`crm.iconicpolo.com/pedidos?solicitud=<id>`.

Al abrir ese enlace, el CRM:

1. Exige sesión iniciada (401 si no hay).
2. Le pide la solicitud al sitio de servidor a servidor, con el encabezado
   `X-Iconic-Crm-Key`.
3. Sube a R2 las capturas del diseño y el logo del club, y los registra en
   `images` (la configuración del CRM guarda rutas `/api/images/<id>`, no
   archivos).
4. Traduce el casco al modelo del CRM (ver punto 4).
5. Busca un contacto con ese email; si no existe, prepara los datos para crear
   uno nuevo.
6. Devuelve un `OrderPrefill` y el formulario de pedido se abre cargado.

**El botón NO crea el pedido.** Es deliberado: un GET de un mail lo disparan
los proxies de imágenes y los antivirus sin que nadie haga clic, y se llenaría
de pedidos fantasma. Además `saveOrder` exige cliente, producto del catálogo y
costo y precio definidos, cosas que una solicitud web no trae.

Los errores son específicos a propósito (clave rechazada, sitio caído,
solicitud vencida); un "no se pudo" genérico obliga a ir a los logs.

---

## 4. El traductor: `lib/solicitud.ts`

Convierte el casco del personalizador del sitio a `CascoConfigV2`.

- **Colores:** el sitio manda `{hex, es, en}`, sin paleta ni posición. Se
  resuelven por hexadecimal contra la paleta que corresponde a cada zona. Si un
  color no está, **no se elige uno parecido**: queda el primero de la paleta y
  se emite un aviso, para que no pase un color inventado por uno elegido.
- **Zonas:** casquete→top, visera→peak, bandaVisera→peakBand, bajoVisera→
  underPeak, tiraVisera→peakStrip, correaje→strap, airholes→airholes.
- **Avisos:** todo lo que no se pudo traducir vuelve en `avisos` y se muestra
  en un recuadro arriba del formulario, además de quedar en las notas del
  pedido. Nunca se inventa un valor en silencio.
- **Notas:** `notasDeSolicitud()` arma el texto del pedido (club, país, notas
  del cliente, y las piezas que no son casco, que el sitio manda sólo como
  texto). `notasDeCliente()` arma club y país para la ficha del contacto nuevo.

Cubierto por `tests/solicitud.test.ts` (15 casos). Incluye uno que verifica que
lo traducido pasa `parseCasco` sin completar nada a mano.

**Sólo se traducen cascos.** Monturas, botas y rodilleras llegan como texto y
se vuelcan en las notas: el sitio todavía no manda su configuración
estructurada.

---

## 5. Ruta nueva: `GET /api/precios`

Archivo: `app/api/precios/route.ts`

Entrega los precios de los cuatro configurables para que el sitio los muestre
en su personalizador. Misma protección por `X-Iconic-Crm-Key`.

**Devuelve sólo el precio de lista.** El costo y el precio Friends & Family no
salen de acá, aunque estén en el mismo registro. Esto está verificado sobre la
respuesta real: no se filtra ningún costo.

Formato: `{ moneda, leido, productos: { casco: { base, extras: {clave: precio} }, ... } }`,
importes en centavos. Un producto con precio de lista "Pendiente de definir" se
omite.

Del lado del sitio, su Worker cachea la respuesta cinco minutos y, si el CRM no
contesta, sirve la última copia mientras no tenga más de un día.

**El sitio espeja `selectedPriceKeys()`** para saber qué extras aplican a lo
que eligió el cliente. Es una duplicación real: si acá se agrega una opción con
recargo, hay que reflejarla allá o el sitio mostrará un precio de menos. El
sitio avisa cuando encuentra una clave que no conoce.

---

## 6. Tipografías de bordado: ahora son las del sitio

`lib/configure.ts`

`FONTS` pasó de las 10 de antes (Trajan, Didot, Bodoni…) a las **17 del sitio**
(serif, georgia, playfair, alegreya, cinzel, sans, arimo, verdana, trebuchet,
oswald, fjalla, syncopate, coda, alfa, fugaz, mono, rubikmono). Las dos listas
no compartían un solo id, así que lo que elegía el cliente no se podía mapear.

- Las 10 viejas quedaron en **`LEGACY_FONTS`**: no se ofrecen, pero se siguen
  aceptando al leer pedidos guardados. Cambiar el catálogo no puede romper la
  ficha ni el historial de un pedido existente.
- `FONT_IDS` es la unión, y es lo que validan los `oneOf` al parsear.
- `FONT_DEFAULT` es `'serif'`, la de arranque del sitio. En los `default*` de
  montura, rodillera y bota se usa `FONT_DEFAULT`; en la **lectura** de datos
  guardados sin el campo se conserva `'trajan'`, que es lo que mostraban.
- **`FONT_WEIGHTS` / `fontWeight()`**: las display (Alfa Slab One, Fugaz One,
  Fjalla, Rubik Mono) vienen en un solo grosor; ponerlas en negrita las
  engorda. Se aplica en la vista previa y en el canvas de la ficha.

**Carga de las webfonts:** once de esas tipografías se bajan de Google Fonts
por hoja de estilo en `app/layout.tsx`, **no con `next/font`**. Es a propósito:
la ficha dibuja las iniciales en un canvas con `ctx.font`, que necesita el
nombre real de la familia y no una variable CSS.

**`esperarTipografia()` en `app/ficha.tsx`**: antes de dibujar en el canvas se
espera con `document.fonts.load`. Sin eso la ficha impresa salía con la
tipografía alternativa sin avisar. Verificado: tras la espera el canvas mide 76 px
para Playfair contra 83 de Georgia.

---

## 7. Precarga del pedido en la interfaz

- `app/[[...slug]]/page.tsx`, `app/crm-nav.tsx`, `app/crm-app.tsx`: el
  parámetro `?solicitud=` viaja hasta el componente. Sólo se acepta en
  `/pedidos`.
- `app/crm.tsx`: al llegar con ese parámetro (con sesión y datos ya cargados)
  pide la precarga **una sola vez** y abre el panel de pedido nuevo.
- `app/forms.tsx`: `OrderForm` acepta una prop `prefill`. Inicializa cliente
  (existente o nuevo), notas e ítems. `prefillDraftItems()` descarta la pieza
  cuya plantilla `cfg-*` no esté en el catálogo y lo avisa. El cliente nuevo se
  crea con club y país en sus notas.
- `app/globals.css`: clase `.solicitud-aviso` para el recuadro de avisos.

El formulario **no guarda nada** hasta que el usuario confirma. Si falta el
talle del casco, la línea lo marca y el guardado lo exige, como con cualquier
pedido.

---

## 8. Cosas a tener presentes

**Estos archivos estaban sin commitear** y un deploy desde otra copia los borra
de producción (ya pasó una vez: el CRM perdió `/api/precios` y el sitio quedó
sin precios):

```
app/api/precios/   app/api/solicitud/   lib/solicitud.ts   tests/solicitud.test.ts
```

**`npm run dev` usa los bindings remotos** (`"remote": true` en D1 y R2): el
servidor de desarrollo trabaja sobre la base de producción.

**`tests/account.test.ts` falla desde antes de este trabajo**, por un import de
`./types` sin extensión `.ts` que `node --test` necesita. Los módulos que usan
los tests deben importarse con extensión explícita aunque oxlint se queje
(TS5097).

**El logo del cliente se sube dos veces** por solicitud: como "Logo a bordar"
(la vista que va en el mail) y como "logo del club" (el archivo original). Sin
resolver si conviene dejar las dos.
