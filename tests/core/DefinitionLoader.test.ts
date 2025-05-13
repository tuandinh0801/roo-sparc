import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { DefinitionLoader } from '../../src/core/DefinitionLoader.js';
import { ModeDefinition, CategoryDefinition } from '../../src/types/domain.js';

// Mock fs-extra
vi.mock('fs-extra');

const validMockModes: ModeDefinition[] = [
  {
    slug: 'test-mode-1',
    name: 'Test Mode 1',
    description: 'Description for test mode 1',
    categorySlugs: ['test-cat-1'],
    associatedRuleFiles: [
      { id: 'rule-1', name: 'Rule 1', description: 'Rule 1 desc', sourcePath: 'generic/rule-1.md', isGeneric: true },
      { id: 'rule-2', name: 'Rule 2', description: 'Rule 2 desc', sourcePath: 'test-mode-1/specific-rule.md', isGeneric: false },
    ],
  }
];

const allMockModes: ModeDefinition[] = [ // Includes modes for various test cases
  ...validMockModes,
  {
    slug: 'test-mode-2', // Used for AC3 (invalid category)
    name: 'Test Mode 2',
    description: 'Description for test mode 2',
    categorySlugs: ['test-cat-invalid'],
    associatedRuleFiles: [
      { id: 'rule-3', name: 'Rule 3', description: 'Rule 3 desc', sourcePath: 'generic/non-existent-rule.md', isGeneric: true },
    ]
  },
  {
    slug: 'test-mode-for-rule-path-test', // Used specifically for AC4 to ensure no category errors
    name: 'Test Mode for Rule Path',
    description: 'Mode for testing rule path validation',
    categorySlugs: ['test-cat-1'],
    associatedRuleFiles: [
      { id: 'rule-non-existent', name: 'Non Existent Rule', description: 'This rule file does not exist', sourcePath: 'generic/this-rule-does-not-exist.md', isGeneric: true },
    ]
  }
];


const mockCategories: CategoryDefinition[] = [
  { slug: 'test-cat-1', name: 'Test Category 1', description: 'Description for test cat 1' },
];

describe('DefinitionLoader', () => {
  const testDefinitionsPath = 'test-definitions';
  let loader: DefinitionLoader;

  beforeEach(() => {
    loader = new DefinitionLoader(testDefinitionsPath);
    vi.resetAllMocks(); // Reset mocks before each test

    // Default successful mocks
    vi.spyOn(fs, 'readJson').mockImplementation(async(filePath) => {
      if (String(filePath).endsWith('modes.json')) {
        return Promise.resolve(validMockModes); // Default to valid modes
      }
      if (String(filePath).endsWith('categories.json')) {
        return Promise.resolve(mockCategories);
      }
      throw new Error(`Unexpected path to fs.readJson: ${filePath}`);
    });

    vi.spyOn(fs, 'pathExists').mockImplementation(async() => true); // Assume all paths exist by default
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('AC1: should load valid mode and category definitions successfully', async() => {
    const { modes, categories } = await loader.loadDefinitions();
    expect(modes).toEqual(validMockModes); // Expecting only valid modes for successful load
    expect(categories).toEqual(mockCategories);
    expect(fs.readJson).toHaveBeenCalledWith(path.join(testDefinitionsPath, 'modes.json'));
    expect(fs.readJson).toHaveBeenCalledWith(path.join(testDefinitionsPath, 'categories.json'));
    // Check that pathExists was called for each rule file in validMockModes
    for (const mode of validMockModes) {
      for (const rule of mode.associatedRuleFiles) {
        expect(fs.pathExists).toHaveBeenCalledWith(path.join(testDefinitionsPath, 'rules', rule.sourcePath));
      }
    }
  });

  it('AC2: should throw an error if modes.json is missing', async() => {
    vi.spyOn(fs, 'pathExists').mockImplementation(async(p) => String(p) !== path.join(testDefinitionsPath, 'modes.json'));
    await expect(loader.loadDefinitions()).rejects.toThrowError(`Failed to load definitions: Modes definition file not found at ${path.join(testDefinitionsPath, 'modes.json')}`);
  });

  it('AC2: should throw an error if categories.json is missing', async() => {
    vi.spyOn(fs, 'pathExists').mockImplementation(async(p) => String(p) !== path.join(testDefinitionsPath, 'categories.json'));
    await expect(loader.loadDefinitions()).rejects.toThrowError(`Failed to load definitions: Categories definition file not found at ${path.join(testDefinitionsPath, 'categories.json')}`);
  });

  it('AC2: should throw an error if modes.json is invalid', async() => {
    vi.spyOn(fs, 'readJson').mockImplementation(async(filePath) => {
      if (String(filePath).endsWith('modes.json')) {
        return Promise.resolve([{ slug: 'invalid-mode' }]); // Missing required fields
      }
      return Promise.resolve(mockCategories); // Keep categories valid for this test
    });
    await expect(loader.loadDefinitions()).rejects.toThrowError(/Invalid modes.json/);
  });

  it('AC2: should throw an error if categories.json is invalid', async() => {
    vi.spyOn(fs, 'readJson').mockImplementation(async(filePath) => {
      if (String(filePath).endsWith('modes.json')) {
        return Promise.resolve(validMockModes); // Keep modes valid for this test
      }
      return Promise.resolve([{ slug: 'invalid-cat' }]); // Missing required fields
    });
    await expect(loader.loadDefinitions()).rejects.toThrowError(/Invalid categories.json/);
  });


  it('AC3: should throw an error if a mode references a non-existent category slug', async() => {
    // Use allMockModes which contains test-mode-2 with an invalid category
    const modesWithInvalidCat = allMockModes.filter(m => m.slug === 'test-mode-1' || m.slug === 'test-mode-2');
    vi.spyOn(fs, 'readJson').mockImplementation(async(filePath) => {
      if (String(filePath).endsWith('modes.json')) {return Promise.resolve(modesWithInvalidCat);}
      if (String(filePath).endsWith('categories.json')) {return Promise.resolve(mockCategories);} // mockCategories only has 'test-cat-1'
      return Promise.reject(new Error('Should not happen'));
    });
    await expect(loader.loadDefinitions()).rejects.toThrowError('Failed to load definitions: Mode "test-mode-2" references non-existent category slug "test-cat-invalid".');
  });

  it('AC4: should throw an error if a rule file (sourcePath) does not exist', async() => {
    const modeForRulePathTest = allMockModes.find(m => m.slug === 'test-mode-for-rule-path-test');
    if (!modeForRulePathTest) {throw new Error('Test setup error: modeForRulePathTest not found');}

    vi.spyOn(fs, 'readJson').mockImplementation(async(filePath) => {
      if (String(filePath).endsWith('modes.json')) {return Promise.resolve([modeForRulePathTest]);} // Only use this mode
      if (String(filePath).endsWith('categories.json')) {return Promise.resolve(mockCategories);}
      return Promise.reject(new Error('Should not happen'));
    });

    const nonExistentRule = modeForRulePathTest.associatedRuleFiles.find(r => r.id === 'rule-non-existent');
    if (!nonExistentRule) {throw new Error('Test setup error: nonExistentRule not found');}

    const nonExistentRulePath = path.join(testDefinitionsPath, 'rules', nonExistentRule.sourcePath);
    vi.spyOn(fs, 'pathExists').mockImplementation(async(p) => {
      if (String(p) === nonExistentRulePath) {return false;} // Make this specific rule file not exist
      return true; // Other files (like definition files) exist
    });

    await expect(loader.loadDefinitions()).rejects.toThrowError(
      `Failed to load definitions: Rule file not found for mode "${modeForRulePathTest.slug}", rule "${nonExistentRule.id}": ${nonExistentRulePath}`
    );
  });
});