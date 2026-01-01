/**
 * TerminalRenderer - Stateless Display Layer (Zsh-style)
 *
 * 이 렌더러는 자체 상태를 가지지 않음.
 * LineBuffer의 상태를 받아서 그리기만 함.
 *
 * Architecture:
 * - render(state): 전체 입력 줄을 다시 그림
 * - 커서 깜빡임 방지를 위해 hide/show cursor 사용
 * - ANSI escape sequence로 효율적인 렌더링
 */

import type { Terminal } from '@xterm/xterm';
import type { LineState } from './TerminalLineBuffer';

export interface RendererOptions {
  getPrompt: () => string;
}

export class TerminalRenderer {
  private term: Terminal;
  private options: RendererOptions;

  // Prompt cache (for cursor position calculation)
  private promptText: string = '';
  private promptDisplayWidth: number = 0;

  // Menu state (메뉴가 현재 표시 중인지)
  private menuVisible: boolean = false;

  constructor(term: Terminal, options: RendererOptions) {
    this.term = term;
    this.options = options;
  }

  // Calculate display width (wide chars = 2, others = 1)
  getDisplayWidth(str: string): number {
    let width = 0;
    for (const char of str) {
      if (/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF\u4E00-\u9FFF\uFF00-\uFFEF]/.test(char)) {
        width += 2;
      } else {
        width += 1;
      }
    }
    return width;
  }

  // Strip ANSI escape codes from string
  private stripAnsi(str: string): string {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
  }

  /**
   * Core render function - draws the entire line based on state
   * This is the ONLY way to update the display
   */
  render(state: LineState): void {
    const { buffer, cursorPos, hint } = state;
    const beforeCursor = buffer.slice(0, cursorPos);
    const cursorOffset = this.promptDisplayWidth + this.getDisplayWidth(beforeCursor);

    // Hide cursor to prevent flicker
    this.term.write('\x1b[?25l');

    // Move to beginning of line and clear
    this.term.write('\r');
    this.term.write('\x1b[K');

    // Write: prompt + input + hint (in gray)
    this.term.write(this.promptText);
    this.term.write(buffer);
    if (hint) {
      this.term.write(`\x1b[90m${hint}\x1b[0m`);
    }

    // Move cursor to correct position
    this.term.write('\r');
    if (cursorOffset > 0) {
      this.term.write(`\x1b[${cursorOffset}C`);
    }

    // Show cursor again
    this.term.write('\x1b[?25h');
  }

  /**
   * Start a new input line with prompt
   */
  writePrompt(): void {
    this.promptText = this.options.getPrompt();
    this.promptDisplayWidth = this.getDisplayWidth(this.stripAnsi(this.promptText));
    this.term.write(this.promptText);
  }

  /**
   * Finalize current line (Enter pressed) - move to next line
   */
  finalizeLine(state: LineState): void {
    // If there's a hint, clear it first by re-rendering without hint
    if (state.hint) {
      this.render({ ...state, hint: '' });
    }
    this.term.writeln('');
  }

  /**
   * Write output lines (command results)
   */
  writeOutput(output: string): void {
    const lines = output.split('\n');
    lines.forEach((line) => this.term.writeln(line));
  }

  /**
   * Write a single line
   */
  writeLine(line: string): void {
    this.term.writeln(line);
  }

  /**
   * Handle Ctrl+C - show ^C and start new line
   */
  handleCancel(state: LineState): void {
    // Clear hint first
    if (state.hint) {
      this.render({ ...state, hint: '' });
    }
    this.term.writeln('^C');
  }

  /**
   * Clear screen (Ctrl+L)
   */
  clearScreen(state: LineState): void {
    this.term.write('\x1b[2K'); // Clear current line
    this.term.write('\r');
    this.term.clear(); // Clear scrollback

    // Redraw prompt and render state
    this.promptText = this.options.getPrompt();
    this.promptDisplayWidth = this.getDisplayWidth(this.stripAnsi(this.promptText));

    // Render without going through full render() since we just cleared
    this.term.write(this.promptText);
    this.term.write(state.buffer);
    if (state.hint) {
      this.term.write(`\x1b[90m${state.hint}\x1b[0m`);
    }

    // Position cursor
    if (state.cursorPos < state.buffer.length) {
      const afterCursor = state.buffer.slice(state.cursorPos);
      const afterWidth = this.getDisplayWidth(afterCursor);
      if (state.hint) {
        const hintWidth = this.getDisplayWidth(state.hint);
        this.term.write(`\x1b[${afterWidth + hintWidth}D`);
      } else {
        this.term.write(`\x1b[${afterWidth}D`);
      }
    }
  }

  /**
   * Clear screen for 'clear' command
   */
  clearForCommand(): void {
    this.term.write('\x1b[2K');
    this.term.write('\r');
    this.term.clear();
  }

  /**
   * Show autocomplete options (legacy)
   */
  showCompletions(completions: string[], state: LineState): void {
    // Clear hint and finalize current line
    if (state.hint) {
      this.render({ ...state, hint: '' });
    }
    this.term.writeln('');

    // Show completions
    this.term.writeln(completions.join('  '));

    // Start new prompt with current buffer
    this.writePrompt();
    this.term.write(state.buffer);
  }

  /**
   * Show menu completion with highlight (Zsh menu-select style)
   *
   * 화면 구조 (Zsh 스타일):
   *   프롬프트 줄 (현재 입력)
   *   메뉴 줄 (completions) <- 아래에 표시
   */
  showMenuCompletions(
    items: string[],
    selectedIndex: number,
    state: LineState
  ): void {
    // Hide cursor to prevent flicker (Zsh 스타일)
    this.term.write('\x1b[?25l');

    // 프롬프트 줄 다시 그리기
    this.term.write('\r');
    this.term.write('\x1b[2K');
    this.writePrompt();
    this.term.write(state.buffer);

    if (this.menuVisible) {
      // 이미 메뉴가 표시 중: 메뉴 줄로 이동해서 업데이트
      this.term.write('\x1b[s'); // 커서 위치 저장
      this.term.writeln(''); // 다음 줄로
      this.term.write('\x1b[2K'); // 메뉴 줄 지우기
    } else {
      // 첫 메뉴 표시
      if (state.hint) {
        this.render({ ...state, hint: '' });
      }
      this.term.write('\x1b[s'); // 커서 위치 저장
      this.term.writeln(''); // 다음 줄로
      this.menuVisible = true;
    }

    // 메뉴 그리기 (하이라이트 포함)
    const parts = items.map((item, i) => {
      if (i === selectedIndex) {
        return `\x1b[7m${item}\x1b[0m`;
      }
      return item;
    });
    this.term.write(parts.join('  '));

    // 커서를 프롬프트 줄로 복원
    this.term.write('\x1b[u');

    // Show cursor again
    this.term.write('\x1b[?25h');
  }

  /**
   * Clear menu and redraw prompt (메뉴 닫기)
   */
  clearMenu(_state: LineState): void {
    if (!this.menuVisible) return;

    // Hide cursor to prevent flicker
    this.term.write('\x1b[?25l');

    // 메뉴 줄로 이동해서 지우기
    this.term.write('\x1b[s'); // 커서 위치 저장
    this.term.writeln(''); // 다음 줄(메뉴 줄)로
    this.term.write('\x1b[2K'); // 메뉴 줄 지우기
    this.term.write('\x1b[u'); // 커서 복원

    // Show cursor again
    this.term.write('\x1b[?25h');

    this.menuVisible = false;
  }

  /**
   * 메뉴 상태 리셋 (외부에서 호출)
   */
  resetMenu(): void {
    this.menuVisible = false;
  }

  /**
   * 메뉴가 표시 중인지
   */
  isMenuVisible(): boolean {
    return this.menuVisible;
  }
}
