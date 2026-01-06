import { useCallback, useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useTerminalContext } from '@/context/TerminalContext';
import { useShell } from '@/hooks/useShell';
import { useUrlState, type UrlState } from '@/hooks/useUrlState';
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

  // 브라우저 뒤로가기/앞으로가기 시 Shell 상태 동기화
  const handleUrlStateChange = useCallback((urlState: UrlState) => {
    const targetPath = urlState.path || '/home/guest';
    const currentCwd = shell.getCwd();

    // 경로가 변경된 경우에만 Shell 상태 업데이트
    if (targetPath !== currentCwd) {
      shell.setCwd(targetPath);
      shell.setViewPath(targetPath);
    }
  }, [shell]);

  const { updateUrl } = useUrlState({ onStateChange: handleUrlStateChange });

  // Shell ref for use in effects (avoids stale closures)
  const shellRef = useRef(shell);
  useEffect(() => {
    shellRef.current = shell;
  }, [shell]);

  const registerExecuteCommandRef = useRef(registerExecuteCommand);
  useEffect(() => {
    registerExecuteCommandRef.current = registerExecuteCommand;
  }, [registerExecuteCommand]);

  // updateUrl ref for use in ShellController callback
  const updateUrlRef = useRef(updateUrl);
  useEffect(() => {
    updateUrlRef.current = updateUrl;
  }, [updateUrl]);

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

    // Create ShellController first - Shell 인스턴스를 직접 전달
    const shellController = new ShellController(term, {
      shell: shellRef.current,
      onVimEnter: (vimMode: { filePath: string; content: string }) => {
        vimControllerRef.current?.enter(vimMode.filePath, vimMode.content);
        // URL에 vim 모드 반영
        updateUrlRef.current({ vim: vimMode.filePath });
      },
      onUrlChange: (urlPath: string) => {
        updateUrlRef.current({ path: urlPath });
      },
    });
    shellControllerRef.current = shellController;

    // Create VimController
    const vimController = new VimController(term, {
      onExit: () => {
        // Shell의 editorMode를 종료하고 viewPath를 cwd로 복원
        shellRef.current.exitEditor();
        shellRef.current.setViewPath(shellRef.current.getCwd());
        // URL에서 vim 모드 제거
        updateUrlRef.current({ vim: undefined });
        // Write prompt to terminal after vim exit
        shellController.writePrompt();
      },
    });
    vimControllerRef.current = vimController;

    // Register executeCommand for external use
    registerExecuteCommandRef.current((cmd: string, options?: { silent?: boolean }) => {
      shellController.executeCommand(cmd, options);
    });

    // Write welcome message
    shellController.writeWelcome();

    // URL에서 vim 파라미터 확인하여 초기 vim 모드 진입
    const urlParams = new URLSearchParams(window.location.search);
    const vimFile = urlParams.get('vim');
    if (vimFile) {
      // silent로 vim 명령어 실행 (터미널에 출력 안 함)
      shellController.executeCommand(`vim ${vimFile}`, { silent: true });
    }

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

    // Handle mouse wheel scroll for vim mode
    const handleWheel = (e: WheelEvent) => {
      if (vimController.isActive()) {
        e.preventDefault();
        e.stopPropagation();
        vimController.handleWheel(e.deltaY);
      }
    };

    window.addEventListener('resize', handleResize);
    // Attach to xterm's element for wheel events
    const xtermElement = terminalRef.current?.querySelector('.xterm');
    xtermElement?.addEventListener('wheel', handleWheel as EventListener, { passive: false });

    return () => {
      window.removeEventListener('resize', handleResize);
      xtermElement?.removeEventListener('wheel', handleWheel as EventListener);
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

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="h-full flex flex-col">
      {/* Window Chrome - 모바일에서는 숨김 */}
      {!isMobile && (
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border-b border-border/50">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTerminal}
              className="w-3 h-3 rounded-full bg-traffic-close hover:brightness-110 transition-all"
              aria-label="Close terminal"
              title="Close"
            />
            <div className="w-3 h-3 rounded-full bg-traffic-minimize" />
            <div className="w-3 h-3 rounded-full bg-traffic-maximize" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">
              {editorMode ? `vim - ${shell.getBasename(editorMode.filePath)}` : 'terminal'}
            </span>
          </div>
          {/* Spacer for symmetry */}
          <div className="w-14" />
        </div>
      )}

      {/* Terminal Container - xterm과 같은 배경색으로 빈 공간 채움 */}
      <div
        ref={terminalRef}
        className="flex-1 px-4 py-2 bg-[#282a36]"
      />
    </div>
  );
}
