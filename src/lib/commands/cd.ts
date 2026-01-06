import type { CommandDefinition, CommandResult } from '@/types';
import { getFilesystem, normalizePath, resolvePathWithSymlinks } from '@/lib/filesystem';

export const cdCommand: CommandDefinition = {
  name: 'cd',
  description: 'Change directory',
  usage: 'cd <path> | cd .. | cd ~',
  execute: (args, _flags, context): CommandResult => {
    const fs = getFilesystem();

    // cd without args -> go to home
    if (args.length === 0) {
      const homePath = '/home/guest';
      return {
        type: 'silent',
        viewerState: homePath,
        newCwd: homePath,
        urlPath: '/',
      };
    }

    const targetPath = normalizePath(args[0], context.cwd);

    // Resolve path following symlinks and get the actual path
    const resolved = resolvePathWithSymlinks(targetPath, fs);

    if (!resolved) {
      return {
        type: 'error',
        output: `cd: ${args[0]}: No such file or directory`,
      };
    }

    if (resolved.node.type !== 'directory') {
      return {
        type: 'error',
        output: `cd: ${args[0]}: Not a directory`,
      };
    }

    // Use the resolved actual path (after following symlinks)
    const actualPath = resolved.actualPath;

    // Generate URL path based on filesystem location
    let urlPath = '/';
    if (actualPath.startsWith('/home/guest/projects/')) {
      const projectName = actualPath.replace('/home/guest/projects/', '').split('/')[0];
      if (projectName) {
        urlPath = `/projects/${projectName}`;
      } else {
        urlPath = '/projects';
      }
    } else if (actualPath === '/home/guest/projects') {
      urlPath = '/projects';
    }

    return {
      type: 'silent',
      viewerState: actualPath,
      newCwd: actualPath,
      urlPath,
    };
  },
};
