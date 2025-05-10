# Roo-Init CLI: Technical Architecture (V1 Scope)

This document outlines the technical architecture for the V1 (initial version) of the `roo-init` Node.js CLI tool.
The V1 tool allows users to initialize projects by selecting modes from any available workflow (cross-workflow selection), leveraging a mode categorization system, and copying associated mode definitions and basic rules. It features enhanced configuration loading and a backup/rollback mechanism for file operations.

**Deferred Features for V1**: Workflow CRUD (Create, Read, Update, Delete of workflow definitions via CLI), a full Plugin Architecture, advanced Rules Engine capabilities (transformation, merging, complex validation), explicit Mode Dependencies resolution, and dynamic mode parameter configuration during initialization. These will be considered for future iterations.

## 1. Overall System Architecture

The `roo-init` CLI (V1) will be a modular Node.js application. The major components and their interactions are illustrated below:

```mermaid
graph TD
    A[User (CLI)] --> B(CLI Command Parser);
    B --> C{Command Dispatcher};
    C -- init --> G[Project Initializer];
    C -- list/show commands --> D[Workflow Manager];
    C -- list/show commands --> E[Mode Manager];
    C -- list/show commands --> K[Category Sub-System];

    G -- Uses --> D;
    G -- Uses --> E;
    G -- Uses --> F[Rules Manager];
    G -- Uses --> I[File System Handler];
    G -- Uses --> L[Backup & Rollback Service];


    D --- H(Configuration Loader);
    E --- H;
    F --- H;
    K --- H;

    H -- All Workflow Definitions --> D;
    H -- All Mode Definitions & Categories --> E;
    H -- All Category Definitions --> K;
    H -- Rule Locations (via Workflow Defs) --> F;

    D -- Selected Primary Workflow (optional) --> G;
    E -- Selected Modes (from any workflow) & Categories --> G;
    F -- Rules for Selected Modes --> G;

    I -- Writes to --> J[Target Project];
    L -- Manages backups for --> J;

    E -- Uses --> K;

    subgraph Core Logic
        D[Workflow Manager];
        E[Mode Manager];
        F[Rules Manager];
        G[Project Initializer];
        K[Category Sub-System];
        L[Backup & Rollback Service];
    end

    subgraph Infrastructure
        B[CLI Command Parser];
        H[Configuration Loader];
        I[File System Handler];
    end

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style J fill:#ccf,stroke:#333,stroke-width:2px
```

**Component Descriptions (V1 Scope):**

*   **User (CLI)**: The developer interacting with the `roo-init` tool.
*   **CLI Command Parser**: (e.g., `Commander.js`) Parses command-line arguments and options.
*   **Command Dispatcher**: Routes parsed commands to appropriate handlers (Project Initializer for `init`, or specific managers for `list/show` commands).
*   **Workflow Manager**:
    *   Provides a list of all available workflows discovered by `Configuration Loader`.
    *   Retrieves details for a specific workflow.
    *   Facilitates optional selection of a "primary" workflow to influence default core/recommended modes.
*   **Mode Manager**:
    *   Provides a consolidated list of all available modes from *all* workflows, including their `originWorkflow`.
    *   Integrates with `Category Sub-System` for organizing, filtering, and displaying modes.
    *   Manages user selection of modes (individual, by category), considering `originWorkflow` for rule retrieval.
    *   Handles pre-selection of core/recommended modes based on an optionally selected primary workflow.
*   **Category Sub-System**: Manages mode categories as defined in `specs/12_mode_categorization.md` and loaded by `Configuration Loader`.
*   **Rules Manager (V1 - Basic Copying)**:
    *   Identifies rule files for selected modes, considering each mode's `originWorkflow` and its associated `rulesPath`.
    *   Determines source and destination paths for direct copying of generic and mode-specific rules.
    *   (Advanced engine features like transformation, merging, validation are deferred).
*   **Project Initializer**:
    *   Orchestrates the project initialization: workflow/mode selection, rule identification.
    *   Coordinates with `Backup & Rollback Service` before file operations.
    *   Instructs `FileSystemHandler` for file/directory creation and copying.
    *   Handles rollback on failure.
*   **Configuration Loader**:
    *   Loads configurations (workflows, modes, categories) from multiple prioritized sources: project-local files (`./roo-init.config.js`, `./roo-init.config.json`), user home directory (`~/.config/roo-init/`), and bundled defaults.
    *   Supports `.js` and `.json` configuration files.
    *   Discovers workflows from a specified `workflowsPath` by scanning directory structures.
    *   Overrides configurations with environment variables (e.g., `ROO_INIT_WORKFLOWS_PATH`).
    *   Resolves relative paths in configurations to absolute paths.
    *   Validates loaded configurations.
*   **File System Handler**: (e.g., using `fs-extra`) Performs all file/directory operations (read, write, copy, create dir, check existence).
*   **Backup & Rollback Service**:
    *   Provides functions to create backups of target project files/directories (e.g., `.roomodes`, `.roo/`) before `Project Initializer` makes changes.
    *   Provides functions to restore from backup if an operation fails.
*   **Target Project**: The user's project directory.

This V1 architecture focuses on core initialization with enhanced flexibility in configuration and mode selection, plus safety via backup/rollback.

## 2. Data Structures & Persistence (V1 Scope)

This section details how workflows, modes, categories, and rules configurations are structured, stored, and accessed by the CLI for V1.

### 2.1. Configuration File Strategy & Loading Order
The `Configuration Loader` will search for configuration files in the following order, with later files overriding or merging with earlier ones where appropriate:
1.  **Bundled Defaults**: Shipped with the CLI (`roo-init/config/default.config.json`).
2.  **User Global Configuration**:
    *   `~/.config/roo-init/config.js`
    *   `~/.config/roo-init/config.json`
3.  **Project Local Configuration**:
    *   `./roo-init.config.js` (in the directory where CLI is run)
    *   `./roo-init.config.json`
4.  **Environment Variables**: Override specific settings (e.g., `ROO_INIT_WORKFLOWS_PATH`, `ROO_INIT_DEFAULT_WORKFLOW`).
5.  **Discovered Workflows**: Workflows found in the `workflowsPath` (if specified) are added if not already defined.

The final configuration is an in-memory merge of these sources.

### 2.2. Workflow Definitions
Workflows can be defined within the configuration files or discovered in a `workflowsPath`. Each workflow definition includes:

*   `id`: Unique string identifier (e.g., "sparc", "bmad").
*   `name`: Human-readable name (e.g., "SPARC Development Workflow").
*   `description`: Brief description of the workflow.
*   `sourcePath`: String - Base path where the workflow's assets (modes definition file, rules directory) are located. This path is resolved to an absolute path.
*   `modesPath`: String (Optional) - Path to the JSON file defining modes for this workflow, relative to `sourcePath`. Defaults to `./.roomodes` or `./modes.json` within `sourcePath`.
*   `rulesPath`: String (Optional) - Path to the directory containing rule templates for this workflow, relative to `sourcePath`. Defaults to `./.roo` within `sourcePath`.
*   `coreModes`: Array<String> (Optional) - List of mode slugs considered core for this workflow.
*   `recommendedModes`: Array<String> (Optional) - List of mode slugs recommended for this workflow.

**Example (Conceptual, part of a larger config file):**
```json
// In a roo-init.config.json or similar
{
  "workflowsPath": "./workflow_definitions", // Path for discovery
  "defaultWorkflow": "sparc",
  "workflows": {
    "sparc": {
      "name": "SPARC Workflow",
      "description": "Standard SPARC workflow.",
      "sourcePath": "./node_modules/@sparc/workflow-sparc", // Could be a dependency
      // modesPath might default to ./node_modules/@sparc/workflow-sparc/.roomodes
      // rulesPath might default to ./node_modules/@sparc/workflow-sparc/.roo
      "coreModes": ["spec-writer", "architect"],
      "recommendedModes": ["auto-coder", "tdd"]
    }
    // ... other explicitly defined workflows
  }
}
```

### 2.3. Mode Definitions
Mode definitions are typically stored in JSON files (e.g., `.roomodes` or `modes.json`) located via a workflow's resolved `modesPath`. Each mode object:

*   `slug`: Unique string identifier for the mode (e.g., "auto-coder").
*   `name`: Human-readable name (e.g., "🧠 Auto-Coder").
*   `roleDefinition`: String - Description of the mode's role.
*   `customInstructions`: String (Optional) - Custom instructions for the mode.
*   `groups`: Array<String|Object> (Optional) - Permissions and capabilities.
*   `source`: String (Optional) - Typically "project".
*   `categories`: Array<String> (Optional) - IDs of categories this mode belongs to. Defaults to `["uncategorized"]`.
*   `primaryCategory`: String (Optional) - The main category ID for this mode.
*   `originWorkflow`: String - **Added by `ConfigurationLoader`** after loading, indicating the `id` of the workflow this mode definition was loaded from. Essential for cross-workflow operations.
*   `dependencies`: Array<String> (Optional, **Deferred for V1**) - List of mode slugs this mode depends on.

The `ConfigurationLoader` aggregates all loaded modes from all workflows into a global registry, accessible by the `ModeManager`.

### 2.4. Category Definitions & Persistence
As defined in Section 2.4 previously, managed via `config/categories.json` (bundled) and `~/.config/roo-init/custom_categories.json` (user overrides). The `ConfigurationLoader` handles loading and merging these.

### 2.5. Rule Definitions & Storage
Rules are Markdown files (`.md`). Their source location is determined by a mode's `originWorkflow` and that workflow's resolved `rulesPath`.
The expected structure within a workflow's `rulesPath` (e.g., `<workflow.sourcePath>/.roo/`):

*   **Generic Workflow Rules**: `./rules/*.md` (relative to `workflow.rulesPath`)
*   **Mode-Specific Rules**: `./rules-[mode_slug]/*.md` (relative to `workflow.rulesPath`)

The `Rules Manager` uses `mode.originWorkflow` to find the correct `workflow.rulesPath` for each selected mode.

### 2.6. Data Access and In-Memory Representation
The `Configuration Loader` is central to data access. It:
1.  Loads and merges all configuration sources (files, env vars).
2.  Discovers and loads workflows from `workflowsPath`.
3.  For each workflow, loads its modes from its `modesPath`, stamping them with `originWorkflow`.
4.  Loads and merges category definitions.
5.  Provides access to:
    *   A list of all `Workflow` definitions.
    *   A global registry of all `Mode` definitions (each tagged with `originWorkflow`).
    *   All `Category` definitions and their hierarchy.

This in-memory representation is then used by other modules.

## 3. Module Design (V1 Scope)

This section details V1 responsibilities and key interfaces.

### 3.1. CLI Command Parser (`Commander.js`)
*   **Responsibilities**: Same as before. Define commands (`init`, `list`, `show`), arguments, options.
*   **Key Interface (Output)**: Same as before.

### 3.2. Command Dispatcher
*   **Responsibilities**: Same as before. Routes to `ProjectInitializer` for `init`, or to `WorkflowManager`/`ModeManager`/`CategorySubsystem` for `list`/`show` commands.
*   **Key Interface**: Same as before.

### 3.3. Configuration Loader (`src/core/configLoader.ts`)
*   **Responsibilities (Enhanced for V1)**:
    *   Load configurations from multiple prioritized sources (bundled, user global, project local, env vars) as per Section 2.1.
    *   Support `.js` (as modules) and `.json` configuration files.
    *   Discover workflows by scanning directories in a configured `workflowsPath`.
    *   For each loaded/discovered workflow, load its modes from its `modesPath`, adding an `originWorkflow` property to each mode.
    *   Load and merge bundled and user-specific category definitions.
    *   Resolve relative paths in all loaded configurations (e.g., `sourcePath`, `modesPath`, `rulesPath`) to absolute paths.
    *   Validate the integrity and completeness of loaded configurations (e.g., required fields, path existence).
    *   Provide access to the fully resolved and merged configuration data (all workflows, all modes with `originWorkflow`, all categories).
*   **Key Interfaces (Methods - illustrative)**:
    *   `getFullConfiguration(): Promise<AppConfig>` (where `AppConfig` holds all workflows, all modes, all categories, global settings).
    *   Internally uses helpers for `loadSingleConfigFile`, `mergeConfigs`, `discoverWorkflowsInPath`, `resolveConfigPaths`, `applyEnvOverrides`, `validateLoadedConfig`.

### 3.4. Workflow Manager (`src/core/workflowManager.ts`)
*   **Depends on**: `ConfigurationLoader`
*   **Responsibilities (V1)**:
    *   Provide a list of all available `Workflow` definitions (obtained from `ConfigurationLoader`).
    *   Retrieve detailed information for a specific workflow by ID.
    *   (For `init` command) Facilitate user selection of an *optional* primary workflow, which can influence default core/recommended mode suggestions.
*   **Key Interfaces (Methods)**:
    *   `getAvailableWorkflows(): Promise<WorkflowDefinition[]>`
    *   `getWorkflowById(id: string): Promise<WorkflowDefinition | null>`
    *   `selectPrimaryWorkflow(promptService: PromptService): Promise<WorkflowDefinition | null>` (interactive, allows skipping)

### 3.5. Mode Manager (`src/core/modeManager.ts`)
*   **Depends on**: `ConfigurationLoader`, `CategorySubsystem`
*   **Responsibilities (V1 - with Cross-Workflow)**:
    *   Access the global registry of all modes (each with `originWorkflow`) from `ConfigurationLoader`.
    *   Integrate with `CategorySubsystem` for displaying/filtering modes by category.
    *   Manage user selection of modes from the *entire pool* of available modes, across all workflows.
    *   If a primary workflow was selected, use its `coreModes` and `recommendedModes` for pre-selection/recommendation in the UI.
    *   Handle potential mode slug conflicts (e.g., if `mode-x` exists in `workflow-a` and `workflow-b`). For V1, this might involve prompting the user or using a simple preference (e.g., from the primary workflow if set).
    *   Validate selected modes. (Mode dependency resolution is deferred for V1).
*   **Key Interfaces (Methods)**:
    *   `getAllModes(): Promise<ModeDefinition[]>` (all modes from all workflows)
    *   `getModesByCategory(categoryId: string): Promise<ModeDefinition[]>`
    *   `displayModesForSelection(primaryWorkflowId: string | null, promptService: PromptService): Promise<ModeDefinition[]>` (interactive, shows all modes, highlights based on primaryWorkflow)
    *   `resolveSelectedModes(cliArgs: ParsedArgs, primaryWorkflowId: string | null): Promise<ModeDefinition[]>`

### 3.6. Category Sub-System (`src/core/categorySystem.ts`)
*   **Depends on**: `ConfigurationLoader`
*   **Responsibilities**: Same as before (load, build hierarchy, provide access to categories).
*   **Key Interfaces**: Same as before.

### 3.7. Rules Manager (V1 - Basic) (`src/core/rulesManager.ts`)
*   **Depends on**: `ConfigurationLoader` (to get workflow definitions for `rulesPath`)
*   **Responsibilities (V1)**:
    *   For each selected mode, identify its `originWorkflow`.
    *   Using the `originWorkflow`'s resolved `rulesPath`, determine the source paths for generic rules of that workflow and specific rules for that mode.
    *   Provide a list of `{sourcePath, destinationPath}` pairs for the `FileSystemHandler`.
    *   (No rule transformation, merging, or complex validation in V1).
*   **Key Interfaces (Methods)**:
    *   `getRulesForInitialization(selectedModes: ModeDefinition[], allWorkflowConfigs: WorkflowConfigMap): Promise<Array<{sourcePath: string, destinationPath: string}>>`
        *   `WorkflowConfigMap` would be `{[workflowId: string]: WorkflowDefinition}`.

### 3.8. Project Initializer (`src/commands/init.ts` or `src/core/projectInitializer.ts`)
*   **Depends on**: `WorkflowManager`, `ModeManager`, `RulesManager`, `FileSystemHandler`, `BackupService`, `PromptService`
*   **Responsibilities (V1)**:
    *   Orchestrate `init` command:
        1.  Optionally select a primary workflow.
        2.  Select modes (cross-workflow, using categories).
        3.  Confirm target directory.
        4.  **Invoke `BackupService` to backup existing relevant files/dirs in target.**
        5.  If backup successful:
            *   Invoke `RulesManager` to get rule file mappings.
            *   Invoke `FileSystemHandler` to create `.roomodes` and copy all rule files.
        6.  If any file operation fails, **invoke `BackupService` to rollback changes.**
        7.  Provide user feedback (using `LoggerService` and `PromptService`).
*   **Key Interfaces (Methods)**:
    *   `initProject(cliArgs: ParsedArgs, targetDirectory: string): Promise<void>`

### 3.9. File System Handler (`src/services/fileSystemHandler.ts`)
*   **Responsibilities**: Same as before (abstracts `fs-extra` or `fs/promises`).
*   **Key Interfaces**: Same as before. `copyDirectory` will be important for rules and backups.

### 3.10. Backup & Rollback Service (`src/services/backupService.ts`)
*   **New Module for V1**
*   **Depends on**: `FileSystemHandler`
*   **Responsibilities**:
    *   Create a temporary backup of specified files/directories (e.g., existing `.roomodes`, `.roo/`) before modification.
    *   Restore files/directories from the backup if a rollback is triggered.
    *   Clean up backups after successful completion.
*   **Key Interfaces (Methods)**:
    *   `createBackup(targetItems: Array<{path: string, type: 'file'|'dir'}>, backupLocation?: string): Promise<string | null>` (returns backup ID/path or null)
    *   `rollbackFromBackup(backupId: string, targetItems: Array<{path: string, type: 'file'|'dir'}>): Promise<void>`
    *   `cleanupBackup(backupId: string): Promise<void>`

## 4. CLI Command Structure & UI/UX Flow (V1 Scope)

This section details the V1 command structure and outlines the user interaction flow, emphasizing a polished and intuitive experience, especially for interactive mode selection.

### 4.1. Main Command: `roo-init` (`Commander.js`)

The primary command, potentially introduced with a `Figlet` and `gradient-string` banner.

#### 4.1.1. `roo-init init [targetDirectory] [options]`
The core command to initialize a project.

*   **`targetDirectory`** (Optional): Path to the project directory. Defaults to current directory.
*   **Options**:
    *   `-w, --workflow <workflowId>`: Specify an *optional* primary workflow ID. This influences default core/recommended modes but doesn't restrict selection to this workflow.
    *   `-m, --modes <modeSlug1,modeSlug2,...>`: Comma-separated list of mode slugs to include from *any* workflow. If a slug is ambiguous, the CLI might prompt or use a defined resolution strategy (e.g., prefer primary workflow version).
    *   `-c, --category <categoryId1,categoryId2,...>`: Comma-separated list of category IDs. All modes belonging to these categories (across all workflows) will be included. Can be combined with `--modes`.
    *   `--all-in-category <categoryId>`: Selects all modes exclusively from the specified category ID (across all workflows).
    *   `--include-core-modes <boolean>`: (Default: `true`) Whether to pre-select core modes of the *primary* workflow (if one is chosen).
    *   `--include-recommended-modes <boolean>`: (Default: `true`) Whether to pre-select recommended modes of the *primary* workflow.
    *   `-y, --yes`: Skip all interactive prompts and proceed with defaults or provided options. Requires sufficient information to proceed (e.g., modes explicitly listed if no primary workflow with core modes is chosen).
    *   `--no-rules`: Initialize with selected modes but skip copying any rule files.
    *   `--force`: Overwrite existing `.roomodes` or rule files if present, after user confirmation (unless `-y` is also present).
    *   `--no-backup`: Skip the backup step before file operations (use with caution).

**Example Usage (V1):**
```bash
# Interactive initialization in current directory (full interactive experience)
roo-init init

# Initialize in './new-project', hinting SPARC as primary for defaults, but open to all modes
roo-init init ./new-project -w sparc

# Initialize with specific modes 'auto-coder' (from sparc) and 'data-viz' (from bmad)
roo-init init -m sparc/auto-coder,bmad/data-viz # Potential syntax for disambiguation
# OR: roo-init init -m auto-coder,data-viz (CLI prompts if 'auto-coder' is in multiple workflows)

# Initialize with all modes in 'code' category (from all workflows)
roo-init init --all-in-category code

# Non-interactive: SPARC as primary, its core modes, plus 'security-reviewer' from any workflow
roo-init init -w sparc -m security-reviewer -y
```

#### 4.1.2. `roo-init list workflows`
Lists all available workflows discovered by the `ConfigurationLoader`.
*   **Output**: Uses `cli-table3` to display ID, Name, Description, and Source Path for each workflow. Styled with `Chalk`.

#### 4.1.3. `roo-init show workflow <workflowId>`
Shows detailed information about a specific workflow.
*   **Output**:
    *   Workflow details (Name, Description, Source Path, Modes Path, Rules Path).
    *   Lists Core Modes and Recommended Modes using `Chalk`.
    *   Lists All Modes belonging to this workflow, grouped by category (using `CategorySubsystem` and displayed with `cli-table3` or nested lists).

#### 4.1.4. `roo-init list modes [options]`
Lists available modes across all workflows.
*   **Options**:
    *   `--by-category`: Group the listed modes by category.
    *   `-c, --category <categoryId>`: List only modes belonging to the specified category.
    *   `-w, --workflow <workflowId>`: List only modes originating from the specified workflow.
    *   `--search <term>`: Fuzzy search modes by slug or name.
*   **Output**: Uses `cli-table3` (Name, Slug, Primary Category, Origin Workflow(s), Description snippet). `Chalk` for styling.

#### 4.1.5. `roo-init show mode <modeSlug> [options]`
Shows detailed information about a specific mode.
*   **Options**:
    *   `-w, --workflow <originWorkflowId>`: Specify the origin workflow if the slug is ambiguous.
*   **Output**: Detailed mode information (Name, Slug, Role Definition, Custom Instructions, Categories, Origin Workflow(s)) presented clearly, perhaps using `Boxen` for sections.

#### 4.1.6. `roo-init list categories`
Lists all defined categories.
*   **Output**: Hierarchical list (using indentation and `Chalk`) showing parent-child relationships, icons, names, and descriptions.

#### 4.1.7. `roo-init show category <categoryId>`
Shows details for a specific category.
*   **Output**: Category Name, Icon, Description, Parent Category, Child Categories, and a list of modes belonging to this category (Name, Slug, Origin Workflow).

### 4.2. Detailed UI/UX Flow (Interactive `roo-init init`)

If `roo-init init` is run without sufficient non-interactive arguments (or `-y`), it enters a polished interactive mode:

1.  **Welcome & Optional Primary Workflow Selection**:
    *   Display a welcome message (e.g., `Figlet` + `gradient-string` for "Roo-Init").
    *   Use `Enquirer` (`select` prompt) to ask: "Would you like to select a primary workflow to guide mode suggestions? (You can still pick any mode later) [Y/n]".
    *   If yes:
        *   Display available workflows (Name, Description) using an `Enquirer` `autocomplete` or `select` prompt with fuzzy search.
        *   User selects a primary workflow, or can skip.

2.  **Mode Selection (Cross-Workflow with Categories & Search)**:
    *   A rich, multi-step or single complex prompt using `Enquirer`'s capabilities.
    *   **Display Area**:
        *   Modes are listed, grouped by `Category` (hierarchically if subcategories exist). Category names styled with `Chalk` and icons.
        *   Each mode shows: `[checkbox] Mode Name (mode-slug) - OriginWorkflow` (e.g., `[ ] 🧠 Auto-Coder (auto-coder) - SPARC`).
        *   Core/Recommended modes (if a primary workflow was chosen) are pre-selected and highlighted (e.g., `Chalk.green('[CORE]')`).
        *   A search bar (inherent in `Enquirer` `autocomplete` or `multiselect` prompts) allows filtering modes by name/slug.
        *   Option to filter by one or more categories (e.g., a preceding `multiselect` for categories, then modes within those).
    *   **Selection Mechanism**:
        *   `Enquirer` `multiselect` or a custom flow combining `autocomplete` for searching/filtering and then selection.
        *   Users can toggle individual modes.
        *   Users can potentially select/deselect all modes in a displayed category.
    *   **Information Display**:
        *   As modes are highlighted or selected, a side panel or footer (if using more advanced TUI elements, though `Enquirer` might be simpler) could show the `roleDefinition` for the currently focused mode. `Boxen` could frame this.

3.  **Target Directory Confirmation**:
    *   `Enquirer` `input` prompt for the target directory (defaulting to current).
    *   Confirm overwrite using `Enquirer` `confirm` prompt if the directory or relevant config files (`.roomodes`, `.roo/`) already exist (unless `--force` is used). Styled with `Chalk.yellow` for warning.

4.  **Summary & Confirmation**:
    *   Display a summary using `cli-table3` and `Boxen`:
        *   Box: "Project Initialization Summary"
        *   Primary Workflow (if selected).
        *   Selected Modes: Table with columns (Mode Name, Slug, Origin Workflow, Categories).
        *   Target Directory.
        *   Indicator if rules will be copied.
        *   Indicator if backup will be performed.
    *   `Enquirer` `confirm` prompt: "Proceed with initialization? [Y/n]".

5.  **Initialization & Progress**:
    *   Use `Ora` or `Listr2` for progress indication:
        *   `Listr2` is preferred if steps are numerous (e.g., "Backing up existing files...", "Creating .roomodes...", "Copying rules for 'auto-coder'...", "Copying generic SPARC rules...").
        *   Each task in `Listr2` can show success (✓) or failure (✗) with `Chalk` styling.
    *   If backup/rollback occurs, messages are styled appropriately (e.g., `Chalk.yellow` for backup, `Chalk.red` for rollback).

6.  **Completion Message**:
    *   "🎉 Initialization Complete!" (using `gradient-string` or `Chalk.green.bold`).
    *   A `Boxen` message summarizing what was done and next steps (e.g., "Navigate to your project: `cd ./my-project`").

### 4.3. Non-Interactive Flow
If sufficient arguments are provided (e.g., `-m mode1,mode2` and `-y`), the CLI skips interactive prompts.
*   Uses `Ora` for simple progress spinner for the entire operation.
*   Logs actions, warnings, and errors using `Chalk` via the `LoggerService` (to be defined in `src/services/logger.ts` or `src/utils/logger.ts`).

This detailed UI/UX plan aims for a professional, user-friendly CLI experience, leveraging common and effective Node.js CLI libraries.

## 5. Extensibility Points (V1 Scope)

The V1 architecture supports extensibility primarily through its configuration-driven design.

### 5.1. Adding New Workflows
New workflows can be added by:
1.  **Defining Workflow Assets**:
    *   Create a directory for the workflow (e.g., `my-custom-workflow/`).
    *   Inside, create a modes definition file (e.g., `.roomodes` or `modes.json`) listing its modes. Each mode should specify its `slug`, `name`, `roleDefinition`, and `categories`.
    *   Create a `.roo/` subdirectory for rules, with `./rules/` for generic rules and `./rules-[mode_slug]/` for mode-specific rules.
2.  **Configuration**:
    *   **Discovery**: Place the workflow directory in a path specified by `workflowsPath` in a `roo-init.config.js` or `.json` file, or via the `ROO_INIT_WORKFLOWS_PATH` environment variable. The `ConfigLoader` will discover it.
    *   **Explicit Definition**: Alternatively, explicitly define the workflow in a `roo-init.config.js` or `.json` file, providing its `id`, `name`, `description`, and `sourcePath` (pointing to the workflow's asset directory). `modesPath` and `rulesPath` can be specified if they deviate from defaults within `sourcePath`.

### 5.2. Adding New Modes to an Existing Workflow
1.  **Edit Modes File**: Add the new mode object to the workflow's modes definition file (e.g., `<workflow.sourcePath>/.roomodes`). Include `slug`, `name`, `categories`, etc. The `originWorkflow` will be implicitly the workflow it's defined in.
2.  **Add Rules**: If the mode has specific rules, create a `rules-[new_mode_slug]/` directory within the workflow's rules path (e.g., `<workflow.sourcePath>/.roo/rules-[new_mode_slug]/`) and add the rule files.

### 5.3. Managing Mode Categories
1.  **Adding Bundled Categories**: CLI maintainers can add to the `config/default.config.json` (or a dedicated `categories.json` loaded by default config).
2.  **User-Defined Categories**: Users can add/override categories via their `~/.config/roo-init/config.json` or a project-local `roo-init.config.json`. These are merged by the `ConfigLoader`.
    *   The `categories` array in these config files allows defining new categories or overriding attributes (name, description, icon, parentId) of existing ones by using the same `id`.
3.  **Associating Modes**: Modes are associated by listing category `id`s in their `categories` array within their definition file.

(Workflow CRUD commands and a Plugin Architecture are deferred for V1 but are future extensibility directions).

## 6. Technology Stack Choices (V1 Rationale)

The V1 technology stack recommendations are updated for a polished UI/UX:

*   **Core Language**: **Node.js** (LTS) - Unchanged.
*   **CLI Argument Parsing**: **`Commander.js`** - Recommended for V1 due to its widespread use and sufficient capabilities for the defined command structure.
*   **Interactive User Prompts**: **`Enquirer`**
    *   **Rationale**: Chosen over `Inquirer.js` for V1 due to its speed, better customizability, built-in fuzzy search for `autocomplete` and `multiselect` prompts, which will significantly enhance the mode selection experience.
*   **File System Operations**: **`fs-extra`** - Recommended for its convenience methods.
*   **Output Styling & Aesthetics**:
    *   **`chalk`**: For basic text coloring and styling.
    *   **`gradient-string`**: For visually appealing banners/headers.
    *   **`figlet`**: For ASCII art text banners (e.g., "Roo-Init" welcome message).
    *   **`boxen`**: For drawing boxes around important messages, summaries, or warnings.
*   **Spinners & Progress Indicators**:
    *   **`ora`**: For simple, single-task spinners (e.g., during non-interactive init).
    *   **`listr2`**: For multi-step progress indication during interactive initialization (e.g., "Backup", "Copying modes", "Copying rules for X").
*   **Tables & Layouts**:
    *   **`cli-table3`**: For displaying tabular data like workflow lists, mode lists, and summaries.
*   **Development Language**: **TypeScript** - Unchanged.
*   **Linting/Formatting**: **ESLint** & **Prettier** - Unchanged.
*   **Testing Framework**: **Vitest** or **Jest** - `Vitest` is slightly preferred for modern projects if starting fresh, but `Jest` is equally capable.
*   **Path Manipulation**: Node.js built-in `path` module - Unchanged.

These choices aim to deliver a highly interactive and visually appealing CLI experience for V1.

## 7. Directory Structure for the CLI Project (`roo-init`) (V1)

The directory structure is largely the same, with minor adjustments for clarity and service naming:

```
roo-init/
├── bin/
│   └── roo-init.js
├── config/                   # Bundled default configurations
│   ├── default.config.json   # Contains default workflows, categories, global settings
│   └── assets/               # Default workflow assets if not pulled from elsewhere
│       └── workflows/
│           └── sparc/        # Example bundled SPARC workflow assets
│               ├── .roomodes # Modes for SPARC
│               └── .roo/     # Rules for SPARC
│                   ├── rules/
│                   └── rules-architect/
├── docs/
│   └── roo-init_architecture.md
├── src/
│   ├── index.ts              # Main entry point
│   ├── cli.ts                # Commander.js setup, command definitions, dispatching
│   ├── commands/             # Command handlers (e.g., initCommand.ts, listCommand.ts)
│   │   ├── initCommand.ts
│   │   └── ...
│   ├── core/                 # Core logic modules
│   │   ├── configLoader.ts
│   │   ├── workflowManager.ts
│   │   ├── modeManager.ts
│   │   ├── categorySystem.ts
│   │   ├── rulesManager.ts   # V1: Basic rule mapping
│   │   └── projectInitializer.ts
│   ├── services/             # Reusable services
│   │   ├── fileSystem.service.ts
│   │   ├── prompt.service.ts   # Wrapper for Enquirer
│   │   ├── logger.service.ts   # Wrapper for Chalk, Ora, Listr2, Boxen etc.
│   │   └── backup.service.ts
│   ├── types/                # TypeScript type definitions
│   │   ├── index.ts
│   │   ├── config.types.ts
│   │   ├── workflow.types.ts
│   │   ├── mode.types.ts
│   │   └── category.types.ts
│   └── utils/                # General utility functions
│       └── pathUtils.ts
│       └── stringUtils.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│       ├── configs/
│       └── mock-projects/
├── .eslintignore
├── .eslintrc.js
├── .gitignore
├── .prettierrc.js
├── package.json
├── README.md
└── tsconfig.json
```
The `config/assets/workflows/` directory is conceptual for fully bundled workflow examples; workflows might also be defined by pointing `sourcePath` to `node_modules` or other discoverable locations.

## 8. Integration Plan for Mode Categorization (V1 - with Cross-Workflow)

Mode categorization remains central, now applied to a global pool of modes.

1.  **Data Structures**:
    *   `ModeDefinition` in `src/types/mode.types.ts` includes `categories: string[]`, `primaryCategory: string`, and the crucial `originWorkflow: string`.
2.  **Configuration Loading (`ConfigLoader`)**:
    *   Loads all modes from all defined/discovered workflows, stamping each with its `originWorkflow`.
    *   Loads and merges all category definitions.
3.  **Category Sub-System (`CategorySystem`)**:
    *   Manages the complete set of categories.
4.  **Mode Manager (`ModeManager`) Integration**:
    *   Works with the *global list* of modes from `ConfigLoader`.
    *   Uses `CategorySystem` to group/filter this global list for display.
    *   `displayModesForSelection` (in `PromptService` or `ModeManager`) will present modes, indicating their `originWorkflow` and category, allowing multi-selection across all workflows.
    *   CLI options like `--category` or `--all-in-category` will filter across the global mode pool.
5.  **CLI Commands & UI/UX**:
    *   `roo-init list modes --by-category` will show all modes from all workflows, grouped by category.
    *   The interactive `init` flow (Section 4.2) is key, allowing users to navigate and select modes from a comprehensive, categorized, and searchable list, with clear indication of each mode's origin.

## 9. Addressing "Next Steps for Architect" (V1 Scope)

*   **Technical Architecture for Categories**: Covered; integrated with cross-workflow mode management.
*   **Persistence for Categories**: Covered; via merged configuration files.
*   **Integration with Mode Management**: Covered; `ModeManager` uses `CategorySystem` on a global mode list.
*   **UI/CLI for Categories**: Covered; commands and interactive flows support category-based listing and selection across all modes.
*   **Component Boundaries**: Defined for V1 scope, including `BackupService`.
*   **Testing Strategy Considerations**: Updated in Section 10 to reflect V1 features.

## 10. High-Level Testing Strategy Considerations (V1 Scope)

1.  **Unit Tests**:
    *   `ConfigLoader`: Test loading from various paths, env var overrides, workflow discovery, merging logic, path resolution, and correct stamping of `originWorkflow` on modes.
    *   `ModeManager`: Test handling of global mode list, category filtering on global list, pre-selection logic with primary workflow, conflict resolution (if any basic strategy is in V1).
    *   `BackupService`: Test backup creation, restoration, and cleanup logic.
    *   Other modules as previously defined, focusing on V1 responsibilities.
2.  **Integration Tests**:
    *   Test `ProjectInitializer`'s complete flow: primary workflow selection (optional) -> cross-workflow mode selection -> backup -> file operations -> (mocked) rollback.
    *   Test interaction between `ConfigLoader` producing the global mode list and `ModeManager` consuming it.
3.  **End-to-End (E2E) Tests / CLI Tests**:
    *   Scenarios for `roo-init init`:
        *   No primary workflow, select modes from multiple discovered/defined workflows.
        *   With a primary workflow, check pre-selection and ability to add modes from other workflows.
        *   Using `--category` to pull modes from various origins.
        *   Test `--force` and `--no-backup` flags.
        *   Simulate failures during file copy to test rollback.
    *   Verify `list` and `show` commands correctly display cross-workflow information and categories.

This V1-focused testing strategy ensures the core features, including the more complex cross-workflow selection and backup/rollback, are well-tested.