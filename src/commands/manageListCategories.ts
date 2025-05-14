import { Command } from 'commander';
import { DefinitionLoader, CategoryDefinitionDisplay } from '../core/DefinitionLoader.js';
import { UIManager } from '../utils/uiManager.js';
import { handleError } from '../utils/errorHandler.js';
import { CategoryDefinition, SourceType } from '../types/domain.js';
import { FileManager } from '../core/FileManager.js';

interface ListCategoriesOptions {
  source: SourceType;
}

/**
 * Handles the 'manage list categories' command.
 * @param options - The command options.
 * @param _command - The commander command object.
 */
export async function manageListCategories(options: ListCategoriesOptions, _command: Command): Promise<void> {
  try {
    const uiManager = new UIManager();
    const fileManager = new FileManager(uiManager);
    const definitionLoader = new DefinitionLoader(fileManager);

    let categories: (CategoryDefinition | CategoryDefinitionDisplay)[] = [];
    let titleMessage = '';

    switch (options.source) {
      case 'custom':
        categories = await definitionLoader.getCustomCategories();
        titleMessage = 'Custom Categories';
        break;
      case 'system':
        categories = await definitionLoader.getSystemCategories();
        titleMessage = 'System Categories';
        break;
      case 'all':
        categories = await definitionLoader.getMergedCategories();
        titleMessage = 'All Categories (System & Custom)';
        break;
      default:
        uiManager.printError(`Invalid source option: ${options.source}`);
        return;
    }

    if (categories.length === 0) {
      uiManager.printInfo(`No ${options.source} categories found.`);
      return;
    }

    uiManager.printInfo(titleMessage); // Print title separately

    const headers = ['Slug', 'Name', 'Description', 'Source'];
    const rows = categories.map(category => {
      let sourceDisplay: string;
      if ('sourceType' in category) { // CategoryDefinitionDisplay
        sourceDisplay = category.sourceType;
      } else if (category.source) { // CategoryDefinition
        sourceDisplay = category.source;
      } else {
        sourceDisplay = options.source; // Fallback
      }

      // Refine display for 'all' source based on sourceType
      if (options.source === 'all' && 'sourceType' in category) {
        if (category.sourceType === 'custom-override') {
          sourceDisplay = 'custom (overrides system)';
        }
      }

      return [
        category.slug,
        category.name,
        category.description || '-',
        sourceDisplay
      ];
    });

    uiManager.displayTable(headers, rows);

  } catch (error) {
    handleError(error, { exit: true });
  }
}