import type { CommandDefinition, CommandResult } from '@/types';

export const quitCommand: CommandDefinition = {
  name: ':q',
  description: 'Close vim editor',
  usage: ':q',
  execute: (_args, _flags, context): CommandResult => {
    // This command is handled specially in vim mode
    // If called outside vim mode, show error
    if (context.previousState?.type !== 'vim') {
      return {
        type: 'error',
        output: 'E492: Not an editor command: q',
      };
    }

    // Return to directory view and exit vim mode
    return {
      type: 'silent',
      viewerState: { type: 'directory', path: context.cwd },
      vimMode: null,
    };
  },
};
