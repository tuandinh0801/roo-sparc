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

## Exit Codes

The Roo Init CLI uses standard exit codes to indicate the outcome of its execution:

-   **`0`**: Success. The command completed without errors.
-   **`1`**: General Error. The command failed due to an issue such as invalid input, file system error, or an unexpected problem. Error messages provided to the console should give more details.

Understanding these commands and options will help you use the Roo Init CLI effectively for both interactive and automated project initializations.