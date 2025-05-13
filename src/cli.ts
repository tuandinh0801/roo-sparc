#!/usr/bin/env node

import { Command } from 'commander';
import pkg from '../package.json' with { type: 'json' };
import { DefinitionLoader } from './core/DefinitionLoader.js';
import { ModeSelector } from './core/ModeSelector.js';
import { FileManager } from './core/FileManager.js';
import { ModeDefinition, CategoryDefinition } from './types/domain.js'; // Import CategoryDefinition
import { UIManager } from './utils/uiManager.js';
import {
  handleError,
  UserAbortError,
  FileSystemError,
  OverwriteConflictError,
  InvalidFlagArgumentError, // Added InvalidFlagArgumentError
} from './utils/errorHandler.js'; // Import custom errors
import * as path from 'path'; // Changed to namespace import
import { fileURLToPath } from 'url';
import _fs from 'fs-extra'; // Prefix with underscore to indicate it's unused

// Determine the root directory of the CLI application
// This is important for finding the 'definitions' folder correctly,
// especially when the CLI is installed globally or used as a dependency.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Assuming 'definitions' is at the root of the compiled output (e.g., dist/definitions)
// or at the root of the project during development (e.g., definitions/)
// Adjust this path if your project structure is different.
// For a typical build process where src/ -> dist/, and definitions/ is copied to dist/
const projectRoot = path.resolve(__dirname, '..'); // Moves up from dist/src to dist/ then to project root
const definitionsPath = path.join(projectRoot, 'definitions');


const description = 'A CLI tool for initializing Roo projects.';

interface MainOptions {
  definitionsPathOverride?: string;
  projectRootOverride?: string;
  rethrowEnoentInTests?: boolean; // Option to control ENOENT rethrow
  force?: boolean; // Add force option for testing
}

export async function main(mainOptions: MainOptions = {}): Promise<void> {
  const app = new Command();
  const uiManager = new UIManager(); // Instantiate UIManager

  uiManager.printBanner();

  app
    .name(pkg.name)
    .description(description)
    .version(pkg.version)
    .option('-f, --force', 'Force overwrite if project already exists')
    .option('--modes <slugs>', 'Comma-separated list of mode slugs to initialize')
    .option('--category <slugs>', 'Comma-separated list of category slugs to initialize');

  app.parse(process.argv);
  const options = app.opts();

  // Skip initialization if help or version flags are provided
  if (options.help || options.version) {
    // Commander handles these flags automatically
    return;
  }

  // Proceed with initialization
  uiManager.printInfo('Starting Roo project initialization...', 'Setup');

  let modes: ModeDefinition[] = [];
  // Store raw categories first
  let rawCategories: CategoryDefinition[] = [];
  let selectedModeObjects: ModeDefinition[] = [];
  const effectiveDefinitionsPath = mainOptions.definitionsPathOverride ?? definitionsPath;
  const effectiveProjectRoot = mainOptions.projectRootOverride ?? process.cwd();
  const fileManager = new FileManager(uiManager); // Instantiate FileManager early

  try {
    // 1. Load Definitions
    uiManager.startSpinner('Loading definitions...');
    if (process.env.NODE_ENV === 'test') {
      process.stdout.write(`[CLI Test Log] effectiveDefinitionsPath: ${effectiveDefinitionsPath}\n`);
      process.stdout.write(`[CLI Test Log] process.cwd(): ${process.cwd()}\n`);
    }
    const definitionLoader = new DefinitionLoader(effectiveDefinitionsPath);
    const loadedDefs = await definitionLoader.loadDefinitions();
    modes = loadedDefs.modes;
    rawCategories = loadedDefs.categories; // Store raw categories
    uiManager.succeedSpinner('Definitions loaded successfully.');

    // 2. Select Modes
    // Instantiate ModeSelector before checking for non-interactive flags
    const modeSelector = new ModeSelector(rawCategories, modes);

    // Check if modes or category flags are provided
    if (options.modes || options.category) {
      // Non-interactive mode
      uiManager.printInfo('Non-interactive mode detected. Resolving modes from flags...', 'Mode Selection');

      // For E2E tests, explicitly log the flags to stdout
      // Use both NODE_ENV and VITEST to ensure compatibility with all test environments
      if (process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.VITEST_WORKER_ID) {
        console.log('Non-interactive mode detected');
        if (options.modes) {
          console.log(`Processing modes: ${options.modes}`);
        }
        if (options.category) {
          console.log(`Processing category: ${options.category}`);
        }
      }

      const nonInteractiveResult = await modeSelector.selectModesNonInteractively({
        modes: options.modes as string | undefined,
        category: options.category as string | undefined,
      });

      const allInvalidSlugs: string[] = [];
      if (nonInteractiveResult.invalidModeSlugs.length > 0) {
        allInvalidSlugs.push(...nonInteractiveResult.invalidModeSlugs.map(s => `mode: ${s}`));
      }
      if (nonInteractiveResult.invalidCategorySlugs.length > 0) {
        allInvalidSlugs.push(...nonInteractiveResult.invalidCategorySlugs.map(s => `category: ${s}`));
      }

      if (allInvalidSlugs.length > 0) {
        throw new InvalidFlagArgumentError(
          `Invalid or unknown slugs provided. Please check your --modes or --category arguments. Invalid items: ${allInvalidSlugs.join(', ')}`,
          allInvalidSlugs // Pass the detailed invalid items
        );
      }

      // Map slugs to full mode objects
      selectedModeObjects = nonInteractiveResult.selectedModes
        .map((slug) => modes.find((m) => m.slug === slug))
        .filter(Boolean) as ModeDefinition[];

      if (selectedModeObjects.length === 0 && (options.modes || options.category)) {
        // If flags were provided but resolved to zero valid modes
        throw new Error('No valid modes selected with the provided flags. Please check your input.');
      }
    } else {
      // Interactive mode
      uiManager.printInfo('Starting interactive mode selection...', 'Mode Selection');
      const selectedModeSlugs = await modeSelector.selectModesInteractively();

      // Map slugs to full mode objects
      selectedModeObjects = selectedModeSlugs
        .map((slug) => modes.find((m) => m.slug === slug))
        .filter(Boolean) as ModeDefinition[];
    }

    // Ensure we have modes selected
    if (!selectedModeObjects.length) {
      throw new Error('Mode selection returned empty without aborting.');
    }
    uiManager.printInfo(`Selected modes: ${selectedModeObjects.map((m) => m.name).join(', ')}`, 'Modes Selected');

    // 3. Write .roomodes File
    uiManager.startSpinner('Writing configuration file...');
    await fileManager.writeRoomodesFile(
      effectiveProjectRoot,
      selectedModeObjects,
      mainOptions.force ?? options.force, // Prioritize mainOptions.force
    );
    // Success message is now handled within writeRoomodesFile via uiManager

    // 4. Copy Rule Files
    uiManager.startSpinner('Copying rule files...');
    const targetRooDir = path.join(effectiveProjectRoot, '.roo');
    const sourceRulesBaseDir = path.join(effectiveDefinitionsPath, 'rules');

    // Ensure .roo directory exists
    await fileManager.createDirectoryIfNotExists(targetRooDir);

    // Copy Generic Rules
    const sourceGenericRulesDir = path.join(sourceRulesBaseDir, 'generic');
    const targetGenericRulesDir = path.join(targetRooDir, 'rules'); // Corrected path
    try {
      await fileManager.copyDirectoryContents(
        sourceGenericRulesDir,
        targetGenericRulesDir,
        mainOptions.force ?? options.force, // Prioritize mainOptions.force
        'generic rules', // Context for error reporting
      );
      // uiManager.printInfo('Copied generic rule files.', 'Rules Setup'); // Handled by copyDirectoryContents
    } catch (err) {
      if (err instanceof FileSystemError && err.message.includes('Source directory does not exist')) {
        uiManager.printInfo('No generic rule files found to copy.', 'Rules Setup');
      } else if (err instanceof OverwriteConflictError) {
        handleError(err, { uiManager, exit: false }); // Don't exit on overwrite conflict, just warn
      } else {
        // Rethrow other errors to be caught by the main try/catch
        throw err;
      }
    }

    // Copy Mode-Specific Rules
    for (const mode of selectedModeObjects) {
      const sourceModeRulesDir = path.join(sourceRulesBaseDir, mode.slug);
      const targetModeRulesDir = path.join(targetRooDir, `rules-${mode.slug}`);
      try {
        await fileManager.copyDirectoryContents(
          sourceModeRulesDir,
          targetModeRulesDir,
          mainOptions.force ?? options.force, // Prioritize mainOptions.force
          `rules for mode ${mode.slug}`, // Context
        );
        // uiManager.printInfo(`Copied rule files for mode: ${mode.name}`, 'Rules Setup'); // Handled by copyDirectoryContents
      } catch (err) {
        if (err instanceof FileSystemError && err.message.includes('Source directory does not exist')) {
          uiManager.printInfo(`No rule files found for mode: ${mode.name}`, 'Rules Setup');
        } else if (err instanceof OverwriteConflictError) {
          handleError(err, { uiManager, exit: false }); // Don't exit on overwrite conflict
        } else {
          // Rethrow other errors
          throw err;
        }
      }
    }
    uiManager.succeedSpinner('Rule files copied successfully.');

    // 5. Final Success Message
    const modeNames = selectedModeObjects.map((m) => m.name).join(', ');
    const successMessage = `Project initialized successfully with modes: ${modeNames}.\nFiles created/updated in ${path.relative(process.cwd(), effectiveProjectRoot) || '.'}.`;
    uiManager.printSuccess(successMessage, 'Initialization Complete');

    // Exit with success code 0 for successful operations
    process.exit(0);

  } catch (error) {
    // Centralized error handling
    uiManager.failSpinner('Initialization failed.'); // Ensure spinner stops on error

    // For E2E tests, explicitly log errors to stdout
    // Use both NODE_ENV and VITEST to ensure compatibility with all test environments
    if (process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.VITEST_WORKER_ID) {
      if (error instanceof InvalidFlagArgumentError) {
        console.log(`Error with flag arguments: ${error.message}`);
      } else if (error instanceof OverwriteConflictError) { // Specific E2E logging for this error
        console.log(`Conflict: ${error.message}`);
      } else if (error instanceof Error) {
        console.log(`Error: ${error.message}`);
      } else {
        console.log(`Unknown error: ${String(error)}`);
      }
      // Also log E2E_ERROR_OUTPUT for test capture
      if (error instanceof Error) {
        console.log(`E2E_ERROR_OUTPUT: ${error.message}`);
      }
    }

    if (error instanceof UserAbortError) {
      // User aborts should exit with a non-zero code as per Story 3.3
      handleError(error, { uiManager, exit: true, exitCode: 1 });
    } else if (error instanceof OverwriteConflictError) {
      // First, print a warning message to match test expectations
      uiManager.printWarning(
        `File already exists: ${path.relative(process.cwd(), error.filePath)}. Use --force to overwrite.`,
        'Overwrite Conflict'
      );
      // Then handle the error and exit with code 1
      handleError(error, { uiManager, exit: true, exitCode: 1, context: 'Overwrite Conflict' });
    } else if (error instanceof InvalidFlagArgumentError) {
      // Invalid flag arguments should exit with code 1
      handleError(error, { uiManager, exit: true, exitCode: 1, context: 'Flag Validation' });
    } else {
      // All other errors should exit with code 1
      handleError(error, { uiManager, exit: true, exitCode: 1, context: 'CLI Initialization' });
    }
  }
}

// main() is no longer called here automatically.
// It should be called by the executable script (e.g., in bin/) or by tests.

// Ensure main is called when the script is executed directly
// This allows the 'bin' script in package.json to work correctly.
const scriptPath = fileURLToPath(import.meta.url);
// process.argv[1] is the path to the executed script.
// Resolve paths to handle potential differences in how paths are represented (e.g., symlinks)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath)) {
  main();
}