import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Shell, type IFilesystem, type ICommandRegistry, type ICompletionEngine, type ShellParsedCommand } from './Shell';
import type { FSNode } from '@/types/filesystem';
import type { CommandResult } from '@/types';

// Mock Filesystem
function createMockFilesystem(): IFilesystem {
  const root: FSNode = {
    type: 'directory',
    name: '',
    children: {
      home: {
        type: 'directory',
        name: 'home',
        children: {
          guest: {
            type: 'directory',
            name: 'guest',
            children: {
              'test.md': {
                type: 'file',
                name: 'test.md',
              },
            },
          },
        },
      },
    },
  };

  const resolvePath = (path: string): FSNode | null => {
    if (path === '/home/guest') return root.children!.home.children!.guest;
    if (path === '/home/guest/test.md') return root.children!.home.children!.guest.children!['test.md'];
    if (path === '/home') return root.children!.home;
    if (path === '/') return root;
    return null;
  };

  return {
    getRoot: () => root,
    resolvePath,
    resolvePathWithSymlinks: (path: string) => {
      const node = resolvePath(path);
      return node ? { node, actualPath: path } : null;
    },
    normalizePath: (path: string, cwd: string) => {
      if (path.startsWith('/')) return path;
      if (path === '..') {
        const parts = cwd.split('/').filter(Boolean);
        parts.pop();
        return '/' + parts.join('/') || '/';
      }
      return `${cwd}/${path}`.replace('//', '/');
    },
    listDirectory: (path: string) => {
      const node = resolvePath(path);
      if (!node || node.type !== 'directory' || !node.children) return null;
      return Object.values(node.children);
    },
    getFileContent: () => '# Test Content',
    getBasename: (path: string) => path.split('/').pop() || '',
  };
}

// Mock CommandRegistry
function createMockCommandRegistry(): ICommandRegistry {
  const commands = new Map<string, { execute: (args: string[], flags: Record<string, boolean | string>, shell: Shell) => CommandResult }>();

  // cd command
  commands.set('cd', {
    execute: (args, _flags, shell) => {
      const target = args[0] || '/home/guest';
      const newCwd = shell.normalizePath(target);
      return { type: 'success', newCwd };
    },
  });

  // ls command
  commands.set('ls', {
    execute: (_args, _flags, shell) => {
      const files = shell.listDirectory();
      if (!files) return { type: 'error', output: 'Not a directory' };
      return { type: 'success', output: files.map(f => f.name).join('\n'), viewerState: shell.getCwd() };
    },
  });

  // echo command
  commands.set('echo', {
    execute: (args) => {
      return { type: 'success', output: args.join(' ') };
    },
  });

  return {
    get: (name: string) => {
      const cmd = commands.get(name);
      if (!cmd) return undefined;
      return {
        name,
        description: '',
        usage: '',
        execute: cmd.execute,
      };
    },
    getNames: () => Array.from(commands.keys()),
    execute: (parsed: ShellParsedCommand, shell: Shell) => {
      if (!parsed.command) return { type: 'silent' };
      const cmd = commands.get(parsed.command);
      if (!cmd) return { type: 'error', output: `command not found: ${parsed.command}` };
      return cmd.execute(parsed.args, parsed.flags, shell);
    },
  };
}

// Mock CompletionEngine
function createMockCompletionEngine(): ICompletionEngine {
  const complete = (buffer: string): string[] => {
    if (buffer.startsWith('cd ')) return ['home', 'guest'];
    if (buffer.startsWith('l')) return ['ls'];
    return [];
  };

  return {
    complete,
    getCompletions: (buffer: string) => {
      const completions = complete(buffer);
      return completions.length > 0 ? { completions, type: 'command' } : null;
    },
  };
}

describe('Shell', () => {
  let shell: Shell;
  let mockFilesystem: IFilesystem;
  let mockCommands: ICommandRegistry;
  let mockCompletions: ICompletionEngine;

  beforeEach(() => {
    mockFilesystem = createMockFilesystem();
    mockCommands = createMockCommandRegistry();
    mockCompletions = createMockCompletionEngine();
    shell = new Shell(mockFilesystem, mockCommands, mockCompletions);
  });

  describe('초기 상태', () => {
    it('기본 cwd는 /home/guest', () => {
      expect(shell.getCwd()).toBe('/home/guest');
    });

    it('기본 viewPath는 /home/guest', () => {
      expect(shell.getViewPath()).toBe('/home/guest');
    });

    it('editorMode는 null', () => {
      expect(shell.isEditorMode()).toBe(false);
      expect(shell.getEditorMode()).toBeNull();
    });

    it('history는 빈 배열', () => {
      expect(shell.getHistory()).toEqual([]);
    });

    it('currentProject는 null', () => {
      expect(shell.getCurrentProject()).toBeNull();
    });
  });

  describe('상태 변경', () => {
    it('setCwd로 cwd 변경', () => {
      shell.setCwd('/home');
      expect(shell.getCwd()).toBe('/home');
    });

    it('setViewPath로 viewPath 변경', () => {
      shell.setViewPath('/');
      expect(shell.getViewPath()).toBe('/');
    });

    it('setCurrentProject로 프로젝트 변경', () => {
      shell.setCurrentProject('test-project');
      expect(shell.getCurrentProject()).toBe('test-project');
    });

    it('setEditorMode로 에디터 모드 설정', () => {
      shell.setEditorMode({ filePath: '/test.md', content: '# Test' });
      expect(shell.isEditorMode()).toBe(true);
      expect(shell.getEditorMode()).toEqual({ filePath: '/test.md', content: '# Test' });
    });

    it('exitEditor로 에디터 모드 종료', () => {
      shell.setEditorMode({ filePath: '/test.md', content: '# Test' });
      shell.exitEditor();
      expect(shell.isEditorMode()).toBe(false);
    });
  });

  describe('상태 구독', () => {
    it('subscribe로 상태 변경 구독', () => {
      const listener = vi.fn();
      shell.subscribe(listener);

      shell.setCwd('/home');
      // setCwd는 notify를 호출하지 않음 (execute를 통해서만)

      shell.execute('echo test');
      expect(listener).toHaveBeenCalled();
    });

    it('unsubscribe로 구독 해제', () => {
      const listener = vi.fn();
      const unsubscribe = shell.subscribe(listener);

      unsubscribe();
      shell.execute('echo test');

      expect(listener).not.toHaveBeenCalled();
    });

    it('여러 리스너 등록 가능', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      shell.subscribe(listener1);
      shell.subscribe(listener2);

      shell.execute('echo test');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('명령어 실행', () => {
    it('빈 입력은 무시', () => {
      const result = shell.execute('');
      expect(result).toEqual({});
    });

    it('공백만 있는 입력은 무시', () => {
      const result = shell.execute('   ');
      expect(result).toEqual({});
    });

    it('echo 명령어 실행', () => {
      const result = shell.execute('echo hello world');
      expect(result.output).toBe('hello world');
    });

    it('존재하지 않는 명령어는 에러', () => {
      const result = shell.execute('nonexistent');
      expect(result.error).toBe(true);
      expect(result.output).toContain('command not found');
    });

    it('히스토리에 명령어 추가', () => {
      shell.execute('echo test1');
      shell.execute('echo test2');
      expect(shell.getHistory()).toEqual(['echo test1', 'echo test2']);
    });
  });

  describe('명령어 체인 (&&)', () => {
    it('&& 로 연결된 명령어 순차 실행', () => {
      shell.execute('echo first && echo second');
      expect(shell.getHistory()).toContain('echo first && echo second');
    });
  });

  describe('Filesystem 접근', () => {
    it('resolvePath로 경로 해석', () => {
      const node = shell.resolvePath('/home/guest');
      expect(node).not.toBeNull();
      expect(node?.type).toBe('directory');
    });

    it('listDirectory로 디렉토리 목록 조회', () => {
      const files = shell.listDirectory('/home/guest');
      expect(files).not.toBeNull();
      expect(files?.length).toBeGreaterThan(0);
    });

    it('getBasename으로 파일명 추출', () => {
      expect(shell.getBasename('/home/guest/test.md')).toBe('test.md');
    });

    it('normalizePath로 경로 정규화', () => {
      const normalized = shell.normalizePath('test.md');
      expect(normalized).toBe('/home/guest/test.md');
    });
  });

  describe('getState', () => {
    it('현재 상태 스냅샷 반환', () => {
      const state = shell.getState();
      expect(state.cwd).toBe('/home/guest');
      expect(state.viewPath).toBe('/home/guest');
      expect(state.currentProject).toBeNull();
      expect(state.editorMode).toBeNull();
      expect(state.history).toEqual([]);
    });

    it('반환된 상태는 복사본 (immutable)', () => {
      const state1 = shell.getState();
      shell.execute('echo test');
      const state2 = shell.getState();

      expect(state1.history).toEqual([]);
      expect(state2.history).toEqual(['echo test']);
    });
  });

  describe('커스텀 초기 상태', () => {
    it('initialState로 초기 상태 설정', () => {
      const customShell = new Shell(mockFilesystem, mockCommands, mockCompletions, {
        cwd: '/home',
        viewPath: '/',
        currentProject: 'my-project',
      });

      expect(customShell.getCwd()).toBe('/home');
      expect(customShell.getViewPath()).toBe('/');
      expect(customShell.getCurrentProject()).toBe('my-project');
    });
  });
});
