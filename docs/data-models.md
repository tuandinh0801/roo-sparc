# Roo Init CLI - Data Models

This document describes the primary data structures used within the Roo Init CLI application, focusing on the core domain entities (Modes, Categories, Rules) loaded from bundled definitions and the structure of the output `.roomodes` file. These models are based on the definitions in [`specs/consolidated_domain_model.md`](../specs/consolidated_domain_model.md).

## Core Domain Models (Internal Representation)

These models represent the data loaded from the bundled JSON definition files (`definitions/modes.json`, `definitions/categories.json`) and are used internally by the application logic. They will be defined as TypeScript interfaces in [`src/types/domain.ts`](src/types/domain.ts:0).

### `Rule` Interface

Represents a single rule file (typically Markdown).

```typescript
interface Rule {
  id: string; // Unique identifier for the rule (e.g., "01_document_retrieval")
  name: string; // Human-readable name (e.g., "Document Retrieval Rule")
  description: string; // Brief description of the rule's purpose
  sourcePath: string; // Relative path to the rule file within the CLI's bundled 'definitions/rules/' directory (e.g., "generic/01_document_retrieval.md" or "mode-slug/specific_rule.md")
  isGeneric: boolean; // True if the rule belongs in the target project's generic '.roo/rules/' folder, false if mode-specific (e.g., '.roo/rules-[mode_slug]/')
  targetPath?: string; // Calculated target path within the project, added dynamically by FileManager
}
```

### `CategoryDefinition` Interface

Represents a category used to group modes.

```typescript
interface CategoryDefinition {
  slug: string; // Unique identifier for the category (e.g., "development-workflows")
  name: string; // Human-readable name (e.g., "Development Workflows")
  description: string; // Brief description of the category
}
```

### `ModeDefinition` Interface

Represents a selectable mode, bundling configurations and rules.

```typescript
interface ModeDefinition {
  slug: string; // Unique identifier for the mode (e.g., "architect-agent")
  name: string; // Human-readable name (e.g., "Architect Agent")
  description: string; // Detailed description of the mode's purpose and functionality (corresponds to 'roleDefinition' in .roomodes output)
  customInstructions?: string; // Corresponds to 'customInstructions' in .roomodes output
  groups?: (string | (string | object)[])[]; // Corresponds to 'groups' in .roomodes output
  categorySlugs: string[]; // Array of category slugs this mode belongs to
  associatedRuleFiles: Rule[]; // Array of Rule file metadata objects associated with this mode (both generic and specific). This is used internally by roo-init to know which files to copy.
  source?: string; // Corresponds to 'source' in .roomodes output, defaults to 'project' or 'system'
  // Future enhancements might include:
  // dependencies?: string[]; // Slugs of other modes this mode depends on
}
```

## Bundled Definition File Structures (Internal to `roo-init` CLI)

These files are packaged with the `roo-init` CLI and are **not** the direct output into the user's project. They serve as the source data for the CLI.

### `definitions/categories.json`

An array of `CategoryDefinition` objects.

```json
[
  {
    "slug": "core-agents",
    "name": "Core SPARC Agents",
    "description": "Fundamental agent roles for the SPARC methodology."
  },
  {
    "slug": "development-workflows",
    "name": "Development Workflows",
    "description": "Modes supporting specific development processes like TDD."
  }
  // ... more categories
]
```

### `definitions/modes.json`

An array of `ModeDefinition` objects. The `rules` array within each mode definition will contain rule objects referencing files in `definitions/rules/`.

```json
[
  {
    "slug": "architect-agent",
    "name": "🏗️ Architect", // Name used for display in roo-init prompts
    "description": "You design scalable, secure, and modular architectures based on functional specs and user needs. You define responsibilities across services, APIs, and components.", // This corresponds to 'roleDefinition' in .roomodes
    "customInstructions": "Create architecture mermaid diagrams, data flows, and integration points. Ensure no part of the design includes secrets or hardcoded env values. Emphasize modular boundaries and maintain extensibility. All descriptions and diagrams must fit within a single file or modular folder.",
    "groups": ["read", "edit"], // Example groups
    "categorySlugs": ["core-agents"],
    "source": "project", // Default source
    "associatedRuleFiles": [ // These define the rule files to be copied by roo-init
      {
        "id": "architect-checklist",
        "name": "Architect Solution Validation Checklist",
        "description": "Checklist for validating technical design.",
        "sourcePath": "architect-agent/architect-checklist.md", // Path within roo-init's definitions/rules/
        "isGeneric": false // Will be copied to .roo/rules-architect-agent/
      },
      {
        "id": "architecture-doc-template",
        "name": "Architecture Document Template",
        "description": "Template for the main architecture document.",
        "sourcePath": "architect-agent/architecture.md",
        "isGeneric": false
      },
      {
        "id": "01_document_retrieval",
        "name": "Document Retrieval Rule",
        "description": "Standard rule for retrieving documents.",
        "sourcePath": "generic/01_document_retrieval.md", // Path within roo-init's definitions/rules/
        "isGeneric": true // Will be copied to .roo/rules/
      }
    ]
  }
  // ... more modes
]
```

## Output File Structure (`.roomodes` in Target Project)

This JSON file is generated in the root of the target project directory. It contains an object with a `customModes` array. Each object in this array represents a mode selected by the user and is structured for consumption by the SPARC application (or other tools). **It does not directly contain rule file content or full rule metadata from the `Rule` interface above.** The rule *files* themselves are copied to the `.roo/rules/` and `.roo/rules-[mode_slug]/` directories.

```json
// Example .roomodes file content in the target project
{
  "customModes": [
    {
      "slug": "architect",
      "name": "🏗️ Architect",
      "roleDefinition": "You design scalable, secure, and modular architectures based on functional specs and user needs. You define responsibilities across services, APIs, and components.",
      "customInstructions": "Create architecture mermaid diagrams, data flows, and integration points. Ensure no part of the design includes secrets or hardcoded env values. Emphasize modular boundaries and maintain extensibility. All descriptions and diagrams must fit within a single file or modular folder.",
      "groups": [
        "read",
        "edit"
      ],
      "source": "project"
    },
    {
      "slug": "code",
      "name": "🧠 Auto-Coder",
      "roleDefinition": "You write clean, efficient, modular code based on pseudocode and architecture. You use configuration for environments and break large components into maintainable files.",
      "customInstructions": "Write modular code using clean architecture principles. Never hardcode secrets or environment values. Split code into files < 500 lines. Use config files or environment abstractions. Use `new_task` for subtasks and finish with `attempt_completion`.\n\n## Tool Usage Guidelines:\n- Use `insert_content` when creating new files or when the target file is empty\n- Use `apply_diff` when modifying existing code, always with complete search and replace blocks\n- Only use `search_and_replace` as a last resort and always include both search and replace parameters\n- Always verify all required parameters are included before executing any tool",
      "groups": [
        "read",
        "edit",
        "browser",
        "mcp",
        "command"
      ],
      "source": "project"
    }
    // ... other selected modes
  ]
}
```
**Note:** The `roo-init` CLI reads its internal `definitions/modes.json` (which includes `associatedRuleFiles` data) and then, for each selected mode, it constructs an entry in the output `.roomodes` file using fields like `slug`, `name`, `description` (as `roleDefinition`), `customInstructions`, `groups`, and `source` from its internal `ModeDefinition`. The `associatedRuleFiles` data is used by `roo-init`'s `FileManager` to copy the actual rule files to the correct locations in the user's project (`.roo/rules/...`).

## Change Log

| Change        | Date       | Version | Description                                     | Author         |
| ------------- | ---------- | ------- | ----------------------------------------------- | -------------- |
| Initial draft | 2025-05-12 | 0.1     | Initial data models definition.                 | Architect Agent |
| Revision      | 2025-05-12 | 0.2     | Updated .roomodes output structure per feedback. Clarified internal vs. output models. Renamed `path` to `sourcePath` in internal `Rule` interface. | Architect Agent |