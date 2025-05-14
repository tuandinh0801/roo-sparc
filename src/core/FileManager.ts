import fs from 'fs-extra';
import path from 'node:path';
import { ModeDefinition } from '../types/domain.js';
import { UIManager } from '../utils/uiManager.js';
import { handleError, FileSystemError, OverwriteConflictError } from '../utils/errorHandler.js'; // Import custom errors

/**
 * @file FileManager.ts
 * @description Handles file system operations for the Roo CLI.
 * This includes reading and writing configuration files, such as .roomodes.
 */

/**
 * Manages file system operations, such as reading and writing configuration files.
 * It is designed to be injectable for better testability and modularity.
 */
export class FileManager {
  /**
   * Constructs an instance of the FileManager.
   * Dependencies like UIManager are injected here.
   * @param {UIManager} uiManager - Instance of UIManager for UI interactions.
   */
  constructor(private uiManager: UIManager) {}

  /**
   * Writes the selected mode definitions to a .roomodes file in the specified target directory.
   *
   * @async
   * @param {string} targetDir - The directory where the .roomodes file will be written.
   * @param {ModeDefinition[]} selectedModes - An array of selected mode definitions.
   * @param {boolean} force - If true, overwrites the file if it already exists.
   * @returns {Promise<void>} A promise that resolves when the file has been written.
   * @throws {Error} If the file exists and force is false, or if any other file system error occurs.
   */
  public async writeRoomodesFile(
    targetDir: string,
    selectedModes: ModeDefinition[],
    force: boolean,
  ): Promise<void> {
    const roomodesPath = path.join(targetDir, '.roomodes');
    const relativePath = path.relative(process.cwd(), roomodesPath); // For user-friendly messages
    // Spinner logic removed for consistency with writeJson, UIManager will handle spinners if needed by the command
    // this.uiManager.startSpinner(`Checking for .roomodes at ${this.uiManager.chalk.cyan(relativePath)}...`);

    try {
      const fileExists = await fs.pathExists(roomodesPath);

      if (fileExists && !force) {
        // this.uiManager.failSpinner(`File already exists: ${this.uiManager.chalk.yellow(relativePath)}`);
        throw new OverwriteConflictError(
          `File already exists: ${relativePath}. Use --force to overwrite.`,
          relativePath,
        );
      }

      // this.uiManager.updateSpinner(`Writing .roomodes file to ${this.uiManager.chalk.cyan(relativePath)}...`);
      await fs.ensureDir(path.dirname(roomodesPath));
      const customModes = selectedModes.map(mode => ({
        slug: mode.slug,
        name: mode.name,
        roleDefinition: mode.description, // As per docs/data-models.md, description maps to roleDefinition
        customInstructions: mode.customInstructions,
        groups: mode.groups,
        source: mode.source,
      }));
      const outputData = { customModes };
      await fs.writeJson(roomodesPath, outputData, { spaces: 2 });
      // this.uiManager.succeedSpinner(`.roomodes file successfully written to ${this.uiManager.chalk.green(relativePath)}`);
      this.uiManager.printSuccess(
        `.roomodes configured with ${customModes.length} mode(s): ${this.uiManager.chalk.green(relativePath)}`,
        'Configuration Saved',
      );
    } catch (error: unknown) {
      // this.uiManager.failSpinner(`Failed to write .roomodes file to ${this.uiManager.chalk.red(relativePath)}`);
      if (error instanceof OverwriteConflictError) {
        // Let handleError in the CLI command handle displaying this specific error
        throw error;
      }
      // For other errors, wrap in FileSystemError if not already one
      const fsError = error instanceof FileSystemError ? error : new FileSystemError(`Failed to write .roomodes file to ${relativePath}: ${error instanceof Error ? error.message : String(error)}`, roomodesPath);
      handleError(fsError, { context: 'writing .roomodes file', uiManager: this.uiManager });
      throw fsError; // Re-throw the (potentially wrapped) error
    }
  }

  /**
   * Writes JSON data to a file, with overwrite protection.
   *
   * @async
   * @param {string} filePath - The absolute path to the file.
   * @param {any} data - The JSON data to write.
   * @param {boolean} force - If true, overwrites the file if it already exists.
   * @returns {Promise<void>} A promise that resolves when the file has been written.
   * @throws {OverwriteConflictError} If the file exists and force is false.
   * @throws {Error} If any other file system error occurs.
   */
  public async writeJson(
    filePath: string,
    data: any,
    force: boolean,
  ): Promise<void> {
    const relativePath = path.relative(process.cwd(), filePath);
    // Spinner is now managed by UIManager or not used directly here for simplicity in this example
    // this.uiManager.startSpinner(`Checking for existing file at ${this.uiManager.chalk.cyan(relativePath)}...`);

    try {
      const fileExists = await fs.pathExists(filePath);

      if (fileExists && !force) {
        this.uiManager.failSpinner(`File already exists: ${this.uiManager.chalk.yellow(relativePath)}`);
        throw new OverwriteConflictError(
          `File already exists: ${relativePath}. Use --force to overwrite.`,
          relativePath,
        );
      }

      await fs.ensureDir(path.dirname(filePath));
      await fs.writeJson(filePath, data, { spaces: 2 });
      this.uiManager.printInfo(`JSON file written: ${this.uiManager.chalk.green(relativePath)}`);
    } catch (error: unknown) {
      this.uiManager.failSpinner(`Failed to write JSON file to ${this.uiManager.chalk.red(relativePath)}`);
      if (error instanceof OverwriteConflictError) {
        handleError(error, { context: 'writing JSON file', uiManager: this.uiManager }); // Call handleError for OverwriteConflictError
        // Let handleError in the CLI command handle displaying this specific error
        throw error;
      }
      // For other errors, wrap in FileSystemError if not already one
      const fsError = error instanceof FileSystemError ? error : new FileSystemError(`Failed to write JSON file to ${relativePath}: ${error instanceof Error ? error.message : String(error)}`, filePath);
      handleError(fsError, { context: 'writing JSON file', uiManager: this.uiManager }); // Ensure UI manager is passed
      throw fsError; // Re-throw the (potentially wrapped) error
    }
  }

  /**
   * Ensures that a directory exists, creating it if necessary.
   *
   * @async
   * @param {string} directoryPath - The absolute path to the directory.
   * @returns {Promise<void>} A promise that resolves when the directory has been ensured.
   * @throws {Error} If any file system error occurs during directory creation.
   */
  public async createDirectoryIfNotExists(
    directoryPath: string,
  ): Promise<void> {
    const relativePath = path.relative(process.cwd(), directoryPath);
    this.uiManager.startSpinner(
      `Ensuring directory exists at ${this.uiManager.chalk.cyan(relativePath)}...`,
    );

    try {
      await fs.ensureDir(directoryPath);
      this.uiManager.succeedSpinner(
        `Directory ensured at ${this.uiManager.chalk.green(relativePath)}`,
      );
    } catch (error: unknown) {
      this.uiManager.failSpinner(
        `Failed to ensure directory at ${this.uiManager.chalk.red(relativePath)}`,
      );
      // Pass the error directly
      handleError(error, { context: 'ensuring directory' });
      throw error;
    }
  }

  /**
   * Copies a file from a source path to a destination path.
   *
   * @async
   * @param {string} sourcePath - The absolute path to the source file.
   * @param {string} destinationPath - The absolute path to the destination file.
   * @param {boolean} force - If true, overwrites the destination file if it already exists.
   * @returns {Promise<void>} A promise that resolves when the file has been copied.
   * @throws {Error} If the destination file exists and force is false, or if any other file system error occurs.
   */
  public async copyFile(
    sourcePath: string,
    destinationPath: string,
    force: boolean,
  ): Promise<void> {
    const relativeSourcePath = path.relative(process.cwd(), sourcePath);
    const relativeDestPath = path.relative(process.cwd(), destinationPath);
    this.uiManager.startSpinner(
      `Preparing to copy file from ${this.uiManager.chalk.cyan(relativeSourcePath)} to ${this.uiManager.chalk.cyan(relativeDestPath)}...`,
    );

    try {
      const destinationExists = await fs.pathExists(destinationPath);

      if (destinationExists && !force) {
        this.uiManager.failSpinner(
          `Destination file already exists: ${this.uiManager.chalk.yellow(relativeDestPath)}`,
        );
        // Throw specific OverwriteConflictError
        throw new OverwriteConflictError(
          `Destination file already exists: ${relativeDestPath}. Use --force to overwrite.`,
          relativeDestPath,
        );
      }

      this.uiManager.updateSpinnerText(`Copying file to ${this.uiManager.chalk.cyan(relativeDestPath)}...`);
      await fs.ensureDir(path.dirname(destinationPath)); // Ensure destination directory exists
      await fs.copy(sourcePath, destinationPath, { overwrite: force });
      this.uiManager.succeedSpinner(
        `File successfully copied to ${this.uiManager.chalk.green(relativeDestPath)}`,
      );
      this.uiManager.printSuccess(
        `File copied from ${relativeSourcePath}.`,
        'File Copied',
      );
    } catch (error: unknown) {
      this.uiManager.failSpinner(
        `Failed to copy file to ${this.uiManager.chalk.red(relativeDestPath)}`,
      );
      // Handle OverwriteConflictError specifically
      if (error instanceof OverwriteConflictError) {
        handleError(error, { uiManager: this.uiManager, exit: false }); // Don't exit, just warn
        throw error; // Re-throw for copyDirectoryContents or other callers
      } else {
        // Pass other errors directly; FileSystemError details are handled by handleError
        handleError(error, { context: 'copying file' });
        throw error; // Re-throw other errors
      }
    }
  }

  /**
   * Copies all files from a source directory to a destination directory.
   * Does not copy recursively (only top-level files).
   *
   * @async
   * @param {string} sourceDir - The absolute path to the source directory.
   * @param {string} destinationDir - The absolute path to the destination directory.
   * @param {boolean} force - If true, overwrites destination files if they already exist.
   * @param {string} [context='directory contents'] - Context for error messages.
   * @returns {Promise<void>} A promise that resolves when the directory contents have been copied.
   * @throws {FileSystemError} If the source directory does not exist or other critical errors occur.
   * @throws {OverwriteConflictError} If a destination file exists and force is false (rethrown from copyFile).
   */
  public async copyDirectoryContents(
    sourceDir: string,
    destinationDir: string,
    force: boolean,
    context: string = 'directory contents',
  ): Promise<void> {
    const relativeSource = path.relative(process.cwd(), sourceDir);
    const relativeDest = path.relative(process.cwd(), destinationDir);
    this.uiManager.startSpinner(
      `Preparing to copy ${context} from ${this.uiManager.chalk.cyan(relativeSource)} to ${this.uiManager.chalk.cyan(relativeDest)}...`,
    );

    try {
      // 1. Check if source directory exists
      const sourceExists = await fs.pathExists(sourceDir);
      if (!sourceExists) {
        // Throw specific error if source doesn't exist
        throw new FileSystemError(
          `Source directory does not exist: ${relativeSource}`,
          sourceDir,
        );
      }

      // 2. Ensure destination directory exists
      await this.createDirectoryIfNotExists(destinationDir); // Leverages existing method with its own spinner/logging

      // 3. Read source directory contents
      this.uiManager.updateSpinnerText(`Reading source directory ${this.uiManager.chalk.cyan(relativeSource)}...`);
      const items = await fs.readdir(sourceDir);

      if (items.length === 0) {
        this.uiManager.infoSpinner(`Source directory ${this.uiManager.chalk.cyan(relativeSource)} is empty. Nothing to copy.`);
        return;
      }

      this.uiManager.updateSpinnerText(`Copying ${items.length} item(s) for ${context}...`);

      // 4. Copy each file
      let filesCopied = 0;
      let filesSkipped = 0; // Track skipped files due to overwrite conflicts without force
      for (const item of items) {
        const sourceItemPath = path.join(sourceDir, item);
        const destItemPath = path.join(destinationDir, item);
        const stats = await fs.stat(sourceItemPath);

        if (stats.isFile()) {
          try {
            // Use existing copyFile method which handles overwrite checks and individual spinners/logging
            await this.copyFile(sourceItemPath, destItemPath, force);
            filesCopied++;
          } catch (copyError: unknown) {
            // Check if it was an OverwriteConflictError thrown by copyFile
            if (copyError instanceof OverwriteConflictError) {
              filesSkipped++;
              // Warning is handled within copyFile's catch block via handleError
              // Continue to the next file
            } else {
              // Rethrow other critical copy errors to stop the process
              this.uiManager.failSpinner(`Critical error copying item: ${item}`);
              throw copyError; // Rethrow to be caught by the outer catch
            }
          }
        } else {
          this.uiManager.warnSpinner(`Skipping non-file item: ${item}`); // Optionally log skipping directories/symlinks etc.
        }
      }

      if (filesSkipped > 0) {
        this.uiManager.succeedSpinner(`Copying ${context} complete. Copied: ${filesCopied}, Skipped (overwrite): ${filesSkipped}.`);
      } else {
        this.uiManager.succeedSpinner(`Copying ${context} complete. Copied: ${filesCopied} file(s).`);
      }

    } catch (error: unknown) {
      this.uiManager.failSpinner(`Failed to copy ${context} from ${this.uiManager.chalk.red(relativeSource)}.`);
      // Handle specific errors like source not existing, or rethrow others
      if (error instanceof FileSystemError && error.message.includes('Source directory does not exist')) {
        // Let the specific error message be handled by the caller's catch block
        throw error;
      } else if (error instanceof Error && error.message.includes('exists and force flag not used')) {
        // This case should ideally be handled within the loop now, but catch just in case
        // The OverwriteConflictError should be thrown by copyFile and handled there or by the caller of copyDirectoryContents
        handleError(error, { context: `copying ${context} (overwrite conflict)` });
        throw error; // Rethrow conflict error
      } else {
        // Pass the error directly, handleError will check its type
        handleError(error, { context: `copying ${context}` });
        throw error; // Rethrow other errors
      }
    }
  }


  /**
   * Ensures that the .roo, .roo/rules, and .roo/rules/<mode> directories exist.
   *
   * @async
   * @param {string} projectRoot - The root directory of the project.
   * @param {string} mode - The mode for which to ensure the rule directory.
   * @returns {Promise<void>} A promise that resolves when the directories have been ensured.
   * @throws {Error} If any file system error occurs.
   */
  public async ensureRuleSpecificDirectories(
    projectRoot: string,
    mode: string,
  ): Promise<void> {
    const rooPath = path.join(projectRoot, '.roo');
    const rulesPath = path.join(rooPath, 'rules');
    const modeSpecificPath = path.join(rulesPath, mode);

    this.uiManager.startSpinner(`Ensuring rule directory structure for mode ${mode}...`);
    try {
      this.uiManager.updateSpinnerText(`Ensuring directory: ${this.uiManager.chalk.cyan(path.relative(process.cwd(), rooPath))}`);
      await fs.ensureDir(rooPath);
      this.uiManager.updateSpinnerText(`Ensuring directory: ${this.uiManager.chalk.cyan(path.relative(process.cwd(), rulesPath))}`);
      await fs.ensureDir(rulesPath);
      this.uiManager.updateSpinnerText(`Ensuring directory: ${this.uiManager.chalk.cyan(path.relative(process.cwd(), modeSpecificPath))}`);
      await fs.ensureDir(modeSpecificPath);
      this.uiManager.succeedSpinner(`Rule directory structure ensured for mode '${mode}'.`);
    } catch (error: unknown) {
      this.uiManager.failSpinner('Failed to ensure rule directory structure.');
      handleError(error, {
        context: `ensuring rule directory structure for mode '${mode}' (paths: ${rooPath}, ${rulesPath}, ${modeSpecificPath})`.replace(new RegExp(process.cwd(), 'g'), '.'),
        // Alternatively, pick one primary path for filePath if more suitable for ErrorHandlerOptions
        // filePath: path.relative(process.cwd(), modeSpecificPath)
      });
      throw error;
    }
  }

  /**
   * Copies specified rule files for a given mode from the definitions directory
   * to the project's .roo/rules/<mode> directory.
   *
   * @async
   * @param {string} projectRoot - The root directory of the project.
   * @param {string} mode - The mode for which to copy rule files.
   * @param {string[]} ruleFileNames - An array of rule file names to copy.
   * @param {boolean} force - If true, overwrites destination files if they already exist.
   * @returns {Promise<void>} A promise that resolves when all files have been processed.
   * @throws {Error} If any critical file system error occurs.
   */
  public async copyRuleFilesForMode(
    projectRoot: string,
    mode: string,
    ruleFileNames: string[],
    force: boolean,
  ): Promise<void> {
    const definitionsBasePath = path.resolve(projectRoot, 'definitions', 'rules', mode); // Assuming definitions are relative to projectRoot
    const targetModePath = path.join(projectRoot, '.roo', 'rules', mode);

    // Ensure the target directory structure exists first.
    // This might be redundant if ensureRuleSpecificDirectories is always called before,
    // but good for robustness of this method if called independently.
    await this.createDirectoryIfNotExists(targetModePath); // Uses existing method

    this.uiManager.startSpinner(`Copying rule files for mode ${mode}...`);
    let filesCopied = 0;
    let filesSkipped = 0;

    try {
      for (const ruleFileName of ruleFileNames) {
        const sourceFilePath = path.join(definitionsBasePath, ruleFileName);
        const destinationFilePath = path.join(targetModePath, ruleFileName);
        const relativeDestPath = path.relative(process.cwd(), destinationFilePath);

        this.uiManager.updateSpinnerText(`Processing ${this.uiManager.chalk.cyan(ruleFileName)}...`);

        const destinationExists = await fs.pathExists(destinationFilePath);

        if (destinationExists && !force) {
          this.uiManager.printWarning(
            `Rule file already exists, skipping: ${this.uiManager.chalk.yellow(relativeDestPath)}. Use --force to overwrite.`,
            'Overwrite Conflict',
          );
          filesSkipped++;
          continue;
        }

        try {
          await fs.copy(sourceFilePath, destinationFilePath, { overwrite: force });
          this.uiManager.printInfo(`Copied rule file: ${this.uiManager.chalk.green(relativeDestPath)}`);
          filesCopied++;
        } catch (copyError: unknown) {
          // Log individual copy error but continue with other files if possible
          // The error message is now handled within copyFile's catch block via handleError
          // this.uiManager.printError(`Failed to copy rule file ${this.uiManager.chalk.red(ruleFileName)}.`);
          // handleError is called inside copyFile, so we just need to check the type here

          // Check if it was an OverwriteConflictError that copyFile throws and handles
          if (copyError instanceof OverwriteConflictError) {
            filesSkipped++;
            // Warning is already printed by copyFile's error handling
          } else {
            // For other errors during copy, rethrow to stop the whole process
            this.uiManager.failSpinner(`Critical error copying file: ${ruleFileName}`);
            // Pass the error directly to handleError
            handleError(copyError, { context: `copying rule file: ${ruleFileName}` });
            throw copyError; // Rethrow critical errors
          }
          throw copyError;
        }
      }

      if (ruleFileNames.length > 0) {
        this.uiManager.succeedSpinner(`Rule file copying complete. Copied: ${filesCopied}, Skipped: ${filesSkipped}.`);
      } else {
        this.uiManager.infoSpinner('No rule files specified to copy.');
      }

    } catch (error: unknown) {
      // This catch is for errors rethrown from individual copy failures or other unexpected errors.
      this.uiManager.failSpinner('An error occurred during rule file copying.');
      // handleError would have been called by the inner try-catch for copy errors.
      // If it's a different error, it might need its own handleError call or just rethrow.
      if (!String(error).includes('copying rule file')) { // Avoid double logging if already handled
        handleError(error, { context: 'copying rule files for mode operation' });
      }
      throw error;
    }
  }
}