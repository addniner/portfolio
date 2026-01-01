import type { CommandDefinition } from '@/types';
import { getProject } from '@/data';

export const openCommand: CommandDefinition = {
  name: 'open',
  description: 'Open project in GitHub',
  usage: 'open [project-name]',
  execute: (args, _flags, context) => {
    const projectName = args[0] || context.currentProject;

    if (!projectName) {
      return {
        type: 'error',
        output: "open: no project specified. Usage: open <project-name>",
      };
    }

    const project = getProject(projectName);
    if (!project) {
      return {
        type: 'error',
        output: `open: ${projectName}: No such file or directory`,
      };
    }

    window.open(project.url, '_blank', 'noopener,noreferrer');

    return {
      type: 'success',
      output: `Opening ${project.url}...`,
    };
  },
};
