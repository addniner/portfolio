import type { CommandDefinition, CommandResult } from '@/types';

export const quitCommand: CommandDefinition = {
  name: ':q',
  description: 'Close vim editor',
  usage: ':q',
  execute: (_args, _flags, _context): CommandResult => {
    // This command is handled specially in vim mode
    // :q is only valid in vim mode, otherwise show error
    // Note: vim mode is handled in XTerminal.tsx, this is just for completeness
    return {
      type: 'error',
      output: 'E492: Not an editor command: q',
    };
  },
};
