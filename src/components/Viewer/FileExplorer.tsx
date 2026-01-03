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

  const handleHomeClick = () => {
    executeCommand('cd ~ && ls');
  };

  const handleRootClick = () => {
    executeCommand('cd / && ls');
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
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      {/* macOS-style Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleBackClick}
            disabled={path === '/'}
            className={cn(
              'p-2 rounded-lg transition-all duration-200',
              path === '/'
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/80 hover:shadow-lg'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-lg text-slate-600 cursor-not-allowed"
            disabled
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex-1 flex items-center gap-1.5 px-4 py-2 bg-slate-900/60 rounded-xl overflow-x-auto border border-slate-700/30">
          <button
            onClick={handleRootClick}
            className="text-slate-400 hover:text-white transition-colors flex-shrink-0 p-1 hover:bg-slate-700/50 rounded"
          >
            <HardDrive className="w-5 h-5" />
          </button>
          {pathParts.map((part, index) => (
            <div key={index} className="flex items-center gap-1.5 flex-shrink-0">
              <ChevronRight className="w-4 h-4 text-slate-600" />
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-all duration-200 text-sm whitespace-nowrap',
                  index === pathParts.length - 1
                    ? 'text-white font-semibold bg-slate-700/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                )}
              >
                {part}
              </button>
            </div>
          ))}
        </div>

        {/* Home button */}
        <button
          onClick={handleHomeClick}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 hover:shadow-lg transition-all duration-200"
          title="Home"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>

      {/* Grid View */}
      <div className="flex-1 overflow-y-auto p-8">
        {visibleContents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <Folder className="w-24 h-24 mb-6 opacity-20" />
            <p className="text-lg">This folder is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
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
                    'group flex flex-col items-center gap-4 p-6 rounded-2xl',
                    'bg-slate-800/30 hover:bg-slate-800/60',
                    'border border-transparent hover:border-slate-600/50',
                    'transition-all duration-300 ease-out',
                    'hover:shadow-2xl hover:shadow-slate-900/50',
                    'hover:-translate-y-1',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                  )}
                >
                  {/* Icon */}
                  <div className="relative">
                    {isFolder ? (
                      <div
                        className={cn(
                          'w-24 h-20 rounded-2xl bg-gradient-to-br shadow-xl',
                          'flex items-center justify-center',
                          'group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300',
                          'group-hover:rotate-[-2deg]',
                          gradientColor
                        )}
                      >
                        <Folder className="w-12 h-12 text-white/90 drop-shadow-md" />
                        {isSymlink && (
                          <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-600 shadow-lg">
                            <ExternalLink className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'w-24 h-28 rounded-2xl bg-gradient-to-br shadow-xl',
                          'flex flex-col items-center justify-center relative',
                          'group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300',
                          'group-hover:rotate-[2deg]',
                          gradientColor
                        )}
                      >
                        {/* Folded corner */}
                        <div className="absolute top-0 right-0 w-6 h-6 bg-white/20 rounded-bl-xl" />
                        <FileText className="w-10 h-10 text-white/90 drop-shadow-md" />
                        {/* File extension badge */}
                        <span className="mt-2 px-2 py-0.5 bg-black/20 rounded text-xs text-white/80 uppercase font-medium">
                          {ext}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      'text-sm font-medium text-center leading-snug max-w-full px-2',
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

      {/* Status Bar */}
      <div className="px-6 py-3 bg-slate-800/60 border-t border-slate-700/50 text-sm text-slate-400 font-medium">
        {visibleContents.length} {visibleContents.length === 1 ? 'item' : 'items'}
      </div>
    </div>
  );
}
