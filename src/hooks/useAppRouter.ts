import { useState, useEffect, useCallback } from 'react';

export type AppRoute =
  | { page: 'landing' }
  | { page: 'login'; redirect?: string }
  | { page: 'signup'; redirect?: string }
  | { page: 'dashboard'; tab: string };

const VALID_DASHBOARD_TABS = [
  'dashboard',
  'inspect',
  'investigations',
  'risk',
  'repair',
  'planner',
  'workorders',
  'reports',
  'settings'
];

export function parseRoute(pathname: string, search: string): AppRoute {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(search);
  const redirect = searchParams.get('redirect') || undefined;

  if (cleanPath === '' || cleanPath === '/' || cleanPath === '/home') {
    return { page: 'landing' };
  }

  if (cleanPath === '/login' || cleanPath === '/signin') {
    return { page: 'login', redirect };
  }

  if (cleanPath === '/signup' || cleanPath === '/register') {
    return { page: 'signup', redirect };
  }

  // Dashboard routes
  if (cleanPath === '/dashboard') {
    return { page: 'dashboard', tab: 'dashboard' };
  }

  if (cleanPath.startsWith('/dashboard/')) {
    const subTab = cleanPath.replace('/dashboard/', '');
    const validTab = VALID_DASHBOARD_TABS.includes(subTab) ? subTab : 'dashboard';
    return { page: 'dashboard', tab: validTab };
  }

  // Direct tab routes like /inspect, /reports, etc.
  const bareTab = cleanPath.replace(/^\//, '');
  if (VALID_DASHBOARD_TABS.includes(bareTab)) {
    return { page: 'dashboard', tab: bareTab };
  }

  // Default fallback
  return { page: 'landing' };
}

export function useAppRouter() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() =>
    parseRoute(window.location.pathname, window.location.search)
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(parseRoute(window.location.pathname, window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const url = new URL(to, window.location.origin);
    const newRoute = parseRoute(url.pathname, url.search);

    if (options?.replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }

    setCurrentRoute(newRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return {
    currentRoute,
    pathname: window.location.pathname,
    navigate
  };
}
