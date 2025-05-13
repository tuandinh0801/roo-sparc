import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { UIManager } from '../../src/utils/uiManager.js';
import ora from 'ora';
import boxen from 'boxen';
import chalk from 'chalk'; // Import actual chalk for type reference if needed, but mock its methods

// --- Mocks ---

// Mock ora
const mockOraInstance = {
  start: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
  text: '', // Add text property if accessed
};
vi.mock('ora', () => ({
  default: vi.fn(() => mockOraInstance),
}));

// Mock boxen
vi.mock('boxen', () => ({
  default: vi.fn((text, options) => `boxed(${text}, ${JSON.stringify(options)})`),
}));

// Mock console methods
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock chalk methods used by UIManager (can be more specific if needed)
// We don't need to mock the chalk instance itself on UIManager because it's assigned in the constructor.
// Instead, we can spy on the methods of the actual chalk instance *after* UIManager is instantiated.
// Or, more simply for testing, verify the strings passed to console/boxen contain expected chalk codes (less robust)
// Let's stick to verifying the arguments passed to boxen/console, assuming chalk works.

describe('UIManager', () => {
  let uiManager: UIManager;

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
    uiManager = new UIManager(); // Create a new instance for each test
  });

  // --- Spinner Tests ---
  describe('Spinner Methods', () => {
    it('startSpinner should create and start an ora instance', () => {
      const text = 'Loading...';
      uiManager.startSpinner(text);
      expect(ora).toHaveBeenCalledWith(text);
      expect(mockOraInstance.start).toHaveBeenCalledTimes(1);
    });

    it('startSpinner should stop the previous spinner if one exists', () => {
      uiManager.startSpinner('First');
      expect(mockOraInstance.stop).not.toHaveBeenCalled();
      uiManager.startSpinner('Second');
      expect(mockOraInstance.stop).toHaveBeenCalledTimes(1); // Stopped the first one
      expect(ora).toHaveBeenCalledWith('Second');
      expect(mockOraInstance.start).toHaveBeenCalledTimes(2); // Started first and second
    });

    it('stopSpinner should stop the active spinner', () => {
      uiManager.startSpinner('Working...');
      uiManager.stopSpinner();
      expect(mockOraInstance.stop).toHaveBeenCalledTimes(1);
      // Check if spinner instance is cleared internally (optional, depends on need)
      // expect((uiManager as any).spinner).toBeNull();
    });

    it('stopSpinner should do nothing if no spinner is active', () => {
      uiManager.stopSpinner();
      expect(mockOraInstance.stop).not.toHaveBeenCalled();
    });

    it('succeedSpinner should call succeed on the active spinner', () => {
      const successText = 'Done!';
      uiManager.startSpinner('Processing...');
      uiManager.succeedSpinner(successText);
      expect(mockOraInstance.succeed).toHaveBeenCalledWith(successText);
      expect(mockOraInstance.stop).not.toHaveBeenCalled(); // succeed implies stop
    });

    it('succeedSpinner should do nothing if no spinner is active', () => {
      uiManager.succeedSpinner();
      expect(mockOraInstance.succeed).not.toHaveBeenCalled();
    });

    it('failSpinner should call fail on the active spinner', () => {
      const failText = 'Failed!';
      uiManager.startSpinner('Trying...');
      uiManager.failSpinner(failText);
      expect(mockOraInstance.fail).toHaveBeenCalledWith(failText);
      expect(mockOraInstance.stop).not.toHaveBeenCalled(); // fail implies stop
    });

    it('failSpinner should do nothing if no spinner is active', () => {
      uiManager.failSpinner();
      expect(mockOraInstance.fail).not.toHaveBeenCalled();
    });
  });

  // --- Message Printing Tests ---
  describe('Message Printing Methods', () => {
    const testMessage = 'Test message';
    const testTitle = 'Test Title';

    it('printSuccess should call console.log with boxen output (green)', () => {
      uiManager.printSuccess(testMessage, testTitle);
      expect(boxen).toHaveBeenCalledWith(
        expect.stringContaining(testMessage), // Check if message is passed
        expect.objectContaining({ borderColor: 'green', title: expect.any(String) })
      );
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('boxed(')); // Check if boxen output is logged
    });

    it('printSuccess should handle missing title', () => {
      uiManager.printSuccess(testMessage);
      expect(boxen).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        expect.objectContaining({ borderColor: 'green', title: undefined }) // Title should be undefined
      );
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it('printError should call console.error with boxen output (red)', () => {
      uiManager.printError(testMessage, testTitle);
      expect(boxen).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        expect.objectContaining({ borderColor: 'red', title: expect.any(String) })
      );
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('boxed('));
    });

    it('printError should handle missing title', () => {
      uiManager.printError(testMessage);
      expect(boxen).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        expect.objectContaining({ borderColor: 'red', title: undefined })
      );
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
    });

    it('printWarning should call console.warn with boxen output (yellow)', () => {
      uiManager.printWarning(testMessage, testTitle);
      expect(boxen).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        expect.objectContaining({ borderColor: 'yellow', title: expect.any(String) })
      );
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
      expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('boxed('));
    });

    it('printWarning should handle missing title', () => {
      uiManager.printWarning(testMessage);
      expect(boxen).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        expect.objectContaining({ borderColor: 'yellow', title: undefined })
      );
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
    });

    it('printInfo should call console.log with boxen output (blue)', () => {
      uiManager.printInfo(testMessage, testTitle);
      expect(boxen).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        expect.objectContaining({ borderColor: 'blue', title: expect.any(String) })
      );
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('boxed('));
    });

    it('printInfo should handle missing title', () => {
      uiManager.printInfo(testMessage);
      expect(boxen).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        expect.objectContaining({ borderColor: 'blue', title: undefined })
      );
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it('printAbortMessage should call console.warn with specific boxen output (yellow)', () => {
      uiManager.printAbortMessage();
      expect(boxen).toHaveBeenCalledWith(
        expect.stringContaining('Operation aborted by user.'),
        expect.objectContaining({ borderColor: 'yellow', title: expect.stringContaining('Aborted') })
      );
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
      expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('boxed('));
    });
  });
});