import { useMemo } from 'react';
import { useTerminalContext } from '@/context/TerminalContext';
import {
  getFilesystem,
  resolvePath,
  listDirectory,
  type FSNode,
} from '@/data/filesystem';
import {
  Folder,
  FileText,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cmd } from '@/lib/commands';
import { motion } from 'motion/react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { FOLDER_COLORS, FILE_COLORS } from '@/config/colors';
import { FileTree } from './FileTree';

interface FileExplorerProps {
  path: string;
}

export function FileExplorer({ path }: FileExplorerProps) {
  const { executeCommand, toggleViewer } = useTerminalContext();
  const isMobile = useIsMobile();
  const fs = getFilesystem();
  const currentNode = resolvePath(path, fs);
  const contents = listDirectory(path, fs);

  if (!currentNode || !contents) {
    return (
      <div className="h-full flex items-center justify-center text-dracula-comment">
        Directory not found: {path}
      </div>
    );
  }

  const pathParts = path.split('/').filter(Boolean);

  const handleItemClick = (node: FSNode) => {
    if (node.type === 'directory' || node.type === 'symlink') {
      executeCommand(cmd.chain(cmd.cd(node.name), cmd.ls()));
    } else {
      executeCommand(cmd.vim(node.name));
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const targetPath = '/' + pathParts.slice(0, index + 1).join('/');
    executeCommand(cmd.chain(cmd.cd(targetPath), cmd.ls()));
  };

  const handleBackClick = () => {
    executeCommand(cmd.chain(cmd.cd('..'), cmd.ls()));
  };

  const handleRootClick = () => {
    executeCommand(cmd.chain(cmd.cd('/'), cmd.ls()));
  };

  // Filter and sort contents (memoized)
  const visibleContents = useMemo(() => {
    return contents
      .filter((item) => !item.name.startsWith('.'))
      .sort((a, b) => {
        const aIsDir = a.type === 'directory' || a.type === 'symlink';
        const bIsDir = b.type === 'directory' || b.type === 'symlink';
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [contents]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* macOS-style Window Header */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 shrink-0',
        'bg-muted/50 border-b border-border/50'
      )}>
        {/* Traffic lights */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleViewer}
            className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all"
            aria-label="Close Finder"
            title="Close"
          />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        {/* Title */}
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground">
            {pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'Finder'}
          </span>
        </div>
        {/* Spacer for symmetry */}
        <div className="w-14" />
      </div>

      {/* Content area */}
      <div className={cn(
        'flex-1 flex relative overflow-hidden',
        'bg-linear-to-br from-muted/30 via-transparent to-transparent'
      )}>
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        {/* Sidebar - File Tree (hidden on mobile) */}
        {!isMobile && (
          <div className="relative z-10 w-56 shrink-0 overflow-hidden">
            <FileTree currentPath={path} />
          </div>
        )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="relative z-10 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 mx-2 md:mr-4 md:ml-0 mt-2 md:mt-4">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleBackClick}
              disabled={path === '/'}
              aria-label="Go back to parent directory"
              className={cn(
                'p-1.5 rounded-lg transition-all duration-200',
                path === '/'
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded-lg text-muted-foreground/50 cursor-not-allowed"
              disabled
              aria-label="Go forward (disabled)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Breadcrumb */}
          <div className="flex-1 flex items-center gap-1 overflow-x-auto">
            <button
              onClick={handleRootClick}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-0.5 hover:bg-accent rounded"
            >
              <HardDrive className="w-4 h-4" />
            </button>
            {pathParts.map((part, index) => (
              <div key={index} className="flex items-center gap-1 shrink-0">
                <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={cn(
                    'px-2 py-0.5 rounded transition-all duration-200 text-xs whitespace-nowrap',
                    index === pathParts.length - 1
                      ? 'text-foreground font-semibold bg-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {part}
                </button>
              </div>
            ))}
          </div>

        </div>

        {/* Grid View */}
        <div className="relative z-10 flex-1 overflow-y-auto p-2 md:p-4">
          {visibleContents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Folder className="w-20 h-20 mb-4 opacity-20" />
              <p className="text-base">This folder is empty</p>
            </div>
          ) : (
            <div className="flex flex-wrap content-start gap-2 md:gap-3">
              {visibleContents.map((node, index) => {
                const isFolder = node.type === 'directory' || node.type === 'symlink';
                const isSymlink = node.type === 'symlink';
                const ext = node.name.split('.').pop() || '';
                const gradientColor = isFolder
                  ? FOLDER_COLORS[node.name] || 'from-blue-400 to-indigo-600'
                  : FILE_COLORS[ext] || 'from-gray-500 to-gray-700';

                return (
                  <motion.button
                    key={node.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onClick={() => handleItemClick(node)}
                    className={cn(
                      'group flex flex-col items-center gap-2 p-2 rounded-xl',
                      'w-20 md:w-24',
                      'transition-all duration-200 ease-out',
                      'hover:bg-accent/50',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500/50'
                    )}
                  >
                    {/* Icon */}
                    <div className="relative">
                      {isFolder ? (
                        <div
                          className={cn(
                            'w-12 h-10 md:w-16 md:h-14 rounded-lg bg-linear-to-br',
                            'flex items-center justify-center',
                            'shadow-lg shadow-black/20',
                            'group-hover:scale-110 group-hover:shadow-xl transition-all duration-300',
                            'group-hover:rotate-[-2deg]',
                            gradientColor
                          )}
                        >
                          <Folder className="w-6 h-6 md:w-8 md:h-8 text-white/90 drop-shadow-md" />
                          {isSymlink && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-secondary backdrop-blur-sm rounded-full flex items-center justify-center border border-border shadow-lg">
                              <ExternalLink className="w-2 h-2 md:w-3 md:h-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'w-12 h-16 md:w-16 md:h-20 rounded-lg bg-linear-to-br',
                            'flex flex-col items-center justify-center relative',
                            'shadow-lg shadow-black/20',
                            'group-hover:scale-110 group-hover:shadow-xl transition-all duration-300',
                            'group-hover:rotate-[2deg]',
                            gradientColor
                          )}
                        >
                          {/* Folded corner */}
                          <div className="absolute top-0 right-0 w-3 h-3 md:w-4 md:h-4 bg-white/20 rounded-bl-md" />
                          <FileText className="w-5 h-5 md:w-7 md:h-7 text-white/90 drop-shadow-md" />
                          {/* File extension badge */}
                          <span className="mt-1 px-1 md:px-1.5 py-0.5 bg-black/30 backdrop-blur-sm rounded text-[8px] md:text-[9px] text-white/90 uppercase font-semibold tracking-wide">
                            {ext}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        'text-[10px] md:text-xs font-medium text-center leading-snug max-w-full px-1',
                        'line-clamp-2 break-all',
                        'text-muted-foreground group-hover:text-foreground transition-colors duration-200'
                      )}
                    >
                      {node.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="relative z-10 mx-2 md:mr-4 md:ml-0 mb-2 md:mb-4 px-3 md:px-4 py-1.5 md:py-2 text-xs text-muted-foreground">
          {visibleContents.length} {visibleContents.length === 1 ? 'item' : 'items'}
        </div>
      </div>
      </div>
    </div>
  );
}
