
import chalk from 'chalk';
import boxen, { Options as BoxenOptions } from 'boxen';
import ora, { Ora } from 'ora';
import Table from 'cli-table3';
import { pastel } from 'gradient-string';
import inquirer, {
  QuestionCollection,
  InputQuestionOptions,
  ListQuestionOptions,
  CheckboxQuestionOptions,
  ConfirmQuestionOptions,
  EditorQuestionOptions,
  Answers
} from 'inquirer';

type ChalkInstance = typeof chalk;
// BoxenOptions is now directly imported

/**
 * @file uiManager.ts
 * @description Manages UI elements like spinners, prompts, and styled messages.
 */

export class UIManager {
  public chalk: ChalkInstance;
  private spinner: Ora | null = null; // Add ora instance
  private inquirer: typeof inquirer;

  constructor() {
    this.chalk = chalk;
    this.inquirer = inquirer;
  }

  // --- Banner ---
  /**
   * Prints a colorful ASCII banner with gradient effects.
   */
  public printBanner(): void {
    const banner = `

██████╗  ██████╗  ██████╗     ██╗███╗   ██╗██╗████████╗     ██████╗██╗     ██╗
██╔══██╗██╔═══██╗██╔═══██╗    ██║████╗  ██║██║╚══██╔══╝    ██╔════╝██║     ██║
██████╔╝██║   ██║██║   ██║    ██║██╔██╗ ██║██║   ██║       ██║     ██║     ██║
██╔══██╗██║   ██║██║   ██║    ██║██║╚██╗██║██║   ██║       ██║     ██║     ██║
██║  ██║╚██████╔╝╚██████╔╝    ██║██║ ╚████║██║   ██║       ╚██████╗███████╗██║
╚═╝  ╚═╝ ╚═════╝  ╚═════╝     ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝        ╚═════╝╚══════╝╚═╝

    `;

    const styledBanner = boxen(pastel(banner), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    });

    console.log(styledBanner);
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

  /**
   * Updates the text of the current spinner.
   * @param {string} newText - The new text to display.
   */
  public updateSpinnerText(newText: string): void {
    if (this.spinner) {
      this.spinner.text = newText;
    }
  }

  /**
   * Stops the current spinner and marks it with an informational message.
   * @param {string} [text] - Optional text to display.
   */
  public infoSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.info(text);
      this.spinner = null;
    }
  }

  /**
   * Stops the current spinner and marks it with a warning message.
   * @param {string} [text] - Optional text to display.
   */
  public warnSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.warn(text);
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

  // --- Prompt Methods ---

  /**
   * Prompts the user for input.
   * @param {Omit<InputQuestionOptions, 'name' | 'type'> & { message: string }} options - Options for the input prompt, including the message to display.
   * @returns {Promise<string>} A promise that resolves with the user's input.
   */
  public async promptInput(options: Omit<InputQuestionOptions, 'name' | 'type'> & { message: string }): Promise<string> {
    const question: InputQuestionOptions = {
      type: 'input',
      name: 'userInput',
      ...options,
    };
    const answers: Answers = await this.inquirer.prompt([question]);
    return answers.userInput as string;
  }

  /**
   * Prompts the user to select an item from a list.
   * @template T The type of the choice values.
   * @param {Omit<ListQuestionOptions, 'name' | 'type'> & { message: string; choices: any[] }} options - Options for the list prompt, including the message and choices.
   * @returns {Promise<T>} A promise that resolves with the user's selected item.
   */
  public async promptList<T = string>(options: Omit<ListQuestionOptions, 'name' | 'type'> & { message: string; choices: any[] }): Promise<T> {
    const question: ListQuestionOptions = {
      type: 'list',
      name: 'userChoice',
      ...options,
    };
    const answers: Answers = await this.inquirer.prompt([question]);
    return answers.userChoice as T;
  }

  /**
   * Prompts the user to select multiple items from a list.
   * @template T The type of the choice values.
   * @param {Omit<CheckboxQuestionOptions, 'name' | 'type'> & { message: string; choices: any[] }} options - Options for the checkbox prompt, including the message and choices.
   * @returns {Promise<T[]>} A promise that resolves with the user's selected items.
   */
  public async promptCheckbox<T = string>(options: Omit<CheckboxQuestionOptions, 'name' | 'type'> & { message: string; choices: any[] }): Promise<T[]> {
    const question: CheckboxQuestionOptions = {
      type: 'checkbox',
      name: 'userChoices',
      ...options,
    };
    const answers: Answers = await this.inquirer.prompt([question]);
    return answers.userChoices as T[];
  }

  /**
   * Prompts the user for a yes/no confirmation.
   * @param {Omit<ConfirmQuestionOptions, 'name' | 'type'> & { message: string }} options - Options for the confirm prompt, including the message to display.
   * @returns {Promise<boolean>} A promise that resolves with the user's confirmation (true for yes, false for no).
   */
  public async promptConfirm(options: Omit<ConfirmQuestionOptions, 'name' | 'type'> & { message: string }): Promise<boolean> {
    const question: ConfirmQuestionOptions = {
      type: 'confirm',
      name: 'userConfirmation',
      ...options,
    };
    const answers: Answers = await this.inquirer.prompt([question]);
    return answers.userConfirmation as boolean;
  }

  /**
   * Prompts the user to input text using an editor.
   * @param {Omit<EditorQuestionOptions, 'name' | 'type'> & { message: string }} options - Options for the editor prompt, including the message to display.
   * @returns {Promise<string>} A promise that resolves with the user's editor input.
   */
  public async promptEditor(options: Omit<EditorQuestionOptions, 'name' | 'type'> & { message: string }): Promise<string> {
    const question: EditorQuestionOptions = {
      type: 'editor',
      name: 'editorInput',
      ...options,
    };
    const answers: Answers = await this.inquirer.prompt([question]);
    return answers.editorInput as string;
  }

  // --- Table Display Method ---

  /**
   * Displays data in a formatted table.
   * @param {string[]} headers - An array of strings for table headers.
   * @param {(string | number | boolean | null | undefined)[][]} rows - An array of rows, where each row is an array of cell values.
   * @param {Table.TableConstructorOptions} [tableOptions] - Optional cli-table3 constructor options.
   */
  public displayTable(
    headers: string[],
    rows: (string | number | boolean | null | undefined)[][],
    tableOptions?: Table.TableConstructorOptions
  ): void {
    const table = new Table({
      head: headers.map(header => this.chalk.cyan(header)),
      colWidths: headers.map(() => 20), // Default column width, can be customized
      style: { 'head': [], 'border': [] }, // Basic styling, can be customized
      ...tableOptions,
    });

    rows.forEach(row => {
      table.push(row.map(cell => (cell === null || cell === undefined ? '' : String(cell))));
    });

    console.log(table.toString());
  }

  /**
   * Displays a message to the user, using appropriate styling based on type.
   * @param type - The type of message ('info', 'success', 'warning', 'error').
   * @param message - The message content.
   * @param title - Optional title for the message.
   */
  public showMessage(type: 'info' | 'success' | 'warning' | 'error', message: string, title?: string): void {
    switch (type) {
      case 'info':
        this.printInfo(message, title);
        break;
      case 'success':
        this.printSuccess(message, title);
        break;
      case 'warning':
        this.printWarning(message, title);
        break;
      case 'error':
        this.printError(message, title);
        break;
      default:
        // Fallback to console.log for unknown types, though TypeScript should prevent this.
        console.log(message);
        break;
    }
  }
}

// Export a singleton instance for convenience
export const uiManager = new UIManager();

// Export standalone functions for easier use in commands, using the singleton instance
export function displayTable(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  tableOptions?: Table.TableConstructorOptions
): void {
  uiManager.displayTable(headers, rows, tableOptions);
}

export function showMessage(
  type: 'info' | 'success' | 'warning' | 'error',
  message: string,
  title?: string
): void {
  uiManager.showMessage(type, message, title);
}