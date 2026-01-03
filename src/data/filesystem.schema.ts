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
