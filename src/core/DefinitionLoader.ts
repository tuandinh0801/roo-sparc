import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';
import { ModeDefinition, CategoryDefinition, Rule } from '../types/domain.js';

// Zod Schemas for validation
const RuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  sourcePath: z.string(),
  isGeneric: z.boolean(),
  targetPath: z.string().optional(),
});

const CategoryDefinitionSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
});

const ModeDefinitionSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  customInstructions: z.string().optional(),
  groups: z.array(z.union([z.string(), z.array(z.union([z.string(), z.object({})]))])).optional(),
  categorySlugs: z.array(z.string()),
  associatedRuleFiles: z.array(RuleSchema),
  source: z.string().optional(),
});

/**
 * @class DefinitionLoader
 * @description Loads and validates mode, category, and rule definitions from the file system.
 * Designed to be injectable.
 */
export class DefinitionLoader {
  private definitionsPath: string;

  /**
   * @constructor
   * @param {string} [definitionsPath='definitions'] - The base path to the definitions directory.
   */
  constructor(definitionsPath: string = 'definitions') {
    this.definitionsPath = definitionsPath;
  }

  /**
   * Loads all definitions (modes, categories).
   * Rule definitions are part of ModeDefinitions.
   * @returns {Promise<{ modes: ModeDefinition[], categories: CategoryDefinition[] }>}
   * @throws {Error} If loading or validation fails.
   */
  public async loadDefinitions(): Promise<{ modes: ModeDefinition[]; categories: CategoryDefinition[] }> {
    try {
      const modes = await this.loadAndValidateModes();
      const categories = await this.loadAndValidateCategories();
      // Further validation: Ensure all categorySlugs in modes exist in categories
      this.validateModeCategories(modes, categories);
      // Further validation: Ensure all rule sourcePaths exist
      await this.validateRulePaths(modes);
      return { modes, categories };
    } catch (error) {
      // console.error("Failed to load definitions:", error);
      throw new Error(`Failed to load definitions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Returns the base path to the definitions directory.
   * @returns {string} The definitions path.
   */
  public getDefinitionsPath(): string {
    return this.definitionsPath;
  }

  /**
   * Loads and validates mode definitions from `modes.json`.
   * @returns {Promise<ModeDefinition[]>}
   * @private
   */
  private async loadAndValidateModes(): Promise<ModeDefinition[]> {
    const modesPath = path.join(this.definitionsPath, 'modes.json');
    if (process.env.NODE_ENV === 'test') {
      console.log(`[DefinitionLoader Test Log] Checking for modes.json at: ${modesPath}`);
    }
    if (!await fs.pathExists(modesPath)) {
      if (process.env.NODE_ENV === 'test') {
        console.error(`[DefinitionLoader Test Log] modes.json NOT FOUND at: ${modesPath}`);
      }
      throw new Error(`Modes definition file not found at ${modesPath}`);
    }
    const modesContent = await fs.readJson(modesPath);
    if (process.env.NODE_ENV === 'test') {
      console.log(`[DefinitionLoader Test Log] Content of ${modesPath}:`, JSON.stringify(modesContent, null, 2));
    }
    const validationResult = z.array(ModeDefinitionSchema).safeParse(modesContent);
    if (!validationResult.success) {
      if (process.env.NODE_ENV === 'test') {
        console.error(`[DefinitionLoader Test Log] Validation failed for ${modesPath}: ${validationResult.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
      }
      throw new Error(`Invalid modes.json: ${validationResult.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
    }
    return validationResult.data;
  }

  /**
   * Loads and validates category definitions from `categories.json`.
   * @returns {Promise<CategoryDefinition[]>}
   * @private
   */
  private async loadAndValidateCategories(): Promise<CategoryDefinition[]> {
    const categoriesPath = path.join(this.definitionsPath, 'categories.json');
    if (!await fs.pathExists(categoriesPath)) {
      throw new Error(`Categories definition file not found at ${categoriesPath}`);
    }
    const categoriesContent = await fs.readJson(categoriesPath);
    const validationResult = z.array(CategoryDefinitionSchema).safeParse(categoriesContent);
    if (!validationResult.success) {
      throw new Error(`Invalid categories.json: ${validationResult.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
    }
    return validationResult.data;
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
   * Validates that all rule sourcePath files exist.
   * @param {ModeDefinition[]} modes - The loaded mode definitions.
   * @private
   * @throws {Error} If a rule file is not found.
   */
  private async validateRulePaths(modes: ModeDefinition[]): Promise<void> {
    const rulePromises = modes.flatMap(mode =>
      mode.associatedRuleFiles.map(async(rule: Rule) => {
        const rulePath = path.join(this.definitionsPath, 'rules', rule.sourcePath);
        if (!await fs.pathExists(rulePath)) {
          throw new Error(`Rule file not found for mode "${mode.slug}", rule "${rule.id}": ${rulePath}`);
        }
      })
    );
    await Promise.all(rulePromises);
  }
}