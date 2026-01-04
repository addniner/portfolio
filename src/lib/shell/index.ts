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
 * 싱글톤 Shell 인스턴스 조회
 */
export function getShellInstance(): Shell {
  if (!shellInstance) {
    const filesystem = getFilesystemInstance();
    const commands = createCommandRegistryFromLegacy(legacyCommands);
    const completions = getCompletionEngineInstance();

    shellInstance = new Shell(filesystem, commands, completions);
  }
  return shellInstance;
}

/**
 * Shell 인스턴스 리셋 (테스트용)
 */
export function resetShellInstance(): void {
  shellInstance = null;
}
