/**
 * Represents a single rule file (typically Markdown).
 */
export interface Rule {
  id: string; // Unique identifier for the rule (e.g., "01_document_retrieval")
  name: string; // Human-readable name (e.g., "Document Retrieval Rule")
  description: string; // Brief description of the rule's purpose
  sourcePath: string; // Relative path to the rule file within the CLI's bundled 'definitions/rules/' directory (e.g., "generic/01_document_retrieval.md" or "mode-slug/specific_rule.md")
  isGeneric: boolean; // True if the rule belongs in the target project's generic '.roo/rules/' folder, false if mode-specific (e.g., '.roo/rules-[mode_slug]/')
  targetPath?: string; // Calculated target path within the project, added dynamically by FileManager
}

/**
 * Represents a category used to group modes.
 */
export interface CategoryDefinition {
  slug: string; // Unique identifier for the category (e.g., "development-workflows")
  name: string; // Human-readable name (e.g., "Development Workflows")
  description: string; // Brief description of the category
}

/**
 * Represents a selectable mode, bundling configurations and rules.
 */
export interface ModeDefinition {
  slug: string; // Unique identifier for the mode (e.g., "architect-agent")
  name: string; // Human-readable name (e.g., "Architect Agent")
  description: string; // Detailed description of the mode's purpose and functionality (corresponds to 'roleDefinition' in .roomodes output)
  customInstructions?: string; // Corresponds to 'customInstructions' in .roomodes output
  groups?: (string | (string | object)[])[]; // Corresponds to 'groups' in .roomodes output
  categorySlugs: string[]; // Array of category slugs this mode belongs to
  associatedRuleFiles: Rule[]; // Array of Rule file metadata objects associated with this mode (both generic and specific). This is used internally by roo-init to know which files to copy.
  source?: string; // Corresponds to 'source' in .roomodes output, defaults to 'project' or 'system'
}