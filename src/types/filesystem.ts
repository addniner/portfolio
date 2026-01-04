import type { LucideIcon } from 'lucide-react';
import type { Project } from './project';

// Filesystem JSON Schema Types
export interface FSNodeJSON {
  type: 'directory' | 'file' | 'executable' | 'symlink';
  icon?: string;
  content?: string;
  target?: string; // for symlinks
  children?: Record<string, FSNodeJSON>;
  // Special markers for dynamic content
  dynamic?: 'projects' | 'profile';
}

export interface FilesystemJSON {
  version: string;
  root: Record<string, FSNodeJSON>;
}

// Runtime FSNode types
export type FSNodeType = 'directory' | 'file' | 'executable' | 'symlink';

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
