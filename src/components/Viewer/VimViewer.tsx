import { useEffect } from 'react';
import { MarkdownRenderer } from '@/components/Markdown/MarkdownRenderer';
import { FileText, FileCode } from 'lucide-react';
import { WindowHeader } from '@/components/ui/WindowHeader';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useShell } from '@/hooks/useShell';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';

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
  const { exitEditor, cwd, shell } = useShell();
  const isMobile = useIsMobile();
  const node = shell.resolvePath(path);
  const filename = shell.getBasename(path);

  const handleClose = () => {
    exitEditor();
    shell.setViewPath(cwd);
  };

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!node || node.type === 'directory') {
    return null;
  }

  const content = shell.getFileContent(node);
  const isMarkdown = filename.endsWith('.md');

  // 모바일: 바텀시트 (Drawer)
  if (isMobile) {
    return (
      <Drawer
        open={true}
        onOpenChange={(open) => !open && handleClose()}
        shouldScaleBackground={false}
      >
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b border-border pb-3">
            <DrawerTitle className="flex items-center gap-2 justify-center">
              {getFileIcon(filename)}
              <span className="truncate">{filename}</span>
            </DrawerTitle>
          </DrawerHeader>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {isMarkdown ? (
              <div className="p-4">
                <MarkdownRenderer content={content || ''} />
              </div>
            ) : (
              <pre className="p-4 text-sm text-foreground whitespace-pre-wrap leading-6 font-mono">
                {content || '(empty file)'}
              </pre>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/50 text-xs text-muted-foreground">
            <span className="px-2 py-0.5 bg-secondary rounded text-secondary-foreground">
              {isMarkdown ? 'Markdown' : filename.split('.').pop()?.toUpperCase()}
            </span>
            <span>{content?.split('\n').length || 0} lines</span>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // 데스크톱: 모달 스타일
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vim-viewer-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-8 sm:p-12 lg:p-16"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-sm bg-backdrop"
        onClick={handleClose}
      />

      {/* Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'relative w-full max-w-3xl h-[80vh] flex flex-col',
          'rounded-2xl overflow-hidden',
          'shadow-2xl shadow-shadow-strong',
          'bg-card border border-border',
          'backdrop-blur-xl'
        )}
      >
        {/* macOS-style title bar */}
        <WindowHeader
          titleId="vim-viewer-title"
          onClose={handleClose}
          centerContent={
            <div className="flex items-center gap-2">
              {getFileIcon(filename)}
              <span id="vim-viewer-title" className="text-sm font-medium text-foreground">
                {filename}
              </span>
            </div>
          }
        />

        {/* Content area */}
        <div className="flex-1 overflow-y-auto bg-card">
          {isMarkdown ? (
            <div className="p-4 sm:p-6 lg:p-8">
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
              Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] text-secondary-foreground">ESC</kbd> to close
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
