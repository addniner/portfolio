import type { FSNode } from '@/types/filesystem';
import type { IFilesystem } from './Shell';
import {
  getFilesystem as getFilesystemRoot,
  resolvePath as resolvePathFn,
  resolvePathWithSymlinks as resolvePathWithSymlinksFn,
  normalizePath as normalizePathFn,
  listDirectory as listDirectoryFn,
  getFileContent as getFileContentFn,
  getBasename as getBasenameFn,
} from '@/lib/filesystem';

/**
 * Filesystem - 가상 파일시스템 래퍼
 *
 * 기존 함수들을 IFilesystem 인터페이스로 래핑합니다.
 * 이를 통해 Shell에 의존성 주입이 가능하고, 테스트 시 모킹할 수 있습니다.
 */
export class Filesystem implements IFilesystem {
  private root: FSNode;

  constructor() {
    this.root = getFilesystemRoot();
  }

  getRoot(): FSNode {
    return this.root;
  }

  resolvePath(path: string): FSNode | null {
    return resolvePathFn(path, this.root);
  }

  resolvePathWithSymlinks(path: string): { node: FSNode; actualPath: string } | null {
    return resolvePathWithSymlinksFn(path, this.root);
  }

  normalizePath(path: string, cwd: string): string {
    return normalizePathFn(path, cwd);
  }

  listDirectory(path: string): FSNode[] | null {
    return listDirectoryFn(path, this.root);
  }

  getFileContent(node: FSNode): string {
    return getFileContentFn(node);
  }

  getBasename(path: string): string {
    return getBasenameFn(path);
  }
}

/**
 * 싱글톤 Filesystem 인스턴스
 */
let filesystemInstance: Filesystem | null = null;

export function getFilesystemInstance(): Filesystem {
  if (!filesystemInstance) {
    filesystemInstance = new Filesystem();
  }
  return filesystemInstance;
}
