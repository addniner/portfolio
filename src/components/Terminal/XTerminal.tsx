import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useTerminalContext } from '@/context/TerminalContext';
import { parseCommand } from '@/utils/commandParser';
import { executeCommand as runCommand } from '@/commands';
import { getCompletions, createContext, MenuComplete } from '@/completions';
import { TerminalLineBuffer } from './TerminalLineBuffer';
import { TerminalRenderer } from './TerminalRenderer';

// Dracula theme for xterm
const draculaTheme = {
  background: '#282a36',
  foreground: '#f8f8f2',
  cursor: '#50fa7b',
  cursorAccent: '#282a36',
  selectionBackground: '#44475a',
  selectionForeground: '#f8f8f2',
  black: '#21222c',
  red: '#ff5555',
  green: '#50fa7b',
  yellow: '#f1fa8c',
  blue: '#bd93f9',
  magenta: '#ff79c6',
  cyan: '#8be9fd',
  white: '#f8f8f2',
  brightBlack: '#6272a4',
  brightRed: '#ff6e6e',
  brightGreen: '#69ff94',
  brightYellow: '#ffffa5',
  brightBlue: '#d6acff',
  brightMagenta: '#ff92df',
  brightCyan: '#a4ffff',
  brightWhite: '#ffffff',
};

export function XTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lineBufferRef = useRef<TerminalLineBuffer | null>(null);
  const rendererRef = useRef<TerminalRenderer | null>(null);
  const currentProjectRef = useRef<string | null>(null);
  const menuCompleteRef = useRef<MenuComplete | null>(null);

  const { state, setViewerState, setCurrentProject, registerExecuteCommand } = useTerminalContext();

  // Keep refs updated for use in callbacks
  const stateRef = useRef(state);
  const setViewerStateRef = useRef(setViewerState);
  const setCurrentProjectRef = useRef(setCurrentProject);
  const registerExecuteCommandRef = useRef(registerExecuteCommand);

  useEffect(() => {
    stateRef.current = state;
    currentProjectRef.current = state.currentProject;
  }, [state]);

  useEffect(() => {
    setViewerStateRef.current = setViewerState;
    setCurrentProjectRef.current = setCurrentProject;
    registerExecuteCommandRef.current = registerExecuteCommand;
  }, [setViewerState, setCurrentProject, registerExecuteCommand]);

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    // Create terminal
    const term = new Terminal({
      theme: draculaTheme,
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

    // Create line buffer (single source of truth)
    const lineBuffer = new TerminalLineBuffer();
    lineBufferRef.current = lineBuffer;

    // Create MenuComplete (Zsh menu-complete widget)
    const menuComplete = new MenuComplete();
    menuCompleteRef.current = menuComplete;

    // Helper: Get prompt based on current project
    const getPrompt = () => {
      const project = currentProjectRef.current;
      const path = project ? `~/${project}` : '~';
      return `\x1b[35m${path}\x1b[0m\x1b[38;5;205m$ \x1b[0m`;
    };

    // Create renderer (stateless)
    const renderer = new TerminalRenderer(term, { getPrompt });
    rendererRef.current = renderer;

    // Helper: Render current state
    const render = () => {
      renderer.render(lineBuffer.getState());
    };

    // Update hint based on current input (uses Zsh-style completion system)
    const updateHint = () => {
      const buffer = lineBuffer.getBuffer();
      const cursorPos = lineBuffer.getCursorPos();

      // Only show hint when cursor is at end
      if (cursorPos !== buffer.length) {
        lineBuffer.clearHint();
        render();
        return;
      }

      const completions = getCompletions(buffer);
      if (completions.length === 1) {
        const completion = completions[0];
        const ctx = createContext(buffer);
        const hint = completion.slice(ctx.prefix.length);
        lineBuffer.setHint(hint);
      } else {
        lineBuffer.clearHint();
      }
      render();
    };

    // Apply autocomplete (Tab) - uses Zsh-style MenuComplete
    const applyAutocomplete = () => {
      const buffer = lineBuffer.getBuffer();
      const result = menuComplete.complete(buffer);

      if (!result) return;

      // 버퍼 업데이트
      if (result.suffix) {
        lineBuffer.insert(result.suffix);
        updateHint();
      } else if (result.newBuffer !== buffer) {
        lineBuffer.setLine(result.newBuffer);

        // 메뉴 표시 (하이라이트 포함)
        if (result.displayCompletions) {
          renderer.showMenuCompletions(
            result.displayCompletions.items,
            result.displayCompletions.selectedIndex,
            lineBuffer.getState()
          );
        } else {
          render();
        }
      }
    };

    // Handle command execution
    const handleCommand = (input: string, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      const parsed = parseCommand(input);

      // Handle clear command
      if (parsed.command === 'clear') {
        renderer.clearForCommand();
        renderer.writePrompt();
        setViewerStateRef.current({ type: 'welcome' });
        return;
      }

      const result = runCommand(parsed, {
        currentProject: currentProjectRef.current,
        previousState: stateRef.current.viewerState,
        getHistory: () => lineBuffer.getHistory(),
      });

      if (result.output && !silent) {
        renderer.writeOutput(result.output);
      }

      if (result.viewerState) {
        setViewerStateRef.current(result.viewerState);
      }

      if (parsed.command === 'cd') {
        const newProject = parsed.args[0] && parsed.args[0] !== '~' && parsed.args[0] !== '/' && parsed.args[0] !== '..'
          ? parsed.args[0]
          : null;
        currentProjectRef.current = newProject;
        setCurrentProjectRef.current(newProject);
      }

      if (!silent && result.urlPath) {
        window.history.pushState(
          { cmd: parsed.command, args: parsed.args },
          '',
          result.urlPath
        );
      }

      if (!silent) {
        renderer.writePrompt();
      }
    };

    // Register executeCommand for external use
    registerExecuteCommandRef.current((cmd: string, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        term.write(cmd);
        term.writeln('');
      }
      handleCommand(cmd, options);
    });

    // Welcome message
    term.writeln('\x1b[32mPORTFOLIO OS v1.0.0\x1b[0m');
    term.writeln('\x1b[90mType \'help\' for commands.\x1b[0m');
    term.writeln('');
    renderer.writePrompt();

    // Handle input
    term.onData((data) => {
      const code = data.charCodeAt(0);

      // Tab - autocomplete
      if (code === 9) {
        applyAutocomplete();
        return;
      }

      // Reset menu-complete state for any non-Tab input
      if (menuComplete.isActive()) {
        menuComplete.reset();
        renderer.clearMenu(lineBuffer.getState());
      }

      // Enter
      if (code === 13) {
        const input = lineBuffer.getBuffer();
        const state = lineBuffer.getState();

        if (input.trim() === 'clear') {
          lineBuffer.submit();
          handleCommand(input);
        } else {
          renderer.finalizeLine(state);
          lineBuffer.submit();
          handleCommand(input);
        }
        return;
      }

      // Backspace
      if (code === 127) {
        if (lineBuffer.deleteBackward()) {
          updateHint();
        }
        return;
      }

      // Option+Backspace - delete word
      if (data === '\x1b\x7f') {
        lineBuffer.deleteWord();
        updateHint();
        return;
      }

      // Ctrl+W - delete word
      if (code === 23) {
        lineBuffer.deleteWord();
        updateHint();
        return;
      }

      // Ctrl+A - move to start
      if (code === 1) {
        lineBuffer.moveCursorToStart();
        render();
        return;
      }

      // Ctrl+E - move to end
      if (code === 5) {
        lineBuffer.moveCursorToEnd();
        updateHint();
        return;
      }

      // Ctrl+K - delete to end
      if (code === 11) {
        lineBuffer.deleteToEnd();
        updateHint();
        return;
      }

      // Ctrl+C - cancel
      if (code === 3) {
        renderer.handleCancel(lineBuffer.getState());
        lineBuffer.cancel();
        renderer.writePrompt();
        return;
      }

      // Ctrl+L - clear screen
      if (code === 12) {
        renderer.clearScreen(lineBuffer.getState());
        return;
      }

      // Ctrl+U - clear line before cursor
      if (code === 21) {
        lineBuffer.deleteToStart();
        render();
        return;
      }

      // Arrow Up - history
      if (data === '\x1b[A') {
        if (lineBuffer.historyUp() !== null) {
          updateHint();
        }
        return;
      }

      // Arrow Down - history
      if (data === '\x1b[B') {
        if (lineBuffer.historyDown() !== null) {
          updateHint();
        }
        return;
      }

      // Arrow Left
      if (data === '\x1b[D') {
        lineBuffer.moveCursorLeft();
        render();
        return;
      }

      // Arrow Right
      if (data === '\x1b[C') {
        lineBuffer.moveCursorRight();
        updateHint();
        return;
      }

      // Option+Left - word left
      if (data === '\x1bb') {
        lineBuffer.moveCursorWordLeft();
        render();
        return;
      }

      // Option+Right - word right
      if (data === '\x1bf') {
        lineBuffer.moveCursorWordRight();
        updateHint();
        return;
      }

      // Home key
      if (data === '\x1b[H' || data === '\x1bOH') {
        lineBuffer.moveCursorToStart();
        render();
        return;
      }

      // End key
      if (data === '\x1b[F' || data === '\x1bOF') {
        lineBuffer.moveCursorToEnd();
        updateHint();
        return;
      }

      // Delete key
      if (data === '\x1b[3~') {
        if (lineBuffer.deleteForward()) {
          updateHint();
        }
        return;
      }

      // Printable characters
      if (code >= 32) {
        lineBuffer.insert(data);
        updateHint();
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      xtermRef.current = null;
      lineBufferRef.current = null;
      rendererRef.current = null;
    };
  }, []);

  // Handle resize when container size changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      fitAddonRef.current?.fit();
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-dracula-bg">
      {/* Window Chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-dracula-current/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-dracula-red" />
          <div className="w-3 h-3 rounded-full bg-dracula-yellow" />
          <div className="w-3 h-3 rounded-full bg-dracula-green" />
        </div>
        <span className="text-dracula-comment text-xs ml-2">terminal</span>
      </div>

      {/* Terminal Container */}
      <div
        ref={terminalRef}
        className="flex-1 px-4 py-2"
      />
    </div>
  );
}
