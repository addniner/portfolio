import { useCallback, useEffect, useRef } from 'react';

/**
 * URL 쿼리파라미터로 관리할 상태 타입
 */
export interface UrlState {
  // 패널 표시 상태
  terminal?: boolean;  // ?terminal=false 면 숨김
  viewer?: boolean;    // ?viewer=false 면 숨김

  // Shell 상태
  path?: string;       // 현재 경로 (pathname으로 관리)
  vim?: string;        // vim 모드 파일 경로
}

/**
 * URL 쿼리파라미터에서 상태 파싱
 */
export function parseUrlState(): UrlState {
  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname;

  return {
    // 패널: 기본값 true, 명시적으로 'false'일 때만 숨김
    terminal: params.get('terminal') !== 'false',
    viewer: params.get('viewer') !== 'false',

    // 경로: pathname 사용 (빈 경로면 undefined)
    path: pathname !== '/' ? pathname : undefined,

    // vim 모드
    vim: params.get('vim') || undefined,
  };
}

/**
 * 상태를 URL 쿼리파라미터로 변환
 */
export function stateToUrl(state: Partial<UrlState>): string {
  const params = new URLSearchParams();

  // 패널 상태: false일 때만 명시
  if (state.terminal === false) {
    params.set('terminal', 'false');
  }
  if (state.viewer === false) {
    params.set('viewer', 'false');
  }

  // vim 모드
  if (state.vim) {
    params.set('vim', state.vim);
  }

  // pathname은 path에서 가져옴
  const pathname = state.path || '/';
  const search = params.toString();

  return search ? `${pathname}?${search}` : pathname;
}

/**
 * URL 상태 관리 훅
 *
 * - URL 쿼리파라미터와 상태를 양방향 동기화
 * - 브라우저 뒤로가기/앞으로가기 지원
 */
export function useUrlState(options: {
  onStateChange?: (state: UrlState) => void;
} = {}) {
  const { onStateChange } = options;
  const isUpdatingRef = useRef(false);

  // URL 변경 시 콜백 호출
  useEffect(() => {
    const handlePopState = () => {
      if (isUpdatingRef.current) return;
      const state = parseUrlState();
      onStateChange?.(state);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onStateChange]);

  // 상태 업데이트 → URL 변경
  const updateUrl = useCallback((state: Partial<UrlState>, replace = false) => {
    isUpdatingRef.current = true;

    // 현재 URL 상태와 병합
    const currentState = parseUrlState();
    const newState = { ...currentState, ...state };
    const url = stateToUrl(newState);

    if (replace) {
      window.history.replaceState(newState, '', url);
    } else {
      window.history.pushState(newState, '', url);
    }

    // 다음 틱에 플래그 해제
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, []);

  // 현재 URL 상태 가져오기
  const getUrlState = useCallback(() => {
    return parseUrlState();
  }, []);

  return {
    updateUrl,
    getUrlState,
    parseUrlState,
  };
}
