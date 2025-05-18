/**
 * Test Data Factory
 * Provides factory functions to create consistent test data for modes, categories, rules, etc.
 */
import type {
  ModeDefinition,
  CategoryDefinition,
  Rule,
  ModeDefinitionWithSource,
  CategoryDefinitionWithSource,
  DefinitionSource,
} from '../../src/types/domain.js';

let idCounter = 0;

/**
 * Resets the internal ID counter. Useful for ensuring deterministic IDs in tests.
 */
export function resetTestDataFactoryIds() {
  idCounter = 0;
}

/**
 * Create a test rule with customizable properties
 */
export function createTestRule(overrides: Partial<Rule> = {}): Rule {
  idCounter++;
  return {
    id: `rule-${idCounter}`,
    name: `Test Rule ${idCounter}`,
    description: `Description for rule ${idCounter}`,
    sourcePath: `generic/rule-${idCounter}.md`,
    isGeneric: true,
    ...overrides,
  };
}

/**
 * Create multiple test rules
 */
export function createTestRules(count: number, baseOverrides: Partial<Rule> = {}): Rule[] {
  return Array.from({ length: count }, () => {
    // idCounter will be incremented by createTestRule
    return createTestRule({
      ...baseOverrides, // Apply base overrides first
      // then specific overrides if any, but id and name are handled by createTestRule
    });
  });
}

/**
 * Create a test mode with customizable properties
 */
export function createTestMode(overrides: Partial<ModeDefinitionWithSource> = {}): ModeDefinitionWithSource {
  idCounter++;
  const slug = overrides.slug ?? `test-mode-${idCounter}`;
  const baseSourceType: DefinitionSource = overrides.sourceType ?? 'system';
  return {
    slug: slug,
    name: overrides.name ?? `Test Mode ${idCounter}`,
    description: overrides.description ?? `Description for test mode ${idCounter}`,
    categorySlugs: overrides.categorySlugs ?? [`test-cat-${idCounter}`],
    associatedRuleFiles: overrides.associatedRuleFiles ?? [createTestRule({ id: `${slug}-rule-1`, name: `Rule for ${slug}` })],
    source: overrides.source ?? (baseSourceType === 'system' ? 'system' : 'user'),
    sourceType: baseSourceType,
    customInstructions: overrides.customInstructions ?? `Custom instructions for mode ${idCounter}`,
    groups: overrides.groups ?? ['common'],
    ...overrides, // Ensure overrides can include sourceType
  };
}

/**
 * Create multiple test modes
 */
export function createTestModes(count: number, baseOverrides: Partial<ModeDefinitionWithSource> = {}): ModeDefinitionWithSource[] {
  return Array.from({ length: count }, () => {
    // idCounter will be incremented by createTestMode
    return createTestMode({
      ...baseOverrides,
    });
  });
}

/**
 * Create a test category with customizable properties
 */
export function createTestCategory(overrides: Partial<CategoryDefinitionWithSource> = {}): CategoryDefinitionWithSource {
  idCounter++;
  const baseSourceType: DefinitionSource = overrides.sourceType ?? 'system';
  return {
    slug: overrides.slug ?? `test-category-${idCounter}`,
    name: overrides.name ?? `Test Category ${idCounter}`,
    description: overrides.description ?? `Description for test category ${idCounter}`,
    source: overrides.source ?? (baseSourceType === 'system' ? 'system' : 'user'),
    sourceType: baseSourceType,
    ...overrides, // Ensure overrides can include sourceType
  };
}

/**
 * Create multiple test categories
 */
export function createTestCategories(count: number, baseOverrides: Partial<CategoryDefinitionWithSource> = {}): CategoryDefinitionWithSource[] {
  return Array.from({ length: count }, () => {
    // idCounter will be incremented by createTestCategory
    return createTestCategory({
      ...baseOverrides,
    });
  });
}

// Note: RuleFile type was local and is not in domain.ts.
// If it's needed, it should be defined or imported from a relevant source.
// For now, removing createTestRuleFile as it's not directly mapped to a domain type
// and its usage was not apparent in the original testDataFactories.ts either.

/**
 * Create predefined modes for common test scenarios
 */
export const predefinedModes = {
  basic: createTestMode({
    slug: 'basic',
    name: 'Basic Mode',
    description: 'A basic mode with minimal configuration',
    categorySlugs: ['core'],
    associatedRuleFiles: [createTestRule({ id: 'basic-rule-1', name: 'Basic Rule 1', sourcePath: 'generic/basic-rule1.md' })],
    sourceType: 'system',
  }),

  comprehensive: createTestMode({
    slug: 'comprehensive',
    name: 'Comprehensive Mode',
    description: 'A comprehensive mode with all features enabled',
    categorySlugs: ['core', 'utils', 'api', 'ui'],
    associatedRuleFiles: [
      createTestRule({ id: 'comp-rule-1', name: 'Comp Rule 1', sourcePath: 'generic/comp-rule1.md' }),
      createTestRule({ id: 'comp-rule-2', name: 'Comp Rule 2', sourcePath: 'generic/comp-rule2.md' })
    ],
    sourceType: 'system',
  }),

  minimal: createTestMode({
    slug: 'minimal',
    name: 'Minimal Mode',
    description: 'A minimal mode with only essential features',
    categorySlugs: ['core'],
    associatedRuleFiles: [createTestRule({ id: 'minimal-rule-1', name: 'Minimal Rule 1', sourcePath: 'generic/minimal-rule1.md' })],
    sourceType: 'system',
  })
};

/**
 * Create predefined categories for common test scenarios
 */
export const predefinedCategories = {
  core: createTestCategory({
    slug: 'core',
    name: 'Core',
    description: 'Core functionality rules',
    sourceType: 'system',
  }),

  utils: createTestCategory({
    slug: 'utils',
    name: 'Utilities',
    description: 'Utility function rules',
    sourceType: 'system',
  }),

  api: createTestCategory({
    slug: 'api',
    name: 'API',
    description: 'API-related rules',
    sourceType: 'system',
  }),

  ui: createTestCategory({
    slug: 'ui',
    name: 'UI',
    description: 'User interface rules',
    sourceType: 'system',
  })
};

/**
 * Generates a JSON string representation of a ModeDefinition array.
 * Useful for creating mock definition files in memfs.
 * @param modes - An array of ModeDefinition objects.
 * @returns A JSON string.
 */
export function createModesJsonContent(modes: ModeDefinition[]): string {
  return JSON.stringify({ modes }, null, 2);
}

/**
 * Generates a JSON string representation of a CategoryDefinition array.
 * Useful for creating mock definition files in memfs.
 * @param categories - An array of CategoryDefinition objects.
 * @returns A JSON string.
 */
export function createCategoriesJsonContent(categories: CategoryDefinition[]): string {
  return JSON.stringify({ categories }, null, 2);
}
