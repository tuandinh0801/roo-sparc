import { vi, Mock } from 'vitest';
import { UIManager } from '../../../src/utils/uiManager.js'; // For type information

// Define all the spies for UIManager methods
export const mockStartSpinner = vi.fn();
export const mockStopSpinner = vi.fn();
export const mockSucceedSpinner = vi.fn();
export const mockFailSpinner = vi.fn();
export const mockUpdateSpinnerText = vi.fn();
export const mockInfoSpinner = vi.fn();
export const mockWarnSpinner = vi.fn();
export const mockPrintSuccess = vi.fn();
export const mockPrintError = vi.fn();
export const mockPrintWarning = vi.fn();
export const mockPrintInfo = vi.fn();
export const mockPrintBanner = vi.fn();
export const mockPrintAbortMessage = vi.fn();
export const mockPromptInput = vi.fn();
export const mockPromptList = vi.fn();
export const mockPromptCheckbox = vi.fn();
export const mockPromptConfirm = vi.fn();
export const mockPromptEditor = vi.fn();
export const mockDisplayTable = vi.fn();
export const mockShowMessage = vi.fn();

// This is the mock UIManager class that will be used by vi.mock
export class MockUIManager { // Removed "implements UIManager"
  startSpinner = mockStartSpinner;
  stopSpinner = mockStopSpinner;
  succeedSpinner = mockSucceedSpinner;
  failSpinner = mockFailSpinner;
  updateSpinnerText = mockUpdateSpinnerText;
  infoSpinner = mockInfoSpinner;
  warnSpinner = mockWarnSpinner;
  printSuccess = mockPrintSuccess;
  printError = mockPrintError;
  printWarning = mockPrintWarning;
  printInfo = mockPrintInfo;
  printBanner = mockPrintBanner;
  printAbortMessage = mockPrintAbortMessage;
  promptInput = mockPromptInput;
  promptList = mockPromptList;
  promptCheckbox = mockPromptCheckbox;
  promptConfirm = mockPromptConfirm;
  promptEditor = mockPromptEditor;
  displayTable = mockDisplayTable;
  showMessage = mockShowMessage;

  // Chalk is an instance property, so we can mock it if needed, or let it be the real one
  // For simplicity, we'll let it be the real one unless tests require specific chalk behavior mocking.
  chalk: UIManager['chalk']; // Match the type from the original UIManager
  spinner: UIManager['spinner']; // Keep it public for the mock
  inquirer: UIManager['inquirer'];


  constructor() {

    const actualChalk = require('chalk'); // Synchronous import for CJS chalk
    this.chalk = actualChalk;
    this.spinner = null;
    const actualInquirer = require('inquirer');
    this.inquirer = actualInquirer;
    // The constructor can be a spy if we need to assert its calls
    // For now, it just assigns the spies.
    return this;
  }
}

// Export an instance for convenience in tests that don't need to check constructor calls
// but need to access the spies.
export const mockUIManager = new MockUIManager() as unknown as MockUIManager & Record<keyof UIManager, Mock>;


export function resetUIManagerMocks() {
  mockStartSpinner.mockClear().mockReturnThis();
  mockStopSpinner.mockClear().mockReturnThis();
  mockSucceedSpinner.mockClear().mockReturnThis();
  mockFailSpinner.mockClear().mockReturnThis();
  mockUpdateSpinnerText.mockClear();
  mockInfoSpinner.mockClear().mockReturnThis();
  mockWarnSpinner.mockClear().mockReturnThis();
  mockPrintSuccess.mockClear();
  mockPrintError.mockClear();
  mockPrintWarning.mockClear();
  mockPrintInfo.mockClear();
  mockPrintBanner.mockClear();
  mockPrintAbortMessage.mockClear();
  mockPromptInput.mockClear().mockResolvedValue('default input');
  mockPromptList.mockClear().mockResolvedValue('default list choice');
  mockPromptCheckbox.mockClear().mockResolvedValue(['default checkbox choice']);
  mockPromptConfirm.mockClear().mockResolvedValue(true);
  mockPromptEditor.mockClear().mockResolvedValue('default editor text');
  mockDisplayTable.mockClear();
  mockShowMessage.mockClear();
}

export function configureUIManagerPrompts(config: {
  confirmSelection?: boolean;
  listSelection?: string | string[];
  checkboxSelection?: string[];
  inputResponse?: string;
  editorResponse?: string;
}) {
  if (config.confirmSelection !== undefined) {
    mockPromptConfirm.mockResolvedValue(config.confirmSelection);
  }
  if (config.listSelection !== undefined) {
    mockPromptList.mockResolvedValue(config.listSelection);
  }
  if (config.checkboxSelection !== undefined) {
    mockPromptCheckbox.mockResolvedValue(config.checkboxSelection);
  }
  if (config.inputResponse !== undefined) {
    mockPromptInput.mockResolvedValue(config.inputResponse);
  }
  if (config.editorResponse !== undefined) {
    mockPromptEditor.mockResolvedValue(config.editorResponse);
  }
}

// Call reset initially to set default mock behaviors
resetUIManagerMocks();
