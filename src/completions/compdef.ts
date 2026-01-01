/**
 * compdef - Zsh의 compdef 시스템 구현
 *
 * Zsh에서는 `compdef _files cd` 처럼 명령어와 completer를 매핑함.
 * 이 모듈은 동일한 구조를 제공.
 *
 * 사용법:
 *   compdef('_projects', 'cd', 'cat', 'open');
 *   getCompleterForCommand('cd'); // '_projects'
 */

import { getProjectNames } from '@/data';

/**
 * 명령어별 completer 매핑
 * key: 명령어, value: completer 이름
 */
const commandCompleterMap: Map<string, string> = new Map();

/**
 * Completer 레지스트리
 * key: completer 이름 (_projects, _paths 등)
 * value: completer 설정
 */
interface CompleterConfig {
  /** 완성 후보 생성 함수 */
  generate: (prefix: string) => string[];
}

const completerRegistry: Map<string, CompleterConfig> = new Map();

/**
 * Completer 등록
 */
export function registerCompleter(name: string, config: CompleterConfig): void {
  completerRegistry.set(name, config);
}

/**
 * 명령어에 completer 매핑 (Zsh의 compdef)
 */
export function compdef(completerName: string, ...commands: string[]): void {
  for (const cmd of commands) {
    commandCompleterMap.set(cmd, completerName);
  }
}

/**
 * 명령어에 매핑된 completer 이름 조회
 */
export function getCompleterForCommand(command: string): string | undefined {
  return commandCompleterMap.get(command);
}

/**
 * Completer 설정 조회
 */
export function getCompleterConfig(name: string): CompleterConfig | undefined {
  return completerRegistry.get(name);
}

// ============================================
// 기본 Completer 등록
// ============================================

// _projects: 프로젝트명 완성
registerCompleter('_projects', {
  generate: (prefix: string) => {
    return getProjectNames().filter(
      name => name.startsWith(prefix) && name !== prefix
    );
  },
});

// _paths: cd용 특수 경로 + 프로젝트명
registerCompleter('_paths', {
  generate: (prefix: string) => {
    const specialPaths = ['~', '..', '/'];
    const projectNames = getProjectNames();
    const allOptions = [...specialPaths, ...projectNames];
    return allOptions.filter(
      opt => opt.startsWith(prefix) && opt !== prefix
    );
  },
});

// ============================================
// 기본 compdef 설정
// ============================================

compdef('_paths', 'cd');
compdef('_projects', 'cat', 'open');
