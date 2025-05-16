#!/usr/bin/env node

import { Command } from 'commander';
import pkg from '../package.json' with { type: 'json' };
import { UIManager } from './utils/uiManager.js';
import { FileManager } from './core/FileManager.js';
import { DefinitionLoader } from './core/DefinitionLoader.js';
import { ModeSelector } from './core/ModeSelector.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Import commands
import { AddCategoryCommand } from './commands/manage/AddCategoryCommand.js';
import { AddModeCommand } from './commands/manage/AddModeCommand.js';
import { ListCategoriesCommand } from './commands/manage/ListCategoriesCommand.js';
import { ListModesCommand } from './commands/manage/ListModesCommand.js';

// Determine the root directory of the CLI application
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const definitionsPath = path.join(projectRoot, 'definitions');

const description = 'A CLI tool for initializing Roo projects.';

// Create the main application
const app = new Command();
const uiManager = new UIManager();

// Initialize services
const fileManager = new FileManager(uiManager);
const definitionLoader = new DefinitionLoader(fileManager);
const modeSelector = new ModeSelector(definitionLoader, uiManager);

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

// Initialize and register commands for the 'manage' group (excluding list commands)
const manageCommands = [
  new AddCategoryCommand(),
  new AddModeCommand(),
  // ListCommands are now registered under the 'list' subcommand
];

// Set up each direct 'manage' command
manageCommands.forEach(command => {
  command.setupCommand(manageCommand);
});

// Set up the 'manage list' subcommand group
const listCommand = manageCommand
  .command('list')
  .description('List custom modes or categories');

// Register ListModesCommand and ListCategoriesCommand under 'manage list'
new ListModesCommand().setupCommand(listCommand); // This will make it `roo-init manage list list:modes` effectively
new ListCategoriesCommand().setupCommand(listCommand); // This will make it `roo-init manage list list:categories` effectively

// To achieve `roo-init manage list modes` and `roo-init manage list categories`,
// the `ListModesCommand.command` should be 'modes' and `ListCategoriesCommand.command` should be 'categories'.
// This will be addressed by updating the static `command` property in those command files.

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

// Export the app for testing purposes
export { app };

// Only parse command line arguments if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  app.parse(process.argv);
}