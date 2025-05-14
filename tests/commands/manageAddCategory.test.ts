import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import actualChalk from 'chalk';
import path from 'node:path';
import os from 'node:os';
import fs from 'fs-extra';
import type { UserDefinitions, ModeDefinition, CategoryDefinition } from '../../src/types/domain.js';

// Use vi.hoisted to ensure spies are initialized before mock factories
const uiManagerPromptInputSpy = vi.hoisted(() => vi.fn());
const uiManagerPrintErrorSpy = vi.hoisted(() => vi.fn());
const uiManagerPrintSuccessSpy = vi.hoisted(() => vi.fn());

const definitionLoaderLoadDefinitionsSpy = vi.hoisted(() => vi.fn());

const fileManagerReadUserDefinitionsSpy = vi.hoisted(() => vi.fn());
const fileManagerWriteUserDefinitionsSpy = vi.hoisted(() => vi.fn());
const fileManagerGetUserConfigPathSpy = vi.hoisted(() => vi.fn());
const fileManagerEnsureUserConfigDirectoriesSpy = vi.hoisted(() => vi.fn());

// --- Mocking uiManager.js ---
vi.mock('../../src/utils/uiManager.js', () => {
  return {
    __esModule: true,
    UIManager: vi.fn().mockImplementation(() => ({
      chalk: actualChalk,
      printBanner: vi.fn(),
      startSpinner: vi.fn(),
      stopSpinner: vi.fn(),
      succeedSpinner: vi.fn(),
      failSpinner: vi.fn(),
      updateSpinnerText: vi.fn(),
      infoSpinner: vi.fn(),
      warnSpinner: vi.fn(),
      printSuccess: uiManagerPrintSuccessSpy, // Use the hoisted spy
      printError: uiManagerPrintErrorSpy,     // Use the hoisted spy
      printWarning: vi.fn(),
      printInfo: vi.fn(),
      printAbortMessage: vi.fn(),
      promptInput: uiManagerPromptInputSpy,   // Use the hoisted spy
      // ... other methods
    })),
  };
});

// --- Mocking DefinitionLoader.js ---
vi.mock('../../src/core/DefinitionLoader.js', () => {
  return {
    __esModule: true,
    DefinitionLoader: vi.fn().mockImplementation(() => ({
      loadDefinitions: definitionLoaderLoadDefinitionsSpy, // Use the hoisted spy
      getSystemDefinitionsPath: vi.fn(() => 'mock/system/definitions/path'),
      // ... other methods
    })),
  };
});

// --- Mocking FileManager.js ---
vi.mock('../../src/core/FileManager.js', () => {
  return {
    __esModule: true,
    FileManager: vi.fn().mockImplementation(() => ({
      readUserDefinitions: fileManagerReadUserDefinitionsSpy, // Use the hoisted spy
      writeUserDefinitions: fileManagerWriteUserDefinitionsSpy, // Use the hoisted spy
      getUserConfigPath: fileManagerGetUserConfigPathSpy,       // Use the hoisted spy
      ensureUserConfigDirectories: fileManagerEnsureUserConfigDirectoriesSpy, // Use the hoisted spy
      // ... other methods
    })),
  };
});

// Import the SUT *after* all vi.mock and vi.hoisted calls.
import { manageAddCategory } from '../../src/commands/manageAddCategory.js';

const TEMP_USER_DIR = path.join(os.tmpdir(), 'roo-init-test-vi-hoisted');
const USER_DEFS_PATH = path.join(TEMP_USER_DIR, 'user-definitions.json');

describe('manageAddCategory command', () => {
  let mockUserDefinitionsData: UserDefinitions;

  beforeEach(async() => {
    // Reset all spies (which are now top-level consts initialized by vi.hoisted)
    uiManagerPromptInputSpy.mockReset();
    uiManagerPrintErrorSpy.mockReset();
    uiManagerPrintSuccessSpy.mockReset();
    definitionLoaderLoadDefinitionsSpy.mockReset();
    fileManagerReadUserDefinitionsSpy.mockReset();
    fileManagerWriteUserDefinitionsSpy.mockReset();
    fileManagerGetUserConfigPathSpy.mockReset();
    fileManagerEnsureUserConfigDirectoriesSpy.mockReset();

    // Also reset the mock constructor calls and their instances if needed,
    // though for this test structure, resetting the spies themselves is key.
    // vi.resetAllMocks() would also cover this, but explicit resets are fine.

    fileManagerGetUserConfigPathSpy.mockReturnValue(TEMP_USER_DIR);
    fileManagerEnsureUserConfigDirectoriesSpy.mockResolvedValue({ configPath: TEMP_USER_DIR, rulesPath: path.join(TEMP_USER_DIR, 'rules') });

    mockUserDefinitionsData = {
      customModes: [],
      customCategories: [],
    };

    definitionLoaderLoadDefinitionsSpy.mockResolvedValue({
      modes: [] as ModeDefinition[],
      categories: [] as CategoryDefinition[],
      rules: new Map(),
    });
    fileManagerReadUserDefinitionsSpy.mockResolvedValue(mockUserDefinitionsData);
    fileManagerWriteUserDefinitionsSpy.mockResolvedValue(undefined);

    uiManagerPromptInputSpy
      .mockResolvedValueOnce('new-cat')
      .mockResolvedValueOnce('New Category')
      .mockResolvedValueOnce('A new test category.');

    await fs.ensureDir(TEMP_USER_DIR);
  });

  afterEach(async() => {
    await fs.remove(TEMP_USER_DIR);
  });

  it('should successfully add a new category with all fields when user-definitions.json exists', async() => {
    await manageAddCategory();
    expect(uiManagerPromptInputSpy).toHaveBeenCalledTimes(3);
    expect(fileManagerWriteUserDefinitionsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        customCategories: [expect.objectContaining({ slug: 'new-cat', name: 'New Category', description: 'A new test category.' })],
      })
    );
    expect(uiManagerPrintSuccessSpy).toHaveBeenCalledWith(expect.stringContaining('Category "New Category" (new-cat) added successfully!'));
  });

  it('should re-prompt for slug if a duplicate custom slug is entered', async() => {
    definitionLoaderLoadDefinitionsSpy.mockResolvedValueOnce({
      modes: [] as ModeDefinition[],
      categories: [{ slug: 'existing-cat', name: 'Existing Category', description: 'An existing one', source: 'user' as const }],
      rules: new Map(),
    });
    uiManagerPromptInputSpy.mockReset() // Reset for specific sequence in this test
      .mockResolvedValueOnce('existing-cat')
      .mockResolvedValueOnce('unique-cat')
      .mockResolvedValueOnce('Unique Category Name')
      .mockResolvedValueOnce('A unique one');
    await manageAddCategory();
    expect(uiManagerPromptInputSpy).toHaveBeenCalledTimes(4);
    expect(uiManagerPrintErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Category slug "existing-cat" already exists. Please choose a unique slug.'));
    expect(fileManagerWriteUserDefinitionsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        customCategories: [expect.objectContaining({ slug: 'unique-cat', name: 'Unique Category Name', description: 'A unique one' })],
      })
    );
    expect(uiManagerPrintSuccessSpy).toHaveBeenCalledWith(expect.stringContaining('Category "Unique Category Name" (unique-cat) added successfully!'));
  });

  it('should create user-definitions.json and add the category if the file does not exist', async() => {
    fileManagerReadUserDefinitionsSpy.mockResolvedValueOnce(null);
    uiManagerPromptInputSpy.mockReset()
      .mockResolvedValueOnce('new-cat')
      .mockResolvedValueOnce('New Category')
      .mockResolvedValueOnce('A new test category.');
    await manageAddCategory();
    expect(uiManagerPromptInputSpy).toHaveBeenCalledTimes(3);
    expect(fileManagerWriteUserDefinitionsSpy).toHaveBeenCalledWith({
      customModes: [],
      customCategories: [expect.objectContaining({ slug: 'new-cat', name: 'New Category', description: 'A new test category.' })],
    });
    expect(uiManagerPrintSuccessSpy).toHaveBeenCalledWith(expect.stringContaining('Category "New Category" (new-cat) added successfully!'));
  });

  it('should initialize and add the category if user-definitions.json is empty or malformed (empty object)', async() => {
    fileManagerReadUserDefinitionsSpy.mockResolvedValueOnce({} as UserDefinitions);
    uiManagerPromptInputSpy.mockReset()
      .mockResolvedValueOnce('new-cat')
      .mockResolvedValueOnce('New Category')
      .mockResolvedValueOnce('A new test category.');
    await manageAddCategory();
    expect(fileManagerWriteUserDefinitionsSpy).toHaveBeenCalledWith({
      customModes: [],
      customCategories: [expect.objectContaining({ slug: 'new-cat', name: 'New Category', description: 'A new test category.' })],
    });
    expect(uiManagerPrintSuccessSpy).toHaveBeenCalledWith(expect.stringContaining('Category "New Category" (new-cat) added successfully!'));
  });

  it('should add a category without a description if not provided', async() => {
    uiManagerPromptInputSpy.mockReset()
      .mockResolvedValueOnce('no-desc-cat')
      .mockResolvedValueOnce('No Desc Category')
      .mockResolvedValueOnce('');
    await manageAddCategory();
    expect(fileManagerWriteUserDefinitionsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        customCategories: [expect.objectContaining({ slug: 'no-desc-cat', name: 'No Desc Category', description: undefined })],
      })
    );
    expect(uiManagerPrintSuccessSpy).toHaveBeenCalledWith(expect.stringContaining('Category "No Desc Category" (no-desc-cat) added successfully!'));
  });

  it('should handle errors during file writing and log an error', async() => {
    const writeError = new Error('Disk full');
    fileManagerWriteUserDefinitionsSpy.mockRejectedValueOnce(writeError);
    uiManagerPromptInputSpy.mockReset()
      .mockResolvedValueOnce('new-cat')
      .mockResolvedValueOnce('New Category')
      .mockResolvedValueOnce('A new test category.');
    await manageAddCategory();
    expect(uiManagerPrintErrorSpy).toHaveBeenCalledWith('Failed to save category definition: Disk full');
    expect(uiManagerPrintSuccessSpy).not.toHaveBeenCalled();
  });

  it('should handle errors during definition loading and log an error', async() => {
    const loadError = new Error('Cannot load definitions');
    definitionLoaderLoadDefinitionsSpy.mockRejectedValueOnce(loadError);
    uiManagerPromptInputSpy.mockReset();
    await manageAddCategory();
    expect(uiManagerPrintErrorSpy).toHaveBeenCalledWith('Failed to load existing definitions: Cannot load definitions');
    expect(fileManagerWriteUserDefinitionsSpy).not.toHaveBeenCalled();
  });

  describe('Integration with FileManager (using temp directory)', () => {
    beforeEach(async() => {
      await fs.ensureDir(TEMP_USER_DIR);
      await fs.remove(USER_DEFS_PATH);

      fileManagerReadUserDefinitionsSpy.mockImplementation(async() => {
        try {
          if (!await fs.pathExists(USER_DEFS_PATH)) { return null; }
          return await fs.readJson(USER_DEFS_PATH) as UserDefinitions;
        } catch (e: any) {
          if (e.code === 'ENOENT') { return null; } throw e;
        }
      });
      fileManagerWriteUserDefinitionsSpy.mockImplementation(async(data: UserDefinitions) => {
        await fs.ensureDir(TEMP_USER_DIR);
        await fs.writeJson(USER_DEFS_PATH, data, { spaces: 2 });
      });
    });

    it('should create user-definitions.json with the new category if it does not exist (integration)', async() => {
      uiManagerPromptInputSpy.mockReset()
        .mockResolvedValueOnce('integ-cat')
        .mockResolvedValueOnce('Integ Category')
        .mockResolvedValueOnce('Integration test category.');
      await manageAddCategory();
      expect(await fs.pathExists(USER_DEFS_PATH)).toBe(true);
      const savedDefs = await fs.readJson(USER_DEFS_PATH) as UserDefinitions;
      expect(savedDefs.customCategories).toEqual([
        expect.objectContaining({ slug: 'integ-cat', name: 'Integ Category', description: 'Integration test category.' }),
      ]);
      expect(uiManagerPrintSuccessSpy).toHaveBeenCalledWith(expect.stringContaining('Category "Integ Category" (integ-cat) added successfully!'));
    });

    it('should append to existing customCategories array if user-definitions.json exists (integration)', async() => {
      const initialDefs: UserDefinitions = {
        customModes: [],
        customCategories: [{ slug: 'first-cat', name: 'First Category', description: 'desc1' }],
      };
      await fs.ensureDir(TEMP_USER_DIR);
      await fs.writeJson(USER_DEFS_PATH, initialDefs, { spaces: 2 });
      uiManagerPromptInputSpy.mockReset()
        .mockResolvedValueOnce('second-cat')
        .mockResolvedValueOnce('Second Category')
        .mockResolvedValueOnce('desc2');
      await manageAddCategory();
      const savedDefs = await fs.readJson(USER_DEFS_PATH) as UserDefinitions;
      expect(savedDefs.customCategories).toHaveLength(2);
      expect(savedDefs.customCategories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ slug: 'first-cat' }),
          expect.objectContaining({ slug: 'second-cat', name: 'Second Category', description: 'desc2' }),
        ])
      );
      expect(uiManagerPrintSuccessSpy).toHaveBeenCalledWith(expect.stringContaining('Category "Second Category" (second-cat) added successfully!'));
    });
  });
});