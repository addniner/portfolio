import type { FSNode } from '@/types/filesystem';
import type { CommandResult } from '@/types';

/**
 * Shell 상태 - UI가 구독하는 상태
 */
export interface ShellState {
  cwd: string;
  viewPath: string;
  currentProject: string | null;
  editorMode: EditorMode | null;
  history: string[];
}

/**
 * 에디터 모드 상태 (vim)
 */
export interface EditorMode {
  filePath: string;
  content: string;
}

/**
 * 명령어 실행 결과
 */
export interface ExecuteResult {
  output?: string;
  urlPath?: string;
  shouldClear?: boolean;
  error?: boolean;
}

/**
 * Shell 상태 변경 리스너
 */
export type ShellListener = (state: ShellState) => void;

/**
 * Filesystem 인터페이스 - 의존성 주입용
 */
export interface IFilesystem {
  getRoot(): FSNode;
  resolvePath(path: string): FSNode | null;
  resolvePathWithSymlinks(path: string): { node: FSNode; actualPath: string } | null;
  normalizePath(path: string, cwd: string): string;
  listDirectory(path: string): FSNode[] | null;
  getFileContent(node: FSNode): string;
  getBasename(path: string): string;
}

/**
 * 파싱된 명령어 (Shell 내부용)
 */
export interface ShellParsedCommand {
  command: string;
  args: string[];
  flags: Record<string, boolean | string>;
}

/**
 * Command 인터페이스
 */
export interface ICommand {
  name: string;
  description: string;
  usage: string;
  execute(args: string[], flags: Record<string, boolean | string>, shell: Shell): CommandResult;
}

/**
 * CommandRegistry 인터페이스
 */
export interface ICommandRegistry {
  get(name: string): ICommand | undefined;
  getNames(): string[];
  execute(parsed: ShellParsedCommand, shell: Shell): CommandResult;
}

/**
 * CompletionEngine 인터페이스
 */
export interface ICompletionEngine {
  complete(buffer: string, cwd: string): string[];
  getCompletions(buffer: string, cwd: string): { completions: string[]; type?: string } | null;
}

/**
 * Shell - 터미널 시스템의 핵심 객체
 *
 * 모든 상태와 로직을 캡슐화하며, UI는 이 객체의 상태를 구독합니다.
 */
export class Shell {
  private state: ShellState;
  private listeners: Set<ShellListener> = new Set();
  private filesystem: IFilesystem;
  private commands: ICommandRegistry;
  private completions: ICompletionEngine;

  constructor(
    filesystem: IFilesystem,
    commands: ICommandRegistry,
    completions: ICompletionEngine,
    initialState?: Partial<ShellState>
  ) {
    this.filesystem = filesystem;
    this.commands = commands;
    this.completions = completions;
    this.state = {
      cwd: '/home/guest',
      viewPath: '/home/guest',
      currentProject: null,
      editorMode: null,
      history: [],
      ...initialState,
    };
  }

  /**
   * 현재 상태 조회
   */
  getState(): ShellState {
    return { ...this.state };
  }

  /**
   * 상태 변경 구독
   */
  subscribe(listener: ShellListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 상태 변경 알림
   */
  private notify(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * 명령어 실행
   */
  execute(input: string): ExecuteResult {
    const trimmed = input.trim();
    if (!trimmed) {
      return {};
    }

    // 히스토리에 추가
    this.state.history = [...this.state.history, trimmed];

    // 명령어 파싱 및 실행
    const result = this.executeChain(trimmed);

    this.notify();
    return result;
  }

  /**
   * 명령어 체인 실행 (&& 또는 ; 로 연결된 명령어들)
   */
  private executeChain(input: string): ExecuteResult {
    // TODO: parser 연동
    const commands = this.parseCommandChain(input);

    let lastResult: ExecuteResult = {};

    for (const cmd of commands) {
      const result = this.executeSingle(cmd);
      lastResult = result;

      if (result.error) {
        break; // && 체인에서 에러 시 중단
      }
    }

    return lastResult;
  }

  /**
   * 단일 명령어 파싱 (임시 - 나중에 parser 모듈과 통합)
   */
  private parseCommandChain(input: string): string[] {
    // 간단한 && 분리
    return input.split(/\s*&&\s*/).filter(Boolean);
  }

  /**
   * 단일 명령어 실행
   */
  private executeSingle(input: string): ExecuteResult {
    const parsed = this.parseCommand(input);
    if (!parsed.command) {
      return {};
    }

    const command = this.commands.get(parsed.command);
    if (!command) {
      return {
        output: `command not found: ${parsed.command}. Type 'help' for available commands.`,
        error: true,
      };
    }

    const result = command.execute(parsed.args, parsed.flags, this);
    return this.processCommandResult(result);
  }

  /**
   * 명령어 파싱 (임시 구현)
   */
  private parseCommand(input: string): ShellParsedCommand {
    const parts = input.trim().split(/\s+/);
    const command = parts[0] || '';
    const args: string[] = [];
    const flags: Record<string, boolean | string> = {};

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith('--')) {
        const [key, value] = part.slice(2).split('=');
        flags[key] = value ?? true;
      } else if (part.startsWith('-')) {
        for (const char of part.slice(1)) {
          flags[char] = true;
        }
      } else {
        args.push(part);
      }
    }

    return { command, args, flags };
  }

  /**
   * 명령어 결과 처리
   */
  private processCommandResult(result: CommandResult): ExecuteResult {
    // cwd 변경
    if (result.newCwd) {
      this.state.cwd = result.newCwd;
    }

    // viewPath 변경
    if (result.viewerState) {
      this.state.viewPath = result.viewerState;
    }

    // vim 모드
    if (result.vimMode) {
      this.state.editorMode = result.vimMode;
    }

    return {
      output: result.output,
      urlPath: result.urlPath,
      error: result.type === 'error',
    };
  }

  /**
   * 에디터 모드 종료
   */
  exitEditor(): void {
    this.state.editorMode = null;
    this.notify();
  }

  /**
   * 자동완성
   */
  complete(buffer: string): string[] {
    return this.completions.complete(buffer, this.state.cwd);
  }

  /**
   * 자동완성 결과 조회
   */
  getCompletions(buffer: string): { completions: string[]; type?: string } | null {
    return this.completions.getCompletions(buffer, this.state.cwd);
  }

  // ========== Filesystem 접근 메서드 ==========
  // 명령어에서 shell.filesystem 대신 shell.resolvePath() 등으로 접근

  getFilesystem(): IFilesystem {
    return this.filesystem;
  }

  resolvePath(path: string): FSNode | null {
    const normalized = this.filesystem.normalizePath(path, this.state.cwd);
    return this.filesystem.resolvePath(normalized);
  }

  resolvePathWithSymlinks(path: string): { node: FSNode; actualPath: string } | null {
    const normalized = this.filesystem.normalizePath(path, this.state.cwd);
    return this.filesystem.resolvePathWithSymlinks(normalized);
  }

  normalizePath(path: string): string {
    return this.filesystem.normalizePath(path, this.state.cwd);
  }

  listDirectory(path?: string): FSNode[] | null {
    const targetPath = path ? this.normalizePath(path) : this.state.cwd;
    return this.filesystem.listDirectory(targetPath);
  }

  getFileContent(node: FSNode): string {
    return this.filesystem.getFileContent(node);
  }

  getBasename(path: string): string {
    return this.filesystem.getBasename(path);
  }

  // ========== 상태 접근 메서드 ==========

  getCwd(): string {
    return this.state.cwd;
  }

  getViewPath(): string {
    return this.state.viewPath;
  }

  getCurrentProject(): string | null {
    return this.state.currentProject;
  }

  getHistory(): string[] {
    return [...this.state.history];
  }

  isEditorMode(): boolean {
    return this.state.editorMode !== null;
  }

  getEditorMode(): EditorMode | null {
    return this.state.editorMode;
  }

  // ========== 상태 변경 메서드 (명령어에서 사용) ==========

  setCwd(cwd: string): void {
    this.state.cwd = cwd;
  }

  setViewPath(path: string): void {
    this.state.viewPath = path;
  }

  setCurrentProject(project: string | null): void {
    this.state.currentProject = project;
  }

  setEditorMode(mode: EditorMode | null): void {
    this.state.editorMode = mode;
  }
}
