import { Command } from 'commander';
import { UIManager } from '../../utils/uiManager.js';
import { FileManager } from '../../core/FileManager.js';
import { DefinitionLoader } from '../../core/DefinitionLoader.js';

/**
 * Base class for all CLI commands.
 * Provides common functionality and utilities for command implementations.
 */
export abstract class BaseCommand {
  protected ui: UIManager;
  protected fileManager: FileManager;
  protected definitionLoader: DefinitionLoader;

  constructor() {
    this.ui = new UIManager();
    this.fileManager = new FileManager(this.ui);
    this.definitionLoader = new DefinitionLoader(this.fileManager);
  }

  /**
   * Executes the command logic.
   * Must be implemented by subclasses.
   */
  abstract execute(...args: any[]): Promise<void>;

  /**
   * Sets up the command with its options and action.
   * Must be implemented by subclasses.
   */
  abstract setupCommand(program: Command): void;

  /**
   * Helper method to handle errors consistently across commands.
   * @param error The error that occurred
   * @param context Additional context about where the error occurred
   */
  protected handleError(error: Error, context: string = ''): void {
    const message = context ? `${context}: ${error.message}` : error.message;
    this.ui.printError(message);

    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
  }
}
