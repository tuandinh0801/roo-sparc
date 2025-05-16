import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';
import { ModeDefinition, CategoryDefinition, Rule, SourceType as CommandSourceType } from '../types/domain.js';
import { FileManager } from './FileManager.js';
import { uiManager } from '../utils/uiManager.js'; // To instantiate FileManager

/**
 * Defines the source type of a definition for display purposes,
 * indicating whether it's a system default, a user customization,
 * or a user customization that overrides a system default.
 */
export type DefinitionSourceType = 'system' | 'custom' | 'custom (overrides system)';

/**
 * Extends ModeDefinition with a sourceType property for display purposes.
 */
export interface ModeDefinitionWithSource extends ModeDefinition {
  sourceType: DefinitionSourceType;
}

/**
 * Extends CategoryDefinition with a sourceType property for display purposes.
 */
export interface CategoryDefinitionWithSource extends CategoryDefinition {
  sourceType: DefinitionSourceType;
}

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
  source: z.enum(['system', 'user']).optional(), // Added source
});

const ModeDefinitionSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  customInstructions: z.string().optional(),
  groups: z.array(z.union([z.string(), z.array(z.union([z.string(), z.object({})]))])).optional(),
  categorySlugs: z.array(z.string()),
  associatedRuleFiles: z.array(RuleSchema),
  source: z.enum(['system', 'user']).optional(), // Added source
});

// Schema for user-definitions.json
const UserDefinitionsSchema = z.object({
  customModes: z.array(ModeDefinitionSchema).optional(),
  customCategories: z.array(CategoryDefinitionSchema).optional(),
});

type UserDefinitionsFile = z.infer<typeof UserDefinitionsSchema>;

/**
 * @class DefinitionLoader
 * @description Loads and validates mode, category, and rule definitions from system and user locations.
 * Designed to be injectable.
 */
export class DefinitionLoader {
  private systemDefinitionsPath: string;
  private fileManager: FileManager;

  /**
   * @constructor
   * @param {FileManager} fileManager - Instance of FileManager.
   * @param {string} [systemDefinitionsPath='definitions'] - The base path to the system definitions directory.
   */
  constructor(fileManager: FileManager, systemDefinitionsPath: string = 'definitions') {
    this.fileManager = fileManager;
    this.systemDefinitionsPath = systemDefinitionsPath;
  }

  /**
   * Loads all definitions (modes, categories) from system and user configurations.
   * Rule definitions are part of ModeDefinitions.
   * User definitions take precedence over system definitions in case of slug conflicts.
   * @returns {Promise<{ modes: ModeDefinition[], categories: CategoryDefinition[] }>}
   * @throws {Error} If loading or validation fails for system definitions. User definition errors are logged as warnings.
   */
  public async loadDefinitions(): Promise<{ modes: ModeDefinition[]; categories: CategoryDefinition[] }> {
    try {
      // Load system definitions
      let systemModes = await this.loadAndValidateSystemModes();
      let systemCategories = await this.loadAndValidateSystemCategories();

      systemModes = systemModes.map(mode => ({ ...mode, source: 'system' as const }));
      systemCategories = systemCategories.map(cat => ({ ...cat, source: 'system' as const }));

      // Load user definitions
      const userDefinitions = await this.loadUserDefinitions();
      const userModes = (userDefinitions?.customModes || []).map(mode => ({ ...mode, source: 'user' as const }));
      const userCategories = (userDefinitions?.customCategories || []).map(cat => ({ ...cat, source: 'user' as const }));

      // Merge definitions
      const mergedModes = this.mergeModes(systemModes, userModes);
      const mergedCategories = this.mergeCategories(systemCategories, userCategories);

      // Validate merged definitions
      this.validateModeCategories(mergedModes, mergedCategories);
      await this.validateRulePaths(mergedModes); // This will now need to consider the 'source'

      return { modes: mergedModes, categories: mergedCategories };
    } catch (error) {
      // console.error("Failed to load definitions:", error); // System definition errors are critical
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
  private async loadAndValidateSystemModes(): Promise<ModeDefinition[]> {
    const modesPath = path.join(this.systemDefinitionsPath, 'modes.json');
    if (process.env.NODE_ENV === 'test') {
      console.log(`[DefinitionLoader Test Log] Checking for system modes.json at: ${modesPath}`);
    }
    if (!await fs.pathExists(modesPath)) {
      if (process.env.NODE_ENV === 'test') {
        console.error(`[DefinitionLoader Test Log] System modes.json NOT FOUND at: ${modesPath}`);
      }
      throw new Error(`System modes definition file not found at ${modesPath}`);
    }
    const modesContent = await fs.readJson(modesPath);
    if (process.env.NODE_ENV === 'test') {
      console.log(`[DefinitionLoader Test Log] Content of system ${modesPath}:`, JSON.stringify(modesContent, null, 2));
    }
    const validationResult = z.array(ModeDefinitionSchema).safeParse(modesContent);
    if (!validationResult.success) {
      if (process.env.NODE_ENV === 'test') {
        console.error(`[DefinitionLoader Test Log] Validation failed for system ${modesPath}: ${validationResult.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
      }
      throw new Error(`Invalid system modes.json: ${validationResult.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
    }
    return validationResult.data.map(mode => ({ ...mode, source: 'system' as const }));
  }

  /**
   * Loads and validates system category definitions from `categories.json`.
   * @returns {Promise<CategoryDefinition[]>}
   * @private
   */
  private async loadAndValidateSystemCategories(): Promise<CategoryDefinition[]> {
    const categoriesPath = path.join(this.systemDefinitionsPath, 'categories.json');
    if (!await fs.pathExists(categoriesPath)) {
      throw new Error(`System categories definition file not found at ${categoriesPath}`);
    }
    const categoriesContent = await fs.readJson(categoriesPath);
    const validationResult = z.array(CategoryDefinitionSchema).safeParse(categoriesContent);
    if (!validationResult.success) {
      throw new Error(`Invalid system categories.json: ${validationResult.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
    }
    return validationResult.data.map(cat => ({ ...cat, source: 'system' as const }));
  }

  /**
   * Loads user-defined modes and categories from `user-definitions.json`.
   * Handles missing or invalid files gracefully by logging a warning.
   * @private
   * @returns {Promise<UserDefinitionsFile | null>}
   */
  private async loadUserDefinitions(): Promise<UserDefinitionsFile | null> {
    try {
      // Delegate reading and initial parsing/validation to FileManager's method
      const userDefsFromFile = await this.fileManager.readUserDefinitions();

      if (!userDefsFromFile) {
        // FileManager.readUserDefinitions already logs if file not found or parse error,
        // and returns null in those cases.
        // console.warn is handled by fileManager.readUserDefinitions
        return null;
      }

      // Further Zod validation specific to DefinitionLoader's expectations if needed,
      // or assume FileManager.readUserDefinitions returns data adhering to UserDefinitionsFile type.
      // For now, assume FileManager.readUserDefinitions returns the correct structure
      // or null, and handles its own console warnings for file-not-found/parse errors.
      const validationResult = UserDefinitionsSchema.safeParse(userDefsFromFile);

      if (!validationResult.success) {
        // This case might occur if FileManager.readUserDefinitions returns something
        // that passed its basic JSON parse but fails this stricter Zod schema.
        const userConfigPath = this.fileManager.getUserConfigPath();
        const userDefinitionsPath = path.join(userConfigPath, 'user-definitions.json');
        console.warn(`Invalid structure in user-definitions.json at ${userDefinitionsPath} after initial read: ${validationResult.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}. Proceeding without user definitions.`);
        return null;
      }

      const resultData = validationResult.data;
      // Ensure 'source: user' is set, as FileManager.readUserDefinitions might not set this.
      if (resultData.customModes) {
        resultData.customModes = resultData.customModes.map(m => ({ ...m, source: 'user' as const }));
      }
      if (resultData.customCategories) {
        resultData.customCategories = resultData.customCategories.map(c => ({ ...c, source: 'user' as const }));
      }
      return resultData;

    } catch (error) {
      // Catch errors from this.fileManager.readUserDefinitions() if it throws unexpectedly
      // (though it's designed to return null for common read/parse issues).
      console.warn(`Unexpected error calling this.fileManager.readUserDefinitions(): ${error instanceof Error ? error.message : String(error)}. Proceeding without user definitions.`);
      return null;
    }
  }

  /**
   * Merges system and user modes, with user modes taking precedence.
   * @private
   */
  private mergeModes(systemModes: ModeDefinition[], userModes: ModeDefinition[]): ModeDefinition[] {
    const merged = new Map<string, ModeDefinition>();
    systemModes.forEach(mode => merged.set(mode.slug, mode));
    userModes.forEach(mode => merged.set(mode.slug, mode)); // User mode overwrites system if slug matches
    return Array.from(merged.values());
  }

  /**
   * Merges system and user categories, with user categories taking precedence.
   * @private
   */
  private mergeCategories(systemCategories: CategoryDefinition[], userCategories: CategoryDefinition[]): CategoryDefinition[] {
    const merged = new Map<string, CategoryDefinition>();
    systemCategories.forEach(cat => merged.set(cat.slug, cat));
    userCategories.forEach(cat => merged.set(cat.slug, cat)); // User category overwrites system
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
   * @param {ModeDefinition[]} modes - The merged mode definitions.
   * @private
   * @throws {Error} If a rule file is not found.
   */
  private async validateRulePaths(modes: ModeDefinition[]): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      console.log('[DefinitionLoader Test Log] validateRulePaths called with modes:', JSON.stringify(modes.map(m => ({ slug: m.slug, source: m.source })), null, 2));
    }

    try {
      const userConfigRulesPath = path.join(this.fileManager.getUserConfigPath(), 'rules');
      if (process.env.NODE_ENV === 'test') {
        console.log('[DefinitionLoader Test Log] userConfigRulesPath:', userConfigRulesPath);
      }

      const systemRulesPath = path.join(this.systemDefinitionsPath, 'rules');
      if (process.env.NODE_ENV === 'test') {
        console.log('[DefinitionLoader Test Log] systemRulesPath:', systemRulesPath);
      }

      const rulePromises = modes.flatMap(mode => {
        if (process.env.NODE_ENV === 'test') {
          console.log(`[DefinitionLoader Test Log] Processing mode: ${mode.slug}, source: ${mode.source}`);
        }

        return mode.associatedRuleFiles.map(async(rule: Rule) => {
          if (process.env.NODE_ENV === 'test') {
            console.log(`[DefinitionLoader Test Log] Processing rule: ${rule.id} in mode ${mode.slug}`);
          }

          let ruleBasePath: string;
          // rule.sourcePath is expected to be like 'mode-slug/rule-file.md'
          // or just 'rule-file.md' if it's directly under the mode's rule folder.
          // The story (AC6) suggests: `[custom_mode_slug]/my-custom-rule.md` relative to `~/.config/roo-init/rules/`
          // This means rule.sourcePath itself contains the mode slug.

          if (mode.source === 'user') {
            ruleBasePath = userConfigRulesPath;
          } else { // 'system' or undefined (should default to system)
            ruleBasePath = systemRulesPath;
          }

          if (process.env.NODE_ENV === 'test') {
            console.log(`[DefinitionLoader Test Log] ruleBasePath for ${rule.id}: ${ruleBasePath}`);
            console.log(`[DefinitionLoader Test Log] rule.sourcePath: ${rule.sourcePath}`);
          }

          // The rule.sourcePath should be like "mode-slug/rule-name.md"
          // It's relative to the 'rules' directory (either system or user)
          try {
            // Use explicit path module reference to avoid any shadowing issues
            const fullRulePath = require('path').join(ruleBasePath, rule.sourcePath);

            if (process.env.NODE_ENV === 'test') {
              console.log(`[DefinitionLoader Test Log] fullRulePath: ${fullRulePath}`);
            }

            if (!await fs.pathExists(fullRulePath)) {
              throw new Error(`Rule file not found for ${mode.source || 'system'} mode "${mode.slug}", rule "${rule.id}": ${fullRulePath} (sourcePath: "${rule.sourcePath}")`);
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'test') {
              console.error(`[DefinitionLoader Test Log] Error joining paths: ${error}`);
            }
            throw error;
          }
        });
      });

      await Promise.all(rulePromises);
    } catch (error) {
      if (process.env.NODE_ENV === 'test') {
        console.error(`[DefinitionLoader Test Log] Error in validateRulePaths: ${error}`);
      }
      throw error;
    }
  }

  /**
   * Retrieves only system mode definitions.
   * @returns {Promise<ModeDefinition[]>}
   */
  public async getSystemModes(): Promise<ModeDefinition[]> {
    try {
      const modes = await this.loadAndValidateSystemModes();
      // Ensure source is marked, though loadAndValidateSystemModes should already do this
      return modes.map(mode => ({ ...mode, source: 'system' as const }));
    } catch (error) {
      // console.error("Failed to load system modes:", error);
      throw new Error(`Failed to load system modes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieves only custom mode definitions.
   * @returns {Promise<ModeDefinition[]>}
   */
  public async getCustomModes(): Promise<ModeDefinition[]> {
    try {
      const userDefs = await this.loadUserDefinitions();
      const modes = userDefs?.customModes || [];
      // Ensure source is marked, though loadUserDefinitions should already do this
      return modes.map(mode => ({ ...mode, source: 'user' as const }));
    } catch (error) {
      // console.warn("Failed to load custom modes:", error);
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
      mergedMap.set(mode.slug, { ...mode, sourceType: 'system' });
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
   * @returns {Promise<CategoryDefinition[]>} A promise that resolves to an array of system category definitions.
   */
  public async getSystemCategories(): Promise<CategoryDefinition[]> {
    try {
      const categories = await this.loadAndValidateSystemCategories();
      return categories.map(cat => ({ ...cat, source: 'system' as const }));
    } catch (error) {
      throw new Error(`Failed to load system categories: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieves only custom category definitions.
   * @returns {Promise<CategoryDefinition[]>} A promise that resolves to an array of custom category definitions.
   */
  public async getCustomCategories(): Promise<CategoryDefinition[]> {
    try {
      const userDefs = await this.loadUserDefinitions();
      const categories = userDefs?.customCategories || [];
      return categories.map(cat => ({ ...cat, source: 'user' as const }));
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
      mergedMap.set(cat.slug, { ...cat, sourceType: 'system' });
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
const fileManagerInstance = new FileManager(uiManager);
export const definitionLoader = new DefinitionLoader(fileManagerInstance);