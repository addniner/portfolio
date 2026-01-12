import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTerminalContext } from '@/context/TerminalContext';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Dock } from '@/components/ui/Dock';
import { MobileSegmentControl } from '@/components/ui/MobileSegmentControl';
import { motion, AnimatePresence } from 'motion/react';

interface DualPanelProps {
  terminal: ReactNode;
  viewer: ReactNode;
}

export function DualPanel({ terminal, viewer }: DualPanelProps) {
  const { state, setTerminalVisible, setViewerVisible } = useTerminalContext();
  const { isTerminalVisible, isViewerVisible } = state;
  const isMobile = useIsMobile();

  // Swipe gesture state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Current active tab: 'finder' (viewer) or 'terminal'
  const activeTab = isTerminalVisible && !isViewerVisible ? 'terminal' : 'finder';

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // 수평 스와이프인지 확인 (수직보다 수평이 더 클 때만)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsDragging(true);
      // 드래그 오프셋 제한 (화면 너비의 30%까지)
      const maxOffset = window.innerWidth * 0.3;
      setDragOffset(Math.max(-maxOffset, Math.min(maxOffset, deltaX)));
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      const threshold = 50; // 50px 이상 스와이프하면 전환

      if (dragOffset > threshold && activeTab === 'terminal') {
        // 오른쪽으로 스와이프 → Finder로 전환
        setViewerVisible(true);
        setTerminalVisible(false);
      } else if (dragOffset < -threshold && activeTab === 'finder') {
        // 왼쪽으로 스와이프 → Terminal로 전환
        setTerminalVisible(true);
        setViewerVisible(false);
      }
    }

    setIsDragging(false);
    setDragOffset(0);
  };

  // Count visible panels (for desktop dual view)
  const visibleCount = (isViewerVisible ? 1 : 0) + (isTerminalVisible ? 1 : 0);

  // Mobile: show one panel at a time with swipe gesture and slide animation
  if (isMobile) {
    return (
      <div
        className="h-dvh w-screen overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Content area with slide animation */}
        <div
          className="h-full w-full relative"
          style={{
            transform: isDragging ? `translateX(${dragOffset}px)` : undefined,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {activeTab === 'finder' ? (
              <motion.div
                key="finder"
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                  'absolute inset-0',
                  'h-full w-full overflow-hidden',
                  'bg-background'
                )}
              >
                {viewer}
              </motion.div>
            ) : (
              <motion.div
                key="terminal"
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                  'absolute inset-0',
                  'h-full w-full overflow-hidden',
                  'bg-dracula-bg'
                )}
              >
                {terminal}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Segment Control - floating over content */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-50"
          style={{ bottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}
        >
          <MobileSegmentControl />
        </div>
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
