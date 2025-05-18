import { describe, it, expect, vi, beforeEach, afterEach, Mocked } from 'vitest';
import { ListModesCommand } from '../../../src/commands/manage/ListModesCommand.js';
import { definitionLoader, DefinitionLoader } from '../../../src/core/DefinitionLoader.js';
import { uiManager, UIManager } from '../../../src/utils/uiManager.js';
import { handleError } from '../../../src/utils/errorHandler.js';
import type { ModeDefinition, ModeDefinitionWithSource } from '../../../src/types/domain.js';
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
  let mockCommandOptions: CommandOptions;

  beforeEach(() => {
    // Create instances of mocked classes
    const mockedUiManager = new UIManager() as Mocked<UIManager>;
    const mockedDefinitionLoader = new DefinitionLoader({} as FileManager, mockedUiManager) as Mocked<DefinitionLoader>;
    const mockedFileManager = new FileManager(mockedUiManager) as Mocked<FileManager>;

    mockCommandOptions = {
      ui: mockedUiManager,
      definitionLoader: mockedDefinitionLoader,
      fileManager: mockedFileManager,
    };

    command = new ListModesCommand(mockCommandOptions);
    vi.mocked(mockedDefinitionLoader.getSystemModes).mockResolvedValue([]);
    vi.mocked(mockedDefinitionLoader.getCustomModes).mockResolvedValue([]);
    vi.mocked(mockedDefinitionLoader.getMergedModes).mockResolvedValue([]);
    vi.mocked(mockedUiManager.displayTable).mockClear();
    vi.mocked(mockedUiManager.showMessage).mockClear();
    vi.mocked(handleError).mockClear(); // handleError is a standalone function, so vi.mocked() is correct here
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should list custom modes by default if --source is not provided', async() => {
    const mockModes = [createMockModeWithSource('custom-1', 'Custom Mode 1', 'Desc 1', 'custom')];
    vi.mocked(mockCommandOptions.definitionLoader.getCustomModes).mockResolvedValue(mockModes);

    await command.execute({}); // No options, defaults to source=custom

    expect(mockCommandOptions.definitionLoader.getCustomModes).toHaveBeenCalledTimes(1);
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [['custom-1', 'Custom Mode 1', 'Desc 1', 'custom']]
    );
    expect(vi.mocked(mockCommandOptions.ui.showMessage)).not.toHaveBeenCalled();
  });

  it('should list custom modes when --source=custom', async() => {
    const mockModes = [createMockModeWithSource('custom-1', 'Custom Mode 1', 'Desc 1', 'custom')];
    vi.mocked(mockCommandOptions.definitionLoader.getCustomModes).mockResolvedValue(mockModes);

    await command.execute({ source: 'custom' });

    expect(mockCommandOptions.definitionLoader.getCustomModes).toHaveBeenCalledTimes(1);
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [['custom-1', 'Custom Mode 1', 'Desc 1', 'custom']]
    );
  });

  it('should list system modes when --source=system', async() => {
    const mockModes = [createMockModeWithSource('system-1', 'System Mode 1', 'Desc Sys 1', 'system')];
    vi.mocked(mockCommandOptions.definitionLoader.getSystemModes).mockResolvedValue(mockModes);

    await command.execute({ source: 'system' });

    expect(mockCommandOptions.definitionLoader.getSystemModes).toHaveBeenCalledTimes(1);
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).toHaveBeenCalledWith(
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
    vi.mocked(mockCommandOptions.definitionLoader.getMergedModes).mockResolvedValue(mockModes);

    await command.execute({ source: 'all' });

    expect(mockCommandOptions.definitionLoader.getMergedModes).toHaveBeenCalledTimes(1);
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [
        ['sys-1', 'System Mode 1', 'Desc S1', 'system'],
        ['custom-1', 'Custom Mode A', 'Desc CA', 'custom'],
        ['sys-2', 'System Mode 2 Overridden', 'Desc S2O', 'custom (overrides system)'],
      ]
    );
  });

  it('should display "No custom modes found." if no custom modes exist', async() => {
    vi.mocked(mockCommandOptions.definitionLoader.getCustomModes).mockResolvedValue([]);
    await command.execute({ source: 'custom' });
    expect(vi.mocked(mockCommandOptions.ui.showMessage)).toHaveBeenCalledWith('info', 'No custom modes found.');
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).not.toHaveBeenCalled();
  });

  it('should display "No system modes found." if no system modes exist', async() => {
    vi.mocked(mockCommandOptions.definitionLoader.getSystemModes).mockResolvedValue([]);
    await command.execute({ source: 'system' });
    expect(vi.mocked(mockCommandOptions.ui.showMessage)).toHaveBeenCalledWith('info', 'No system modes found.');
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).not.toHaveBeenCalled();
  });

  it('should display "No all modes found." if no merged modes exist', async() => {
    vi.mocked(mockCommandOptions.definitionLoader.getMergedModes).mockResolvedValue([]);
    await command.execute({ source: 'all' });
    expect(vi.mocked(mockCommandOptions.ui.showMessage)).toHaveBeenCalledWith('info', 'No all modes found.');
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
    const mockModes: ModeDefinitionWithSource[] = [
      createMockModeWithSource('custom-1', 'Custom Mode 1', '', 'custom'), // Empty string description
      createMockModeWithSource('custom-2', 'Custom Mode 2', '', 'custom'), // Explicitly empty string for the second case
    ];
    vi.mocked(mockCommandOptions.definitionLoader.getCustomModes).mockResolvedValue(mockModes);

    await command.execute({ source: 'custom' });

    expect(vi.mocked(mockCommandOptions.ui.displayTable)).toHaveBeenCalledWith(
      ['Slug', 'Name', 'Description', 'Source'],
      [
        ['custom-1', 'Custom Mode 1', '-', 'custom'],
        ['custom-2', 'Custom Mode 2', '-', 'custom'],
      ]
    );
  });

  it('should call handleError if definitionLoader throws an error', async() => {
    const testError = new Error('DefinitionLoader failed');
    vi.mocked(mockCommandOptions.definitionLoader.getCustomModes).mockRejectedValue(testError);

    await command.execute({ source: 'custom' });

    expect(handleError).toHaveBeenCalledWith(testError);
    expect(vi.mocked(mockCommandOptions.ui.displayTable)).not.toHaveBeenCalled();
  });
});