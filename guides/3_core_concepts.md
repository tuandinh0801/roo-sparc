# 3 · Core Concepts

This document explains the fundamental concepts and terminology used within the Roo Init CLI tool. Understanding these concepts is crucial for effectively using and contributing to the project.

## Key Terminology

-   **Mode:**
    A `Mode` represents a predefined configuration or role that can be applied to a project. Each mode encapsulates a specific set of development practices, tools, or project types. For example, a `mode` could be "typescript-library", "react-webapp", or "python-api".
    -   **Definition:** Modes are defined in the [`definitions/modes.json`](../definitions/modes.json) file. Each mode definition includes a `slug` (a unique identifier), a `name`, a `description`, and a list of associated `ruleSlugs`.
    -   **Purpose:** Modes provide a high-level way to select a bundle of configurations and guidelines.

-   **Rule:**
    A `Rule` is a specific guideline, best practice, or piece of instruction, typically stored as a Markdown file. Rules are associated with one or more modes.
    -   **Definition:** Rule files (`.md`) are stored in the [`definitions/rules/`](../definitions/rules/) directory.
        -   **Generic Rules:** Located in [`definitions/rules/generic/`](../definitions/rules/generic/), these rules can be applied to any mode.
        -   **Mode-Specific Rules:** Located in `definitions/rules/[mode_slug]/`, these rules are tailored to a particular mode.
    -   **Purpose:** Rules provide detailed instructions and standards that are copied into the target project when their associated mode(s) are selected.

-   **Category:**
    A `Category` is used to group related modes, making them easier for users to discover and select. For instance, categories like "Frontend Frameworks", "Backend Services", or "Utility Libraries" can help organize a large number of modes.
    -   **Definition:** Categories are defined in the [`definitions/categories.json`](../definitions/categories.json) file. Each category definition includes a `slug`, `name`, and `description`. Modes are associated with categories via their `categorySlug` property in [`definitions/modes.json`](../definitions/modes.json).
    -   **Purpose:** Categories provide a structured way to browse and select modes, especially in interactive mode.

-   **`.roomodes` File:**
    This is a JSON file created or updated in the root of the target project by the `roo-init` CLI. It records the definitions of all modes that have been selected and applied to the project.
    -   **Location:** `[target-project-root]/.roomodes`
    -   **Content:** An array of `ModeDefinition` objects for the selected modes.
    -   **Purpose:** Serves as a manifest of the Roo configurations applied to the project, potentially for future reference or tooling.

-   **`.roo/` Directory:**
    This directory is created in the root of the target project by the `roo-init` CLI. It houses the rule files associated with the selected modes.
    -   **Location:** `[target-project-root]/.roo/`
    -   **Structure:**
        -   `.roo/rules/`: Contains copies of generic rule files.
        -   `.roo/rules-[mode_slug]/`: Contains copies of rule files specific to each selected `mode_slug`.
    -   **Purpose:** Provides the actual guideline documents directly within the initialized project for easy access by developers.

## Fundamental Principles

-   **Standardization:** The primary principle is to standardize project setup by providing predefined, best-practice configurations (modes and rules). This reduces inconsistencies and setup time.
-   **Modularity:** Modes and rules are designed as modular components. Modes bundle rules, and categories group modes. This allows for flexible combinations and easier management.
-   **Discoverability:** The CLI aims to make modes and rules easily discoverable, either through interactive prompts (listing categories and modes) or via command-line arguments.
-   **Automation:** The tool automates the process of copying mode definitions and rule files into the target project, eliminating manual and error-prone setup steps.
-   **User Choice:** While promoting standards, the CLI allows users to choose which modes (and therefore which sets of rules) are relevant to their specific project needs. This includes options for interactive selection or non-interactive, scripted initialization.

## Mental Model: How it Works

1.  **Definitions:** The `roo-init` CLI comes bundled with a set of predefined `categories`, `modes`, and `rule` files. These definitions are the source of truth for what can be initialized.
    -   [`definitions/categories.json`](../definitions/categories.json) lists all available categories.
    -   [`definitions/modes.json`](../definitions/modes.json) lists all available modes, linking them to categories and specifying which rules they include.
    -   [`definitions/rules/`](../definitions/rules/) contains the actual Markdown content for each rule.

2.  **User Interaction:**
    -   **Interactive Mode:** The user runs `roo-init`. The CLI prompts them to select a category, then select one or more modes from that category.
    -   **Non-Interactive Mode:** The user runs `roo-init` with flags like `--modes <slug1>,<slug2>` or `--category <cat_slug1>` to specify their choices directly.

3.  **Processing:**
    -   The `DefinitionLoader` service loads all category, mode, and rule information from the bundled JSON and Markdown files.
    -   The `ModeSelector` service processes the user's input (either from prompts or arguments) and resolves the final list of modes to be applied.
    -   The `FileManager` service then:
        -   Creates the `.roo/` directory structure in the target project.
        -   Copies the relevant rule files (`.md`) for each selected mode into the appropriate subdirectories within `.roo/rules/` (for generic rules) and `.roo/rules-[mode_slug]/` (for mode-specific rules).
        -   Creates or updates the `.roomodes` file in the target project's root, writing the definitions of the selected modes into it.

4.  **Outcome:** The target project is now initialized with:
    -   A `.roomodes` file listing the applied mode configurations.
    -   A `.roo/` directory containing the actual rule documents for developer reference.

This process ensures that projects are set up consistently according to the chosen development standards defined by the selected modes and rules.