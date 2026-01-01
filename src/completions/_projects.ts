/**
 * _arguments Completer
 *
 * Zsh의 _arguments에 해당
 * compdef 매핑을 사용해 명령어별 인자 완성
 */

import type { Completer, CompletionContext, CompletionResult } from './types';
import { getCompleterForCommand, getCompleterConfig } from './compdef';

export const _arguments: Completer = (ctx: CompletionContext): CompletionResult | null => {
  // 첫 번째 인자부터 동작 (current >= 1)
  if (ctx.current < 1) {
    return null;
  }

  const command = ctx.words[0];

  // compdef 매핑 조회
  const completerName = getCompleterForCommand(command);
  if (!completerName) {
    return null;
  }

  // completer 설정 조회
  const config = getCompleterConfig(completerName);
  if (!config) {
    return null;
  }

  // 완성 후보 생성
  const completions = config.generate(ctx.prefix);

  if (completions.length === 0) {
    return null;
  }

  return {
    completions,
    type: completerName === '_paths' ? 'path' : 'argument',
  };
};
