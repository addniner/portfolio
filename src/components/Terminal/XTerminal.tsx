import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useTerminalContext } from '@/context/TerminalContext';
import { useShell } from '@/hooks/useShell';
import { DRACULA_THEME } from '@/config/terminal';
import { VimController } from '@/lib/terminal/VimController';
import { ShellController } from '@/lib/terminal/ShellController';

export function XTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const vimControllerRef = useRef<VimController | null>(null);
  const shellControllerRef = useRef<ShellController | null>(null);

  const { shell, editorMode } = useShell();
  const { state, registerExecuteCommand, toggleTerminal } = useTerminalContext();

  // Shell ref for use in effects (avoids stale closures)
  const shellRef = useRef(shell);
  useEffect(() => {
    shellRef.current = shell;
  }, [shell]);

  const registerExecuteCommandRef = useRef(registerExecuteCommand);
  useEffect(() => {
    registerExecuteCommandRef.current = registerExecuteCommand;
  }, [registerExecuteCommand]);

  // Handle terminal visibility changes - fit terminal when it becomes visible
  useEffect(() => {
    if (state.isTerminalVisible && fitAddonRef.current && xtermRef.current) {
      const term = xtermRef.current;
      const fitAddon = fitAddonRef.current;

      const timeouts: ReturnType<typeof setTimeout>[] = [];

      timeouts.push(setTimeout(() => {
        fitAddon.fit();
        term.refresh(0, term.rows - 1);
      }, 350));

      timeouts.push(setTimeout(() => {
        fitAddon.fit();
        term.refresh(0, term.rows - 1);
      }, 400));

      return () => timeouts.forEach(clearTimeout);
    }
  }, [state.isTerminalVisible]);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    // Create terminal
    const term = new Terminal({
      theme: DRACULA_THEME,
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Create VimController
    const vimController = new VimController(term, {
      onExit: () => {
        // Shell의 editorMode를 종료하고 viewPath를 cwd로 복원
        shellRef.current.exitEditor();
        shellRef.current.setViewPath(shellRef.current.getCwd());
      },
    });
    vimControllerRef.current = vimController;

    // Create ShellController - Shell 인스턴스를 직접 전달
    const shellController = new ShellController(term, {
      shell: shellRef.current,
      onVimEnter: (vimMode: { filePath: string; content: string }) => {
        vimController.enter(vimMode.filePath, vimMode.content);
      },
      onUrlChange: (urlPath: string, cmd: string, args: string[]) => {
        window.history.pushState({ cmd, args }, '', urlPath);
      },
    });
    shellControllerRef.current = shellController;

    // Register executeCommand for external use
    registerExecuteCommandRef.current((cmd: string, options?: { silent?: boolean }) => {
      shellController.executeCommand(cmd, options);
    });

    // Write welcome message
    shellController.writeWelcome();

    // Main input handler - routes to vim or shell
    term.onData((data) => {
      if (vimController.isActive()) {
        vimController.handleInput(data);
      } else {
        shellController.handleInput(data);
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      vimController.handleResize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      xtermRef.current = null;
      vimControllerRef.current = null;
      shellControllerRef.current = null;
    };
  }, []);

  // Handle resize when container size changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 300) {
        fitAddonRef.current?.fit();
      }
      vimControllerRef.current?.handleResize();
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Sync vim mode from Shell state (for external triggers like VimViewer close button)
  useEffect(() => {
    vimControllerRef.current?.syncFromExternal(editorMode);
  }, [editorMode]);

  return (
    <div className="h-full flex flex-col">
      {/* Window Chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-dracula-current/30 border-b border-white/5">
        <div className="flex gap-1.5">
          <button
            onClick={toggleTerminal}
            className="w-3 h-3 rounded-full bg-dracula-red hover:brightness-110 transition-all"
            aria-label="Close terminal"
            title="Close"
          />
          <div className="w-3 h-3 rounded-full bg-dracula-yellow" />
          <div className="w-3 h-3 rounded-full bg-dracula-green" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-dracula-comment text-xs">
            {editorMode ? `vim - ${shell.getBasename(editorMode.filePath)}` : 'terminal'}
          </span>
        </div>
        {/* Spacer for symmetry */}
        <div className="w-14" />
      </div>

      {/* Terminal Container */}
      <div
        ref={terminalRef}
        className="flex-1 px-4 py-2 bg-dracula-bg/80"
      />
    </div>
  );
}
