import { UIManager, uiManager as uiManagerSingleton } from './uiManager.js';
import stripAnsi from 'strip-ansi';

/**
 * @file errorHandler.ts
 * @description Centralized error handling for the Roo CLI. Defines custom error types and a handler function.
 */

// --- Custom Error Classes ---

export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name; // Set the name to the class name
    // Ensure the prototype chain is correctly set up
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidFlagArgumentError extends BaseError {
  constructor(
    message: string,
    public invalidArgs?: string[], // Optional: specific invalid arguments
  ) {
    super(message);
  }
}

export class DefinitionLoadError extends BaseError {
  constructor(
    message: string,
    public filePath?: string,
  ) {
    super(message);
  }
}

export class FileSystemError extends BaseError {
  constructor(
    message: string,
    public filePath?: string,
    public sourcePath?: string,
    public destinationPath?: string,
  ) {
    super(message);
  }
}

export class OverwriteConflictError extends FileSystemError {
  constructor(
    message: string,
    public filePath: string,
  ) {
    super(message, filePath);
  }
}

export class UserAbortError extends BaseError {
  constructor(message = 'Operation aborted by user.') {
    super(message);
  }
}

// --- Error Handler Options ---

interface ErrorHandlerOptions {
  context?: string; // General context where the error occurred
  exit?: boolean; // Whether to exit the process after handling
  exitCode?: number; // Specific exit code (defaults to 1 if exit is true)
  uiManager?: UIManager; // Optional, for cases where it's already instantiated
}

// --- Error Handling Function ---

/**
 * Handles errors by logging them using UIManager and optionally exiting the process.
 * Recognizes specific custom error types for tailored feedback.
 *
 * @param {unknown} error - The error object or message.
 * @param {ErrorHandlerOptions} [options={}] - Options for handling the error.
 */
export function handleError(error: unknown, options: ErrorHandlerOptions = {}): void {
  const { exit = false, exitCode = 1, uiManager: providedUIManager } = options;
  const ui = providedUIManager || uiManagerSingleton; // Use provided or default to the imported singleton

  // Ensure any active spinner is stopped
  ui.stopSpinner();

  let title = 'Error';
  let message = 'An unexpected error occurred.';
  const details: string[] = [];
  let useWarning = false;
  let useAbort = false;

  if (options.context) {
    details.push(`Context: ${options.context}`);
  }

  if (error instanceof UserAbortError) {
    title = 'Aborted';
    message = error.message;
    useAbort = true;
  } else if (error instanceof OverwriteConflictError) {
    title = 'Conflict';
    message = error.message;
    if (error.filePath) {
      details.push(`File: ${ui.chalk.yellow(error.filePath)}`);
    }
    useWarning = true; // Use warning style for conflicts
  } else if (error instanceof DefinitionLoadError) {
    title = 'Definition Error';
    message = error.message;
    if (error.filePath) {
      details.push(`File: ${ui.chalk.yellow(error.filePath)}`);
    }
  } else if (error instanceof InvalidFlagArgumentError) {
    title = 'Invalid Command-Line Arguments';
    message = error.message; // The message from InvalidFlagArgumentError is already user-friendly
    if (error.invalidArgs && error.invalidArgs.length > 0) {
      details.push(`Invalid items: ${ui.chalk.yellow(error.invalidArgs.join(', '))}`);
    }
  } else if (error instanceof FileSystemError) {
    title = 'File System Error';
    const lowerCaseMessage = error.message.toLowerCase();

    if (lowerCaseMessage.includes('permission denied') || lowerCaseMessage.includes('eacces')) {
      message = 'Permission denied. Please check write permissions.';
    } else if (lowerCaseMessage.includes('disk full') || lowerCaseMessage.includes('enospc') || lowerCaseMessage.includes('no space left on device')) {
      message = 'Disk full. Please free up some space and try again.';
    } else if (lowerCaseMessage.includes('enoent') || lowerCaseMessage.includes('no such file or directory')) {
      message = 'File or directory not found.';
    } else if (error.message.includes('Error copying')) { // Keep this for general copy errors if not caught above
      message = 'An error occurred while copying files.';
    } else {
      message = error.message; // Default to the original message if not specifically handled
    }

    // Always add details if they exist
    if (error.filePath) {
      details.push(`File: ${ui.chalk.yellow(error.filePath)}`);
    }
    if (error.sourcePath) {
      details.push(`Source: ${ui.chalk.yellow(error.sourcePath)}`);
    }
    if (error.destinationPath) {
      details.push(`Destination: ${ui.chalk.yellow(error.destinationPath)}`);
    }
  } else if (error instanceof Error) {
    // Generic Error
    message = error.message;
    // Optionally add stack trace for generic errors in debug mode (future enhancement)
    // if (process.env.DEBUG) { details.push(`Stack: ${error.stack}`); }
  } else if (typeof error === 'string') {
    // Plain string error
    message = error;
  }

  const fullMessage = details.length > 0 ? `${message}\n\n${details.join('\n')}` : message;

  // Display the message using the appropriate UI method
  if (useAbort) {
    ui.printAbortMessage('Initialization aborted by user.', error instanceof Error ? error : undefined);
  } else if (useWarning) {
    ui.printWarning(fullMessage, title);
  } else {
    ui.printError(fullMessage, title);
  }

  if (exit) {
    // Ensure the message is written to stderr directly for capture, especially in tests.
    // Construct a simple string representation of the error for stderr.
    let finalStderrMessage = `${title}: ${message}`;
    if (details.length > 0) {
      const plainDetails = details.map(d => stripAnsi(d)).join('\n');
      finalStderrMessage += `\n${plainDetails}`;
    }

    const plainErrorMessageForStdErr = stripAnsi(finalStderrMessage);

    // For E2E tests: ensure error messages are primarily routed via console.error for capture
    // and also directly to stderr.write for robustness.
    if (process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.VITEST_WORKER_ID) {
      console.error(plainErrorMessageForStdErr); // For capture if console.error is piped
      process.stderr.write(plainErrorMessageForStdErr + '\n'); // For direct capture

      // For E2E tests, also write to stdout with a marker for easier test assertions
      if (process.env.VITEST || process.env.VITEST_WORKER_ID) {
        console.log(`E2E_ERROR_OUTPUT: ${plainErrorMessageForStdErr}`);
      }
    } else {
      // For non-test environments, uiManager handles display.
      // If explicit stderr write is needed for non-test CLI usage beyond uiManager, add here.
      // Currently, uiManager's printError/Warning uses console.error/warn.
      process.stderr.write(plainErrorMessageForStdErr + '\n'); // Always write to stderr for CLI usage
    }

    // Use specific exit code if provided, otherwise default (usually 1)
    // For UserAbortError, the exit code should be 0, indicating a non-error termination.
    const finalExitCode = error instanceof UserAbortError ? 0 : exitCode;
    process.exit(finalExitCode);
  }
}