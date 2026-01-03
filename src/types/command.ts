import type { ViewerState } from './terminal';
import type { VimModeState } from '@/context/TerminalContext';

export interface ParsedCommand {
  command: string;
  args: string[];
  flags: Record<string, boolean | string>;
  raw: string;
}

export interface CommandResult {
  type: 'success' | 'error' | 'silent' | 'vim';
  output?: string;
  viewerState?: ViewerState;
  urlPath?: string;
  newCwd?: string;  // New working directory after command
  vimMode?: VimModeState | null;  // null to exit vim mode
}

export interface CommandContext {
  cwd: string;  // Current working directory
  currentProject: string | null;
  previousState: ViewerState;
  getHistory: () => string[];
}

export interface CommandDefinition {
  name: string;
  description: string;
  usage: string;
  execute: (
    args: string[],
    flags: Record<string, boolean | string>,
    context: CommandContext
  ) => CommandResult;
}
