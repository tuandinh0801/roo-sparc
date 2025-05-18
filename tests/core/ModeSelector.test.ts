import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModeSelector } from '../../src/core/ModeSelector.js';
import type { CategoryDefinitionWithSource as Category, ModeDefinitionWithSource as Mode } from '../../src/types/domain.js';
import type { UIManager } from '../../src/utils/uiManager.js';
import { DefinitionLoader } from '../../src/core/DefinitionLoader.js';
import { FileManager } from '../../src/core/FileManager.js';

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

vi.mock('../../src/core/DefinitionLoader.js');
vi.mock('node:fs', () => ({
  default: {
    writeSync: vi.fn(),
  },
  __esModule: true,
}));

// Declare variables at the top level of the describe block for wider scope
let mockCategories: Category[];
let mockModes: Mode[];
let mockDefinitionLoader: DefinitionLoader;
let mockUIManagerInstance: UIManager;
let mockFileManager: FileManager;
let modeSelectorInstance: ModeSelector; // Changed from modeSelector

describe('ModeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUiPromptList.mockReset();
    mockUiPromptCheckbox.mockReset();
    mockUiPromptConfirm.mockReset();
    mockUiPrintInfo.mockReset();
    mockUiPrintWarning.mockReset();

    mockCategories = [
      createTestCategory({ slug: 'cat1', name: 'Category 1', description: 'Description for Cat 1', sourceType: 'system' }),
      createTestCategory({ slug: 'cat2', name: 'Category 2', description: 'Description for Cat 2', sourceType: 'system' }),
      createTestCategory({ slug: 'cat3', name: 'Category 3 No Modes', description: 'Description for Cat 3', sourceType: 'system' }),
    ];

    mockModes = [
      createTestMode({ slug: 'mode1-cat1', name: 'Mode 1 (Cat 1)', description: 'Desc for Mode 1 Cat 1', categorySlugs: ['cat1'], associatedRuleFiles: [], sourceType: 'system' }),
      createTestMode({ slug: 'mode2-cat1', name: 'Mode 2 (Cat 1)', description: 'Desc for Mode 2 Cat 1', categorySlugs: ['cat1'], associatedRuleFiles: [], sourceType: 'system' }),
      createTestMode({ slug: 'mode1-cat2', name: 'Mode 1 (Cat 2)', description: 'Desc for Mode 1 Cat 2', categorySlugs: ['cat2'], associatedRuleFiles: [], sourceType: 'system' }),
    ];

    mockUIManagerInstance = {
      printBanner: vi.fn(),
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

    mockFileManager = {
      getUserConfigPath: vi.fn().mockReturnValue('/mock/user/config'),
    } as unknown as FileManager;

    // Correctly instantiate DefinitionLoader
    mockDefinitionLoader = new DefinitionLoader(mockFileManager, mockUIManagerInstance, 'mock/definitions/path');
    vi.spyOn(mockDefinitionLoader, 'loadDefinitions').mockResolvedValue({
      modes: mockModes,
      categories: mockCategories,
    });

    modeSelectorInstance = new ModeSelector(mockDefinitionLoader, mockUIManagerInstance);
  });

  describe('selectModesInteractively', () => {
    it('should return selected mode slugs when user selects one mode from one category and stops', async() => {
      mockUiPromptList.mockResolvedValueOnce('Category 1');
      mockUiPromptCheckbox.mockResolvedValueOnce(['mode1-cat1']);
      mockUiPromptConfirm.mockResolvedValueOnce(false);

      const selectedModes = await modeSelectorInstance.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1']);
      expect(mockUiPromptList).toHaveBeenCalledTimes(1);
      expect(mockUiPromptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiPromptConfirm).toHaveBeenCalledTimes(1);
    });

    it('should return selected mode slugs when user selects multiple modes from one category and stops', async() => {
      mockUiPromptList.mockResolvedValueOnce('Category 1');
      mockUiPromptCheckbox.mockResolvedValueOnce(['mode1-cat1', 'mode2-cat1']);
      mockUiPromptConfirm.mockResolvedValueOnce(false);

      const selectedModes = await modeSelectorInstance.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1', 'mode2-cat1']);
      expect(mockUiPromptList).toHaveBeenCalledTimes(1);
      expect(mockUiPromptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiPromptConfirm).toHaveBeenCalledTimes(1);
    });

    it('should return selected mode slugs from multiple categories', async() => {
      mockUiPromptList
        .mockResolvedValueOnce('Category 1')
        .mockResolvedValueOnce('Category 2');
      mockUiPromptCheckbox
        .mockResolvedValueOnce(['mode1-cat1'])
        .mockResolvedValueOnce(['mode1-cat2']);
      mockUiPromptConfirm
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const selectedModes = await modeSelectorInstance.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1', 'mode1-cat2']);
      expect(mockUiPromptList).toHaveBeenCalledTimes(2);
      expect(mockUiPromptCheckbox).toHaveBeenCalledTimes(2);
      expect(mockUiPromptConfirm).toHaveBeenCalledTimes(2);
    });

    it('should return an empty array if no modes are selected from a category and user stops', async() => {
      mockUiPromptList.mockResolvedValueOnce('Category 1');
      mockUiPromptCheckbox.mockResolvedValueOnce([]);
      mockUiPromptConfirm.mockResolvedValueOnce(false);

      const selectedModes = await modeSelectorInstance.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      expect(mockUiPromptList).toHaveBeenCalledTimes(1);
      expect(mockUiPromptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiPromptConfirm).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if user cancels category selection', async() => {
      mockUiPromptList.mockResolvedValueOnce(null);

      const selectedModes = await modeSelectorInstance.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      expect(mockUiPromptList).toHaveBeenCalledTimes(1);
      expect(mockUiPromptCheckbox).not.toHaveBeenCalled();
      expect(mockUiPromptConfirm).not.toHaveBeenCalled();
      expect(mockUiPrintInfo).toHaveBeenCalledWith('Category selection cancelled.');
    });


    it('should return an empty array if user cancels mode selection from a category and then stops', async() => {
      mockUiPromptList.mockResolvedValueOnce('Category 1');
      mockUiPromptCheckbox.mockRejectedValueOnce(new Error('User cancelled mode selection'));
      mockUiPromptConfirm.mockResolvedValueOnce(false);

      const selectedModes = await modeSelectorInstance.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      expect(mockUiPromptList).toHaveBeenCalledTimes(1);
      expect(mockUiPromptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiPromptConfirm).toHaveBeenCalledTimes(1);
      expect(mockUiPrintInfo).toHaveBeenCalledWith('Mode selection from category Category 1 cancelled.');
    });

    it('should handle category with no modes gracefully and allow continuing or stopping', async() => {
      mockUiPromptList.mockResolvedValueOnce('Category 3 No Modes');
      mockUiPromptConfirm.mockResolvedValueOnce(false);

      const selectedModes = await modeSelectorInstance.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      expect(mockUiPromptList).toHaveBeenCalledTimes(1);
      expect(mockUiPromptCheckbox).not.toHaveBeenCalled();
      expect(mockUiPromptConfirm).toHaveBeenCalledTimes(1);
      expect(mockUiPrintWarning).toHaveBeenCalledWith('No modes available in category: Category 3 No Modes');
    });

    it('should handle "no modes selected" overall if user navigates but selects nothing and stops', async() => {
      mockUiPromptList
        .mockResolvedValueOnce('Category 1')
        .mockResolvedValueOnce('Category 2');
      mockUiPromptCheckbox
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockUiPromptConfirm
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const selectedModes = await modeSelectorInstance.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      expect(mockUiPromptList).toHaveBeenCalledTimes(2);
      expect(mockUiPromptCheckbox).toHaveBeenCalledTimes(2);
      expect(mockUiPromptConfirm).toHaveBeenCalledTimes(2);
    });

    it('should correctly form choices for category prompt', async() => {
      mockUiPromptList.mockResolvedValueOnce('Category 1');
      mockUiPromptCheckbox.mockResolvedValueOnce([]);
      mockUiPromptConfirm.mockResolvedValueOnce(false);

      await modeSelectorInstance.selectModesInteractively();

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
      mockUiPromptList.mockResolvedValueOnce('Category 1');
      mockUiPromptCheckbox.mockResolvedValueOnce(['mode1-cat1']);
      mockUiPromptConfirm.mockResolvedValueOnce(false);

      await modeSelectorInstance.selectModesInteractively();

      expect(mockUiPromptCheckbox).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Select modes from Category 1: (Navigate with arrows, <space> to select, <enter> to confirm)',
        choices: [
          { name: 'Mode 1 (Cat 1) (mode1-cat1) - Desc for Mode 1 Cat 1', value: 'mode1-cat1', short: 'Mode 1 (Cat 1)' },
          { name: 'Mode 2 (Cat 1) (mode2-cat1) - Desc for Mode 2 Cat 1', value: 'mode2-cat1', short: 'Mode 2 (Cat 1)' },
        ]
      }));
    });

    it('should stop asking to continue if only one category exists', async() => {
      const singleCategoryMockDefinitionLoader = new DefinitionLoader(mockFileManager, mockUIManagerInstance, 'mock/definitions/path');
      vi.spyOn(singleCategoryMockDefinitionLoader, 'loadDefinitions').mockResolvedValue({
        modes: mockModes.filter(m => m.categorySlugs.includes('cat1')),
        categories: [mockCategories[0]],
      });

      const singleCategorySelectorInstance = new ModeSelector(singleCategoryMockDefinitionLoader, mockUIManagerInstance);

      mockUiPromptList.mockResolvedValueOnce('Category 1');
      mockUiPromptCheckbox.mockResolvedValueOnce(['mode1-cat1']);

      const selectedModes = await singleCategorySelectorInstance.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1']);
      expect(mockUiPromptList).toHaveBeenCalledTimes(1);
      expect(mockUiPromptCheckbox).toHaveBeenCalledTimes(1);
      expect(mockUiPromptConfirm).not.toHaveBeenCalled();
    });
  }); // End of selectModesInteractively describe block

  describe('selectModesNonInteractively', () => {
    it('should return mode slugs specified by --modes flag', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ modes: 'mode1-cat1,mode2-cat1' });
      expect(result.selectedModes).toEqual(['mode1-cat1', 'mode2-cat1']);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return mode slugs from a category specified by --category flag', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ category: 'cat1' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return unique mode slugs from both --modes and --category flags', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ modes: 'mode1-cat1', category: 'cat2' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode1-cat2']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should handle overlapping slugs between --modes and --category, returning unique modes', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ modes: 'mode1-cat1,mode1-cat2', category: 'cat1' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode1-cat2', 'mode2-cat1']));
      expect(result.selectedModes.length).toBe(3);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return invalid slugs if --modes contains non-existent slugs', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ modes: 'mode1-cat1,invalid-mode,another-invalid' });
      expect(result.selectedModes).toEqual(['mode1-cat1']);
      expect(result.invalidModeSlugs).toEqual(['invalid-mode', 'another-invalid']);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return invalid category slugs if --category contains non-existent slugs', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ category: 'cat1,invalid-cat,another-invalid-cat' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual(['invalid-cat', 'another-invalid-cat']);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should handle both valid and invalid slugs for --modes and --category', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ modes: 'mode1-cat1,invalid-mode', category: 'cat2,invalid-cat' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode1-cat2']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual(['invalid-mode']);
      expect(result.invalidCategorySlugs).toEqual(['invalid-cat']);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes and no invalids if --modes is an empty string', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ modes: '' });
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes and no invalids if --category is an empty string', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ category: '' });
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes if both --modes and --category are empty strings', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ modes: '', category: '' });
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes if no flags are provided (options object is empty)', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({});
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes if --modes is undefined', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ category: 'cat1' }); // modes is undefined
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
    });

    it('should return empty selectedModes if --category is undefined', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ modes: 'mode1-cat1' }); // category is undefined
      expect(result.selectedModes).toEqual(['mode1-cat1']);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
    });

    it('should handle comma-separated slugs with extra spaces for --modes', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ modes: ' mode1-cat1 , mode2-cat1 ' });
      expect(result.selectedModes).toEqual(['mode1-cat1', 'mode2-cat1']);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
    });

    it('should handle comma-separated slugs with extra spaces for --category', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ category: ' cat1 , cat2 ' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1', 'mode1-cat2']));
      expect(result.selectedModes.length).toBe(3);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
    });

    it('should return modes from multiple categories specified in --category', async() => {
      const result = await modeSelectorInstance.selectModesNonInteractively({ category: 'cat1,cat2' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1', 'mode1-cat2']));
      expect(result.selectedModes.length).toBe(3);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
    });

    it('should not call interactive prompts when non-interactive flags are used', async() => {
      await modeSelectorInstance.selectModesNonInteractively({ modes: 'mode1-cat1' });
      expect(mockUiPromptList).not.toHaveBeenCalled();
    });
  }); // End of selectModesNonInteractively describe block
}); // End of ModeSelector describe block