import { createContext, useContext, useCallback, useRef, useState, useMemo, type ReactNode } from 'react';

export interface VimModeState {
  filePath: string;
  content: string;
}

export interface TerminalState {
  cwd: string;  // Current working directory
  currentProject: string | null;
  viewerPath: string;  // Path to display in viewer (FSNode.type determines rendering)
  vimMode: VimModeState | null;
  isTerminalVisible: boolean;
  isViewerVisible: boolean;
}

interface TerminalContextValue {
  state: TerminalState;
  executeCommand: (input: string, options?: { silent?: boolean }) => void;
  setViewerPath: (path: string) => void;
  setCurrentProject: (project: string | null) => void;
  setCwd: (cwd: string) => void;
  setVimMode: (vimMode: VimModeState | null) => void;
  setTerminalVisible: (visible: boolean) => void;
  setViewerVisible: (visible: boolean) => void;
  toggleTerminal: () => void;
  toggleViewer: () => void;
  registerExecuteCommand: (fn: (cmd: string, options?: { silent?: boolean }) => void) => void;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TerminalState>({
    cwd: '/home/guest',
    currentProject: null,
    viewerPath: '/home/guest',
    vimMode: null,
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

  const setViewerPath = useCallback((viewerPath: string) => {
    setState((prev) => ({ ...prev, viewerPath }));
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
      setViewerPath,
      setCurrentProject,
      setCwd,
      setVimMode,
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

// Selector hook for optimized state access
// Usage: const viewerState = useTerminalSelector(s => s.viewerState);
export function useTerminalSelector<T>(selector: (state: TerminalState) => T): T {
  const { state } = useTerminalContext();
  return useMemo(() => selector(state), [state, selector]);
}
