import { useEffect, useState, useSyncExternalStore } from 'react';

// SSR-safe media query hook using useSyncExternalStore
export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener('change', callback);
    return () => mediaQuery.removeEventListener('change', callback);
  };

  const getSnapshot = () => window.matchMedia(query).matches;

  // SSR에서는 false 반환, 클라이언트에서는 실제 값 반환
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// 초기화 상태를 포함한 media query hook
export function useMediaQueryWithInit(query: string): { matches: boolean; initialized: boolean } {
  const [state, setState] = useState({ matches: false, initialized: false });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setState({ matches: mediaQuery.matches, initialized: true });

    const handleChange = (event: MediaQueryListEvent) => {
      setState({ matches: event.matches, initialized: true });
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return state;
}

// Preset breakpoints
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

export function useIsMobileWithInit(): { isMobile: boolean; initialized: boolean } {
  const { matches, initialized } = useMediaQueryWithInit('(max-width: 767px)');
  return { isMobile: matches, initialized };
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}
