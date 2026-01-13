// 파일시스템 경로 상수
export const PATHS = {
  HOME: '/home/guest',
  ROOT: '/',
} as const;

// 홈 디렉토리인지 확인
export function isHomePath(path: string): boolean {
  return path === PATHS.HOME;
}
