import { parse, type ParseEntry } from 'shell-quote';
import type { ParsedCommand } from '@/types';

function parseSingleCommand(tokens: ParseEntry[], raw: string): ParsedCommand {
  const command = typeof tokens[0] === 'string' ? tokens[0] : '';
  const args: string[] = [];
  const flags: Record<string, boolean | string> = {};

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (typeof token !== 'string') continue;

    if (token.startsWith('--')) {
      const [key, value] = token.slice(2).split('=');
      flags[key] = value ?? true;
    } else if (token.startsWith('-') && token.length > 1) {
      // Handle -l, -la, etc.
      const chars = token.slice(1).split('');
      chars.forEach((char) => {
        flags[char] = true;
      });
    } else {
      args.push(token);
    }
  }

  return { command, args, flags, raw };
}

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  if (!trimmed) {
    return { command: '', args: [], flags: {}, raw: '' };
  }

  const tokens = parse(trimmed);
  return parseSingleCommand(tokens, trimmed);
}

// Parse commands separated by && or ;
export function parseCommands(input: string): ParsedCommand[] {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  const tokens = parse(trimmed);
  const commands: ParsedCommand[] = [];
  let currentTokens: ParseEntry[] = [];
  let currentRaw: string[] = [];

  for (const token of tokens) {
    // Check for && or ; operator
    if (typeof token === 'object' && token !== null && 'op' in token) {
      if (token.op === '&&' || token.op === ';') {
        if (currentTokens.length > 0) {
          commands.push(parseSingleCommand(currentTokens, currentRaw.join(' ')));
          currentTokens = [];
          currentRaw = [];
        }
        continue;
      }
    }

    currentTokens.push(token);
    if (typeof token === 'string') {
      currentRaw.push(token);
    }
  }

  // Add the last command
  if (currentTokens.length > 0) {
    commands.push(parseSingleCommand(currentTokens, currentRaw.join(' ')));
  }

  return commands;
}
