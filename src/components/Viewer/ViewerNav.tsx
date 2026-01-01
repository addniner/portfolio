import { useTerminalContext } from '@/context/TerminalContext';
import { Home, FolderGit2, User, HelpCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ViewerNavProps {
  current: 'home' | 'projects' | 'profile' | 'help';
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home, command: 'cd ~' },
  { id: 'projects', label: 'Projects', icon: FolderGit2, command: 'ls' },
  { id: 'profile', label: 'About', icon: User, command: 'whoami' },
  { id: 'help', label: 'Help', icon: HelpCircle, command: 'help' },
] as const;

export function ViewerNav({ current }: ViewerNavProps) {
  const { executeCommand } = useTerminalContext();

  return (
    <nav className="flex items-center gap-1 p-2 border-b border-dracula-current/50 bg-dracula-bg/50">
      {navItems.map(({ id, label, icon: Icon, command }) => (
        <button
          key={id}
          onClick={() => executeCommand(command)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
            current === id
              ? 'bg-dracula-purple/20 text-dracula-purple'
              : 'text-dracula-comment hover:text-dracula-fg hover:bg-dracula-current/30'
          )}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </nav>
  );
}
