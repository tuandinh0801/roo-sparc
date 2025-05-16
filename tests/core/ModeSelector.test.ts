import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest';
import { ModeSelector } from '../../src/core/ModeSelector.js';
import type { CategoryDefinition as Category, ModeDefinition as Mode } from '../../src/types/domain.js';
import type { UIManager } from '../../src/utils/uiManager.js';

// Import centralized mocks
import {
  mockUiPromptList,
  mockUiPromptCheckbox,
  mockUiPromptConfirm,
  mockUiPrintInfo,
  mockUiPrintWarning,
} from '../setup/globalUtilityMocks.js';

// Import test data factory
import { createTestCategory, createTestMode } from '../fixtures/test-data-factory.js';


// Remove local vi.mock for UIManager as centralized mock is used.


// Create test data using the factory
let mockCategories: Category[];
let mockModes: Mode[];


describe('ModeSelector', () => {
  let modeSelector: ModeSelector;

  beforeEach(() => {
    vi.clearAllMocks(); // Clear all mocks
    // Reset imported spies
    mockUiPromptList.mockReset();
    mockUiPromptCheckbox.mockReset();
    mockUiPromptConfirm.mockReset();
    mockUiPrintInfo.mockReset();
    mockUiPrintWarning.mockReset();
    // mockUiPrintError.mockReset(); // if imported
    // mockUiPrintSuccess.mockReset(); // if imported
    // resetDefinitionLoaderMocks(); // Reset if DefinitionLoader was used

    // Re-create test data for each test to ensure isolation
    mockCategories = [
      createTestCategory({ slug: 'cat1', name: 'Category 1', description: 'Description for Cat 1' }),
      createTestCategory({ slug: 'cat2', name: 'Category 2', description: 'Description for Cat 2' }),
      createTestCategory({ slug: 'cat3', name: 'Category 3 No Modes', description: 'Description for Cat 3' }),
    ];

    mockModes = [
      createTestMode({ slug: 'mode1-cat1', name: 'Mode 1 (Cat 1)', description: 'Desc for Mode 1 Cat 1', categorySlugs: ['cat1'], associatedRuleFiles: [] }),
      createTestMode({ slug: 'mode2-cat1', name: 'Mode 2 (Cat 1)', description: 'Desc for Mode 2 Cat 1', categorySlugs: ['cat1'], associatedRuleFiles: [] }),
      createTestMode({ slug: 'mode1-cat2', name: 'Mode 1 (Cat 2)', description: 'Desc for Mode 1 Cat 2', categorySlugs: ['cat2'], associatedRuleFiles: [] }),
    ];

    // Instantiate ModeSelector with live categories/modes and the mock UIManager
    // Cast mockUIManager as it's a mock object, not a true UIManager instance.
    // Construct a mock UIManager instance using the imported spies
    const mockUIManagerInstance = {
      // chalk: actualChalk, // If chalk is used directly by ModeSelector and needs to be part of the interface
      printBanner: vi.fn(), // Add other methods if ModeSelector uses them directly
      startSpinner: vi.fn(),
      stopSpinner: vi.fn(),
      succeedSpinner: vi.fn(),
      failSpinner: vi.fn(),
      updateSpinnerText: vi.fn(),
      infoSpinner: vi.fn(),
      warnSpinner: vi.fn(),
      printSuccess: vi.fn(),
      printError: vi.fn(),
      printWarning: mockUiPrintWarning,
      printInfo: mockUiPrintInfo,
      printAbortMessage: vi.fn(),
      promptInput: vi.fn(),
      promptList: mockUiPromptList,
      promptCheckbox: mockUiPromptCheckbox,
      promptConfirm: mockUiPromptConfirm,
      promptEditor: vi.fn(),
      displayTable: vi.fn(),
      showMessage: vi.fn(),
    } as unknown as UIManager;
    modeSelector = new ModeSelector(mockCategories, mockModes, mockUIManagerInstance);
  });

  describe('selectModesInteractively', () => {
    it('should return selected mode slugs when user selects one mode from one category and stops', async() => {
      mockUiPromptList.mockResolvedValueOnce('Category 1'); // First call: select category
      mockUiPromptCheckbox.mockResolvedValueOnce(['mode1-cat1']); // Second call: select modes from Category 1
      mockUiPromptConfirm.mockResolvedValueOnce(false); // Third call: do not continue

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1']);
      expect(mockUiPromptList).toHaveBeenCalledTimes(1);
      expect(mockUiPromptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiPromptConfirm).toHaveBeenCalledTimes(1);
    });

    it('should return selected mode slugs when user selects multiple modes from one category and stops', async() => {
      mockUiPromptList.mockResolvedValueOnce('Category 1');
      mockUiPromptCheckbox.mockResolvedValueOnce(['mode1-cat1', 'mode2-cat1']);
      mockUiPromptConfirm.mockResolvedValueOnce(false);

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1', 'mode2-cat1']);
      expect(mockUiPromptList).toHaveBeenCalledTimes(1);
      expect(mockUiPromptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiPromptConfirm).toHaveBeenCalledTimes(1);
    });

    it('should return selected mode slugs from multiple categories', async() => {
      mockUiPromptList
        .mockResolvedValueOnce('Category 1') // Select Cat 1
        .mockResolvedValueOnce('Category 2'); // Select Cat 2
      mockUiPromptCheckbox
        .mockResolvedValueOnce(['mode1-cat1'])  // Select modes from Cat 1
        .mockResolvedValueOnce(['mode1-cat2']);  // Select modes from Cat 2
      mockUiPromptConfirm
        .mockResolvedValueOnce(true)           // Choose to continue
        .mockResolvedValueOnce(false);          // Choose not to continue

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1', 'mode1-cat2']);
      expect(mockUiPromptList).toHaveBeenCalledTimes(2);
      expect(mockUiPromptCheckbox).toHaveBeenCalledTimes(2);
      expect(mockUiPromptConfirm).toHaveBeenCalledTimes(2);
    });

    it('should return an empty array if no modes are selected from a category and user stops', async() => {
      mockUiPromptList.mockResolvedValueOnce('Category 1');
      mockUiPromptCheckbox.mockResolvedValueOnce([]); // No modes selected
      mockUiPromptConfirm.mockResolvedValueOnce(false);

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      expect(mockUiPromptList).toHaveBeenCalledTimes(1);
      expect(mockUiPromptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiPromptConfirm).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if user cancels category selection', async() => {
      mockUiPromptList.mockResolvedValueOnce(null);

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      expect(mockUiPromptList).toHaveBeenCalledTimes(1);
      expect(mockUiPromptCheckbox).not.toHaveBeenCalled();
      expect(mockUiPromptConfirm).not.toHaveBeenCalled();
      expect(mockUiPrintInfo).toHaveBeenCalledWith('Category selection cancelled.');
    });


    it('should return an empty array if user cancels mode selection from a category and then stops', async() => {
      mockUiPromptList.mockResolvedValueOnce('Category 1'); // Select category
      mockUiPromptCheckbox.mockRejectedValueOnce(new Error('User cancelled mode selection')); // Cancel mode selection
      mockUiPromptConfirm.mockResolvedValueOnce(false); // Stop

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]); // No modes should be added
      expect(mockUiPromptList).toHaveBeenCalledTimes(1);
      expect(mockUiPromptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiPromptConfirm).toHaveBeenCalledTimes(1);
      expect(mockUiPrintInfo).toHaveBeenCalledWith('Mode selection from category Category 1 cancelled.');
    });

    it('should handle category with no modes gracefully and allow continuing or stopping', async() => {
      mockUiPromptList.mockResolvedValueOnce('Category 3 No Modes'); // Select category with no modes
      mockUiPromptConfirm.mockResolvedValueOnce(false); // Choose not to continue

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      expect(mockUiPromptList).toHaveBeenCalledTimes(1);
      expect(mockUiPromptCheckbox).not.toHaveBeenCalled(); // Not called for empty category
      expect(mockUiPromptConfirm).toHaveBeenCalledTimes(1);
      expect(mockUiPrintWarning).toHaveBeenCalledWith('No modes available in category: Category 3 No Modes');
    });

    it('should handle "no modes selected" overall if user navigates but selects nothing and stops', async() => {
      mockUiPromptList
        .mockResolvedValueOnce('Category 1') // Select Cat 1
        .mockResolvedValueOnce('Category 2'); // Select Cat 2
      mockUiPromptCheckbox
        .mockResolvedValueOnce([])             // Select no modes from Cat 1
        .mockResolvedValueOnce([]);             // Select no modes from Cat 2
      mockUiPromptConfirm
        .mockResolvedValueOnce(true)            // Choose to continue
        .mockResolvedValueOnce(false);           // Choose not to continue

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      expect(mockUiPromptList).toHaveBeenCalledTimes(2);
      expect(mockUiPromptCheckbox).toHaveBeenCalledTimes(2);
      expect(mockUiPromptConfirm).toHaveBeenCalledTimes(2);
    });

    it('should correctly form choices for category prompt', async() => {
      mockUiPromptList.mockResolvedValueOnce('Category 1');
      mockUiPromptCheckbox.mockResolvedValueOnce([]);
      mockUiPromptConfirm.mockResolvedValueOnce(false);

      await modeSelector.selectModesInteractively();

      expect(mockUiPromptList).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Select a category:',
        choices: [
          { name: 'Category 1 - Description for Cat 1', value: 'Category 1' },
          { name: 'Category 2 - Description for Cat 2', value: 'Category 2' },
          { name: 'Category 3 No Modes - Description for Cat 3', value: 'Category 3 No Modes' },
        ]
      }));
    });

    it('should correctly form choices for mode prompt', async() => {
      mockUiPromptList.mockResolvedValueOnce('Category 1'); // User selects 'Category 1'
      mockUiPromptCheckbox.mockResolvedValueOnce(['mode1-cat1']);   // User selects 'mode1-cat1'
      mockUiPromptConfirm.mockResolvedValueOnce(false);            // User stops

      await modeSelector.selectModesInteractively();

      expect(mockUiPromptCheckbox).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Select modes from Category 1: (Navigate with arrows, <space> to select, <enter> to confirm)',
        choices: [
          { name: 'Mode 1 (Cat 1) (mode1-cat1) - Desc for Mode 1 Cat 1', value: 'mode1-cat1', short: 'Mode 1 (Cat 1)' },
          { name: 'Mode 2 (Cat 1) (mode2-cat1) - Desc for Mode 2 Cat 1', value: 'mode2-cat1', short: 'Mode 2 (Cat 1)' },
        ]
      }));
    });

    it('should stop asking to continue if only one category exists', async() => {
      const singleCategorySelector = new ModeSelector(
        [mockCategories[0]], // Only Category 1
        mockModes.filter(m => m.categorySlugs.includes('cat1')),
        {
          printWarning: mockUiPrintWarning,
          printInfo: mockUiPrintInfo,
          promptList: mockUiPromptList,
          promptCheckbox: mockUiPromptCheckbox,
          promptConfirm: mockUiPromptConfirm,
          // Add other methods from UIManager interface if they are called by ModeSelector
        } as unknown as UIManager
      );
      mockUiPromptList.mockResolvedValueOnce('Category 1');
      mockUiPromptCheckbox.mockResolvedValueOnce(['mode1-cat1']);

      const selectedModes = await singleCategorySelector.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1']);
      expect(mockUiPromptList).toHaveBeenCalledTimes(1);
      expect(mockUiPromptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiPromptConfirm).not.toHaveBeenCalled(); // Key check
    });

  });

  describe('selectModesNonInteractively', () => {
    beforeEach(() => {
      // Spies are reset in the top-level beforeEach,
      // specific mockClear here might be redundant unless particular test sequences require it.
      // For now, relying on the global beforeEach reset.
      // mockUiPromptConfirm.mockClear();
      // mockUiPromptList.mockClear();
      // mockUiPromptCheckbox.mockClear();
    });

    it('should return mode slugs specified by --modes flag', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1,mode2-cat1' });
      expect(result.selectedModes).toEqual(['mode1-cat1', 'mode2-cat1']);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return mode slugs from a category specified by --category flag', async() => {
      const result = await modeSelector.selectModesNonInteractively({ category: 'cat1' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return unique mode slugs from both --modes and --category flags', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1', category: 'cat2' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode1-cat2']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should handle overlapping slugs between --modes and --category, returning unique modes', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1,mode1-cat2', category: 'cat1' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode1-cat2', 'mode2-cat1']));
      expect(result.selectedModes.length).toBe(3);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return invalid slugs if --modes contains non-existent slugs', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1,invalid-mode,another-invalid' });
      expect(result.selectedModes).toEqual(['mode1-cat1']);
      expect(result.invalidModeSlugs).toEqual(['invalid-mode', 'another-invalid']);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return invalid category slugs if --category contains non-existent slugs', async() => {
      const result = await modeSelector.selectModesNonInteractively({ category: 'cat1,invalid-cat,another-invalid-cat' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual(['invalid-cat', 'another-invalid-cat']);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should handle both valid and invalid slugs for --modes and --category', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1,invalid-mode', category: 'cat2,invalid-cat' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode1-cat2']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual(['invalid-mode']);
      expect(result.invalidCategorySlugs).toEqual(['invalid-cat']);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes and no invalids if --modes is an empty string', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: '' });
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes and no invalids if --category is an empty string', async() => {
      const result = await modeSelector.selectModesNonInteractively({ category: '' });
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes if both --modes and --category are empty strings', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: '', category: '' });
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes if no flags are provided (options object is empty)', async() => {
      const result = await modeSelector.selectModesNonInteractively({});
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes if --modes is undefined', async() => {
      const result = await modeSelector.selectModesNonInteractively({ category: 'cat1' }); // modes is undefined
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
    });

    it('should return empty selectedModes if --category is undefined', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1' }); // category is undefined
      expect(result.selectedModes).toEqual(['mode1-cat1']);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
    });

    it('should handle comma-separated slugs with extra spaces for --modes', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: ' mode1-cat1 , mode2-cat1 ' });
      expect(result.selectedModes).toEqual(['mode1-cat1', 'mode2-cat1']);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
    });

    it('should handle comma-separated slugs with extra spaces for --category', async() => {
      const result = await modeSelector.selectModesNonInteractively({ category: ' cat1 , cat2 ' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1', 'mode1-cat2']));
      expect(result.selectedModes.length).toBe(3);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
    });

    it('should return modes from multiple categories specified in --category', async() => {
      const result = await modeSelector.selectModesNonInteractively({ category: 'cat1,cat2' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1', 'mode1-cat2']));
      expect(result.selectedModes.length).toBe(3);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
    });

    it('should not call interactive prompts when non-interactive flags are used', async() => {
      await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1' });
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });
  });
});