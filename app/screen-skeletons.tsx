import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

function MetricSkeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="metrics" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <article className="metric skel-metric" key={i}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-9 w-36" />
          <Skeleton className="mt-3 h-3 w-44" />
        </article>
      ))}
    </div>
  );
}

function ToolbarSkeleton({ filters = 1 }: { filters?: number }) {
  return (
    <div className="toolbar" aria-hidden>
      <Skeleton className="h-11 min-w-0 flex-1 rounded-lg" />
      {Array.from({ length: filters }, (_, i) => (
        <Skeleton key={i} className="h-11 w-40 shrink-0 rounded-lg" />
      ))}
      <Skeleton className="h-11 w-28 shrink-0 rounded-lg" />
    </div>
  );
}

function RecordCardSkeleton() {
  return (
    <article className="record-card skel-record-card" aria-hidden>
      <div className="record-card-top">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="skel-stack">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="ml-auto size-8 rounded-md" />
      </div>
      <div className="skel-stack">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="skel-facts">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </article>
  );
}

function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <TableRow aria-hidden>
      {Array.from({ length: cols }, (_, i) => (
        <TableCell key={i}>
          <Skeleton className={`h-4 ${i === 0 ? 'w-32' : 'w-20'}`} />
        </TableCell>
      ))}
    </TableRow>
  );
}

function RecordsSkeleton({
  filters = 1,
  cols = 5,
  rows = 6,
}: {
  filters?: number;
  cols?: number;
  rows?: number;
}) {
  return (
    <section className="panel records" aria-busy="true" aria-label="Cargando">
      <ToolbarSkeleton filters={filters} />
      <div className="desktop-table">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: cols }, (_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-3 w-16" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }, (_, i) => (
              <TableRowSkeleton key={i} cols={cols} />
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="record-card-list">
        {Array.from({ length: 4 }, (_, i) => (
          <RecordCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

function TypeCardsSkeleton() {
  return (
    <div className="type-card-grid" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <article className="type-card" key={i}>
          <div className="type-card-copy skel-stack">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="type-card-actions">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </div>
        </article>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="skel-screen"
      aria-busy="true"
      aria-label="Cargando vista general"
    >
      <MetricSkeletons />
      <div className="dashboard-grid">
        <section className="panel open-orders">
          <div className="panel-heading">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="skel-carousel">
            {Array.from({ length: 3 }, (_, i) => (
              <div className="skel-order-card" key={i}>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-3 h-6 w-40" />
                <Skeleton className="mt-4 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-48" />
                <div className="skel-row skel-row-gap">
                  <Skeleton className="h-8 w-20 rounded-md" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel flow-panel">
          <div className="panel-heading">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="pipeline skel-pipeline">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-3 h-8 w-12" />
                <Skeleton className="mt-3 h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function TableroSkeleton() {
  return (
    <div
      className="account-board skel-screen"
      aria-busy="true"
      aria-label="Cargando estado de cuenta"
    >
      <Skeleton className="skel-hint" />
      <div className="skel-row skel-year-seg">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-20 rounded-md" />
        ))}
      </div>
      <MetricSkeletons />
      <section className="panel account-sheet">
        <div className="panel-heading">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="skel-panel-body">
          <div className="skel-row">
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
          <Skeleton className="skel-result-block" />
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="skel-movements">
          {Array.from({ length: 4 }, (_, i) => (
            <div className="skel-movement-row" key={i}>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="record-card-list">
          {Array.from({ length: 3 }, (_, i) => (
            <RecordCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function TareasSkeleton() {
  return (
    <section
      className="panel records skel-empty-panel"
      aria-busy="true"
      aria-label="Cargando tareas"
    >
      <div className="skel-empty">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3 w-72 max-w-full" />
        <Skeleton className="h-3 w-64 max-w-full" />
        <Skeleton className="h-3 w-56 max-w-full" />
      </div>
    </section>
  );
}

function ProductosSkeleton() {
  return (
    <div
      className="skel-screen"
      aria-busy="true"
      aria-label="Cargando productos"
    >
      <TypeCardsSkeleton />
      <RecordsSkeleton filters={2} cols={6} rows={6} />
    </div>
  );
}

function PedidosSkeleton() {
  return <RecordsSkeleton filters={1} cols={7} rows={6} />;
}

function ContactsSkeleton() {
  return <RecordsSkeleton filters={0} cols={5} rows={6} />;
}

export function ModuleSkeleton({ module }: { module: string }) {
  switch (module) {
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'tablero':
      return <TableroSkeleton />;
    case 'tareas':
      return <TareasSkeleton />;
    case 'productos':
      return <ProductosSkeleton />;
    case 'pedidos':
      return <PedidosSkeleton />;
    case 'clientes':
    case 'proveedores':
      return <ContactsSkeleton />;
    default:
      return <RecordsSkeleton />;
  }
}

export function AuthSkeleton() {
  return (
    <div className="auth-screen" aria-busy="true" aria-label="Cargando">
      <div className="skel-auth">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3 w-56" />
        <div className="skel-stack skel-auth-fields">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
