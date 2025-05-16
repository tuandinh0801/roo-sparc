/**
 * Global errorHandler mock for tests
 * This centralizes the errorHandler mock implementation for consistent use across tests
 */
import { vi } from 'vitest';
import { mockHandleError } from '../globalUtilityMocks.js';

// Mock the process.exit method
// The spy itself is `mockProcessExit`, the actual call is `process.exit()`
export const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation((() => {
  // This implementation will be overridden in resetErrorHandlerMocks
  // to throw an error to catch unintended exits.
}) as (code?: string | number | null | undefined) => never); // Match original signature


// Create mock functions for UIManager methods that might be called by handleError
export const mockUiManagerFailSpinner = vi.fn();
export const mockUiManagerPrintError = vi.fn();
export const mockUiManagerPrintWarning = vi.fn();
export const mockUiManagerPrintAbortMessage = vi.fn();

// Mock the UIManager module as used by errorHandler.ts
vi.mock('../../../src/utils/uiManager.ts', () => ({
  __esModule: true,
  UIManager: {
    getInstance: () => ({
      failSpinner: mockUiManagerFailSpinner,
      printError: mockUiManagerPrintError,
      printWarning: mockUiManagerPrintWarning,
      printAbortMessage: mockUiManagerPrintAbortMessage,
    }),
  },
  uiManager: { // Singleton instance
    failSpinner: mockUiManagerFailSpinner,
    printError: mockUiManagerPrintError,
    printWarning: mockUiManagerPrintWarning,
    printAbortMessage: mockUiManagerPrintAbortMessage,
  }
}));

export const mockErrorHandler = {
  handleError: mockHandleError,
  uiFailSpinner: mockUiManagerFailSpinner,
  uiPrintError: mockUiManagerPrintError,
  uiPrintWarning: mockUiManagerPrintWarning,
  uiPrintAbortMessage: mockUiManagerPrintAbortMessage,
  processExit: mockProcessExit, // Export the spy on process.exit
};

export function resetErrorHandlerMocks() {
  mockHandleError.mockClear();
  mockHandleError.mockImplementation((error, options: { exit?: boolean; exitCode?: number; context?: string; uiManager?: any } = {}) => {
    const ui = options.uiManager || { // Use a simple structure for default UI calls within the mock
      printError: mockUiManagerPrintError,
      printAbortMessage: mockUiManagerPrintAbortMessage,
      printWarning: mockUiManagerPrintWarning,
      failSpinner: mockUiManagerFailSpinner,
    };

    if (error.isUserAbortError) { // Check for a property if UserAbortError is custom
      ui.printAbortMessage('User aborted.');
    } else {
      ui.printError(options.context ? `${error.message} (Context: ${options.context})` : error.message, 'Error');
    }
    if (options.exit) {
      process.exit(options.exitCode ?? 1);
    }
  });

  // Reset process.exit spy and make it throw to catch unintended calls during tests.
  mockProcessExit.mockClear().mockImplementation((code?: string | number | null | undefined) => {
    throw new Error(`process.exit(${String(code ?? '')}) called unexpectedly`); // Corrected this line
  });

  mockUiManagerFailSpinner.mockClear();
  mockUiManagerPrintError.mockClear();
  mockUiManagerPrintWarning.mockClear();
  mockUiManagerPrintAbortMessage.mockClear();
}

export function configureErrorHandler(options: {
  throwError?: boolean;
  customImpl?: (...args: any[]) => void;
}) {
  if (options.customImpl) {
    mockHandleError.mockImplementation(options.customImpl);
  } else if (options.throwError) {
    mockHandleError.mockImplementation((error) => {
      throw error;
    });
  }
}

// Initial reset
resetErrorHandlerMocks();
