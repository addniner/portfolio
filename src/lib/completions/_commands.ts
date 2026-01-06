/**
 * _commands Completer
 *
 * Zsh의 _command_names에 해당
 * 첫 번째 단어(명령어)를 완성
 *
 * 경로로 시작하는 경우 (./, ../, ~/, /)는 경로 완성으로 넘김
 */

import type { Completer, CompletionContext, CompletionResult } from './types';
import { getCommandNames } from '@/lib/commands';

// 경로 시작 패턴
const PATH_PREFIXES = ['./', '../', '~/', '/'];

export const _commands: Completer = (ctx: CompletionContext): CompletionResult | null => {
  // 첫 번째 단어일 때만 동작
  if (ctx.current !== 0) {
    return null;
  }

  // 경로로 시작하면 명령어 완성 스킵 (경로 완성으로 넘김)
  if (PATH_PREFIXES.some(p => ctx.prefix.startsWith(p))) {
    return null;
  }

  // 빈 상태에서는 완성 안 함 (실제 터미널 동작)
  if (ctx.prefix === '') {
    return null;
  }

  const commands = getCommandNames();

  // prefix로 시작하는 모든 명령어 찾기 (자기 자신 포함)
  const matches = commands.filter(cmd => cmd.startsWith(ctx.prefix));

  if (matches.length === 0) {
    return null;
  }

  // Zsh 스타일: 정확히 일치하는 명령어가 있고, 그것이 유일한 매치면 공백 추가
  if (matches.length === 1 && matches[0] === ctx.prefix) {
    return {
      completions: [ctx.prefix + ' '],
      type: 'command',
    };
  }

  // 여러 후보가 있으면 모두 표시 (정확히 일치하는 것도 포함)
  return {
    completions: matches,
    type: 'command',
  };
};
