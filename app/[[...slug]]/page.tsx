import CrmApp from '../crm-app';
import { accountViewOf, modules, ORDER_STATUSES } from '@/lib/types';
import { notFound } from 'next/navigation';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{
    estado?: string;
    vista?: string;
    anio?: string;
    solicitud?: string;
  }>;
}) {
  const { slug } = await params;
  if (slug && slug.length > 1) notFound();
  const moduleRaw = slug?.[0] || 'dashboard';
  if (!modules.includes(moduleRaw as (typeof modules)[number])) notFound();
  const module = moduleRaw === 'tablero' ? 'dashboard' : moduleRaw;
  const { estado, vista, anio, solicitud } = await searchParams;
  const initialFilter =
    module === 'pedidos' &&
    (ORDER_STATUSES as readonly string[]).includes(estado || '')
      ? estado!
      : 'all';
  const year = Number(anio);
  return (
    <CrmApp
      module={module}
      initialFilter={initialFilter}
      accountView={
        moduleRaw === 'tablero' || module === 'dashboard'
          ? accountViewOf(vista)
          : 'board'
      }
      accountYear={Number.isFinite(year) ? year : undefined}
      solicitud={module === 'pedidos' ? solicitud : undefined}
    />
  );
}
