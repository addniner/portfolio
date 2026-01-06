import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronRight, Folder, FileText, ExternalLink, FolderKanban, ChevronsUpDown, ChevronsDownUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShell } from '@/hooks/useShell';
import { useAction } from '@/hooks/useAction';
import type { FSNode } from '@/types/filesystem';
import { FOLDER_ICON_COLORS } from '@/config/colors';

interface FileTreeProps {
  currentPath: string;
  onClose?: () => void;
}

interface TreeNodeProps {
  node: FSNode;
  path: string;
  currentPath: string;
  depth: number;
  defaultExpanded?: boolean;
  forceExpand?: boolean | null; // null = no force, true = expand all, false = collapse all
}

function TreeNode({ node, path, currentPath, depth, defaultExpanded = false, forceExpand = null }: TreeNodeProps) {
  const { dispatch } = useAction();
  const isInPath = currentPath === path || currentPath.startsWith(path + '/');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isInPath);
  const [userCollapsed, setUserCollapsed] = useState(false);

  const isDirectory = node.type === 'directory' || node.type === 'symlink';
  const isSymlink = node.type === 'symlink';
  const isActive = currentPath === path;

  // Handle force expand/collapse
  useEffect(() => {
    if (forceExpand === true) {
      setIsExpanded(true);
      setUserCollapsed(false);
    } else if (forceExpand === false) {
      setIsExpanded(false);
      setUserCollapsed(true);
    }
  }, [forceExpand]);

  // Auto-expand if current path is inside this directory (but respect user's collapse choice)
  useEffect(() => {
    if (forceExpand !== null) return; // Skip auto-expand when force is active
    if (isInPath && !isExpanded && !userCollapsed) {
      setIsExpanded(true);
    }
    // Reset userCollapsed when navigating away from this path
    if (!isInPath && userCollapsed) {
      setUserCollapsed(false);
    }
  }, [isInPath, isExpanded, userCollapsed, forceExpand]);

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
              forceExpand={forceExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ currentPath, onClose }: FileTreeProps) {
  const { shell } = useShell();
  const { dispatch } = useAction();
  const fs = shell.getFilesystem().getRoot();

  // Force expand/collapse state: null = normal, true = expand all, false = collapse all
  const [forceExpand, setForceExpand] = useState<boolean | null>(null);

  // Reset force state after it's applied
  const resetForce = useCallback(() => {
    // Use timeout to allow the effect to propagate first
    setTimeout(() => setForceExpand(null), 100);
  }, []);

  const handleExpandAll = () => {
    setForceExpand(true);
    resetForce();
  };

  const handleCollapseAll = () => {
    setForceExpand(false);
    resetForce();
  };

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

  // Quick access items - Projects only
  const quickItems = [
    { label: 'Projects', icon: FolderKanban, path: '/home/guest/projects', color: 'text-success' },
  ];

  const isActivePath = (itemPath: string) => {
    return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mobile Header with Close Button */}
      {onClose && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-medium text-foreground">Sidebar</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Favorites Section */}
      <div className="px-3 py-2 shrink-0">
        <div className="px-3 py-2 text-[11px] font-semibold text-muted-foreground tracking-wider">
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
      <div className="flex-1 flex flex-col min-h-0 px-3 py-2">
        <div className="flex items-center justify-between px-3 py-2 shrink-0">
          <span className="text-[11px] font-semibold text-muted-foreground tracking-wider">
            Files
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleExpandAll}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Expand all folders"
              title="Expand all"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCollapseAll}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Collapse all folders"
              title="Collapse all"
            >
              <ChevronsDownUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {rootChildren.map(([name, node]) => (
            <TreeNode
              key={name}
              node={node}
              path={`/${name}`}
              currentPath={currentPath}
              depth={0}
              defaultExpanded={name === 'home'}
              forceExpand={forceExpand}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
