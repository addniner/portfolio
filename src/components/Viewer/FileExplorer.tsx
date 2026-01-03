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
  Home,
  HardDrive,
  ExternalLink,
  User,
  FolderKanban,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { motion } from 'motion/react';

interface FileExplorerProps {
  path: string;
}

// Color mapping for folder icons
const folderColors: Record<string, string> = {
  home: 'from-amber-400 to-orange-500',
  guest: 'from-blue-400 to-blue-600',
  hyeonmin: 'from-purple-400 to-purple-600',
  projects: 'from-green-400 to-emerald-600',
  usr: 'from-gray-400 to-gray-600',
  bin: 'from-cyan-400 to-cyan-600',
  etc: 'from-slate-400 to-slate-600',
};

// File extension colors
const fileColors: Record<string, string> = {
  md: 'from-blue-500 to-blue-700',
  ts: 'from-blue-400 to-blue-600',
  tsx: 'from-cyan-400 to-blue-600',
  js: 'from-yellow-400 to-yellow-600',
  json: 'from-yellow-500 to-orange-500',
  html: 'from-orange-400 to-red-500',
  css: 'from-pink-400 to-purple-500',
};

export function FileExplorer({ path }: FileExplorerProps) {
  const { executeCommand } = useTerminalContext();
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
      executeCommand(`cd ${node.name} && ls`);
    } else {
      executeCommand(`vim ${node.name}`);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const targetPath = '/' + pathParts.slice(0, index + 1).join('/');
    executeCommand(`cd ${targetPath} && ls`);
  };

  const handleBackClick = () => {
    executeCommand('cd .. && ls');
  };

  const handleRootClick = () => {
    executeCommand('cd / && ls');
  };

  const handleSidebarClick = (targetPath: string) => {
    executeCommand(`cd ${targetPath} && ls`);
  };

  // Sidebar items
  const sidebarItems = [
    { label: 'Home', icon: Home, path: '~', color: 'text-blue-400' },
    { label: 'hyeonmin', icon: User, path: '/home/hyeonmin', color: 'text-purple-400' },
    { label: 'Projects', icon: FolderKanban, path: '/home/hyeonmin/projects', color: 'text-green-400' },
  ];

  // Check if current path matches sidebar item
  const isActivePath = (itemPath: string) => {
    const normalizedPath = path.replace('/home/guest', '~');
    const normalizedItemPath = itemPath.replace('/home/guest', '~');
    return normalizedPath === normalizedItemPath || path === itemPath;
  };

  // Filter and sort contents
  const visibleContents = contents
    .filter((item) => !item.name.startsWith('.'))
    .sort((a, b) => {
      const aIsDir = a.type === 'directory' || a.type === 'symlink';
      const bIsDir = b.type === 'directory' || b.type === 'symlink';
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <div className="relative z-10 w-44 shrink-0 flex flex-col py-4 pl-4">
        <div className="flex-1 flex flex-col gap-1 pr-2">
          {/* Favorites Section */}
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Favorites
          </div>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleSidebarClick(item.path)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                  'transition-all duration-200',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? item.color : '')} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {/* Locations Section */}
          <div className="px-3 py-2 mt-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Locations
          </div>
          <button
            onClick={handleRootClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
              'transition-all duration-200',
              path === '/'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            <HardDrive className={cn('w-4 h-4', path === '/' ? 'text-slate-300' : '')} />
            <span className="truncate">Root</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Glassmorphism Toolbar */}
        <div className="relative z-10 flex items-center gap-3 px-4 py-3 mr-4 mt-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleBackClick}
              disabled={path === '/'}
              className={cn(
                'p-1.5 rounded-lg transition-all duration-200',
                path === '/'
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded-lg text-slate-600 cursor-not-allowed"
              disabled
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Breadcrumb - Glass style */}
          <div className="flex-1 flex items-center gap-1 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-lg overflow-x-auto border border-white/5">
            <button
              onClick={handleRootClick}
              className="text-slate-400 hover:text-white transition-colors flex-shrink-0 p-0.5 hover:bg-white/10 rounded"
            >
              <HardDrive className="w-4 h-4" />
            </button>
            {pathParts.map((part, index) => (
              <div key={index} className="flex items-center gap-1 flex-shrink-0">
                <ChevronRight className="w-3 h-3 text-slate-500" />
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={cn(
                    'px-2 py-0.5 rounded transition-all duration-200 text-xs whitespace-nowrap',
                    index === pathParts.length - 1
                      ? 'text-white font-semibold bg-white/15'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  )}
                >
                  {part}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Grid View */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 pr-4">
          {visibleContents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Folder className="w-20 h-20 mb-4 opacity-20" />
              <p className="text-base">This folder is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleContents.map((node, index) => {
                const isFolder = node.type === 'directory' || node.type === 'symlink';
                const isSymlink = node.type === 'symlink';
                const ext = node.name.split('.').pop() || '';
                const gradientColor = isFolder
                  ? folderColors[node.name] || 'from-blue-400 to-indigo-600'
                  : fileColors[ext] || 'from-slate-500 to-slate-700';

                return (
                  <motion.button
                    key={node.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onClick={() => handleItemClick(node)}
                    className={cn(
                      'group flex flex-col items-center gap-3 p-4 rounded-xl',
                      // Glassmorphism card
                      'bg-white/5 backdrop-blur-md',
                      'border border-white/10',
                      'hover:bg-white/10 hover:border-white/20',
                      'transition-all duration-300 ease-out',
                      'hover:shadow-xl hover:shadow-black/20',
                      'hover:-translate-y-1',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500/50'
                    )}
                  >
                    {/* Icon */}
                    <div className="relative">
                      {isFolder ? (
                        <div
                          className={cn(
                            'w-16 h-14 rounded-lg bg-gradient-to-br',
                            'flex items-center justify-center',
                            'shadow-lg shadow-black/20',
                            'group-hover:scale-110 group-hover:shadow-xl transition-all duration-300',
                            'group-hover:rotate-[-2deg]',
                            gradientColor
                          )}
                        >
                          <Folder className="w-8 h-8 text-white/90 drop-shadow-md" />
                          {isSymlink && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-800/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-lg">
                              <ExternalLink className="w-3 h-3 text-slate-300" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'w-16 h-20 rounded-lg bg-gradient-to-br',
                            'flex flex-col items-center justify-center relative',
                            'shadow-lg shadow-black/20',
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
                        'text-slate-300 group-hover:text-white transition-colors duration-200'
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

        {/* Glassmorphism Status Bar */}
        <div className="relative z-10 mr-4 mb-4 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 text-xs text-slate-400 font-medium">
          {visibleContents.length} {visibleContents.length === 1 ? 'item' : 'items'}
        </div>
      </div>
    </div>
  );
}
