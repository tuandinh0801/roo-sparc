import { Command } from 'commander';
import { BaseCommand, CommandOptions } from './BaseCommand.js'; // Import CommandOptions
import { handleError } from '../../utils/errorHandler.js';
import { SourceType, DefinitionSource } from '../../types/domain.js';
import { DefinitionLoader } from '../../core/DefinitionLoader.js';

export interface DefinitionItem {
  slug: string;
  name: string;
  description?: string;
  sourceType: DefinitionSource;
}

export abstract class AbstractListDefinitionsCommand<
  T extends DefinitionItem
> extends BaseCommand {
  protected abstract commandName: string;
  protected abstract commandDescription: string;
  protected abstract entityName: string; // e.g., "mode", "category"
  protected abstract entityNamePlural: string; // e.g., "modes", "categories"

  constructor(options: CommandOptions) {
    super(options);
  }

  static getOptions() {
    return {
      source: {
        type: 'string',
        description: 'Specify the source to list (custom, system, all)',
        default: 'custom',
      },
    };
  }

  setupCommand(program: Command): void {
    const options = AbstractListDefinitionsCommand.getOptions();
    program
      .command(this.commandName)
      .description(this.commandDescription)
      .option(
        '--source <source>',
        options.source.description.replace('to list', `of ${this.entityNamePlural} to list`),
        options.source.default
      )
      .action(this.execute.bind(this));
  }

  protected abstract getCustomDefinitions(): Promise<T[]>;
  protected abstract getSystemDefinitions(): Promise<T[]>;
  protected abstract getMergedDefinitions(): Promise<T[]>;

  async execute(options: { source?: string }): Promise<void> {
    const sourceOption = options.source?.toLowerCase() || 'custom';

    if (!['custom', 'system', 'all'].includes(sourceOption)) {
      handleError(new Error(`Invalid source value: ${sourceOption}. Must be one of 'custom', 'system', or 'all'.`));
      return;
    }

    const currentSourceType = sourceOption as SourceType;

    try {
      let definitions: T[] = [];

      switch (currentSourceType) {
        case 'custom':
          definitions = await this.getCustomDefinitions();
          break;
        case 'system':
          definitions = await this.getSystemDefinitions();
          break;
        case 'all':
          definitions = await this.getMergedDefinitions();
          break;
        default:
          handleError(new Error(`Unhandled source type: ${currentSourceType}`));
          return;
      }

      if (definitions.length === 0) {
        this.ui.showMessage('info', `No ${currentSourceType} ${this.entityNamePlural} found.`);
        return;
      }

      const headers = ['Slug', 'Name', 'Description', 'Source'];
      const tableData = definitions.map(def => {
        return [
          def.slug,
          def.name,
          def.description || '-',
          def.sourceType,
        ];
      });

      this.ui.displayTable(headers, tableData);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(`An unknown error occurred while listing ${this.entityNamePlural}.`));
    }
  }
}