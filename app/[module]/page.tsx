import CRM from '../crm';
import { modules } from '@/lib/types';
import { notFound } from 'next/navigation';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<{ estado?: string }>;
}) {
  const { module } = await params;
  if (!modules.includes(module as (typeof modules)[number])) notFound();
  const { estado } = await searchParams;
  const initialFilter =
    module === 'pedidos' &&
    ['nuevo', 'abierto', 'en producción', 'cerrado'].includes(estado || '')
      ? estado
      : 'all';
  return (
    <CRM
      key={module + initialFilter}
      module={module}
      initialFilter={initialFilter}
    />
  );
}
