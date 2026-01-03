import type { CommandDefinition, CommandResult } from '@/types';
import { getFilesystem, normalizePath, resolvePath } from '@/data/filesystem';

export const vimCommand: CommandDefinition = {
  name: 'vim',
  description: 'Open file in vim editor',
  usage: 'vim <file>',
  execute: (args, _flags, context): CommandResult => {
    if (args.length === 0) {
      return {
        type: 'error',
        output: 'vim: missing file operand',
      };
    }

    const fs = getFilesystem();
    const targetPath = normalizePath(args[0], context.cwd);
    const node = resolvePath(targetPath, fs);

    if (!node) {
      return {
        type: 'error',
        output: `vim: ${args[0]}: No such file or directory`,
      };
    }

    if (node.type === 'directory') {
      return {
        type: 'error',
        output: `vim: ${args[0]}: Is a directory`,
      };
    }

    // Get file content
    const content = typeof node.content === 'function' ? node.content() : node.content;

    // Generate URL path based on viewer type
    let urlPath: string | undefined;
    if (node.viewerType === 'project-detail' && node.meta?.project) {
      const project = node.meta.project as { name: string };
      urlPath = `/projects/${project.name}`;
    } else if (node.viewerType === 'profile') {
      urlPath = '/about';
    }

    return {
      type: 'vim', // Special type for vim mode
      viewerState: { type: 'vim', path: targetPath },
      vimMode: { filePath: targetPath, content: content || '' },
      urlPath,
    } as CommandResult;
  },
};
