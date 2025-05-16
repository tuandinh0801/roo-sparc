import { Command } from 'commander';
import { BaseCommand } from '../base/BaseCommand.js';
import { ModeDefinitionWithSource } from '../../core/DefinitionLoader.js';
import { handleError } from '../../utils/errorHandler.js';
import { ModeDefinition, SourceType } from '../../types/domain.js';

/**
 * @class ListModesCommand
 * @description Command to list available modes (system, custom, or all).
 */
export class ListModesCommand extends BaseCommand {
  /**
   * Command configuration.
   */
  static command = 'list:modes';
  static description = 'List available modes (system, custom, or all).';
  static options = {
    source: {
      type: 'string',
      description: 'Specify the source of modes to list (custom, system, all)',
      default: 'custom',
    },
  };

  /**
   * Sets up the command with Commander.
   * @param {Command} program - The Commander program instance.
   */
  setupCommand(program: Command): void {
    program
      .command(ListModesCommand.command)
      .description(ListModesCommand.description)
      .option(
        '--source <source>',
        ListModesCommand.options.source.description,
        ListModesCommand.options.source.default
      )
      .action(this.execute.bind(this));
  }

  /**
   * Executes the list modes command.
   * @param {Record<string, any>} options - Command options.
   */
  async execute(options: { source?: string }): Promise<void> {
    const sourceOption = options.source?.toLowerCase() || 'custom';

    if (!['custom', 'system', 'all'].includes(sourceOption)) {
      handleError(new Error(`Invalid source value: ${sourceOption}. Must be one of 'custom', 'system', or 'all'.`));
      return;
    }

    const currentSourceType = sourceOption as SourceType;

    try {
      let modes: (ModeDefinition | ModeDefinitionWithSource)[] = [];
      let displaySourceType: string = currentSourceType;

      switch (currentSourceType) {
        case 'custom':
          modes = await this.definitionLoader.getCustomModes();
          displaySourceType = 'custom';
          break;
        case 'system':
          modes = await this.definitionLoader.getSystemModes();
          displaySourceType = 'system';
          break;
        case 'all':
          modes = await this.definitionLoader.getMergedModes();
          // For 'all', the sourceType is on each mode object
          break;
        default:
          // Should be caught by the validation above, but as a safeguard:
          handleError(new Error(`Unhandled source type: ${currentSourceType}`));
          return;
      }

      if (modes.length === 0) {
        this.ui.showMessage('info', `No ${displaySourceType} modes found.`);
        return;
      }

      const headers = ['Slug', 'Name', 'Description', 'Source'];
      const tableData = modes.map(mode => {
        const sourceDisplay = (mode as ModeDefinitionWithSource).sourceType
          ? (mode as ModeDefinitionWithSource).sourceType // from getMergedModes
          : displaySourceType; // for getSystemModes or getCustomModes
        return [
          mode.slug,
          mode.name,
          mode.description || '-', // Use '-' if description is undefined
          sourceDisplay,
        ];
      });

      this.ui.displayTable(headers, tableData);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('An unknown error occurred while listing modes.'));
    }
  }
}
