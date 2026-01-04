import type { CommandResult } from '@/types';
import type { ICommand, ICommandRegistry, Shell, ShellParsedCommand } from './Shell';

/**
 * CommandAdapter - 기존 CommandDefinition을 ICommand로 변환
 */
interface LegacyCommandDefinition {
  name: string;
  description: string;
  usage: string;
  execute: (
    args: string[],
    flags: Record<string, boolean | string>,
    context: {
      cwd: string;
      currentProject: string | null;
      previousState: string;
      getHistory: () => string[];
    }
  ) => CommandResult;
}

/**
 * 기존 명령어를 새 인터페이스로 래핑
 */
function adaptLegacyCommand(legacy: LegacyCommandDefinition): ICommand {
  return {
    name: legacy.name,
    description: legacy.description,
    usage: legacy.usage,
    execute(args, flags, shell) {
      // 기존 context 형식으로 변환
      const context = {
        cwd: shell.getCwd(),
        currentProject: shell.getCurrentProject(),
        previousState: shell.getViewPath(),
        getHistory: () => shell.getHistory(),
      };
      return legacy.execute(args, flags, context);
    },
  };
}

/**
 * CommandRegistry - 명령어 레지스트리
 */
export class CommandRegistry implements ICommandRegistry {
  private commands: Map<string, ICommand> = new Map();

  /**
   * 명령어 등록
   */
  register(command: ICommand): void {
    this.commands.set(command.name, command);
  }

  /**
   * 기존 CommandDefinition 등록 (호환성)
   */
  registerLegacy(legacy: LegacyCommandDefinition): void {
    this.register(adaptLegacyCommand(legacy));
  }

  /**
   * 별칭 등록
   */
  alias(aliasName: string, targetName: string): void {
    const target = this.commands.get(targetName);
    if (target) {
      this.commands.set(aliasName, target);
    }
  }

  /**
   * 명령어 조회
   */
  get(name: string): ICommand | undefined {
    return this.commands.get(name);
  }

  /**
   * 모든 명령어 이름 조회
   */
  getNames(): string[] {
    return Array.from(this.commands.keys());
  }

  /**
   * 명령어 실행
   */
  execute(parsed: ShellParsedCommand, shell: Shell): CommandResult {
    if (!parsed.command) {
      return { type: 'silent' };
    }

    const command = this.commands.get(parsed.command);
    if (!command) {
      return {
        type: 'error',
        output: `command not found: ${parsed.command}. Type 'help' for available commands.`,
      };
    }

    return command.execute(parsed.args, parsed.flags, shell);
  }
}

/**
 * 기존 commands 레지스트리에서 CommandRegistry 생성
 */
export function createCommandRegistryFromLegacy(
  legacyCommands: Record<string, LegacyCommandDefinition>
): CommandRegistry {
  const registry = new CommandRegistry();

  for (const [name, command] of Object.entries(legacyCommands)) {
    registry.registerLegacy({ ...command, name });
  }

  return registry;
}
