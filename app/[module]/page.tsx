import CRM from '../crm';
import { modules, ORDER_STATUSES } from '@/lib/types';
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
    (ORDER_STATUSES as readonly string[]).includes(estado || '')
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
