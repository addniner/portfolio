import type { CommandDefinition, CommandResult } from '@/types';
import { getProject } from '@/data';

export const cdCommand: CommandDefinition = {
  name: 'cd',
  description: 'Change to project context',
  usage: 'cd <project-name> | cd ..',
  execute: (args, _flags, context): CommandResult => {
    if (args.length === 0 || args[0] === '~' || args[0] === '/') {
      return {
        type: 'silent',
        viewerState: { type: 'welcome' },
        urlPath: '/',
      };
    }

    if (args[0] === '..') {
      return {
        type: 'silent',
        viewerState: context.previousState,
      };
    }

    const projectName = args[0];
    const project = getProject(projectName);

    if (!project) {
      return {
        type: 'error',
        output: `cd: ${projectName}: No such file or directory`,
      };
    }

    return {
      type: 'silent',
      viewerState: { type: 'project', name: projectName },
      urlPath: `/projects/${projectName}`,
    };
  },
};
