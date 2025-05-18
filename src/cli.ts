#!/usr/bin/env node
import { Command } from 'commander';
import pkg from '../package.json' with { type: 'json' };
import { UIManager } from './utils/uiManager.js';
import { FileManager } from './core/FileManager.js';
import { DefinitionLoader } from './core/DefinitionLoader.js';
import { CommandOptions } from './commands/base/BaseCommand.js'; // Import CommandOptions

// Import commands
import { AddCategoryCommand } from './commands/manage/AddCategoryCommand.js';
import { AddModeCommand } from './commands/manage/AddModeCommand.js';
import { ListCategoriesCommand } from './commands/manage/ListCategoriesCommand.js';
import { ListModesCommand } from './commands/manage/ListModesCommand.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const description = 'A CLI tool for initializing Roo projects.';

// Create the main application
const app = new Command();
const uiManager = new UIManager();

// Initialize services
const fileManager = new FileManager(uiManager);
const definitionLoader = new DefinitionLoader(fileManager, uiManager);

// Create CommandOptions object
const commandOptions: CommandOptions = {
  ui: uiManager,
  fileManager: fileManager,
  definitionLoader: definitionLoader,
};

// Set up the main command
app
  .name(pkg.name)
  .description(description)
  .version(pkg.version)
  .option('-f, --force', 'Force overwrite if project already exists')
  .option('--modes <slugs>', 'Comma-separated list of mode slugs to initialize')
  .option('--category <slugs>', 'Comma-separated list of category slugs to initialize');

// Set up the manage command group
const manageCommand = app
  .command('manage')
  .description('Manage roo-init configurations and definitions.');

// Set up the 'manage add' subcommand group
const addCommand = manageCommand
  .command('add')
  .description('Add a new custom mode or category.');

// Initialize and register AddCategoryCommand and AddModeCommand under 'manage add'
new AddCategoryCommand(commandOptions).setupCommand(addCommand); // Will be `manage add category`
new AddModeCommand(commandOptions).setupCommand(addCommand);     // Will be `manage add mode`

// Set up the 'manage list' subcommand group
const listCommand = manageCommand
  .command('list')
  .description('List custom modes or categories');

// Register ListModesCommand and ListCategoriesCommand under 'manage list'
new ListModesCommand(commandOptions).setupCommand(listCommand); // This will make it `roo-init manage list list:modes` effectively
new ListCategoriesCommand(commandOptions).setupCommand(listCommand); // This will make it `roo-init manage list list:categories` effectively

// Main application action - runs when no subcommand is specified
app.action(async(options, command) => {
  try {
    uiManager.printBanner();

    // Show help if no arguments provided
    if (process.argv.length <= 2) {
      app.help();
      return;
    }

    // Show help for the manage command if no subcommand is provided
    if (command.args.length > 0 && command.args[0] === 'manage') {
      manageCommand.help();
      return;
    }

    // Default action: show help
    app.help();
  } catch (error) {
    console.error('An error occurred:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
});

// Main CLI function
export default async function cli(): Promise<void> {
  try {
    await app.parseAsync(process.argv);
  } catch (error) {
    console.error('An error occurred:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Only run the CLI if this file is being run directly
const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath)) {
  cli().catch(error => {
    console.error('Failed to run CLI:');
    console.error(error);
    process.exit(1);
  });
}