import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  handleError,
  BaseError,
  DefinitionLoadError,
  FileSystemError,
  OverwriteConflictError,
  UserAbortError,
} from '../../src/utils/errorHandler.js';

// Mock UIManager and its methods
const mockStopSpinner = vi.fn();
const mockPrintError = vi.fn();
const mockPrintWarning = vi.fn();
const mockPrintAbortMessage = vi.fn();
const mockChalk = {
  red: { bold: vi.fn((text) => `red.bold(${text})`) },
  yellow: vi.fn((text) => `yellow(${text})`),
  gray: vi.fn((text) => `gray(${text})`),
};

vi.mock('../../src/utils/uiManager.js', () => ({
  UIManager: vi.fn().mockImplementation(() => ({
    stopSpinner: mockStopSpinner,
    printError: mockPrintError,
    printWarning: mockPrintWarning,
    printAbortMessage: mockPrintAbortMessage,
    chalk: mockChalk,
  })),
}));

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as (code?: string | number | null | undefined) => never);

describe('errorHandler', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  // No need for afterEach to restore mocks when using vi.mock

  it('should handle standard Error object, print error, and exit with code 1 by default', () => {
    const error = new Error('Standard error message');
    handleError(error, { exit: true }); // Explicitly request exit for testing
    expect(mockStopSpinner).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledWith(error.message, 'Error');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockPrintWarning).not.toHaveBeenCalled();
    expect(mockPrintAbortMessage).not.toHaveBeenCalled();
  });

  it('should handle standard Error object with a custom exit code', () => {
    const error = new Error('Custom exit code error');
    const exitCode = 5;
    handleError(error, { exit: true, exitCode });
    expect(mockStopSpinner).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledWith(error.message, 'Error');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(exitCode);
  });

  it('should handle string errors, print error, and exit with code 1 by default', () => {
    const errorMessage = 'This is a string error';
    handleError(errorMessage, { exit: true });
    expect(mockStopSpinner).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledWith(errorMessage, 'Error');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle string errors with a custom exit code', () => {
    const errorMessage = 'String error with custom exit';
    const exitCode = 10;
    handleError(errorMessage, { exit: true, exitCode });
    expect(mockStopSpinner).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledWith(errorMessage, 'Error');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(exitCode);
  });

  it('should handle unknown error types, print error, and exit with code 1 by default', () => {
    const unknownError = { data: 'some data' };
    handleError(unknownError, { exit: true });
    expect(mockStopSpinner).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledTimes(1);
    // Unknown errors are stringified implicitly by console functions, test the core message part
    expect(mockPrintError).toHaveBeenCalledWith(expect.stringContaining('An unexpected error occurred.'), 'Error');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle unknown error types with a custom exit code', () => {
    const unknownError = { data: 'some data' };
    const exitCode = 15;
    handleError(unknownError, { exit: true, exitCode });
    expect(mockStopSpinner).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledWith(expect.stringContaining('An unexpected error occurred.'), 'Error');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(exitCode);
  });

  it('should handle DefinitionLoadError with file path', () => {
    const filePath = 'definitions/modes.json';
    const error = new DefinitionLoadError('Failed to load', filePath);
    handleError(error, { exit: true });
    const expectedMessage = `${error.message}\n\nFile: yellow(${filePath})`;
    expect(mockStopSpinner).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledWith(expectedMessage, 'Definition Error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle FileSystemError with file path', () => {
    const filePath = 'src/some/file.ts';
    const error = new FileSystemError('Cannot read file', filePath);
    handleError(error, { exit: true });
    const expectedMessage = `${error.message}\n\nFile: yellow(${filePath})`;
    expect(mockStopSpinner).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledWith(expectedMessage, 'File System Error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle FileSystemError with source and destination paths', () => {
    const sourcePath = 'src/old.txt';
    const destPath = 'dist/new.txt';
    const error = new FileSystemError('Failed to copy', undefined, sourcePath, destPath);
    handleError(error, { exit: true });
    const expectedMessage = `${error.message}\n\nSource: yellow(${sourcePath})\nDestination: yellow(${destPath})`;
    expect(mockStopSpinner).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledWith(expectedMessage, 'File System Error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle OverwriteConflictError and print warning', () => {
    const filePath = 'config/existing.json';
    const error = new OverwriteConflictError('File already exists', filePath);
    handleError(error, { exit: true }); // Exit for testing consistency
    const expectedMessage = `${error.message}\n\nFile: yellow(${filePath})`;
    expect(mockStopSpinner).toHaveBeenCalledTimes(1);
    expect(mockPrintWarning).toHaveBeenCalledTimes(1);
    expect(mockPrintWarning).toHaveBeenCalledWith(expectedMessage, 'Conflict');
    expect(mockPrintError).not.toHaveBeenCalled();
    expect(mockPrintAbortMessage).not.toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle UserAbortError and print abort message', () => {
    const error = new UserAbortError();
    handleError(error, { exit: true }); // Exit for testing consistency
    expect(mockStopSpinner).toHaveBeenCalledTimes(1);
    expect(mockPrintAbortMessage).toHaveBeenCalledTimes(1);
    expect(mockPrintError).not.toHaveBeenCalled();
    expect(mockPrintWarning).not.toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1); // Default exit code
  });

  it('should not exit if options.exit is false or undefined', () => {
    const error = new Error('Do not exit');
    handleError(error); // Default options, exit is false
    expect(mockStopSpinner).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledTimes(1);
    expect(mockExit).not.toHaveBeenCalled();

    handleError(error, { exit: false }); // Explicitly false
    expect(mockStopSpinner).toHaveBeenCalledTimes(2);
    expect(mockPrintError).toHaveBeenCalledTimes(2);
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should include context in details if provided', () => {
    const error = new Error('Error with context');
    const context = 'During initialization';
    handleError(error, { exit: true, context });
    const expectedMessage = `${error.message}\n\nContext: ${context}`;
    expect(mockStopSpinner).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledTimes(1);
    expect(mockPrintError).toHaveBeenCalledWith(expectedMessage, 'Error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  // Note: Stack trace testing is removed as it's commented out in the source
  // and relies on environment variables, making it less suitable for standard unit tests.
});