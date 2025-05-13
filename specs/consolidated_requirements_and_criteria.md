# Roo Init CLI Tool - Consolidated Requirements and Acceptance Criteria

## Project Overview

The Roo Init CLI tool is designed to initialize projects with specific modes and rules, grouped by categories. It allows users to choose specific modes and copy the necessary mode definitions and rules to the target project. All modes and rules are pre-defined within the CLI; users select from these available options.

## Functional Requirements

### 1. Mode Selection

- **FR1.1**: The CLI must allow users to select specific 'modes' to include in their project.
- **FR1.2**: The CLI must provide a list of available modes.
- **FR1.3**: The CLI must validate that the selected modes exist.
- **FR1.4**: The CLI must allow users to select multiple modes.
- **FR1.5**: Users can select modes from the available list.
- **FR1.6**: The CLI must provide a consolidated list of all available modes.
- **FR1.7**: The CLI must resolve any dependencies between modes.

### 2. Mode Definition Copying

- **FR2.1**: The CLI must copy the selected modes' definitions to the target project.
- **FR2.2**: The mode definitions must be in JSON format, similar to the provided `.roomodes` content.
- **FR2.3**: The CLI must create a `.roomodes` file in the target project if it doesn't exist.
- **FR2.4**: The CLI must update the `.roomodes` file in the target project if it already exists.

### 3. Rule Copying

- **FR3.1**: The CLI must copy the associated rules for the selected modes into the target project's `.roo` directory.
- **FR3.2**: Mode-specific rules must be located at `[source_rules_path]/rules-[mode_slug]/*.md`.
- **FR3.3**: Generic rules (if any) must be located at `[source_rules_path]/rules/*.md` or a configured global rules path.
- **FR3.4**: The CLI must create the `.roo` directory and subdirectories in the target project if they don't exist.
- **FR3.5**: The CLI must preserve the directory structure of the rules when copying.

### 4. Extensibility

- **FR4.1**: The CLI must be extensible to support new modes, categories, and rule structures in the future.
- **FR4.2**: The CLI must use a configuration file or mechanism to define available modes, categories, and rule locations.
- **FR4.3**: The CLI must allow for the addition of new modes by updating configuration or adding mode definition files to a configured path.

### 5. CLI Interface

- **FR5.1**: The CLI must provide a clear command structure (e.g., `roo-init <command> [options]`).
- **FR5.2**: The CLI must provide help text and usage examples.
- **FR5.3**: The CLI must provide feedback on the progress and success/failure of operations.
- **FR5.4**: The CLI must support both interactive and non-interactive modes.

### 6. Mode Categorization

- **FR6.1**: The CLI must support categorizing modes into functional groups (e.g., Specification, Architecture, Code).
- **FR6.2**: Each mode should belong to at least one category.
- **FR6.3**: The CLI must display modes grouped by category in interactive mode.
- **FR6.4**: The CLI must allow selection of modes by category.
- **FR6.5**: Categories must be consistently defined.

## Edge Cases and Error Handling

### Mode Selection

- **EC1.1**: No modes are available.
- **EC1.2**: Invalid mode name provided.
- **EC1.3**: Conflicting modes selected.
- **EC1.4**: Modes with the same slug (if registry allows multiple sources, otherwise this is a config validation issue).
- **EC1.5**: Modes with dependencies on other modes.
- **EC1.6**: Conflicting custom instructions between modes.

### File Operations

- **EC2.1**: Target directory doesn't exist.
- **EC2.2**: Target directory is not writable.
- **EC2.3**: `.roomodes` file already exists in the target project.
- **EC2.4**: `.roo` directory already exists in the target project.
- **EC2.5**: Source files or directories don't exist.
- **EC2.6**: Source files or directories are not readable.
- **EC2.7**: Insufficient disk space for copying files.
- **EC2.8**: File system errors during copying.

### Configuration

- **EC3.1**: Configuration file is missing.
- **EC3.2**: Configuration file is malformed or invalid.
- **EC3.3**: Referenced paths in configuration don't exist.

### Categorization

- **EC4.1**: Mode without assigned categories.
- **EC4.2**: Reference to non-existent category.
- **EC4.3**: Circular reference in category hierarchy.
- **EC4.4**: Duplicate category IDs.

## Constraints

### Technical Constraints

- **TC1.1**: The CLI must be implemented in Node.js.
- **TC1.2**: The CLI must be compatible with Node.js version 14.x and above.
- **TC1.3**: The CLI must be cross-platform (Windows, macOS, Linux).
- **TC1.4**: The CLI must have minimal dependencies to ensure easy installation and maintenance.

### Performance Constraints

- **PC1.1**: The CLI must complete initialization within a reasonable time frame (< 30 seconds for typical projects).
- **PC1.2**: The CLI must handle a large number of modes and rules efficiently.
- **PC1.3**: The CLI must minimize memory usage during operation.

### Security Constraints

- **SC1.1**: The CLI must not modify files outside the target project directory without explicit permission.
- **SC1.2**: The CLI must validate all user inputs to prevent injection attacks.
- **SC1.3**: The CLI must not include sensitive information in logs or error messages.

## Non-Functional Requirements

### Usability

- **NFR1.1**: The CLI must provide clear and concise error messages.
- **NFR1.2**: The CLI must provide progress indicators for long-running operations.
- **NFR1.3**: The CLI must provide a consistent and intuitive command structure.
- **NFR1.4**: The CLI must provide helpful documentation and examples.

### Maintainability

- **NFR2.1**: The CLI code must be modular and well-documented.
- **NFR2.2**: The CLI must use a consistent coding style and follow best practices.
- **NFR2.3**: The CLI must include comprehensive tests.
- **NFR2.4**: The CLI must be designed for easy extension and modification.

### Reliability

- **NFR3.1**: The CLI must handle errors gracefully and provide meaningful error messages.
- **NFR3.2**: The CLI must validate inputs and configurations before performing operations.
- **NFR3.3**: The CLI must ensure data integrity during file operations.
- **NFR3.4**: The CLI must provide a way to rollback changes in case of failure.

## Acceptance Criteria

### 1. Mode Selection

- **AC1.1**: The CLI should display a list of available modes (optionally by category).
- **AC1.2**: The user should be able to select additional modes.
- **AC1.3**: When the CLI is run with a list of modes using the `--modes` option, it should use those modes without prompting.
- **AC1.4**: When the CLI is run with an invalid mode name, it should display an appropriate error message.
- **AC1.5**: When no modes are available, the CLI should display an appropriate error message.
- **AC1.6**: Users should be able to view a complete list of all available modes.
- **AC1.7**: Users should be able to select any combination of modes.
- **AC1.8**: The CLI should resolve dependencies between selected modes.
- **AC1.9**: The CLI should copy rules associated with selected modes.

### 2. Mode Definition Copying

- **AC2.1**: The CLI should create a `.roomodes` file in the target project with the selected modes.
- **AC2.2**: The `.roomodes` file should contain valid JSON with a `customModes` array.
- **AC2.3**: Each mode in the `customModes` array should have the required properties: `slug`, `name`, `roleDefinition`, `customInstructions`, `groups`, and `source`.
- **AC2.4**: If a `.roomodes` file already exists in the target project, the CLI should not overwrite it unless the `--force` option is used.
- **AC2.5**: The CLI should display a success message after copying the mode definitions.

### 3. Rule Copying

- **AC3.1**: The CLI should create a `.roo` directory in the target project if it doesn't exist.
- **AC3.2**: The CLI should copy generic rules (if any) to the `.roo/rules` directory.
- **AC3.3**: The CLI should copy mode-specific rules to the `.roo/rules-[mode_slug]` directories.
- **AC3.4**: The CLI should preserve the directory structure of the rules when copying.
- **AC3.5**: If rule files already exist in the target project, the CLI should not overwrite them unless the `--force` option is used.
- **AC3.6**: The CLI should display a success message after copying the rule files.
- **AC3.7**: If a source rules directory doesn't exist, the CLI should display a warning but continue with the operation.

### 4. Extensibility

- **AC4.1**: The CLI should be able to load configuration from a file in one of the default locations.
- **AC4.2**: The CLI should be able to load configuration from environment variables.
- **AC4.3**: The CLI should be able to discover/load modes from configured mode source paths.
- **AC4.4**: The CLI should validate the configuration before using it.
- **AC4.5**: The CLI should be able to export the configuration to a file.
- **AC4.6**: A developer should be able to add a new mode by creating a definition file in a configured source path.
- **AC4.7**: A developer should be able to add new modes by updating the mode definition files and adding rule files.

### 5. CLI Interface

- **AC5.1**: The CLI should provide a clear command structure with options and arguments.
- **AC5.2**: The CLI should display help text when the `--help` option is used.
- **AC5.3**: The CLI should display version information when the `--version` option is used.
- **AC5.4**: The CLI should provide feedback on the progress and success/failure of operations.
- **AC5.5**: The CLI should support both interactive and non-interactive modes.
- **AC5.6**: The CLI should handle errors gracefully and display appropriate error messages.
- **AC5.7**: The CLI should suggest solutions for common errors.
- **AC5.8**: The CLI should display debug information when the `DEBUG` environment variable is set.

### 6. Mode Categorization

- **AC6.1**: Mode definitions can be assigned to one or more categories.
- **AC6.2**: Modes display correctly grouped by category in the CLI.
- **AC6.3**: Users can select all modes in a specific category with a single command.
- **AC6.4**: Categories are consistently defined in the configuration.
- **AC6.5**: The CLI properly handles modes without category assignments.
- **AC6.6**: Category hierarchy (parent/child relationships) displays correctly.
- **AC6.7**: Category filtering works in both interactive and non-interactive modes.
- **AC6.8**: Category definitions are extensible to support custom categories.

### 7. Error Handling

- **AC7.1**: When a required file or directory doesn't exist, the CLI should display an appropriate error message.
- **AC7.2**: When a file or directory is not readable or writable, the CLI should display an appropriate error message.
- **AC7.3**: When a configuration file is malformed or invalid, the CLI should display an appropriate error message.
- **AC7.4**: When a user provides invalid input, the CLI should display an appropriate error message and prompt again.
- **AC7.5**: When an operation fails, the CLI should provide a clear error message with details and suggestions.
- **AC7.6**: When an operation fails, the CLI should exit with a non-zero exit code.
- **AC7.7**: When the `--force` option is used, the CLI should display warnings for potentially destructive operations.

### 8. Performance

- **AC8.1**: The CLI should complete initialization within a reasonable time frame (< 30 seconds for typical projects).
- **AC8.2**: The CLI should handle a large number of modes and rules efficiently.
- **AC8.3**: The CLI should minimize memory usage during operation.
- **AC8.4**: The CLI should provide progress indicators for long-running operations.

### 9. Security

- **AC9.1**: The CLI should not modify files outside the target project directory without explicit permission.
- **AC9.2**: The CLI should validate all user inputs to prevent injection attacks.
- **AC9.3**: The CLI should not include sensitive information in logs or error messages.
- **AC9.4**: The CLI should create backups of existing files before overwriting them.