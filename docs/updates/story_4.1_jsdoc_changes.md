# JSDoc Updates for Story 4.1

This document outlines the necessary JSDoc comment updates for files modified in Story 4.1.

## 1. [`src/core/DefinitionLoader.ts`](src/core/DefinitionLoader.ts:0)

The `DefinitionLoader` class and its methods require updated JSDoc comments to reflect the new responsibilities of loading, merging, and managing user-specific global definitions.

### Class: `DefinitionLoader`

-   **Existing JSDoc:** Review and update the main class description.
-   **New responsibilities to document:**
    -   Loading definitions from both system-bundled files and the user-specific global configuration directory (e.g., `~/.config/roo-init/user-definitions.json`).
    -   Merging these two sets of definitions.
    -   Handling precedence (user definitions override system definitions in case of slug conflicts).
    -   Gracefully handling missing or malformed `user-definitions.json`.
    -   Adjusting `sourcePath` for rules within custom mode definitions to point to the user's global rules directory.

### Key Methods (and others as modified):

-   **Constructor:**
    -   Document any new parameters related to user configuration paths or `FileManager` instances if they are passed in.
-   **`loadDefinitions()` (or equivalent primary loading method):**
    -   Update to describe the two-stage loading process (system then user).
    -   Detail the merging strategy and conflict resolution (precedence).
    -   Explain how paths for custom rules are resolved or adjusted.
    -   Document error handling for `user-definitions.json` (e.g., file not found, parse errors).
-   **Private helper methods for loading user definitions:**
    -   `_loadUserDefinitions()`: Document its role in finding, reading, and parsing `user-definitions.json`.
    -   `_mergeDefinitions()`: Detail how system and user modes/categories are combined and how conflicts are resolved.
    -   `_getUserConfigPath()`: If this utility method is part of `DefinitionLoader`, document how it determines the user's configuration directory.
-   **Getter methods for modes/categories (e.g., `getModes()`, `getCategories()`):**
    -   Ensure they state that the returned list is a merged collection of system and user definitions.

**Example JSDoc Snippet (Conceptual for a method):**
```typescript
/**
 * Loads mode and category definitions from both system-bundled files
 * and the user's global configuration directory.
 * User definitions take precedence over system definitions in case of slug conflicts.
 * Gracefully handles missing or invalid user definition files by logging a warning
 * and proceeding with system definitions only.
 *
 * @returns {Promise<void>} A promise that resolves when all definitions are loaded and merged.
 */
async loadDefinitions(): Promise<void> {
  // ... implementation ...
}
```

## 2. [`src/core/FileManager.ts`](src/core/FileManager.ts:0)

If `FileManager` is enhanced to manage user-global configuration directories, relevant methods need JSDoc updates.

### Potential New/Modified Methods:

-   **`ensureUserConfigDirectories()` (or similar):**
    -   Document its responsibility for checking the existence of `~/.config/roo-init/` and `~/.config/roo-init/rules/`.
    -   Explain that it creates these directories if they do not exist.
    -   Mention the use of `fs-extra.ensureDir` or equivalent.
    -   Specify return values (e.g., `Promise<void>` or paths).
-   **`getUserConfigPath()` / `getUserRulesPath()` (if moved or centralized here):**
    -   Document how these paths are determined (cross-platform considerations).

**Example JSDoc Snippet (Conceptual for a method):**
```typescript
/**
 * Ensures that the user-specific global configuration directories exist.
 * Creates `~/.config/roo-init/` and its `rules` subdirectory if they are not present.
 *
 * @returns {Promise<void>} A promise that resolves when the directories are verified or created.
 * @throws {Error} If an error occurs during directory creation.
 */
async ensureUserConfigDirectories(): Promise<void> {
  // ... implementation ...
}
```

This markdown file serves as a guide for the developer implementing the JSDoc changes in the TypeScript files.