/**
 * Action Types - 앱에서 발생할 수 있는 모든 액션 정의
 *
 * 컴포넌트는 "무엇을 하고 싶은지(의도)"만 전달하고,
 * ActionExecutor가 이를 명령어로 변환하여 실행합니다.
 */

// 네비게이션 관련 액션
export type NavigationAction =
  | { type: 'NAVIGATE'; path: string }           // 특정 경로로 이동
  | { type: 'NAVIGATE_BACK' }                    // 상위 디렉토리로
  | { type: 'NAVIGATE_ROOT' }                    // 루트로 이동
  | { type: 'NAVIGATE_HOME' };                   // 홈으로 이동

// 파일 관련 액션
export type FileAction =
  | { type: 'OPEN_FILE'; path: string }          // 파일 열기 (vim)
  | { type: 'VIEW_FILE'; path: string }          // 파일 보기 (cat)
  | { type: 'LIST_DIR'; flags?: string };        // 디렉토리 목록

// 프로젝트 관련 액션
export type ProjectAction =
  | { type: 'OPEN_PROJECT'; name: string }       // 프로젝트 열기
  | { type: 'LIST_PROJECTS' };                   // 프로젝트 목록

// 시스템 액션
export type SystemAction =
  | { type: 'CLEAR' }                            // 터미널 클리어
  | { type: 'SHOW_HELP' }                        // 도움말 표시
  | { type: 'SHOW_HISTORY' };                    // 히스토리 표시

// 통합 Action 타입
export type Action =
  | NavigationAction
  | FileAction
  | ProjectAction
  | SystemAction;

// 액션 실행 옵션
export interface ActionOptions {
  silent?: boolean;  // 터미널에 명령어 표시 안함
}
