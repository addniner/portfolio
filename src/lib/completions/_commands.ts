/**
 * _commands Completer
 *
 * Zsh의 _command_names에 해당
 * 첫 번째 단어(명령어)를 완성
 */

import type { Completer, CompletionContext, CompletionResult } from './types';
import { getCommandNames } from '@/lib/commands';

export const _commands: Completer = (ctx: CompletionContext): CompletionResult | null => {
  // 첫 번째 단어일 때만 동작
  if (ctx.current !== 0) {
    return null;
  }

  const commands = getCommandNames();

  // 정확히 일치하는 명령어가 있으면 공백 추가 (Zsh 스타일)
  if (commands.includes(ctx.prefix)) {
    return {
      completions: [ctx.prefix + ' '],
      type: 'command',
    };
  }

  const completions = commands.filter(
    cmd => cmd.startsWith(ctx.prefix) && cmd !== ctx.prefix
  );

  if (completions.length === 0) {
    return null;
  }

  return {
    completions,
    type: 'command',
  };
};
