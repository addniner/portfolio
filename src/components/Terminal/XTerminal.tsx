import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useTerminalContext } from '@/context/TerminalContext';
import { parseCommands } from '@/lib/commandParser';
import { executeCommand as runCommand } from '@/commands';
import { getCompletions, createContext, MenuComplete } from '@/completions';
import { TerminalLineBuffer } from './TerminalLineBuffer';
import { TerminalRenderer } from './TerminalRenderer';
import { getBasename } from '@/data/filesystem';
import { DRACULA_THEME } from '@/config/terminal';

// Vim mode state for xterm
interface VimState {
  content: string;
  lines: string[];
  filePath: string;
  filename: string;
  scrollOffset: number;
  cursorLine: number;
  cursorCol: number;
  commandMode: boolean;
  commandBuffer: string;
  message: string;
}

export function XTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lineBufferRef = useRef<TerminalLineBuffer | null>(null);
  const rendererRef = useRef<TerminalRenderer | null>(null);
  const currentProjectRef = useRef<string | null>(null);
  const menuCompleteRef = useRef<MenuComplete | null>(null);
  const vimStateRef = useRef<VimState | null>(null);
  const shellDataHandlerRef = useRef<((data: string) => void) | null>(null);

  const { state, setViewerPath, setCurrentProject, setCwd, setVimMode, registerExecuteCommand, toggleTerminal } = useTerminalContext();

  // Keep refs updated for use in callbacks
  const stateRef = useRef(state);
  const setViewerPathRef = useRef(setViewerPath);
  const setCurrentProjectRef = useRef(setCurrentProject);
  const setCwdRef = useRef(setCwd);
  const setVimModeRef = useRef(setVimMode);
  const registerExecuteCommandRef = useRef(registerExecuteCommand);

  useEffect(() => {
    stateRef.current = state;
    currentProjectRef.current = state.currentProject;
  }, [state]);

  useEffect(() => {
    setViewerPathRef.current = setViewerPath;
    setCurrentProjectRef.current = setCurrentProject;
    setCwdRef.current = setCwd;
    setVimModeRef.current = setVimMode;
    registerExecuteCommandRef.current = registerExecuteCommand;
  }, [setViewerPath, setCurrentProject, setCwd, setVimMode, registerExecuteCommand]);

  // Handle terminal visibility changes - fit terminal when it becomes visible
  useEffect(() => {
    if (state.isTerminalVisible && fitAddonRef.current && xtermRef.current) {
      const term = xtermRef.current;
      const fitAddon = fitAddonRef.current;

      // Wait for animation to complete (300ms) plus buffer, then fit and refresh
      const timeouts: ReturnType<typeof setTimeout>[] = [];

      // After animation completes, fit and force full refresh
      timeouts.push(setTimeout(() => {
        fitAddon.fit();
        // Clear and redraw entire terminal buffer to fix rendering
        term.refresh(0, term.rows - 1);
      }, 350));

      // Extra refresh slightly later to ensure everything is correct
      timeouts.push(setTimeout(() => {
        fitAddon.fit();
        term.refresh(0, term.rows - 1);
      }, 400));

      return () => timeouts.forEach(clearTimeout);
    }
  }, [state.isTerminalVisible]);

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

    // Create line buffer (single source of truth)
    const lineBuffer = new TerminalLineBuffer();
    lineBufferRef.current = lineBuffer;

    // Create MenuComplete (Zsh menu-complete widget)
    const menuComplete = new MenuComplete();
    menuCompleteRef.current = menuComplete;

    // Helper: Get prompt based on current directory
    const getPrompt = () => {
      const cwd = stateRef.current.cwd;
      // Display path with ~ for /home/guest
      const displayPath = cwd.replace('/home/guest', '~');
      return `\x1b[32mguest@portfolio\x1b[0m:\x1b[34m${displayPath}\x1b[0m$ `;
    };

    // Create renderer (stateless)
    const renderer = new TerminalRenderer(term, { getPrompt });
    rendererRef.current = renderer;

    // Helper: Render current state
    const render = () => {
      renderer.render(lineBuffer.getState());
    };

    // ========== VIM MODE FUNCTIONS ==========

    // Render vim UI in xterm
    const renderVim = () => {
      const vimState = vimStateRef.current;
      if (!vimState) return;

      const rows = term.rows;
      const cols = term.cols;
      const contentRows = rows - 2; // Reserve 2 lines for status and command

      // Clear screen and hide cursor
      term.write('\x1b[?25l'); // Hide cursor
      term.write('\x1b[2J'); // Clear screen
      term.write('\x1b[H'); // Move to top-left

      // Calculate visible lines
      const startLine = vimState.scrollOffset;

      // Render content lines with line numbers
      for (let i = 0; i < contentRows; i++) {
        const lineNum = startLine + i;
        term.write(`\x1b[${i + 1};1H`); // Move to line

        if (lineNum < vimState.lines.length) {
          // Line number (yellow)
          const lineNumStr = String(lineNum + 1).padStart(4, ' ');
          term.write(`\x1b[33m${lineNumStr}\x1b[0m `);

          // Line content (truncate if too long)
          const line = vimState.lines[lineNum] || '';
          const maxLineLen = cols - 6;
          const displayLine = line.length > maxLineLen ? line.slice(0, maxLineLen - 1) + '…' : line;
          term.write(displayLine);
        } else {
          // Empty line indicator (blue ~)
          term.write(`\x1b[34m   ~\x1b[0m`);
        }

        // Clear rest of line
        term.write('\x1b[K');
      }

      // Status line (second to last row)
      const statusRow = rows - 1;
      term.write(`\x1b[${statusRow};1H`);
      term.write('\x1b[7m'); // Reverse video (inverted colors)

      const filenameDisplay = `"${vimState.filename}"`;
      const readonlyFlag = '[readonly]';
      const lineInfo = `${vimState.lines.length}L, ${vimState.content.length}B`;
      const posInfo = `${vimState.cursorLine + 1},${vimState.cursorCol + 1}`;

      // Calculate position percentage
      const percentage = vimState.lines.length <= contentRows ? 'All' :
        vimState.scrollOffset === 0 ? 'Top' :
        vimState.scrollOffset + contentRows >= vimState.lines.length ? 'Bot' :
        `${Math.round((vimState.scrollOffset / (vimState.lines.length - contentRows)) * 100)}%`;

      const leftPart = ` ${filenameDisplay} ${readonlyFlag} ${lineInfo}`;
      const rightPart = `${posInfo}   ${percentage} `;
      const padding = cols - leftPart.length - rightPart.length;

      term.write(leftPart);
      term.write(' '.repeat(Math.max(0, padding)));
      term.write(rightPart);
      term.write('\x1b[0m'); // Reset

      // Command line (last row)
      const cmdRow = rows;
      term.write(`\x1b[${cmdRow};1H`);
      term.write('\x1b[K'); // Clear line

      if (vimState.commandMode) {
        term.write(`:${vimState.commandBuffer}`);
        term.write('\x1b[?25h'); // Show cursor
      } else if (vimState.message) {
        // Error/warning messages in red
        if (vimState.message.startsWith('E') || vimState.message.startsWith('W')) {
          term.write(`\x1b[31m${vimState.message}\x1b[0m`);
        } else {
          term.write(`\x1b[90m${vimState.message}\x1b[0m`);
        }
      } else {
        term.write('\x1b[90mType :q to exit\x1b[0m');
      }
    };

    // Enter vim mode
    const enterVimMode = (filePath: string, content: string) => {
      const lines = content.split('\n');
      vimStateRef.current = {
        content,
        lines,
        filePath,
        filename: getBasename(filePath),
        scrollOffset: 0,
        cursorLine: 0,
        cursorCol: 0,
        commandMode: false,
        commandBuffer: '',
        message: '',
      };

      // Save alternate screen
      term.write('\x1b[?1049h'); // Switch to alternate screen buffer
      renderVim();
    };

    // Exit vim mode
    const exitVimMode = () => {
      vimStateRef.current = null;

      // Restore main screen
      term.write('\x1b[?1049l'); // Switch back to main screen buffer
      term.write('\x1b[?25h'); // Show cursor

      // Update state
      setVimModeRef.current(null);
      setViewerPathRef.current(stateRef.current.cwd);
    };

    // Handle vim input
    const handleVimInput = (data: string) => {
      const vimState = vimStateRef.current;
      if (!vimState) return;

      const code = data.charCodeAt(0);
      const rows = term.rows;
      const contentRows = rows - 2;

      // Command mode
      if (vimState.commandMode) {
        if (code === 13) { // Enter
          const cmd = vimState.commandBuffer.toLowerCase();
          if (cmd === 'q' || cmd === 'q!' || cmd === 'wq' || cmd === 'wq!' || cmd === 'x') {
            exitVimMode();
            return;
          } else if (cmd === 'w' || cmd.startsWith('w ')) {
            vimState.message = "E45: 'readonly' option is set (add ! to override)";
            vimState.commandMode = false;
            vimState.commandBuffer = '';
          } else {
            vimState.message = `E492: Not an editor command: ${vimState.commandBuffer}`;
            vimState.commandMode = false;
            vimState.commandBuffer = '';
          }
          renderVim();
          return;
        }

        if (code === 27) { // Escape
          vimState.commandMode = false;
          vimState.commandBuffer = '';
          vimState.message = '';
          renderVim();
          return;
        }

        if (code === 127) { // Backspace
          if (vimState.commandBuffer.length > 0) {
            vimState.commandBuffer = vimState.commandBuffer.slice(0, -1);
          } else {
            vimState.commandMode = false;
          }
          renderVim();
          return;
        }

        // Add character to command buffer
        if (code >= 32 && code < 127) {
          vimState.commandBuffer += data;
          renderVim();
        }
        return;
      }

      // Normal mode
      if (data === ':') {
        vimState.commandMode = true;
        vimState.commandBuffer = '';
        vimState.message = '';
        renderVim();
        return;
      }

      if (code === 27) { // Escape
        vimState.message = '';
        renderVim();
        return;
      }

      // Navigation
      if (data === 'j' || data === '\x1b[B') { // Down
        if (vimState.cursorLine < vimState.lines.length - 1) {
          vimState.cursorLine++;
          // Scroll if cursor goes below visible area
          if (vimState.cursorLine >= vimState.scrollOffset + contentRows) {
            vimState.scrollOffset = vimState.cursorLine - contentRows + 1;
          }
          renderVim();
        }
        return;
      }

      if (data === 'k' || data === '\x1b[A') { // Up
        if (vimState.cursorLine > 0) {
          vimState.cursorLine--;
          // Scroll if cursor goes above visible area
          if (vimState.cursorLine < vimState.scrollOffset) {
            vimState.scrollOffset = vimState.cursorLine;
          }
          renderVim();
        }
        return;
      }

      if (data === 'G') { // Go to end
        vimState.cursorLine = vimState.lines.length - 1;
        vimState.scrollOffset = Math.max(0, vimState.lines.length - contentRows);
        renderVim();
        return;
      }

      if (data === 'g') { // gg - go to start (simplified)
        vimState.cursorLine = 0;
        vimState.scrollOffset = 0;
        renderVim();
        return;
      }

      if (data === ' ' || data === '\x1b[6~') { // Space or PageDown
        vimState.scrollOffset = Math.min(
          vimState.scrollOffset + contentRows,
          Math.max(0, vimState.lines.length - contentRows)
        );
        vimState.cursorLine = Math.min(
          vimState.scrollOffset + contentRows - 1,
          vimState.lines.length - 1
        );
        renderVim();
        return;
      }

      if (data === '\x1b[5~') { // PageUp
        vimState.scrollOffset = Math.max(0, vimState.scrollOffset - contentRows);
        vimState.cursorLine = vimState.scrollOffset;
        renderVim();
        return;
      }

      // Ctrl+D - half page down
      if (code === 4) {
        const halfPage = Math.floor(contentRows / 2);
        vimState.scrollOffset = Math.min(
          vimState.scrollOffset + halfPage,
          Math.max(0, vimState.lines.length - contentRows)
        );
        vimState.cursorLine = Math.min(
          vimState.cursorLine + halfPage,
          vimState.lines.length - 1
        );
        renderVim();
        return;
      }

      // Ctrl+U - half page up
      if (code === 21) {
        const halfPage = Math.floor(contentRows / 2);
        vimState.scrollOffset = Math.max(0, vimState.scrollOffset - halfPage);
        vimState.cursorLine = Math.max(0, vimState.cursorLine - halfPage);
        renderVim();
        return;
      }

      // Editing attempts - show readonly message
      if (['i', 'I', 'a', 'A', 'o', 'O', 's', 'S', 'c', 'C', 'r', 'R', 'x', 'X', 'd', 'D', 'p', 'P'].includes(data)) {
        vimState.message = 'W10: Warning: Changing a readonly file';
        renderVim();
        return;
      }
    };

    // ========== SHELL MODE FUNCTIONS ==========

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

      const cwd = stateRef.current.cwd;
      const completions = getCompletions(buffer, cwd);
      if (completions.length === 1) {
        const completion = completions[0];
        const ctx = createContext(buffer, cwd);
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
      const cwd = stateRef.current.cwd;
      const result = menuComplete.complete(buffer, cwd);

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

      // Parse commands (supports && and ; chaining)
      const parsedCommands = parseCommands(input);

      if (parsedCommands.length === 0) {
        if (!silent) {
          renderer.writePrompt();
        }
        return;
      }

      // Handle clear command (special case)
      if (parsedCommands.length === 1 && parsedCommands[0].command === 'clear') {
        renderer.clearForCommand();
        renderer.writePrompt();
        return;
      }

      // Execute commands in sequence, passing cwd between them
      let currentCwd = stateRef.current.cwd;
      let lastResult: ReturnType<typeof runCommand> | null = null;
      let lastUrlPath: string | undefined;
      let lastViewerState: ReturnType<typeof runCommand>['viewerState'] = undefined;
      let shouldClear = false;

      for (const parsed of parsedCommands) {
        if (!parsed.command) continue;

        // Handle clear command in chain
        if (parsed.command === 'clear') {
          shouldClear = true;
          continue;
        }

        const result = runCommand(parsed, {
          cwd: currentCwd,
          currentProject: currentProjectRef.current,
          previousState: stateRef.current.viewerPath,
          getHistory: () => lineBuffer.getHistory(),
        });

        // Output only for errors, not for chained commands
        if (result.output && !silent && result.type === 'error') {
          renderer.writeOutput(result.output);
          // Stop execution on error for && chains
          break;
        }

        // Update cwd for next command in chain
        if (result.newCwd) {
          currentCwd = result.newCwd;
        }

        // Track last successful result
        lastResult = result;
        if (result.urlPath) {
          lastUrlPath = result.urlPath;
        }

        // Accumulate viewerState from chain (later commands override earlier ones)
        if (result.viewerState) {
          lastViewerState = result.viewerState;
        }

        // Handle cd project tracking
        if (parsed.command === 'cd') {
          const newProject = parsed.args[0] && parsed.args[0] !== '~' && parsed.args[0] !== '/' && parsed.args[0] !== '..'
            ? parsed.args[0]
            : null;
          currentProjectRef.current = newProject;
          setCurrentProjectRef.current(newProject);
        }
      }

      // Handle clear if it was in the chain
      if (shouldClear) {
        renderer.clearForCommand();
      }

      // Apply final state from chain
      if (lastResult) {
        if (lastResult.output && !silent && lastResult.type !== 'error') {
          renderer.writeOutput(lastResult.output);
        }

        if (lastViewerState) {
          setViewerPathRef.current(lastViewerState);
        }

        // Handle vim mode - enter vim in xterm
        if (lastResult.vimMode) {
          setVimModeRef.current(lastResult.vimMode);
          enterVimMode(lastResult.vimMode.filePath, lastResult.vimMode.content);
          return; // Don't write prompt, we're in vim now
        }

        // Update cwd with final value
        if (currentCwd !== stateRef.current.cwd) {
          // Update ref immediately so prompt uses correct cwd
          stateRef.current = { ...stateRef.current, cwd: currentCwd };
          setCwdRef.current(currentCwd);
        }

        if (!silent && lastUrlPath) {
          window.history.pushState(
            { cmd: parsedCommands[parsedCommands.length - 1].command, args: parsedCommands[parsedCommands.length - 1].args },
            '',
            lastUrlPath
          );
        }
      }

      if (!silent) {
        renderer.writePrompt();
      }
    };

    // Shell input handler
    const handleShellInput = (data: string) => {
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
        const bufferState = lineBuffer.getState();

        // Check if input contains 'clear' command (either alone or in chain)
        const hasClear = input.trim() === 'clear' ||
          input.includes('&& clear') ||
          input.includes('; clear') ||
          input.includes('&&clear') ||
          input.includes(';clear');

        if (hasClear) {
          // Don't finalize line - clear will wipe everything anyway
          lineBuffer.submit();
          handleCommand(input);
        } else {
          renderer.finalizeLine(bufferState);
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
    };

    // Save shell handler reference
    shellDataHandlerRef.current = handleShellInput;

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

    // Main input handler - routes to vim or shell
    term.onData((data) => {
      if (vimStateRef.current) {
        handleVimInput(data);
      } else {
        handleShellInput(data);
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      // Re-render vim if active
      if (vimStateRef.current) {
        renderVim();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      xtermRef.current = null;
      lineBufferRef.current = null;
      rendererRef.current = null;
      vimStateRef.current = null;
    };
  }, []);

  // Handle resize when container size changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      // Only fit if the container has a reasonable width (at least 300px)
      // This prevents fitting during close/open animations
      const entry = entries[0];
      if (entry && entry.contentRect.width > 300) {
        fitAddonRef.current?.fit();
      }
      // Re-render vim if active
      if (vimStateRef.current && xtermRef.current) {
        const vimState = vimStateRef.current;
        const term = xtermRef.current;
        const rows = term.rows;
        const contentRows = rows - 2;

        // Clear screen and hide cursor
        term.write('\x1b[?25l');
        term.write('\x1b[2J');
        term.write('\x1b[H');

        // Re-render (simplified - full render would need the renderVim function)
        // For now, just trigger re-render by updating scroll
        vimState.scrollOffset = Math.min(
          vimState.scrollOffset,
          Math.max(0, vimState.lines.length - contentRows)
        );
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Sync vim mode from context (for external triggers like VimViewer close button)
  useEffect(() => {
    // If context says vim mode is null but we still have vim state, exit vim
    if (!state.vimMode && vimStateRef.current && xtermRef.current) {
      vimStateRef.current = null;
      const term = xtermRef.current;
      term.write('\x1b[?1049l'); // Switch back to main screen
      term.write('\x1b[?25h'); // Show cursor
    }
    // If context says vim mode but we don't have vim state, enter vim
    else if (state.vimMode && !vimStateRef.current && xtermRef.current) {
      const term = xtermRef.current;
      const lines = state.vimMode.content.split('\n');
      vimStateRef.current = {
        content: state.vimMode.content,
        lines,
        filePath: state.vimMode.filePath,
        filename: getBasename(state.vimMode.filePath),
        scrollOffset: 0,
        cursorLine: 0,
        cursorCol: 0,
        commandMode: false,
        commandBuffer: '',
        message: '',
      };
      term.write('\x1b[?1049h'); // Switch to alternate screen

      // Need to render vim - but renderVim is inside the useEffect closure
      // So we'll do a simplified render here
      const rows = term.rows;
      const cols = term.cols;
      const contentRows = rows - 2;
      const vimState = vimStateRef.current;

      term.write('\x1b[?25l');
      term.write('\x1b[2J');
      term.write('\x1b[H');

      for (let i = 0; i < contentRows; i++) {
        const lineNum = i;
        term.write(`\x1b[${i + 1};1H`);

        if (lineNum < vimState.lines.length) {
          const lineNumStr = String(lineNum + 1).padStart(4, ' ');
          term.write(`\x1b[33m${lineNumStr}\x1b[0m `);
          const line = vimState.lines[lineNum] || '';
          const maxLineLen = cols - 6;
          const displayLine = line.length > maxLineLen ? line.slice(0, maxLineLen - 1) + '…' : line;
          term.write(displayLine);
        } else {
          term.write(`\x1b[34m   ~\x1b[0m`);
        }
        term.write('\x1b[K');
      }

      // Status line
      const statusRow = rows - 1;
      term.write(`\x1b[${statusRow};1H\x1b[7m`);
      const leftPart = ` "${vimState.filename}" [readonly] ${vimState.lines.length}L, ${vimState.content.length}B`;
      const rightPart = `1,1   All `;
      const padding = cols - leftPart.length - rightPart.length;
      term.write(leftPart + ' '.repeat(Math.max(0, padding)) + rightPart + '\x1b[0m');

      // Command line
      term.write(`\x1b[${rows};1H\x1b[K\x1b[90mType :q to exit\x1b[0m`);
    }
  }, [state.vimMode]);

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
            {state.vimMode ? `vim - ${getBasename(state.vimMode.filePath)}` : 'terminal'}
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
