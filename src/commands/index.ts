import type { CommandDefinition, ParsedCommand, CommandContext, CommandResult } from '@/types';
import { helpCommand } from './help';
import { lsCommand } from './ls';
import { catCommand } from './cat';
import { cdCommand } from './cd';
import { openCommand } from './open';
import { whoamiCommand } from './whoami';
import { clearCommand } from './clear';
import { historyCommand } from './history';
import { vimCommand } from './vim';
import { quitCommand } from './quit';

export const commands: Record<string, CommandDefinition> = {
  help: helpCommand,
  ls: lsCommand,
  cat: catCommand,
  cd: cdCommand,
  open: openCommand,
  whoami: whoamiCommand,
  clear: clearCommand,
  history: historyCommand,
  vim: vimCommand,
  vi: vimCommand, // alias
  ':q': quitCommand,
  ':q!': quitCommand, // alias
  ':wq': quitCommand, // alias (we don't save, just close)
};

export function getCommandNames(): string[] {
  return Object.keys(commands);
}

export function executeCommand(
  parsed: ParsedCommand,
  context: CommandContext
): CommandResult {
  if (!parsed.command) {
    return { type: 'silent' };
  }

  const cmd = commands[parsed.command];
  if (!cmd) {
    return {
      type: 'error',
      output: `command not found: ${parsed.command}. Type 'help' for available commands.`,
    };
  }

  return cmd.execute(parsed.args, parsed.flags, context);
}
