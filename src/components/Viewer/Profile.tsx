import { profile } from '@/data';
import { Mail, Github, Linkedin, MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Profile() {
  return (
    <div className="h-full overflow-y-auto p-6">
      {/* ASCII Art Name */}
      <pre className="text-dracula-green text-xs md:text-sm font-mono mb-8 overflow-x-auto">
        {profile.ascii}
      </pre>

      {/* Title & Bio */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dracula-fg mb-2">
          {profile.name}
        </h1>
        <p className="text-xl text-dracula-purple mb-4">
          {profile.title}
        </p>
        <p className="text-dracula-comment">
          {profile.bio}
        </p>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 text-dracula-fg/70 mb-8">
        <MapPin className="w-4 h-4" />
        {profile.location}
      </div>

      {/* Skills */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-dracula-cyan mb-4">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <span
              key={skill}
              className={cn(
                'px-3 py-1.5 rounded-lg',
                'bg-dracula-current text-dracula-fg',
                'text-sm font-medium'
              )}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Contact Links */}
      <div>
        <h2 className="text-lg font-semibold text-dracula-cyan mb-4">Contact</h2>
        <div className="flex flex-col gap-3">
          <a
            href={`mailto:${profile.email}`}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg',
              'bg-dracula-current/30 hover:bg-dracula-current/50',
              'text-dracula-fg transition-colors'
            )}
          >
            <Mail className="w-5 h-5 text-dracula-pink" />
            {profile.email}
          </a>

          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg',
              'bg-dracula-current/30 hover:bg-dracula-current/50',
              'text-dracula-fg transition-colors'
            )}
          >
            <Github className="w-5 h-5 text-dracula-purple" />
            GitHub
          </a>

          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg',
              'bg-dracula-current/30 hover:bg-dracula-current/50',
              'text-dracula-fg transition-colors'
            )}
          >
            <Linkedin className="w-5 h-5 text-dracula-cyan" />
            LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}
