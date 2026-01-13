// 아이콘 사이즈 설정
export const ICON_SIZES = {
  // 모바일 리스트 뷰
  sm: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
  },
  // 데스크톱 그리드 뷰 - 폴더
  md: {
    container: 'w-16 h-14',
    icon: 'w-8 h-8',
  },
  // 데스크톱 그리드 뷰 - 파일
  mdFile: {
    container: 'w-16 h-20',
    icon: 'w-7 h-7',
  },
} as const;

// 썸네일 아이콘 사이즈 (폴백 시 사용)
export const THUMBNAIL_SIZES = {
  sm: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
    badge: '',
    showBadge: false,
  },
  md: {
    container: 'w-16 h-20',
    icon: 'w-7 h-7',
    badge: 'text-[9px] px-1.5 py-0.5',
    showBadge: true,
  },
} as const;
