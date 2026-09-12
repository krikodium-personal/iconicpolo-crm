/** Money is integer cents; rates are integer basis points. BigInt intermediates and half-up rounding. */
export function integer(
  value: unknown,
  label = 'Valor',
  max = 1_000_000_000_000,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > max
  )
    throw new Error(`${label}: valor inválido.`);
  return value;
}
export function parseDecimal(value: string): number {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(normalized))
    throw new Error(
      'Ingresá un importe positivo con hasta 2 decimales, sin separador de miles.',
    );
  const [whole, fraction = ''] = normalized.split('.');
  return integer(
    Number(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))),
  );
}
export const decimal = (cents: number) => (cents / 100).toFixed(2);
export function ratio(amount: number, rate: number): number {
  integer(amount);
  integer(rate, 'Porcentaje', 10000);
  return Number((BigInt(amount) * BigInt(rate) + 5000n) / 10000n);
}
export const discounted = (price: number, bp: number) =>
  price - ratio(price, bp);
export function increaseByPercent(amount: number, bp: number): number {
  integer(amount);
  integer(bp, 'Porcentaje', 100000);
  if (!bp) throw new Error('El aumento debe ser mayor a cero.');
  return integer(
    Number((BigInt(amount) * BigInt(10000 + bp) + 5000n) / 10000n),
  );
}
export function lineTotals(
  price: number,
  cost: number,
  quantity: number,
  discount: number,
) {
  integer(price);
  integer(cost);
  integer(quantity, 'Cantidad', 10000);
  if (!quantity) throw new Error('La cantidad debe ser mayor a cero.');
  const gross = integer(price * quantity);
  const total = discounted(gross, discount);
  return {
    total,
    cost: integer(cost * quantity),
    profit: total - cost * quantity,
  };
}
export function orderDiscountPercent(order: {
  total: number;
  items: { unit_price: number; quantity: number }[];
}) {
  const gross = order.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  if (!gross) return 0;
  return Math.round((1 - order.total / gross) * 10000) / 100;
}
export function margin(price: number, cost: number): number | null {
  return price ? Math.round(((price - cost) / price) * 10000) / 100 : null;
}
export function markup(price: number, cost: number): number | null {
  return cost ? Math.round(((price - cost) / cost) * 10000) / 100 : null;
}
export const formatMoney = (cents: number, currency = 'ARS') =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
export function friendsPrice(p: {
  price: number;
  ff_discount: number;
  ff_price?: number | null;
}) {
  return p.ff_price ?? discounted(p.price, p.ff_discount);
}
export function promoPrice(p: {
  price: number;
  promo_kind: string;
  promo_value: number;
}) {
  return p.promo_kind === 'percent'
    ? discounted(p.price, p.promo_value)
    : p.promo_kind === 'manual'
      ? p.promo_value
      : p.price;
}
