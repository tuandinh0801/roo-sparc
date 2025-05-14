# Epic 4: User-Defined Custom Mode & Category Management (CRUD)

**Goal:** To empower users with full lifecycle management (Create, Read, Update, Delete) for their own custom modes and categories. These custom definitions will be stored globally in the user's configuration directory, persist across CLI updates, and be available for use in any project. This includes an in-CLI mechanism for creating and editing associated Markdown rule files.

**Deployability:** This epic builds upon the core CLI framework and definition loading mechanisms (Epic 1). It introduces a new set of `manage` commands. Upon completion, `roo-init` will allow users to define, modify, and use a personalized set of modes and categories that augment the built-in system definitions, with custom definitions taking precedence in case of slug conflicts.

## Epic-Specific Technical Context

-   **New CLI Command Suite:** `roo-init manage` with subcommands for `add`, `list`, `edit`, `delete` for both `mode` and `category`.
-   **User-Specific Global Storage:**
    -   Mode and Category Objects: A JSON file, e.g., `~/.config/roo-init/user-definitions.json`.
    -   Rule Files: Markdown files stored in subdirectories per custom mode, e.g., `~/.config/roo-init/rules/[custom_mode_slug]/my-rule.md`.
-   **`DefinitionLoader` Enhancements ([`src/core/DefinitionLoader.ts`](src/core/DefinitionLoader.ts:0)):**
    -   Locate and parse the `user-definitions.json` file.
    -   Merge custom definitions with bundled system definitions.
    -   **Conflict Resolution:** If a custom mode/category slug matches a system mode/category slug, the custom definition will take precedence when the combined list is presented or used by `roo-init`.
-   **`ModeSelector` Enhancements ([`src/core/ModeSelector.ts`](src/core/ModeSelector.ts:0)):**
    -   Utilize the merged list of system and custom modes/categories for interactive selection and non-interactive resolution.
    -   Ensure precedence of custom definitions is honored.
-   **Interactive Prompts (`inquirer`):**
    -   Comprehensive prompt sequences for creating and editing modes/categories, including all their respective fields.
    -   An `editor` type prompt for multi-line input of Markdown content for rule files, saved directly by the CLI.
-   **File System Operations:** Robust logic to create, read, write, and delete files and directories within the user's global configuration locations (`~/.config/roo-init/`).
-   **Input Validation:**
    -   Mode/Category slugs must be unique *among other custom definitions*.
    -   Validation for all other fields as appropriate (e.g., non-empty names).
    -   Management of rule filenames and paths.
-   **Data Model for Custom Rules:** Within `user-definitions.json`, a rule associated with a custom mode will have a `sourcePath` like `"[custom_mode_slug]/rule-filename.md"`, referring to a file in `~/.config/roo-init/rules/`.

## Local Testability & Command-Line Access

-   **Local Development:** Developers can directly execute `roo-init manage <subcommand> mode/category [args]` to test all CRUD operations.
-   **Command-Line Testing:**
    -   Verify creation, listing, updating, and deletion of custom modes and categories.
    -   Inspect the content and structure of `~/.config/roo-init/user-definitions.json` and `~/.config/roo-init/rules/` after operations.
    -   Test the `roo-init` (main command) to ensure it correctly lists and utilizes custom modes (including precedence over system modes with conflicting slugs).
    -   Test in-CLI rule content creation and editing.
    -   Validate error handling for invalid inputs, slug conflicts (within custom definitions), and file operations.
-   **Testing Prerequisites:** A functional `roo-init` CLI (Epics 1-3). CLI must have permissions to create/read/write to the user's configuration directory (e.g., `~/.config/`). Test environment should allow for easy inspection/reset of these global configuration files.

## Story List

### Story 4.1: Setup User-Global Storage & Enhance Definition Loading

-   **User Story / Goal:** As a Developer, the CLI needs to establish and manage user-specific global storage for custom modes/categories and their rules, and the definition loading mechanism must incorporate these custom definitions.
-   **Detailed Requirements:**
    -   Implement logic to determine the user-specific configuration directory path (cross-platform).
    -   Ensure `~/.config/roo-init/` and `~/.config/roo-init/rules/` directories are created if they don't exist when needed.
    -   Modify `DefinitionLoader` to:
        -   Attempt to read and parse `~/.config/roo-init/user-definitions.json`. If it doesn't exist or is invalid, treat as no custom definitions.
        -   Merge loaded custom modes and categories with system definitions.
        -   If a custom mode/category slug matches a system slug, the custom one replaces the system one in the merged list used by the application.
        -   Ensure slugs for custom definitions are unique among themselves (validation to be handled by `add`/`edit` commands).
-   **Acceptance Criteria (ACs):**
    -   AC1: CLI can correctly identify/create the user-global config directories.
    -   AC2: `DefinitionLoader` successfully loads and merges system definitions with valid custom definitions from `user-definitions.json`.
    -   AC3: If `user-definitions.json` is missing or empty, `DefinitionLoader` operates correctly with only system definitions.
    -   AC4: If a custom mode/category slug duplicates a system slug, the custom definition is used by `ModeSelector` and `roo-init`.
    -   AC5: Unit tests verify merging logic and precedence rules.
-   **Dependencies:** Epic 1 (Core Definition Loading).

---

### Story 4.2: Implement `add custom mode` Command

-   **User Story / Goal:** As a CLI User, I want an interactive command `roo-init manage add mode` to define a new custom mode, including its rules with content edited in-CLI, and save it to my global user configuration.
-   **Detailed Requirements:**
    -   Create the `roo-init manage add mode` command.
    -   Interactively prompt for: `slug`, `name`, `description` (`roleDefinition`), `customInstructions` (optional), `groups` (optional, multi-select from a predefined list or freeform input), `categorySlugs` (multi-select from existing system AND custom categories).
    -   Validate `slug` for uniqueness among *other custom modes*.
    -   For `associatedRuleFiles`:
        -   Repeatedly ask if the user wants to add a rule.
        -   If yes: prompt for rule `name` (display), `filename` (e.g., `my-rule.md`), `description` (optional), `isGeneric` (boolean, defaults to `false`).
        -   Use an `editor` type prompt for the rule's Markdown content.
        -   Save the rule content to `~/.config/roo-init/rules/[mode_slug]/[filename]`. Create the `[mode_slug]` subdirectory if it doesn't exist.
        -   Store rule metadata (including `sourcePath`: `"[mode_slug]/[filename]"`) in the mode object.
    -   Save the complete new mode definition to `~/.config/roo-init/user-definitions.json`.
-   **Acceptance Criteria (ACs):**
    -   AC1: User can successfully create a new custom mode with all its fields via interactive prompts.
    -   AC2: Associated rule files are created with user-provided content in the correct subdirectory under `~/.config/roo-init/rules/`.
    -   AC3: The new mode (with rule metadata) is correctly appended to `user-definitions.json`.
    -   AC4: Input validation (e.g., unique custom slug, valid filename) prevents saving invalid data.
    -   AC5: If `user-definitions.json` doesn't exist, it's created.
-   **Dependencies:** Story 4.1.

---

### Story 4.3: Implement `add custom category` Command

-   **User Story / Goal:** As a CLI User, I want an interactive command `roo-init manage add category` to define a new custom category and save it to my global user configuration.
-   **Detailed Requirements:**
    -   Create the `roo-init manage add category` command.
    -   Interactively prompt for: `slug`, `name`, `description` (optional).
    -   Validate `slug` for uniqueness among *other custom categories*.
    -   Save the new category definition to `~/.config/roo-init/user-definitions.json`.
-   **Acceptance Criteria (ACs):**
    -   AC1: User can successfully create a new custom category via interactive prompts.
    -   AC2: The new category is correctly appended to `user-definitions.json`.
    -   AC3: Input validation (e.g., unique custom slug) prevents saving invalid data.
    -   AC4: If `user-definitions.json` doesn't exist, it's created.
-   **Dependencies:** Story 4.1.

---

### Story 4.4: Implement `list custom modes` and `list custom categories` Commands

-   **User Story / Goal:** As a CLI User, I want commands to list my custom modes and categories, and optionally all system definitions too.
-   **Detailed Requirements:**
    -   Create `roo-init manage list modes` and `roo-init manage list categories`.
    -   Support an optional `--source` flag (e.g., `--source=custom` (default), `--source=system`, `--source=all`).
    -   Display key information (slug, name, source, description) in a readable format (e.g., table).
-   **Acceptance Criteria (ACs):**
    -   AC1: `list modes` (no flag) shows only custom modes.
    -   AC2: `list modes --source=system` shows only system modes.
    -   AC3: `list modes --source=all` shows merged list, clearly differentiating system and custom.
    -   AC4: Similar behavior for `list categories`.
    -   AC5: Output is clearly formatted.
-   **Dependencies:** Story 4.1.

---

### Story 4.5: Implement `edit custom mode` Command

-   **User Story / Goal:** As a CLI User, I want an interactive command `roo-init manage edit mode <slug>` to modify an existing custom mode, including its rules and rule content.
-   **Detailed Requirements:**
    -   Create `roo-init manage edit mode <slug>` command.
    -   Load the specified custom mode from `user-definitions.json`. If not found, show error.
    -   For each field, show current value and prompt for new value (or confirm to keep existing).
    -   For `associatedRuleFiles`:
        -   List existing rules for the mode.
        -   Allow adding new rules (same flow as Story 4.2).
        -   Allow editing existing rules (prompt for new metadata, use editor prompt for content).
        -   Allow deleting existing rules (confirm, delete rule file from `~/.config/roo-init/rules/[mode_slug]/`).
    -   The `slug` of a custom mode cannot be edited (users should delete and re-add if a slug change is needed).
    -   Update the mode definition in `user-definitions.json`.
-   **Acceptance Criteria (ACs):**
    -   AC1: User can successfully edit fields of a specified custom mode.
    -   AC2: User can add, edit (content and metadata), and delete associated rule files for the custom mode.
    -   AC3: Changes are correctly saved to `user-definitions.json` and rule files are updated/created/deleted in the file system.
    -   AC4: Attempting to edit a non-existent custom mode slug results in an error.
-   **Dependencies:** Story 4.1, Story 4.2 (for rule editing flow).

---

### Story 4.6: Implement `edit custom category` Command

-   **User Story / Goal:** As a CLI User, I want an interactive command `roo-init manage edit category <slug>` to modify an existing custom category.
-   **Detailed Requirements:**
    -   Create `roo-init manage edit category <slug>` command.
    -   Load the specified custom category. If not found, show error.
    -   Prompt for new values for `name`, `description`.
    -   The `slug` of a custom category cannot be edited.
    -   Update the category definition in `user-definitions.json`.
-   **Acceptance Criteria (ACs):**
    -   AC1: User can successfully edit fields of a specified custom category.
    -   AC2: Changes are correctly saved to `user-definitions.json`.
    -   AC3: Attempting to edit a non-existent custom category slug results in an error.
-   **Dependencies:** Story 4.1, Story 4.3.

---

### Story 4.7: Implement `delete custom mode` Command

-   **User Story / Goal:** As a CLI User, I want a command `roo-init manage delete mode <slug>` to remove a custom mode and its associated rule files.
-   **Detailed Requirements:**
    -   Create `roo-init manage delete mode <slug>` command.
    -   Confirm with the user before deletion.
    -   Remove the mode definition from `user-definitions.json`.
    -   Delete the associated rule files directory (`~/.config/roo-init/rules/[mode_slug]/`).
-   **Acceptance Criteria (ACs):**
    -   AC1: User is prompted for confirmation before deletion.
    -   AC2: Specified custom mode is removed from `user-definitions.json`.
    -   AC3: Associated rule files and directory are deleted from `~/.config/roo-init/rules/`.
    -   AC4: Attempting to delete a non-existent custom mode slug results in an error.
-   **Dependencies:** Story 4.1.

---

### Story 4.8: Implement `delete custom category` Command

-   **User Story / Goal:** As a CLI User, I want a command `roo-init manage delete category <slug>` to remove a custom category.
-   **Detailed Requirements:**
    -   Create `roo-init manage delete category <slug>` command.
    -   Confirm with the user before deletion.
    -   Remove the category definition from `user-definitions.json`.
    -   **Consideration:** What happens to custom modes that reference this category?
        -   Option A (Simpler MVP): Remove the category slug from `categorySlugs` array of any custom modes that reference it.
        -   Option B (More Complex): Prevent deletion if modes reference it, or prompt user for action. (Let's go with Option A for MVP).
-   **Acceptance Criteria (ACs):**
    -   AC1: User is prompted for confirmation before deletion.
    -   AC2: Specified custom category is removed from `user-definitions.json`.
    -   AC3: The deleted category's slug is removed from `categorySlugs` array in all custom modes.
    -   AC4: Attempting to delete a non-existent custom category slug results in an error.
-   **Dependencies:** Story 4.1.

---

## Change Log

| Change        | Date       | Version | Description                                     | Author         |
|---------------|------------|---------|-------------------------------------------------|----------------|
| Initial Draft | 2025-05-14 | 0.1.0   | First draft of Epic 4 for custom mode/cat mgmt. | Product Manager |