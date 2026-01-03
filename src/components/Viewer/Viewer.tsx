import { useMemo } from 'react';
import { useTerminalContext } from '@/context/TerminalContext';
import { FileExplorer } from './FileExplorer';
import { VimViewer } from './VimViewer';
import { AnimatePresence, motion } from 'motion/react';
import { getFilesystem, resolvePath } from '@/data/filesystem';

export function Viewer() {
  const { state } = useTerminalContext();
  const { viewerPath, vimMode } = state;
  const fs = getFilesystem();
  const node = resolvePath(viewerPath, fs);

  // Determine if we should show FileExplorer or VimViewer
  const isDirectory = node?.type === 'directory';

  // Generate a stable key for animations
  const contentKey = useMemo(() => {
    if (vimMode) {
      // When vim is open, keep the same key to prevent FileExplorer re-animation
      return `explorer-${state.cwd}`;
    }
    return `${isDirectory ? 'explorer' : 'vim'}-${viewerPath}`;
  }, [viewerPath, vimMode, isDirectory, state.cwd]);

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
          <FileExplorer path={isDirectory ? viewerPath : state.cwd} />
        </motion.div>
      </AnimatePresence>

      {/* VimViewer overlay - shown on top of FileExplorer when viewing a file */}
      <AnimatePresence>
        {vimMode && (
          <VimViewer path={vimMode.filePath} />
        )}
      </AnimatePresence>
    </div>
  );
}
