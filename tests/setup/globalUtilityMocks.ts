/**
 * Global Utility Mocks
 * This file serves as the main entry point for all global mocks used in tests.
 * It should be included in the Vitest setupFiles configuration.
 */

// Re-export all mocks for easy access
export * from './mocks/definitionLoader.mock.js';
export * from './mocks/fsExtra.mock.js'; // Add fsExtra mock

// Import the mocks to ensure they are initialized
// We will import the MockUIManager class specifically for the vi.mock factory
import './mocks/definitionLoader.mock.js';
import './mocks/fsExtra.mock.js'; // Add fsExtra mock

import { vi } from 'vitest';

vi.unmock('chalk'); // Ensure we get the real chalk for the mock setup
import actualChalk from 'chalk';

// --- UIManager Mock ---
export const mockUiPrintBanner = vi.fn();
export const mockUiStartSpinner = vi.fn();
export const mockUiStopSpinner = vi.fn();
export const mockUiSucceedSpinner = vi.fn();
export const mockUiFailSpinner = vi.fn();
export const mockUiUpdateSpinnerText = vi.fn();
export const mockUiInfoSpinner = vi.fn();
export const mockUiWarnSpinner = vi.fn();
export const mockUiPrintSuccess = vi.fn();
export const mockUiPrintError = vi.fn();
export const mockUiPrintWarning = vi.fn();
export const mockUiPrintInfo = vi.fn();
export const mockUiPrintAbortMessage = vi.fn();
export const mockUiPromptInput = vi.fn();
export const mockUiPromptList = vi.fn();
export const mockUiPromptCheckbox = vi.fn();
export const mockUiPromptConfirm = vi.fn().mockResolvedValue(true); // Default confirm
export const mockUiPromptEditor = vi.fn();
export const mockUiDisplayTable = vi.fn(); // For manageListModes/Categories
export const mockUiShowMessage = vi.fn(); // For manageListModes/Categories

vi.mock('../../src/utils/uiManager.js', () => ({
  __esModule: true,
  UIManager: vi.fn().mockImplementation(() => ({
    chalk: actualChalk, // Or a simplified mock chalk instance
    printBanner: mockUiPrintBanner,
    startSpinner: mockUiStartSpinner,
    stopSpinner: mockUiStopSpinner,
    succeedSpinner: mockUiSucceedSpinner,
    failSpinner: mockUiFailSpinner,
    updateSpinnerText: mockUiUpdateSpinnerText,
    infoSpinner: mockUiInfoSpinner,
    warnSpinner: mockUiWarnSpinner,
    printSuccess: mockUiPrintSuccess,
    printError: mockUiPrintError,
    printWarning: mockUiPrintWarning,
    printInfo: mockUiPrintInfo,
    printAbortMessage: mockUiPrintAbortMessage,
    promptInput: mockUiPromptInput,
    promptList: mockUiPromptList,
    promptCheckbox: mockUiPromptCheckbox,
    promptConfirm: mockUiPromptConfirm,
    promptEditor: mockUiPromptEditor,
    displayTable: mockUiDisplayTable,
    showMessage: mockUiShowMessage,
  })),
  // If your application code imports the singleton `uiManager` directly:
  uiManager: {
    chalk: actualChalk,
    printBanner: mockUiPrintBanner,
    startSpinner: mockUiStartSpinner,
    stopSpinner: mockUiStopSpinner,
    succeedSpinner: mockUiSucceedSpinner,
    failSpinner: mockUiFailSpinner,
    updateSpinnerText: mockUiUpdateSpinnerText,
    infoSpinner: mockUiInfoSpinner,
    warnSpinner: mockUiWarnSpinner,
    printSuccess: mockUiPrintSuccess,
    printError: mockUiPrintError,
    printWarning: mockUiPrintWarning,
    printInfo: mockUiPrintInfo,
    printAbortMessage: mockUiPrintAbortMessage,
    promptInput: mockUiPromptInput,
    promptList: mockUiPromptList,
    promptCheckbox: mockUiPromptCheckbox,
    promptConfirm: mockUiPromptConfirm,
    promptEditor: mockUiPromptEditor,
    displayTable: mockUiDisplayTable,
    showMessage: mockUiShowMessage,
  }
}));

// --- errorHandler Mock ---
export const mockHandleError = vi.fn();

vi.mock('../../src/utils/errorHandler.ts', async(importOriginal) => {
  const originalModule = await importOriginal() as any; // Cast to any
  return {
    ...originalModule, // Spread to keep original error classes (BaseError, etc.)
    handleError: mockHandleError,
  };
});

// --- Process Exit Mock ---
// Used to prevent tests from actually exiting the process
export const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

// --- Reset Function for Error Handler Mocks ---
export const resetErrorHandlerMocks = () => {
  mockHandleError.mockReset();
  mockProcessExit.mockReset();
};

// Mock console methods for all tests
export const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
export const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
export const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
export const mockConsoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});

// Mock other common modules used throughout the codebase
// ora spinner
vi.mock('ora', () => {
  const mockOraInstance = {
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    text: '',
  };

  return {
    default: vi.fn(() => mockOraInstance),
  };
});

// boxen for UI boxes
// Define mockBoxen directly in the factory to avoid hoisting issues
vi.mock('boxen', () => ({
  default: vi.fn((text, options) => `boxed(${text}, ${JSON.stringify(options)})`)
}));
// The exported mockBoxen can be removed if not used directly by tests,
// or it can be assigned if needed after the mock.
// For now, let's assume tests will import boxen and get the mock.
// If direct access to the mockBoxen spy is needed, it would require a different setup.

// inquirer for prompts
vi.mock('inquirer', () => {
  return {
    default: {
      prompt: vi.fn()
    }
  };
});

