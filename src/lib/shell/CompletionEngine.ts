import type { ICompletionEngine } from './Shell';
import { getCompletions as getCompletionsFn, getCompletionResult } from '@/lib/completions';

/**
 * CompletionEngine - 자동완성 엔진
 *
 * 기존 completions 모듈을 래핑합니다.
 */
export class CompletionEngine implements ICompletionEngine {
  /**
   * 자동완성 수행
   */
  complete(buffer: string, cwd: string): string[] {
    return getCompletionsFn(buffer, cwd);
  }

  /**
   * 자동완성 결과 조회 (타입 정보 포함)
   */
  getCompletions(buffer: string, cwd: string): { completions: string[]; type?: string } | null {
    return getCompletionResult(buffer, cwd);
  }
}

/**
 * 싱글톤 CompletionEngine 인스턴스
 */
let completionEngineInstance: CompletionEngine | null = null;

export function getCompletionEngineInstance(): CompletionEngine {
  if (!completionEngineInstance) {
    completionEngineInstance = new CompletionEngine();
  }
  return completionEngineInstance;
}
