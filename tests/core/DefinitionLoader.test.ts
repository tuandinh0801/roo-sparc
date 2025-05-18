import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import fsExtra from 'fs-extra'; // Renamed to avoid conflict with node:fs
import fs from 'node:fs'; // Import the actual node:fs for typing, but it will be mocked
import path from 'path';

// Unmock DefinitionLoader for this specific test file to use the actual implementation
vi.unmock('../../src/core/DefinitionLoader.js');

import { DefinitionLoader } from '../../src/core/DefinitionLoader.js';
import type { ModeDefinition, CategoryDefinition, UserDefinitions, Rule, ModeDefinitionWithSource, CategoryDefinitionWithSource, DefinitionSource } from '../../src/types/domain.js';
import { FileManager } from '../../src/core/FileManager.js';
import { UIManager } from '../../src/utils/uiManager.js'; // For typing FileManager's uiManager property

// Import centralized ErrorHandler mocks
import { resetErrorHandlerMocks } from '../setup/globalUtilityMocks.js';

// Test data factories with proper types
const createTestRule = (overrides: Partial<Rule> = {}): Rule => ({
  id: 'test-rule',
  name: 'Test Rule',
  description: 'A test rule',
  sourcePath: 'test/rule.md',
  isGeneric: true,
  ...overrides
});

const createTestMode = (overrides: Partial<ModeDefinitionWithSource> = {}): ModeDefinitionWithSource => ({
  slug: 'test-mode',
  name: 'Test Mode',
  description: 'A test mode',
  categorySlugs: ['test-category'],
  associatedRuleFiles: [],
  source: 'system', // 'source' is still relevant for initial parsing/merging logic if used by Zod schema
  sourceType: 'system', // Default sourceType
  ...overrides
});

const createTestCategory = (overrides: Partial<CategoryDefinitionWithSource> = {}): CategoryDefinitionWithSource => ({
  slug: 'test-category',
  name: 'Test Category',
  description: 'A test category',
  source: 'system', // 'source' is still relevant
  sourceType: 'system', // Default sourceType
  ...overrides
});

// Mock fs-extra. The actual mock functions are created below.
vi.mock('fs-extra');
vi.mock('node:fs', () => ({
  default: { // Provide a default export for the mock
    writeSync: vi.fn(), // Mock writeSync
    // Add other 'node:fs' functions if DefinitionLoader starts using them directly
  },
  __esModule: true, // Important for ES Modules
}));

// Declare spies for FileManager methods with specific types.
// These will be initialized in beforeEach.
let mockFileManagerInstance: Partial<FileManager> & { uiManager: Partial<UIManager> }; // For the instance passed to DefinitionLoader
let mockUiManagerInstance: UIManager;
let ensureUserConfigDirectoriesMock: Mock<[], Promise<{ configPath: string; rulesPath: string }>>;
let getUserConfigPathMock: Mock<[], string>;
let writeRoomodesFileMock: Mock<[string, ModeDefinition[], boolean], Promise<void>>;
let writeJsonMock: Mock<[string, any, boolean], Promise<void>>;
let createDirectoryIfNotExistsMock: Mock<[string], Promise<void>>;
let copyFileMock: Mock<[string, string, boolean], Promise<void>>;
let copyDirectoryContentsMock: Mock<[string, string, boolean, string?], Promise<void>>;
let ensureRuleSpecificDirectoriesMock: Mock<[string, string], Promise<void>>;
let copyRuleFilesForModeMock: Mock<[string, string, string[], boolean], Promise<void>>;
let readUserDefinitionsMock: Mock<[], Promise<UserDefinitions | null>>;
let writeUserDefinitionsMock: Mock<[UserDefinitions], Promise<void>>;


// --- Test Data Setup using the new factory ---
const testSystemModes: ModeDefinitionWithSource[] = [
  createTestMode({
    slug: 'sys-mode-1',
    name: 'System Mode 1',
    categorySlugs: ['sys-cat-1'],
    associatedRuleFiles: [
      createTestRule({ id: 'sys-rule-1', sourcePath: 'generic/sys-rule-1.md', isGeneric: true }),
      createTestRule({ id: 'sys-rule-2', sourcePath: 'sys-mode-1/specific-rule.md', isGeneric: false }),
    ],
    source: 'system',
    sourceType: 'system'
  }),
  createTestMode({
    slug: 'sys-mode-2',
    name: 'System Mode 2',
    categorySlugs: ['sys-cat-2'],
    source: 'system',
    sourceType: 'system'
  })
];

const testSystemCategories: CategoryDefinitionWithSource[] = [
  createTestCategory({ slug: 'sys-cat-1', name: 'System Category 1', source: 'system', sourceType: 'system' }),
  createTestCategory({ slug: 'sys-cat-2', name: 'System Category 2', source: 'system', sourceType: 'system' }),
];

const testUserModes: ModeDefinitionWithSource[] = [
  createTestMode({
    slug: 'user-mode-1',
    name: 'User Mode 1',
    categorySlugs: ['user-cat-1'],
    associatedRuleFiles: [
      createTestRule({ id: 'user-rule-1', sourcePath: 'user-mode-1/user-rule.md', isGeneric: false })
    ],
    source: 'user',
    sourceType: 'custom'
  }),
  createTestMode({ // To test override
    slug: 'sys-mode-1',
    name: 'User Overridden System Mode 1',
    categorySlugs: ['sys-cat-1', 'user-cat-1'],
    source: 'user',
    sourceType: 'custom' // Initial sourceType is 'custom', merging logic updates it
  })
];

const testUserCategories: CategoryDefinitionWithSource[] = [
  createTestCategory({ slug: 'user-cat-1', name: 'User Category 1', source: 'user', sourceType: 'custom' }),
  createTestCategory({ // To test override
    slug: 'sys-cat-1',
    name: 'User Overridden System Category 1',
    source: 'user',
    sourceType: 'custom' // Initial sourceType is 'custom'
  })
];

const testUserDefinitions: UserDefinitions = {
  customModes: testUserModes,
  customCategories: testUserCategories,
};


describe('DefinitionLoader', () => {
  const MOCK_SYSTEM_DEFINITIONS_PATH = '/abs/path/to/system/definitions';
  const MOCK_USER_CONFIG_PATH = '/abs/path/to/user/config';
  const MOCK_SYSTEM_RULES_PATH = path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'rules');
  const MOCK_USER_RULES_PATH = path.join(MOCK_USER_CONFIG_PATH, 'rules');

  let loader: DefinitionLoader;

  // Get typed mock functions from fs-extra
  const fsExtraPathExistsMock = vi.mocked(fsExtra.pathExists);
  const fsExtraReadJsonMock = vi.mocked(fsExtra.readJson);
  // We don't need a typed mock for fs.writeSync from 'node:fs' here
  // as it's mocked globally above and we're not checking its calls in this specific test suite,
  // but if we were, we'd get it from the vi.mock factory.

  beforeEach(() => {
    vi.resetAllMocks(); // Resets all mocks (including fs-extra and node:fs)
    resetErrorHandlerMocks();

    // Reset test data
    mockFileManagerInstance = {
      ensureUserConfigDirectories: ensureUserConfigDirectoriesMock,
      getUserConfigPath: getUserConfigPathMock,
      writeRoomodesFile: writeRoomodesFileMock,
      writeJson: writeJsonMock,
      createDirectoryIfNotExists: createDirectoryIfNotExistsMock,
      copyFile: copyFileMock,
      copyDirectoryContents: copyDirectoryContentsMock,
      ensureRuleSpecificDirectories: ensureRuleSpecificDirectoriesMock,
      copyRuleFilesForMode: copyRuleFilesForModeMock,
      readUserDefinitions: readUserDefinitionsMock,
      writeUserDefinitions: writeUserDefinitionsMock,
      uiManager: {
        chalk: {
          green: (str: string) => str,
          red: (str: string) => str,
          yellow: (str: string) => str,
          blue: (str: string) => str,
          cyan: (str: string) => str,
        },
      } as unknown as UIManager,
    };

    // Initialize ALL spies for FileManager methods
    ensureUserConfigDirectoriesMock = vi.fn().mockResolvedValue({
      configPath: MOCK_USER_CONFIG_PATH,
      rulesPath: MOCK_USER_RULES_PATH,
    });
    getUserConfigPathMock = vi.fn().mockReturnValue(MOCK_USER_CONFIG_PATH);
    writeRoomodesFileMock = vi.fn().mockResolvedValue(undefined);
    writeJsonMock = vi.fn().mockResolvedValue(undefined);
    createDirectoryIfNotExistsMock = vi.fn().mockResolvedValue(undefined);
    copyFileMock = vi.fn().mockResolvedValue(undefined);
    copyDirectoryContentsMock = vi.fn().mockResolvedValue(undefined);
    ensureRuleSpecificDirectoriesMock = vi.fn().mockResolvedValue(undefined);
    copyRuleFilesForModeMock = vi.fn().mockResolvedValue(undefined);
    readUserDefinitionsMock = vi.fn().mockResolvedValue(null);
    writeUserDefinitionsMock = vi.fn().mockResolvedValue(undefined);

    // Create a simple mock object for FileManager for this test suite
    mockFileManagerInstance = {
      ensureUserConfigDirectories: ensureUserConfigDirectoriesMock,
      getUserConfigPath: getUserConfigPathMock,
      writeRoomodesFile: writeRoomodesFileMock,
      writeJson: writeJsonMock,
      createDirectoryIfNotExists: createDirectoryIfNotExistsMock,
      copyFile: copyFileMock,
      copyDirectoryContents: copyDirectoryContentsMock,
      ensureRuleSpecificDirectories: ensureRuleSpecificDirectoriesMock,
      copyRuleFilesForMode: copyRuleFilesForModeMock,
      readUserDefinitions: readUserDefinitionsMock,
      writeUserDefinitions: writeUserDefinitionsMock,
      uiManager: { // This is for the FileManager's UIManager, not the one for DefinitionLoader directly
        startSpinner: vi.fn(),
        stopSpinner: vi.fn(),
        succeedSpinner: vi.fn(),
        failSpinner: vi.fn(),
        updateSpinnerText: vi.fn(),
        infoSpinner: vi.fn(),
        warnSpinner: vi.fn(),
        printSuccess: vi.fn(),
        printError: vi.fn(),
        printWarning: vi.fn(),
        printInfo: vi.fn(),
        printAbortMessage: vi.fn(),
        promptInput: vi.fn(),
        promptList: vi.fn(),
        promptCheckbox: vi.fn(),
        promptConfirm: vi.fn(),
        promptEditor: vi.fn(),
        displayTable: vi.fn(),
        showMessage: vi.fn(),
        chalk: {
          green: (str: string) => str,
          red: (str: string) => str,
          yellow: (str: string) => str,
          blue: (str: string) => str,
          cyan: (str: string) => str,
        } as const,
      } as unknown as UIManager,
    };

    // Setup mock UIManager for DefinitionLoader
    mockUiManagerInstance = {
      startSpinner: vi.fn(),
      stopSpinner: vi.fn(),
      succeedSpinner: vi.fn(),
      failSpinner: vi.fn(),
      updateSpinnerText: vi.fn(),
      infoSpinner: vi.fn(),
      warnSpinner: vi.fn(),
      printSuccess: vi.fn(),
      printError: vi.fn(),
      printWarning: vi.fn(),
      printInfo: vi.fn(),
      printAbortMessage: vi.fn(),
      promptInput: vi.fn(),
      promptList: vi.fn(),
      promptCheckbox: vi.fn(),
      promptConfirm: vi.fn(),
      promptEditor: vi.fn(),
      displayTable: vi.fn(),
      showMessage: vi.fn(),
      chalk: {
        green: (str: string) => str,
        red: (str: string) => str,
        yellow: (str: string) => str,
        blue: (str: string) => str,
        cyan: (str: string) => str,
      } as any, // Use 'any' for chalk to simplify mock structure if full type is complex
      isInteractive: true,
      setInteractive: vi.fn(),
      getChalk: vi.fn().mockReturnValue({
        green: (str: string) => str,
        red: (str: string) => str,
        yellow: (str: string) => str,
        blue: (str: string) => str,
        cyan: (str: string) => str,
      }),
    } as unknown as UIManager;


    loader = new DefinitionLoader(mockFileManagerInstance as unknown as FileManager, mockUiManagerInstance, MOCK_SYSTEM_DEFINITIONS_PATH);

    // Configure fs-extra mocks (these are globally mocked but we control behavior here)
    fsExtraPathExistsMock.mockImplementation(async(p: fsExtra.PathLike) => { // Use fsExtra type
      const pStr = String(p);
      if (pStr === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'modes.json')) {return true;}
      if (pStr === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'categories.json')) {return true;}
      if (pStr === path.join(MOCK_USER_CONFIG_PATH, 'user-definitions.json')) {return true;} // Default to true for user defs
      if (pStr.startsWith(MOCK_SYSTEM_RULES_PATH) || pStr.startsWith(MOCK_USER_RULES_PATH)) {return true;}
      return false;
    });

    fsExtraReadJsonMock.mockImplementation(async(p: any) => { // Use fsExtra type
      const pStr = String(p);
      if (pStr === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'modes.json')) {return JSON.parse(JSON.stringify(testSystemModes));}
      if (pStr === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'categories.json')) {return JSON.parse(JSON.stringify(testSystemCategories));}
      if (pStr === path.join(MOCK_USER_CONFIG_PATH, 'user-definitions.json')) {return JSON.parse(JSON.stringify(testUserDefinitions));}
      throw new Error(`fsExtra.readJson mock: Unhandled path ${pStr}`);
    });
  });


  describe('loadDefinitions', () => {
    it('AC1: should load valid system mode and category definitions successfully', async() => {
      // Override fsExtraPathExists for this specific test to simulate no user definitions
      fsExtraPathExistsMock.mockImplementation(async(p: fsExtra.PathLike) => { // Use fsExtra type
        const pStr = String(p);
        if (pStr === path.join(MOCK_USER_CONFIG_PATH, 'user-definitions.json')) {return false;}
        if (pStr === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'modes.json')) {return true;}
        if (pStr === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'categories.json')) {return true;}
        return true; // Default for other paths like rule files
      });

      const { modes, categories } = await loader.loadDefinitions();

      // Verify that system modes have sourceType 'system'
      expect(modes).toEqual(
        expect.arrayContaining(
          testSystemModes.map(m => expect.objectContaining({ ...m, sourceType: 'system' as DefinitionSource }))
        )
      );
      expect(categories).toEqual(
        expect.arrayContaining(
          testSystemCategories.map(c => expect.objectContaining({ ...c, sourceType: 'system' as DefinitionSource }))
        )
      );
      expect(fsExtraReadJsonMock).toHaveBeenCalledWith(path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'modes.json'));
      expect(fsExtraReadJsonMock).toHaveBeenCalledWith(path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'categories.json'));
      expect(readUserDefinitionsMock).toHaveBeenCalled(); // Ensure FileManager's method was called
    });

    it('AC2: should load and merge valid user definitions with system definitions', async() => {
      // Ensure readUserDefinitionsMock returns the test user definitions
      readUserDefinitionsMock.mockResolvedValue(JSON.parse(JSON.stringify(testUserDefinitions)));

      const { modes, categories } = await loader.loadDefinitions();

      const overriddenMode = modes.find(m => m.slug === 'sys-mode-1');
      expect(overriddenMode).toBeDefined();
      expect(overriddenMode?.name).toBe('User Overridden System Mode 1');
      // expect(overriddenMode?.source).toBe('user'); // 'source' is for initial load, 'sourceType' for merged result
      expect(overriddenMode?.sourceType).toBe('custom (overrides system)');

      const userOnlyMode = modes.find(m => m.slug === 'user-mode-1');
      expect(userOnlyMode).toBeDefined();
      // expect(userOnlyMode?.source).toBe('user');
      expect(userOnlyMode?.sourceType).toBe('custom');

      const systemOnlyMode = modes.find(m => m.slug === 'sys-mode-2');
      expect(systemOnlyMode).toBeDefined();
      // expect(systemOnlyMode?.source).toBe('system');
      expect(systemOnlyMode?.sourceType).toBe('system');

      const overriddenCategory = categories.find(c => c.slug === 'sys-cat-1');
      expect(overriddenCategory).toBeDefined();
      expect(overriddenCategory?.name).toBe('User Overridden System Category 1');
      // expect(overriddenCategory?.source).toBe('user');
      expect(overriddenCategory?.sourceType).toBe('custom (overrides system)');

      expect(readUserDefinitionsMock).toHaveBeenCalled();
    });

    it('User Definitions > AC3: should handle missing user-definitions.json gracefully (file does not exist)', async() => {
      readUserDefinitionsMock.mockResolvedValue(null); // Simulate file not found or empty
      // const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {}); // Replaced by uiManager spy

      const { modes, categories } = await loader.loadDefinitions();

      expect(modes.length).toBe(testSystemModes.length);
      expect(categories.length).toBe(testSystemCategories.length);
      // Check if FileManager's readUserDefinitions was called
      expect(readUserDefinitionsMock).toHaveBeenCalled();
      // No warning is expected from DefinitionLoader directly if FileManager returns null (no file)
      // FileManager itself would log via its own uiManager if it failed to read/parse.
      // DefinitionLoader's loadUserDefinitions logs a warning if its *own* schema validation fails *after* a successful read,
      // or if fileManager.readUserDefinitions() itself throws an *unexpected* error.

      // consoleWarnSpy.mockRestore(); // No longer needed
    });

    it('AC3: should handle invalid user-definitions.json gracefully (invalid JSON structure from fileManager.readUserDefinitions)', async() => {
      // Simulate FileManager.readUserDefinitions returns a structure that fails DefinitionLoader's *own* UserDefinitionsSchema.safeParse.
      const invalidUserDefsData = { customModes: [{ slug: 'bad-mode' }] }; // Missing required fields like 'name'
      readUserDefinitionsMock.mockResolvedValue(invalidUserDefsData as any); // Cast as any to bypass strict UserDefinitions type for test

      const uiManagerPrintWarningSpy = vi.spyOn(mockUiManagerInstance, 'printWarning');

      const { modes, categories } = await loader.loadDefinitions();

      expect(modes.length).toBe(testSystemModes.length); // Should fall back to system definitions
      expect(categories.length).toBe(testSystemCategories.length);
      expect(readUserDefinitionsMock).toHaveBeenCalled();
      expect(uiManagerPrintWarningSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Invalid structure in user-definitions.json at ${path.join(MOCK_USER_CONFIG_PATH, 'user-definitions.json')} after initial read:`)
      );
      expect(uiManagerPrintWarningSpy).toHaveBeenCalledWith(expect.stringContaining('customModes.0.name - Required'));

      uiManagerPrintWarningSpy.mockRestore();
    });

    it('AC3: should handle unexpected error from fileManager.readUserDefinitions gracefully', async() => {
      // Simulate FileManager.readUserDefinitions encountering an internal parse error and returning null
      // For this test, we want to check the warning logged by DefinitionLoader's loadUserDefinitions
      // when it receives a null (or unparseable) from fileManager.readUserDefinitions AFTER an attempt.
      // The actual fileManager.readUserDefinitions would log its own details via uiManager.failSpinner and handleError.
      // Here, we are testing DefinitionLoader's handling if fileManager.readUserDefinitions itself throws an unexpected error
      // OR if it returns a structure that fails DefinitionLoader's *own* UserDefinitionsSchema.safeParse.

      // To test the scenario where DefinitionLoader's *own* catch block for loadUserDefinitions is hit:
      const unexpectedFileManagerError = new Error('Simulated unexpected error from FileManager.readUserDefinitions');
      readUserDefinitionsMock.mockRejectedValue(unexpectedFileManagerError);

      const uiManagerPrintWarningSpy = vi.spyOn(mockUiManagerInstance, 'printWarning');

      const { modes, categories } = await loader.loadDefinitions();

      expect(modes.length).toBe(testSystemModes.length); // Should fall back to system definitions
      expect(categories.length).toBe(testSystemCategories.length);
      expect(readUserDefinitionsMock).toHaveBeenCalled();

      // Expect the warning from DefinitionLoader's catch block for loadUserDefinitions via uiManager
      expect(uiManagerPrintWarningSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Unexpected error calling this.fileManager.readUserDefinitions(): ${unexpectedFileManagerError.message}`)
      );

      uiManagerPrintWarningSpy.mockRestore();
    });

    it('AC2: should throw DefinitionLoadError if system modes.json is missing', async() => {
      fsExtraPathExistsMock.mockImplementation(async(p: fsExtra.PathLike) => String(p) !== path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'modes.json')); // Use fsExtra type

      await expect(loader.loadDefinitions()).rejects.toThrowError(
        `System modes definition file not found at ${path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'modes.json')}`
      );
    });

    it('AC2: should throw DefinitionLoadError if system modes.json is invalid', async() => {
      fsExtraPathExistsMock.mockImplementation(async() => true); // All files exist
      fsExtraReadJsonMock.mockImplementation(async(p: any) => {
        if (p === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'modes.json')) {return [{ slug: 'invalid-mode' }];} // Invalid: missing name, etc.
        if (p === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'categories.json')) {return testSystemCategories;}
        if (p === path.join(MOCK_USER_CONFIG_PATH, 'user-definitions.json')) {return testUserDefinitions;}
        throw new Error(`fsExtra.readJson mock: Unhandled path ${p}`);
      });

      await expect(loader.loadDefinitions()).rejects.toThrowError(/^Failed to load definitions: Invalid system modes\.json: .*name - Required/);
    });

    it('AC3: should throw DefinitionLoadError if a mode references a non-existent category slug', async() => {
      const modesWithInvalidCat = [
        createTestMode({ slug: 'mode-bad-cat', categorySlugs: ['non-existent-cat'] })
      ];
      fsExtraReadJsonMock.mockImplementation(async(p: any) => {
        if (p === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'modes.json')) {return modesWithInvalidCat;}
        if (p === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'categories.json')) {return testSystemCategories;}
        if (p === path.join(MOCK_USER_CONFIG_PATH, 'user-definitions.json')) {return { customModes: [], customCategories: [] };}
        throw new Error(`fsExtra.readJson mock: Unhandled path ${p}`);
      });
      fsExtraPathExistsMock.mockImplementation(async() => true);
      readUserDefinitionsMock.mockResolvedValue({ customModes: [], customCategories: [] });


      await expect(loader.loadDefinitions()).rejects.toThrowError(
        'Mode "mode-bad-cat" references non-existent category slug "non-existent-cat".'
      );
    });

    it('AC4: should throw DefinitionLoadError if a system rule file (sourcePath) does not exist', async() => {
      const modeWithBadRule = createTestMode({
        slug: 'mode-bad-rule',
        categorySlugs: ['sys-cat-1'], // Explicitly use a valid system category
        associatedRuleFiles: [createTestRule({ id: 'rule-x', sourcePath: 'generic/non-existent-rule.md' })]
      });
      fsExtraReadJsonMock.mockImplementation(async(p: any) => {
        if (p === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'modes.json')) {return [modeWithBadRule];}
        // Ensure testSystemCategories (sys-cat-1, sys-cat-2) are returned
        if (p === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'categories.json')) {return testSystemCategories;}
        throw new Error(`fsExtra.readJson mock: Unhandled path ${p} in AC4`);
      });

      readUserDefinitionsMock.mockResolvedValue({ customModes: [], customCategories: [] }); // No user definitions

      fsExtraPathExistsMock.mockImplementation(async(p: fsExtra.PathLike) => { // Use fsExtra type
        const pStr = String(p);
        // System files exist, except for the one rule file we want to test as missing
        if (pStr === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'modes.json')) {return true;}
        if (pStr === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'categories.json')) {return true;}
        if (pStr === path.join(MOCK_SYSTEM_RULES_PATH, 'generic/non-existent-rule.md')) {return false;} // This rule file is missing
        // All other system rule files associated with modeWithBadRule (if any) should exist.
        // For this test, modeWithBadRule only has one rule.
        return true;
      });

      await expect(loader.loadDefinitions()).rejects.toThrowError(
        // The error message from DefinitionLoader includes the source of the mode.
        `Rule file not found for system mode "mode-bad-rule", rule "rule-x": ${path.join(MOCK_SYSTEM_RULES_PATH, 'generic/non-existent-rule.md')} (sourcePath: "generic/non-existent-rule.md")`
      );
    });

    it('AC6: should throw DefinitionLoadError if a user mode rule file does not exist', async() => {
      const userModeWithBadRule = createTestMode({
        slug: 'user-mode-bad-rule',
        source: 'user',
        categorySlugs: ['user-cat-1'], // Explicitly use a valid user category
        associatedRuleFiles: [createTestRule({ id: 'user-rule-y', sourcePath: 'user-mode-bad-rule/non-existent-user-rule.md', isGeneric: false })]
      });

      // System definitions are standard
      fsExtraReadJsonMock.mockImplementation(async(p: any) => {
        if (p === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'modes.json')) {return testSystemModes;}
        if (p === path.join(MOCK_SYSTEM_DEFINITIONS_PATH, 'categories.json')) {return testSystemCategories;}
        throw new Error(`fsExtra.readJson mock: Unhandled path ${p} in AC6`);
      });

      // User definitions provide the mode with the bad rule path and its category
      readUserDefinitionsMock.mockResolvedValue({
        customModes: [userModeWithBadRule],
        customCategories: [createTestCategory({ slug: 'user-cat-1', name: 'User Category 1', source: 'user' })]
      });

      fsExtraPathExistsMock.mockImplementation(async(p: fsExtra.PathLike) => { // Use fsExtra type
        const pStr = String(p);
        // All system files exist
        if (pStr.startsWith(MOCK_SYSTEM_DEFINITIONS_PATH)) {return true;}
        // User rule file is missing
        if (pStr === path.join(MOCK_USER_RULES_PATH, 'user-mode-bad-rule/non-existent-user-rule.md')) {return false;}
        // Other user rule files (if any) for this mode would exist.
        return true;
      });

      await expect(loader.loadDefinitions()).rejects.toThrowError(
        `Rule file not found for user mode "user-mode-bad-rule", rule "user-rule-y": ${path.join(MOCK_USER_RULES_PATH, 'user-mode-bad-rule/non-existent-user-rule.md')} (sourcePath: "user-mode-bad-rule/non-existent-user-rule.md")`
      );
    });
  });

  describe('getSystemModes', () => {
    it('should return only system modes', async() => {
      fsExtraReadJsonMock.mockResolvedValueOnce(JSON.parse(JSON.stringify(testSystemModes)));
      const modes = await loader.getSystemModes();
      expect(modes.length).toBe(testSystemModes.length);
      modes.forEach(mode => {
        expect(mode.sourceType).toBe('system'); // Check sourceType
        const originalMode = testSystemModes.find(m => m.slug === mode.slug);
        expect(mode.name).toBe(originalMode?.name);
      });
    });
  });

  describe('getCustomModes', () => {
    it('should return only custom modes', async() => {
      readUserDefinitionsMock.mockResolvedValueOnce(JSON.parse(JSON.stringify({ customModes: testUserModes, customCategories: [] })));
      const modes = await loader.getCustomModes();
      expect(modes.length).toBe(testUserModes.length);
      modes.forEach(mode => {
        expect(mode.sourceType).toBe('custom'); // Check sourceType
        const originalMode = testUserModes.find(m => m.slug === mode.slug);
        expect(mode.name).toBe(originalMode?.name);
      });
    });

    it('should return an empty array if no custom modes exist', async() => {
      readUserDefinitionsMock.mockResolvedValueOnce(JSON.parse(JSON.stringify({ customModes: [], customCategories: [] })));
      const modes = await loader.getCustomModes();
      expect(modes).toEqual([]);
    });
  });

  describe('getMergedModes', () => {
    it('Scenario 1: Only system definitions exist', async() => {
      fsExtraReadJsonMock.mockImplementation(async(p: any) => {
        if (String(p).endsWith('modes.json')) {return JSON.parse(JSON.stringify(testSystemModes));}
        return []; // No categories for simplicity in this specific test
      });
      readUserDefinitionsMock.mockResolvedValueOnce(null); // No user definitions
      const modes = await loader.getMergedModes();
      expect(modes.length).toBe(testSystemModes.length);
      modes.forEach(mode => expect(mode.sourceType).toBe('system'));
    });

    it('Scenario 2: Only custom definitions exist', async() => {
      fsExtraReadJsonMock.mockImplementation(async(p: any) => {
        // No system modes
        if (String(p).endsWith('modes.json')) {return [];}
        return []; // No categories
      });
      readUserDefinitionsMock.mockResolvedValueOnce(JSON.parse(JSON.stringify({ customModes: testUserModes, customCategories: [] })));
      const modes = await loader.getMergedModes();
      expect(modes.length).toBe(testUserModes.length);
      modes.forEach(mode => expect(mode.sourceType).toBe('custom'));
    });

    it('Scenario 3: Mix of system and custom, no overlaps', async() => {
      const uniqueUserModes = [createTestMode({ slug: 'unique-user-mode', name: 'Unique User Mode', source: 'user' })];
      fsExtraReadJsonMock.mockImplementation(async(p: any) => {
        if (String(p).endsWith('modes.json')) {return JSON.parse(JSON.stringify(testSystemModes));}
        return [];
      });
      readUserDefinitionsMock.mockResolvedValueOnce(JSON.parse(JSON.stringify({ customModes: uniqueUserModes, customCategories: [] })));

      const modes = await loader.getMergedModes();
      expect(modes.length).toBe(testSystemModes.length + uniqueUserModes.length);
      modes.forEach(mode => {
        if (testSystemModes.some(m => m.slug === mode.slug)) {
          expect(mode.sourceType).toBe('system');
        } else {
          expect(mode.sourceType).toBe('custom');
        }
      });
    });

    it('Scenario 4: Mix of system and custom, with overlaps', async() => {
      // testUserModes already contains an override for 'sys-mode-1'
      fsExtraReadJsonMock.mockImplementation(async(p: any) => {
        if (String(p).endsWith('modes.json')) {return JSON.parse(JSON.stringify(testSystemModes));}
        return [];
      });
      readUserDefinitionsMock.mockResolvedValueOnce(JSON.parse(JSON.stringify({ customModes: testUserModes, customCategories: [] })));

      const modes = await loader.getMergedModes();
      const overriddenMode = modes.find(m => m.slug === 'sys-mode-1');
      expect(overriddenMode?.sourceType).toBe('custom (overrides system)');
      expect(overriddenMode?.name).toBe('User Overridden System Mode 1');

      const customOnlyMode = modes.find(m => m.slug === 'user-mode-1');
      expect(customOnlyMode?.sourceType).toBe('custom');

      const systemOnlyMode = modes.find(m => m.slug === 'sys-mode-2');
      expect(systemOnlyMode?.sourceType).toBe('system');
    });

    it('Scenario 5: Empty system and custom definitions', async() => {
      fsExtraReadJsonMock.mockImplementation(async(p: any) => {
        if (String(p).endsWith('modes.json')) {return [];}
        return [];
      });
      readUserDefinitionsMock.mockResolvedValueOnce(JSON.parse(JSON.stringify({ customModes: [], customCategories: [] })));
      const modes = await loader.getMergedModes();
      expect(modes).toEqual([]);
    });
  });

  // Similar describe blocks for getSystemCategories, getCustomCategories, getMergedCategories
  describe('getSystemCategories', () => {
    it('should return only system categories', async() => {
      fsExtraReadJsonMock.mockResolvedValueOnce(JSON.parse(JSON.stringify(testSystemCategories)));
      const categories = await loader.getSystemCategories();
      expect(categories.length).toBe(testSystemCategories.length);
      categories.forEach(cat => expect(cat.sourceType).toBe('system')); // Check sourceType
    });
  });

  describe('getCustomCategories', () => {
    it('should return only custom categories', async() => {
      readUserDefinitionsMock.mockResolvedValueOnce(JSON.parse(JSON.stringify({ customModes: [], customCategories: testUserCategories })));
      const categories = await loader.getCustomCategories();
      expect(categories.length).toBe(testUserCategories.length);
      categories.forEach(cat => expect(cat.sourceType).toBe('custom')); // Check sourceType
    });
    it('should return an empty array if no custom categories exist', async() => {
      readUserDefinitionsMock.mockResolvedValueOnce(JSON.parse(JSON.stringify({ customModes: [], customCategories: [] })));
      const categories = await loader.getCustomCategories();
      expect(categories).toEqual([]);
    });
  });

  describe('getMergedCategories', () => {
    it('Scenario 1: Only system categories exist', async() => {
      fsExtraReadJsonMock.mockImplementation(async(p: any) => {
        if (String(p).endsWith('categories.json')) {return JSON.parse(JSON.stringify(testSystemCategories));}
        return [];
      });
      readUserDefinitionsMock.mockResolvedValueOnce(null);
      const categories = await loader.getMergedCategories();
      expect(categories.length).toBe(testSystemCategories.length);
      categories.forEach(cat => expect(cat.sourceType).toBe('system'));
    });

    it('Scenario 2: Only custom categories exist', async() => {
      fsExtraReadJsonMock.mockImplementation(async(p: any) => {
        if (String(p).endsWith('categories.json')) {return [];}
        return [];
      });
      readUserDefinitionsMock.mockResolvedValueOnce(JSON.parse(JSON.stringify({ customModes: [], customCategories: testUserCategories })));
      const categories = await loader.getMergedCategories();
      expect(categories.length).toBe(testUserCategories.length);
      categories.forEach(cat => expect(cat.sourceType).toBe('custom'));
    });

    it('Scenario 4: Mix of system and custom categories, with overlaps', async() => {
      // testUserCategories contains an override for 'sys-cat-1'
      fsExtraReadJsonMock.mockImplementation(async(p: any) => {
        if (String(p).endsWith('categories.json')) {return JSON.parse(JSON.stringify(testSystemCategories));}
        return [];
      });
      readUserDefinitionsMock.mockResolvedValueOnce(JSON.parse(JSON.stringify({ customModes: [], customCategories: testUserCategories })));
      const categories = await loader.getMergedCategories();

      const overriddenCat = categories.find(c => c.slug === 'sys-cat-1');
      expect(overriddenCat?.sourceType).toBe('custom (overrides system)');
      expect(overriddenCat?.name).toBe('User Overridden System Category 1');

      const customOnlyCat = categories.find(c => c.slug === 'user-cat-1');
      expect(customOnlyCat?.sourceType).toBe('custom');

      const systemOnlyCat = categories.find(c => c.slug === 'sys-cat-2');
      expect(systemOnlyCat?.sourceType).toBe('system');
    });
  });
});