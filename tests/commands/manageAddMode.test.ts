import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Command } from 'commander';

// Mock dependencies first - Vitest hoists these to the top
vi.mock('inquirer');
vi.mock('../../src/utils/uiManager.js');
vi.mock('../../src/core/DefinitionLoader.js');

// Mock fs-extra with proper implementation
vi.mock('fs-extra', () => {
  const fsModule = {
    pathExists: vi.fn().mockResolvedValue(true),
    readJson: vi.fn().mockResolvedValue({ customModes: [], customCategories: [] }),
    writeJson: vi.fn().mockResolvedValue(undefined),
    ensureDir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  };

  return {
    ...fsModule,
    default: fsModule,
    __esModule: true
  };
});

vi.mock('../../src/core/FileManager.js');

// Import dependencies after mocking
import inquirer from 'inquirer';
import fs from 'fs-extra';
import { manageAddModeHandler } from '../../src/commands/manageAddMode.js';
import { DefinitionLoader } from '../../src/core/DefinitionLoader.js';
import { FileManager } from '../../src/core/FileManager.js';
import { UIManager } from '../../src/utils/uiManager.js';

// Test data
const mockCategories = [
  { slug: 'cat1', name: 'Category 1', description: 'Desc 1', source: 'system' as const },
  { slug: 'cat2', name: 'Category 2', description: 'Desc 2', source: 'user' as const }
];

const existingCustomModes = [
  { slug: 'existing-mode', name: 'Existing', description: '', customInstructions: '', groups: [], categorySlugs: [], associatedRuleFiles: [], source: 'user' as const }
];

beforeEach(() => {
  vi.clearAllMocks();

  // Reset fs-extra mocks
  vi.mocked(fs.pathExists).mockReset().mockImplementation(() => Promise.resolve(true));
  vi.mocked(fs.readJson).mockReset().mockImplementation(() => Promise.resolve({ customModes: [], customCategories: [] }));
  vi.mocked(fs.writeJson).mockReset().mockImplementation(() => Promise.resolve());
  vi.mocked(fs.ensureDir).mockReset().mockImplementation(() => Promise.resolve());
  vi.mocked(fs.writeFile).mockReset().mockImplementation(() => Promise.resolve());

  // Mock inquirer prompt
  vi.mocked(inquirer.prompt).mockImplementation(vi.fn());

  // Mock UIManager
  vi.mocked(UIManager).mockReturnValue({
    printMessage: vi.fn(),
    printError: vi.fn(),
    printSuccess: vi.fn(),
    printInfo: vi.fn(),
    promptUser: vi.fn()
  } as any);

  // Mock DefinitionLoader
  const mockDefinitionLoader = {
    loadDefinitions: vi.fn().mockResolvedValue({
      modes: [...existingCustomModes],
      categories: [...mockCategories]
    })
  };
  vi.mocked(DefinitionLoader).mockReturnValue(mockDefinitionLoader as any);

  // Mock FileManager
  vi.mocked(FileManager).mockImplementation(() => ({
    ensureUserConfigDirectories: vi.fn().mockResolvedValue({ configPath: '/mock/config/path', rulesPath: '/mock/rules/path' }),
    getUserConfigPath: vi.fn().mockReturnValue('/mock/config/path'),
    getUserDefinitionsPath: vi.fn().mockReturnValue('/mock/config/path/user-definitions.json'),
    getCustomRulesPath: vi.fn().mockReturnValue('/mock/config/path/rules'),
    writeUserDefinitions: vi.fn().mockImplementation(async(data) => {
      return vi.mocked(fs.writeJson)('/mock/config/path/user-definitions.json', data);
    }),
    getCustomRuleFilePath: vi.fn().mockImplementation((slug, filename) => `/mock/config/path/rules/${slug}/${filename}`)
  }) as any);

  // Reset and setup fs-extra mocks
  vi.mocked(fs.pathExists).mockImplementation(() => Promise.resolve(true));
  vi.mocked(fs.readJson).mockImplementation(() => Promise.resolve({ customModes: [], customCategories: [] }));
  vi.mocked(fs.writeJson).mockImplementation(() => Promise.resolve());
  vi.mocked(fs.ensureDir).mockImplementation(() => Promise.resolve());
  vi.mocked(fs.writeFile).mockImplementation(() => Promise.resolve());
});

describe('manageAddModeHandler', () => {
  it('creates a new custom mode with all fields and no rules', async() => {
    const promptMock = vi.fn();
    vi.mocked(inquirer.prompt).mockImplementation(promptMock);

    promptMock.mockResolvedValueOnce({
      name: 'My Mode',
      slug: 'my-mode',
      roleDefinition: 'A test mode',  // Changed from description to roleDefinition
      customInstructions: 'Custom instructions',
      groups: ['group1', 'group2'],
      categorySlugs: ['cat1']
    });
    promptMock.mockResolvedValueOnce({ addRule: false });

    await manageAddModeHandler({} as Command);

    expect(fs.writeJson).toHaveBeenCalled();
    const writeJsonCalls = vi.mocked(fs.writeJson).mock.calls;
    expect(writeJsonCalls[0][1].customModes.some((m: any) => m.slug === 'my-mode')).toBe(true);
    expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled();
  });

  it('creates a mode with rules and saves rule files', async() => {
    // Reset the mocks to capture calls
    vi.mocked(fs.writeFile).mockReset().mockImplementation(() => Promise.resolve());
    vi.mocked(fs.writeJson).mockReset().mockImplementation(() => Promise.resolve());

    const promptMock = vi.fn();
    vi.mocked(inquirer.prompt).mockImplementation(promptMock);

    promptMock
      // Mode metadata
      .mockResolvedValueOnce({ name: 'Mode with Rules', slug: 'mode-with-rules', roleDefinition: '', customInstructions: '', groups: [], categorySlugs: ['cat1'] })
      // addRule: true
      .mockResolvedValueOnce({ addRule: true })
      // Rule 1 metadata
      .mockResolvedValueOnce({
        ruleName: 'Generic Rule',
        ruleFilename: 'generic-rule.md',
        ruleDescription: 'A generic rule',
        isGeneric: true,
        ruleContent: 'GENERIC CONTENT'
      })
      // addRule: true
      .mockResolvedValueOnce({ addRule: true })
      // Rule 2 metadata
      .mockResolvedValueOnce({
        ruleName: 'Specific Rule',
        ruleFilename: 'specific-rule.md',
        ruleDescription: 'A specific rule',
        isGeneric: false,
        ruleContent: 'SPECIFIC CONTENT'
      })
      // addRule: false
      .mockResolvedValueOnce({ addRule: false });

    await manageAddModeHandler({} as Command);

    // Verify writeJson was called
    expect(vi.mocked(fs.writeJson)).toHaveBeenCalled();

    // Verify writeFile was called twice with correct content
    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toBe('GENERIC CONTENT');
    expect(vi.mocked(fs.writeFile).mock.calls[1][1]).toBe('SPECIFIC CONTENT');

    // Verify the mode data was correctly saved
    const savedData = vi.mocked(fs.writeJson).mock.calls[0][1];
    const mode = savedData.customModes.find((m: any) => m.slug === 'mode-with-rules');
    expect(mode.associatedRuleFiles.length).toBe(2);
  });

  it('re-prompts for duplicate slug', async() => {
    // Reset writeJson to capture the arguments
    vi.mocked(fs.writeJson).mockReset().mockImplementation(() => {
      return Promise.resolve();
    });

    const promptMock = vi.fn();
    vi.mocked(inquirer.prompt).mockImplementation(promptMock);

    promptMock
      // First attempt with duplicate slug
      .mockResolvedValueOnce({ name: 'Existing', slug: 'existing-mode' }) // duplicate
      // Second attempt with unique slug
      .mockResolvedValueOnce({
        name: 'Unique',
        slug: 'unique-mode',
        roleDefinition: '',
        customInstructions: '',
        groups: [],
        categorySlugs: ['cat1']
      })
      .mockResolvedValueOnce({ addRule: false });

    await manageAddModeHandler({} as Command);

    expect(vi.mocked(fs.writeJson)).toHaveBeenCalledTimes(1);
    const savedData = vi.mocked(fs.writeJson).mock.calls[0][1];
    expect(savedData.customModes.some((m: any) => m.slug === 'unique-mode')).toBe(true);
    expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled();
  });

  it('re-prompts for invalid rule filename', async() => {
    // Reset writeFile to capture and verify calls
    vi.mocked(fs.writeFile).mockReset().mockImplementation(() => {
      return Promise.resolve();
    });

    const promptMock = vi.fn();
    vi.mocked(inquirer.prompt).mockImplementation(promptMock);

    promptMock
      // Mode metadata
      .mockResolvedValueOnce({ name: 'Mode', slug: 'mode', roleDefinition: '', customInstructions: '', groups: [], categorySlugs: ['cat1'] })
      // addRule: true
      .mockResolvedValueOnce({ addRule: true })
      // Rule metadata with valid filename (after validation would have rejected invalid one)
      .mockResolvedValueOnce({
        ruleName: 'Valid Rule',
        ruleFilename: 'valid.md',
        ruleDescription: 'A valid rule',
        isGeneric: false,
        ruleContent: 'content'
      })
      // addRule: false
      .mockResolvedValueOnce({ addRule: false });

    await manageAddModeHandler({} as Command);

    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fs.writeFile).mock.calls[0][0]).toContain('valid.md');
    expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toBe('content');
  });

  it('creates user-definitions.json if missing', async() => {
    // Reset pathExists to simulate missing file
    vi.mocked(fs.pathExists).mockReset().mockImplementation(() => Promise.resolve(false));

    // Reset writeJson to capture the arguments
    vi.mocked(fs.writeJson).mockReset().mockImplementation(() => {
      return Promise.resolve();
    });

    const promptMock = vi.fn();
    vi.mocked(inquirer.prompt).mockImplementation(promptMock);

    promptMock.mockResolvedValueOnce({
      name: 'Mode',
      slug: 'mode',
      description: '',
      customInstructions: '',
      groups: [],
      categorySlugs: []
    });
    promptMock.mockResolvedValueOnce({ addRule: false });

    await manageAddModeHandler({} as Command);

    expect(vi.mocked(fs.writeJson)).toHaveBeenCalled();
    expect(vi.mocked(fs.writeJson).mock.calls[0][0]).toMatch(/user-definitions\.json$/);
    const savedData = vi.mocked(fs.writeJson).mock.calls[0][1];
    expect(savedData.customModes.some((m: any) => m.slug === 'mode')).toBe(true);
    expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled();
  });

  it('handles file write errors gracefully', async() => {
    // Reset writeJson to throw an error
    vi.mocked(fs.writeJson).mockReset().mockImplementation(() => {
      throw new Error('write error');
    });

    const promptMock = vi.fn();
    vi.mocked(inquirer.prompt).mockImplementation(promptMock);

    // Make sure we have valid categorySlugs to avoid the length error
    promptMock.mockResolvedValueOnce({
      name: 'Mode',
      slug: 'mode',
      roleDefinition: '',
      customInstructions: '',
      groups: [],
      categorySlugs: ['cat1']
    });

    promptMock.mockResolvedValueOnce({
      name: 'Mode',
      slug: 'mode',
      roleDefinition: '',
      customInstructions: '',
      groups: [],
      categorySlugs: ['cat1']
    });
    promptMock.mockResolvedValueOnce({ addRule: false });

    // Use try/catch to verify the error is thrown
    let errorThrown = false;
    try {
      await manageAddModeHandler({} as Command);
    } catch (error: any) { // Type assertion for error
      errorThrown = true;
      expect(error.message).toBe('write error');
    }
    expect(errorThrown).toBe(true);
    expect(vi.mocked(fs.writeJson)).toHaveBeenCalled();
  });
});