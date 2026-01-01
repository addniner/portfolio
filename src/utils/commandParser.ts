import { parse } from 'shell-quote';
import type { ParsedCommand } from '@/types';

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  if (!trimmed) {
    return { command: '', args: [], flags: {}, raw: '' };
  }

  const tokens = parse(trimmed);
  const command = String(tokens[0] || '');
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

  return { command, args, flags, raw: trimmed };
}
