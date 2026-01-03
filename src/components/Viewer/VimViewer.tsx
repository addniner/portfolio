import {
  getFilesystem,
  resolvePath,
  getBasename,
} from '@/data/filesystem';
import { getFileContent } from '@/lib/fileContent';
import { MarkdownRenderer } from '@/components/Markdown/MarkdownRenderer';
import { FileText, FileCode, X, Minus, Maximize2 } from 'lucide-react';
import { useTerminalContext } from '@/context/TerminalContext';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface VimViewerProps {
  path: string;
}

// Get file icon based on extension
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'md') {
    return <FileText className="w-4 h-4" />;
  }
  return <FileCode className="w-4 h-4" />;
}

export function VimViewer({ path }: VimViewerProps) {
  const { setVimMode, setViewerPath, state } = useTerminalContext();
  const fs = getFilesystem();
  const node = resolvePath(path, fs);
  const filename = getBasename(path);

  const handleClose = () => {
    setVimMode(null);
    setViewerPath(state.cwd);
  };

  if (!node || node.type === 'directory') {
    return null;
  }

  const content = getFileContent(node);
  const isMarkdown = filename.endsWith('.md');

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vim-viewer-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 md:p-6"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "absolute inset-0 backdrop-blur-sm",
          "bg-black/40 dark:bg-black/60"
        )}
        onClick={handleClose}
      />

      {/* Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'relative w-full max-w-3xl max-h-[85vh] flex flex-col',
          'rounded-2xl overflow-hidden',
          'shadow-2xl',
          'bg-card border border-border',
          'shadow-black/10 dark:shadow-black/50',
          'backdrop-blur-xl'
        )}
      >
        {/* macOS-style title bar */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 border-b",
          "bg-muted/50 border-border"
        )}>
          {/* Traffic lights */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              aria-label="Close file viewer"
              className="group w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors flex items-center justify-center"
              title="Close"
            >
              <X className="w-2 h-2 text-[#8b0000] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#febc2e]/80 transition-colors flex items-center justify-center"
              title="Minimize"
            >
              <Minus className="w-2 h-2 text-[#8b6914] opacity-0 hover:opacity-100 transition-opacity" />
            </button>
            <button
              className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#28c840]/80 transition-colors flex items-center justify-center"
              title="Maximize"
            >
              <Maximize2 className="w-1.5 h-1.5 text-[#006400] opacity-0 hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* File info - centered */}
          <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground">
            {getFileIcon(filename)}
            <span id="vim-viewer-title" className="text-sm font-medium text-foreground">{filename}</span>
          </div>

          {/* Spacer for symmetry */}
          <div className="w-13" />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto bg-card">
          {isMarkdown ? (
            <div className="p-6 md:p-8">
              <MarkdownRenderer content={content || ''} />
            </div>
          ) : (
            <div className="flex min-h-full">
              {/* Line numbers */}
              <div className={cn(
                "shrink-0 py-4 px-3 text-right select-none border-r",
                "bg-muted/30 text-muted-foreground/50 border-border"
              )}>
                {content?.split('\n').map((_, i) => (
                  <div key={i} className="text-xs leading-6 font-mono">
                    {i + 1}
                  </div>
                )) || <div className="text-xs leading-6 font-mono">1</div>}
              </div>
              {/* Code content */}
              <pre className="flex-1 py-4 px-4 text-sm text-foreground whitespace-pre-wrap leading-6 font-mono">
                {content || '(empty file)'}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cn(
          "flex items-center justify-between px-4 py-2 border-t text-xs",
          "bg-muted/50 border-border text-muted-foreground"
        )}>
          <div className="flex items-center gap-4">
            <span className="px-2 py-0.5 bg-secondary rounded text-secondary-foreground">
              {isMarkdown ? 'Markdown' : filename.split('.').pop()?.toUpperCase()}
            </span>
            <span>{content?.split('\n').length || 0} lines</span>
          </div>
          <div className="flex items-center gap-4">
            <span>UTF-8</span>
            <span className="text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] text-secondary-foreground">:q</kbd> to close
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
