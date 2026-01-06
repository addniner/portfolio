import type { Terminal } from '@xterm/xterm';
import { highlight, type Theme } from 'cli-highlight';
import { getBasename } from '@/lib/filesystem';

// Helper to create ANSI color formatter
const ansi = (code: string) => (text: string) => `${code}${text}\x1b[0m`;

// Dracula theme for cli-highlight
const draculaTheme: Theme = {
  keyword: ansi('\x1b[38;2;255;121;198m'),    // #ff79c6 - pink
  built_in: ansi('\x1b[38;2;139;233;253m'),   // #8be9fd - cyan
  type: ansi('\x1b[38;2;139;233;253m'),       // #8be9fd - cyan
  literal: ansi('\x1b[38;2;189;147;249m'),    // #bd93f9 - purple
  number: ansi('\x1b[38;2;189;147;249m'),     // #bd93f9 - purple
  regexp: ansi('\x1b[38;2;255;85;85m'),       // #ff5555 - red
  string: ansi('\x1b[38;2;241;250;140m'),     // #f1fa8c - yellow
  subst: ansi('\x1b[38;2;248;248;242m'),      // #f8f8f2 - foreground
  symbol: ansi('\x1b[38;2;255;184;108m'),     // #ffb86c - orange
  class: ansi('\x1b[38;2;139;233;253m'),      // #8be9fd - cyan
  function: ansi('\x1b[38;2;80;250;123m'),    // #50fa7b - green
  title: ansi('\x1b[38;2;80;250;123m'),       // #50fa7b - green
  params: ansi('\x1b[38;2;255;184;108m'),     // #ffb86c - orange
  comment: ansi('\x1b[38;2;98;114;164m'),     // #6272a4 - comment
  doctag: ansi('\x1b[38;2;139;233;253m'),     // #8be9fd - cyan
  meta: ansi('\x1b[38;2;255;121;198m'),       // #ff79c6 - pink
  'meta-keyword': ansi('\x1b[38;2;255;121;198m'),
  'meta-string': ansi('\x1b[38;2;241;250;140m'),
  section: ansi('\x1b[38;2;189;147;249m\x1b[1m'), // #bd93f9 bold - purple (headings)
  tag: ansi('\x1b[38;2;255;121;198m'),        // #ff79c6 - pink
  name: ansi('\x1b[38;2;139;233;253m'),       // #8be9fd - cyan
  'builtin-name': ansi('\x1b[38;2;139;233;253m'),
  attr: ansi('\x1b[38;2;80;250;123m'),        // #50fa7b - green
  attribute: ansi('\x1b[38;2;80;250;123m'),   // #50fa7b - green
  variable: ansi('\x1b[38;2;248;248;242m'),   // #f8f8f2 - foreground
  bullet: ansi('\x1b[38;2;139;233;253m'),     // #8be9fd - cyan (list markers)
  code: ansi('\x1b[38;2;80;250;123m'),        // #50fa7b - green (inline code)
  emphasis: ansi('\x1b[3m\x1b[38;2;255;121;198m'), // italic pink
  strong: ansi('\x1b[1m\x1b[38;2;255;184;108m'),  // bold orange
  formula: ansi('\x1b[38;2;139;233;253m'),    // #8be9fd - cyan
  link: ansi('\x1b[38;2;139;233;253m'),       // #8be9fd - cyan
  quote: ansi('\x1b[38;2;241;250;140m'),      // #f1fa8c - yellow (blockquote)
  'selector-tag': ansi('\x1b[38;2;255;121;198m'),
  'selector-id': ansi('\x1b[38;2;80;250;123m'),
  'selector-class': ansi('\x1b[38;2;80;250;123m'),
  'selector-attr': ansi('\x1b[38;2;80;250;123m'),
  'selector-pseudo': ansi('\x1b[38;2;80;250;123m'),
  'template-tag': ansi('\x1b[38;2;255;121;198m'),
  'template-variable': ansi('\x1b[38;2;80;250;123m'),
  addition: ansi('\x1b[38;2;80;250;123m'),    // #50fa7b - green
  deletion: ansi('\x1b[38;2;255;85;85m'),     // #ff5555 - red
  default: ansi('\x1b[38;2;248;248;242m'),    // #f8f8f2 - foreground
};

// Get language from file extension
function getLanguageFromFilename(filename: string): string | undefined {
  const ext = filename.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    md: 'markdown',
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    css: 'css',
    html: 'html',
    sh: 'bash',
    bash: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    sql: 'sql',
    xml: 'xml',
  };
  return ext ? langMap[ext] : undefined;
}

// Post-process markdown to better highlight code fences
function postProcessMarkdown(lines: string[]): string[] {
  const codeFenceColor = '\x1b[38;2;139;233;253m'; // cyan
  const reset = '\x1b[0m';

  return lines.map(line => {
    // Check if line starts with ``` (code fence) - handle both raw and already processed
    const trimmed = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
    if (trimmed.startsWith('```')) {
      // Replace the entire line with colored version
      return `${codeFenceColor}${trimmed}${reset}`;
    }
    return line;
  });
}

// Highlight content using cli-highlight
function highlightContent(content: string, language?: string): string[] {
  try {
    const highlighted = highlight(content, {
      language,
      theme: draculaTheme,
    });
    let lines = highlighted.split('\n');

    // Post-process markdown files to better highlight code fences
    if (language === 'markdown') {
      lines = postProcessMarkdown(lines);
    }

    return lines;
  } catch {
    // Fallback to plain text if highlighting fails
    return content.split('\n');
  }
}

// Vim mode state
export interface VimState {
  content: string;
  lines: string[];
  highlightedLines: string[];
  filePath: string;
  filename: string;
  language?: string;
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
    const filename = getBasename(filePath);
    const language = getLanguageFromFilename(filename);
    const highlightedLines = highlightContent(content, language);

    this.state = {
      content,
      lines,
      highlightedLines,
      filePath,
      filename,
      language,
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
    const contentRows = rows - 3;

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
    const contentRows = rows - 3;

    // Adjust scroll offset if needed
    this.state.scrollOffset = Math.min(
      this.state.scrollOffset,
      Math.max(0, this.state.lines.length - contentRows)
    );

    this.render();
  }

  // Handle mouse wheel scroll (called from XTerminal)
  handleWheel(deltaY: number): void {
    if (!this.state) return;

    const rows = this.term.rows;
    const contentRows = rows - 3; // Reserve 2 rows for status bar and command line
    const scrollLines = deltaY > 0 ? 3 : -3; // Scroll 3 lines at a time

    // Calculate new scroll offset (scroll the view, not cursor)
    // Max offset allows last line to be visible at the bottom of content area
    const maxScrollOffset = Math.max(0, this.state.lines.length - contentRows);
    const newScrollOffset = Math.max(0, Math.min(maxScrollOffset, this.state.scrollOffset + scrollLines));

    // Only re-render if scroll actually changed
    if (newScrollOffset !== this.state.scrollOffset) {
      this.state.scrollOffset = newScrollOffset;

      // Keep cursor within visible area
      if (this.state.cursorLine < this.state.scrollOffset) {
        this.state.cursorLine = this.state.scrollOffset;
      } else if (this.state.cursorLine >= this.state.scrollOffset + contentRows) {
        this.state.cursorLine = this.state.scrollOffset + contentRows - 1;
      }

      this.render();
    }
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
    // Reserve 3 rows: status bar, command line, and buffer for xterm rendering
    const contentRows = rows - 3;

    // Clear screen and hide cursor
    this.term.write('\x1b[?25l');
    this.term.write('\x1b[2J');
    this.term.write('\x1b[H');

    // Render content lines (rows 1 to contentRows)
    const startLine = this.state.scrollOffset;
    for (let i = 0; i < contentRows; i++) {
      const lineNum = startLine + i;
      this.term.write(`\x1b[${i + 1};1H`);

      if (lineNum < this.state.lines.length) {
        const lineNumStr = String(lineNum + 1).padStart(4, ' ');
        this.term.write(`\x1b[33m${lineNumStr}\x1b[0m `);

        // Use pre-highlighted line (already contains ANSI codes)
        const highlightedLine = this.state.highlightedLines[lineNum] || '';
        // For truncation, we need to be careful with ANSI codes
        // Simple approach: just output the highlighted line and let terminal handle overflow
        this.term.write(highlightedLine);
      } else {
        this.term.write(`\x1b[34m   ~\x1b[0m`);
      }

      this.term.write('\x1b[K');
    }

    // Status line (row contentRows + 1, which is rows - 2)
    const statusRow = contentRows + 1;
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

    // Command line (row contentRows + 2, which is rows - 1)
    const cmdRow = contentRows + 2;
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
