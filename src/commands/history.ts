import type { CommandDefinition } from '@/types';

export const historyCommand: CommandDefinition = {
  name: 'history',
  description: 'Show command history',
  usage: 'history',
  execute: (_args, _flags, context) => {
    const history = context.getHistory();

    if (history.length === 0) {
      return {
        type: 'success',
        output: 'No commands in history.',
      };
    }

    const output = history
      .map((cmd, index) => `  ${String(index + 1).padStart(3)}  ${cmd}`)
      .join('\n');

    return {
      type: 'success',
      output,
    };
  },
};
