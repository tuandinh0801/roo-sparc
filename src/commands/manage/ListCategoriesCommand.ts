import { Command } from 'commander';
import { AbstractListDefinitionsCommand, DefinitionItem } from '../base/AbstractListDefinitionsCommand.js';
import { CategoryDefinitionWithSource } from '../../types/domain.js';
import { CommandOptions } from '../base/BaseCommand.js'; // Import CommandOptions

/**
 * @class ListCategoriesCommand
 * @description Command to list available categories (system, custom, or all).
 */
export class ListCategoriesCommand extends AbstractListDefinitionsCommand<CategoryDefinitionWithSource> {
  static description = 'List available categories (system, custom, or all).';

  protected commandName = 'categories'; // Corrected: Direct assignment
  protected commandDescription = ListCategoriesCommand.description;
  protected entityName = 'category';
  protected entityNamePlural = 'categories';

  constructor(options: CommandOptions) {
    super(options);
  }

  // setupCommand is inherited

  protected async getCustomDefinitions(): Promise<CategoryDefinitionWithSource[]> {
    return this.definitionLoader.getCustomCategories();
  }

  protected async getSystemDefinitions(): Promise<CategoryDefinitionWithSource[]> {
    return this.definitionLoader.getSystemCategories();
  }

  protected async getMergedDefinitions(): Promise<CategoryDefinitionWithSource[]> {
    return this.definitionLoader.getMergedCategories();
  }

  // The execute method is now handled by the abstract class
}
