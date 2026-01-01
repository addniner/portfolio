import type { CommandDefinition } from '@/types';
import { getProject, getProjectNames } from '@/data';

export const catCommand: CommandDefinition = {
  name: 'cat',
  description: 'Display project README',
  usage: 'cat <project-name>',
  execute: (args) => {
    if (args.length === 0) {
      return {
        type: 'error',
        output: "cat: missing operand. Usage: cat <project-name>",
      };
    }

    const projectName = args[0];
    const project = getProject(projectName);

    if (!project) {
      const suggestions = getProjectNames();
      return {
        type: 'error',
        output: `cat: ${projectName}: No such file or directory`,
        viewerState: {
          type: 'error',
          message: `'${projectName}' not found`,
          suggestions,
        },
      };
    }

    return {
      type: 'success',
      output: `Displaying README for ${projectName}...`,
      viewerState: { type: 'project', name: projectName },
      urlPath: `/projects/${projectName}`,
    };
  },
};
