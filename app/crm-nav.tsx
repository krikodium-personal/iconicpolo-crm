'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { ORDER_STATUSES, modules } from '@/lib/types';

export type CrmRoute = {
  module: string;
  initialFilter: string;
  accountView: 'board' | 'resultados';
  accountYear?: number;
};

type CrmNav = CrmRoute & {
  navigate: (href: string) => void;
};

const CrmNavContext = createContext<CrmNav | null>(null);

export function parseCrmHref(href: string): CrmRoute {
  const url = new URL(href, 'http://local.crm');
  const segment = url.pathname.replace(/^\//, '').split('/').filter(Boolean)[0];
  const modRaw = segment || 'dashboard';
  const mod = modRaw === 'tablero' ? 'dashboard' : modRaw;
  const estado = url.searchParams.get('estado') || undefined;
  const vista = url.searchParams.get('vista') || undefined;
  const anio = url.searchParams.get('anio') || undefined;
  const year = Number(anio);
  return {
    module: modules.includes(mod as (typeof modules)[number]) ? mod : 'dashboard',
    initialFilter:
      mod === 'pedidos' &&
      (ORDER_STATUSES as readonly string[]).includes(estado || '')
        ? (estado as string)
        : 'all',
    accountView:
      (modRaw === 'tablero' || mod === 'dashboard') && vista === 'resultados'
        ? 'resultados'
        : 'board',
    accountYear: Number.isFinite(year) ? year : undefined,
  };
}

export function useCrmNav() {
  const value = useContext(CrmNavContext);
  if (!value) {
    throw new Error('useCrmNav must be used within CrmNavProvider');
  }
  return value;
}

export function CrmLink({
  href,
  className,
  children,
  'aria-label': ariaLabel,
  'aria-current': ariaCurrent,
  onClick,
}: {
  href: string;
  className?: string;
  children?: ReactNode;
  'aria-label'?: string;
  'aria-current'?: 'page' | undefined;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const { navigate } = useCrmNav();
  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}

export function CrmNavProvider({
  module,
  initialFilter = 'all',
  accountView = 'board',
  accountYear,
  children,
}: CrmRoute & { children: (route: CrmRoute) => ReactNode }) {
  const [route, setRoute] = useState<CrmRoute>({
    module,
    initialFilter,
    accountView,
    accountYear,
  });

  const navigate = useCallback((href: string) => {
    const url = new URL(href, window.location.origin);
    const next = parseCrmHref(`${url.pathname}${url.search}`);
    window.history.pushState(null, '', `${url.pathname}${url.search}`);
    setRoute(next);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setRoute(
        parseCrmHref(`${window.location.pathname}${window.location.search}`),
      );
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const value = useMemo<CrmNav>(
    () => ({ ...route, navigate }),
    [route, navigate],
  );

  return (
    <CrmNavContext.Provider value={value}>{children(route)}</CrmNavContext.Provider>
  );
}
