import type { CommandDefinition, CommandResult } from '@/types';
import { getFilesystem, normalizePath, resolvePath } from '@/data/filesystem';
import { getFileContent } from '@/lib/fileContent';

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

    const content = getFileContent(node);

    // Generate URL path based on file location
    let urlPath: string | undefined;
    if (node.meta?.project) {
      urlPath = `/projects/${node.meta.project.name}`;
    } else if (targetPath === '/home/hyeonmin/about.md' || targetPath === '/home/guest/about.md') {
      urlPath = '/about';
    }

    return {
      type: 'vim', // Special type for vim mode
      viewerState: targetPath,
      vimMode: { filePath: targetPath, content: content || '' },
      urlPath,
    };
  },
};
