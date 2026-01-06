import type { CommandDefinition } from '@/types';

// help 명령어에서 숨길 alias 목록
const HIDDEN_COMMANDS = ['vi', ':q', ':q!', ':wq'];

// 명령어 레지스트리 참조 (index.ts에서 설정)
let commandsRegistry: Record<string, CommandDefinition> | null = null;

export function setCommandsRegistry(commands: Record<string, CommandDefinition>) {
  commandsRegistry = commands;
}

export const helpCommand: CommandDefinition = {
  name: 'help',
  description: 'Show available commands',
  usage: 'help',
  execute: () => {
    if (!commandsRegistry) {
      return {
        type: 'error',
        output: 'Commands not initialized',
      };
    }

    // 고유 명령어만 추출 (alias 제외, hidden 제외)
    const uniqueCommands = new Map<string, CommandDefinition>();
    for (const [name, cmd] of Object.entries(commandsRegistry)) {
      if (HIDDEN_COMMANDS.includes(name)) continue;
      // 같은 execute 함수를 가진 명령어는 첫 번째만 표시
      const existing = [...uniqueCommands.values()].find(c => c.execute === cmd.execute);
      if (!existing) {
        uniqueCommands.set(name, cmd);
      }
    }

    // 명령어 목록 생성 (usage 기준 정렬 및 패딩)
    const entries = [...uniqueCommands.entries()].sort(([a], [b]) => a.localeCompare(b));
    const maxUsageLen = Math.max(...entries.map(([, cmd]) => cmd.usage.length));

    const commandLines = entries
      .map(([, cmd]) => {
        const padding = ' '.repeat(maxUsageLen - cmd.usage.length + 4);
        return `  ${cmd.usage}${padding}${cmd.description}`;
      })
      .join('\n');

    const output = `Available commands:

${commandLines}

Tips:
  - Use Tab for autocomplete
  - Use Up/Down arrows for command history
  - Click on projects in the viewer to run commands`;

    return {
      type: 'success',
      output,
    };
  },
};
