import type { LucideIcon } from 'lucide-react';
import { Folder, FileText, User, HelpCircle, File } from 'lucide-react';
import { getProjects } from './index';
import { profile } from './profile';
import type { Project } from '@/types/project';
import filesystemJSON from './filesystem.json';
import type { FSNodeJSON, FilesystemJSON } from './filesystem.schema';

// File system node types
export type FSNodeType = 'directory' | 'file' | 'executable' | 'symlink';

// FSNode 메타데이터 타입
export interface FSNodeMeta {
  project?: Project;
}

export interface FSNode {
  name: string;
  type: FSNodeType;
  icon?: LucideIcon;
  children?: Record<string, FSNode>;
  content?: string | (() => string);
  meta?: FSNodeMeta;
  target?: string;
}

// Icon mapping from string to LucideIcon
const ICON_MAP: Record<string, LucideIcon> = {
  Folder,
  FileText,
  User,
  HelpCircle,
  File,
};

// Generate profile content
function generateProfileContent(): string {
  return `# ${profile.name}

**${profile.title}**

${profile.bio}

## Contact

- 📍 ${profile.location}
- 📧 ${profile.email}
- 🐙 [GitHub](${profile.github})
- 💼 [LinkedIn](${profile.linkedin})

## Skills

${profile.skills.map(skill => `- ${skill}`).join('\n')}`;
}

// Convert JSON node to FSNode
function jsonToFSNode(name: string, json: FSNodeJSON): FSNode {
  const projects = getProjects();

  const node: FSNode = {
    name,
    type: json.type,
    icon: json.icon ? ICON_MAP[json.icon] : (json.type === 'directory' ? Folder : json.type === 'file' ? FileText : undefined),
    target: json.target,
    content: json.content,
  };

  // Handle dynamic content
  if (json.dynamic === 'profile') {
    node.content = generateProfileContent;
  }

  // Handle children
  if (json.children) {
    node.children = {};
    for (const [childName, childJson] of Object.entries(json.children)) {
      node.children[childName] = jsonToFSNode(childName, childJson);
    }
  }

  // Handle dynamic projects
  if (json.dynamic === 'projects') {
    node.children = node.children || {};
    for (const project of projects) {
      node.children[`${project.name}.md`] = {
        name: `${project.name}.md`,
        type: 'file',
        icon: FileText,
        content: project.readme,
        meta: { project },
      };
    }
  }

  return node;
}

// Build the virtual filesystem from JSON
export function buildFilesystem(): FSNode {
  const json = filesystemJSON as FilesystemJSON;

  const root: FSNode = {
    name: '/',
    type: 'directory',
    children: {},
  };

  for (const [name, nodeJson] of Object.entries(json.root)) {
    root.children![name] = jsonToFSNode(name, nodeJson);
  }

  return root;
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
  if (path === '~' || path.startsWith('~/')) {
    path = path.replace('~', '/home/guest');
  }

  if (!path.startsWith('/')) {
    path = `${cwd}/${path}`;
  }

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

    if (current.type === 'symlink' && current.target) {
      current = resolvePath(current.target, fs) ?? undefined;
      if (!current) return null;
    }
  }

  return current ?? null;
}

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

    if (current.type === 'symlink' && current.target) {
      const targetResult = resolvePathWithSymlinks(current.target, fs);
      if (!targetResult) return null;
      current = targetResult.node;
      resolvedParts.length = 0;
      resolvedParts.push(...targetResult.actualPath.split('/').filter(Boolean));
    } else {
      resolvedParts.push(part);
    }
  }

  return current ? { node: current, actualPath: '/' + resolvedParts.join('/') } : null;
}

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

export function listDirectory(path: string, fs: FSNode): FSNode[] | null {
  const node = resolvePath(path, fs);
  if (!node || node.type !== 'directory' || !node.children) {
    return null;
  }
  return Object.values(node.children);
}
