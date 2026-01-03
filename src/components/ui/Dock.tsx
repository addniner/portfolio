import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { Terminal, FolderOpen, Sun, Moon, Monitor } from 'lucide-react';
import { useTerminalContext } from '@/context/TerminalContext';
import { useTheme } from '@/context/ThemeContext';

interface DockItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

function DockItem({ icon, label, isActive, onClick }: DockItemProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.15, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'relative flex items-center justify-center',
        'w-12 h-12 rounded-xl',
        'bg-secondary/80 hover:bg-accent',
        'text-muted-foreground hover:text-foreground',
        'transition-colors duration-200',
        'shadow-sm'
      )}
    >
      {icon}
      {/* Active indicator dot */}
      {isActive && (
        <div className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-dock-item-active" />
      )}
    </motion.button>
  );
}

export function Dock() {
  const { state, toggleTerminal, toggleViewer } = useTerminalContext();
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-5 h-5" />;
    }
    return theme === 'dark'
      ? <Moon className="w-5 h-5" />
      : <Sun className="w-5 h-5" />;
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
      case 'system': return 'System Theme';
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-2 px-3 py-2',
        'rounded-2xl',
        'bg-dock-bg border border-dock-border',
        'backdrop-blur-xl',
        'shadow-lg shadow-black/10 dark:shadow-black/30'
      )}
    >
      <DockItem
        icon={<FolderOpen className="w-5 h-5" />}
        label="Finder"
        isActive={state.isViewerVisible}
        onClick={toggleViewer}
      />
      <DockItem
        icon={<Terminal className="w-5 h-5" />}
        label="Terminal"
        isActive={state.isTerminalVisible}
        onClick={toggleTerminal}
      />
      <div className="w-px h-8 bg-border mx-1" />
      <DockItem
        icon={getThemeIcon()}
        label={getThemeLabel()}
        onClick={cycleTheme}
      />
    </motion.div>
  );
}
