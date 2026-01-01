/**
 * TerminalLineBuffer - Single Source of Truth for Line State (ZLE-style)
 *
 * Zsh의 ZLE(Zsh Line Editor)처럼 모든 라인 상태를 하나의 객체에서 관리.
 * Renderer는 이 상태를 받아서 그리기만 함.
 *
 * State:
 * - buffer: 현재 입력 텍스트
 * - cursorPos: 커서 위치
 * - hint: 자동완성 힌트 (회색 텍스트)
 * - history: 명령어 히스토리
 */

export interface LineState {
  buffer: string;
  cursorPos: number;
  hint: string;
}

interface HistoryState {
  entries: string[];
  index: number; // -1 = current input, 0+ = history entries from end
  savedInput: string; // Save current input when navigating history
}

export class TerminalLineBuffer {
  private buffer: string = '';
  private cursorPos: number = 0;
  private hint: string = '';
  private history: HistoryState = {
    entries: [],
    index: -1,
    savedInput: '',
  };

  // Get complete state for rendering
  getState(): LineState {
    return {
      buffer: this.buffer,
      cursorPos: this.cursorPos,
      hint: this.hint,
    };
  }

  getBuffer(): string {
    return this.buffer;
  }

  getCursorPos(): number {
    return this.cursorPos;
  }

  getHint(): string {
    return this.hint;
  }

  getHistory(): string[] {
    return this.history.entries;
  }

  // Set hint (autosuggestion)
  setHint(hint: string): void {
    this.hint = hint;
  }

  // Clear hint
  clearHint(): void {
    this.hint = '';
  }

  // Insert text at cursor position
  insert(text: string): void {
    const before = this.buffer.slice(0, this.cursorPos);
    const after = this.buffer.slice(this.cursorPos);
    this.buffer = before + text + after;
    this.cursorPos += text.length;
    this.hint = ''; // Clear hint on input
  }

  // Delete character before cursor (Backspace)
  deleteBackward(): string | null {
    if (this.cursorPos === 0) return null;

    const deleted = this.buffer[this.cursorPos - 1];
    this.buffer = this.buffer.slice(0, this.cursorPos - 1) + this.buffer.slice(this.cursorPos);
    this.cursorPos--;
    this.hint = ''; // Clear hint on edit
    return deleted;
  }

  // Delete character at cursor (Delete key)
  deleteForward(): string | null {
    if (this.cursorPos >= this.buffer.length) return null;

    const deleted = this.buffer[this.cursorPos];
    this.buffer = this.buffer.slice(0, this.cursorPos) + this.buffer.slice(this.cursorPos + 1);
    this.hint = ''; // Clear hint on edit
    return deleted;
  }

  // Delete word before cursor
  deleteWord(): string {
    if (this.cursorPos === 0) return '';

    let end = this.cursorPos;
    // Skip spaces
    while (end > 0 && this.buffer[end - 1] === ' ') end--;
    // Skip word
    let start = end;
    while (start > 0 && this.buffer[start - 1] !== ' ') start--;

    const deleted = this.buffer.slice(start, this.cursorPos);
    this.buffer = this.buffer.slice(0, start) + this.buffer.slice(this.cursorPos);
    this.cursorPos = start;
    this.hint = ''; // Clear hint on edit
    return deleted;
  }

  // Delete from cursor to end of line
  deleteToEnd(): string {
    const deleted = this.buffer.slice(this.cursorPos);
    this.buffer = this.buffer.slice(0, this.cursorPos);
    this.hint = ''; // Clear hint on edit
    return deleted;
  }

  // Delete from start to cursor
  deleteToStart(): string {
    const deleted = this.buffer.slice(0, this.cursorPos);
    this.buffer = this.buffer.slice(this.cursorPos);
    this.cursorPos = 0;
    this.hint = ''; // Clear hint on edit
    return deleted;
  }

  // Move cursor left by n characters
  moveCursorLeft(n: number = 1): number {
    const moved = Math.min(n, this.cursorPos);
    this.cursorPos -= moved;
    if (moved > 0) this.hint = ''; // Clear hint when cursor moves
    return moved;
  }

  // Move cursor right by n characters
  moveCursorRight(n: number = 1): number {
    const moved = Math.min(n, this.buffer.length - this.cursorPos);
    this.cursorPos += moved;
    return moved;
  }

  // Move cursor to start
  moveCursorToStart(): number {
    const moved = this.cursorPos;
    this.cursorPos = 0;
    if (moved > 0) this.hint = ''; // Clear hint when cursor moves
    return moved;
  }

  // Move cursor to end
  moveCursorToEnd(): number {
    const moved = this.buffer.length - this.cursorPos;
    this.cursorPos = this.buffer.length;
    return moved;
  }

  // Move cursor to previous word boundary
  moveCursorWordLeft(): number {
    const startPos = this.cursorPos;
    // Skip spaces
    while (this.cursorPos > 0 && this.buffer[this.cursorPos - 1] === ' ') {
      this.cursorPos--;
    }
    // Skip word
    while (this.cursorPos > 0 && this.buffer[this.cursorPos - 1] !== ' ') {
      this.cursorPos--;
    }
    const moved = startPos - this.cursorPos;
    if (moved > 0) this.hint = ''; // Clear hint when cursor moves
    return moved;
  }

  // Move cursor to next word boundary
  moveCursorWordRight(): number {
    const startPos = this.cursorPos;
    // Skip word
    while (this.cursorPos < this.buffer.length && this.buffer[this.cursorPos] !== ' ') {
      this.cursorPos++;
    }
    // Skip spaces
    while (this.cursorPos < this.buffer.length && this.buffer[this.cursorPos] === ' ') {
      this.cursorPos++;
    }
    return this.cursorPos - startPos;
  }

  // Set entire line (for history navigation, tab completion)
  setLine(text: string): void {
    this.buffer = text;
    this.cursorPos = text.length;
    this.hint = ''; // Clear hint
  }

  // Clear line and return old content
  clear(): string {
    const old = this.buffer;
    this.buffer = '';
    this.cursorPos = 0;
    this.hint = '';
    return old;
  }

  // Submit line (Enter pressed)
  submit(): string {
    const line = this.buffer;

    // Add to history if non-empty
    if (line.trim()) {
      this.history.entries.push(line);
    }

    // Reset state
    this.buffer = '';
    this.cursorPos = 0;
    this.hint = '';
    this.history.index = -1;
    this.history.savedInput = '';

    return line;
  }

  // Navigate history up
  historyUp(): string | null {
    if (this.history.entries.length === 0) return null;

    // Save current input when first navigating
    if (this.history.index === -1) {
      this.history.savedInput = this.buffer;
    }

    const newIndex = Math.min(this.history.index + 1, this.history.entries.length - 1);
    if (newIndex === this.history.index) return null;

    this.history.index = newIndex;
    const entry = this.history.entries[this.history.entries.length - 1 - newIndex];
    this.setLine(entry);
    return entry;
  }

  // Navigate history down
  historyDown(): string | null {
    if (this.history.index === -1) return null;

    const newIndex = this.history.index - 1;
    this.history.index = newIndex;

    if (newIndex === -1) {
      // Restore saved input
      this.setLine(this.history.savedInput);
      return this.history.savedInput;
    }

    const entry = this.history.entries[this.history.entries.length - 1 - newIndex];
    this.setLine(entry);
    return entry;
  }

  // Cancel (Ctrl+C)
  cancel(): void {
    this.buffer = '';
    this.cursorPos = 0;
    this.hint = '';
    this.history.index = -1;
    this.history.savedInput = '';
  }
}
