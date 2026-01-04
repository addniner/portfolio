import { useMemo } from 'react';
import { useShell } from '@/hooks/useShell';
import { FileExplorer } from './FileExplorer';
import { VimViewer } from './VimViewer';
import { AnimatePresence, motion } from 'motion/react';

export function Viewer() {
  const { viewPath, editorMode, cwd, shell } = useShell();
  const node = shell.resolvePath(viewPath);

  // Determine if we should show FileExplorer or VimViewer
  const isDirectory = node?.type === 'directory';

  // Generate a stable key for animations
  const contentKey = useMemo(() => {
    if (editorMode) {
      // When vim is open, keep the same key to prevent FileExplorer re-animation
      return `explorer-${cwd}`;
    }
    return `${isDirectory ? 'explorer' : 'vim'}-${viewPath}`;
  }, [viewPath, editorMode, isDirectory, cwd]);

  return (
    <div className="h-full overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={contentKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="h-full"
        >
          {/* Directory → FileExplorer, File → FileExplorer (vim opens as overlay) */}
          <FileExplorer path={isDirectory ? viewPath : cwd} />
        </motion.div>
      </AnimatePresence>

      {/* VimViewer overlay - shown on top of FileExplorer when viewing a file */}
      <AnimatePresence>
        {editorMode && (
          <VimViewer path={editorMode.filePath} />
        )}
      </AnimatePresence>
    </div>
  );
}
