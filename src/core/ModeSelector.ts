import { CategoryDefinitionWithSource as Category, ModeDefinitionWithSource as Mode } from '../types/domain.js';
import { InvalidFlagArgumentError } from '../utils/errorHandler.js';
import { UIManager } from '../utils/uiManager.js';
import { DefinitionLoader } from './DefinitionLoader.js'; // Added import

/**
 * Handles interactive mode selection using categories and modes.
 */
export class ModeSelector {
  private categories: Category[] | null = null;
  private modes: Mode[] | null = null;
  private definitionLoader: DefinitionLoader; // Added DefinitionLoader
  private uiManager: UIManager;

  /**
   * Initializes the ModeSelector.
   * Definitions are loaded on demand.
   * @param definitionLoader - Instance of DefinitionLoader.
   * @param uiManager - Instance of UIManager for UI interactions.
   */
  constructor(definitionLoader: DefinitionLoader, uiManager: UIManager) {
    this.definitionLoader = definitionLoader;
    this.uiManager = uiManager;
  }

  private async ensureDefinitionsLoaded(): Promise<void> {
    if (!this.categories || !this.modes) {
      const { modes, categories } = await this.definitionLoader.loadDefinitions();
      this.modes = modes;
      this.categories = categories;
    }
  }


  /**
   * Prompts the user to select a category and then a mode within that category.
   * @returns A Promise that resolves to the selected Mode object, or null if selection is cancelled.
   */
  public async selectMode(): Promise<Mode | null> {
    await this.ensureDefinitionsLoaded();
    if (!this.categories || !this.modes) { // Should not happen if ensureDefinitionsLoaded works
      this.uiManager.printError('Definitions could not be loaded for mode selection.');
      return null;
    }
    // Placeholder for category selection logic
    const selectedCategory = await this.promptForCategory();
    if (!selectedCategory) {
      return null;
    }

    // Placeholder for mode selection logic
    const selectedMode = await this.promptForMode(selectedCategory);
    return selectedMode;
  }

  /**
   * Interactively prompts the user to select categories and then modes within those categories.
   * Allows selection of multiple modes across different categories.
   * @returns A Promise that resolves to an array of selected mode slugs.
   */
  public async selectModesInteractively(): Promise<string[]> {
    await this.ensureDefinitionsLoaded();
    if (!this.categories || !this.modes) {
      this.uiManager.printError('Definitions could not be loaded for interactive mode selection.');
      return [];
    }
    const allSelectedModeSlugs: string[] = [];
    let keepSelectingCategories = true;

    while (keepSelectingCategories) {
      const selectedCategory = await this.promptForCategory();
      if (!selectedCategory) {
        // User cancelled category selection or no categories left/selected
        keepSelectingCategories = false;
        break;
      }

      const modesFromThisCategory = await this.promptForModesFromCategory(selectedCategory);
      modesFromThisCategory.forEach(slug => {
        if (!allSelectedModeSlugs.includes(slug)) {
          allSelectedModeSlugs.push(slug);
        }
      });

      // After selecting modes from a category (or if no modes were selected from it),
      // ask if they want to pick another category.
      if (this.categories && this.categories.length > 1) { // Only ask if there are other categories to choose from
        try {
          keepSelectingCategories = await this.uiManager.promptConfirm({
            message: 'Do you want to select modes from another category?',
            default: false, // UIManager.promptConfirm can take a default
          });
        } catch (_) {
          // Handle cancellation of the confirm prompt (e.g., Ctrl+C)
          this.uiManager.printInfo('Selection process cancelled.');
          keepSelectingCategories = false;
        }
      } else {
        // No other categories to select from
        keepSelectingCategories = false;
      }
    }

    return allSelectedModeSlugs;
  }

  /**
   * Prompts the user to select a category.
   * @returns A Promise that resolves to the selected Category object, or null.
   */
  private async promptForCategory(): Promise<Category | null> {
    // Relies on ensureDefinitionsLoaded being called by the public method
    if (!this.categories || this.categories.length === 0) {
      this.uiManager.printWarning('No categories available for selection.');
      return null;
    }

    try {
      const categoryChoices = this.categories.map(cat => ({
        name: `${cat.name} - ${cat.description}`, // Display name and description for the user
        value: cat.name, // Return the category name as the value
      }));

      const selectedCategoryName = await this.uiManager.promptList<string>({
        message: 'Select a category:',
        choices: categoryChoices,
      });

      if (!selectedCategoryName) { // User might cancel (e.g. Ctrl+C in Inquirer)
        this.uiManager.printInfo('Category selection cancelled.');
        return null;
      }
      return this.categories.find(cat => cat.name === selectedCategoryName) || null;
    } catch (_) {
      // Handle other cancellation (e.g., Ctrl+C)
      this.uiManager.printInfo('Category selection cancelled.');
      return null;
    }
  }

  /**
   * Prompts the user to select a mode from the given category.
   * @param category - The category from which to select a mode.
   * @returns A Promise that resolves to the selected Mode object, or null.
   */
  private async promptForMode(category: Category): Promise<Mode | null> {
    // Relies on ensureDefinitionsLoaded being called by the public method
    if (!this.modes) {return null;}
    const modesInCategory = this.modes.filter(mode => mode.categorySlugs.includes(category.slug));

    if (modesInCategory.length === 0) {
      this.uiManager.printWarning(`No modes available in category: ${category.name}`);
      return null;
    }

    try {
      const modeChoices = modesInCategory.map(mode => ({
        name: `${mode.name} (${mode.slug}) - ${mode.description}`, // Display name, slug and description
        value: mode.slug, // Return the mode slug
      }));

      const selectedModeSlug = await this.uiManager.promptList<string>({
        message: `Select a mode from ${category.name}:`,
        choices: modeChoices,
      });

      if (!selectedModeSlug) { // User might cancel
        this.uiManager.printInfo('Mode selection cancelled.');
        return null;
      }
      return this.modes.find(mode => mode.slug === selectedModeSlug) || null;
    } catch (_) {
      // Handle other cancellation (e.g., Ctrl+C)
      this.uiManager.printInfo('Mode selection cancelled.');
      return null;
    }
  }

  /**
   * Prompts the user to select multiple modes from the given category.
   * @param category - The category from which to select modes.
   * @returns A Promise that resolves to an array of selected mode slugs.
   */
  private async promptForModesFromCategory(category: Category): Promise<string[]> {
    // Relies on ensureDefinitionsLoaded being called by the public method
    if (!this.modes) {return [];}
    const modesInCategory = this.modes.filter(mode => mode.categorySlugs.includes(category.slug));

    if (modesInCategory.length === 0) {
      this.uiManager.printWarning(`No modes available in category: ${category.name}`);
      return [];
    }

    try {
      const modeChoices = modesInCategory.map(mode => ({
        name: `${mode.name} (${mode.slug}) - ${mode.description}`, // This is displayed to the user
        value: mode.slug, // This value is returned in the array for each selected choice
        short: mode.name, // Short name for display after selection
      }));

      const selectedModeSlugs = await this.uiManager.promptCheckbox<string>({
        message: `Select modes from ${category.name}: (Navigate with arrows, <space> to select, <enter> to confirm)`,
        choices: modeChoices,
        validate: (value: string[]) => {
          if (value.length === 0) {
            return 'Please select at least one mode, or cancel (Ctrl+C).';
          }
          return true;
        },
      });
      return selectedModeSlugs || []; // Ensure an array is returned
    } catch (_) {
      // Handle cancellation (e.g., Ctrl+C)
      this.uiManager.printInfo(`Mode selection from category ${category.name} cancelled.`);
      return [];
    }
  }

  /**
   * Resolves mode slugs from command-line flags.
   * @param modesFlagValue - Comma-separated string of mode slugs.
   * @param categoryFlagValue - Comma-separated string of category slugs.
   * @returns A Promise that resolves to an array of unique, validated mode slugs.
   * @throws InvalidFlagArgumentError if any provided slugs are invalid.
   */
  public async resolveModesFromFlags(
    modesFlagValue?: string,
    categoryFlagValue?: string,
  ): Promise<string[]> {
    await this.ensureDefinitionsLoaded();
    if (!this.categories || !this.modes) {
      this.uiManager.printError('Definitions could not be loaded for flag resolution.');
      // Decide on behavior: throw, or return empty with errors?
      // For now, consistent with original intent, let's throw if critical info missing.
      // However, resolveModesFromFlags is expected to throw InvalidFlagArgumentError for bad slugs.
      // If definitions themselves are missing, that's a more fundamental issue.
      throw new Error('Mode and category definitions are not available for flag resolution.');
    }
    const resolvedModeSlugs = new Set<string>();
    const invalidSlugs: string[] = [];

    // Process --modes flag
    if (modesFlagValue) {
      const directModeSlugs = modesFlagValue.split(',').map(s => s.trim()).filter(s => s);
      for (const slug of directModeSlugs) {
        if (this.modes.some(m => m.slug === slug)) {
          resolvedModeSlugs.add(slug);
        } else {
          invalidSlugs.push(`mode: ${slug}`);
        }
      }
    }

    // Process --category flag
    if (categoryFlagValue) {
      const categorySlugsFromFlag = categoryFlagValue.split(',').map(s => s.trim()).filter(s => s);
      for (const catSlug of categorySlugsFromFlag) {
        const category = this.categories.find(c => c.slug === catSlug);
        if (category) {
          this.modes.forEach(mode => {
            if (mode.categorySlugs.includes(catSlug)) {
              resolvedModeSlugs.add(mode.slug);
            }
          });
        } else {
          invalidSlugs.push(`category: ${catSlug}`);
        }
      }
    }

    if (invalidSlugs.length > 0) {
      throw new InvalidFlagArgumentError(
        `Invalid or unknown slugs provided. Please check your --modes or --category arguments. Invalid items: ${invalidSlugs.join(', ')}`,
        invalidSlugs
      );
    }

    if (resolvedModeSlugs.size === 0 && (modesFlagValue || categoryFlagValue)) {
      // If flags were provided but resolved to no modes (e.g., valid but empty category, or valid mode flag with no actual modes)
      // This could be an info message or a specific error depending on desired UX.
      // For now, returning empty array. cli.ts will handle if no modes are selected.
      // console.warn('Warning: Provided flags resolved to zero modes.');
    }

    return Array.from(resolvedModeSlugs);
  }

  /**
   * Resolves mode slugs from non-interactive command-line flag options.
   * This method does not throw on invalid slugs but returns them in the result.
   * @param options - An object containing optional 'modes' and 'category' string properties.
   *                  'modes' is a comma-separated string of mode slugs.
   *                  'category' is a comma-separated string of category slugs.
   * @returns A Promise that resolves to an object containing:
   *            - selectedModes: string[] - unique, validated mode slugs.
   *            - invalidModeSlugs: string[] - mode slugs that were provided but not found.
   *            - invalidCategorySlugs: string[] - category slugs that were provided but not found.
   */
  public async selectModesNonInteractively(options: {
    modes?: string;
    category?: string;
  }): Promise<{
      selectedModes: string[];
      invalidModeSlugs: string[];
      invalidCategorySlugs: string[];
    }> {
    await this.ensureDefinitionsLoaded();
    if (!this.categories || !this.modes) {
      this.uiManager.printError('Definitions could not be loaded for non-interactive selection.');
      return {
        selectedModes: [],
        invalidModeSlugs: options.modes?.split(',').map(s => s.trim()).filter(s => s) || [],
        invalidCategorySlugs: options.category?.split(',').map(s => s.trim()).filter(s => s) || [],
      };
    }
    const selectedModes = new Set<string>();
    const invalidModeSlugs: string[] = [];
    const invalidCategorySlugs: string[] = [];

    // Process --modes flag
    if (options.modes) {
      const directModeSlugs = options.modes.split(',').map(s => s.trim()).filter(s => s);
      for (const slug of directModeSlugs) {
        if (this.modes.some(m => m.slug === slug)) {
          selectedModes.add(slug);
        } else {
          invalidModeSlugs.push(slug);
        }
      }
    }

    // Process --category flag
    if (options.category) {
      const categorySlugsFromFlag = options.category.split(',').map(s => s.trim()).filter(s => s);
      for (const catSlug of categorySlugsFromFlag) {
        const categoryExists = this.categories.some(c => c.slug === catSlug);
        if (categoryExists) {
          this.modes.forEach(mode => {
            if (mode.categorySlugs.includes(catSlug)) {
              selectedModes.add(mode.slug);
            }
          });
        } else {
          invalidCategorySlugs.push(catSlug);
        }
      }
    }

    return {
      selectedModes: Array.from(selectedModes),
      invalidModeSlugs,
      invalidCategorySlugs,
    };
  }
}