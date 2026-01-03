import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTerminalContext } from '@/context/TerminalContext';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Dock } from '@/components/ui/Dock';

interface DualPanelProps {
  terminal: ReactNode;
  viewer: ReactNode;
}

export function DualPanel({ terminal, viewer }: DualPanelProps) {
  const { state } = useTerminalContext();
  const { isTerminalVisible, isViewerVisible } = state;
  const isMobile = useIsMobile();

  // Count visible panels
  const visibleCount = (isViewerVisible ? 1 : 0) + (isTerminalVisible ? 1 : 0);

  return (
    <div className="h-screen w-screen overflow-hidden bg-depth relative">
      {/* Floating windows container */}
      <div className={cn(
        'h-full w-full',
        'flex flex-col md:flex-row',
        'p-3 md:p-4 gap-3 md:gap-4',
        'pb-20 md:pb-20' // Space for dock
      )}>
        {/* Viewer Window */}
        <div
          className={cn(
            'window-glass rounded-2xl overflow-hidden',
            'flex flex-col min-h-0 min-w-0',
            'transition-all duration-300 ease-out',
            isViewerVisible
              ? visibleCount === 2
                ? isMobile ? 'h-1/2 w-full opacity-100' : 'h-full w-1/2 opacity-100'
                : 'h-full w-full opacity-100'
              : 'h-0 w-0 opacity-0 p-0 m-0 overflow-hidden'
          )}
          style={{ flexShrink: isViewerVisible ? 0 : 1 }}
        >
          {viewer}
        </div>

        {/* Terminal Window */}
        <div
          className={cn(
            'rounded-2xl overflow-hidden',
            'flex flex-col min-h-0 min-w-0',
            'bg-dracula-bg/95 border border-window-border',
            'shadow-[0_8px_32px_var(--window-shadow),0_4px_16px_var(--window-shadow)]',
            'backdrop-blur-xl',
            'transition-all duration-300 ease-out',
            isTerminalVisible
              ? visibleCount === 2
                ? isMobile ? 'h-1/2 w-full opacity-100' : 'h-full w-1/2 opacity-100'
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
