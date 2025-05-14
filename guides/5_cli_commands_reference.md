# 5 · CLI Commands Reference

This document provides a detailed reference for all commands and options available in the Roo Init CLI tool.

## Global Options

These options can be used with the main `roo-init` command.

-   **`--help`**
    -   Alias: `-h`
    -   Description: Displays the main help message, listing all available commands and global options.
    -   Usage: `roo-init --help`

-   **`--version`**
    -   Alias: `-v`
    -   Description: Displays the installed version of the Roo Init CLI.
    -   Usage: `roo-init --version`

## `init` Command

The `init` command is the primary command used to initialize a new or existing project with Roo modes and rules.

**Usage:**
```bash
roo-init init [options]
```

If run without options, it enters interactive mode.

### `init` Command Options

-   **`--modes <slugs>`**
    -   Alias: `-m <slugs>`
    -   Description: Specifies a comma-separated list of mode slugs to apply to the project. This runs the command in non-interactive mode for mode selection.
    -   Argument: `<slugs>` - A string of mode slugs separated by commas (e.g., `mode-slug-1,mode-slug-2`).
    -   Example: `roo-init init --modes typescript-library,eslint-config`

-   **`--category <slugs>`**
    -   Alias: `-c <slugs>`
    -   Description: Specifies a comma-separated list of category slugs. All modes belonging to these categories will be applied. This runs the command in non-interactive mode for category-based mode selection.
    -   Argument: `<slugs>` - A string of category slugs separated by commas (e.g., `category-slug-1,category-slug-2`).
    -   Example: `roo-init init --category backend-services,testing-frameworks`

-   **`--force`**
    -   Alias: `-f`
    -   Description: If specified, the CLI will overwrite any existing `.roomodes` file and any conflicting rule files in the `.roo/` directory structure without prompting the user for confirmation.
    -   Usage:
        ```bash
        roo-init init --modes my-mode --force
        roo-init init --category my-category --force
        roo-init init --force # In interactive mode, will skip overwrite confirmations
        ```
    -   **Caution:** Use this option with care, as it can lead to data loss if existing configurations are overwritten unintentionally.

-   **`--help`**
    -   Description: Displays help information specifically for the `init` command, detailing its purpose and available options.
    -   Usage: `roo-init init --help`

## `manage` Command

The `manage` command provides subcommands for managing user-specific configurations, such as custom modes.

### `manage add mode` Command

This command allows you to interactively define and save a new custom mode to your global user configuration. This enables personalization and extension of the `roo-init` CLI with your own modes and rules.

**Usage:**

```bash
roo-init manage add mode
```

Running this command will initiate a series of interactive prompts to gather the necessary information for the new custom mode:

**Mode Definition Prompts:**

*   **`slug`**:
    *   A unique identifier for the mode (e.g., `my-custom-node-mode`).
    *   This slug must be unique among your other custom modes. The CLI will validate this.
*   **`name`**:
    *   A human-readable name for the mode (e.g., "My Custom Node.js Mode").
*   **`description` (`roleDefinition`)**:
    *   A detailed description explaining the purpose and functionality of the mode.
*   **`customInstructions`** (optional):
    *   Specific instructions or guidelines that this mode should follow during its operation.
*   **`groups`** (optional):
    *   A comma-separated list of group names to associate with this mode (e.g., `backend,typescript`).
*   **`categorySlugs`**:
    *   You will be prompted to select one or more category slugs from a list of existing system and custom categories.

**Associated Rule File Prompts:**

After defining the mode's metadata, you will be asked if you want to add rule files to this mode. You can add multiple rules. For each rule, you will be prompted for:

*   **Rule `name`**:
    *   A human-readable name for the rule (e.g., "Custom ESLint Configuration").
*   **Rule `filename`**:
    *   The filename for the rule (e.g., `custom-eslint.md`). This will be validated to ensure it contains valid filename characters.
*   **Rule `description`** (optional):
    *   A brief description of the rule's purpose.
*   **`isGeneric`**:
    *   A boolean (yes/no) indicating if this is a generic rule.
    *   Generic rules are typically stored in a general location (e.g., `.roo/rules/`) and can be shared across modes.
    *   Mode-specific rules (default, `isGeneric: false`) are tied directly to this custom mode.
*   **Rule Content**:
    *   An editor (your system's default or a basic in-terminal editor) will open, allowing you to input the Markdown content for the rule.

**Storage:**

*   The complete new mode definition (including metadata for all its associated rules) will be appended to the `customModes` array in your user-global configuration file: `~/.config/roo-init/user-definitions.json`.
*   The content of each rule file you define will be saved to: `~/.config/roo-init/rules/[mode_slug]/[filename]`, where `[mode_slug]` is the slug you defined for the custom mode, and `[filename]` is the filename you provided for the rule. The `[mode_slug]` subdirectory will be created if it doesn't exist.

Upon successful completion, The CLI will provide feedback confirming the creation of the mode and its rules.

### `manage add category` Command

This command allows you to interactively define and save a new custom category to your global user configuration. Custom categories help organize modes and can be selected when adding or editing custom modes.

**Usage:**

```bash
roo-init manage add category
```

Running this command will initiate a series of interactive prompts to gather the necessary information for the new custom category:

**Category Definition Prompts:**

*   **`slug`**:
    *   A unique identifier for the category (e.g., `my-custom-category`).
    *   This slug must be unique among your other custom categories. The CLI will validate this.
*   **`name`**:
    *   A human-readable name for the category (e.g., "My Custom Category").
*   **`description`** (optional):
    *   A brief description explaining the purpose of the category.

**Storage:**

*   The new category definition will be appended to the `customCategories` array in your user-global configuration file: `~/.config/roo-init/user-definitions.json`.
*   If the file or the `customCategories` array doesn't exist, they will be created.

Upon successful completion, the CLI will provide feedback confirming the creation of the category.

---
---
## Exit Codes

The Roo Init CLI uses standard exit codes to indicate the outcome of its execution:

-   **`0`**: Success. The command completed without errors.
-   **`1`**: General Error. The command failed due to an issue such as invalid input, file system error, or an unexpected problem. Error messages provided to the console should give more details.

Understanding these commands and options will help you use the Roo Init CLI effectively for both interactive and automated project initializations.