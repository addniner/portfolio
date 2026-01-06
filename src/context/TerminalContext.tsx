import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react';
import { parseUrlState, useUrlState } from '@/hooks/useUrlState';

/**
 * TerminalContext - UI 전용 컨텍스트
 *
 * Shell 클래스가 모든 비즈니스 로직과 상태를 관리하고,
 * 이 컨텍스트는 순수하게 UI 표시/숨김 상태만 관리합니다.
 *
 * - isTerminalVisible: 터미널 패널 표시 여부
 * - isViewerVisible: 뷰어 패널 표시 여부
 * - executeCommand: 외부에서 터미널 명령어 실행 (ShellController에 위임)
 *
 * URL 쿼리파라미터와 동기화:
 * - ?terminal=false → 터미널 숨김
 * - ?viewer=false → 뷰어 숨김
 */

interface UIState {
  isTerminalVisible: boolean;
  isViewerVisible: boolean;
}

interface TerminalContextValue {
  state: UIState;
  executeCommand: (input: string, options?: { silent?: boolean }) => void;
  setTerminalVisible: (visible: boolean) => void;
  setViewerVisible: (visible: boolean) => void;
  toggleTerminal: () => void;
  toggleViewer: () => void;
  registerExecuteCommand: (fn: (cmd: string, options?: { silent?: boolean }) => void) => void;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

/**
 * URL에서 초기 UI 상태 파싱
 */
function getInitialUIState(): UIState {
  // SSR 환경에서는 기본값 반환
  if (typeof window === 'undefined') {
    return { isTerminalVisible: true, isViewerVisible: true };
  }

  const urlState = parseUrlState();
  return {
    isTerminalVisible: urlState.terminal !== false,
    isViewerVisible: urlState.viewer !== false,
  };
}

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UIState>(getInitialUIState);
  const { updateUrl } = useUrlState({
    onStateChange: (urlState) => {
      // 브라우저 뒤로가기/앞으로가기 시 상태 복원
      setState({
        isTerminalVisible: urlState.terminal !== false,
        isViewerVisible: urlState.viewer !== false,
      });
    },
  });

  const executeCommandRef = useRef<((cmd: string, options?: { silent?: boolean }) => void) | null>(null);

  const registerExecuteCommand = useCallback((fn: (cmd: string, options?: { silent?: boolean }) => void) => {
    executeCommandRef.current = fn;
  }, []);

  const executeCommand = useCallback((input: string, options?: { silent?: boolean }) => {
    if (executeCommandRef.current) {
      executeCommandRef.current(input, options);
    }
  }, []);

  const setTerminalVisible = useCallback((visible: boolean) => {
    setState((prev) => ({ ...prev, isTerminalVisible: visible }));
    updateUrl({ terminal: visible });
  }, [updateUrl]);

  const setViewerVisible = useCallback((visible: boolean) => {
    setState((prev) => ({ ...prev, isViewerVisible: visible }));
    updateUrl({ viewer: visible });
  }, [updateUrl]);

  const toggleTerminal = useCallback(() => {
    setState((prev) => {
      const newVisible = !prev.isTerminalVisible;
      updateUrl({ terminal: newVisible });
      return { ...prev, isTerminalVisible: newVisible };
    });
  }, [updateUrl]);

  const toggleViewer = useCallback(() => {
    setState((prev) => {
      const newVisible = !prev.isViewerVisible;
      updateUrl({ viewer: newVisible });
      return { ...prev, isViewerVisible: newVisible };
    });
  }, [updateUrl]);

  return (
    <TerminalContext.Provider value={{
      state,
      executeCommand,
      setTerminalVisible,
      setViewerVisible,
      toggleTerminal,
      toggleViewer,
      registerExecuteCommand,
    }}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminalContext() {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminalContext must be used within a TerminalProvider');
  }
  return context;
}
