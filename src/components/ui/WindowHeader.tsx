import type { ReactNode } from 'react';
import { X, Minus, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrafficLightProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  showIcons?: boolean;
}

export function TrafficLights({
  onClose,
  onMinimize,
  onMaximize,
  showIcons = true,
}: TrafficLightProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClose}
        aria-label="Close"
        className={cn(
          'group w-3 h-3 rounded-full transition-colors flex items-center justify-center',
          'bg-traffic-close hover:bg-traffic-close/80'
        )}
        title="Close"
      >
        {showIcons && (
          <X className="w-2 h-2 text-traffic-close-icon opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
      <button
        onClick={onMinimize}
        aria-label="Minimize"
        className={cn(
          'group w-3 h-3 rounded-full transition-colors flex items-center justify-center',
          'bg-traffic-minimize hover:bg-traffic-minimize/80'
        )}
        title="Minimize"
      >
        {showIcons && (
          <Minus className="w-2 h-2 text-traffic-minimize-icon opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
      <button
        onClick={onMaximize}
        aria-label="Maximize"
        className={cn(
          'group w-3 h-3 rounded-full transition-colors flex items-center justify-center',
          'bg-traffic-maximize hover:bg-traffic-maximize/80'
        )}
        title="Maximize"
      >
        {showIcons && (
          <Maximize2 className="w-1.5 h-1.5 text-traffic-maximize-icon opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
    </div>
  );
}

interface WindowHeaderProps {
  title?: ReactNode;
  titleId?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  showTrafficLights?: boolean;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  centerContent?: ReactNode;
  className?: string;
  variant?: 'default' | 'muted' | 'terminal';
}

export function WindowHeader({
  title,
  titleId,
  onClose,
  onMinimize,
  onMaximize,
  showTrafficLights = true,
  leftContent,
  rightContent,
  centerContent,
  className,
  variant = 'default',
}: WindowHeaderProps) {
  const variantStyles = {
    default: 'bg-muted/50 border-border',
    muted: 'bg-muted/30 border-border',
    terminal: 'bg-dracula-current/50 border-dracula-comment/30',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b',
        variantStyles[variant],
        className
      )}
    >
      {/* Left section: Traffic lights or custom content */}
      {showTrafficLights ? (
        <TrafficLights
          onClose={onClose}
          onMinimize={onMinimize}
          onMaximize={onMaximize}
        />
      ) : (
        leftContent
      )}

      {/* Center section: Title or custom content */}
      <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground">
        {centerContent || (
          title && (
            <span
              id={titleId}
              className="text-sm font-medium text-foreground"
            >
              {title}
            </span>
          )
        )}
      </div>

      {/* Right section: Custom content or spacer for symmetry */}
      {rightContent || (showTrafficLights && <div className="w-13" />)}
    </div>
  );
}
