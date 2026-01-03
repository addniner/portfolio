import { useTerminalContext } from '@/context/TerminalContext';
import {
  getFilesystem,
  resolvePath,
  getParentPath,
  getBasename,
} from '@/data/filesystem';
import { MarkdownRenderer } from '../Markdown/MarkdownRenderer';
import { Profile } from './Profile';
import { ProjectDetail } from './ProjectDetail';
import { ArrowLeft, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FileViewerProps {
  path: string;
}

export function FileViewer({ path }: FileViewerProps) {
  const { executeCommand } = useTerminalContext();
  const fs = getFilesystem();
  const node = resolvePath(path, fs);
  const parentPath = getParentPath(path);
  const filename = getBasename(path);

  if (!node || node.type === 'directory') {
    return (
      <div className="h-full flex items-center justify-center text-dracula-comment">
        File not found: {path}
      </div>
    );
  }

  // Handle special viewer types
  if (node.viewerType === 'profile') {
    return <Profile />;
  }

  if (node.viewerType === 'project-detail' && node.meta?.project) {
    const project = node.meta.project as { name: string };
    return <ProjectDetail name={project.name} />;
  }

  // Get file content
  const content = typeof node.content === 'function' ? node.content() : node.content;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-dracula-current/30 bg-dracula-bg/30">
        <button
          onClick={() => executeCommand(`cd ${parentPath}`)}
          className={cn(
            'flex items-center gap-2 text-dracula-comment hover:text-dracula-cyan transition-colors'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2 text-dracula-fg">
          <FileText className="w-4 h-4 text-dracula-green" />
          <span className="font-medium">{filename}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filename.endsWith('.md') ? (
          <MarkdownRenderer content={content || ''} />
        ) : (
          <pre className="font-mono text-sm text-dracula-fg whitespace-pre-wrap">
            {content || '(empty file)'}
          </pre>
        )}
      </div>
    </div>
  );
}
