# 6 · Components Reference

This document details the main internal components (modules and services) of the Roo Init CLI, their responsibilities, and their interactions. This is primarily for developers contributing to or extending the CLI.

## Core Services (`src/core/`)

These services encapsulate the primary business logic of the CLI and are designed to be injectable for better testability and modularity.

### 1. `DefinitionLoader.ts`

-   **Responsibility:**
    -   Locating, reading, parsing, and validating the bundled mode, category, and rule definition files.
    -   Loads data from [`definitions/modes.json`](../definitions/modes.json), [`definitions/categories.json`](../definitions/categories.json), and rule markdown files within [`definitions/rules/`](../definitions/rules/).
    -   Provides access to the loaded and validated definitions for other services.
-   **Key Methods (Conceptual):**
    -   `loadModes(): Promise<ModeDefinition[]>`
    -   `loadCategories(): Promise<CategoryDefinition[]>`
    -   `getRuleContent(ruleSlug: string, modeSlug?: string): Promise<string>`
    -   `getModeBySlug(slug: string): ModeDefinition | undefined`
    -   `getCategoryBySlug(slug: string): CategoryDefinition | undefined`
-   **Dependencies:**
    -   Node.js `fs` module (or `fs-extra`) for file system access.
    -   Path resolution utilities.
-   **Used By:**
    -   [`ModeSelector.ts`](#2-modeselectorts) (to get available modes/categories for selection)
    -   [`FileManager.ts`](#3-filemanagerts) (to get paths to rule files for copying)
    -   [`InitCommand`](#initcommand-srccommandsinitts) (indirectly via other services)

### 2. `ModeSelector.ts`

-   **Responsibility:**
    -   Encapsulates the logic for selecting modes, either interactively or non-interactively.
    -   In interactive mode, uses the `UiManager` to present prompts for category and mode selection.
    -   In non-interactive mode, validates mode/category slugs provided via command-line arguments.
    -   Resolves the final list of `ModeDefinition` objects to be applied to the project.
-   **Key Methods (Conceptual):**
    -   `selectModes(cliArgs: { modes?: string[], category?: string[] }): Promise<ModeDefinition[]>` (handles both interactive/non-interactive paths)
    -   `promptForCategory(categories: CategoryDefinition[]): Promise<CategoryDefinition>`
    -   `promptForModes(modes: ModeDefinition[]): Promise<ModeDefinition[]>`
-   **Dependencies:**
    -   [`DefinitionLoader.ts`](#1-definitionloaderts) (to get lists of available modes and categories)
    -   [`UiManager.ts`](#1-uimanagerts-srcutilsuimanagerts) (for displaying interactive prompts using `enquirer`)
-   **Used By:**
    -   [`InitCommand`](#initcommand-srccommandsinitts)

### 3. `FileManager.ts`

-   **Responsibility:**
    -   Handles all interactions with the target project's file system.
    -   Creates the `.roo/` directory structure.
    -   Copies rule files from the bundled `definitions/rules/` directory to the target project's `.roo/rules/` and `.roo/rules-[mode_slug]/` directories.
    -   Creates or updates the `.roomodes` JSON file in the target project's root.
    -   Handles the `--force` option for overwriting existing files.
-   **Key Methods (Conceptual):**
    -   `initializeProjectFiles(selectedModes: ModeDefinition[], forceOverwrite: boolean): Promise<void>`
    -   `createRooDirectoryStructure(): Promise<void>`
    -   `copyRuleFiles(mode: ModeDefinition, forceOverwrite: boolean): Promise<void>`
    -   `writeRoomodesFile(selectedModes: ModeDefinition[], forceOverwrite: boolean): Promise<void>`
-   **Dependencies:**
    -   Node.js `fs` module (or `fs-extra`) for file system operations.
    -   Path resolution utilities.
    -   [`DefinitionLoader.ts`](#1-definitionloaderts) (to get information about rule files, like their source paths).
    -   [`UiManager.ts`](#1-uimanagerts-srcutilsuimanagerts) (for displaying progress indicators like `ora` spinners during file operations).
-   **Used By:**
    -   [`InitCommand`](#initcommand-srccommandsinitts)

## CLI Orchestration

### `cli.ts` (`src/cli.ts`)

-   **Responsibility:**
    -   Main entry point of the CLI application.
    -   Sets up `commander.js` to define commands, options, and arguments.
    -   Instantiates core services (`DefinitionLoader`, `ModeSelector`, `FileManager`) and utilities (`UiManager`, `ErrorHandler`). This acts as the Dependency Injection (DI) root.
    -   Delegates command execution to specific command handler modules.
-   **Key Libraries Used:** `commander`
-   **Interactions:**
    -   Parses command-line arguments.
    -   Invokes the appropriate command handler (e.g., `InitCommand`).

### `InitCommand` (`src/commands/init.ts` or similar)

-   **Responsibility:**
    -   Orchestrates the main `init` workflow.
    -   Receives instances of core services and utilities via constructor or method injection from [`cli.ts`](#clits-srcclits).
    -   Determines if the CLI should run in interactive or non-interactive mode based on parsed arguments.
    -   Calls `ModeSelector` to get the list of modes to apply.
    -   Calls `FileManager` to perform file operations based on selected modes.
    -   Uses `UiManager` for all user-facing console output (prompts, messages, spinners).
    -   Uses `ErrorHandler` for consistent error reporting.
-   **Dependencies (Injected):**
    -   [`DefinitionLoader.ts`](#1-definitionloaderts)
    -   [`ModeSelector.ts`](#2-modeselectorts)
    -   [`FileManager.ts`](#3-filemanagerts)
    -   [`UiManager.ts`](#1-uimanagerts-srcutilsuimanagerts)
    -   [`ErrorHandler.ts`](#2-errorhandler-srcutilserrorhandler)
-   **Used By:**
    -   Invoked by [`cli.ts`](#clits-srcclits) when the `init` command is run.

## Utility Modules (`src/utils/`)

These modules provide shared, reusable functionalities.

### 1. `UiManager.ts` (`src/utils/uiManager.ts`)

-   **Responsibility:**
    -   Centralizes all CLI user interface elements and interactions.
    -   Wraps and manages UI libraries like `enquirer` (for prompts), `ora` (for spinners), `boxen` (for message boxes), `cli-table3` (for tables), and `gradient-string` (for styled text).
    -   Provides a consistent API for displaying prompts, progress indicators, success/error messages, and formatted output.
-   **Key Libraries Used:** `enquirer`, `ora`, `boxen`, `cli-table3`, `gradient-string`.
-   **Used By:**
    -   [`ModeSelector.ts`](#2-modeselectorts) (for interactive prompts)
    -   [`FileManager.ts`](#3-filemanagerts) (for progress spinners)
    -   [`InitCommand`](#initcommand-srccommandsinitts) (for general messages and feedback)
    -   [`ErrorHandler.ts`](#2-errorhandler-srcutilserrorhandler) (potentially for styling error messages)

### 2. `ErrorHandler.ts` (`src/utils/errorHandler.ts`)

-   **Responsibility:**
    -   Provides a centralized mechanism for handling and reporting errors.
    -   Formats user-friendly error messages.
    -   Manages CLI exit codes based on error types.
    -   May use `UiManager` to style error output (e.g., using `boxen`).
-   **Used By:**
    -   All components that can encounter catchable errors, especially command handlers and services.

### 3. `logger.ts` (`src/utils/logger.ts`) (Optional/Basic)

-   **Responsibility:**
    -   Provides basic, unstyled logging capabilities.
    -   Can be used for internal debugging or as a fallback if `UiManager` is not suitable for certain low-level messages.
-   **Used By:**
    -   Potentially by core services for internal state logging if needed.

## Data Definitions (`definitions/`)

-   **Responsibility:**
    -   Source of truth for all predefined modes, categories, and rules.
    -   [`categories.json`](../definitions/categories.json): Defines available categories.
    -   [`modes.json`](../definitions/modes.json): Defines available modes, their association with categories, and the rules they include.
    -   [`rules/`](../definitions/rules/): Contains the actual Markdown content for generic and mode-specific rules.
-   **Usage:**
    -   Read by [`DefinitionLoader.ts`](#1-definitionloaderts) at runtime.
    -   These files are bundled with the CLI application during the build process (copied to `build/definitions/`).

This component structure allows for a clear separation of concerns, making the Roo Init CLI easier to understand, maintain, test, and extend.