import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { Terminal, FolderOpen, Sun, Moon, Monitor } from 'lucide-react';
import { useTerminalContext } from '@/context/TerminalContext';
import { useTheme } from '@/context/ThemeContext';

type Tab = 'finder' | 'terminal';

export function MobileSegmentControl() {
  const { state, setTerminalVisible, setViewerVisible } = useTerminalContext();
  const { theme, setTheme } = useTheme();

  // Determine active tab based on visibility state
  const activeTab: Tab = state.isTerminalVisible && !state.isViewerVisible ? 'terminal' : 'finder';

  const handleTabChange = (tab: Tab) => {
    if (tab === 'finder') {
      setViewerVisible(true);
      setTerminalVisible(false);
    } else {
      setTerminalVisible(true);
      setViewerVisible(false);
    }
  };

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-4 h-4" />;
    }
    return theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-2',
        'px-1.5 py-1.5',
        'rounded-2xl',
        'bg-dock-bg border border-dock-border',
        'backdrop-blur-xl',
        'shadow-lg shadow-black/10 dark:shadow-black/30'
      )}
    >
      {/* Segment Control */}
      <div className="relative flex items-center bg-secondary/50 rounded-xl p-1">
        {/* Animated background */}
        <motion.div
          layoutId="segment-bg"
          className="absolute inset-y-1 rounded-lg bg-background shadow-sm"
          style={{
            width: 'calc(50% - 4px)',
            left: activeTab === 'finder' ? '4px' : 'calc(50%)',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />

        {/* Finder Tab */}
        <button
          onClick={() => handleTabChange('finder')}
          className={cn(
            'relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg',
            'text-sm font-medium transition-colors duration-200',
            activeTab === 'finder'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Finder</span>
        </button>

        {/* Terminal Tab */}
        <button
          onClick={() => handleTabChange('terminal')}
          className={cn(
            'relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg',
            'text-sm font-medium transition-colors duration-200',
            activeTab === 'terminal'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Terminal className="w-4 h-4" />
          <span>Terminal</span>
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-border" />

      {/* Theme Toggle */}
      <button
        onClick={cycleTheme}
        className={cn(
          'flex items-center justify-center',
          'w-10 h-10 rounded-xl',
          'bg-secondary/50 hover:bg-accent',
          'text-muted-foreground hover:text-foreground',
          'transition-colors duration-200'
        )}
        aria-label="Toggle theme"
      >
        {getThemeIcon()}
      </button>
    </div>
  );
}
