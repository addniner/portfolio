import { useTerminalContext } from '@/context/TerminalContext';
import { Terminal, Folder, FileText, FolderOpen, ExternalLink, User, Trash2, History, Keyboard } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ViewerNav } from './ViewerNav';

const commands = [
  { cmd: 'help', desc: 'Show this help message', icon: Terminal },
  { cmd: 'ls [-l]', desc: 'List all projects (-l for detailed view)', icon: Folder },
  { cmd: 'cat <name>', desc: 'Show project README', icon: FileText },
  { cmd: 'cd <name>', desc: 'Change to project context', icon: FolderOpen },
  { cmd: 'open [name]', desc: 'Open project in GitHub', icon: ExternalLink },
  { cmd: 'whoami', desc: 'Display profile information', icon: User },
  { cmd: 'clear', desc: 'Clear terminal history', icon: Trash2 },
  { cmd: 'history', desc: 'Show command history', icon: History },
];

const shortcuts = [
  { key: 'Tab', desc: 'Autocomplete command or argument' },
  { key: '↑ / ↓', desc: 'Navigate command history' },
  { key: 'Ctrl + L', desc: 'Clear terminal (same as clear)' },
];

export function Help() {
  const { executeCommand } = useTerminalContext();

  return (
    <div className="h-full flex flex-col">
      <ViewerNav current="help" />
      <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <Terminal className="w-12 h-12 mx-auto mb-4 text-dracula-purple" />
          <h1 className="text-2xl font-bold text-dracula-fg mb-2">Command Reference</h1>
          <p className="text-dracula-comment">
            Use these commands to explore my portfolio
          </p>
        </div>

        {/* Commands Grid */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-dracula-pink flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Available Commands
          </h2>
          <div className="grid gap-2">
            {commands.map(({ cmd, desc, icon: Icon }) => (
              <button
                key={cmd}
                onClick={() => executeCommand(cmd.split(' ')[0])}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-lg text-left',
                  'bg-dracula-current/30 hover:bg-dracula-current/50',
                  'transition-colors group'
                )}
              >
                <Icon className="w-5 h-5 text-dracula-purple shrink-0" />
                <div className="flex-1 min-w-0">
                  <code className="text-dracula-green font-mono">{cmd}</code>
                  <p className="text-sm text-dracula-comment truncate">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-dracula-cyan flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </h2>
          <div className="grid gap-2">
            {shortcuts.map(({ key, desc }) => (
              <div
                key={key}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  'bg-dracula-current/20'
                )}
              >
                <span className="text-dracula-comment">{desc}</span>
                <kbd className={cn(
                  'px-2 py-1 rounded text-sm font-mono',
                  'bg-dracula-bg text-dracula-fg border border-dracula-current'
                )}>
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start */}
        <div className={cn(
          'p-4 rounded-lg',
          'bg-dracula-purple/10 border border-dracula-purple/30'
        )}>
          <h3 className="font-semibold text-dracula-purple mb-2">Quick Start</h3>
          <p className="text-sm text-dracula-comment mb-3">
            Try these commands to get started:
          </p>
          <div className="flex flex-wrap gap-2">
            {['ls -l', 'whoami', 'cat portfolio'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => executeCommand(cmd)}
                className={cn(
                  'px-3 py-1.5 rounded font-mono text-sm',
                  'bg-dracula-purple text-dracula-bg',
                  'hover:bg-dracula-purple/90 transition-colors'
                )}
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
