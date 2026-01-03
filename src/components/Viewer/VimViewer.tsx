import {
  getFilesystem,
  resolvePath,
  getBasename,
} from '@/data/filesystem';
import { MarkdownRenderer } from '../Markdown/MarkdownRenderer';
import { FileText, FileCode, X } from 'lucide-react';
import { useTerminalContext } from '@/context/TerminalContext';

interface VimViewerProps {
  path: string;
}

// Get file icon based on extension
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'md') {
    return <FileText className="w-5 h-5 text-blue-400" />;
  }
  return <FileCode className="w-5 h-5 text-emerald-400" />;
}

export function VimViewer({ path }: VimViewerProps) {
  const { setVimMode, setViewerState, state } = useTerminalContext();
  const fs = getFilesystem();
  const node = resolvePath(path, fs);
  const filename = getBasename(path);

  const handleClose = () => {
    setVimMode(null);
    setViewerState({ type: 'directory', path: state.cwd });
  };

  if (!node || node.type === 'directory') {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        File not found: {path}
      </div>
    );
  }

  // Get file content
  const content = typeof node.content === 'function' ? node.content() : node.content;
  const isMarkdown = filename.endsWith('.md');

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Editor-style header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          {getFileIcon(filename)}
          <div className="flex flex-col">
            <span className="text-white font-medium text-sm">{filename}</span>
            <span className="text-slate-500 text-xs">{path}</span>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-1.5 rounded-md hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          title="Close (or type :q in terminal)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {isMarkdown ? (
          <div className="p-6 max-w-4xl mx-auto">
            <MarkdownRenderer content={content || ''} />
          </div>
        ) : (
          <div className="flex min-h-full">
            {/* Line numbers */}
            <div className="flex-shrink-0 py-4 px-3 bg-slate-900/50 text-slate-600 text-right select-none border-r border-slate-800">
              {content?.split('\n').map((_, i) => (
                <div key={i} className="text-xs leading-6 font-mono">
                  {i + 1}
                </div>
              )) || <div className="text-xs leading-6 font-mono">1</div>}
            </div>
            {/* Code content */}
            <pre className="flex-1 py-4 px-4 text-sm text-slate-300 whitespace-pre-wrap leading-6 font-mono">
              {content || '(empty file)'}
            </pre>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-t border-slate-700/50 text-xs text-slate-500">
        <span>{content?.split('\n').length || 0} lines</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
}
