import type { CommandDefinition } from '@/types';

export const helpCommand: CommandDefinition = {
  name: 'help',
  description: 'Show available commands',
  usage: 'help',
  execute: () => {
    const output = `Available commands:

  help            Show this help message
  ls [-l]         List all projects (-l for detailed view)
  cat <name>      Show project README
  cd <name>       Change to project context
  open [name]     Open project in GitHub
  whoami          Display profile information
  clear           Clear terminal history
  history         Show command history

Tips:
  - Use Tab for autocomplete
  - Use Up/Down arrows for command history
  - Click on projects in the viewer to run commands`;

    return {
      type: 'success',
      output,
      viewerState: { type: 'help' },
    };
  },
};
