import fs from 'node:fs'; // Changed to node:fs for writeSync
import fsExtra from 'fs-extra'; // Keep fs-extra for other operations
import path from 'path';
import { z } from 'zod';
import {
  ModeDefinition,
  CategoryDefinition,
  Rule,
  SourceType as CommandSourceType,
  DefinitionSource,
  ModeDefinitionWithSource,
  CategoryDefinitionWithSource,
} from '../types/domain.js';
import { FileManager } from './FileManager.js';
import { UIManager } from '../utils/uiManager.js'; // For constructor type
import { uiManager as globalUiManager } from '../utils/uiManager.js'; // To instantiate FileManager if needed, or for default export
import { fileURLToPath } from 'url';

// Zod Schemas for validation
const RuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  sourcePath: z.string(), // Path relative to the mode's rule directory (system or user)
  isGeneric: z.boolean(),
  targetPath: z.string().optional(),
});

const CategoryDefinitionSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  /**
   * Internal flag for initial loading and merging (system/user).
   * Final display and detailed origin status should rely on 'sourceType'
   * from CategoryDefinitionWithSource.
   */
  source: z.enum(['system', 'user']).optional(),
});

const ModeDefinitionSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  customInstructions: z.string().optional(),
  groups: z.array(z.union([z.string(), z.array(z.union([z.string(), z.object({})]))])).optional(),
  categorySlugs: z.array(z.string()),
  associatedRuleFiles: z.array(RuleSchema),
  /**
   * Internal flag for initial loading and merging (system/user).
   * Final display and detailed origin status should rely on 'sourceType'
   * from ModeDefinitionWithSource.
   */
  source: z.enum(['system', 'user']).optional(),
});

// Schema for user-definitions.json
const UserDefinitionsSchema = z.object({
  customModes: z.array(ModeDefinitionSchema).optional(),
  customCategories: z.array(CategoryDefinitionSchema).optional(),
});

type ParsedUserDefinitionsFile = z.infer<typeof UserDefinitionsSchema>;

interface LoadedUserDefinitions {
  customModes: ModeDefinitionWithSource[];
  customCategories: CategoryDefinitionWithSource[];
}

/**
 * @class DefinitionLoader
 * @description Loads and validates mode, category, and rule definitions from system and user locations.
 * Designed to be injectable.
 */
export class DefinitionLoader {
  private systemDefinitionsPath: string;
  private fileManager: FileManager;
  private readonly uiManager: UIManager;

  /**
   * @constructor
   * @param {FileManager} fileManager - Instance of FileManager.
   * @param {UIManager} uiManager - Instance of UIManager.
   * @param {string} [systemDefinitionsPath='definitions'] - The base path to the system definitions directory.
   */
  constructor(fileManager: FileManager, uiManager: UIManager, systemDefinitionsPathInput?: string) {
    this.fileManager = fileManager;
    this.uiManager = uiManager;

    if (systemDefinitionsPathInput) {
      this.systemDefinitionsPath = systemDefinitionsPathInput;
    } else {
      // Default path calculation, assuming compiled file is in .../dist/src/core/
      // and definitions are in .../dist/definitions/
      const currentFileDir = path.dirname(fileURLToPath(import.meta.url));
      this.systemDefinitionsPath = path.resolve(currentFileDir, '..', '..', 'definitions');
    }
  }

  /**
   * Loads all definitions (modes, categories) from system and user configurations.
   * Rule definitions are part of ModeDefinitions.
   * User definitions take precedence over system definitions in case of slug conflicts.
   * @returns {Promise<{ modes: ModeDefinitionWithSource[], categories: CategoryDefinitionWithSource[] }>}
   * @throws {Error} If loading or validation fails for system definitions. User definition errors are logged as warnings.
   */
  public async loadDefinitions(): Promise<{ modes: ModeDefinitionWithSource[]; categories: CategoryDefinitionWithSource[] }> {
    try {
      // Load system definitions (already include source and sourceType)
      const systemModes = await this.loadAndValidateSystemModes();
      const systemCategories = await this.loadAndValidateSystemCategories();

      // Load user definitions (already include source and sourceType)
      const userDefinitions = await this.loadUserDefinitions();
      const userModes: ModeDefinitionWithSource[] = userDefinitions?.customModes || [];
      const userCategories: CategoryDefinitionWithSource[] = userDefinitions?.customCategories || [];

      // Merge definitions
      const mergedModes = this.mergeModes(systemModes, userModes);
      const mergedCategories = this.mergeCategories(systemCategories, userCategories);

      // Validate merged definitions
      this.validateModeCategories(mergedModes, mergedCategories);
      await this.validateRulePaths(mergedModes);

      return { modes: mergedModes, categories: mergedCategories };
    } catch (error) {
      throw new Error(`Failed to load definitions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Returns the base path to the definitions directory.
   * @returns {string} The definitions path.
   */
  public getSystemDefinitionsPath(): string {
    return this.systemDefinitionsPath;
  }

  /**
   * Loads and validates system mode definitions from `modes.json`.
   * @returns {Promise<ModeDefinition[]>}
   * @private
   */
  private async loadAndValidateSystemModes(): Promise<ModeDefinitionWithSource[]> {
    const modesPath = path.join(this.systemDefinitionsPath, 'modes.json');
    if (!await fsExtra.pathExists(modesPath)) { // Use fsExtra for pathExists
      throw new Error(`System modes definition file not found at ${modesPath}`);
    }
    const modesContent = await fsExtra.readJson(modesPath); // Use fsExtra for readJson
    const validationResult = z.array(ModeDefinitionSchema).safeParse(modesContent);
    if (!validationResult.success) {
      throw new Error(`Invalid system modes.json: ${validationResult.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
    }
    return validationResult.data.map(mode => ({ ...mode, source: 'system' as const, sourceType: 'system' as DefinitionSource }));
  }

  /**
   * Loads and validates system category definitions from `categories.json`.
   * @returns {Promise<CategoryDefinitionWithSource[]>}
   * @private
   */
  private async loadAndValidateSystemCategories(): Promise<CategoryDefinitionWithSource[]> {
    const categoriesPath = path.join(this.systemDefinitionsPath, 'categories.json');
    if (!await fsExtra.pathExists(categoriesPath)) { // Use fsExtra for pathExists
      throw new Error(`System categories definition file not found at ${categoriesPath}`);
    }
    const categoriesContent = await fsExtra.readJson(categoriesPath); // Use fsExtra for readJson
    const validationResult = z.array(CategoryDefinitionSchema).safeParse(categoriesContent);
    if (!validationResult.success) {
      throw new Error(`Invalid system categories.json: ${validationResult.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
    }
    return validationResult.data.map(cat => ({ ...cat, source: 'system' as const, sourceType: 'system' as DefinitionSource }));
  }

  /**
   * Loads user-defined modes and categories from `user-definitions.json`.
   * Handles missing or invalid files gracefully by logging a warning.
   * @private
   * @returns {Promise<LoadedUserDefinitions | null>}
   */
  private async loadUserDefinitions(): Promise<LoadedUserDefinitions | null> {
    try {
      const userDefsFromFile = await this.fileManager.readUserDefinitions();

      if (!userDefsFromFile) {
        return null;
      }

      const validationResult = UserDefinitionsSchema.safeParse(userDefsFromFile);

      if (!validationResult.success) {
        const userConfigPath = this.fileManager.getUserConfigPath();
        const userDefinitionsPath = path.join(userConfigPath, 'user-definitions.json');
        this.uiManager.printWarning(`Invalid structure in user-definitions.json at ${userDefinitionsPath} after initial read: ${validationResult.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}. Proceeding without user definitions.`);
        return null;
      }

      const parsedData: ParsedUserDefinitionsFile = validationResult.data;

      const customModes: ModeDefinitionWithSource[] = (parsedData.customModes || []).map(m => ({
        ...m,
        source: 'user' as const, // Ensure source is 'user'
        sourceType: 'custom' as DefinitionSource,
      }));

      const customCategories: CategoryDefinitionWithSource[] = (parsedData.customCategories || []).map(c => ({
        ...c,
        source: 'user' as const, // Ensure source is 'user'
        sourceType: 'custom' as DefinitionSource,
      }));

      return { customModes, customCategories };

    } catch (error) {
      this.uiManager.printWarning(`Unexpected error calling this.fileManager.readUserDefinitions(): ${error instanceof Error ? error.message : String(error)}. Proceeding without user definitions.`);
      return null;
    }
  }

  /**
   * Merges system and user modes, with user modes taking precedence and sourceType updated.
   * @private
   */
  private mergeModes(systemModes: ModeDefinitionWithSource[], userModes: ModeDefinitionWithSource[]): ModeDefinitionWithSource[] {
    const merged = new Map<string, ModeDefinitionWithSource>();
    systemModes.forEach(mode => merged.set(mode.slug, mode)); // mode already has sourceType: 'system'
    userModes.forEach(mode => { // mode here has sourceType: 'custom' from loadUserDefinitions
      if (merged.has(mode.slug)) {
        // User mode overwrites system, update sourceType
        merged.set(mode.slug, { ...mode, sourceType: 'custom (overrides system)' });
      } else {
        // New custom mode, sourceType is already 'custom'
        merged.set(mode.slug, mode);
      }
    });
    return Array.from(merged.values());
  }

  /**
   * Merges system and user categories, with user categories taking precedence and sourceType updated.
   * @private
   */
  private mergeCategories(systemCategories: CategoryDefinitionWithSource[], userCategories: CategoryDefinitionWithSource[]): CategoryDefinitionWithSource[] {
    const merged = new Map<string, CategoryDefinitionWithSource>();
    systemCategories.forEach(cat => merged.set(cat.slug, cat)); // cat already has sourceType: 'system'
    userCategories.forEach(cat => { // cat here has sourceType: 'custom' from loadUserDefinitions
      if (merged.has(cat.slug)) {
        // User category overwrites system, update sourceType
        merged.set(cat.slug, { ...cat, sourceType: 'custom (overrides system)' });
      } else {
        // New custom category, sourceType is already 'custom'
        merged.set(cat.slug, cat);
      }
    });
    return Array.from(merged.values());
  }

  /**
   * Validates that all categorySlugs referenced in ModeDefinitions exist in the loaded CategoryDefinitions.
   * @param {ModeDefinition[]} modes - The loaded mode definitions.
   * @param {CategoryDefinition[]} categories - The loaded category definitions.
   * @private
   * @throws {Error} If a category slug is not found.
   */
  private validateModeCategories(modes: ModeDefinition[], categories: CategoryDefinition[]): void {
    const categorySlugs = new Set(categories.map(cat => cat.slug));
    modes.forEach(mode => {
      mode.categorySlugs.forEach((slug: string) => {
        if (!categorySlugs.has(slug)) {
          throw new Error(`Mode "${mode.slug}" references non-existent category slug "${slug}".`);
        }
      });
    });
  }

  /**
   * Validates that all rule sourcePath files exist for both system and user modes.
   * @param {ModeDefinitionWithSource[]} modes - The merged mode definitions.
   * @private
   * @throws {Error} If a rule file is not found.
   */
  private async validateRulePaths(modes: ModeDefinitionWithSource[]): Promise<void> {
    const userConfigRulesPath = path.join(this.fileManager.getUserConfigPath(), 'rules');
    const systemRulesPath = path.join(this.systemDefinitionsPath, 'rules');

    const rulePromises = modes.flatMap(mode => {
      // mode.source is from the original JSON ('system' or 'user').
      // mode.sourceType is more descriptive ('system', 'custom', 'custom (overrides system)').
      // For rule path resolution, the original 'source' (where the definition JSON was found) is key.
      const definitionOriginSource = mode.source;

      return mode.associatedRuleFiles.map(async(rule: Rule) => {
        let ruleBasePath: string;
        if (definitionOriginSource === 'user') {
          ruleBasePath = userConfigRulesPath;
        } else { // 'system' or undefined (should default to system for rules)
          ruleBasePath = systemRulesPath;
        }
        const fullRulePath = path.join(ruleBasePath, rule.sourcePath);

        if (!await fsExtra.pathExists(fullRulePath)) { // Use fsExtra for pathExists
          throw new Error(`Rule file not found for ${definitionOriginSource || 'system'} mode "${mode.slug}", rule "${rule.id}": ${fullRulePath} (sourcePath: "${rule.sourcePath}")`);
        }
      });
    });

    await Promise.all(rulePromises);
  }

  /**
   * Retrieves only system mode definitions.
   * @returns {Promise<ModeDefinitionWithSource[]>}
   */
  public async getSystemModes(): Promise<ModeDefinitionWithSource[]> {
    try {
      return await this.loadAndValidateSystemModes();
    } catch (error) {
      throw new Error(`Failed to load system modes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieves only custom mode definitions.
   * @returns {Promise<ModeDefinitionWithSource[]>}
   */
  public async getCustomModes(): Promise<ModeDefinitionWithSource[]> {
    try {
      const userDefs = await this.loadUserDefinitions(); // Now returns { customModes: ModeDefinitionWithSource[], ... }
      return userDefs?.customModes || [];
    } catch (error) {
      // For custom modes, we might not want to throw a fatal error,
      // but rather return an empty array or let the caller handle it.
      // However, to be consistent with getSystemModes, we'll throw for now.
      // The command layer can decide to catch and show a warning.
      throw new Error(`Failed to load custom modes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieves merged mode definitions, with each item tagged by its source type.
   * Custom modes override system modes.
   * @returns {Promise<ModeDefinitionWithSource[]>} A promise that resolves to an array of mode definitions, each with a `sourceType`.
   */
  public async getMergedModes(): Promise<ModeDefinitionWithSource[]> {
    const systemModes = await this.getSystemModes();
    const customModes = await this.getCustomModes();
    const mergedMap = new Map<string, ModeDefinitionWithSource>();

    systemModes.forEach(mode => {
      mergedMap.set(mode.slug, mode);
    });

    customModes.forEach(mode => {
      if (mergedMap.has(mode.slug)) {
        // Custom mode overrides a system mode
        mergedMap.set(mode.slug, { ...mode, sourceType: 'custom (overrides system)' });
      } else {
        // New custom mode (does not override any system mode)
        mergedMap.set(mode.slug, { ...mode, sourceType: 'custom' });
      }
    });

    const allMergedModes = Array.from(mergedMap.values());
    // Further validation (like rule paths and category existence) is typically handled
    // by the `loadDefinitions` method or should be ensured by the caller if using
    // `getMergedModes` independently.
    return allMergedModes;
  }

  /**
   * Retrieves only system category definitions.
   * @returns {Promise<CategoryDefinitionWithSource[]>} A promise that resolves to an array of system category definitions.
   */
  public async getSystemCategories(): Promise<CategoryDefinitionWithSource[]> {
    try {
      return await this.loadAndValidateSystemCategories();
    } catch (error) {
      throw new Error(`Failed to load system categories: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieves only custom category definitions.
   * @returns {Promise<CategoryDefinitionWithSource[]>} A promise that resolves to an array of custom category definitions.
   */
  public async getCustomCategories(): Promise<CategoryDefinitionWithSource[]> {
    try {
      const userDefs = await this.loadUserDefinitions(); // Now returns { ..., customCategories: CategoryDefinitionWithSource[] }
      return userDefs?.customCategories || [];
    } catch (error) {
      throw new Error(`Failed to load custom categories: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieves merged category definitions, with each item tagged by its source type.
   * Custom categories override system categories.
   * @returns {Promise<CategoryDefinitionWithSource[]>} A promise that resolves to an array of category definitions, each with a `sourceType`.
   */
  public async getMergedCategories(): Promise<CategoryDefinitionWithSource[]> {
    const systemCategories = await this.getSystemCategories();
    const customCategories = await this.getCustomCategories();
    const mergedMap = new Map<string, CategoryDefinitionWithSource>();

    systemCategories.forEach(cat => {
      mergedMap.set(cat.slug, cat);
    });

    customCategories.forEach(cat => {
      if (mergedMap.has(cat.slug)) {
        // Custom category overrides a system category
        mergedMap.set(cat.slug, { ...cat, sourceType: 'custom (overrides system)' });
      } else {
        // New custom category
        mergedMap.set(cat.slug, { ...cat, sourceType: 'custom' });
      }
    });
    return Array.from(mergedMap.values());
  }
}

// Create instances needed for the singleton definitionLoader
const fileManagerInstance = new FileManager(globalUiManager);

const currentSingletonFileDir = path.dirname(fileURLToPath(import.meta.url));

const distDefinitionsPathSingleton = path.resolve(currentSingletonFileDir, '..', '..', 'definitions');

export const definitionLoader = new DefinitionLoader(fileManagerInstance, globalUiManager, distDefinitionsPathSingleton);