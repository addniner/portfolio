import type { ViewerState } from './terminal';

export interface ParsedCommand {
  command: string;
  args: string[];
  flags: Record<string, boolean | string>;
  raw: string;
}

export interface CommandResult {
  type: 'success' | 'error' | 'silent';
  output?: string;
  viewerState?: ViewerState;
  urlPath?: string;
}

export interface CommandContext {
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
