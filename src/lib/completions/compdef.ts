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
import { getFilesystem, resolvePath, normalizePath } from '@/lib/filesystem';

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
  generate: (prefix: string, cwd: string) => string[];
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
  generate: (prefix: string, _cwd: string) => {
    return getProjectNames().filter(
      name => name.startsWith(prefix) && name !== prefix
    );
  },
});

// _paths: cd용 디렉토리 완성 (중첩 경로 지원)
registerCompleter('_paths', {
  generate: (prefix: string, cwd: string) => {
    const fs = getFilesystem();

    // prefix에서 디렉토리 부분과 파일명 부분 분리
    // 예: "projects/port" -> basePath: "projects/", partial: "port"
    const lastSlash = prefix.lastIndexOf('/');
    let basePath = '';
    let partial = prefix;

    if (lastSlash >= 0) {
      basePath = prefix.slice(0, lastSlash + 1); // 슬래시 포함
      partial = prefix.slice(lastSlash + 1);
    }

    // 탐색할 경로 결정 - normalizePath로 ./ ../ ~ 등 처리
    let searchPath = cwd;
    if (basePath) {
      // normalizePath가 ~, .., . 등을 모두 처리
      searchPath = normalizePath(basePath.replace(/\/+$/, ''), cwd);
    }

    const currentDir = resolvePath(searchPath, fs);
    const directories: string[] = [];

    if (currentDir?.type === 'directory' && currentDir.children) {
      for (const [name, node] of Object.entries(currentDir.children)) {
        // 디렉토리와 심볼릭 링크만 포함 (숨김 파일 제외, 단 partial이 .로 시작하면 포함)
        const isHidden = name.startsWith('.');
        if ((node.type === 'directory' || node.type === 'symlink') &&
            (!isHidden || partial.startsWith('.'))) {
          // basePath가 있으면 전체 경로로 반환
          directories.push(basePath + name);
        }
      }
    }

    // 특수 경로는 basePath가 없고 사용자가 해당 문자로 시작할 때만 표시
    const specialPaths: string[] = [];
    if (!basePath) {
      if (prefix.startsWith('~')) {
        specialPaths.push('~/');
      }
      if (prefix.startsWith('.')) {
        specialPaths.push('./');
        specialPaths.push('../');
      }
      if (prefix.startsWith('/')) {
        specialPaths.push('/');
      }
    }

    // 디렉토리 먼저, 그 다음 특수 경로
    const allOptions = [...directories, ...specialPaths];
    return allOptions.filter(
      opt => opt.startsWith(prefix) && opt !== prefix
    );
  },
});

// _files: vim용 파일+디렉토리 완성 (중첩 경로 지원)
registerCompleter('_files', {
  generate: (prefix: string, cwd: string) => {
    const fs = getFilesystem();

    // prefix에서 디렉토리 부분과 파일명 부분 분리
    const lastSlash = prefix.lastIndexOf('/');
    let basePath = '';
    let partial = prefix;

    if (lastSlash >= 0) {
      basePath = prefix.slice(0, lastSlash + 1);
      partial = prefix.slice(lastSlash + 1);
    }

    // 탐색할 경로 결정 - normalizePath로 ./ ../ ~ 등 처리
    let searchPath = cwd;
    if (basePath) {
      searchPath = normalizePath(basePath.replace(/\/+$/, ''), cwd);
    }

    const currentDir = resolvePath(searchPath, fs);
    const items: string[] = [];

    if (currentDir?.type === 'directory' && currentDir.children) {
      for (const [name, node] of Object.entries(currentDir.children)) {
        const isHidden = name.startsWith('.');
        if (!isHidden || partial.startsWith('.')) {
          // 디렉토리는 / 붙여서, 파일은 그대로
          if (node.type === 'directory' || node.type === 'symlink') {
            items.push(basePath + name + '/');
          } else {
            items.push(basePath + name);
          }
        }
      }
    }

    // 특수 경로
    const specialPaths: string[] = [];
    if (!basePath) {
      if (prefix.startsWith('~')) {
        specialPaths.push('~/');
      }
      if (prefix.startsWith('.')) {
        specialPaths.push('./');
        specialPaths.push('../');
      }
      if (prefix.startsWith('/')) {
        specialPaths.push('/');
      }
    }

    const allOptions = [...items, ...specialPaths];
    return allOptions.filter(
      opt => opt.startsWith(prefix) && opt !== prefix
    );
  },
});

// ============================================
// 기본 compdef 설정
// ============================================

compdef('_paths', 'cd');
compdef('_files', 'vim', 'vi', 'cat');
compdef('_projects', 'open');
