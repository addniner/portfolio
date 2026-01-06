import type { Terminal } from '@xterm/xterm';
import { getBasename } from '@/lib/filesystem';

// Vim mode state
export interface VimState {
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

export interface VimControllerOptions {
  onExit: () => void;
}

/**
 * VimController - xterm 내에서 vim 모드를 관리하는 클래스
 */
export class VimController {
  private term: Terminal;
  private state: VimState | null = null;
  private options: VimControllerOptions;

  constructor(term: Terminal, options: VimControllerOptions) {
    this.term = term;
    this.options = options;
  }

  isActive(): boolean {
    return this.state !== null;
  }

  getState(): VimState | null {
    return this.state;
  }

  enter(filePath: string, content: string): void {
    const lines = content.split('\n');
    this.state = {
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

    // Switch to alternate screen buffer
    this.term.write('\x1b[?1049h');
    this.render();
  }

  exit(): void {
    this.state = null;

    // Switch back to main screen buffer
    this.term.write('\x1b[?1049l');
    this.term.write('\x1b[?25h'); // Show cursor

    this.options.onExit();
  }

  // Sync state from external source (e.g., VimViewer close button)
  syncFromExternal(vimMode: { filePath: string; content: string } | null): void {
    if (!vimMode && this.state) {
      // External says close but we're open - exit vim mode
      this.state = null;
      this.term.write('\x1b[?1049l');
      this.term.write('\x1b[?25h');
      // Call onExit to restore terminal prompt
      this.options.onExit();
    } else if (vimMode && !this.state) {
      // External says open but we're closed
      this.enter(vimMode.filePath, vimMode.content);
    }
  }

  handleInput(data: string): void {
    if (!this.state) return;

    const code = data.charCodeAt(0);
    const rows = this.term.rows;
    const contentRows = rows - 2;

    // Command mode
    if (this.state.commandMode) {
      this.handleCommandModeInput(data, code);
      return;
    }

    // Normal mode
    this.handleNormalModeInput(data, code, contentRows);
  }

  handleResize(): void {
    if (!this.state) return;

    const rows = this.term.rows;
    const contentRows = rows - 2;

    // Adjust scroll offset if needed
    this.state.scrollOffset = Math.min(
      this.state.scrollOffset,
      Math.max(0, this.state.lines.length - contentRows)
    );

    this.render();
  }

  private handleCommandModeInput(data: string, code: number): void {
    if (!this.state) return;

    if (code === 13) { // Enter
      const cmd = this.state.commandBuffer.toLowerCase();
      if (cmd === 'q' || cmd === 'q!' || cmd === 'wq' || cmd === 'wq!' || cmd === 'x') {
        this.exit();
        return;
      } else if (cmd === 'w' || cmd.startsWith('w ')) {
        this.state.message = "E45: 'readonly' option is set (add ! to override)";
        this.state.commandMode = false;
        this.state.commandBuffer = '';
      } else {
        this.state.message = `E492: Not an editor command: ${this.state.commandBuffer}`;
        this.state.commandMode = false;
        this.state.commandBuffer = '';
      }
      this.render();
      return;
    }

    if (code === 27) { // Escape
      this.state.commandMode = false;
      this.state.commandBuffer = '';
      this.state.message = '';
      this.render();
      return;
    }

    if (code === 127) { // Backspace
      if (this.state.commandBuffer.length > 0) {
        this.state.commandBuffer = this.state.commandBuffer.slice(0, -1);
      } else {
        this.state.commandMode = false;
      }
      this.render();
      return;
    }

    // Add character to command buffer
    if (code >= 32 && code < 127) {
      this.state.commandBuffer += data;
      this.render();
    }
  }

  private handleNormalModeInput(data: string, code: number, contentRows: number): void {
    if (!this.state) return;

    if (data === ':') {
      this.state.commandMode = true;
      this.state.commandBuffer = '';
      this.state.message = '';
      this.render();
      return;
    }

    if (code === 27) { // Escape
      this.state.message = '';
      this.render();
      return;
    }

    // Navigation
    if (data === 'j' || data === '\x1b[B') { // Down
      if (this.state.cursorLine < this.state.lines.length - 1) {
        this.state.cursorLine++;
        if (this.state.cursorLine >= this.state.scrollOffset + contentRows) {
          this.state.scrollOffset = this.state.cursorLine - contentRows + 1;
        }
        this.render();
      }
      return;
    }

    if (data === 'k' || data === '\x1b[A') { // Up
      if (this.state.cursorLine > 0) {
        this.state.cursorLine--;
        if (this.state.cursorLine < this.state.scrollOffset) {
          this.state.scrollOffset = this.state.cursorLine;
        }
        this.render();
      }
      return;
    }

    if (data === 'G') { // Go to end
      this.state.cursorLine = this.state.lines.length - 1;
      this.state.scrollOffset = Math.max(0, this.state.lines.length - contentRows);
      this.render();
      return;
    }

    if (data === 'g') { // gg - go to start (simplified)
      this.state.cursorLine = 0;
      this.state.scrollOffset = 0;
      this.render();
      return;
    }

    if (data === ' ' || data === '\x1b[6~') { // Space or PageDown
      this.state.scrollOffset = Math.min(
        this.state.scrollOffset + contentRows,
        Math.max(0, this.state.lines.length - contentRows)
      );
      this.state.cursorLine = Math.min(
        this.state.scrollOffset + contentRows - 1,
        this.state.lines.length - 1
      );
      this.render();
      return;
    }

    if (data === '\x1b[5~') { // PageUp
      this.state.scrollOffset = Math.max(0, this.state.scrollOffset - contentRows);
      this.state.cursorLine = this.state.scrollOffset;
      this.render();
      return;
    }

    // Ctrl+D - half page down
    if (code === 4) {
      const halfPage = Math.floor(contentRows / 2);
      this.state.scrollOffset = Math.min(
        this.state.scrollOffset + halfPage,
        Math.max(0, this.state.lines.length - contentRows)
      );
      this.state.cursorLine = Math.min(
        this.state.cursorLine + halfPage,
        this.state.lines.length - 1
      );
      this.render();
      return;
    }

    // Ctrl+U - half page up
    if (code === 21) {
      const halfPage = Math.floor(contentRows / 2);
      this.state.scrollOffset = Math.max(0, this.state.scrollOffset - halfPage);
      this.state.cursorLine = Math.max(0, this.state.cursorLine - halfPage);
      this.render();
      return;
    }

    // Editing attempts - show readonly message
    if (['i', 'I', 'a', 'A', 'o', 'O', 's', 'S', 'c', 'C', 'r', 'R', 'x', 'X', 'd', 'D', 'p', 'P'].includes(data)) {
      this.state.message = 'W10: Warning: Changing a readonly file';
      this.render();
      return;
    }
  }

  private render(): void {
    if (!this.state) return;

    const rows = this.term.rows;
    const cols = this.term.cols;
    const contentRows = rows - 2;

    // Clear screen and hide cursor
    this.term.write('\x1b[?25l');
    this.term.write('\x1b[2J');
    this.term.write('\x1b[H');

    // Render content lines
    const startLine = this.state.scrollOffset;
    for (let i = 0; i < contentRows; i++) {
      const lineNum = startLine + i;
      this.term.write(`\x1b[${i + 1};1H`);

      if (lineNum < this.state.lines.length) {
        const lineNumStr = String(lineNum + 1).padStart(4, ' ');
        this.term.write(`\x1b[33m${lineNumStr}\x1b[0m `);

        const line = this.state.lines[lineNum] || '';
        const maxLineLen = cols - 6;
        const displayLine = line.length > maxLineLen ? line.slice(0, maxLineLen - 1) + '…' : line;
        this.term.write(displayLine);
      } else {
        this.term.write(`\x1b[34m   ~\x1b[0m`);
      }

      this.term.write('\x1b[K');
    }

    // Status line
    const statusRow = rows - 1;
    this.term.write(`\x1b[${statusRow};1H`);
    this.term.write('\x1b[7m');

    const filenameDisplay = `"${this.state.filename}"`;
    const readonlyFlag = '[readonly]';
    const lineInfo = `${this.state.lines.length}L, ${this.state.content.length}B`;
    const posInfo = `${this.state.cursorLine + 1},${this.state.cursorCol + 1}`;

    const percentage = this.state.lines.length <= contentRows ? 'All' :
      this.state.scrollOffset === 0 ? 'Top' :
      this.state.scrollOffset + contentRows >= this.state.lines.length ? 'Bot' :
      `${Math.round((this.state.scrollOffset / (this.state.lines.length - contentRows)) * 100)}%`;

    const leftPart = ` ${filenameDisplay} ${readonlyFlag} ${lineInfo}`;
    const rightPart = `${posInfo}   ${percentage} `;
    const padding = cols - leftPart.length - rightPart.length;

    this.term.write(leftPart);
    this.term.write(' '.repeat(Math.max(0, padding)));
    this.term.write(rightPart);
    this.term.write('\x1b[0m');

    // Command line
    const cmdRow = rows;
    this.term.write(`\x1b[${cmdRow};1H`);
    this.term.write('\x1b[K');

    if (this.state.commandMode) {
      this.term.write(`:${this.state.commandBuffer}`);
      this.term.write('\x1b[?25h');
    } else if (this.state.message) {
      if (this.state.message.startsWith('E') || this.state.message.startsWith('W')) {
        this.term.write(`\x1b[31m${this.state.message}\x1b[0m`);
      } else {
        this.term.write(`\x1b[90m${this.state.message}\x1b[0m`);
      }
    } else {
      this.term.write('\x1b[90mType :q to exit\x1b[0m');
    }
  }
}
