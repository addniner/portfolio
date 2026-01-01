import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface DualPanelProps {
  terminal: ReactNode;
  viewer: ReactNode;
}

export function DualPanel({ terminal, viewer }: DualPanelProps) {
  return (
    <div
      className={cn(
        'h-screen w-screen overflow-hidden',
        // Desktop: side by side
        'md:grid md:grid-cols-2',
        // Mobile: vertical scroll with snap
        'flex flex-col md:flex-row',
        'snap-y snap-mandatory md:snap-none',
        'overflow-y-auto md:overflow-hidden'
      )}
    >
      {/* Terminal Panel */}
      <div
        className={cn(
          'h-screen flex-shrink-0',
          'snap-start md:snap-align-none',
          'md:h-full md:overflow-hidden'
        )}
      >
        {terminal}
      </div>

      {/* Viewer Panel */}
      <div
        className={cn(
          'h-screen flex-shrink-0',
          'snap-start md:snap-align-none',
          'md:h-full md:overflow-hidden',
          'bg-viewer-bg'
        )}
      >
        {viewer}
      </div>
    </div>
  );
}
