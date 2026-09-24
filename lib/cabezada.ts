/** Cabezada SKUs split stock by number of reins (riendas). */

export type CabezadaConfig = { riendas: 1 | 2 };

export function isCabezadaProduct(product: {
  category?: string;
  name?: string;
}) {
  const category = (product.category || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  return (
    category === 'cabezadas' ||
    category === 'cabezada' ||
    name.includes('cabezada')
  );
}

export function parseCabezadaConfig(raw: unknown): CabezadaConfig {
  const value =
    raw && typeof raw === 'object'
      ? (raw as { riendas?: unknown }).riendas
      : undefined;
  const n = typeof value === 'string' ? Number(value) : value;
  if (n === 1 || n === 2) return { riendas: n };
  throw new Error('Elegí si la cabezada tiene 1 o 2 riendas.');
}

export function tryParseCabezadaConfig(
  raw: unknown,
): CabezadaConfig | null {
  try {
    return parseCabezadaConfig(raw);
  } catch {
    return null;
  }
}

export function cabezadaStockKey(config: CabezadaConfig) {
  return JSON.stringify({ riendas: config.riendas });
}

export function cabezadaRiendasLabel(config: CabezadaConfig | null | undefined) {
  if (!config) return '';
  return config.riendas === 1 ? '1 rienda' : '2 riendas';
}

export const CABEZADA_RIENDAS_OPTIONS = [
  { value: '1', label: '1 rienda' },
  { value: '2', label: '2 riendas' },
] as const;
