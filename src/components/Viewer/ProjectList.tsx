import { useTerminalContext } from '@/context/TerminalContext';
import { getProjects } from '@/data';
import { Star, GitFork } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ProjectListProps {
  detailed: boolean;
}

export function ProjectList({ detailed }: ProjectListProps) {
  const { executeCommand } = useTerminalContext();
  const projects = getProjects();

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-2xl font-bold text-dracula-fg mb-6">Projects</h2>

      <div className={cn(
        'grid gap-4',
        detailed ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
      )}>
        {projects.map((project) => (
          <button
            key={project.name}
            onClick={() => executeCommand(`cat ${project.name}`)}
            className={cn(
              'text-left p-4 rounded-lg',
              'bg-dracula-current/30 hover:bg-dracula-current/50',
              'border border-dracula-current/50 hover:border-dracula-purple/50',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-dracula-purple'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-dracula-cyan">
                {project.name}
              </h3>
              {project.language && (
                <span className="text-xs px-2 py-1 rounded bg-dracula-current text-dracula-orange">
                  {project.language}
                </span>
              )}
            </div>

            {project.description && (
              <p className="text-dracula-comment text-sm mb-3 line-clamp-2">
                {project.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-dracula-fg/70">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                {project.stars}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-4 h-4" />
                {project.forks}
              </span>
            </div>

            {detailed && project.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {project.topics.map((topic) => (
                  <span
                    key={topic}
                    className="text-xs px-2 py-0.5 rounded-full bg-dracula-purple/20 text-dracula-purple"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
