import { useState } from 'react';
import { Folder, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THUMBNAIL_SIZES } from '@/config/icons';

interface ThumbnailIconProps {
  src: string;
  alt: string;
  isFolder: boolean;
  gradientColor: string;
  size?: keyof typeof THUMBNAIL_SIZES;
  className?: string;
  ext?: string; // 파일 확장자 (폴백 시 뱃지 표시용)
}

export function ThumbnailIcon({
  src,
  alt,
  isFolder,
  gradientColor,
  size = 'md',
  className,
  ext,
}: ThumbnailIconProps) {
  const [hasError, setHasError] = useState(false);

  const sizeConfig = THUMBNAIL_SIZES[size];

  const Icon = isFolder ? Folder : FileText;

  if (hasError) {
    return (
      <div
        className={cn(
          'rounded-lg bg-linear-to-br flex flex-col items-center justify-center relative',
          sizeConfig.container,
          gradientColor,
          className
        )}
      >
        {/* Folded corner for files */}
        {!isFolder && <div className="absolute top-0 right-0 w-4 h-4 bg-white/20 rounded-bl-md" />}
        <Icon className={cn(sizeConfig.icon, 'text-white/90 drop-shadow-md')} />
        {/* File extension badge - md 사이즈에서만 표시 */}
        {!isFolder && ext && sizeConfig.showBadge && (
          <span className={cn(
            'mt-1 bg-black/30 backdrop-blur-sm rounded text-white/90 uppercase font-semibold tracking-wide',
            sizeConfig.badge
          )}>
            {ext}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg overflow-hidden', sizeConfig.container, className)}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
