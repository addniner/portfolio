import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-4 h-4" />;
    }
    return resolvedTheme === 'dark'
      ? <Moon className="w-4 h-4" />
      : <Sun className="w-4 h-4" />;
  };

  const getLabel = () => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={cycleTheme}
      aria-label={`Current theme: ${getLabel()}. Click to change theme.`}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'text-sm font-medium transition-colors duration-200',
        'text-muted-foreground hover:text-foreground',
        'hover:bg-accent',
        className
      )}
      title={`Theme: ${getLabel()}`}
    >
      {getIcon()}
      {showLabel && <span>{getLabel()}</span>}
    </motion.button>
  );
}
