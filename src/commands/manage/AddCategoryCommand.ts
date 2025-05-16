import { Command } from 'commander';
import { BaseCommand } from '../base/BaseCommand.js';
import { CategoryDefinition, UserDefinitions } from '../../types/domain.js'; // Added UserDefinitions

/**
 * Command to add a new custom category.
 */
export class AddCategoryCommand extends BaseCommand {
  /**
   * Executes the add category command.
   */
  async execute(): Promise<void> {
    try {
      this.ui.printInfo('\n=== Add New Category ===');

      const slug = await this.promptForSlug();
      const name = await this.promptForName();
      const description = await this.promptForDescription();

      const newCategory: CategoryDefinition = {
        slug,
        name,
        description,
        source: 'user'
      };

      await this.saveCategory(newCategory);
      this.ui.printSuccess(`\n✅ Category "${name}" created successfully.`);
    } catch (error) {
      this.handleError(error as Error, 'Failed to add category');
    }
  }

  /**
   * Sets up the command with its options and action.
   * @param program The Commander program instance
   */
  setupCommand(program: Command): void {
    program
      .command('add:category')
      .description('Add a new custom category')
      .action(() => this.execute());
  }

  /**
   * Prompts the user for a category slug.
   * Validates the slug for uniqueness and format.
   */
  private async promptForSlug(): Promise<string> {
    const existingDefs = await this.definitionLoader.loadDefinitions();
    const existingCategorySlugs = new Set(
      existingDefs.categories.map((c) => c.slug)
    );

    return this.ui.promptInput({
      message: 'Enter a unique slug for the new category (e.g., custom-dev-tools):',
      validate: (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) {
          return 'Slug cannot be empty.';
        }
        if (existingCategorySlugs.has(trimmed)) {
          return `Category slug "${trimmed}" already exists. Please choose a unique slug.`;
        }
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
          return 'Slug must be lowercase alphanumeric with hyphens (e.g., my-category-slug).';
        }
        return true;
      },
    });
  }

  /**
   * Prompts the user for a category name.
   */
  private async promptForName(): Promise<string> {
    return this.ui.promptInput({
      message: 'Enter the display name for the category:',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Name cannot be empty.';
        }
        return true;
      },
    });
  }

  /**
   * Prompts the user for an optional category description.
   */
  private async promptForDescription(): Promise<string | undefined> {
    const description = await this.ui.promptInput({
      message: 'Enter a description (optional):',
      // 'required' is not a direct option for inquirer.promptInput.
      // Optional input is handled by not providing a validate function that enforces input.
    });
    return description.trim() || undefined;
  }

  /**
   * Saves the new category to the user definitions file.
   * @param category The category to save
   */
  private async saveCategory(category: CategoryDefinition): Promise<void> {
    try {
      // Load existing definitions
      let userDefs: UserDefinitions = { // Explicitly type userDefs
        customModes: [],
        customCategories: [],
      };

      try {
        const existingUserDefs = await this.fileManager.readUserDefinitions();
        if (existingUserDefs) {
          userDefs = {
            customModes: existingUserDefs.customModes || [],
            customCategories: existingUserDefs.customCategories || [],
          };
        }
      } catch (error) {
        // readUserDefinitions handles logging for file not found or parse errors,
        // and returns null in those cases. If it throws, it's an unexpected error.
        this.ui.printWarning(`Could not read existing user definitions: ${(error as Error).message}. Starting with empty definitions.`);
      }

      // Add the new category
      userDefs.customCategories = [
        ...(userDefs.customCategories || []),
        {
          slug: category.slug,
          name: category.name,
          description: category.description,
          source: 'user', // Ensure source is explicitly set
        },
      ];

      // Save back to file
      await this.fileManager.writeUserDefinitions(userDefs);
    } catch (error) {
      throw new Error(`Failed to save category: ${(error as Error).message}`);
    }
  }
}
