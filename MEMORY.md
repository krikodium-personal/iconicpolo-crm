# Iconic CRM — memoria de continuidad

Actualizado: 2026-09-10

## Objetivo

Iconic CRM es una aplicación privada para gestionar el negocio de productos de polo, equitación y salto. La primera versión cubre catálogo, precios, margen, proveedores, clientes, pedidos, pagos, fotos y stock trazable.

Este directorio es la fuente de verdad del proyecto:

`/Users/kriko/Documents/ChatGPT/app`

## Estado actual

- La app funciona localmente con Vinext, React 19, TypeScript, Cloudflare D1 y R2.
- El catálogo real se transcribió de dos capturas provistas por el usuario.
- Los 72 productos de `data/catalogo-real.json` ya están importados en la base local, en USD.
- Hay siete categorías: monturas, botas, tacos, rodilleras, cabezadas, cascos y accesorios.
- Los cascos y el conjunto de cabezada (cabezadas, cierra bocas, pelham, riendas y riendillas) salieron de accesorios.
- El stock inicial se cargó desde `data/stock-inicial.json` (planilla de inventario del 2026-09-10) como movimientos inmutables con motivo documentado.
- En Productos se pueden seleccionar varios registros para cambiarles la categoría, asignarles el mismo proveedor o aumentarles el precio el mismo porcentaje.
- Los productos todavía no tienen fotos asignadas. El proveedor MARTIN se creó para la funda `1025FC`; el resto del catálogo sigue sin proveedor.
- La UI y el backend aceptan un precio Friends & Family exacto por producto (`ff_price`).
- Los productos con costo o precio F&F faltante muestran el valor como pendiente. Un producto sin costo no se puede vender; la opción F&F no aparece si ese precio está pendiente.
- Esos datos pendientes se van a completar editando los registros en la app.

## Datos pendientes de la fuente

Tres productos no tenían costo unitario visible:

- Taquera de cordura y cuero chica (15 tacos), SKU `1019TCC`
- Taquera de cordura y cuero mediana (25 tacos), SKU `1019TCM`
- Taquera de cordura y cuero grande (50 tacos), SKU `1019TCG`

Siete productos no tenían precio Friends & Family visible:

- Las tres taqueras anteriores
- Almohadillas interior cascos homologados, SKU `1023AL`
- Red para cascos, SKU `1024RC`
- Funda para cascos, SKU `1025FC` (tampoco tenía precio de lista en la planilla de inventario)
- Tensabotas, SKU `1025TB`
- Protectores, SKU `1026PT`

La planilla fuente repetía tres SKU. Para preservar la restricción de SKU único se guardaron así:

| Producto                               | SKU en la fuente |   SKU usado en CRM |
| -------------------------------------- | ---------------: | -----------------: |
| Montura americana combinada            |        `1001ACM` |     `1001ACM-COMB` |
| Montura bauti combinada                |        `1001BCM` |     `1001BCM-COMB` |
| Cincha neoprene tiradores de cuero JMG |     `1003CNDJMG` | `1003CNDJMG-CUERO` |

El SKU original se conserva en las características del producto.

## Cómo ejecutar

Requiere Node.js 22.13 o posterior.

```bash
npm install
npm run dev -- --host 127.0.0.1
```

Abrir `http://localhost:3000/productos`.

Este proyecto está dentro de Dropbox. En esta máquina `node_modules` puede ser un enlace a `/private/tmp/iconic-crm-runtime/node_modules` para evitar que Dropbox deshidrate dependencias. Si el enlace está roto:

```bash
unlink node_modules
npm install
```

El respaldo `.node_modules.dropbox` está ignorado por Git y no forma parte del proyecto.

## Catálogo real

La fuente editable y versionable es:

- `data/catalogo-real.json`

Con el servidor local activo, importar o actualizar por SKU:

```bash
npm run catalog:import
npm run stock:import
```

El importador `scripts/import-real-catalog.mjs` conserva fotos y opciones de los productos ya existentes. Convierte los importes a centavos y marca explícitamente los datos pendientes.

`scripts/import-stock-inicial.mjs` crea un movimiento de ingreso por SKU con motivo `Stock inicial inventario 2026-09-10`. Es idempotente: si ese motivo ya existe, no duplica unidades. Quedan sin match las riendas por par negro/marrón sueltas (SKU `#N/A` en la planilla).

`scripts/prepare-real-catalog.sql` se usó una sola vez para retirar los registros demo y cambiar la base local vacía a USD. No ejecutarlo sobre una base con datos reales sin revisar primero su contenido.

## Base de datos y reglas importantes

- El esquema fuente está en `db/schema.ts`.
- Las migraciones Drizzle están en `drizzle/`.
- `drizzle/0001_confused_korath.sql` agrega `products.ff_price`.
- Los importes se guardan como centavos enteros.
- Los porcentajes se guardan en puntos básicos; `1500` representa 15,00 %.
- El margen mostrado es `(venta - costo) / venta`.
- Cada ítem de pedido conserva una copia de nombre, SKU, costo, precio y opciones para no alterar el historial cuando cambie el catálogo.
- El stock se calcula como suma de movimientos. Los movimientos son inmutables por triggers de SQLite.
- Cerrar un pedido descuenta stock; reabrirlo devuelve stock. La base impide stock negativo.
- Los registros se archivan en lugar de borrarse.
- La moneda global solo se puede cambiar cuando no existen productos ni pedidos.

Las decisiones completas están en `docs/DECISIONES.md`.

## Mapa del código

- `app/crm.tsx`: navegación, tablas, dashboard, paneles y llamadas al API.
- `app/forms.tsx`: formularios de productos, contactos, pedidos, stock y configuración.
- `app/api/crm/route.ts`: endpoint principal del CRM.
- `app/api/images/`: carga y lectura de imágenes en R2.
- `lib/server.ts`: validaciones y mutaciones del dominio.
- `lib/money.ts`: cálculos monetarios, margen y precios.
- `lib/types.ts`: tipos compartidos.
- `db/schema.ts`: esquema relacional.
- `data/catalogo-real.json`: catálogo real reproducible.
- `scripts/import-real-catalog.mjs`: importación idempotente por SKU.
- `data/stock-inicial.json`: inventario transcrito de la planilla del 2026-09-10.
- `scripts/import-stock-inicial.mjs`: carga idempotente de stock inicial por SKU.
- `.openai/hosting.json`: bindings de D1/R2 y proyecto de Sites.

La página registra una herramienta WebMCP opcional llamada `start_crm_record`, que abre formularios sin guardar datos.

## Verificación

Después de cambiar código:

```bash
npm test
npm run lint
npm run build
```

Validar además en el navegador:

- listado y búsqueda de productos;
- creación/edición de un producto;
- precio de lista, F&F exacto y márgenes;
- bloqueo de productos con costo pendiente;
- creación y cierre de pedidos;
- movimientos de stock, stock inicial importado por SKU y rechazo de stock negativo.

## Próximos pasos sugeridos

1. Completar a mano los 3 costos, el precio de lista de `1025FC` y los precios F&F pendientes.
2. Confirmar que los tres SKU corregidos sean los identificadores definitivos.
3. Cargar proveedores y asociarlos a productos.
4. Resolver las riendas sueltas de inventario (sin SKU) o crear esos productos.
5. Incorporar fotos y características por categoría.
6. Cargar clientes y comenzar pedidos reales.
7. Revisar los textos transcritos de las capturas antes de publicar.

No desplegar ni reemplazar datos de producción sin revisar primero el catálogo y hacer una copia de seguridad de D1.
