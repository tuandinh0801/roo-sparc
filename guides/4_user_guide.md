# 4 · User Guide

This guide provides instructions on how to use the Roo Init CLI tool for initializing your projects.

## Basic Usage

The primary command for the Roo Init CLI is `init`. You run this command within the root directory of the project you want to initialize.

```bash
roo-init init [options]
```

## Interactive Mode

If you run `roo-init init` without any specific mode or category options, the CLI will start in interactive mode. This mode guides you through the process of selecting configurations for your project.

1.  **Welcome Message:** You'll see a welcome message.
2.  **Category Selection:** You will be prompted to choose a category of modes. Use the arrow keys to navigate and press Enter to select.
    ```
    ? Select a category: (Use arrow keys)
    ❯ Frontend Frameworks
      Backend Services
      Utility Libraries
      Documentation
      Testing
    ```
3.  **Mode Selection:** After selecting a category, you'll be prompted to choose one or more modes from that category. Use the arrow keys to navigate, Space to toggle selection for a mode, and Enter to confirm your selections.
    ```
    ? Select modes (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed):
    ❯ ◯ react-webapp
      ◯ vue-application
      ◯ static-site
    ```
4.  **Confirmation:** The CLI will show a summary of the selected modes and ask for confirmation before proceeding with file operations.
5.  **File Operations:** Upon confirmation, the CLI will:
    *   Create the `.roo/` directory structure.
    *   Copy the relevant rule files (`.md`) into `.roo/rules/` and `.roo/rules-[mode_slug]/`.
    *   Create or update the `.roomodes` file with the definitions of the selected modes.
    Progress indicators (spinners) will be shown during these operations.
6.  **Completion Message:** A success message will be displayed once the initialization is complete.

## Non-Interactive Mode

For automated setups or when you know exactly which modes or categories you want, you can use non-interactive mode by providing command-line options.

### Selecting Modes by Slug

Use the `--modes` option followed by a comma-separated list of mode slugs:

```bash
roo-init init --modes <slug1>,<slug2>,<slug3>
```
For example:
```bash
roo-init init --modes react-webapp,eslint-config,prettier-setup
```
The CLI will directly process these modes without interactive prompts.

### Selecting Modes by Category

Use the `--category` option followed by a comma-separated list of category slugs. This will select all modes within the specified categories.

```bash
roo-init init --category <category_slug1>,<category_slug2>
```
For example:
```bash
roo-init init --category frontend-frameworks,testing
```

### Forcing Overwrite

If `.roomodes` or rule files already exist in the target project, the CLI will typically prompt before overwriting or skip them. To force overwrite existing files without prompting, use the `--force` option:

```bash
roo-init init --modes <slug1> --force
```
or
```bash
roo-init init --category <category_slug1> --force
```

**Caution:** Using `--force` will overwrite existing Roo configurations. Use with care.

## Common Commands and Options

-   **`roo-init init`**:
    The main command to start the project initialization process.
    -   **Options:**
        -   `--modes <slugs>`: A comma-separated list of mode slugs to apply.
        -   `--category <slugs>`: A comma-separated list of category slugs to apply (selects all modes in those categories).
        -   `--force`: Overwrite existing `.roomodes` file and rule files without prompting.
        -   `--help`: Display help information for the `init` command.

-   **`roo-init --help`**:
    Displays the main help message, listing all available commands and global options.

-   **`roo-init --version`**:
    Displays the installed version of the Roo Init CLI.

## Expected Output Files and Directories

After a successful initialization, your project directory will contain:

-   **`.roomodes` (file):** Located in the project root. This JSON file contains an array of `ModeDefinition` objects for all the modes you selected. This serves as a manifest of the Roo configurations applied.
    Example content:
    ```json
    [
      {
        "slug": "react-webapp",
        "name": "React Web Application",
        "description": "Sets up a standard React web application.",
        "categorySlug": "frontend-frameworks",
        "ruleSlugs": ["react-best-practices", "common-web-security"]
      },
      // ... other selected mode definitions
    ]
    ```

-   **`.roo/` (directory):** Located in the project root.
    -   **`.roo/rules/` (directory):** Contains copies of generic rule files (`.md`) that were associated with any of the selected modes.
    -   **`.roo/rules-[mode_slug]/` (directories):** For each selected mode, a directory is created (e.g., `.roo/rules-react-webapp/`) containing copies of the rule files (`.md`) specific to that mode.

These files and directories provide your project with the selected configurations and guidelines.

## Troubleshooting Common Issues

-   **Command not found (`roo-init: command not found`):**
    *   Ensure the CLI is installed globally. If installed locally for development, ensure you are using the correct path to execute it (e.g., `node build/bin/roo-init.js` or have linked it).
    *   Check if your system's `PATH` environment variable includes the directory where global Node modules are installed.

-   **Invalid Mode or Category Slug:**
    *   The CLI will output an error message if an invalid slug is provided via `--modes` or `--category`.
    *   You can list available modes/categories using interactive mode or by referring to the source definition files ([`definitions/modes.json`](../definitions/modes.json) and [`definitions/categories.json`](../definitions/categories.json)) if you have access to the CLI's source code.

-   **File System Permissions:**
    *   Ensure you have write permissions in the target project directory where the CLI is attempting to create files and directories.

-   **Conflicting Files (without `--force`):**
    *   If `.roomodes` or rule files already exist, the CLI might skip them or prompt for action. If you intend to overwrite, use the `--force` flag.

For further assistance, refer to the [Project Overview (`1_overview_project.md`)](1_overview_project.md) and [Core Concepts (`3_core_concepts.md`)](3_core_concepts.md).