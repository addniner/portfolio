/**
 * Shell 모듈
 *
 * 터미널 시스템의 핵심 객체들을 제공합니다.
 */

export { Shell } from './Shell';
export type {
  ShellState,
  EditorMode,
  ExecuteResult,
  ShellListener,
  ShellParsedCommand,
  IFilesystem,
  ICommand,
  ICommandRegistry,
  ICompletionEngine,
} from './Shell';

export { Filesystem, getFilesystemInstance } from './Filesystem';
export { CommandRegistry, createCommandRegistryFromLegacy } from './CommandRegistry';
export { CompletionEngine, getCompletionEngineInstance } from './CompletionEngine';

// Shell 인스턴스 생성 헬퍼
import { Shell } from './Shell';
import { getFilesystemInstance } from './Filesystem';
import { getCompletionEngineInstance } from './CompletionEngine';
import { createCommandRegistryFromLegacy } from './CommandRegistry';
import { commands as legacyCommands } from '@/lib/commands';

let shellInstance: Shell | null = null;

/**
 * URL에서 초기 경로 파싱
 * 파일시스템에 존재하는 경로면 그대로 사용
 */
function getInitialPathFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const pathname = window.location.pathname;
  if (pathname === '/') return undefined;

  // 파일시스템에 경로가 존재하는지 확인
  const filesystem = getFilesystemInstance();
  const resolved = filesystem.resolvePath(pathname);
  if (resolved && resolved.type === 'directory') {
    return pathname;
  }

  return undefined;
}

/**
 * 싱글톤 Shell 인스턴스 조회
 */
export function getShellInstance(): Shell {
  if (!shellInstance) {
    const filesystem = getFilesystemInstance();
    const commands = createCommandRegistryFromLegacy(legacyCommands);
    const completions = getCompletionEngineInstance();

    // URL에서 초기 경로 가져오기
    const initialPath = getInitialPathFromUrl();

    shellInstance = new Shell(filesystem, commands, completions, initialPath ? {
      cwd: initialPath,
      viewPath: initialPath,
    } : undefined);
  }
  return shellInstance;
}

/**
 * Shell 인스턴스 리셋 (테스트용)
 */
export function resetShellInstance(): void {
  shellInstance = null;
}
