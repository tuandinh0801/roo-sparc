/**
 * @fileoverview Handler for the `roo-init manage add mode` command.
 * This command allows users to interactively define a new custom mode.
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import { DefinitionLoader } from '../core/DefinitionLoader.js';
import { FileManager } from '../core/FileManager.js';
import { ModeDefinition, Rule, CategoryDefinition } from '../types/domain.js';
import { UIManager } from '../utils/uiManager.js'; // Import UIManager class
// import { generateSlug } from '../utils/slugUtils.js'; // Assuming a utility for slug generation/validation - Placeholder below
import path from 'path'; // For filename validation
import { fileURLToPath } from 'url'; // For robust path resolution in ES modules
import { v4 as uuidv4 } from 'uuid'; // Now installed
import fs from 'fs-extra'; // For file system operations

const USER_DEFINITIONS_PATH = path.join(process.env.HOME || '~', '.config', 'roo-init', 'user-definitions.json');
const USER_RULES_DIR = path.join(process.env.HOME || '~', '.config', 'roo-init', 'rules');

// Placeholder slug generation
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
}


/**
 * Handles the `roo-init manage add mode` command.
 * @param {Command} _program - The commander program instance (not directly used yet).
 */
export async function manageAddModeHandler(_program: Command): Promise<void> {
  const uiManager = new UIManager(); // Instantiate UIManager

  // Local interface for collecting rule data including temporary fields
  interface RuleCreationData extends Rule {
    filename: string; // Temporary, for validation and path construction
    content: string;  // Temporary, for saving content via FileManager
  }

  try {
    const fileManager = new FileManager(uiManager); // Pass uiManager to FileManager
    // Calculate the path to the system definitions directory relative to the compiled output
    const currentFilePath = fileURLToPath(import.meta.url);
    const currentDirPath = path.dirname(currentFilePath);
    // When compiled, manageAddMode.js will be in dist/src/commands/manageAddMode.js
    // The definitions will be in dist/definitions/
    // So, path.resolve(currentDirPath, '..', '..', 'definitions') should point to dist/definitions
    const systemDefinitionsResolvedPath = path.resolve(currentDirPath, '..', '..', 'definitions');

    const definitionLoader = new DefinitionLoader(fileManager, systemDefinitionsResolvedPath);

    const loadedDefs = await definitionLoader.loadDefinitions(); // Use loadDefinitions
    const existingCustomModeSlugs = loadedDefs.modes.filter(m => m.source === 'user').map((m: ModeDefinition) => m.slug);
    const allCategories = loadedDefs.categories;

    uiManager.printSuccess('Welcome to the custom mode creation wizard!'); // Use uiManager method
    console.log('Let\'s define the metadata for your new mode.');

    const modeMetadata = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter the human-readable name for the mode:',
        validate: (input: string) => input.trim() !== '' || 'Name cannot be empty.',
      },
      {
        type: 'input',
        name: 'slug',
        message: 'Enter a unique slug for the mode (e.g., my-custom-mode):',
        default: (answers: { name: string }) => generateSlug(answers.name),
        validate: (input: string) => {
          if (input.trim() === '') {return 'Slug cannot be empty.';}
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input)) {
            return 'Slug must be in kebab-case (e.g., my-slug-name).';
          }
          if (existingCustomModeSlugs.includes(input)) {
            return 'This slug is already used by another custom mode. Please choose a unique one.';
          }
          // Potentially check against system mode slugs too if necessary, though story says "other custom modes"
          // const systemModeSlugs = definitionLoader.getSystemModes().map(m => m.slug);
          // if (systemModeSlugs.includes(input)) {
          //   return 'This slug is already used by a system mode. Please choose a unique one.';
          // }
          return true;
        },
        filter: (input: string) => input.toLowerCase().trim(),
      },
      {
        type: 'input',
        name: 'roleDefinition', // Maps to ModeDefinition.description
        message: 'Enter a detailed description (role definition) for the mode:',
        validate: (input: string) => input.trim() !== '' || 'Description cannot be empty.',
      },
      {
        type: 'editor',
        name: 'customInstructions',
        message: 'Enter custom instructions for this mode (optional, press Enter to skip, Ctrl+S/Cmd+S to save and exit editor):',
        default: '',
        // Note: `inquirer` editor prompt might need specific handling or a fallback if system editor isn't configured.
        // For MVP, we assume it works or user can paste content.
      },
      {
        type: 'input',
        name: 'groups',
        message: 'Enter groups for this mode (optional, comma-separated, e.g., "coding,ai,experimental"):',
        filter: (input: string) => input.split(',').map(g => g.trim()).filter(g => g !== ''),
      },
      {
        type: 'checkbox',
        name: 'categorySlugs',
        message: 'Select categories for this mode (Space to select, Enter to confirm):',
        choices: allCategories.map((cat: CategoryDefinition) => ({ name: `${cat.name} (${cat.slug})`, value: cat.slug })),
        validate: (answer: string[]) => answer.length > 0 || 'Please select at least one category.',
      },
    ]);

    // Temporary structure to hold mode data before rules are finalized
    const newModeData = {
      slug: modeMetadata.slug,
      name: modeMetadata.name,
      description: modeMetadata.roleDefinition,
      customInstructions: modeMetadata.customInstructions || undefined,
      groups: modeMetadata.groups.length > 0 ? modeMetadata.groups : undefined,
      categorySlugs: modeMetadata.categorySlugs,
    };

    console.log('\nMode metadata collected:');
    console.log(JSON.stringify(newModeData, null, 2));
    uiManager.printSuccess('Next, let\'s add rules to your mode.');

    const collectedRules: RuleCreationData[] = [];
    let addAnotherRule = true;

    while (addAnotherRule) {
      const { confirmAddRule } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmAddRule',
          message: 'Do you want to add a rule to this mode?',
          default: collectedRules.length === 0, // Default to yes for the first rule
        },
      ]);

      if (confirmAddRule) {
        uiManager.printInfo('Define the rule details:');
        const ruleMetadata = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Enter the human-readable name for the rule:',
            validate: (input: string) => input.trim() !== '' || 'Rule name cannot be empty.',
          },
          {
            type: 'input',
            name: 'filename',
            message: 'Enter the filename for the rule (e.g., my-rule.md):',
            validate: (input: string) => {
              if (input.trim() === '') {return 'Filename cannot be empty.';}
              // Basic filename validation (can be enhanced)
              if (!/^[a-zA-Z0-9_.-]+$/.test(input) || !input.endsWith('.md')) {
                return 'Filename must contain valid characters and end with .md (e.g., my_rule.md).';
              }
              // Check for filename uniqueness within this mode's rules
              if (collectedRules.some((r: RuleCreationData) => r.filename === input.trim())) {
                return 'This filename is already used for another rule in this mode.';
              }
              return true;
            },
            filter: (input: string) => input.trim(),
          },
          {
            type: 'input',
            name: 'description',
            message: 'Enter a brief description for the rule (optional):',
          },
          {
            type: 'confirm',
            name: 'isGeneric',
            message: 'Is this a generic rule (applies to .roo/rules/)? (Otherwise, it\'s mode-specific)',
            default: false,
          },
        ]);

        const { content } = await inquirer.prompt([
          {
            type: 'editor',
            name: 'content',
            message: `Enter the Markdown content for rule "${ruleMetadata.name}" (Ctrl+S/Cmd+S to save and exit editor):`,
            validate: (input: string) => input.trim() !== '' || 'Rule content cannot be empty.',
          },
        ]);

        const ruleId = ruleMetadata.filename.replace(/\.md$/, ''); // Derive ID from filename
        const ruleToAdd: RuleCreationData = {
          id: ruleId,
          name: ruleMetadata.name,
          description: ruleMetadata.description || '',
          filename: ruleMetadata.filename, // Temporary
          sourcePath: `${modeMetadata.slug}/${ruleMetadata.filename}`,
          isGeneric: ruleMetadata.isGeneric,
          content: content, // Temporary
        };
        collectedRules.push(ruleToAdd);
        uiManager.printSuccess(`Rule "${ruleToAdd.name}" added.`);
      } else {
        addAnotherRule = false;
      }
    }

    const finalModeDefinition: ModeDefinition = {
      // id: modeMetadata.slug, // ID is not part of ModeDefinition in domain.ts
      slug: newModeData.slug,
      name: newModeData.name,
      description: newModeData.description,
      customInstructions: newModeData.customInstructions,
      groups: newModeData.groups,
      categorySlugs: newModeData.categorySlugs,
      associatedRuleFiles: collectedRules.map((cr: RuleCreationData) => ({
        id: cr.id,
        name: cr.name,
        description: cr.description,
        sourcePath: cr.sourcePath,
        isGeneric: cr.isGeneric,
        // targetPath is optional and not set here
      })),
      source: 'user',
    };

    if (collectedRules.length > 0) {
      console.log(`\nCollected ${collectedRules.length} rule(s) for mode "${finalModeDefinition.name}".`);
      console.log('Full mode to be saved (excluding rule content):');
      console.log(JSON.stringify(finalModeDefinition, null, 2));
    } else {
      console.log(`\nNo rules were added to mode "${finalModeDefinition.name}".`);
      console.log('Mode to be saved:');
      console.log(JSON.stringify(finalModeDefinition, null, 2));
    }

    // Save the mode definition and rule files
    uiManager.printInfo('\nSaving your new custom mode...');

    try {
      // 1. Ensure user config directories exist
      await fileManager.ensureUserConfigDirectories(); // Uses FileManager's existing method

      // 2. Read or initialize user-definitions.json
      let userDefinitions: { customModes: ModeDefinition[]; customCategories: CategoryDefinition[] };
      try {
        if (await fs.pathExists(USER_DEFINITIONS_PATH)) {
          userDefinitions = await fs.readJson(USER_DEFINITIONS_PATH);
          // Basic validation of existing structure
          if (!Array.isArray(userDefinitions.customModes)) {
            userDefinitions.customModes = [];
          }
          if (!Array.isArray(userDefinitions.customCategories)) {
            userDefinitions.customCategories = [];
          }
        } else {
          userDefinitions = { customModes: [], customCategories: [] };
        }
      } catch (e) {
        uiManager.printWarning(`Could not read or parse existing user-definitions.json. Initializing a new one. Error: ${(e as Error).message}`);
        userDefinitions = { customModes: [], customCategories: [] };
      }

      // 3. Add the new mode definition (without id if not part of schema, slug is main identifier)
      // ModeDefinition in domain.ts does not have an 'id' field. Slug is the identifier.
      const modeToSave: ModeDefinition = {
        slug: finalModeDefinition.slug,
        name: finalModeDefinition.name,
        description: finalModeDefinition.description,
        customInstructions: finalModeDefinition.customInstructions,
        groups: finalModeDefinition.groups,
        categorySlugs: finalModeDefinition.categorySlugs,
        associatedRuleFiles: finalModeDefinition.associatedRuleFiles,
        source: 'user',
      };
      userDefinitions.customModes.push(modeToSave);

      // 4. Write updated user-definitions.json
      await fs.writeJson(USER_DEFINITIONS_PATH, userDefinitions, { spaces: 2 });
      uiManager.printSuccess(`Mode definition for "${modeToSave.name}" saved to ${USER_DEFINITIONS_PATH}`);

      // 5. Save rule files
      if (collectedRules.length > 0) {
        const modeRulesDir = path.join(USER_RULES_DIR, modeToSave.slug);
        await fs.ensureDir(modeRulesDir); // Ensure mode-specific rule directory exists

        for (const ruleData of collectedRules) {
          const ruleFilePath = path.join(modeRulesDir, ruleData.filename);
          try {
            await fs.writeFile(ruleFilePath, ruleData.content);
            uiManager.printSuccess(`Rule file "${ruleData.filename}" saved to ${ruleFilePath}`);
          } catch (e) {
            uiManager.printError(`Failed to save rule file "${ruleData.filename}": ${(e as Error).message}`);
            // Decide if we should continue or stop. For now, log and continue.
          }
        }
      }
      uiManager.printSuccess(`\nCustom mode "${modeToSave.name}" and its rules have been successfully created!`);

    } catch (fileError: any) {
      uiManager.printError(`Failed to save mode or rule files: ${fileError.message}`);
      if (fileError.stack) {console.error(fileError.stack);}
    }

  } catch (error: any) {
    uiManager.printError(`An error occurred while adding the mode: ${error.message}`); // Use uiManager method
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

/**
 * Configures the `manage add mode` command.
 * @param {Command} program - The commander program instance.
 */
export function configureManageAddModeCommand(program: Command): void {
  program
    .command('add-mode') // kebab-case for CLI
    .alias('add')
    .description('Interactively add a new custom mode definition.')
    .action(async() => {
      await manageAddModeHandler(program);
    });
}