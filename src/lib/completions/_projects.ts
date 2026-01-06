/**
 * _arguments Completer
 *
 * Zsh의 _arguments에 해당
 * compdef 매핑을 사용해 명령어별 인자 완성
 *
 * 또한 첫 번째 단어가 경로인 경우 (./, ../, ~/, /)도 처리
 */

import type { Completer, CompletionContext, CompletionResult } from './types';
import { getCompleterForCommand, getCompleterConfig } from './compdef';

// 경로 시작 패턴
const PATH_PREFIXES = ['./', '../', '~/', '/'];

export const _arguments: Completer = (ctx: CompletionContext): CompletionResult | null => {
  let completerName: string | undefined;

  // 첫 번째 단어가 경로로 시작하는 경우 → _files 사용
  if (ctx.current === 0 && PATH_PREFIXES.some(p => ctx.prefix.startsWith(p))) {
    completerName = '_files';
  }
  // 일반적인 명령어 인자 완성 (current >= 1)
  else if (ctx.current >= 1) {
    const command = ctx.words[0];
    completerName = getCompleterForCommand(command);
  }
  // 그 외의 경우 처리 안함
  else {
    return null;
  }

  if (!completerName) {
    return null;
  }

  // completer 설정 조회
  const config = getCompleterConfig(completerName);
  if (!config) {
    return null;
  }

  // 완성 후보 생성
  const completions = config.generate(ctx.prefix, ctx.cwd);

  if (completions.length === 0) {
    return null;
  }

  return {
    completions,
    type: completerName === '_paths' || completerName === '_files' ? 'path' : 'argument',
  };
};
