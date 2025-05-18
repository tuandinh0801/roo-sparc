import { Command } from 'commander';
import { BaseCommand } from '../base/BaseCommand.js';
import { ModeDefinition, Rule, UserDefinitions } from '../../types/domain.js';
import path from 'path';
import fs from 'fs-extra'; // Import fs-extra
import { v4 as uuidv4 } from 'uuid';

/**
 * Command to add a new custom mode.
 */
import { CommandOptions } from '../base/BaseCommand.js'; // Import CommandOptions

export class AddModeCommand extends BaseCommand {
  constructor(options: CommandOptions) {
    super(options);
  }
  /**
   * Executes the add mode command.
   */
  async execute(): Promise<void> {
    console.error('[AddModeCommand execute] Start');
    try {
      this.ui.printInfo('\n=== Add New Mode ===');
      console.error('[AddModeCommand execute] After printInfo');

      const slug = await this.promptForSlug();
      console.error(`[AddModeCommand execute] Slug prompted: ${slug}`);
      const name = await this.promptForName();
      console.error(`[AddModeCommand execute] Name prompted: ${name}`);
      const description = await this.promptForDescription();
      console.error(`[AddModeCommand execute] Description prompted: ${description}`);
      const customInstructions = await this.promptForCustomInstructions();
      console.error(`[AddModeCommand execute] CustomInstructions prompted: ${customInstructions ? customInstructions.substring(0, 50) + '...' : 'undefined'}`);
      const groups = await this.promptForGroups();
      console.error(`[AddModeCommand execute] Groups prompted: ${groups.join(', ')}`);
      const categorySlugs = await this.promptForCategories();
      console.error(`[AddModeCommand execute] CategorySlugs prompted: ${categorySlugs.join(', ')}`);

      // Construct user rules directory path
      const userConfigPath = this.fileManager.getUserConfigPath();
      console.error(`[AddModeCommand execute] userConfigPath: ${userConfigPath}`);
      const userRulesDir = path.join(userConfigPath, 'rules');
      console.error(`[AddModeCommand execute] userRulesDir: ${userRulesDir}`);
      const modeRulesDir = path.join(userRulesDir, slug);
      console.error(`[AddModeCommand execute] modeRulesDir: ${modeRulesDir}`);

      await fs.ensureDir(modeRulesDir); // Use fs.ensureDir directly
      console.error(`[AddModeCommand execute] Ensured directory: ${modeRulesDir}`);

      const rules = await this.promptForRules(modeRulesDir, slug);
      console.error(`[AddModeCommand execute] Rules prompted: ${rules.length} rules`);

      const newMode: ModeDefinition = {
        slug,
        name,
        description,
        customInstructions,
        groups,
        categorySlugs,
        associatedRuleFiles: rules,
        source: 'user'
      };
      console.error('[AddModeCommand execute] newMode object created:', newMode);

      await this.saveMode(newMode);
      console.error('[AddModeCommand execute] After saveMode call');
      this.ui.printSuccess(`\n✅ Mode "${name}" created successfully.`);
      console.error('[AddModeCommand execute] Success message printed');
    } catch (error) {
      console.error('[AddModeCommand execute] Error caught:', error);
      this.handleError(error as Error, 'Failed to add mode');
    }
    console.error('[AddModeCommand execute] End');
  }

  setupCommand(program: Command): void {
    program
      .command('mode')
      .description('Add a new custom mode')
      .action(() => this.execute());
  }

  private async promptForSlug(): Promise<string> {
    console.error('[AddModeCommand promptForSlug] Start');
    console.error('[AddModeCommand promptForSlug] Calling loadDefinitions...');
    const existingDefs = await this.definitionLoader.loadDefinitions();
    console.error('[AddModeCommand promptForSlug] loadDefinitions call completed.');
    const existingModeSlugs = new Set(existingDefs.modes.map((m) => m.slug));
    return this.ui.promptInput({
      message: 'Enter a unique slug for the new mode (e.g., my-custom-mode):',
      validate: (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) {return 'Slug cannot be empty.';}
        if (existingModeSlugs.has(trimmed)) {return `Mode slug "${trimmed}" already exists. Please choose a unique slug.`;}
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {return 'Slug must be lowercase alphanumeric with hyphens (e.g., my-custom-mode).';}
        return true;
      },
    });
  }

  private async promptForName(): Promise<string> {
    return this.ui.promptInput({
      message: 'Enter the display name for the mode:',
      validate: (input: string) => input.trim() ? true : 'Name cannot be empty.',
    });
  }

  private async promptForDescription(): Promise<string> {
    return this.ui.promptInput({
      message: 'Enter a description for the mode:',
      validate: (input: string) => input.trim() ? true : 'Description cannot be empty.',
    });
  }

  private async promptForCustomInstructions(): Promise<string | undefined> {
    const instructions = await this.ui.promptEditor({
      message: 'Enter custom instructions for the mode (optional):',
      default: '',
    });
    return instructions.trim() || undefined;
  }

  private async promptForGroups(): Promise<string[]> {
    const groupsInput = await this.ui.promptInput({
      message: 'Enter groups (comma-separated, optional):',
    });
    return groupsInput.split(',').map(g => g.trim()).filter(Boolean);
  }

  private async promptForCategories(): Promise<string[]> {
    const existingDefs = await this.definitionLoader.loadDefinitions();
    const categories = existingDefs.categories;
    if (categories.length === 0) {
      this.ui.printWarning('No categories found. You can add categories using the add:category command.');
      return [];
    }
    const choices = categories.map(cat => ({ name: `${cat.name} (${cat.slug})`, value: cat.slug }));
    return this.ui.promptCheckbox({
      message: 'Select categories for this mode (use space to select, enter to confirm):',
      choices,
    });
  }

  private async promptForRules(modeRulesDir: string, modeSlug: string): Promise<Rule[]> {
    const rules: Rule[] = [];
    let addAnotherRule = true;
    while (addAnotherRule) {
      const addRule = await this.ui.promptConfirm({ message: 'Would you like to add a rule to this mode?', default: false });
      if (!addRule) { addAnotherRule = false; continue; }
      try {
        const rule = await this.promptForRuleDetails(modeRulesDir, modeSlug);
        rules.push(rule);
        this.ui.printSuccess('✓ Rule added successfully.');
        const addMore = await this.ui.promptConfirm({ message: 'Would you like to add another rule?', default: false });
        if (!addMore) {addAnotherRule = false;}
      } catch (error) {
        this.ui.printError(`Failed to add rule: ${(error as Error).message}`);
        const continueAnyway = await this.ui.promptConfirm({ message: 'Would you like to continue adding rules?', default: false });
        if (!continueAnyway) {addAnotherRule = false;}
      }
    }
    return rules;
  }

  private async promptForRuleDetails(modeRulesDir: string, modeSlug: string): Promise<Rule> {
    const name = await this.ui.promptInput({
      message: 'Enter a name for the rule:',
      validate: (input: string) => input.trim() ? true : 'Rule name cannot be empty.',
    });
    const filename = await this.ui.promptInput({
      message: 'Enter a filename for the rule (e.g., my-rule.md):',
      default: `${name.toLowerCase().replace(/\s+/g, '-')}.md`,
      validate: (input: string) => {
        if (!input.trim()) {return 'Filename cannot be empty.';}
        if (!/^[a-z0-9_.-]+$/i.test(input) || !input.endsWith('.md')) {return 'Filename must be valid, alphanumeric with hyphens/dots, and end with .md (e.g., my-rule.md).';}
        return true;
      },
    });
    const description = await this.ui.promptInput({
      message: 'Enter a description for the rule (optional):',
    });
    const isGeneric = await this.ui.promptConfirm({
      message: 'Is this a generic rule (will be placed in user .roo/rules/)?',
      default: false,
    });
    const content = await this.ui.promptEditor({
      message: 'Enter the rule content (Markdown format):',
      default: `# Rule: ${name}\n\n## Description\n\n${description.trim() || 'No description provided.'}\n\n## Content\n\n`,
    });
    const ruleId = uuidv4();

    const userConfigPath = this.fileManager.getUserConfigPath();
    const userRulesBaseDir = path.join(userConfigPath, 'rules');

    const targetRuleDir = isGeneric ? userRulesBaseDir : modeRulesDir;
    await fs.ensureDir(targetRuleDir); // Use fs.ensureDir
    const ruleFilePath = path.join(targetRuleDir, filename);

    await fs.writeFile(ruleFilePath, content); // Use fs.writeFile

    return {
      id: ruleId,
      name,
      description: description.trim() || undefined,
      sourcePath: isGeneric ? filename : path.join(modeSlug, filename),
      isGeneric,
    };
  }

  private async saveMode(mode: ModeDefinition): Promise<void> {
    console.error('[AddModeCommand saveMode] Start for mode:', mode.slug);
    try {
      console.error('[AddModeCommand saveMode] Attempting to load existing user definitions...');
      let userDefs: UserDefinitions = { customModes: [], customCategories: [] };
      try {
        const existingUserDefs = await this.fileManager.readUserDefinitions();
        console.error('[AddModeCommand saveMode] Read existingUserDefs:', existingUserDefs);
        if (existingUserDefs) {
          userDefs = {
            customModes: existingUserDefs.customModes || [],
            customCategories: existingUserDefs.customCategories || [],
          };
        }
      } catch (error) {
        console.error('[AddModeCommand saveMode] Error reading existing user definitions:', error);
        this.ui.printWarning(`Could not read existing user definitions: ${(error as Error).message}. Starting with empty definitions.`);
      }
      console.error('[AddModeCommand saveMode] User definitions after read (or default):', {
        customModesCount: userDefs.customModes?.length,
        customCategoriesCount: userDefs.customCategories?.length
      });

      userDefs.customModes = [...(userDefs.customModes || []), mode];
      console.error('[AddModeCommand saveMode] User definitions after adding new mode:', {
        customModesCount: userDefs.customModes?.length,
        customCategoriesCount: userDefs.customCategories?.length
      });

      console.error('[AddModeCommand saveMode] Attempting to write user definitions...');
      await this.fileManager.writeUserDefinitions(userDefs);
      console.error('[AddModeCommand saveMode] User definitions written.');
    } catch (error) {
      console.error('[AddModeCommand saveMode] Error during saveMode:', error);
      throw new Error(`Failed to save mode: ${(error as Error).message}`);
    }
    console.error('[AddModeCommand saveMode] End');
  }
}
