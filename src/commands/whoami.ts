import type { CommandDefinition } from '@/types';
import { profile } from '@/data';

export const whoamiCommand: CommandDefinition = {
  name: 'whoami',
  description: 'Display developer profile',
  usage: 'whoami',
  execute: () => {
    return {
      type: 'success',
      output: profile.name,
      viewerState: { type: 'profile' },
      urlPath: '/about',
    };
  },
};
