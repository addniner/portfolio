import { useEffect, useMemo, useState } from 'react';
import { useShell } from '@/hooks/useShell';
import { useTerminalContext } from '@/context/TerminalContext';
import { useAction } from '@/hooks/useAction';
import type { FSNode } from '@/types/filesystem';
import {
  Folder,
  FileText,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  ExternalLink,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { useIsMobileWithInit } from '@/hooks/useMediaQuery';
import { FOLDER_COLORS, FILE_COLORS } from '@/config/colors';
import { FileTree } from './FileTree';

interface FileExplorerProps {
  path: string;
}

export function FileExplorer({ path }: FileExplorerProps) {
  const { shell } = useShell();
  const { toggleViewer } = useTerminalContext();
  const { dispatch } = useAction();
  const { isMobile, initialized } = useIsMobileWithInit();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean | null>(null);

  // 초기화 완료 후 사이드바 상태 설정 (한 번만)
  useEffect(() => {
    if (initialized && isSidebarOpen === null) {
      setIsSidebarOpen(!isMobile);
    }
  }, [initialized, isMobile, isSidebarOpen]);

  // 실제 사이드바 표시 여부 (초기화 전에는 false)
  const showSidebar = isSidebarOpen === true;
  const currentNode = shell.resolvePath(path);
  const contents = shell.listDirectory(path);

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
      dispatch({ type: 'NAVIGATE', path: node.name });
    } else {
      dispatch({ type: 'OPEN_FILE', path: node.name });
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const targetPath = '/' + pathParts.slice(0, index + 1).join('/');
    dispatch({ type: 'NAVIGATE', path: targetPath });
  };

  const handleBackClick = () => {
    dispatch({ type: 'NAVIGATE_BACK' });
  };

  const handleRootClick = () => {
    dispatch({ type: 'NAVIGATE_ROOT' });
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
      {/* macOS-style Window Header - 모바일에서는 숨김 */}
      {!isMobile && (
        <div className={cn(
          'flex items-center gap-3 px-4 py-3 shrink-0',
          'bg-muted/50 border-b border-border/50'
        )}>
          {/* Traffic lights */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleViewer}
              className="w-3 h-3 rounded-full bg-traffic-close hover:brightness-110 transition-all"
              aria-label="Close Finder"
              title="Close"
            />
            <div className="w-3 h-3 rounded-full bg-traffic-minimize" />
            <div className="w-3 h-3 rounded-full bg-traffic-maximize" />
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
      )}

      {/* Content area */}
      <div className={cn(
        'flex-1 flex relative overflow-hidden',
        'bg-linear-to-br from-muted/30 via-transparent to-transparent'
      )}>
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-decoration-primary rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-decoration-secondary rounded-full blur-3xl" />
        </div>

        {/* Sidebar - File Tree with toggle */}
        <AnimatePresence initial={false}>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isMobile ? '100%' : 224, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className={cn(
                'relative z-20 shrink-0 overflow-hidden h-full',
                isMobile && 'absolute inset-0 bg-background/95 backdrop-blur-sm'
              )}
            >
              <div className={cn('h-full', isMobile ? 'w-full' : 'w-56')}>
                <FileTree
                  currentPath={path}
                  onClose={isMobile ? () => setIsSidebarOpen(false) : undefined}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className={cn(
          'relative z-10 flex items-center gap-2',
          'px-3 py-2',
          isMobile ? 'mt-1' : 'gap-3 px-4 py-3 mr-4 ml-0 mt-4 lg:gap-4 lg:px-6'
        )}>
          {/* Sidebar toggle button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
            className={cn(
              'p-2 rounded-lg transition-all duration-200',
              'text-muted-foreground hover:text-foreground hover:bg-accent',
              'active:bg-accent/70',
              showSidebar && !isMobile && 'text-foreground bg-accent'
            )}
          >
            {showSidebar ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeft className="w-5 h-5" />
            )}
          </button>

          {/* Divider - 데스크톱만 */}
          {!isMobile && <div className="w-px h-5 bg-border" />}

          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleBackClick}
              disabled={path === '/'}
              aria-label="Go back to parent directory"
              className={cn(
                'p-2 rounded-lg transition-all duration-200',
                'active:bg-accent/70',
                path === '/'
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {/* Forward button - 데스크톱만 */}
            {!isMobile && (
              <button
                className="p-2 rounded-lg text-muted-foreground/50 cursor-not-allowed"
                disabled
                aria-label="Go forward (disabled)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Breadcrumb */}
          <div className="flex-1 flex items-center gap-1 min-w-0">
            {isMobile ? (
              /* 모바일: 현재 폴더명만 표시 */
              <div className="flex items-center gap-1 min-w-0">
                <button
                  onClick={handleRootClick}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1 hover:bg-accent rounded active:bg-accent/70"
                >
                  <HardDrive className="w-5 h-5" />
                </button>
                {pathParts.length > 0 && (
                  <>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate">
                      {pathParts[pathParts.length - 1]}
                    </span>
                  </>
                )}
              </div>
            ) : (
              /* 데스크톱: 전체 경로 표시 */
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                <button
                  onClick={handleRootClick}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1 hover:bg-accent rounded active:bg-accent/70"
                >
                  <HardDrive className="w-4 h-4" />
                </button>
                {pathParts.map((part, index) => (
                  <div key={index} className="flex items-center gap-1 shrink-0">
                    <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
                    <button
                      onClick={() => handleBreadcrumbClick(index)}
                      className={cn(
                        'px-2 py-1 rounded transition-all duration-200 whitespace-nowrap text-xs',
                        'active:bg-accent/70',
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
            )}
          </div>

        </div>

        {/* Grid View (Desktop) / List View (Mobile) */}
        <div className="relative z-10 flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-6">
          {visibleContents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Folder className="w-20 h-20 mb-4 opacity-20" />
              <p className="text-base">This folder is empty</p>
            </div>
          ) : isMobile ? (
            /* Mobile: List View */
            <div className="flex flex-col gap-1">
              {visibleContents.map((node) => {
                const isFolder = node.type === 'directory' || node.type === 'symlink';
                const isSymlink = node.type === 'symlink';
                const ext = node.name.split('.').pop() || '';
                const gradientColor = isFolder
                  ? FOLDER_COLORS[node.name] || 'from-blue-400 to-indigo-600'
                  : FILE_COLORS[ext] || 'from-gray-500 to-gray-700';

                return (
                  <button
                    key={node.name}
                    onClick={() => handleItemClick(node)}
                    className={cn(
                      'group flex items-center gap-3 p-3 rounded-xl',
                      'w-full text-left',
                      'transition-all duration-200 ease-out',
                      'hover:bg-accent/50 active:bg-accent/70',
                      'focus:outline-none focus:ring-2 focus:ring-focus-ring'
                    )}
                  >
                    {/* Icon */}
                    <div className="relative shrink-0">
                      {isFolder ? (
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg bg-linear-to-br',
                            'flex items-center justify-center',
                            'shadow-md shadow-shadow',
                            gradientColor
                          )}
                        >
                          <Folder className="w-5 h-5 text-white/90" />
                          {isSymlink && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center border border-border">
                              <ExternalLink className="w-2 h-2 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg bg-linear-to-br',
                            'flex items-center justify-center relative',
                            'shadow-md shadow-shadow',
                            gradientColor
                          )}
                        >
                          <FileText className="w-5 h-5 text-white/90" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">
                        {node.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {isFolder ? 'Folder' : ext.toUpperCase()}
                      </span>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : (
            /* Desktop: Grid View */
            <div className="flex flex-wrap content-start gap-3">
              {visibleContents.map((node) => {
                const isFolder = node.type === 'directory' || node.type === 'symlink';
                const isSymlink = node.type === 'symlink';
                const ext = node.name.split('.').pop() || '';
                const gradientColor = isFolder
                  ? FOLDER_COLORS[node.name] || 'from-blue-400 to-indigo-600'
                  : FILE_COLORS[ext] || 'from-gray-500 to-gray-700';

                return (
                  <button
                    key={node.name}
                    onClick={() => handleItemClick(node)}
                    className={cn(
                      'group flex flex-col items-center gap-2 p-2 rounded-xl',
                      'w-24',
                      'transition-all duration-200 ease-out',
                      'hover:bg-accent/50',
                      'focus:outline-none focus:ring-2 focus:ring-focus-ring'
                    )}
                  >
                    {/* Icon */}
                    <div className="relative">
                      {isFolder ? (
                        <div
                          className={cn(
                            'w-16 h-14 rounded-lg bg-linear-to-br',
                            'flex items-center justify-center',
                            'shadow-lg shadow-shadow-strong',
                            'group-hover:scale-110 group-hover:shadow-xl transition-all duration-300',
                            'group-hover:rotate-[-2deg]',
                            gradientColor
                          )}
                        >
                          <Folder className="w-8 h-8 text-white/90 drop-shadow-md" />
                          {isSymlink && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary backdrop-blur-sm rounded-full flex items-center justify-center border border-border shadow-lg">
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'w-16 h-20 rounded-lg bg-linear-to-br',
                            'flex flex-col items-center justify-center relative',
                            'shadow-lg shadow-shadow-strong',
                            'group-hover:scale-110 group-hover:shadow-xl transition-all duration-300',
                            'group-hover:rotate-[2deg]',
                            gradientColor
                          )}
                        >
                          {/* Folded corner */}
                          <div className="absolute top-0 right-0 w-4 h-4 bg-white/20 rounded-bl-md" />
                          <FileText className="w-7 h-7 text-white/90 drop-shadow-md" />
                          {/* File extension badge */}
                          <span className="mt-1 px-1.5 py-0.5 bg-black/30 backdrop-blur-sm rounded text-[9px] text-white/90 uppercase font-semibold tracking-wide">
                            {ext}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        'text-xs font-medium text-center leading-snug max-w-full px-1',
                        'line-clamp-2 break-all',
                        'text-muted-foreground group-hover:text-foreground transition-colors duration-200'
                      )}
                    >
                      {node.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="relative z-10 mx-2 sm:mr-4 sm:ml-0 mb-16 sm:mb-4 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 text-xs text-muted-foreground">
          {visibleContents.length} {visibleContents.length === 1 ? 'item' : 'items'}
        </div>
      </div>
      </div>
    </div>
  );
}
