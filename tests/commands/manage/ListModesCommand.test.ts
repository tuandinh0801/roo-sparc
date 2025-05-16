import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ListModesCommand } from '../../../src/commands/manage/ListModesCommand.js';
import { definitionLoader } from '../../../src/core/DefinitionLoader.js';
import { uiManager } from '../../../src/utils/uiManager.js';
import { handleError } from '../../../src/utils/errorHandler.js';
import type { ModeDefinition, ModeDefinitionWithSource } from '../../../src/types/domain.js';

// Mock dependencies
vi.mock('../../../src/core/DefinitionLoader.js');
vi.mock('../../../src/utils/uiManager.js');
vi.mock('../../../src/utils/errorHandler.js');

const createMockMode = (slug: string, name: string, description: string, source: 'system' | 'custom' | 'user'): ModeDefinition => ({
  slug,
  name,
  description,
  categorySlugs: [],
  associatedRuleFiles: [],
  source: source === 'user' ? 'user' : 'system', // map 'custom' to 'user' for ModeDefinition
});

const createMockModeWithSource = (slug: string, name: string, description: string, sourceType: 'system' | 'custom' | 'custom (overrides system)' ): ModeDefinitionWithSource => ({
  slug,
  name,
  description,
  categorySlugs: [],
  associatedRuleFiles: [],
  sourceType,
  source: sourceType === 'system' ? 'system' : 'user', // Base source
});


describe('ListModesCommand', () => {
  let command: ListModesCommand;

  beforeEach(() => {
    command = new ListModesCommand();
    vi.mocked(definitionLoader.getSystemModes).mockResolvedValue([]);
    vi.mocked(definitionLoader.getCustomModes).mockResolvedValue([]);
    vi.mocked(definitionLoader.getMergedModes).mockResolvedValue([]);
    vi.mocked(uiManager.displayTable).mockClear();
    vi.mocked(uiManager.showMessage).mockClear();
    vi.mocked(handleError).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should list custom modes by default if --source is not provided', async() => {
    const mockModes = [createMockMode('custom-1', 'Custom Mode 1', 'Desc 1', 'custom')];
    vi.mocked(definitionLoader.getCustomModes).mockResolvedValue(mockModes);

    await command.execute({}); // No options, defaults to source=custom

    expect(definitionLoader.getCustomModes).toHaveBeenCalledTimes(1);
    expect(uiManager.displayTable).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [['custom-1', 'Custom Mode 1', 'Desc 1', 'custom']]
    );
    expect(uiManager.showMessage).not.toHaveBeenCalled();
  });

  it('should list custom modes when --source=custom', async() => {
    const mockModes = [createMockMode('custom-1', 'Custom Mode 1', 'Desc 1', 'custom')];
    vi.mocked(definitionLoader.getCustomModes).mockResolvedValue(mockModes);

    await command.execute({ source: 'custom' });

    expect(definitionLoader.getCustomModes).toHaveBeenCalledTimes(1);
    expect(uiManager.displayTable).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [['custom-1', 'Custom Mode 1', 'Desc 1', 'custom']]
    );
  });

  it('should list system modes when --source=system', async() => {
    const mockModes = [createMockMode('system-1', 'System Mode 1', 'Desc Sys 1', 'system')];
    vi.mocked(definitionLoader.getSystemModes).mockResolvedValue(mockModes);

    await command.execute({ source: 'system' });

    expect(definitionLoader.getSystemModes).toHaveBeenCalledTimes(1);
    expect(uiManager.displayTable).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [['system-1', 'System Mode 1', 'Desc Sys 1', 'system']]
    );
  });

  it('should list all (merged) modes when --source=all', async() => {
    const mockModes: ModeDefinitionWithSource[] = [
      createMockModeWithSource('sys-1', 'System Mode 1', 'Desc S1', 'system'),
      createMockModeWithSource('custom-1', 'Custom Mode A', 'Desc CA', 'custom'),
      createMockModeWithSource('sys-2', 'System Mode 2 Overridden', 'Desc S2O', 'custom (overrides system)'),
    ];
    vi.mocked(definitionLoader.getMergedModes).mockResolvedValue(mockModes);

    await command.execute({ source: 'all' });

    expect(definitionLoader.getMergedModes).toHaveBeenCalledTimes(1);
    expect(uiManager.displayTable).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [
        ['sys-1', 'System Mode 1', 'Desc S1', 'system'],
        ['custom-1', 'Custom Mode A', 'Desc CA', 'custom'],
        ['sys-2', 'System Mode 2 Overridden', 'Desc S2O', 'custom (overrides system)'],
      ]
    );
  });

  it('should display "No custom modes found." if no custom modes exist', async() => {
    vi.mocked(definitionLoader.getCustomModes).mockResolvedValue([]);
    await command.execute({ source: 'custom' });
    expect(uiManager.showMessage).toHaveBeenCalledWith('info', 'No custom modes found.');
    expect(uiManager.displayTable).not.toHaveBeenCalled();
  });

  it('should display "No system modes found." if no system modes exist', async() => {
    vi.mocked(definitionLoader.getSystemModes).mockResolvedValue([]);
    await command.execute({ source: 'system' });
    expect(uiManager.showMessage).toHaveBeenCalledWith('info', 'No system modes found.');
    expect(uiManager.displayTable).not.toHaveBeenCalled();
  });

  it('should display "No all modes found." if no merged modes exist', async() => {
    vi.mocked(definitionLoader.getMergedModes).mockResolvedValue([]);
    await command.execute({ source: 'all' });
    expect(uiManager.showMessage).toHaveBeenCalledWith('info', 'No all modes found.');
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
    const mockModes = [
      createMockMode('custom-1', 'Custom Mode 1', '', 'custom'),
      // Explicitly provide description as empty string or use a helper that does.
      // The original object literal was missing 'description', which is required by ModeDefinition.
      createMockMode('custom-2', 'Custom Mode 2', '', 'custom'),
    ];
    vi.mocked(definitionLoader.getCustomModes).mockResolvedValue(mockModes);

    await command.execute({ source: 'custom' });

    expect(uiManager.displayTable).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [
        ['custom-1', 'Custom Mode 1', '-', 'custom'],
        ['custom-2', 'Custom Mode 2', '-', 'custom'],
      ]
    );
  });

  it('should call handleError if definitionLoader throws an error', async() => {
    const testError = new Error('DefinitionLoader failed');
    vi.mocked(definitionLoader.getCustomModes).mockRejectedValue(testError);

    await command.execute({ source: 'custom' });

    expect(handleError).toHaveBeenCalledWith(testError);
    expect(uiManager.displayTable).not.toHaveBeenCalled();
  });
});