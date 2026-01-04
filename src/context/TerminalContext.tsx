import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react';

/**
 * TerminalContext - UI 전용 컨텍스트
 *
 * Shell 클래스가 모든 비즈니스 로직과 상태를 관리하고,
 * 이 컨텍스트는 순수하게 UI 표시/숨김 상태만 관리합니다.
 *
 * - isTerminalVisible: 터미널 패널 표시 여부
 * - isViewerVisible: 뷰어 패널 표시 여부
 * - executeCommand: 외부에서 터미널 명령어 실행 (ShellController에 위임)
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

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UIState>({
    isTerminalVisible: true,
    isViewerVisible: true,
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
  }, []);

  const setViewerVisible = useCallback((visible: boolean) => {
    setState((prev) => ({ ...prev, isViewerVisible: visible }));
  }, []);

  const toggleTerminal = useCallback(() => {
    setState((prev) => ({ ...prev, isTerminalVisible: !prev.isTerminalVisible }));
  }, []);

  const toggleViewer = useCallback(() => {
    setState((prev) => ({ ...prev, isViewerVisible: !prev.isViewerVisible }));
  }, []);

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
