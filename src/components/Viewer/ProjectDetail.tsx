import { useTerminalContext } from '@/context/TerminalContext';
import { getProject } from '@/data';
import { MarkdownRenderer } from '@/components/Markdown/MarkdownRenderer';
import { ArrowLeft, ExternalLink, Star, GitFork } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ProjectDetailProps {
  name: string;
}

export function ProjectDetail({ name }: ProjectDetailProps) {
  const { executeCommand } = useTerminalContext();
  const project = getProject(name);

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-dracula-red">Project not found: {name}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dracula-current/30">
        <button
          onClick={() => executeCommand('ls -l')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded',
            'text-dracula-comment hover:text-dracula-fg',
            'hover:bg-dracula-current/30 transition-colors'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-dracula-fg/70">
            <Star className="w-4 h-4" />
            {project.stars}
          </span>
          <span className="flex items-center gap-1 text-dracula-fg/70">
            <GitFork className="w-4 h-4" />
            {project.forks}
          </span>
          {project.language && (
            <span className="text-xs px-2 py-1 rounded bg-dracula-current text-dracula-orange">
              {project.language}
            </span>
          )}
        </div>

        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded',
            'bg-dracula-purple text-dracula-bg font-medium',
            'hover:bg-dracula-purple/90 transition-colors'
          )}
        >
          <ExternalLink className="w-4 h-4" />
          GitHub
        </a>
      </div>

      {/* README Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <MarkdownRenderer content={project.readme} />
      </div>

      {/* Footer */}
      {project.topics.length > 0 && (
        <div className="p-4 border-t border-dracula-current/30">
          <div className="flex flex-wrap gap-2">
            {project.topics.map((topic) => (
              <span
                key={topic}
                className="text-xs px-2 py-1 rounded-full bg-dracula-purple/20 text-dracula-purple"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
