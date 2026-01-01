/**
 * Zsh-style Completion System
 *
 * Zsh의 compsys 구조:
 * 1. createContext() - 입력 파싱
 * 2. completer 순회 - 첫 번째 매칭되는 completer 사용
 * 3. 결과 반환 (공통 접두사 자동 계산)
 *
 * Completers는 순서대로 시도됨 (Zsh의 zstyle ':completion:*' completer)
 */

import type { Completer, CompletionResult } from './types';
import { createContext } from './types';
import { _commands } from './_commands';
import { _arguments } from './_projects';

// Initialize compdef mappings
import './compdef';

// Re-export types
export type { CompletionContext, CompletionResult, Completer } from './types';
export { createContext } from './types';

// Re-export MenuComplete
export { MenuComplete } from './MenuComplete';
export type { MenuState, MenuCompleteResult } from './MenuComplete';

// Re-export compdef for extending
export { compdef, registerCompleter } from './compdef';

/**
 * 공통 접두사 계산 (Zsh 내부 로직)
 */
function findCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  if (strings.length === 1) return strings[0];

  let prefix = strings[0];
  for (let i = 1; i < strings.length; i++) {
    while (!strings[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (prefix === '') return '';
    }
  }
  return prefix;
}

/**
 * Completer 목록 (순서 중요)
 * Zsh의 _complete, _approximate 등과 유사
 */
const completers: Completer[] = [
  _commands,   // 명령어 완성
  _arguments,  // 인자 완성 (compdef 매핑 사용)
];

/**
 * 메인 완성 함수
 * Zsh의 _main_complete에 해당
 */
export function getCompletions(buffer: string): string[] {
  const result = getCompletionResult(buffer);
  return result?.completions ?? [];
}

/**
 * 상세 결과가 필요한 경우 (타입 정보, 공통 접두사 포함)
 */
export function getCompletionResult(buffer: string): CompletionResult | null {
  const ctx = createContext(buffer);

  for (const completer of completers) {
    const result = completer(ctx);
    if (result && result.completions.length > 0) {
      // 공통 접두사 자동 계산
      return {
        ...result,
        commonPrefix: findCommonPrefix(result.completions),
      };
    }
  }

  return null;
}
