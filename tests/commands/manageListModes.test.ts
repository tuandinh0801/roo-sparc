import { vi, describe, it, expect, beforeEach } from 'vitest';
import { manageListModes as manageListModesHandler } from '../../src/commands/manageListModes.js';
import { ModeDefinition, SourceType } from '../../src/types/domain.js';
import { ModeDefinitionDisplay } from '../../src/core/DefinitionLoader.js'; // Original type for test data

// Mock modules and provide factory functions that return vi.fn()
vi.mock('../../src/core/DefinitionLoader.js', () => ({
  definitionLoader: {
    getModeDefinitions: vi.fn()
  }
}));
vi.mock('../../src/utils/uiManager.js', () => ({
  displayTable: vi.fn(),
  showMessage: vi.fn(),
}));

// Import the functions AFTER they have been mocked.
// These imports will now resolve to the vi.fn() instances created by the factories.
import { definitionLoader } from '../../src/core/DefinitionLoader.js';
import { displayTable, showMessage } from '../../src/utils/uiManager.js';

// Cast to access mock-specific properties like .mockClear(), .mockResolvedValue()
const mockedGetModeDefinitions = definitionLoader.getModeDefinitions as ReturnType<typeof vi.fn>;
const mockedDisplayTable = displayTable as ReturnType<typeof vi.fn>;
const mockedShowMessage = showMessage as ReturnType<typeof vi.fn>;

const mockCommand = {} as any; // Mock Commander.Command object

describe('manageListModes Command', () => {
  beforeEach(() => {
    // Clear mocks before each test
    mockedGetModeDefinitions.mockClear();
    mockedDisplayTable.mockClear();
    mockedShowMessage.mockClear();
  });

  describe('--source=custom (default)', () => {
    it('AC1: should display only custom modes when --source=custom is used', async() => {
      const customModesData: ModeDefinition[] = [
        { slug: 'custom-mode-1', name: 'Custom Mode 1', description: 'Desc 1', categorySlugs: [], associatedRuleFiles: [], source: 'user' },
        { slug: 'custom-mode-2', name: 'Custom Mode 2', description: 'Desc 2', categorySlugs: [], associatedRuleFiles: [], source: 'user' },
      ];
      mockedGetModeDefinitions.mockResolvedValue(customModesData);

      await manageListModesHandler({ source: 'custom' }, mockCommand);

      expect(mockedGetModeDefinitions).toHaveBeenCalledWith('custom');
      expect(mockedDisplayTable).toHaveBeenCalledWith(
        ['Slug', 'Name', 'Description', 'Source'],
        [
          ['custom-mode-1', 'Custom Mode 1', 'Desc 1', 'custom'],
          ['custom-mode-2', 'Custom Mode 2', 'Desc 2', 'custom'],
        ]
      );
      expect(mockedShowMessage).not.toHaveBeenCalled();
    });

    it('AC1: should display only custom modes when --source is omitted (default)', async() => {
      const customModesData: ModeDefinition[] = [
        { slug: 'custom-mode-default', name: 'Custom Mode Default', description: 'Default Desc', categorySlugs: [], associatedRuleFiles: [], source: 'user' },
      ];
      mockedGetModeDefinitions.mockResolvedValue(customModesData);

      await manageListModesHandler({ source: undefined }, mockCommand);

      expect(mockedGetModeDefinitions).toHaveBeenCalledWith('custom');
      expect(mockedDisplayTable).toHaveBeenCalledWith(
        ['Slug', 'Name', 'Description', 'Source'],
        [
          ['custom-mode-default', 'Custom Mode Default', 'Default Desc', 'custom'],
        ]
      );
      expect(mockedShowMessage).not.toHaveBeenCalled();
    });

    it('AC5: should display "No custom modes found." message if no custom modes exist', async() => {
      mockedGetModeDefinitions.mockResolvedValue([]);
      await manageListModesHandler({ source: 'custom' }, mockCommand);
      expect(mockedShowMessage).toHaveBeenCalledWith('info', 'No custom modes found.');
      expect(mockedDisplayTable).not.toHaveBeenCalled();
    });
  });

  describe('--source=system', () => {
    it('AC2: should display only system modes when --source=system is used', async() => {
      const systemModesData: ModeDefinition[] = [
        { slug: 'system-mode-1', name: 'System Mode 1', description: 'Sys Desc 1', categorySlugs: [], associatedRuleFiles: [], source: 'system' },
        { slug: 'system-mode-2', name: 'System Mode 2', description: 'Sys Desc 2', categorySlugs: [], associatedRuleFiles: [], source: 'system' },
      ];
      mockedGetModeDefinitions.mockResolvedValue(systemModesData);

      await manageListModesHandler({ source: 'system' }, mockCommand);

      expect(mockedGetModeDefinitions).toHaveBeenCalledWith('system');
      expect(mockedDisplayTable).toHaveBeenCalledWith(
        ['Slug', 'Name', 'Description', 'Source'],
        [
          ['system-mode-1', 'System Mode 1', 'Sys Desc 1', 'system'],
          ['system-mode-2', 'System Mode 2', 'Sys Desc 2', 'system'],
        ]
      );
      expect(mockedShowMessage).not.toHaveBeenCalled();
    });

    it('AC5: should display "No system modes found." message if no system modes exist', async() => {
      mockedGetModeDefinitions.mockResolvedValue([]);
      await manageListModesHandler({ source: 'system' }, mockCommand);
      expect(mockedShowMessage).toHaveBeenCalledWith('info', 'No system modes found.');
      expect(mockedDisplayTable).not.toHaveBeenCalled();
    });
  });

  describe('--source=all', () => {
    it('AC3: should display all modes (system, custom, and overrides)', async() => {
      const allModesData: ModeDefinitionDisplay[] = [
        { slug: 'sys-1', name: 'System 1', description: 'Sys Desc 1', categorySlugs: [], associatedRuleFiles: [], source: 'system', sourceType: 'system' },
        { slug: 'custom-1', name: 'Custom 1', description: 'Custom Desc 1', categorySlugs: [], associatedRuleFiles: [], source: 'user', sourceType: 'custom' },
        { slug: 'override-1', name: 'Override 1', description: 'Override Desc 1', categorySlugs: [], associatedRuleFiles: [], source: 'user', sourceType: 'custom-override' },
      ];
      mockedGetModeDefinitions.mockResolvedValue(allModesData);

      await manageListModesHandler({ source: 'all' }, mockCommand);

      expect(mockedGetModeDefinitions).toHaveBeenCalledWith('all');
      expect(mockedDisplayTable).toHaveBeenCalledWith(
        ['Slug', 'Name', 'Description', 'Source'],
        [
          ['sys-1', 'System 1', 'Sys Desc 1', 'system'],
          ['custom-1', 'Custom 1', 'Custom Desc 1', 'custom'],
          ['override-1', 'Override 1', 'Override Desc 1', 'custom (overrides system)'],
        ]
      );
      expect(mockedShowMessage).not.toHaveBeenCalled();
    });

    it('AC5: should display "No modes found." message if no modes exist at all for source=all', async() => {
      mockedGetModeDefinitions.mockResolvedValue([]);
      await manageListModesHandler({ source: 'all' }, mockCommand);
      expect(mockedShowMessage).toHaveBeenCalledWith('info', 'No modes found.');
      expect(mockedDisplayTable).not.toHaveBeenCalled();
    });
  });
});