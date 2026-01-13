/**
 * 프로젝트 썸네일 경로 반환
 * - 썸네일 경로를 반환 (실제 존재 여부는 이미지 로드 시 확인)
 */
export function getProjectThumbnail(name: string): string {
  return `/thumbnails/${name}.png`;
}
