import chalk from 'chalk';
import boxen, { Options as BoxenOptions } from 'boxen';
import ora, { Ora } from 'ora'; // Import ora

type ChalkInstance = typeof chalk;
// BoxenOptions is now directly imported

/**
 * @file uiManager.ts
 * @description Manages UI elements like spinners, prompts, and styled messages.
 */

export class UIManager {
  public chalk: ChalkInstance;
  private spinner: Ora | null = null; // Add ora instance

  constructor() {
    this.chalk = chalk;
  }

  // --- Spinner Methods ---

  /**
   * Starts a spinner with the given text.
   * @param {string} text - The text to display next to the spinner.
   */
  public startSpinner(text: string): void {
    if (this.spinner) {
      this.spinner.stop();
    }
    this.spinner = ora(text).start();
  }

  /**
   * Stops the current spinner.
   */
  public stopSpinner(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Stops the current spinner and marks it as successful.
   * @param {string} [text] - Optional text to display upon success.
   */
  public succeedSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    }
  }

  /**
   * Stops the current spinner and marks it as failed.
   * @param {string} [text] - Optional text to display upon failure.
   */
  public failSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    }
  }

  // --- Message Printing Methods ---

  /**
   * Prints a success message styled with a green box.
   * @param {string} message - The main message content.
   * @param {string} [title] - Optional title for the message box.
   */
  public printSuccess(message: string, title?: string): void {
    const boxenOptions: BoxenOptions = {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
      title: title ? this.chalk.bold.green(title) : undefined,
      titleAlignment: 'center',
    };
    console.log(boxen(this.chalk.green(message), boxenOptions));
  }

  /**
   * Prints an error message styled with a red box.
   * @param {string} message - The main message content.
   * @param {string} [title] - Optional title for the message box.
   */
  public printError(message: string, title?: string): void {
    const boxenOptions: BoxenOptions = {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'red',
      title: title ? this.chalk.bold.red(title) : undefined,
      titleAlignment: 'center',
    };
    console.error(boxen(this.chalk.red(message), boxenOptions));
  }

  /**
   * Prints a warning message styled with a yellow box.
   * @param {string} message - The main message content.
   * @param {string} [title] - Optional title for the message box.
   */
  public printWarning(message: string, title?: string): void {
    const boxenOptions: BoxenOptions = {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'yellow',
      title: title ? this.chalk.bold.yellow(title) : undefined,
      titleAlignment: 'center',
    };
    console.warn(boxen(this.chalk.yellow(message), boxenOptions));
  }

  /**
   * Prints an informational message styled with a blue box.
   * @param {string} message - The main message content.
   * @param {string} [title] - Optional title for the message box.
   */
  public printInfo(message: string, title?: string): void {
    const boxenOptions: BoxenOptions = {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'blue',
      title: title ? this.chalk.bold.blue(title) : undefined,
      titleAlignment: 'center',
    };
    console.log(boxen(this.chalk.blue(message), boxenOptions));
  }
  /**
   * Prints a message indicating the user aborted the operation.
   * @param {string} [customMessage] - Optional custom message to display
   * @param {Error} [error] - Optional error object for additional context
   */
  public printAbortMessage(customMessage?: string, _error?: Error): void {
    const message = customMessage || 'Operation aborted by user.';
    const boxenOptions: BoxenOptions = {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'yellow',
      title: this.chalk.bold.yellow('Aborted'),
      titleAlignment: 'center',
    };
    console.warn(boxen(this.chalk.yellow(message), boxenOptions));
  }
}