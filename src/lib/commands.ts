/**
 * 명령어 빌더 유틸리티
 * 터미널 명령어 문자열을 일관되게 생성합니다.
 */
export const cmd = {
  /** 디렉토리 변경 */
  cd: (path: string) => `cd ${path}`,

  /** Vim 에디터로 파일 열기 */
  vim: (path: string) => `vim ${path}`,

  /** 파일 내용 출력 */
  cat: (path: string) => `cat ${path}`,

  /** 디렉토리 목록 조회 */
  ls: (flags?: string) => (flags ? `ls ${flags}` : 'ls'),

  /** 프로젝트 열기 (GitHub) */
  open: (project?: string) => (project ? `open ${project}` : 'open'),

  /** 명령어 체이닝 (&&) */
  chain: (...commands: string[]) => commands.join(' && '),
};
