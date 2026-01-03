import type { LucideIcon } from 'lucide-react';
import { Folder, FileText, User, HelpCircle, File } from 'lucide-react';
import { getProjects } from './index';
import { profile } from './profile';

// File system node types
export type FSNodeType = 'directory' | 'file' | 'executable' | 'symlink';

export interface FSNode {
  name: string;
  type: FSNodeType;
  icon?: LucideIcon;
  children?: Record<string, FSNode>;
  content?: string | (() => string);
  // For files that trigger viewer updates
  viewerType?: 'markdown' | 'profile' | 'help' | 'projects' | 'project-detail';
  // Additional metadata
  meta?: Record<string, unknown>;
  // For symlinks
  target?: string;
}

// Build the virtual filesystem
export function buildFilesystem(): FSNode {
  const projects = getProjects();

  // Create project files (not folders) dynamically
  const projectFiles: Record<string, FSNode> = {};
  for (const project of projects) {
    projectFiles[`${project.name}.md`] = {
      name: `${project.name}.md`,
      type: 'file',
      icon: FileText,
      viewerType: 'project-detail',
      content: project.readme,
      meta: { project },
    };
  }

  return {
    name: '/',
    type: 'directory',
    children: {
      home: {
        name: 'home',
        type: 'directory',
        icon: Folder,
        children: {
          guest: {
            name: 'guest',
            type: 'directory',
            icon: Folder,
            children: {
              '.bashrc': {
                name: '.bashrc',
                type: 'file',
                icon: File,
                content: '# Guest user bashrc\nexport PS1="guest@portfolio:~$ "',
              },
              hyeonmin: {
                name: 'hyeonmin',
                type: 'symlink',
                icon: Folder,
                target: '/home/hyeonmin',
              },
            },
          },
          hyeonmin: {
            name: 'hyeonmin',
            type: 'directory',
            icon: Folder,
            children: {
              projects: {
                name: 'projects',
                type: 'directory',
                icon: Folder,
                viewerType: 'projects',
                children: projectFiles,
              },
              'about.md': {
                name: 'about.md',
                type: 'file',
                icon: User,
                viewerType: 'profile',
                content: () => `# ${profile.name}

**${profile.title}**

${profile.bio}

## Contact

- 📍 ${profile.location}
- 📧 ${profile.email}
- 🐙 [GitHub](${profile.github})
- 💼 [LinkedIn](${profile.linkedin})

## Skills

${profile.skills.map(skill => `- ${skill}`).join('\n')}`,
              },
            },
          },
        },
      },
      usr: {
        name: 'usr',
        type: 'directory',
        icon: Folder,
        children: {
          bin: {
            name: 'bin',
            type: 'directory',
            icon: Folder,
            children: {
              help: {
                name: 'help',
                type: 'executable',
                icon: HelpCircle,
                viewerType: 'help',
              },
              ls: { name: 'ls', type: 'executable' },
              cd: { name: 'cd', type: 'executable' },
              cat: { name: 'cat', type: 'executable' },
              pwd: { name: 'pwd', type: 'executable' },
              clear: { name: 'clear', type: 'executable' },
              history: { name: 'history', type: 'executable' },
              open: { name: 'open', type: 'executable' },
              whoami: { name: 'whoami', type: 'executable' },
            },
          },
        },
      },
      etc: {
        name: 'etc',
        type: 'directory',
        icon: Folder,
        children: {
          motd: {
            name: 'motd',
            type: 'file',
            icon: FileText,
            content: `
Welcome to Hyeonmin's Portfolio Server
======================================

You are logged in as: guest (read-only access)
Type 'help' for available commands.

Last login: ${new Date().toLocaleString()}
`,
          },
          hostname: {
            name: 'hostname',
            type: 'file',
            icon: File,
            content: 'portfolio.hyeonmin.dev',
          },
        },
      },
    },
  };
}

// Singleton filesystem instance
let _filesystem: FSNode | null = null;

export function getFilesystem(): FSNode {
  if (!_filesystem) {
    _filesystem = buildFilesystem();
  }
  return _filesystem;
}

// Path utilities
export function normalizePath(path: string, cwd: string): string {
  // Handle home directory shortcut
  if (path === '~' || path.startsWith('~/')) {
    path = path.replace('~', '/home/guest');
  }

  // Handle relative paths
  if (!path.startsWith('/')) {
    path = `${cwd}/${path}`;
  }

  // Normalize path (resolve . and ..)
  const parts = path.split('/').filter(Boolean);
  const resolved: string[] = [];

  for (const part of parts) {
    if (part === '..') {
      resolved.pop();
    } else if (part !== '.') {
      resolved.push(part);
    }
  }

  return '/' + resolved.join('/');
}

export function resolvePath(path: string, fs: FSNode): FSNode | null {
  if (path === '/') return fs;

  const parts = path.split('/').filter(Boolean);
  let current: FSNode | undefined = fs;

  for (const part of parts) {
    if (!current?.children?.[part]) {
      return null;
    }
    current = current.children[part];

    // Follow symlinks
    if (current.type === 'symlink' && current.target) {
      current = resolvePath(current.target, fs) ?? undefined;
      if (!current) return null;
    }
  }

  return current ?? null;
}

// Resolve path and track actual path after following symlinks
export function resolvePathWithSymlinks(path: string, fs: FSNode): { node: FSNode; actualPath: string } | null {
  if (path === '/') return { node: fs, actualPath: '/' };

  const parts = path.split('/').filter(Boolean);
  let current: FSNode | undefined = fs;
  const resolvedParts: string[] = [];

  for (const part of parts) {
    if (!current?.children?.[part]) {
      return null;
    }
    current = current.children[part];

    // Follow symlinks and update path
    if (current.type === 'symlink' && current.target) {
      const targetResult = resolvePathWithSymlinks(current.target, fs);
      if (!targetResult) return null;
      current = targetResult.node;
      // Replace current path with symlink target path
      resolvedParts.length = 0;
      resolvedParts.push(...targetResult.actualPath.split('/').filter(Boolean));
    } else {
      resolvedParts.push(part);
    }
  }

  return current ? { node: current, actualPath: '/' + resolvedParts.join('/') } : null;
}

// Resolve symlink to get actual target path
export function resolveSymlink(node: FSNode, fs: FSNode): { node: FSNode; path: string } | null {
  if (node.type !== 'symlink' || !node.target) {
    return null;
  }
  const targetNode = resolvePath(node.target, fs);
  if (!targetNode) return null;
  return { node: targetNode, path: node.target };
}

export function getParentPath(path: string): string {
  if (path === '/') return '/';
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
}

export function getBasename(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || '/';
}

// List directory contents
export function listDirectory(path: string, fs: FSNode): FSNode[] | null {
  const node = resolvePath(path, fs);
  if (!node || node.type !== 'directory' || !node.children) {
    return null;
  }
  return Object.values(node.children);
}
