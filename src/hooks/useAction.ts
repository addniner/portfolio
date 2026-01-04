import { useCallback, useMemo } from 'react';
import { useTerminalContext } from '@/context/TerminalContext';
import { createActionDispatcher, type ActionOptions } from '@/lib/actions';

/**
 * useAction - Action 기반 인터페이스를 제공하는 훅
 *
 * 컴포넌트에서 명령어 대신 Action을 dispatch할 수 있게 합니다.
 *
 * @example
 * const { dispatch } = useAction();
 * dispatch({ type: 'NAVIGATE', path: 'projects' });
 * dispatch({ type: 'OPEN_FILE', path: 'about.md' });
 */
export function useAction() {
  const { executeCommand } = useTerminalContext();

  const dispatch = useMemo(
    () => createActionDispatcher(executeCommand),
    [executeCommand]
  );

  // 편의 메서드들
  const navigate = useCallback(
    (path: string, options?: ActionOptions) => {
      dispatch({ type: 'NAVIGATE', path }, options);
    },
    [dispatch]
  );

  const navigateBack = useCallback(
    (options?: ActionOptions) => {
      dispatch({ type: 'NAVIGATE_BACK' }, options);
    },
    [dispatch]
  );

  const openFile = useCallback(
    (path: string, options?: ActionOptions) => {
      dispatch({ type: 'OPEN_FILE', path }, options);
    },
    [dispatch]
  );

  const openProject = useCallback(
    (name: string, options?: ActionOptions) => {
      dispatch({ type: 'OPEN_PROJECT', name }, options);
    },
    [dispatch]
  );

  return {
    dispatch,
    // 편의 메서드
    navigate,
    navigateBack,
    openFile,
    openProject,
  };
}
