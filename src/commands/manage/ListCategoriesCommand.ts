import { Command } from 'commander';
import { BaseCommand } from '../base/BaseCommand.js';
import { definitionLoader, CategoryDefinitionWithSource } from '../../core/DefinitionLoader.js';
import { uiManager } from '../../utils/uiManager.js';
import { handleError } from '../../utils/errorHandler.js';
import { CategoryDefinition, SourceType } from '../../types/domain.js';

/**
 * @class ListCategoriesCommand
 * @description Command to list available categories (system, custom, or all).
 */
export class ListCategoriesCommand extends BaseCommand {
  /**
   * Command configuration.
   */
  static command = 'list:categories';
  static description = 'List available categories (system, custom, or all).';
  static options = {
    source: {
      type: 'string',
      description: 'Specify the source of categories to list (custom, system, all)',
      default: 'custom',
    },
  };

  /**
   * Sets up the command with Commander.
   * @param {Command} program - The Commander program instance.
   */
  setupCommand(program: Command): void {
    program
      .command(ListCategoriesCommand.command)
      .description(ListCategoriesCommand.description)
      .option(
        '--source <source>',
        ListCategoriesCommand.options.source.description,
        ListCategoriesCommand.options.source.default
      )
      .action(this.execute.bind(this));
  }

  /**
   * Executes the list categories command.
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
      let categories: (CategoryDefinition | CategoryDefinitionWithSource)[] = [];
      let displaySourceType: string = currentSourceType;

      switch (currentSourceType) {
        case 'custom':
          categories = await this.definitionLoader.getCustomCategories();
          displaySourceType = 'custom';
          break;
        case 'system':
          categories = await this.definitionLoader.getSystemCategories();
          displaySourceType = 'system';
          break;
        case 'all':
          categories = await this.definitionLoader.getMergedCategories();
          // For 'all', the sourceType is on each category object
          break;
        default:
          handleError(new Error(`Unhandled source type: ${currentSourceType}`));
          return;
      }

      if (categories.length === 0) {
        this.ui.showMessage('info', `No ${displaySourceType} categories found.`);
        return;
      }

      const headers = ['Slug', 'Name', 'Description', 'Source'];
      const tableData = categories.map(category => {
        const sourceDisplay = (category as CategoryDefinitionWithSource).sourceType
          ? (category as CategoryDefinitionWithSource).sourceType
          : displaySourceType;
        return [
          category.slug,
          category.name,
          category.description || '-',
          sourceDisplay,
        ];
      });

      this.ui.displayTable(headers, tableData);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('An unknown error occurred while listing categories.'));
    }
  }
}
