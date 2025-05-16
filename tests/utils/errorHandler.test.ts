/**
 * Tests for the error handler utility
 */
import { describe, it, expect, beforeEach, vi, MockInstance } from 'vitest';

// Unmock UIManager, errorHandler, and chalk to test with actual implementations
vi.unmock('../../src/utils/uiManager.js');
vi.unmock('../../src/utils/errorHandler.js');
vi.unmock('chalk');

import { UIManager } from '../../src/utils/uiManager.js'; // Import the UIManager CLASS
import {
  handleError, // Import the actual handleError
  UserAbortError,
  OverwriteConflictError,
  FileSystemError,
  DefinitionLoadError
} from '../../src/utils/errorHandler.js';

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation((code) => {
  return code as never;
});

describe('handleError', () => {
  let testUiManager: UIManager;
  let spyStopSpinner: MockInstance<[], void>;
  let spyPrintError: MockInstance<[message: string, title?: string], void>;
  let spyPrintWarning: MockInstance<[message: string, title?: string], void>;
  let spyPrintAbortMessage: MockInstance<[customMessage?: string, _error?: Error], void>;

  beforeEach(() => {
    vi.clearAllMocks(); // Clears all mocks, including process.exit

    testUiManager = new UIManager(); // Create a fresh instance for each test

    // Spy on the methods of this fresh instance
    spyStopSpinner = vi.spyOn(testUiManager, 'stopSpinner');
    spyPrintError = vi.spyOn(testUiManager, 'printError');
    spyPrintWarning = vi.spyOn(testUiManager, 'printWarning');
    spyPrintAbortMessage = vi.spyOn(testUiManager, 'printAbortMessage');

    // mockExit is already spied globally and cleared by vi.clearAllMocks()
  });

  it('should handle standard Error object, print error, and exit with code 1 by default', () => {
    const error = new Error('Standard error message');
    handleError(error, { exit: true, uiManager: testUiManager }); // Pass the spied instance
    expect(spyStopSpinner).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledWith(error.message, 'Error');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(spyPrintWarning).not.toHaveBeenCalled();
    expect(spyPrintAbortMessage).not.toHaveBeenCalled();
  });

  it('should handle standard Error object with a custom exit code', () => {
    const error = new Error('Custom exit code error');
    const exitCode = 2;
    handleError(error, { exit: true, exitCode, uiManager: testUiManager }); // Pass the spied instance

    expect(spyStopSpinner).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledWith(error.message, 'Error');
    expect(mockExit).toHaveBeenCalledWith(exitCode);
  });

  it('should handle string errors, print error, and exit with code 1 by default', () => {
    const errorMessage = 'This is a string error';
    handleError(errorMessage, { exit: true, uiManager: testUiManager }); // Pass the spied instance
    expect(spyStopSpinner).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledWith(errorMessage, 'Error');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle string errors with a custom exit code', () => {
    const errorMessage = 'String error with custom exit';
    const exitCode = 10;
    handleError(errorMessage, { exit: true, exitCode, uiManager: testUiManager }); // Pass the spied instance
    expect(spyStopSpinner).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledWith(errorMessage, 'Error');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(exitCode);
  });

  it('should handle unknown error types, print error, and exit with code 1 by default', () => {
    const unknownError = { data: 'some data' };
    handleError(unknownError, { exit: true, uiManager: testUiManager }); // Pass the spied instance
    expect(spyStopSpinner).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledWith(expect.stringContaining('An unexpected error occurred.'), 'Error');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle unknown error types with a custom exit code', () => {
    const unknownError = { data: 'some data' };
    const exitCode = 15;
    handleError(unknownError, { exit: true, exitCode, uiManager: testUiManager }); // Pass the spied instance
    expect(spyStopSpinner).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledWith(expect.stringContaining('An unexpected error occurred.'), 'Error');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(exitCode);
  });

  it('should handle DefinitionLoadError with file path', () => {
    const message = 'Failed to load definition file';
    const filePath = '/path/to/definition/file.json';
    const error = new DefinitionLoadError(message, filePath);
    handleError(error, { exit: true, uiManager: testUiManager }); // Pass the spied instance
    const expectedMessage = `${error.message}\n\nFile: \u001b[33m${filePath}\u001b[39m`;
    expect(spyStopSpinner).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledWith(expectedMessage, 'Definition Error');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle FileSystemError with file path', () => {
    const filePath = '/path/to/file.txt';
    const error = new FileSystemError('File system error', filePath);
    handleError(error, { exit: true, uiManager: testUiManager }); // Pass the spied instance
    const expectedMessage = `${error.message}\n\nFile: \u001b[33m${filePath}\u001b[39m`;
    expect(spyStopSpinner).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledWith(expectedMessage, 'File System Error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle FileSystemError with source and destination paths', () => {
    const sourcePath = 'src/old.txt';
    const destinationPath = 'dist/new.txt';
    const error = new FileSystemError('Failed to copy', undefined, sourcePath, destinationPath);
    handleError(error, { exit: true, uiManager: testUiManager }); // Pass the spied instance
    const expectedMessage = `${error.message}\n\nSource: \u001b[33m${sourcePath}\u001b[39m\nDestination: \u001b[33m${destinationPath}\u001b[39m`;
    expect(spyStopSpinner).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledWith(expectedMessage, 'File System Error');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle OverwriteConflictError and print warning', () => {
    const filePath = '/path/to/file.js';
    const error = new OverwriteConflictError('File already exists', filePath);
    handleError(error, { exit: true, uiManager: testUiManager }); // Pass the spied instance
    const expectedMessage = `${error.message}\n\nFile: \u001b[33m${filePath}\u001b[39m`;
    expect(spyStopSpinner).toHaveBeenCalledTimes(1);
    expect(spyPrintWarning).toHaveBeenCalledTimes(1);
    expect(spyPrintWarning).toHaveBeenCalledWith(expectedMessage, 'Conflict');
    expect(spyPrintError).not.toHaveBeenCalled();
    expect(spyPrintAbortMessage).not.toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle UserAbortError and print abort message', () => {
    const error = new UserAbortError('User aborted');
    handleError(error, { exit: true, uiManager: testUiManager }); // Pass the spied instance
    expect(spyStopSpinner).toHaveBeenCalledTimes(1);
    expect(spyPrintAbortMessage).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should not exit if options.exit is false or undefined', () => {
    const error = new Error('Test error without exit');
    handleError(error, { uiManager: testUiManager }); // Pass the spied instance, Default options, exit is false
    expect(spyStopSpinner).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledTimes(1);
    expect(mockExit).not.toHaveBeenCalled();

    handleError(error, { exit: false, uiManager: testUiManager }); // Pass the spied instance, Explicitly false
    expect(spyStopSpinner).toHaveBeenCalledTimes(2);
    expect(spyPrintError).toHaveBeenCalledTimes(2);
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should include context in details if provided', () => {
    const error = new Error('Error with context');
    const context = 'During initialization';
    handleError(error, { exit: true, context, uiManager: testUiManager }); // Pass the spied instance
    const expectedMessage = `${error.message}\n\nContext: ${context}`;
    expect(spyStopSpinner).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledTimes(1);
    expect(spyPrintError).toHaveBeenCalledWith(expectedMessage, 'Error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  // Note: Stack trace testing is removed as it's commented out in the source
  // and relies on environment variables, making it less suitable for standard unit tests.
});