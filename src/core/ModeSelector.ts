import Enquirer from 'enquirer';
import { CategoryDefinition as Category, ModeDefinition as Mode } from '../types/domain.js';
import { InvalidFlagArgumentError } from '../utils/errorHandler.js';

/**
 * Handles interactive mode selection using categories and modes.
 */
export class ModeSelector {
  private categories: Category[];
  private modes: Mode[];

  /**
   * Initializes the ModeSelector with categories and modes.
   * @param categories - An array of Category objects.
   * @param modes - An array of Mode objects.
   */
  constructor(categories: Category[], modes: Mode[]) {
    this.categories = categories;
    this.modes = modes;
  }

  /**
   * Prompts the user to select a category and then a mode within that category.
   * @returns A Promise that resolves to the selected Mode object, or null if selection is cancelled.
   */
  public async selectMode(): Promise<Mode | null> {
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
      if (this.categories.length > 1) { // Only ask if there are other categories to choose from
        try {
          const confirmResponse: { continue: boolean } = await Enquirer.prompt({
            type: 'confirm',
            name: 'continue',
            message: 'Do you want to select modes from another category?',
            initial: false,
          });
          keepSelectingCategories = confirmResponse.continue;
        } catch (_) {
          // Handle cancellation of the confirm prompt (e.g., Ctrl+C)
          console.log('Selection process cancelled.');
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
    if (this.categories.length === 0) {
      console.warn('No categories available for selection.');
      return null;
    }

    try {
      const response: { categoryName: string } = await Enquirer.prompt({
        type: 'autocomplete',
        name: 'categoryName',
        message: 'Select a category:',
        choices: this.categories.map(cat => ({
          name: cat.name,
          message: `${cat.name} - ${cat.description}`, // Display name and description
          value: cat.name, // Return the category name
        })),
        suggest(input: string, choices: any[]) {
          return choices.filter(choice =>
            choice.message.toLowerCase().includes(input.toLowerCase())
          );
        },
      } as any); // Cast to any to bypass suggest type issue
      return this.categories.find(cat => cat.name === response.categoryName) || null;
    } catch (_) {
      // Handle cancellation (e.g., Ctrl+C)
      console.log('Category selection cancelled.');
      return null;
    }
  }

  /**
   * Prompts the user to select a mode from the given category.
   * @param category - The category from which to select a mode.
   * @returns A Promise that resolves to the selected Mode object, or null.
   */
  private async promptForMode(category: Category): Promise<Mode | null> {
    const modesInCategory = this.modes.filter(mode => mode.categorySlugs.includes(category.slug));

    if (modesInCategory.length === 0) {
      console.warn(`No modes available in category: ${category.name}`);
      return null;
    }

    try {
      const response: { modeSlug: string } = await Enquirer.prompt({
        type: 'autocomplete',
        name: 'modeSlug',
        message: `Select a mode from ${category.name}:`,
        choices: modesInCategory.map(mode => ({
          name: mode.slug,
          message: `${mode.name} (${mode.slug}) - ${mode.description}`,
          value: mode.slug,
        })),
        suggest(input: string, choices: any[]) {
          return choices.filter(choice =>
            choice.message.toLowerCase().includes(input.toLowerCase())
          );
        },
      } as any); // Cast to any to bypass suggest type issue
      return this.modes.find(mode => mode.slug === response.modeSlug) || null;
    } catch (_) {
      // Handle cancellation
      console.log('Mode selection cancelled.');
      return null;
    }
  }

  /**
   * Prompts the user to select multiple modes from the given category.
   * @param category - The category from which to select modes.
   * @returns A Promise that resolves to an array of selected mode slugs.
   */
  private async promptForModesFromCategory(category: Category): Promise<string[]> {
    const modesInCategory = this.modes.filter(mode => mode.categorySlugs.includes(category.slug));

    if (modesInCategory.length === 0) {
      console.warn(`No modes available in category: ${category.name}`);
      return [];
    }

    try {
      const response: { modeSlugs: string[] } = await Enquirer.prompt({
        type: 'multiselect',
        name: 'modeSlugs',
        message: `Select modes from ${category.name}:`,
        hint: '(Navigate with arrows, <space> to select, <a> to toggle all, <i> to invert, <enter> to confirm)',
        choices: modesInCategory.map(mode => ({
          name: mode.slug, // This value is returned in the array for each selected choice
          message: `${mode.name} (${mode.slug}) - ${mode.description}`, // This is displayed to the user
        })),
        validate(value: string[]) {
          if (value.length === 0) {
            return 'Please select at least one mode, or cancel (Ctrl+C).';
          }
          return true;
        }
      } as any); // Cast to any to bypass validate type issue
      return response.modeSlugs || []; // Ensure an array is returned, even if prompt somehow resolves with non-array
    } catch (_) {
      // Handle cancellation (e.g., Ctrl+C)
      console.log(`Mode selection from category ${category.name} cancelled.`);
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