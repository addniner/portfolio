import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTerminalContext } from '@/context/TerminalContext';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Dock } from '@/components/ui/Dock';
import { MobileSegmentControl } from '@/components/ui/MobileSegmentControl';

interface DualPanelProps {
  terminal: ReactNode;
  viewer: ReactNode;
}

export function DualPanel({ terminal, viewer }: DualPanelProps) {
  const { state } = useTerminalContext();
  const { isTerminalVisible, isViewerVisible } = state;
  const isMobile = useIsMobile();

  // Count visible panels (for desktop dual view)
  const visibleCount = (isViewerVisible ? 1 : 0) + (isTerminalVisible ? 1 : 0);

  // Mobile: show one panel at a time with segment control switching (full screen)
  if (isMobile) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-depth relative">
        {/* Full screen panel container - no padding, just bottom space for controls */}
        <div className="h-full w-full pb-16">
          {/* Viewer Window (shown when active) - full screen */}
          <div
            className={cn(
              'h-full w-full overflow-hidden',
              'bg-background',
              'transition-opacity duration-200',
              isViewerVisible ? 'opacity-100' : 'hidden'
            )}
          >
            {viewer}
          </div>

          {/* Terminal Window (shown when active) - full screen */}
          <div
            className={cn(
              'h-full w-full overflow-hidden',
              'bg-dracula-bg',
              'transition-opacity duration-200',
              isTerminalVisible && !isViewerVisible ? 'opacity-100' : 'hidden'
            )}
          >
            {terminal}
          </div>
        </div>

        {/* Mobile Segment Control */}
        <MobileSegmentControl />
      </div>
    );
  }

  // Desktop: dual panel layout with Dock
  return (
    <div className="h-screen w-screen overflow-hidden bg-depth relative">
      {/* Floating windows container */}
      <div className={cn(
        'h-full w-full',
        'flex flex-row',
        'p-4 gap-4 lg:p-6 lg:gap-6',
        'pb-20 lg:pb-24' // Space for dock
      )}>
        {/* Viewer Window */}
        <div
          className={cn(
            'window-glass rounded-2xl overflow-hidden',
            'flex flex-col min-h-0 min-w-0',
            'transition-all duration-300 ease-out',
            isViewerVisible
              ? visibleCount === 2
                ? 'h-full w-1/2 opacity-100'
                : 'h-full w-full opacity-100'
              : 'h-0 w-0 opacity-0 p-0 m-0 overflow-hidden'
          )}
          style={{ flexShrink: isViewerVisible ? 0 : 1 }}
        >
          {viewer}
        </div>

        {/* Terminal Window - Viewer와 동일한 스타일 */}
        <div
          className={cn(
            'window-glass rounded-2xl overflow-hidden',
            'flex flex-col min-h-0 min-w-0',
            'transition-all duration-300 ease-out',
            isTerminalVisible
              ? visibleCount === 2
                ? 'h-full w-1/2 opacity-100'
                : 'h-full w-full opacity-100'
              : 'h-0 w-0 opacity-0 p-0 m-0 overflow-hidden'
          )}
          style={{ flexShrink: isTerminalVisible ? 0 : 1 }}
        >
          {terminal}
        </div>

        {/* Empty state when no panels visible */}
        {visibleCount === 0 && (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Click an app in the Dock to open it</p>
          </div>
        )}
      </div>

      {/* macOS-style Dock */}
      <Dock />
    </div>
  );
}
