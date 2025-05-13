# 8 · Troubleshooting Guide

This guide helps you troubleshoot common issues you might encounter while using the Roo Init CLI tool.

## Common Issues and Solutions

1.  **Command Not Found: `roo-init: command not found`**
    *   **Cause:** The `roo-init` command is not recognized by your system's shell.
    *   **Solutions:**
        *   **Global Installation:** If you intended to install the CLI globally, ensure the installation was successful and that the directory where global npm/pnpm packages are installed is included in your system's `PATH` environment variable.
            *   You can find npm's global path with `npm root -g`.
            *   You can find pnpm's global path with `pnpm root -g`.
            *   Add the relevant path to your shell's configuration file (e.g., `.bashrc`, `.zshrc`, `.profile`).
        *   **Local Development:** If you are running from a cloned repository for development:
            *   Ensure you have built the project: `pnpm build`.
            *   Run the CLI using `node build/bin/roo-init.js <command>` from the project root.
            *   Alternatively, if you've linked it using `pnpm link --global`, ensure the link is active.

2.  **Invalid Mode or Category Slug**
    *   **Symptom:** The CLI exits with an error message like "Error: Invalid mode slug(s) provided: [slug_name]" or "Error: Invalid category slug(s) provided: [slug_name]".
    *   **Cause:** You've provided a mode or category slug via the `--modes` or `--category` options that doesn't exist in the CLI's definitions.
    *   **Solutions:**
        *   Double-check the spelling of the slugs. Slugs are case-sensitive.
        *   Run `roo-init init` in interactive mode (without options) to see the list of available categories and modes.
        *   If you have access to the CLI's source code, refer to [`definitions/modes.json`](../definitions/modes.json) and [`definitions/categories.json`](../definitions/categories.json) for the correct slugs.

3.  **File System Permission Errors**
    *   **Symptom:** The CLI fails with errors related to creating directories or writing files (e.g., `EACCES: permission denied`).
    *   **Cause:** The user running the `roo-init` command does not have the necessary write permissions in the target project directory.
    *   **Solutions:**
        *   Ensure you have write permissions for the directory where you are running `roo-init init`.
        *   On Unix-like systems (Linux, macOS), you might need to use `sudo` if operating in a restricted directory, but this is generally not recommended for user projects. It's better to fix the directory permissions.
        *   Check if any files or the `.roo` directory are locked by another process.

4.  **Files Not Overwritten (Without `--force`)**
    *   **Symptom:** You re-run `roo-init init` with different modes, but existing `.roomodes` or rule files from a previous run are not updated.
    *   **Cause:** By default, to prevent accidental data loss, the CLI might skip overwriting existing files or prompt for confirmation (behavior can vary based on implementation details for safety).
    *   **Solution:**
        *   If you intend to overwrite the existing Roo configurations, use the `--force` (or `-f`) flag with the `init` command:
            ```bash
            roo-init init --modes new-mode --force
            ```

5.  **Corrupted or Missing Definition Files (for CLI Developers/Maintainers)**
    *   **Symptom:** CLI fails to start or load modes/categories, possibly with errors related to JSON parsing or file not found within the `definitions` directory. This is typically an issue for those developing the CLI itself.
    *   **Cause:** The bundled [`definitions/modes.json`](../definitions/modes.json), [`definitions/categories.json`](../definitions/categories.json), or rule files in [`definitions/rules/`](../definitions/rules/) are missing, corrupted, or not correctly copied to the `build/definitions` directory during the build process.
    *   **Solutions (for CLI Developers):**
        *   Ensure all definition JSON files are valid JSON.
        *   Verify that the build process (e.g., `pnpm build`) correctly copies the entire `definitions/` directory to `build/definitions/`. Check the build scripts in [`package.json`](../package.json).
        *   Clean the `build/` directory and rebuild the project.

6.  **Unexpected Behavior in Interactive Prompts**
    *   **Symptom:** Prompts are not displaying correctly, or selections are not working as expected.
    *   **Cause:** Could be due to terminal compatibility issues with the `enquirer` library or bugs in the UI handling logic.
    *   **Solutions:**
        *   Try a different terminal emulator.
        *   Ensure your terminal supports standard ANSI escape codes for colors and cursor movement.
        *   If the issue persists, consider reporting it as a bug with details about your terminal and operating system. As a workaround, use the non-interactive mode with `--modes` or `--category` flags.

## Reporting Issues

If you encounter an issue not listed here, or if the suggested solutions do not work:

1.  **Gather Information:**
    *   The exact command you ran.
    *   The full error message or a description of the unexpected behavior.
    *   The version of `roo-init` CLI (`roo-init --version`).
    *   Your Node.js version (`node -v`).
    *   Your PNPM version (`pnpm -v`).
    *   Your operating system and version.
2.  **Check Existing Issues:** Look for similar issues on the project's issue tracker (if available).
3.  **Create a New Issue:** If no existing issue matches, create a new one providing all the gathered information. This will help developers diagnose and fix the problem.

## Further Assistance

For more general information, refer to:
-   [1 · Project Overview](1_overview_project.md)
-   [3 · Core Concepts](3_core_concepts.md)
-   [4 · User Guide](4_user_guide.md)