import CRM from '../crm';
import { modules, ORDER_STATUSES } from '@/lib/types';
import { notFound } from 'next/navigation';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<{ estado?: string; vista?: string; anio?: string }>;
}) {
  const { module } = await params;
  if (!modules.includes(module as (typeof modules)[number])) notFound();
  const { estado, vista, anio } = await searchParams;
  const initialFilter =
    module === 'pedidos' &&
    (ORDER_STATUSES as readonly string[]).includes(estado || '')
      ? estado
      : 'all';
  const year = Number(anio);
  return (
    <CRM
      key={module + initialFilter + (vista || '') + (anio || '')}
      module={module}
      initialFilter={initialFilter}
      accountView={
        module === 'tablero' && vista === 'resultados' ? 'resultados' : 'board'
      }
      accountYear={Number.isFinite(year) ? year : undefined}
    />
  );
}
