import { useState, useMemo, useEffect } from 'react';
import { ChevronRight, Folder, FileText, ExternalLink, Home, User, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShell } from '@/hooks/useShell';
import { useAction } from '@/hooks/useAction';
import type { FSNode } from '@/types/filesystem';
import { FOLDER_ICON_COLORS } from '@/config/colors';

interface FileTreeProps {
  currentPath: string;
}

interface TreeNodeProps {
  node: FSNode;
  path: string;
  currentPath: string;
  depth: number;
  defaultExpanded?: boolean;
}

function TreeNode({ node, path, currentPath, depth, defaultExpanded = false }: TreeNodeProps) {
  const { dispatch } = useAction();
  const isInPath = currentPath === path || currentPath.startsWith(path + '/');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isInPath);
  const [userCollapsed, setUserCollapsed] = useState(false);

  const isDirectory = node.type === 'directory' || node.type === 'symlink';
  const isSymlink = node.type === 'symlink';
  const isActive = currentPath === path;

  // Auto-expand if current path is inside this directory (but respect user's collapse choice)
  useEffect(() => {
    if (isInPath && !isExpanded && !userCollapsed) {
      setIsExpanded(true);
    }
    // Reset userCollapsed when navigating away from this path
    if (!isInPath && userCollapsed) {
      setUserCollapsed(false);
    }
  }, [isInPath, isExpanded, userCollapsed]);

  const handleClick = () => {
    if (isDirectory) {
      dispatch({ type: 'NAVIGATE', path });
    } else {
      dispatch({ type: 'OPEN_FILE', path });
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    // Track if user explicitly collapsed this folder
    if (!newExpanded) {
      setUserCollapsed(true);
    } else {
      setUserCollapsed(false);
    }
  };

  // Get visible children (exclude hidden files)
  const children = useMemo(() => {
    if (!node.children) return [];
    return Object.entries(node.children)
      .filter(([name]) => !name.startsWith('.'))
      .sort(([, a], [, b]) => {
        const aIsDir = a.type === 'directory' || a.type === 'symlink';
        const bIsDir = b.type === 'directory' || b.type === 'symlink';
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [node.children]);

  const iconColor = FOLDER_ICON_COLORS[node.name] || '';

  return (
    <div>
      <div
        className={cn(
          'w-full flex items-center gap-2 py-1.5 px-3 rounded-lg text-sm',
          'transition-all duration-200',
          isActive
            ? 'bg-accent text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        {/* Expand/Collapse toggle - separate button */}
        {isDirectory && children.length > 0 ? (
          <button
            onClick={handleToggle}
            className="p-0.5 -ml-1 hover:bg-secondary rounded shrink-0"
            aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
          >
            <ChevronRight
              className={cn(
                'w-3 h-3 transition-transform duration-200',
                isExpanded && 'rotate-90'
              )}
            />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Clickable area for navigation */}
        <button
          onClick={handleClick}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          {/* Icon */}
          {isDirectory ? (
            <Folder className={cn('w-4 h-4 shrink-0', isActive || isInPath ? iconColor : '')} />
          ) : (
            <FileText className={cn(
              'w-4 h-4 shrink-0',
              isActive ? 'text-success' : ''
            )} />
          )}

          {/* Name */}
          <span className="truncate">{node.name}</span>

          {/* Symlink indicator */}
          {isSymlink && (
            <ExternalLink className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          )}
        </button>
      </div>

      {/* Children */}
      {isDirectory && isExpanded && children.length > 0 && (
        <div className="relative">
          {/* Indent guide line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-border/50"
            style={{ left: `${depth * 16 + 20}px` }}
          />
          {children.map(([name, childNode]) => (
            <TreeNode
              key={name}
              node={childNode}
              path={`${path}/${name}`}
              currentPath={currentPath}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ currentPath }: FileTreeProps) {
  const { shell } = useShell();
  const { dispatch } = useAction();
  const fs = shell.getFilesystem().getRoot();

  // Start from root, but expand home/guest by default
  const rootChildren = useMemo(() => {
    if (!fs.children) return [];
    return Object.entries(fs.children)
      .filter(([name]) => !name.startsWith('.'))
      .sort(([, a], [, b]) => {
        const aIsDir = a.type === 'directory' || a.type === 'symlink';
        const bIsDir = b.type === 'directory' || b.type === 'symlink';
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [fs.children]);

  const handleQuickNav = (path: string) => {
    dispatch({ type: 'NAVIGATE', path });
  };

  // Quick access items
  const quickItems = [
    { label: 'Home', icon: Home, path: '~', color: 'text-info' },
    { label: 'hyeonmin', icon: User, path: '/home/hyeonmin', color: 'text-primary' },
    { label: 'Projects', icon: FolderKanban, path: '/home/hyeonmin/projects', color: 'text-success' },
  ];

  const isActivePath = (itemPath: string) => {
    const normalizedPath = currentPath.replace('/home/guest', '~');
    return normalizedPath === itemPath || currentPath === itemPath;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Favorites Section */}
      <div className="px-3 py-2">
        <div className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Favorites
        </div>
        {quickItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleQuickNav(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                'transition-all duration-200',
                isActive
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? item.color : '')} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* File Tree Section */}
      <div className="px-3 py-2 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Files
        </div>
        {rootChildren.map(([name, node]) => (
          <TreeNode
            key={name}
            node={node}
            path={`/${name}`}
            currentPath={currentPath}
            depth={0}
            defaultExpanded={name === 'home'}
          />
        ))}
      </div>
    </div>
  );
}
