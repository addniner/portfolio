import type { FSNode } from '@/data/filesystem';

/**
 * FSNode에서 파일 내용을 추출합니다.
 * content가 함수인 경우 호출하여 결과를 반환하고,
 * 문자열인 경우 그대로 반환합니다.
 */
export function getFileContent(node: FSNode): string {
  if (!node.content) return '';
  return typeof node.content === 'function' ? node.content() : node.content;
}
