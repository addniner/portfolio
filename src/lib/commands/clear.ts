import type { CommandDefinition } from '@/types';

export const clearCommand: CommandDefinition = {
  name: 'clear',
  description: 'Clear terminal history',
  usage: 'clear',
  execute: () => {
    return {
      type: 'silent',
    };
  },
};
