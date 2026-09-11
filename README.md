# Iconic CRM

Primera versión de un CRM para productos de polo, equitación y salto. Incluye dashboard, proveedores, catálogo con precios y fotos, stock trazable, clientes con seguimiento comercial y pedidos con fotografía histórica de costos y precios.

## Desarrollo

Requiere Node.js 22.13 o posterior.

```bash
npm install
npm run dev
```

Los datos estructurados usan una base SQLite compatible con Cloudflare D1. Las imágenes usan almacenamiento compatible con Cloudflare R2. El esquema se encuentra en `db/schema.ts` y la migración generada en `drizzle/`.

## Verificación

```bash
npm test
npm run lint
npm run build
```

Las reglas funcionales están documentadas en [docs/DECISIONES.md](docs/DECISIONES.md).

## Catálogo real y continuidad

Con el servidor local activo, `npm run catalog:import` crea o actualiza por SKU los productos definidos en `data/catalogo-real.json`. `npm run stock:import` carga el inventario de `data/stock-inicial.json` como movimientos de ingreso, también por SKU. El estado, las decisiones y los próximos pasos para continuar el trabajo en otro editor están en [MEMORY.md](MEMORY.md).
