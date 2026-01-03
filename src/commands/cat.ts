import type { CommandDefinition, CommandResult } from '@/types';
import { getFilesystem, normalizePath, resolvePath } from '@/data/filesystem';
import { getFileContent } from '@/lib/fileContent';

export const catCommand: CommandDefinition = {
  name: 'cat',
  description: 'Display file contents',
  usage: 'cat <file>',
  execute: (args, _flags, context): CommandResult => {
    if (args.length === 0) {
      return {
        type: 'error',
        output: 'cat: missing operand. Usage: cat <file>',
      };
    }

    const fs = getFilesystem();
    const targetPath = normalizePath(args[0], context.cwd);
    const node = resolvePath(targetPath, fs);

    if (!node) {
      return {
        type: 'error',
        output: `cat: ${args[0]}: No such file or directory`,
      };
    }

    if (node.type === 'directory') {
      return {
        type: 'error',
        output: `cat: ${args[0]}: Is a directory`,
      };
    }

    const content = getFileContent(node);

    // cat only outputs to terminal, no viewer change
    return {
      type: 'success',
      output: content || '(empty file)',
    };
  },
};
