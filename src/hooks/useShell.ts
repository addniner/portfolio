import { useState, useEffect, useCallback, useMemo } from 'react';
import { getShellInstance, type ShellState } from '@/lib/shell';

/**
 * useShell - Shell 인스턴스를 React에서 사용하기 위한 훅
 *
 * Shell의 상태를 React 상태로 동기화하고,
 * Shell 메서드를 안전하게 호출할 수 있는 인터페이스를 제공합니다.
 */
export function useShell() {
  const shell = useMemo(() => getShellInstance(), []);
  const [state, setState] = useState<ShellState>(() => shell.getState());

  // Shell 상태 변경 구독
  useEffect(() => {
    const unsubscribe = shell.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [shell]);

  // 명령어 실행
  const execute = useCallback(
    (input: string) => {
      return shell.execute(input);
    },
    [shell]
  );

  // 에디터 모드 종료
  const exitEditor = useCallback(() => {
    shell.exitEditor();
  }, [shell]);

  // 자동완성
  const complete = useCallback(
    (buffer: string) => {
      return shell.complete(buffer);
    },
    [shell]
  );

  // 자동완성 결과 조회
  const getCompletions = useCallback(
    (buffer: string) => {
      return shell.getCompletions(buffer);
    },
    [shell]
  );

  return {
    // 상태
    state,
    cwd: state.cwd,
    viewPath: state.viewPath,
    currentProject: state.currentProject,
    editorMode: state.editorMode,
    history: state.history,
    isEditorMode: state.editorMode !== null,

    // 액션
    execute,
    exitEditor,
    complete,
    getCompletions,

    // Shell 인스턴스 직접 접근 (고급 사용)
    shell,
  };
}

/**
 * useShellSelector - Shell 상태의 일부만 구독
 *
 * 불필요한 리렌더링을 방지하기 위해 특정 상태만 선택적으로 구독합니다.
 */
export function useShellSelector<T>(selector: (state: ShellState) => T): T {
  const shell = useMemo(() => getShellInstance(), []);
  const [selected, setSelected] = useState<T>(() => selector(shell.getState()));

  useEffect(() => {
    const unsubscribe = shell.subscribe((newState) => {
      const newSelected = selector(newState);
      setSelected((prev) => {
        // 값이 같으면 업데이트 안함 (shallow comparison)
        if (prev === newSelected) return prev;
        if (
          typeof prev === 'object' &&
          typeof newSelected === 'object' &&
          JSON.stringify(prev) === JSON.stringify(newSelected)
        ) {
          return prev;
        }
        return newSelected;
      });
    });
    return unsubscribe;
  }, [shell, selector]);

  return selected;
}
