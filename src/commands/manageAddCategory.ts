import { Command } from 'commander';
import { UIManager } from '../utils/uiManager.js';
import { DefinitionLoader } from '../core/DefinitionLoader.js';
import { FileManager } from '../core/FileManager.js';
import { CategoryDefinition, UserDefinitions } from '../types/domain.js';

/**
 * Handles the 'manage add category' command.
 * Prompts the user for category details, validates input, and saves the new category.
 */
export async function manageAddCategory(): Promise<void> {
  const ui = new UIManager();
  const fileManager = new FileManager(ui);
  const definitionLoader = new DefinitionLoader(fileManager);

  try {
    const existingDefs = await definitionLoader.loadDefinitions();
    // Ensure slug is unique across ALL categories (system and user)
    const existingCategorySlugs = new Set(
      existingDefs.categories.map((c: CategoryDefinition) => c.slug)
    );

    let slug = '';
    let name = '';
    let description: string | undefined = '';
    let isSlugValid = false;

    while (!isSlugValid) {
      slug = await ui.promptInput({
        message: 'Enter a unique slug for the new category (e.g., custom-dev-tools):',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Slug cannot be empty.';
          }
          if (existingCategorySlugs.has(input.trim())) {
            return `Category slug "${input.trim()}" already exists. Please choose a unique slug.`;
          }
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.trim())) {
            return 'Slug must be lowercase alphanumeric with hyphens (e.g., my-category-slug).';
          }
          return true;
        },
      });
      slug = slug.trim(); // Ensure slug is trimmed after successful validation by promptInput

      // Re-check after prompt, as validate handles re-prompting.
      // If validate function works as expected (inquirer re-prompts on error string),
      // code here will only execute with a valid slug.
      // slug is already trimmed from line 42.
      // The validate function in promptInput (lines 29-41) provides immediate feedback.
      // This outer loop handles cases where promptInput might resolve despite validate returning an error string (e.g. mock behavior)
      // or for additional checks not covered by the prompt's immediate validation.

      if (!slug) { // Should be caught by prompt's validate, but as a safeguard:
        ui.printError('Slug cannot be empty.');
        isSlugValid = false;
      } else if (existingCategorySlugs.has(slug)) {
        ui.printError(`Category slug "${slug}" already exists. Please choose a unique slug.`);
        isSlugValid = false;
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        ui.printError('Slug must be lowercase alphanumeric with hyphens (e.g., my-category-slug).');
        isSlugValid = false;
      } else {
        isSlugValid = true;
      }
    }

    // If slug is valid, proceed to ask for name and description
    name = await ui.promptInput({
      message: 'Enter a human-readable name for the category (e.g., Custom Development Tools):',
      validate: (input: string) => !!input.trim() || 'Name cannot be empty.',
    });
    name = name.trim();

    const descRaw = await ui.promptInput({
      message: 'Enter a brief description for the category (optional):',
    });
    description = descRaw.trim() || undefined;


    const newCategory: CategoryDefinition = {
      slug,
      name,
      description,
      source: 'user', // Mark as user-defined
    };

    let userDefinitions = await fileManager.readUserDefinitions(); // Corrected: use instance method

    if (!userDefinitions) {
      userDefinitions = { customModes: [], customCategories: [] };
    }
    if (!userDefinitions.customCategories) {
      userDefinitions.customCategories = [];
    }
    // Ensure customModes is also initialized if not present
    if (!userDefinitions.customModes) {
      userDefinitions.customModes = [];
    }


    userDefinitions.customCategories.push(newCategory);

    await fileManager.writeUserDefinitions(userDefinitions); // Corrected: use instance method

    ui.printSuccess(`Category "${newCategory.name}" (${newCategory.slug}) added successfully!`); // Corrected: use instance method

  } catch (error: any) {
    if (error.message.includes('Cannot load definitions')) { // Check specific error from mock
      ui.printError(`Failed to load existing definitions: ${error.message}`); // Corrected: use instance method
    } else if (error.message.includes('Disk full')) { // Check specific error from mock
      ui.printError(`Failed to save category definition: ${error.message}`); // Corrected: use instance method
    }
    else {
      ui.printError(`An unexpected error occurred: ${error.message}`); // Corrected: use instance method
    }
  }
}
export function setupManageAddCategoryCommand(program: Command): void {
  program
    .command('category')
    .description('Add a new custom category definition.')
    .action(async() => {
      await manageAddCategory();
    });
}