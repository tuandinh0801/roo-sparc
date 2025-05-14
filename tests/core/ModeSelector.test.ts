import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
// Enquirer is no longer directly used by ModeSelector, UIManager is.
// import Enquirer from 'inquirer';
import { ModeSelector } from '../../src/core/ModeSelector.js';
import { CategoryDefinition as Category, ModeDefinition as Mode } from '../../src/types/domain.js';
import { UIManager } from '../../src/utils/uiManager.js';

// Mock UIManager methods that will be called by ModeSelector
const mockUiManager = {
  promptConfirm: vi.fn(),
  promptList: vi.fn(),
  promptCheckbox: vi.fn(),
  printWarning: vi.fn(),
  printInfo: vi.fn(),
  // Add other UIManager methods if they are called and need mocking
} as unknown as UIManager; // Cast to UIManager to satisfy constructor

// We don't need to mock 'inquirer' anymore at this level if ModeSelector only uses UIManager
// vi.mock('inquirer', () => { ... });

const mockCategories: Category[] = [
  { slug: 'cat1', name: 'Category 1', description: 'Description for Cat 1' },
  { slug: 'cat2', name: 'Category 2', description: 'Description for Cat 2' },
  { slug: 'cat3', name: 'Category 3 No Modes', description: 'Description for Cat 3' },
];

const mockModes: Mode[] = [
  { slug: 'mode1-cat1', name: 'Mode 1 (Cat 1)', description: 'Desc for Mode 1 Cat 1', categorySlugs: ['cat1'], associatedRuleFiles: [] },
  { slug: 'mode2-cat1', name: 'Mode 2 (Cat 1)', description: 'Desc for Mode 2 Cat 1', categorySlugs: ['cat1'], associatedRuleFiles: [] },
  { slug: 'mode1-cat2', name: 'Mode 1 (Cat 2)', description: 'Desc for Mode 1 Cat 2', categorySlugs: ['cat2'], associatedRuleFiles: [] },
];

// We don't need a direct mock for Enquirer.prompt anymore as ModeSelector uses UIManager.
// const mockedEnquirerPrompt = Enquirer.prompt as unknown as Mock;

describe('ModeSelector', () => {
  let modeSelector: ModeSelector;

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
    // Pass the mocked UIManager instance
    modeSelector = new ModeSelector(mockCategories, mockModes, mockUiManager);
  });

  describe('selectModesInteractively', () => {
    it('should return selected mode slugs when user selects one mode from one category and stops', async() => {
      (mockUiManager.promptList as Mock)
        .mockResolvedValueOnce('Category 1'); // First call: select category
      (mockUiManager.promptCheckbox as Mock)
        .mockResolvedValueOnce(['mode1-cat1']); // Second call: select modes from Category 1
      (mockUiManager.promptConfirm as Mock)
        .mockResolvedValueOnce(false); // Third call: do not continue

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1']);
      expect(mockUiManager.promptList).toHaveBeenCalledTimes(1);
      expect(mockUiManager.promptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiManager.promptConfirm).toHaveBeenCalledTimes(1);
    });

    it('should return selected mode slugs when user selects multiple modes from one category and stops', async() => {
      (mockUiManager.promptList as Mock)
        .mockResolvedValueOnce('Category 1');
      (mockUiManager.promptCheckbox as Mock)
        .mockResolvedValueOnce(['mode1-cat1', 'mode2-cat1']);
      (mockUiManager.promptConfirm as Mock)
        .mockResolvedValueOnce(false);

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1', 'mode2-cat1']);
      expect(mockUiManager.promptList).toHaveBeenCalledTimes(1);
      expect(mockUiManager.promptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiManager.promptConfirm).toHaveBeenCalledTimes(1);
    });

    it('should return selected mode slugs from multiple categories', async() => {
      (mockUiManager.promptList as Mock)
        .mockResolvedValueOnce('Category 1') // Select Cat 1
        .mockResolvedValueOnce('Category 2'); // Select Cat 2
      (mockUiManager.promptCheckbox as Mock)
        .mockResolvedValueOnce(['mode1-cat1'])  // Select modes from Cat 1
        .mockResolvedValueOnce(['mode1-cat2']);  // Select modes from Cat 2
      (mockUiManager.promptConfirm as Mock)
        .mockResolvedValueOnce(true)           // Choose to continue
        .mockResolvedValueOnce(false);          // Choose not to continue

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1', 'mode1-cat2']);
      expect(mockUiManager.promptList).toHaveBeenCalledTimes(2);
      expect(mockUiManager.promptCheckbox).toHaveBeenCalledTimes(2);
      expect(mockUiManager.promptConfirm).toHaveBeenCalledTimes(2);
    });

    it('should return an empty array if no modes are selected from a category and user stops', async() => {
      (mockUiManager.promptList as Mock)
        .mockResolvedValueOnce('Category 1');
      (mockUiManager.promptCheckbox as Mock)
        .mockResolvedValueOnce([]); // No modes selected
      (mockUiManager.promptConfirm as Mock)
        .mockResolvedValueOnce(false);

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      expect(mockUiManager.promptList).toHaveBeenCalledTimes(1);
      expect(mockUiManager.promptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiManager.promptConfirm).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if user cancels category selection', async() => {
      // Simulate cancellation by having promptList return null or undefined
      (mockUiManager.promptList as Mock).mockResolvedValueOnce(null);

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      expect(mockUiManager.promptList).toHaveBeenCalledTimes(1);
      expect(mockUiManager.promptCheckbox).not.toHaveBeenCalled();
      expect(mockUiManager.promptConfirm).not.toHaveBeenCalled();
      expect(mockUiManager.printInfo).toHaveBeenCalledWith('Category selection cancelled.');
    });


    it('should return an empty array if user cancels mode selection from a category and then stops', async() => {
      (mockUiManager.promptList as Mock)
        .mockResolvedValueOnce('Category 1'); // Select category
      (mockUiManager.promptCheckbox as Mock)
        .mockRejectedValueOnce(new Error('User cancelled mode selection')); // Cancel mode selection
      (mockUiManager.promptConfirm as Mock)
        .mockResolvedValueOnce(false); // Stop

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]); // No modes should be added
      expect(mockUiManager.promptList).toHaveBeenCalledTimes(1);
      expect(mockUiManager.promptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiManager.promptConfirm).toHaveBeenCalledTimes(1);
      expect(mockUiManager.printInfo).toHaveBeenCalledWith('Mode selection from category Category 1 cancelled.');
    });

    it('should handle category with no modes gracefully and allow continuing or stopping', async() => {
      (mockUiManager.promptList as Mock)
        .mockResolvedValueOnce('Category 3 No Modes'); // Select category with no modes
      // promptForModesFromCategory will return [] without calling UIManager.promptCheckbox
      (mockUiManager.promptConfirm as Mock)
        .mockResolvedValueOnce(false); // Choose not to continue

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      expect(mockUiManager.promptList).toHaveBeenCalledTimes(1);
      expect(mockUiManager.promptCheckbox).not.toHaveBeenCalled(); // Not called for empty category
      expect(mockUiManager.promptConfirm).toHaveBeenCalledTimes(1);
      expect(mockUiManager.printWarning).toHaveBeenCalledWith('No modes available in category: Category 3 No Modes');
    });

    it('should handle "no modes selected" overall if user navigates but selects nothing and stops', async() => {
      (mockUiManager.promptList as Mock)
        .mockResolvedValueOnce('Category 1') // Select Cat 1
        .mockResolvedValueOnce('Category 2'); // Select Cat 2
      (mockUiManager.promptCheckbox as Mock)
        .mockResolvedValueOnce([])             // Select no modes from Cat 1
        .mockResolvedValueOnce([]);             // Select no modes from Cat 2
      (mockUiManager.promptConfirm as Mock)
        .mockResolvedValueOnce(true)            // Choose to continue
        .mockResolvedValueOnce(false);           // Choose not to continue

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      expect(mockUiManager.promptList).toHaveBeenCalledTimes(2);
      expect(mockUiManager.promptCheckbox).toHaveBeenCalledTimes(2);
      expect(mockUiManager.promptConfirm).toHaveBeenCalledTimes(2);
    });

    it('should correctly form choices for category prompt', async() => {
      (mockUiManager.promptList as Mock)
        .mockResolvedValueOnce('Category 1');
      (mockUiManager.promptCheckbox as Mock)
        .mockResolvedValueOnce([]);
      (mockUiManager.promptConfirm as Mock)
        .mockResolvedValueOnce(false);

      await modeSelector.selectModesInteractively();

      expect(mockUiManager.promptList).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Select a category:',
        choices: [
          { name: 'Category 1 - Description for Cat 1', value: 'Category 1' },
          { name: 'Category 2 - Description for Cat 2', value: 'Category 2' },
          { name: 'Category 3 No Modes - Description for Cat 3', value: 'Category 3 No Modes' },
        ]
      }));
    });

    it('should correctly form choices for mode prompt', async() => {
      (mockUiManager.promptList as Mock)
        .mockResolvedValueOnce('Category 1'); // User selects 'Category 1'
      (mockUiManager.promptCheckbox as Mock)
        .mockResolvedValueOnce(['mode1-cat1']);   // User selects 'mode1-cat1'
      (mockUiManager.promptConfirm as Mock)
        .mockResolvedValueOnce(false);            // User stops

      await modeSelector.selectModesInteractively();

      expect(mockUiManager.promptCheckbox).toHaveBeenCalledWith(expect.objectContaining({
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
        mockUiManager // Pass mock UIManager
      );
      (mockUiManager.promptList as Mock)
        .mockResolvedValueOnce('Category 1');
      (mockUiManager.promptCheckbox as Mock)
        .mockResolvedValueOnce(['mode1-cat1']);
      // No "continue" prompt (promptConfirm) should be called

      const selectedModes = await singleCategorySelector.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1']);
      expect(mockUiManager.promptList).toHaveBeenCalledTimes(1);
      expect(mockUiManager.promptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiManager.promptConfirm).not.toHaveBeenCalled(); // Key check
    });

  });

  describe('selectModesNonInteractively', () => {
    // These tests don't involve UI prompts, so they should remain largely unchanged
    // and not call any of the mockUiManager prompt methods.
    beforeEach(() => {
      // Ensure prompt mocks are not called for non-interactive tests
      vi.mocked(mockUiManager.promptConfirm).mockClear();
      vi.mocked(mockUiManager.promptList).mockClear();
      vi.mocked(mockUiManager.promptCheckbox).mockClear();
    });

    it('should return mode slugs specified by --modes flag', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1,mode2-cat1' });
      expect(result.selectedModes).toEqual(['mode1-cat1', 'mode2-cat1']);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiManager.promptList).not.toHaveBeenCalled();
    });

    it('should return mode slugs from a category specified by --category flag', async() => {
      const result = await modeSelector.selectModesNonInteractively({ category: 'cat1' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiManager.promptList).not.toHaveBeenCalled();
    });

    it('should return unique mode slugs from both --modes and --category flags', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1', category: 'cat2' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode1-cat2']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiManager.promptList).not.toHaveBeenCalled();
    });

    it('should handle overlapping slugs between --modes and --category, returning unique modes', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1,mode1-cat2', category: 'cat1' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode1-cat2', 'mode2-cat1']));
      expect(result.selectedModes.length).toBe(3);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiManager.promptList).not.toHaveBeenCalled();
    });

    it('should return invalid slugs if --modes contains non-existent slugs', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1,invalid-mode,another-invalid' });
      expect(result.selectedModes).toEqual(['mode1-cat1']);
      expect(result.invalidModeSlugs).toEqual(['invalid-mode', 'another-invalid']);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiManager.promptList).not.toHaveBeenCalled();
    });

    it('should return invalid category slugs if --category contains non-existent slugs', async() => {
      const result = await modeSelector.selectModesNonInteractively({ category: 'cat1,invalid-cat,another-invalid-cat' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual(['invalid-cat', 'another-invalid-cat']);
      expect(mockUiManager.promptList).not.toHaveBeenCalled();
    });

    it('should handle both valid and invalid slugs for --modes and --category', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1,invalid-mode', category: 'cat2,invalid-cat' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode1-cat2']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual(['invalid-mode']);
      expect(result.invalidCategorySlugs).toEqual(['invalid-cat']);
      expect(mockUiManager.promptList).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes and no invalids if --modes is an empty string', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: '' });
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiManager.promptList).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes and no invalids if --category is an empty string', async() => {
      const result = await modeSelector.selectModesNonInteractively({ category: '' });
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiManager.promptList).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes if both --modes and --category are empty strings', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: '', category: '' });
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiManager.promptList).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes if no flags are provided (options object is empty)', async() => {
      const result = await modeSelector.selectModesNonInteractively({});
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiManager.promptList).not.toHaveBeenCalled();
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
      expect(mockUiManager.promptList).not.toHaveBeenCalled();
    });
  });
});