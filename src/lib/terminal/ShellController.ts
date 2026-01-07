import type { Terminal } from '@xterm/xterm';
import { createContext, MenuComplete } from '@/lib/completions';
import { TerminalLineBuffer } from './TerminalLineBuffer';
import { TerminalRenderer } from './TerminalRenderer';
import type { Shell } from '@/lib/shell';

export interface ShellControllerOptions {
  shell: Shell;
  onVimEnter: (vimMode: { filePath: string; content: string }) => void;
  onUrlChange: (urlPath: string) => void;
}

/**
 * ShellController - xterm 내에서 쉘 입력을 관리하는 클래스
 *
 * Shell 클래스와 xterm 터미널 사이의 브릿지 역할.
 * - 터미널 입력 처리 (키보드, 자동완성 등)
 * - Shell.execute() 호출
 * - 터미널 렌더링
 */
export class ShellController {
  private term: Terminal;
  private shell: Shell;
  private lineBuffer: TerminalLineBuffer;
  private renderer: TerminalRenderer;
  private menuComplete: MenuComplete;
  private options: ShellControllerOptions;
  private isComposing = false;

  constructor(term: Terminal, options: ShellControllerOptions) {
    this.term = term;
    this.shell = options.shell;
    this.options = options;
    this.lineBuffer = new TerminalLineBuffer();
    this.menuComplete = new MenuComplete();

    // 프롬프트 생성 함수
    const getPrompt = () => {
      const cwd = this.shell.getCwd();
      const displayPath = cwd.replace('/home/guest', '~');
      return `\x1b[32mguest@addniner\x1b[0m:\x1b[34m${displayPath}\x1b[0m$ `;
    };

    this.renderer = new TerminalRenderer(term, { getPrompt });

    // IME composition 이벤트 처리 (한글 입력 등)
    this.setupCompositionHandlers();
  }

  /**
   * IME composition 이벤트 핸들러 설정
   * 한글 등 조합형 문자 입력 시 자소 분리 방지
   */
  private setupCompositionHandlers(): void {
    // xterm 내부의 textarea 요소 찾기
    const textarea = this.term.element?.querySelector('textarea');
    if (!textarea) return;

    textarea.addEventListener('compositionstart', () => {
      this.isComposing = true;
    });

    textarea.addEventListener('compositionend', (e: CompositionEvent) => {
      this.isComposing = false;
      // 조합 완료된 문자 삽입
      if (e.data) {
        this.lineBuffer.insert(e.data);
        this.updateHint();
      }
    });
  }

  getHistory(): string[] {
    return this.shell.getHistory();
  }

  writeWelcome(): void {
    this.term.writeln('\x1b[32mPORTFOLIO OS v1.0.0\x1b[0m');
    this.term.writeln('\x1b[90mType \'help\' for commands.\x1b[0m');
    this.term.writeln('');
    this.renderer.writePrompt();
  }

  /**
   * Write a new prompt (used after vim exit)
   */
  writePrompt(): void {
    this.renderer.writePrompt();
  }

  executeCommand(cmd: string, opts?: { silent?: boolean }): void {
    if (!opts?.silent) {
      this.term.write(cmd);
      this.term.writeln('');
    }
    this.handleCommand(cmd, opts);
  }

  handleInput(data: string): void {
    const code = data.charCodeAt(0);

    // Tab - autocomplete
    if (code === 9) {
      this.applyAutocomplete();
      return;
    }

    // Reset menu-complete state for any non-Tab input
    if (this.menuComplete.isActive()) {
      this.menuComplete.reset();
      this.renderer.clearMenu(this.lineBuffer.getState());
    }

    // Enter
    if (code === 13) {
      const input = this.lineBuffer.getBuffer();
      const bufferState = this.lineBuffer.getState();

      // clear가 체인의 어디에 있든 감지
      const hasClear = /(?:^|&&|;)\s*clear\s*(?:$|&&|;)/.test(input.trim());

      if (hasClear) {
        this.lineBuffer.submit();
        this.handleCommand(input);
      } else {
        this.renderer.finalizeLine(bufferState);
        this.lineBuffer.submit();
        this.handleCommand(input);
      }
      return;
    }

    // Backspace
    if (code === 127) {
      if (this.lineBuffer.deleteBackward()) {
        this.updateHint();
      }
      return;
    }

    // Option+Backspace - delete word
    if (data === '\x1b\x7f') {
      this.lineBuffer.deleteWord();
      this.updateHint();
      return;
    }

    // Ctrl+W - delete word
    if (code === 23) {
      this.lineBuffer.deleteWord();
      this.updateHint();
      return;
    }

    // Ctrl+A - move to start
    if (code === 1) {
      this.lineBuffer.moveCursorToStart();
      this.render();
      return;
    }

    // Ctrl+E - move to end
    if (code === 5) {
      this.lineBuffer.moveCursorToEnd();
      this.updateHint();
      return;
    }

    // Ctrl+K - delete to end
    if (code === 11) {
      this.lineBuffer.deleteToEnd();
      this.updateHint();
      return;
    }

    // Ctrl+C - cancel
    if (code === 3) {
      this.renderer.handleCancel(this.lineBuffer.getState());
      this.lineBuffer.cancel();
      this.renderer.writePrompt();
      return;
    }

    // Ctrl+L - clear screen
    if (code === 12) {
      this.renderer.clearScreen(this.lineBuffer.getState());
      return;
    }

    // Ctrl+U - clear line before cursor
    if (code === 21) {
      this.lineBuffer.deleteToStart();
      this.render();
      return;
    }

    // Arrow Up - history
    if (data === '\x1b[A') {
      if (this.lineBuffer.historyUp() !== null) {
        this.updateHint();
      }
      return;
    }

    // Arrow Down - history
    if (data === '\x1b[B') {
      if (this.lineBuffer.historyDown() !== null) {
        this.updateHint();
      }
      return;
    }

    // Arrow Left
    if (data === '\x1b[D') {
      this.lineBuffer.moveCursorLeft();
      this.render();
      return;
    }

    // Arrow Right
    if (data === '\x1b[C') {
      this.lineBuffer.moveCursorRight();
      this.updateHint();
      return;
    }

    // Option+Left - word left
    if (data === '\x1bb') {
      this.lineBuffer.moveCursorWordLeft();
      this.render();
      return;
    }

    // Option+Right - word right
    if (data === '\x1bf') {
      this.lineBuffer.moveCursorWordRight();
      this.updateHint();
      return;
    }

    // Home key
    if (data === '\x1b[H' || data === '\x1bOH') {
      this.lineBuffer.moveCursorToStart();
      this.render();
      return;
    }

    // End key
    if (data === '\x1b[F' || data === '\x1bOF') {
      this.lineBuffer.moveCursorToEnd();
      this.updateHint();
      return;
    }

    // Delete key
    if (data === '\x1b[3~') {
      if (this.lineBuffer.deleteForward()) {
        this.updateHint();
      }
      return;
    }

    // Printable characters (IME 조합 중이 아닐 때만)
    if (code >= 32 && !this.isComposing) {
      this.lineBuffer.insert(data);
      this.updateHint();
    }
  }

  private render(): void {
    this.renderer.render(this.lineBuffer.getState());
  }

  private updateHint(): void {
    const buffer = this.lineBuffer.getBuffer();
    const cursorPos = this.lineBuffer.getCursorPos();

    if (cursorPos !== buffer.length) {
      this.lineBuffer.clearHint();
      this.render();
      return;
    }

    const completions = this.shell.complete(buffer);
    if (completions.length === 1) {
      const completion = completions[0];
      const ctx = createContext(buffer, this.shell.getCwd());
      const hint = completion.slice(ctx.prefix.length);
      this.lineBuffer.setHint(hint);
    } else {
      this.lineBuffer.clearHint();
    }
    this.render();
  }

  private applyAutocomplete(): void {
    const buffer = this.lineBuffer.getBuffer();
    const cwd = this.shell.getCwd();
    const result = this.menuComplete.complete(buffer, cwd);

    if (!result) return;

    if (result.suffix) {
      this.lineBuffer.insert(result.suffix);
      this.updateHint();
    } else if (result.newBuffer !== buffer) {
      this.lineBuffer.setLine(result.newBuffer);

      if (result.displayCompletions) {
        this.renderer.showMenuCompletions(
          result.displayCompletions.items,
          result.displayCompletions.selectedIndex,
          this.lineBuffer.getState()
        );
      } else {
        this.render();
      }
    }
  }

  private handleCommand(input: string, opts?: { silent?: boolean }): void {
    const silent = opts?.silent ?? false;

    // clear 명령어 특별 처리 (터미널 화면 지우기)
    // clear가 체인의 어디에 있든 감지: "clear", "clear;", "clear &&", "&& clear", "; clear"
    const hasClear = /(?:^|&&|;)\s*clear\s*(?:$|&&|;)/.test(input.trim());

    if (hasClear) {
      this.renderer.clearForCommand();
    }

    // Shell을 통해 명령어 실행
    const result = this.shell.execute(input);

    // Output
    if (result.output && !silent) {
      this.renderer.writeOutput(result.output);
    }

    // vim 모드 진입 시 콜백 호출
    const editorMode = this.shell.getEditorMode();
    if (editorMode) {
      this.options.onVimEnter(editorMode);
      return; // Don't write prompt, we're in vim now
    }

    // URL 변경 (silent 여부와 무관하게 항상 실행)
    if (result.urlPath) {
      this.options.onUrlChange(result.urlPath);
    }

    if (!silent) {
      this.renderer.writePrompt();
    }
  }
}
