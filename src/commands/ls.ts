import type { CommandDefinition } from '@/types';
import { getProjects } from '@/data';

export const lsCommand: CommandDefinition = {
  name: 'ls',
  description: 'List all projects',
  usage: 'ls [-l]',
  execute: (_args, flags) => {
    const projects = getProjects();
    const detailed = flags['l'] === true;

    let output: string;
    if (detailed) {
      const header = 'NAME                  ★    LANG        UPDATED';
      const divider = '─'.repeat(55);
      const rows = projects.map((p) => {
        const name = p.name.padEnd(20);
        const stars = String(p.stars).padStart(4);
        const lang = (p.language || 'N/A').padEnd(10);
        const updated = new Date(p.updated_at).toLocaleDateString('en-CA');
        return `${name} ${stars}  ${lang}  ${updated}`;
      });
      output = [header, divider, ...rows, '', `${projects.length} projects`].join('\n');
    } else {
      output = projects.map((p) => p.name).join('  ');
    }

    return {
      type: 'success',
      output,
      viewerState: { type: 'projects', detailed },
      urlPath: '/projects',
    };
  },
};
