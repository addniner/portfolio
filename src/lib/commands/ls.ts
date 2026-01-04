import type { CommandDefinition, CommandResult } from '@/types';
import { getFilesystem, normalizePath, resolvePath, listDirectory } from '@/lib/filesystem';

export const lsCommand: CommandDefinition = {
  name: 'ls',
  description: 'List directory contents',
  usage: 'ls [-l] [-a] [path]',
  execute: (args, flags, context): CommandResult => {
    const fs = getFilesystem();
    const showAll = flags['a'] === true;
    const detailed = flags['l'] === true;

    // Determine target path
    const targetPath = args.length > 0
      ? normalizePath(args[0], context.cwd)
      : context.cwd;

    const node = resolvePath(targetPath, fs);

    if (!node) {
      return {
        type: 'error',
        output: `ls: ${args[0] || targetPath}: No such file or directory`,
      };
    }

    if (node.type !== 'directory') {
      // For files, just show the file name
      return {
        type: 'success',
        output: node.name,
      };
    }

    const contents = listDirectory(targetPath, fs);
    if (!contents) {
      return {
        type: 'error',
        output: `ls: cannot access '${targetPath}'`,
      };
    }

    // Filter hidden files unless -a flag
    const filteredContents = showAll
      ? contents
      : contents.filter(item => !item.name.startsWith('.'));

    let output: string;
    if (detailed) {
      const rows = filteredContents.map((item) => {
        const typeChar = item.type === 'directory' ? 'd' : item.type === 'executable' ? '-' : '-';
        const perms = item.type === 'executable' ? 'rwxr-xr-x' : 'rw-r--r--';
        const typeIndicator = item.type === 'directory' ? '/' : item.type === 'executable' ? '*' : '';
        return `${typeChar}${perms}  guest  guest  ${item.name}${typeIndicator}`;
      });
      output = rows.join('\n');
    } else {
      output = filteredContents
        .map(item => {
          const suffix = item.type === 'directory' ? '/' : item.type === 'executable' ? '*' : '';
          return item.name + suffix;
        })
        .join('  ');
    }

    return {
      type: 'success',
      output: output || '(empty directory)',
    };
  },
};
