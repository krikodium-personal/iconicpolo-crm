import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  formatPublicPrice,
  loadPublicPriceList,
} from '@/lib/public-price-list';
import { PublicListaView } from './view';

export const metadata: Metadata = {
  title: 'Lista de precios · Iconic Polo',
  description: 'Precios especiales para organizaciones.',
  robots: { index: false, follow: false },
};

export default async function PublicListaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lista = await loadPublicPriceList(id);
  if (!lista) notFound();

  return (
    <PublicListaView
      lista={{
        ...lista,
        groups: lista.groups.map((group) => ({
          ...group,
          items: group.items.map((item) => ({
            ...item,
            detail: item.detail || '',
            addon: !!item.addon,
            listPriceLabel: formatPublicPrice(item.listPrice, lista.currency),
            priceLabel: formatPublicPrice(item.price, lista.currency),
          })),
        })),
      }}
    />
  );
}
