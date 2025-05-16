import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock the UIManager to test the actual implementation
vi.unmock('../../src/utils/uiManager.js');

import { UIManager } from '../../src/utils/uiManager.js';
import ora from 'ora'; // Will be mocked
import boxen from 'boxen'; // Import the actual path, it will be mocked
import inquirer from 'inquirer'; // Will be mocked

// Mock dependencies
const { mockOraInstance } = vi.hoisted(() => {
  return {
    mockOraInstance: {
      start: vi.fn().mockReturnThis(),
      stop: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
      text: '',
    }
  };
});
vi.mock('ora', () => ({
  default: vi.fn(() => mockOraInstance),
}));

// Mock boxen
// Define the spy that will hold our mock implementation and be used for assertions
const mockBoxenSpy = vi.fn((text, options) => `boxed(${text}, ${JSON.stringify(options)})`);
// The vi.mock factory for 'boxen' should just provide a placeholder vi.fn() for the default export.
// Its implementation (mockBoxenSpy) will be set in beforeEach.
vi.mock('boxen', () => ({
  default: vi.fn(),
}));

// Mock inquirer
const { mockPrompt } = vi.hoisted(() => {
  return { mockPrompt: vi.fn() };
});
vi.mock('inquirer', () => {
  return {
    default: {
      prompt: mockPrompt
    }
  };
});

// Mock @inquirer/testing and @inquirer/input
vi.mock('@inquirer/testing', () => ({
  render: vi.fn()
}));

vi.mock('@inquirer/input', () => ({
  default: vi.fn()
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

    // Set the implementation of the mocked 'boxen' to our spy
    // vi.mocked() is a Vitest utility to get the mocked function with correct typing
    if (boxen && typeof vi.mocked(boxen).mockImplementation === 'function') {
      vi.mocked(boxen).mockImplementation(mockBoxenSpy);
    }
    mockBoxenSpy.mockClear(); // Also clear the spy itself

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
      expect(mockBoxenSpy).toHaveBeenCalledWith(
        expect.stringContaining(testMessage), // Check if message is passed
        expect.objectContaining({ borderColor: 'green', title: expect.any(String) })
      );
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('boxed(')); // Check if boxen output is logged
    });

    it('printSuccess should handle missing title', () => {
      uiManager.printSuccess(testMessage);
      expect(mockBoxenSpy).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        expect.objectContaining({ borderColor: 'green', title: undefined }) // Title should be undefined
      );
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it('printError should call console.error with boxen output (red)', () => {
      uiManager.printError(testMessage, testTitle);
      expect(mockBoxenSpy).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        expect.objectContaining({ borderColor: 'red', title: expect.any(String) })
      );
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('boxed('));
    });

    it('printError should handle missing title', () => {
      uiManager.printError(testMessage);
      expect(mockBoxenSpy).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        expect.objectContaining({ borderColor: 'red', title: undefined })
      );
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
    });

    it('printWarning should call console.warn with boxen output (yellow)', () => {
      uiManager.printWarning(testMessage, testTitle);
      expect(mockBoxenSpy).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        expect.objectContaining({ borderColor: 'yellow', title: expect.any(String) })
      );
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
      expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('boxed('));
    });

    it('printWarning should handle missing title', () => {
      uiManager.printWarning(testMessage);
      expect(mockBoxenSpy).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        expect.objectContaining({ borderColor: 'yellow', title: undefined })
      );
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
    });

    it('printInfo should call console.log with boxen output (blue)', () => {
      uiManager.printInfo(testMessage, testTitle);
      expect(mockBoxenSpy).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        expect.objectContaining({ borderColor: 'blue', title: expect.any(String) })
      );
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('boxed('));
    });

    it('printInfo should handle missing title', () => {
      uiManager.printInfo(testMessage);
      expect(mockBoxenSpy).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        expect.objectContaining({ borderColor: 'blue', title: undefined })
      );
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it('printAbortMessage should call console.warn with specific boxen output (yellow)', () => {
      uiManager.printAbortMessage();
      expect(mockBoxenSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation aborted by user.'),
        expect.objectContaining({ borderColor: 'yellow', title: expect.stringContaining('Aborted') })
      );
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
      expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('boxed('));
    });
  });

  // --- Prompt Methods Tests ---
  describe('Prompt Methods', () => {
    // --- promptInput Tests ---
    describe('promptInput', () => {
      it('should display the message and return user input via mocked inquirer.prompt', async() => {
        const message = 'Enter your name:';
        const expectedInput = 'John Doe';

        // Configure the mock to return the expected value
        vi.mocked(inquirer.prompt).mockResolvedValueOnce({ userInput: expectedInput });

        // Call the method
        const inputPromise = uiManager.promptInput({ message });

        // Assert against the mock prompt function
        expect(mockPrompt).toHaveBeenCalledWith([
          expect.objectContaining({
            type: 'input',
            name: 'userInput',
            message,
          }),
        ]);

        const result = await inputPromise;
        expect(result).toBe(expectedInput);
      });
    });

    // --- promptList Tests ---
    describe('promptList', () => {
      it('should display choices and return selected item via mocked inquirer.prompt', async() => {
        const message = 'Select your favorite color:';
        const choices = [
          { name: 'Red', value: 'red' },
          { name: 'Green', value: 'green' },
          { name: 'Blue', value: 'blue' }
        ];
        const expectedChoice = 'green';

        // Configure the mock to return the expected value
        vi.mocked(inquirer.prompt).mockResolvedValueOnce({ userChoice: expectedChoice });

        // Call the method
        const listPromise = uiManager.promptList({ message, choices });

        // Assert against the mock prompt function
        expect(mockPrompt).toHaveBeenCalledWith([
          expect.objectContaining({
            type: 'list',
            name: 'userChoice',
            message,
            choices,
          }),
        ]);

        const result = await listPromise;
        expect(result).toBe(expectedChoice);
      });

      it.skip('should use @inquirer/testing for complex UI testing', async() => {
        // This would be a more complex test using @inquirer/testing
        // But we're skipping it for now to focus on the mock-based tests
      });
    });

    // --- promptCheckbox Tests ---
    describe('promptCheckbox', () => {
      it('should display choices and return selected items via mocked inquirer.prompt', async() => {
        const message = 'Select your favorite colors:';
        const choices = [
          { name: 'Red', value: 'red' },
          { name: 'Green', value: 'green' },
          { name: 'Blue', value: 'blue' }
        ];
        const expectedChoices = ['red', 'blue'];

        // Configure the mock to return the expected value
        vi.mocked(inquirer.prompt).mockResolvedValueOnce({ userChoices: expectedChoices });

        // Call the method
        const checkboxPromise = uiManager.promptCheckbox({ message, choices });

        // Assert against the mock prompt function
        expect(mockPrompt).toHaveBeenCalledWith([
          expect.objectContaining({
            type: 'checkbox',
            name: 'userChoices',
            message,
            choices,
          }),
        ]);

        const result = await checkboxPromise;
        expect(result).toEqual(expectedChoices);
      });
    });

    // --- promptConfirm Tests ---
    describe('promptConfirm', () => {
      it('should display confirmation message and return boolean via mocked inquirer.prompt', async() => {
        const message = 'Are you sure?';
        const expectedConfirmation = true;

        // Configure the mock to return the expected value
        vi.mocked(inquirer.prompt).mockResolvedValueOnce({ userConfirmation: expectedConfirmation });

        // Call the method
        const confirmPromise = uiManager.promptConfirm({ message });

        // Assert against the mock prompt function
        expect(mockPrompt).toHaveBeenCalledWith([
          expect.objectContaining({
            type: 'confirm',
            name: 'userConfirmation',
            message,
          }),
        ]);

        const result = await confirmPromise;
        expect(result).toBe(expectedConfirmation);
      });
    });

    // --- promptEditor Tests ---
    describe('promptEditor', () => {
      it('should display editor prompt and return edited text via mocked inquirer.prompt', async() => {
        const message = 'Edit your text:';
        const expectedText = 'This is my edited text.';

        // Configure the mock to return the expected value
        vi.mocked(inquirer.prompt).mockResolvedValueOnce({ editorInput: expectedText });

        // Call the method
        const editorPromise = uiManager.promptEditor({ message });

        // Assert against the mock prompt function
        expect(mockPrompt).toHaveBeenCalledWith([
          expect.objectContaining({
            type: 'editor',
            name: 'editorInput',
            message,
          }),
        ]);

        const result = await editorPromise;
        expect(result).toBe(expectedText);
      });
    });
  });
});