import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react';
import type { ViewerState } from '@/types';

interface TerminalState {
  currentProject: string | null;
  viewerState: ViewerState;
}

interface TerminalContextValue {
  state: TerminalState;
  executeCommand: (input: string, options?: { silent?: boolean }) => void;
  setViewerState: (state: ViewerState) => void;
  setCurrentProject: (project: string | null) => void;
  registerExecuteCommand: (fn: (cmd: string, options?: { silent?: boolean }) => void) => void;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TerminalState>({
    currentProject: null,
    viewerState: { type: 'welcome' },
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

  const setViewerState = useCallback((viewerState: ViewerState) => {
    setState((prev) => ({ ...prev, viewerState }));
  }, []);

  const setCurrentProject = useCallback((project: string | null) => {
    setState((prev) => ({ ...prev, currentProject: project }));
  }, []);

  return (
    <TerminalContext.Provider value={{
      state,
      executeCommand,
      setViewerState,
      setCurrentProject,
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
