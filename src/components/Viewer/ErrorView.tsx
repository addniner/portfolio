import { useTerminalContext } from '@/context/TerminalContext';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ErrorViewProps {
  message: string;
  suggestions?: string[];
}

export function ErrorView({ message, suggestions }: ErrorViewProps) {
  const { executeCommand } = useTerminalContext();

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <AlertCircle className="w-16 h-16 text-dracula-red mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-dracula-fg mb-2">Not Found</h2>
        <p className="text-dracula-comment mb-6">{message}</p>

        {suggestions && suggestions.length > 0 && (
          <div className="text-left">
            <p className="text-dracula-fg mb-3">Did you mean:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => executeCommand(`cat ${suggestion}`)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg',
                    'bg-dracula-current text-dracula-cyan',
                    'hover:bg-dracula-current/80 transition-colors',
                    'text-sm font-mono'
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
