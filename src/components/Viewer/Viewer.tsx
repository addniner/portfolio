import { useShell } from '@/hooks/useShell';
import { FileExplorer } from './FileExplorer';
import { VimViewer } from './VimViewer';
import { AnimatePresence } from 'motion/react';

export function Viewer() {
  const { viewPath, editorMode, cwd, shell } = useShell();
  const node = shell.resolvePath(viewPath);

  // Determine the path to display in FileExplorer
  const isDirectory = node?.type === 'directory';
  const explorerPath = isDirectory ? viewPath : cwd;

  return (
    <div className="h-full overflow-hidden relative">
      {/* FileExplorer - always mounted, path changes handled internally */}
      <FileExplorer path={explorerPath} />

      {/* VimViewer overlay - shown on top of FileExplorer when viewing a file */}
      <AnimatePresence>
        {editorMode && (
          <VimViewer path={editorMode.filePath} />
        )}
      </AnimatePresence>
    </div>
  );
}
