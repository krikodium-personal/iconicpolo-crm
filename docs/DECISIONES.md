# Decisiones funcionales y contables

Estas reglas destraban la primera versión. Están centralizadas para que se puedan cambiar sin reescribir los módulos.

## Dinero y porcentajes

- El proyecto base comienza en ARS; el catálogo real de Iconic cargado en desarrollo usa USD. La moneda se guarda por pedido para que un cambio futuro no reinterprete el historial. Cambiar la moneda global sólo está permitido antes del primer producto o pedido; esta versión no convierte importes.
- Todos los importes se guardan como centavos enteros. Los porcentajes se guardan en puntos básicos: `1500` representa `15,00 %`. Los cálculos intermedios usan enteros grandes y redondeo comercial a medio hacia arriba.
- `ganancia = precio de venta - costo`.
- `margen sobre venta = ganancia / precio de venta`. Este es el “margen de Iconic”.
- `rentabilidad sobre costo = ganancia / costo`. Se muestra aparte para evitar confundir dos indicadores distintos.
- Friends & Family admite un precio final exacto por producto y conserva el descuento porcentual como alternativa. Los precios promocionales pueden ser un descuento sobre lista o un precio final manual.
- En un pedido, primero se toma el precio base elegido, luego se suman los adicionales y al final se aplica el descuento del ítem.
- Los importes son comerciales y no incluyen un desglose de IVA, percepciones, comisiones de pago ni gastos operativos. “Ganancia” es por lo tanto ganancia bruta del producto, no resultado contable neto.

## Pedidos, pagos y stock

- El estado de pago se deriva del importe cobrado: cero es “no pagado”, un importe menor al total es “pago parcial” y un importe igual al total es “pagado”. No se admite cobrar más que el total.
- Cada ítem copia nombre, SKU, costo, precio unitario, características y adicionales al momento de crearlo. Editar el catálogo no cambia pedidos anteriores.
- El stock es la suma de movimientos inmutables. Una corrección genera un movimiento inverso; no edita el historial.
- Los estados nuevo, abierto y en producción no reservan stock. Al cerrar un pedido se registra una salida por cada ítem. Reabrirlo registra la devolución correspondiente.
- La base de datos rechaza atómicamente un cierre que dejaría stock negativo.
- Los registros se archivan en lugar de borrarse. Pedidos cerrados o con cobros no pueden archivarse.

## Extensibilidad

- Las categorías iniciales son monturas, botas, tacos, rodilleras, cabezadas, cascos y accesorios.
- Cada categoría puede declarar características con valores cerrados o texto libre. Los pedidos guardan una copia de la selección para conservar su historia si la categoría cambia.
- La lista de productos admite selección múltiple para cambiar categoría, asignar el mismo proveedor o aumentar precios un mismo porcentaje. El aumento usa redondeo comercial a medio hacia arriba y no modifica el costo. Un producto con precio de lista pendiente se omite.
- Cada producto admite hasta 10 fotos y adicionales con su propio precio, costo y foto. Los binarios se guardan en almacenamiento de objetos; la base relacional conserva sólo metadatos y referencias.
- Esta primera etapa asume un único espacio de trabajo privado. Roles, permisos internos, impuestos desglosados, reservas de stock, compras a proveedores y contabilidad formal quedan para decisiones posteriores.
