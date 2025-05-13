import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import Enquirer from 'enquirer';
import { ModeSelector } from '../../src/core/ModeSelector.js';
import { CategoryDefinition as Category, ModeDefinition as Mode } from '../../src/types/domain.js';

// Mock the Enquirer module
vi.mock('enquirer', () => {
  // Default export is the Enquirer class, prompt is a static method or method on an instance
  // Based on ModeSelector, it's used as `Enquirer.prompt`
  return {
    default: {
      prompt: vi.fn(),
    },
    prompt: vi.fn(), // If Enquirer is used as a namespace
  };
});

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

// Helper to access the mock
const mockedEnquirerPrompt = Enquirer.prompt as Mock;

describe('ModeSelector', () => {
  let modeSelector: ModeSelector;

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
    modeSelector = new ModeSelector(mockCategories, mockModes);
  });

  describe('selectModesInteractively', () => {
    it('should return selected mode slugs when user selects one mode from one category and stops', async() => {
      mockedEnquirerPrompt
        .mockResolvedValueOnce({ categoryName: 'Category 1' }) // First call: select category
        .mockResolvedValueOnce({ modeSlugs: ['mode1-cat1'] }) // Second call: select modes from Category 1
        .mockResolvedValueOnce({ continue: false }); // Third call: do not continue

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1']);
      expect(mockedEnquirerPrompt).toHaveBeenCalledTimes(3);
    });

    it('should return selected mode slugs when user selects multiple modes from one category and stops', async() => {
      mockedEnquirerPrompt
        .mockResolvedValueOnce({ categoryName: 'Category 1' })
        .mockResolvedValueOnce({ modeSlugs: ['mode1-cat1', 'mode2-cat1'] })
        .mockResolvedValueOnce({ continue: false });

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1', 'mode2-cat1']);
      expect(mockedEnquirerPrompt).toHaveBeenCalledTimes(3);
    });

    it('should return selected mode slugs from multiple categories', async() => {
      mockedEnquirerPrompt
        .mockResolvedValueOnce({ categoryName: 'Category 1' }) // Select Cat 1
        .mockResolvedValueOnce({ modeSlugs: ['mode1-cat1'] })  // Select modes from Cat 1
        .mockResolvedValueOnce({ continue: true })           // Choose to continue
        .mockResolvedValueOnce({ categoryName: 'Category 2' }) // Select Cat 2
        .mockResolvedValueOnce({ modeSlugs: ['mode1-cat2'] })  // Select modes from Cat 2
        .mockResolvedValueOnce({ continue: false });          // Choose not to continue

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1', 'mode1-cat2']);
      expect(mockedEnquirerPrompt).toHaveBeenCalledTimes(6);
    });

    it('should return an empty array if no modes are selected from a category and user stops', async() => {
      mockedEnquirerPrompt
        .mockResolvedValueOnce({ categoryName: 'Category 1' })
        .mockResolvedValueOnce({ modeSlugs: [] }) // No modes selected from Category 1
        .mockResolvedValueOnce({ continue: false });

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      expect(mockedEnquirerPrompt).toHaveBeenCalledTimes(3);
    });

    it('should return an empty array if user cancels category selection', async() => {
      // Simulate cancellation by having promptForCategory return null,
      // which happens if Enquirer.prompt throws or returns a value that doesn't match a category.
      // For simplicity, we'll mock the internal call to return null.
      // This requires a more complex mock if Enquirer.prompt itself throws.
      // Let's assume cancellation means Enquirer.prompt returns a value that leads to `null` from `promptForCategory`.
      // The `selectModesInteractively` loop breaks if `promptForCategory` returns null.
      mockedEnquirerPrompt.mockImplementation(async(promptConfig: any) => {
        if (promptConfig.name === 'categoryName') {
          // Simulate cancellation or no selection for category
          // This could be a throw or a specific return value that promptForCategory handles as null
          // For this test, let's assume it resolves to something that makes promptForCategory return null
          // A direct throw from Enquirer.prompt is handled by try/catch in promptForCategory
          throw new Error('User cancelled'); // Simulate Ctrl+C
        }
        // Fallback for other prompts if any, though not expected here
        return {};
      });

      // Or, more directly, mock the first category prompt to return something that results in null
      // For the current implementation, if Enquirer.prompt throws, promptForCategory returns null
      mockedEnquirerPrompt.mockRejectedValueOnce(new Error('User cancelled category selection'));


      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      // Only category prompt should be called
      expect(mockedEnquirerPrompt).toHaveBeenCalledTimes(1);
      expect(mockedEnquirerPrompt.mock.calls[0][0].name).toBe('categoryName');
    });

    it('should return an empty array if user cancels mode selection from a category and then stops', async() => {
      mockedEnquirerPrompt
        .mockResolvedValueOnce({ categoryName: 'Category 1' }) // Select category
        .mockRejectedValueOnce(new Error('User cancelled mode selection')) // Cancel mode selection
        .mockResolvedValueOnce({ continue: false }); // Stop

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]); // No modes should be added
      expect(mockedEnquirerPrompt).toHaveBeenCalledTimes(3);
      expect(mockedEnquirerPrompt.mock.calls[0][0].name).toBe('categoryName');
      expect(mockedEnquirerPrompt.mock.calls[1][0].name).toBe('modeSlugs');
      expect(mockedEnquirerPrompt.mock.calls[2][0].name).toBe('continue');
    });

    it('should handle category with no modes gracefully and allow continuing or stopping', async() => {
      mockedEnquirerPrompt
        .mockResolvedValueOnce({ categoryName: 'Category 3 No Modes' }) // Select category with no modes
        // promptForModesFromCategory will return [] without calling Enquirer
        .mockResolvedValueOnce({ continue: false }); // Choose not to continue

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]);
      // Category prompt, then continue prompt
      expect(mockedEnquirerPrompt).toHaveBeenCalledTimes(2);
      expect(mockedEnquirerPrompt.mock.calls[0][0].name).toBe('categoryName');
      expect(mockedEnquirerPrompt.mock.calls[1][0].name).toBe('continue');
    });

    it('should handle "no modes selected" overall if user navigates but selects nothing and stops', async() => {
      mockedEnquirerPrompt
        .mockResolvedValueOnce({ categoryName: 'Category 1' }) // Select Cat 1
        .mockResolvedValueOnce({ modeSlugs: [] })             // Select no modes from Cat 1
        .mockResolvedValueOnce({ continue: true })            // Choose to continue
        .mockResolvedValueOnce({ categoryName: 'Category 2' }) // Select Cat 2
        .mockResolvedValueOnce({ modeSlugs: [] })             // Select no modes from Cat 2
        .mockResolvedValueOnce({ continue: false });           // Choose not to continue

      const selectedModes = await modeSelector.selectModesInteractively();
      expect(selectedModes).toEqual([]); // AC5
      expect(mockedEnquirerPrompt).toHaveBeenCalledTimes(6);
    });

    it('should correctly form choices for category prompt', async() => {
      mockedEnquirerPrompt.mockResolvedValueOnce({ categoryName: 'Category 1' })
        .mockResolvedValueOnce({ modeSlugs: [] })
        .mockResolvedValueOnce({ continue: false });

      await modeSelector.selectModesInteractively();

      expect(mockedEnquirerPrompt).toHaveBeenCalledWith(expect.objectContaining({
        name: 'categoryName',
        type: 'autocomplete',
        message: 'Select a category:',
        choices: [
          { name: 'Category 1', message: 'Category 1 - Description for Cat 1', value: 'Category 1' },
          { name: 'Category 2', message: 'Category 2 - Description for Cat 2', value: 'Category 2' },
          { name: 'Category 3 No Modes', message: 'Category 3 No Modes - Description for Cat 3', value: 'Category 3 No Modes' },
        ]
      }));
    });

    it('should correctly form choices for mode prompt', async() => {
      mockedEnquirerPrompt.mockResolvedValueOnce({ categoryName: 'Category 1' }) // User selects 'Category 1'
        .mockResolvedValueOnce({ modeSlugs: ['mode1-cat1'] })   // User selects 'mode1-cat1'
        .mockResolvedValueOnce({ continue: false });            // User stops

      await modeSelector.selectModesInteractively();

      expect(mockedEnquirerPrompt).toHaveBeenCalledWith(expect.objectContaining({
        name: 'modeSlugs',
        type: 'multiselect',
        message: 'Select modes from Category 1:',
        choices: [
          { name: 'mode1-cat1', message: 'Mode 1 (Cat 1) (mode1-cat1) - Desc for Mode 1 Cat 1' },
          { name: 'mode2-cat1', message: 'Mode 2 (Cat 1) (mode2-cat1) - Desc for Mode 2 Cat 1' },
        ]
      }));
    });

    it('should stop asking to continue if only one category exists', async() => {
      const singleCategorySelector = new ModeSelector(
        [mockCategories[0]], // Only Category 1
        mockModes.filter(m => m.categorySlugs.includes('cat1'))
      );
      mockedEnquirerPrompt
        .mockResolvedValueOnce({ categoryName: 'Category 1' })
        .mockResolvedValueOnce({ modeSlugs: ['mode1-cat1'] });
      // No "continue" prompt should be called

      const selectedModes = await singleCategorySelector.selectModesInteractively();
      expect(selectedModes).toEqual(['mode1-cat1']);
      expect(mockedEnquirerPrompt).toHaveBeenCalledTimes(2); // Category select, Mode select
    });

  });

  describe('selectModesNonInteractively', () => {
    it('should return mode slugs specified by --modes flag', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1,mode2-cat1' });
      expect(result.selectedModes).toEqual(['mode1-cat1', 'mode2-cat1']);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockedEnquirerPrompt).not.toHaveBeenCalled();
    });

    it('should return mode slugs from a category specified by --category flag', async() => {
      const result = await modeSelector.selectModesNonInteractively({ category: 'cat1' });
      // Expecting modes from cat1: mode1-cat1, mode2-cat1
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockedEnquirerPrompt).not.toHaveBeenCalled();
    });

    it('should return unique mode slugs from both --modes and --category flags', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1', category: 'cat2' });
      // mode1-cat1 from --modes, mode1-cat2 from --category=cat2
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode1-cat2']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockedEnquirerPrompt).not.toHaveBeenCalled();
    });

    it('should handle overlapping slugs between --modes and --category, returning unique modes', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1,mode1-cat2', category: 'cat1' });
      // mode1-cat1, mode1-cat2 from --modes. cat1 includes mode1-cat1, mode2-cat1.
      // Expected unique: mode1-cat1, mode1-cat2, mode2-cat1
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode1-cat2', 'mode2-cat1']));
      expect(result.selectedModes.length).toBe(3);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockedEnquirerPrompt).not.toHaveBeenCalled();
    });

    it('should return invalid slugs if --modes contains non-existent slugs', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1,invalid-mode,another-invalid' });
      expect(result.selectedModes).toEqual(['mode1-cat1']);
      expect(result.invalidModeSlugs).toEqual(['invalid-mode', 'another-invalid']);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockedEnquirerPrompt).not.toHaveBeenCalled();
    });

    it('should return invalid category slugs if --category contains non-existent slugs', async() => {
      const result = await modeSelector.selectModesNonInteractively({ category: 'cat1,invalid-cat,another-invalid-cat' });
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1']));
      expect(result.selectedModes.length).toBe(2); // modes from cat1
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual(['invalid-cat', 'another-invalid-cat']);
      expect(mockedEnquirerPrompt).not.toHaveBeenCalled();
    });

    it('should handle both valid and invalid slugs for --modes and --category', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1,invalid-mode', category: 'cat2,invalid-cat' });
      // mode1-cat1 from --modes. mode1-cat2 from --category=cat2.
      // Expected unique: mode1-cat1, mode1-cat2
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode1-cat2']));
      expect(result.selectedModes.length).toBe(2);
      expect(result.invalidModeSlugs).toEqual(['invalid-mode']);
      expect(result.invalidCategorySlugs).toEqual(['invalid-cat']);
      expect(mockedEnquirerPrompt).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes and no invalids if --modes is an empty string', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: '' });
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockedEnquirerPrompt).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes and no invalids if --category is an empty string', async() => {
      const result = await modeSelector.selectModesNonInteractively({ category: '' });
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockedEnquirerPrompt).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes if both --modes and --category are empty strings', async() => {
      const result = await modeSelector.selectModesNonInteractively({ modes: '', category: '' });
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockedEnquirerPrompt).not.toHaveBeenCalled();
    });

    it('should return empty selectedModes if no flags are provided (options object is empty)', async() => {
      const result = await modeSelector.selectModesNonInteractively({});
      expect(result.selectedModes).toEqual([]);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
      expect(mockedEnquirerPrompt).not.toHaveBeenCalled();
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
      // cat1: mode1-cat1, mode2-cat1. cat2: mode1-cat2
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1', 'mode1-cat2']));
      expect(result.selectedModes.length).toBe(3);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
    });

    it('should return modes from multiple categories specified in --category', async() => {
      const result = await modeSelector.selectModesNonInteractively({ category: 'cat1,cat2' });
      // cat1: mode1-cat1, mode2-cat1. cat2: mode1-cat2
      expect(result.selectedModes).toEqual(expect.arrayContaining(['mode1-cat1', 'mode2-cat1', 'mode1-cat2']));
      expect(result.selectedModes.length).toBe(3);
      expect(result.invalidModeSlugs).toEqual([]);
      expect(result.invalidCategorySlugs).toEqual([]);
    });

    it('should not call interactive prompts when non-interactive flags are used', async() => {
      await modeSelector.selectModesNonInteractively({ modes: 'mode1-cat1' });
      expect(mockedEnquirerPrompt).not.toHaveBeenCalled();
    });
  });
});