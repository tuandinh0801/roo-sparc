import { describe, it, expect, vi, beforeEach, afterEach, Mocked } from 'vitest';
import { ListCategoriesCommand } from '../../../src/commands/manage/ListCategoriesCommand.js';
import { definitionLoader, DefinitionLoader } from '../../../src/core/DefinitionLoader.js';
import { uiManager, UIManager } from '../../../src/utils/uiManager.js';
import { handleError } from '../../../src/utils/errorHandler.js';
import type { CategoryDefinition, CategoryDefinitionWithSource } from '../../../src/types/domain.js';
import { CommandOptions } from '../../../src/commands/base/BaseCommand.js';
import { FileManager } from '../../../src/core/FileManager.js';

// Mock dependencies
vi.mock('../../../src/core/DefinitionLoader.js');
vi.mock('../../../src/utils/uiManager.js');
vi.mock('../../../src/utils/errorHandler.js');
vi.mock('../../../src/core/FileManager.js');
vi.mock('node:fs', () => ({ // Add mock for node:fs
  default: {
    writeSync: vi.fn(),
  },
  __esModule: true,
}));

const createMockCategoryWithSource = (slug: string, name: string, description: string | undefined, sourceType: 'system' | 'custom' | 'custom (overrides system)' ): CategoryDefinitionWithSource => ({
  slug,
  name,
  description,
  sourceType,
  source: sourceType === 'system' ? 'system' : 'user', // 'user' covers 'custom' and 'custom (overrides system)' for the internal 'source' prop
});

describe('ListCategoriesCommand', () => {
  let command: ListCategoriesCommand;
  let mockCommandOptions: CommandOptions;

  beforeEach(() => {
    const mockedUiManager = new UIManager() as Mocked<UIManager>;
    const mockedDefinitionLoader = new DefinitionLoader({} as FileManager, mockedUiManager) as Mocked<DefinitionLoader>;
    const mockedFileManager = new FileManager(mockedUiManager) as Mocked<FileManager>;

    mockCommandOptions = {
      ui: mockedUiManager,
      definitionLoader: mockedDefinitionLoader,
      fileManager: mockedFileManager,
    };
    command = new ListCategoriesCommand(mockCommandOptions);
    vi.mocked(mockedDefinitionLoader.getSystemCategories).mockResolvedValue([]);
    vi.mocked(mockedDefinitionLoader.getCustomCategories).mockResolvedValue([]);
    vi.mocked(mockedDefinitionLoader.getMergedCategories).mockResolvedValue([]);
    vi.mocked(mockedUiManager.displayTable).mockClear();
    vi.mocked(mockedUiManager.showMessage).mockClear();
    vi.mocked(handleError).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should list custom categories by default if --source is not provided', async() => {
    const mockCategories = [createMockCategoryWithSource('custom-1', 'Custom Category 1', 'Desc 1', 'custom')];
    vi.mocked(mockCommandOptions.definitionLoader.getCustomCategories).mockResolvedValue(mockCategories);

    await command.execute({}); // No options, defaults to source=custom

    expect(mockCommandOptions.definitionLoader.getCustomCategories).toHaveBeenCalledTimes(1);
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [['custom-1', 'Custom Category 1', 'Desc 1', 'custom']]
    );
    expect(vi.mocked(mockCommandOptions.ui.showMessage)).not.toHaveBeenCalled();
  });

  it('should list custom categories when --source=custom', async() => {
    const mockCategories = [createMockCategoryWithSource('custom-1', 'Custom Category 1', 'Desc 1', 'custom')];
    vi.mocked(mockCommandOptions.definitionLoader.getCustomCategories).mockResolvedValue(mockCategories);

    await command.execute({ source: 'custom' });

    expect(mockCommandOptions.definitionLoader.getCustomCategories).toHaveBeenCalledTimes(1);
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [['custom-1', 'Custom Category 1', 'Desc 1', 'custom']]
    );
  });

  it('should list system categories when --source=system', async() => {
    const mockCategories = [createMockCategoryWithSource('system-1', 'System Category 1', 'Desc Sys 1', 'system')];
    vi.mocked(mockCommandOptions.definitionLoader.getSystemCategories).mockResolvedValue(mockCategories);

    await command.execute({ source: 'system' });

    expect(mockCommandOptions.definitionLoader.getSystemCategories).toHaveBeenCalledTimes(1);
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [['system-1', 'System Category 1', 'Desc Sys 1', 'system']]
    );
  });

  it('should list all (merged) categories when --source=all', async() => {
    const mockCategories: CategoryDefinitionWithSource[] = [
      createMockCategoryWithSource('sys-1', 'System Category 1', 'Desc S1', 'system'),
      createMockCategoryWithSource('custom-1', 'Custom Category A', 'Desc CA', 'custom'),
      createMockCategoryWithSource('sys-2', 'System Category 2 Overridden', 'Desc S2O', 'custom (overrides system)'),
    ];
    vi.mocked(mockCommandOptions.definitionLoader.getMergedCategories).mockResolvedValue(mockCategories);

    await command.execute({ source: 'all' });

    expect(mockCommandOptions.definitionLoader.getMergedCategories).toHaveBeenCalledTimes(1);
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [
        ['sys-1', 'System Category 1', 'Desc S1', 'system'],
        ['custom-1', 'Custom Category A', 'Desc CA', 'custom'],
        ['sys-2', 'System Category 2 Overridden', 'Desc S2O', 'custom (overrides system)'],
      ]
    );
  });

  it('should display "No custom categories found." if no custom categories exist', async() => {
    vi.mocked(mockCommandOptions.definitionLoader.getCustomCategories).mockResolvedValue([]);
    await command.execute({ source: 'custom' });
    expect(vi.mocked(mockCommandOptions.ui.showMessage)).toHaveBeenCalledWith('info', 'No custom categories found.');
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).not.toHaveBeenCalled();
  });

  it('should display "No system categories found." if no system categories exist', async() => {
    vi.mocked(mockCommandOptions.definitionLoader.getSystemCategories).mockResolvedValue([]);
    await command.execute({ source: 'system' });
    expect(vi.mocked(mockCommandOptions.ui.showMessage)).toHaveBeenCalledWith('info', 'No system categories found.');
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).not.toHaveBeenCalled();
  });

  it('should display "No all categories found." if no merged categories exist', async() => {
    vi.mocked(mockCommandOptions.definitionLoader.getMergedCategories).mockResolvedValue([]);
    await command.execute({ source: 'all' });
    expect(vi.mocked(mockCommandOptions.ui.showMessage)).toHaveBeenCalledWith('info', 'No all categories found.');
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).not.toHaveBeenCalled();
  });

  it('should handle invalid --source value', async() => {
    await command.execute({ source: 'invalid-source' });
    expect(handleError).toHaveBeenCalledWith(
      new Error('Invalid source value: invalid-source. Must be one of \'custom\', \'system\', or \'all\'.')
    );
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).not.toHaveBeenCalled();
    expect(vi.mocked(mockCommandOptions.ui.showMessage)).not.toHaveBeenCalled();
  });

  it('should handle descriptions that are undefined or empty string', async() => {
    const mockCategories: CategoryDefinitionWithSource[] = [
      createMockCategoryWithSource('custom-1', 'Custom Category 1', '', 'custom'),
      createMockCategoryWithSource('custom-2', 'Custom Category 2', undefined, 'custom'), // Undefined description
    ];
    vi.mocked(mockCommandOptions.definitionLoader.getCustomCategories).mockResolvedValue(mockCategories);

    await command.execute({ source: 'custom' });

    expect(vi.mocked(mockCommandOptions.ui.displayTable)).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [
        ['custom-1', 'Custom Category 1', '-', 'custom'],
        ['custom-2', 'Custom Category 2', '-', 'custom'],
      ]
    );
  });

  it('should call handleError if definitionLoader throws an error', async() => {
    const testError = new Error('DefinitionLoader failed');
    vi.mocked(mockCommandOptions.definitionLoader.getCustomCategories).mockRejectedValue(testError);

    await command.execute({ source: 'custom' });

    expect(handleError).toHaveBeenCalledWith(testError);
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).not.toHaveBeenCalled();
  });
});