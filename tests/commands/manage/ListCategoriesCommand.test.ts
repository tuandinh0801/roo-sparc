import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ListCategoriesCommand } from '../../../src/commands/manage/ListCategoriesCommand.js';
import { definitionLoader } from '../../../src/core/DefinitionLoader.js';
import { uiManager } from '../../../src/utils/uiManager.js';
import { handleError } from '../../../src/utils/errorHandler.js';
import type { CategoryDefinition, CategoryDefinitionWithSource } from '../../../src/types/domain.js';

// Mock dependencies
vi.mock('../../../src/core/DefinitionLoader.js');
vi.mock('../../../src/utils/uiManager.js');
vi.mock('../../../src/utils/errorHandler.js');

const createMockCategory = (slug: string, name: string, description: string, source: 'system' | 'custom' | 'user'): CategoryDefinition => ({
  slug,
  name,
  description,
  source: source === 'user' ? 'user' : 'system',
});

const createMockCategoryWithSource = (slug: string, name: string, description: string, sourceType: 'system' | 'custom' | 'custom (overrides system)' ): CategoryDefinitionWithSource => ({
  slug,
  name,
  description,
  sourceType,
  source: sourceType === 'system' ? 'system' : 'user',
});


describe('ListCategoriesCommand', () => {
  let command: ListCategoriesCommand;

  beforeEach(() => {
    command = new ListCategoriesCommand();
    vi.mocked(definitionLoader.getSystemCategories).mockResolvedValue([]);
    vi.mocked(definitionLoader.getCustomCategories).mockResolvedValue([]);
    vi.mocked(definitionLoader.getMergedCategories).mockResolvedValue([]);
    vi.mocked(uiManager.displayTable).mockClear();
    vi.mocked(uiManager.showMessage).mockClear();
    vi.mocked(handleError).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should list custom categories by default if --source is not provided', async() => {
    const mockCategories = [createMockCategory('custom-1', 'Custom Category 1', 'Desc 1', 'custom')];
    vi.mocked(definitionLoader.getCustomCategories).mockResolvedValue(mockCategories);

    await command.execute({}); // No options, defaults to source=custom

    expect(definitionLoader.getCustomCategories).toHaveBeenCalledTimes(1);
    expect(uiManager.displayTable).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [['custom-1', 'Custom Category 1', 'Desc 1', 'custom']]
    );
    expect(uiManager.showMessage).not.toHaveBeenCalled();
  });

  it('should list custom categories when --source=custom', async() => {
    const mockCategories = [createMockCategory('custom-1', 'Custom Category 1', 'Desc 1', 'custom')];
    vi.mocked(definitionLoader.getCustomCategories).mockResolvedValue(mockCategories);

    await command.execute({ source: 'custom' });

    expect(definitionLoader.getCustomCategories).toHaveBeenCalledTimes(1);
    expect(uiManager.displayTable).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [['custom-1', 'Custom Category 1', 'Desc 1', 'custom']]
    );
  });

  it('should list system categories when --source=system', async() => {
    const mockCategories = [createMockCategory('system-1', 'System Category 1', 'Desc Sys 1', 'system')];
    vi.mocked(definitionLoader.getSystemCategories).mockResolvedValue(mockCategories);

    await command.execute({ source: 'system' });

    expect(definitionLoader.getSystemCategories).toHaveBeenCalledTimes(1);
    expect(uiManager.displayTable).toHaveBeenCalledWith(
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
    vi.mocked(definitionLoader.getMergedCategories).mockResolvedValue(mockCategories);

    await command.execute({ source: 'all' });

    expect(definitionLoader.getMergedCategories).toHaveBeenCalledTimes(1);
    expect(uiManager.displayTable).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [
        ['sys-1', 'System Category 1', 'Desc S1', 'system'],
        ['custom-1', 'Custom Category A', 'Desc CA', 'custom'],
        ['sys-2', 'System Category 2 Overridden', 'Desc S2O', 'custom (overrides system)'],
      ]
    );
  });

  it('should display "No custom categories found." if no custom categories exist', async() => {
    vi.mocked(definitionLoader.getCustomCategories).mockResolvedValue([]);
    await command.execute({ source: 'custom' });
    expect(uiManager.showMessage).toHaveBeenCalledWith('info', 'No custom categories found.');
    expect(uiManager.displayTable).not.toHaveBeenCalled();
  });

  it('should display "No system categories found." if no system categories exist', async() => {
    vi.mocked(definitionLoader.getSystemCategories).mockResolvedValue([]);
    await command.execute({ source: 'system' });
    expect(uiManager.showMessage).toHaveBeenCalledWith('info', 'No system categories found.');
    expect(uiManager.displayTable).not.toHaveBeenCalled();
  });

  it('should display "No all categories found." if no merged categories exist', async() => {
    vi.mocked(definitionLoader.getMergedCategories).mockResolvedValue([]);
    await command.execute({ source: 'all' });
    expect(uiManager.showMessage).toHaveBeenCalledWith('info', 'No all categories found.');
    expect(uiManager.displayTable).not.toHaveBeenCalled();
  });

  it('should handle invalid --source value', async() => {
    await command.execute({ source: 'invalid-source' });
    expect(handleError).toHaveBeenCalledWith(
      new Error('Invalid source value: invalid-source. Must be one of \'custom\', \'system\', or \'all\'.')
    );
    expect(uiManager.displayTable).not.toHaveBeenCalled();
    expect(uiManager.showMessage).not.toHaveBeenCalled();
  });

  it('should handle descriptions that are undefined or empty string', async() => {
    const mockCategories = [
      createMockCategory('custom-1', 'Custom Category 1', '', 'custom'),
      { slug: 'custom-2', name: 'Custom Category 2', source: 'user' } as CategoryDefinition, // Undefined description
    ];
    vi.mocked(definitionLoader.getCustomCategories).mockResolvedValue(mockCategories);

    await command.execute({ source: 'custom' });

    expect(uiManager.displayTable).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [
        ['custom-1', 'Custom Category 1', '-', 'custom'],
        ['custom-2', 'Custom Category 2', '-', 'custom'],
      ]
    );
  });

  it('should call handleError if definitionLoader throws an error', async() => {
    const testError = new Error('DefinitionLoader failed');
    vi.mocked(definitionLoader.getCustomCategories).mockRejectedValue(testError);

    await command.execute({ source: 'custom' });

    expect(handleError).toHaveBeenCalledWith(testError);
    expect(uiManager.displayTable).not.toHaveBeenCalled();
  });
});