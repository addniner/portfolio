import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { useTerminalContext } from '@/context/TerminalContext';
import { Terminal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DualPanelProps {
  terminal: ReactNode;
  viewer: ReactNode;
}

export function DualPanel({ terminal, viewer }: DualPanelProps) {
  const { state, toggleTerminal } = useTerminalContext();
  const { isTerminalVisible } = state;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row relative">
      {/* Viewer Panel */}
      <div
        className={cn(
          'h-screen shrink-0',
          'md:h-full md:overflow-hidden',
          'bg-viewer-bg',
          'relative',
          'transition-all duration-300 ease-in-out',
          isTerminalVisible ? 'w-1/2' : 'w-full'
        )}
        style={{ minWidth: 0 }}
      >
        {viewer}

        {/* Terminal Toggle Button - shown when terminal is hidden */}
        <AnimatePresence>
          {!isTerminalVisible && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={toggleTerminal}
              className={cn(
                'fixed bottom-6 right-6 z-50',
                'w-14 h-14 rounded-full',
                'bg-slate-800 hover:bg-slate-700',
                'border border-slate-600',
                'shadow-lg shadow-black/30',
                'flex items-center justify-center',
                'text-slate-300 hover:text-white',
                'transition-colors duration-200'
              )}
              title="Open Terminal"
            >
              <Terminal className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Terminal Panel - always mounted, visibility controlled via CSS */}
      <div
        className={cn(
          'h-screen shrink-0',
          'md:h-full md:overflow-hidden',
          'relative',
          'transition-all duration-300 ease-in-out',
          isTerminalVisible ? 'w-1/2 opacity-100' : 'w-0 opacity-0 overflow-hidden'
        )}
        style={{ minWidth: 0 }}
      >
        {/* Close Terminal Button */}
        <button
          onClick={toggleTerminal}
          className={cn(
            'absolute top-3 right-3 z-50',
            'w-8 h-8 rounded-lg',
            'bg-slate-700/80 hover:bg-slate-600',
            'flex items-center justify-center',
            'text-slate-400 hover:text-white',
            'transition-colors duration-200',
            'backdrop-blur-sm'
          )}
          title="Close Terminal"
        >
          <X className="w-4 h-4" />
        </button>
        {terminal}
      </div>
    </div>
  );
}
