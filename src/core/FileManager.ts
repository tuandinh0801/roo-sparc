import fs from 'fs-extra';
import path from 'node:path';
import envPaths from 'env-paths';
import { ModeDefinition, UserDefinitions } from '../types/domain.js';
import { UIManager } from '../utils/uiManager.js';
import { handleError, FileSystemError, OverwriteConflictError } from '../utils/errorHandler.js'; // Import custom errors

const APP_NAME = 'roo-init';

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

    try {
      const fileExists = await fs.pathExists(roomodesPath);

      if (fileExists && !force) {
        throw new OverwriteConflictError(
          `File already exists: ${relativePath}. Use --force to overwrite.`,
          relativePath,
        );
      }

      await fs.ensureDir(path.dirname(roomodesPath));
      const customModes = selectedModes.map(mode => ({
        slug: mode.slug,
        name: mode.name,
        roleDefinition: mode.description,
        customInstructions: mode.customInstructions,
        groups: mode.groups,
        source: mode.source,
      }));
      const outputData = { customModes };
      await fs.writeJson(roomodesPath, outputData, { spaces: 2 });
      this.uiManager.printSuccess(
        `.roomodes configured with ${customModes.length} mode(s): ${this.uiManager.chalk.green(relativePath)}`,
        'Configuration Saved',
      );
    } catch (error: unknown) {
      if (error instanceof OverwriteConflictError) {
        throw error;
      }
      const fsError = error instanceof FileSystemError ? error : new FileSystemError(`Failed to write .roomodes file to ${relativePath}: ${error instanceof Error ? error.message : String(error)}`, roomodesPath);
      handleError(fsError, { context: 'writing .roomodes file', uiManager: this.uiManager });
      throw fsError;
    }
  }

  /**
   * Writes JSON data to a file, with overwrite protection.
   *
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
        handleError(error, { context: 'writing JSON file', uiManager: this.uiManager });
        throw error;
      }
      const fsError = error instanceof FileSystemError ? error : new FileSystemError(`Failed to write JSON file to ${relativePath}: ${error instanceof Error ? error.message : String(error)}`, filePath);
      handleError(fsError, { context: 'writing JSON file', uiManager: this.uiManager });
      throw fsError;
    }
  }

  /**
   * Ensures that a directory exists, creating it if necessary.
   *
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
      handleError(error, { context: 'ensuring directory' });
      throw error;
    }
  }

  /**
   * Copies a file from a source path to a destination path.
   *
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
        throw new OverwriteConflictError(
          `Destination file already exists: ${relativeDestPath}. Use --force to overwrite.`,
          relativeDestPath,
        );
      }

      this.uiManager.updateSpinnerText(`Copying file to ${this.uiManager.chalk.cyan(relativeDestPath)}...`);
      await fs.ensureDir(path.dirname(destinationPath));
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
      if (error instanceof OverwriteConflictError) {
        handleError(error, { uiManager: this.uiManager, exit: false });
        throw error;
      } else {
        handleError(error, { context: 'copying file' });
        throw error;
      }
    }
  }

  /**
   * Copies all files from a source directory to a destination directory.
   * Does not copy recursively (only top-level files).
   *
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
      const sourceExists = await fs.pathExists(sourceDir);
      if (!sourceExists) {
        throw new FileSystemError(
          `Source directory does not exist: ${relativeSource}`,
          sourceDir,
        );
      }

      await this.createDirectoryIfNotExists(destinationDir);

      this.uiManager.updateSpinnerText(`Reading source directory ${this.uiManager.chalk.cyan(relativeSource)}...`);
      const items = await fs.readdir(sourceDir);

      if (items.length === 0) {
        this.uiManager.infoSpinner(`Source directory ${this.uiManager.chalk.cyan(relativeSource)} is empty. Nothing to copy.`);
        return;
      }

      this.uiManager.updateSpinnerText(`Copying ${items.length} item(s) for ${context}...`);

      let filesCopied = 0;
      let filesSkipped = 0;
      for (const item of items) {
        const sourceItemPath = path.join(sourceDir, item);
        const destItemPath = path.join(destinationDir, item);
        const stats = await fs.stat(sourceItemPath);

        if (stats.isFile()) {
          try {
            await this.copyFile(sourceItemPath, destItemPath, force);
            filesCopied++;
          } catch (copyError: unknown) {
            if (copyError instanceof OverwriteConflictError) {
              filesSkipped++;
            } else {
              this.uiManager.failSpinner(`Critical error copying item: ${item}`);
              throw copyError;
            }
          }
        } else {
          this.uiManager.warnSpinner(`Skipping non-file item: ${item}`);
        }
      }

      if (filesSkipped > 0) {
        this.uiManager.succeedSpinner(`Copying ${context} complete. Copied: ${filesCopied}, Skipped (overwrite): ${filesSkipped}.`);
      } else {
        this.uiManager.succeedSpinner(`Copying ${context} complete. Copied: ${filesCopied} file(s).`);
      }

    } catch (error: unknown) {
      this.uiManager.failSpinner(`Failed to copy ${context} from ${this.uiManager.chalk.red(relativeSource)}.`);
      if (error instanceof FileSystemError && error.message.includes('Source directory does not exist')) {
        throw error;
      } else if (error instanceof Error && error.message.includes('exists and force flag not used')) {
        handleError(error, { context: `copying ${context} (overwrite conflict)` });
        throw error;
      } else {
        handleError(error, { context: `copying ${context}` });
        throw error;
      }
    }
  }

  /**
   * Ensures that the .roo, .roo/rules, and .roo/rules/<mode> directories exist.
   *
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
      });
      throw error;
    }
  }

  /**
   * Copies specified rule files for a given mode from the definitions directory
   * to the project's .roo/rules/<mode> directory.
   *
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
    const definitionsBasePath = path.resolve(projectRoot, 'definitions', 'rules', mode);
    const targetModePath = path.join(projectRoot, '.roo', 'rules', mode);

    await this.createDirectoryIfNotExists(targetModePath);

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
          if (copyError instanceof OverwriteConflictError) {
            filesSkipped++;
          } else {
            this.uiManager.failSpinner(`Critical error copying file: ${ruleFileName}`);
            handleError(copyError, { context: `copying rule file: ${ruleFileName}` });
            throw copyError;
          }
        }
      }

      if (ruleFileNames.length > 0) {
        this.uiManager.succeedSpinner(`Rule file copying complete. Copied: ${filesCopied}, Skipped: ${filesSkipped}.`);
      } else {
        this.uiManager.infoSpinner('No rule files specified to copy.');
      }

    } catch (error: unknown) {
      this.uiManager.failSpinner('An error occurred during rule file copying.');
      if (!String(error).includes('copying rule file')) {
        handleError(error, { context: 'copying rule files for mode operation' });
      }
      throw error;
    }
  }

  /**
   * Determines the user-specific configuration directory path for the application.
   * e.g., `~/.config/roo-init/` on Linux/macOS, `%APPDATA%/roo-init/config/` on Windows.
   *
   * @returns {string} The absolute path to the user configuration directory.
   */
  public getUserConfigPath(): string {
    const paths = envPaths(APP_NAME, { suffix: undefined });
    return paths.config;
  }

  /**
   * Ensures that the user-specific configuration directory and its 'rules' subdirectory exist.
   * Creates them if they don't exist.
   *
   * @returns {Promise<{configPath: string, rulesPath: string}>} A promise that resolves with the paths to the config and rules directories.
   * @throws {FileSystemError} If any file system error occurs during directory creation.
   */
  public async ensureUserConfigDirectories(): Promise<{ configPath: string; rulesPath: string }> {
    const userConfigPath = this.getUserConfigPath();
    const rulesPath = path.join(userConfigPath, 'rules');

    const relativeConfigPath = path.relative(process.cwd(), userConfigPath);
    const relativeRulesPath = path.relative(process.cwd(), rulesPath);

    this.uiManager.startSpinner(
      `Ensuring user config directories exist at ${this.uiManager.chalk.cyan(relativeConfigPath)}...`,
    );

    try {
      await fs.ensureDir(userConfigPath);
      this.uiManager.updateSpinnerText(
        `Ensured user config directory: ${this.uiManager.chalk.green(relativeConfigPath)}. Ensuring rules subdirectory...`,
      );
      await fs.ensureDir(rulesPath);
      this.uiManager.succeedSpinner(
        `User config directories ensured: ${this.uiManager.chalk.green(relativeConfigPath)} and ${this.uiManager.chalk.green(relativeRulesPath)}`,
      );
      return { configPath: userConfigPath, rulesPath };
    } catch (error: unknown) {
      this.uiManager.failSpinner(
        `Failed to ensure user config directories at ${this.uiManager.chalk.red(relativeConfigPath)}`,
      );
      const fsError = new FileSystemError(
        `Failed to ensure user config directories: ${error instanceof Error ? error.message : String(error)}`,
        userConfigPath,
      );
      handleError(fsError, { context: 'ensuring user config directories', uiManager: this.uiManager });
      throw fsError;
    }
  }

  /**
   * Reads user-defined modes and categories from `user-definitions.json`.
   *
   * @returns {Promise<UserDefinitions | null>} A promise that resolves with the parsed UserDefinitions object,
   * or null if the file doesn't exist or is invalid.
   * @throws {FileSystemError} If a critical error occurs during file reading (not related to file not existing or parsing).
   */
  public async readUserDefinitions(): Promise<UserDefinitions | null> {
    await this.ensureUserConfigDirectories(); // Ensure base directory exists
    const userDefinitionsPath = path.join(this.getUserConfigPath(), 'user-definitions.json');
    const relativePath = path.relative(process.cwd(), userDefinitionsPath);
    this.uiManager.startSpinner(`Reading user definitions from ${this.uiManager.chalk.cyan(relativePath)}...`);

    try {
      if (!await fs.pathExists(userDefinitionsPath)) {
        this.uiManager.infoSpinner(`User definitions file not found at ${this.uiManager.chalk.yellow(relativePath)}. Will be created if new definitions are added.`);
        return null;
      }

      const content = await fs.readJson(userDefinitionsPath);
      this.uiManager.succeedSpinner(`User definitions read successfully from ${this.uiManager.chalk.green(relativePath)}.`);
      return content as UserDefinitions;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.uiManager.infoSpinner(`User definitions file not found at ${this.uiManager.chalk.yellow(relativePath)}.`);
        return null;
      }
      this.uiManager.failSpinner(`Failed to read or parse user definitions from ${this.uiManager.chalk.red(relativePath)}.`);
      const fsError = new FileSystemError(
        `Failed to read user definitions from ${relativePath}: ${error.message}`,
        userDefinitionsPath,
      );
      handleError(fsError, { context: 'reading user definitions', uiManager: this.uiManager });
      return null;
    }
  }

  /**
   * Writes user-defined modes and categories to `user-definitions.json`.
   * This will overwrite the existing file.
   *
   * @param {UserDefinitions} data - The UserDefinitions object to write.
   * @returns {Promise<void>} A promise that resolves when the file has been written.
   * @throws {FileSystemError} If any file system error occurs during writing.
   */
  public async writeUserDefinitions(data: UserDefinitions): Promise<void> {
    await this.ensureUserConfigDirectories(); // Ensure base directory exists
    const userDefinitionsPath = path.join(this.getUserConfigPath(), 'user-definitions.json');
    const relativePath = path.relative(process.cwd(), userDefinitionsPath);
    this.uiManager.startSpinner(`Writing user definitions to ${this.uiManager.chalk.cyan(relativePath)}...`);

    try {
      await fs.ensureDir(path.dirname(userDefinitionsPath));
      await fs.writeJson(userDefinitionsPath, data, { spaces: 2 });
      this.uiManager.succeedSpinner(`User definitions successfully written to ${this.uiManager.chalk.green(relativePath)}.`);
    } catch (error: any) {
      this.uiManager.failSpinner(`Failed to write user definitions to ${this.uiManager.chalk.red(relativePath)}.`);
      const fsError = new FileSystemError(
        `Failed to write user definitions to ${relativePath}: ${error.message}`,
        userDefinitionsPath,
      );
      handleError(fsError, { context: 'writing user definitions', uiManager: this.uiManager });
      throw fsError;
    }
  }
}