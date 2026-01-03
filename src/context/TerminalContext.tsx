import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react';
import type { ViewerState } from '@/types';

export interface VimModeState {
  filePath: string;
  content: string;
}

interface TerminalState {
  cwd: string;  // Current working directory
  currentProject: string | null;
  viewerState: ViewerState;
  vimMode: VimModeState | null;
  isTerminalVisible: boolean;
}

interface TerminalContextValue {
  state: TerminalState;
  executeCommand: (input: string, options?: { silent?: boolean }) => void;
  setViewerState: (state: ViewerState) => void;
  setCurrentProject: (project: string | null) => void;
  setCwd: (cwd: string) => void;
  setVimMode: (vimMode: VimModeState | null) => void;
  setTerminalVisible: (visible: boolean) => void;
  toggleTerminal: () => void;
  registerExecuteCommand: (fn: (cmd: string, options?: { silent?: boolean }) => void) => void;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TerminalState>({
    cwd: '/home/guest',
    currentProject: null,
    viewerState: { type: 'directory', path: '/home/guest' },
    vimMode: null,
    isTerminalVisible: true,
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

  const setCwd = useCallback((cwd: string) => {
    setState((prev) => ({ ...prev, cwd }));
  }, []);

  const setVimMode = useCallback((vimMode: VimModeState | null) => {
    setState((prev) => ({ ...prev, vimMode }));
  }, []);

  const setTerminalVisible = useCallback((visible: boolean) => {
    setState((prev) => ({ ...prev, isTerminalVisible: visible }));
  }, []);

  const toggleTerminal = useCallback(() => {
    setState((prev) => ({ ...prev, isTerminalVisible: !prev.isTerminalVisible }));
  }, []);

  return (
    <TerminalContext.Provider value={{
      state,
      executeCommand,
      setViewerState,
      setCurrentProject,
      setCwd,
      setVimMode,
      setTerminalVisible,
      toggleTerminal,
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
