# 7 · Advanced Usage & Customization

This document covers more advanced usage scenarios and potential customization aspects of the Roo Init CLI tool.

## Combining CLI Options

You can combine various CLI options for more precise control in non-interactive mode.

-   **Selecting Specific Modes and Forcing Overwrite:**
    If you want to apply a specific set of modes and ensure that any existing Roo configurations for these modes are overwritten, you can combine `--modes` and `--force`.
    ```bash
    roo-init init --modes typescript-library,jest-setup --force
    ```

-   **Selecting Categories and Forcing Overwrite:**
    Similarly, you can force overwrite when selecting all modes within specific categories.
    ```bash
    roo-init init --category backend-services,database-config --force
    ```

## Scripting and Automation

The non-interactive mode of the Roo Init CLI is well-suited for scripting and automation, such as in CI/CD pipelines or custom project scaffolding tools.

**Example: Bash script for new project setup**
```bash
#!/bin/bash

PROJECT_NAME=$1

if [ -z "$PROJECT_NAME" ]; then
  echo "Usage: ./setup_new_project.sh <project_name>"
  exit 1
fi

mkdir "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Initialize a basic Node.js project (example)
pnpm init -y

# Apply standard Roo modes for a TypeScript library
echo "Initializing Roo modes..."
roo-init init --modes typescript-library,eslint-config,prettier-setup,base-readme --force

echo "Project $PROJECT_NAME setup complete with Roo modes."
```
In this example, `roo-init` is used to apply a standard set of modes to a newly created project directory. The `--force` flag is used to ensure a clean application of modes, which is often desirable in automated scripts.

## Understanding the `.roomodes` File

The `.roomodes` file generated in your project root contains the definitions of the modes you've applied. While primarily for the CLI's internal reference or potential future tooling, you can inspect this file to:

-   See exactly which modes were applied.
-   Understand the `slug`, `name`, `description`, `categorySlug`, and `ruleSlugs` for each applied mode.

This can be useful for auditing your project's Roo configuration.

## Extending the CLI (Developer Note)

While the MVP focuses on using predefined modes and rules bundled with the CLI, the architecture is designed with extensibility in mind. For developers looking to contribute to or fork the Roo Init CLI, extending it would typically involve:

1.  **Defining New Modes:**
    -   Adding new entries to the [`definitions/modes.json`](../definitions/modes.json) file. This includes specifying a unique `slug`, `name`, `description`, `categorySlug`, and an array of `ruleSlugs` it should include.

2.  **Defining New Categories (if needed):**
    -   Adding new entries to the [`definitions/categories.json`](../definitions/categories.json) file with a `slug`, `name`, and `description`.

3.  **Creating New Rule Files:**
    -   Adding new Markdown (`.md`) files to [`definitions/rules/generic/`](../definitions/rules/generic/) for rules applicable to multiple modes.
    -   Adding new Markdown (`.md`) files to a new or existing `definitions/rules/[mode_slug]/` directory for rules specific to a particular mode. Ensure the `ruleSlugs` in your mode definition correctly reference these file names (without the `.md` extension).

4.  **Rebuilding the CLI:**
    -   After adding new definitions, the CLI would need to be rebuilt (e.g., `pnpm build`) to include these new definitions in the distributable version.

These steps are internal to the CLI's development and not typically performed by end-users of the published tool.

## Future Considerations (Beyond MVP)

-   **Custom Definition Paths:** Future versions might allow users to specify paths to their own custom mode/rule definition repositories or local directories.
-   **Mode Dependencies:** A system for modes to declare dependencies on other modes could be introduced for more complex configurations.
-   **Plugin System:** A plugin architecture could allow for easier extension of CLI functionality and definition sources.

For now, advanced usage primarily revolves around leveraging the non-interactive options for automation and understanding the outputted configuration files.