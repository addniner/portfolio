import { useTerminalContext } from '@/context/TerminalContext';
import { Terminal, User } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Welcome() {
  const { executeCommand } = useTerminalContext();

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <p className="text-5xl mb-4">👋</p>
        <h1 className="text-4xl font-bold text-dracula-fg mb-2">
          Welcome!
        </h1>
        <p className="text-xl text-dracula-purple mb-1">
          I'm Hyeonmin,
        </p>
        <p className="text-lg text-dracula-comment mb-8">
          Full-Stack Developer
        </p>

        <div className="flex gap-4 justify-center mb-8">
          <button
            onClick={() => executeCommand('ls -l')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-lg',
              'bg-dracula-purple text-dracula-bg font-medium',
              'hover:bg-dracula-purple/90 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-dracula-purple focus:ring-offset-2 focus:ring-offset-viewer-bg'
            )}
          >
            <Terminal className="w-5 h-5" />
            Projects
          </button>

          <button
            onClick={() => executeCommand('whoami')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-lg',
              'bg-dracula-current text-dracula-fg font-medium',
              'hover:bg-dracula-current/80 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-dracula-comment focus:ring-offset-2 focus:ring-offset-viewer-bg'
            )}
          >
            <User className="w-5 h-5" />
            About Me
          </button>
        </div>

        <p className="text-dracula-comment text-sm font-mono">
          try: <span className="text-dracula-cyan">ls</span>, <span className="text-dracula-cyan">whoami</span>, <span className="text-dracula-cyan">help</span>
        </p>
      </div>
    </div>
  );
}
