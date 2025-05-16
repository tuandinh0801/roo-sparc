import { vi } from 'vitest';
import type { ModeDefinition, CategoryDefinition, Rule } from '../../../src/types/domain.js';

// Minimal mock for UIManager if DefinitionLoader uses it (e.g., for logging errors internally)
vi.mock('../../../src/utils/uiManager.js', () => ({
  UIManager: {
    getInstance: () => ({
      printError: vi.fn(),
      // Add other methods if DefinitionLoader directly uses UIManager instance for logging
    }),
  },
  uiManager: { // Singleton instance mock
    printError: vi.fn(),
  }
}));

// --- DefinitionLoader Mock Spies ---
export const mockDefaultModes: ModeDefinition[] = [
  { slug: 'global-mock-mode', name: 'Global Mock Mode', description: 'Provided by global mock', categorySlugs: ['global-mock-cat'], associatedRuleFiles: [], source: 'system', customInstructions: '', groups: [] },
];
export const mockDefaultCategories: CategoryDefinition[] = [
  { slug: 'global-mock-cat', name: 'Global Mock Category', description: 'Provided by global mock', source: 'system' },
];
export const mockDefaultRules: Rule[] = [
  { id: 'global-mock-rule', name: 'Global Mock Rule', description: 'A mock rule', sourcePath: 'generic/global-mock-rule.md', isGeneric: true }
];


export const mockLoadModeDefinitions = vi.fn().mockResolvedValue(mockDefaultModes);
export const mockLoadCategoryDefinitions = vi.fn().mockResolvedValue(mockDefaultCategories);
export const mockLoadRuleDefinitions = vi.fn().mockResolvedValue(mockDefaultRules); // Assuming rules might be loaded too
export const mockGetModeDefinition = vi.fn().mockImplementation(async(slug: string) => mockDefaultModes.find(m => m.slug === slug) || null);
export const mockGetCategoryDefinition = vi.fn().mockImplementation(async(slug: string) => mockDefaultCategories.find(c => c.slug === slug) || null);

// This is the mock for the DefinitionLoader *instance* methods
// It will be returned when `new DefinitionLoader()` is called in the code under test.
export const mockDefinitionLoaderInstance = {
  loadModeDefinitions: mockLoadModeDefinitions,
  loadCategoryDefinitions: mockLoadCategoryDefinitions,
  loadRuleDefinitions: mockLoadRuleDefinitions,
  getModeDefinition: mockGetModeDefinition,
  getCategoryDefinition: mockGetCategoryDefinition,
  // Add other methods of DefinitionLoader class here if they are used
};

// Mock the DefinitionLoader module
vi.mock('../../../src/core/DefinitionLoader.ts', () => ({
  __esModule: true,
  DefinitionLoader: vi.fn().mockImplementation(() => mockDefinitionLoaderInstance),
  // If there's a singleton export from DefinitionLoader.ts, mock it here too
  // definitionLoader: mockDefinitionLoaderInstance, // Example if a singleton instance is exported
}));


/**
 * Resets all DefinitionLoader related mocks to their default behavior.
 */
export function resetDefinitionLoaderMocks() {
  mockLoadModeDefinitions.mockClear().mockResolvedValue(mockDefaultModes);
  mockLoadCategoryDefinitions.mockClear().mockResolvedValue(mockDefaultCategories);
  mockLoadRuleDefinitions.mockClear().mockResolvedValue(mockDefaultRules);
  mockGetModeDefinition.mockClear().mockImplementation(async(slug: string) => mockDefaultModes.find(m => m.slug === slug) || null);
  mockGetCategoryDefinition.mockClear().mockImplementation(async(slug: string) => mockDefaultCategories.find(c => c.slug === slug) || null);
}

/**
 * Configures the mock return values for DefinitionLoader methods.
 * @param {object} config - Configuration object.
 * @param {ModeDefinition[]} [config.modes] - Modes to return for loadModeDefinitions.
 * @param {CategoryDefinition[]} [config.categories] - Categories to return for loadCategoryDefinitions.
 * @param {Rule[]} [config.rules] - Rules to return for loadRuleDefinitions.
 * @param {ModeDefinition | null} [config.modeBySlug] - Mode to return for getModeDefinition.
 * @param {CategoryDefinition | null} [config.categoryBySlug] - Category to return for getCategoryDefinition.
 */
export function configureDefinitionLoader(config: {
  modes?: ModeDefinition[];
  categories?: CategoryDefinition[];
  rules?: Rule[];
  modeBySlug?: ModeDefinition | null;
  categoryBySlug?: CategoryDefinition | null;
}) {
  if (config.modes !== undefined) {
    mockLoadModeDefinitions.mockResolvedValue(config.modes);
  }
  if (config.categories !== undefined) {
    mockLoadCategoryDefinitions.mockResolvedValue(config.categories);
  }
  if (config.rules !== undefined) {
    mockLoadRuleDefinitions.mockResolvedValue(config.rules);
  }
  if (config.modeBySlug !== undefined) {
    mockGetModeDefinition.mockResolvedValue(config.modeBySlug);
  }
  if (config.categoryBySlug !== undefined) {
    mockGetCategoryDefinition.mockResolvedValue(config.categoryBySlug);
  }
}

// Initial reset
resetDefinitionLoaderMocks();
