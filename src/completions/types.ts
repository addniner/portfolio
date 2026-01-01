/**
 * Zsh-style Completion System Types
 *
 * Zsh의 compsys를 참고한 타입 정의:
 * - CompletionContext: 현재 입력 상태 (CURRENT, words, PREFIX 등)
 * - Completer: 완성 후보를 반환하는 함수
 */

export interface CompletionContext {
  /** 전체 입력 버퍼 */
  buffer: string;
  /** 공백으로 분리된 단어들 */
  words: string[];
  /** 현재 단어 인덱스 (0-based, Zsh의 CURRENT는 1-based) */
  current: number;
  /** 현재 단어의 prefix (커서 앞부분) */
  prefix: string;
  /** 커서가 줄 끝에 있는지 */
  atEnd: boolean;
}

export interface CompletionResult {
  /** 완성 후보 목록 */
  completions: string[];
  /** 완성 타입 (디버깅/표시용) */
  type?: 'command' | 'argument' | 'path';
  /** 공통 접두사 (자동 계산됨) */
  commonPrefix?: string;
}

/**
 * Completer 함수 타입
 * Zsh의 _command, _files 등과 같은 역할
 */
export type Completer = (ctx: CompletionContext) => CompletionResult | null;

/**
 * 입력 버퍼에서 CompletionContext 생성
 */
export function createContext(buffer: string): CompletionContext {
  const trimmed = buffer.trimStart();
  const endsWithSpace = buffer.endsWith(' ') && buffer.length > 0;

  // 공백으로 분리 (빈 문자열 제외)
  const words = trimmed.length > 0 ? trimmed.split(/\s+/) : [];

  // 현재 단어 인덱스
  const current = endsWithSpace ? words.length : Math.max(0, words.length - 1);

  // prefix: 현재 완성 중인 단어
  const prefix = endsWithSpace ? '' : (words[current] || '');

  return {
    buffer,
    words,
    current,
    prefix,
    atEnd: true, // 일단 항상 true (커서 위치 추적은 별도)
  };
}
