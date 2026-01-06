/**
 * ActionExecutor - Action을 명령어로 변환하고 실행
 *
 * Sourcetree 스타일의 Action → Command 변환 레이어입니다.
 * 컴포넌트는 의도(Action)만 전달하고, 여기서 명령어로 변환합니다.
 */

import type { Action, ActionOptions } from './types';
import { cmd } from '@/lib/commands';

/**
 * Action을 터미널 명령어 문자열로 변환
 */
export function actionToCommand(action: Action): string {
  switch (action.type) {
    // Navigation
    case 'NAVIGATE':
      return cmd.chain(cmd.cd(action.path), cmd.ls());
    case 'NAVIGATE_BACK':
      return cmd.chain(cmd.cd('..'), cmd.ls());
    case 'NAVIGATE_ROOT':
      return cmd.chain(cmd.cd('/'), cmd.ls());
    case 'NAVIGATE_HOME':
      return cmd.chain(cmd.cd('~'), cmd.ls());

    // File
    case 'OPEN_FILE':
      return cmd.vim(action.path);
    case 'VIEW_FILE':
      return cmd.cat(action.path);
    case 'LIST_DIR':
      return cmd.ls(action.flags);

    // Project
    case 'OPEN_PROJECT':
      return cmd.chain(cmd.cd('projects'), cmd.vim(`${action.name}.md`));
    case 'LIST_PROJECTS':
      return cmd.chain(cmd.cd('projects'), cmd.ls());

    // System
    case 'CLEAR':
      return 'clear';
    case 'SHOW_HELP':
      return 'help';
    case 'SHOW_HISTORY':
      return 'history';
  }
}

/**
 * ActionExecutor 타입 정의
 */
export type ActionDispatcher = (action: Action, options?: ActionOptions) => void;

/**
 * ActionExecutor 생성
 *
 * executeCommand 함수를 받아서 Action을 처리하는 dispatcher를 반환합니다.
 */
export function createActionDispatcher(
  executeCommand: (cmd: string, options?: { silent?: boolean }) => void
): ActionDispatcher {
  return (action: Action, options?: ActionOptions) => {
    const command = actionToCommand(action);
    executeCommand(command, options);
  };
}
