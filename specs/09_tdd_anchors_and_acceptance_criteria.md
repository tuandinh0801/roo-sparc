# Roo Init CLI Tool - TDD Anchors and Acceptance Criteria

This document maps the TDD anchors from the pseudocode to the functional requirements and provides acceptance criteria for validation.

## TDD Anchors to Requirements Mapping

### 1. Workflow Selection (FR1.1, FR1.2, FR1.3, FR1.4)

| TDD Anchor | Requirement | Module |
|------------|-------------|--------|
| Should load workflow definitions from configuration | FR1.2 | Workflow |
| Should validate each workflow definition | FR1.4 | Workflow |
| Should return populated workflow definitions | FR1.3 | Workflow |
| Should use provided workflow ID if valid | FR1.1 | Workflow |
| Should use default workflow if available and no specific ID provided | FR1.1 | Workflow |
| Should prompt for workflow selection in interactive mode | FR1.3 | Workflow |
| Should throw error if workflow not found in non-interactive mode | FR1.4 | Workflow |
| Should display available workflows | FR1.3 | Workflow |
| Should format workflow list with numbers | FR1.3 | Workflow |
| Should prompt for selection | FR1.1 | Workflow |
| Should return selected workflow | FR1.1 | Workflow |

### 2. Mode Selection (FR2.1, FR2.2, FR2.3, FR2.4, FR2.5)

| TDD Anchor | Requirement | Module |
|------------|-------------|--------|
| Should load workflow details with available modes | FR2.3 | Mode |
| Should handle no available modes | FR2.3 | Mode |
| Should pre-select core modes | FR2.2 | Mode |
| Should validate provided mode slugs if any | FR2.4 | Mode |
| Should validate each provided mode slug | FR2.4 | Mode |
| Should ensure core modes are included | FR2.2 | Mode |
| Should return selected modes | FR2.1, FR2.5 | Mode |
| Should prompt for mode selection in interactive mode | FR2.1, FR2.5 | Mode |
| Should return pre-selected modes in non-interactive mode | FR2.2 | Mode |
| Should include all core modes | FR2.2 | Mode |
| Should include recommended modes | FR2.2 | Mode |
| Should return mode objects for pre-selected slugs | FR2.2 | Mode |
| Should validate each mode slug exists | FR2.4 | Mode |
| Should throw error if mode not found | FR2.4 | Mode |
| Should check each core mode is included | FR2.2 | Mode |
| Should throw error if core mode not included and force is false | FR2.2 | Mode |
| Should log warning if force is true | FR2.2 | Mode |
| Should return array of mode objects | FR2.1, FR2.5 | Mode |
| Should maintain order of selection | FR2.5 | Mode |
| Should display available modes with descriptions | FR2.3 | Mode |
| Should mark core modes | FR2.2 | Mode |
| Should show pre-selected modes | FR2.2 | Mode |
| Should prompt for additional modes | FR2.1, FR2.5 | Mode |
| Should combine pre-selected and user-selected modes | FR2.1, FR2.2, FR2.5 | Mode |
| Should return combined mode objects | FR2.1, FR2.2, FR2.5 | Mode |

### 3. Mode Definition Copying (FR3.1, FR3.2, FR3.3, FR3.4)

| TDD Anchor | Requirement | Module |
|------------|-------------|--------|
| Should create target .roomodes file path | FR3.3 | File Operations |
| Should check if .roomodes file already exists | FR3.4 | File Operations |
| Should create .roomodes content with selected modes | FR3.1, FR3.2 | File Operations |
| Should write .roomodes file | FR3.1, FR3.3 | File Operations |
| Should log success message | FR3.1 | File Operations |
| Should create valid JSON structure | FR3.2 | File Operations |
| Should add each mode to customModes array | FR3.1, FR3.2 | File Operations |
| Should return formatted JSON string | FR3.2 | File Operations |

### 4. Rule Copying (FR4.1, FR4.2, FR4.3, FR4.4, FR4.5)

| TDD Anchor | Requirement | Module |
|------------|-------------|--------|
| Should create target .roo directory | FR4.4 | File Operations |
| Should create target .roo directory if it doesn't exist | FR4.4 | File Operations |
| Should copy generic workflow rules | FR4.1, FR4.3 | File Operations |
| Should copy mode-specific rules for each selected mode | FR4.1, FR4.2 | File Operations |
| Should log success message | FR4.1 | File Operations |
| Should create source rules path | FR4.3 | File Operations |
| Should check if source rules directory exists | FR4.3 | File Operations |
| Should create target rules directory | FR4.4 | File Operations |
| Should create target rules directory if it doesn't exist | FR4.4 | File Operations |
| Should copy all files from source to target | FR4.1, FR4.5 | File Operations |
| Should create source mode-specific rules path | FR4.2 | File Operations |
| Should check if source mode-specific rules directory exists | FR4.2 | File Operations |
| Should create target mode-specific rules directory | FR4.4 | File Operations |
| Should create target mode-specific rules directory if it doesn't exist | FR4.4 | File Operations |
| Should get list of files in source directory | FR4.1, FR4.5 | File Operations |
| Should copy each file | FR4.1 | File Operations |
| Should handle directories recursively | FR4.5 | File Operations |
| Should create target directory if it doesn't exist | FR4.4 | File Operations |
| Should copy directory contents recursively | FR4.5 | File Operations |
| Should check if target file already exists | FR4.1 | File Operations |
| Should copy file | FR4.1 | File Operations |

### 5. Extensibility (FR5.1, FR5.2, FR5.3, FR5.4)

| TDD Anchor | Requirement | Module |
|------------|-------------|--------|
| Should try to load from default locations | FR5.2 | Configuration |
| Should try each path in order | FR5.2 | Configuration |
| Should load and parse configuration file | FR5.2 | Configuration |
| Should use default configuration if no file found | FR5.2 | Configuration |
| Should handle different file extensions | FR5.2 | Configuration |
| Should load JavaScript module | FR5.2 | Configuration |
| Should load and parse JSON file | FR5.2 | Configuration |
| Should provide sensible defaults | FR5.2 | Configuration |
| Should validate configuration structure | FR5.2 | Configuration |
| Should validate workflows property | FR5.2 | Configuration |
| Should validate at least one workflow exists | FR5.2 | Configuration |
| Should validate each workflow | FR5.2 | Configuration |
| Should validate defaultWorkflow if specified | FR5.2 | Configuration |
| Should validate required properties | FR5.2 | Configuration |
| Should validate sourcePath exists | FR5.2 | Configuration |
| Should validate modesPath if provided | FR5.2 | Configuration |
| Should validate rulesPath if provided | FR5.2 | Configuration |
| Should validate coreModes is an array if provided | FR5.2 | Configuration |
| Should validate recommendedModes is an array if provided | FR5.2 | Configuration |
| Should resolve workflowsPath if provided | FR5.2 | Configuration |
| Should resolve paths for each workflow | FR5.2 | Configuration |
| Should resolve sourcePath | FR5.2 | Configuration |
| Should resolve modesPath if provided | FR5.2 | Configuration |
| Should set default modesPath based on sourcePath | FR5.2 | Configuration |
| Should resolve rulesPath if provided | FR5.2 | Configuration |
| Should set default rulesPath based on sourcePath | FR5.2 | Configuration |
| Should return absolute path unchanged | FR5.2 | Configuration |
| Should resolve relative path to absolute | FR5.2 | Configuration |
| Should override config with environment variables | FR5.2 | Configuration |
| Should handle ROO_INIT_DEFAULT_WORKFLOW | FR5.2 | Configuration |
| Should handle ROO_INIT_INTERACTIVE_MODE | FR5.2 | Configuration |
| Should handle ROO_INIT_WORKFLOWS_PATH | FR5.2 | Configuration |
| Should check if workflowsPath exists | FR5.1, FR5.3 | Configuration |
| Should scan directories in workflowsPath | FR5.1, FR5.3 | Configuration |
| Should check each directory for workflow structure | FR5.1, FR5.3 | Configuration |
| Should check for .roomodes file | FR5.1, FR5.3 | Configuration |
| Should check for .roo directory | FR5.1, FR5.3 | Configuration |
| Should add discovered workflow to config | FR5.1, FR5.3, FR5.4 | Configuration |
| Should return only directories | FR5.1, FR5.3 | Configuration |
| Should validate configuration before export | FR5.2 | Configuration |
| Should format configuration as JSON | FR5.2 | Configuration |
| Should write to specified file | FR5.2 | Configuration |

### 6. CLI Interface (FR6.1, FR6.2, FR6.3, FR6.4)

| TDD Anchor | Requirement | Module |
|------------|-------------|--------|
| Should parse command-line arguments correctly | FR6.1 | Main CLI |
| Should display help text when --help flag is provided | FR6.2 | Main CLI |
| Should display version when --version flag is provided | FR6.2 | Main CLI |
| Should load configuration successfully | FR6.1 | Main CLI |
| Should validate configuration | FR6.1 | Main CLI |
| Should determine operation mode correctly | FR6.4 | Main CLI |
| Should execute the init command successfully | FR6.1 | Main CLI |
| Should handle unknown commands with appropriate error | FR6.1 | Main CLI |
| Should display success message on completion | FR6.3 | Main CLI |
| Should handle errors gracefully and display appropriate error message | FR6.3 | Main CLI |
| Should parse command correctly | FR6.1 | Main CLI |
| Should parse options with values correctly | FR6.1 | Main CLI |
| Should handle --help flag | FR6.2 | Main CLI |
| Should handle --version flag | FR6.2 | Main CLI |
| Should parse --workflow option correctly | FR6.1 | Main CLI |
| Should parse --modes option correctly | FR6.1 | Main CLI |
| Should parse --target-dir option correctly | FR6.1 | Main CLI |
| Should parse --interactive flag correctly | FR6.4 | Main CLI |
| Should parse --non-interactive flag correctly | FR6.4 | Main CLI |
| Should parse --force flag correctly | FR6.1 | Main CLI |
| Should display command structure and options | FR6.2 | Main CLI |
| Should display correct version from package.json | FR6.2 | Main CLI |
| Should use explicit option if provided | FR6.4 | Main CLI |
| Should fall back to configuration default | FR6.4 | Main CLI |
| Should handle workflow selection correctly | FR6.1 | Main CLI |
| Should handle mode selection correctly | FR6.1 | Main CLI |
| Should validate target directory | FR6.1 | Main CLI |
| Should copy mode definitions successfully | FR6.1 | Main CLI |
| Should copy rule files successfully | FR6.1 | Main CLI |
| Should display error message with appropriate formatting | FR6.3 | Main CLI |
| Should display additional details if available | FR6.3 | Main CLI |
| Should suggest solutions for common errors | FR6.3 | Main CLI |
| Should display debug information in verbose mode | FR6.3 | Main CLI |
| Should provide helpful suggestions for known error codes | FR6.3 | Main CLI |
| Should display appropriate success message | FR6.3 | Main CLI |

## Acceptance Criteria

### 1. Workflow Selection

- **AC1.1**: When the CLI is run without arguments, it should display a list of available workflows and prompt the user to select one.
- **AC1.2**: When the CLI is run with a valid workflow name using the `--workflow` option, it should use that workflow without prompting.
- **AC1.3**: When the CLI is run with an invalid workflow name, it should display an appropriate error message.
- **AC1.4**: When no workflows are available, the CLI should display an appropriate error message.
- **AC1.5**: When a default workflow is configured and no workflow is specified, the CLI should use the default workflow.

### 2. Mode Selection

- **AC2.1**: When a workflow is selected, the CLI should display a list of available modes for that workflow.
- **AC2.2**: Core modes for the selected workflow should be pre-selected.
- **AC2.3**: The user should be able to select additional modes beyond the pre-selected core modes.
- **AC2.4**: The user should not be able to deselect core modes unless the `--force` option is used.
- **AC2.5**: When the CLI is run with a list of modes using the `--modes` option, it should use those modes without prompting.
- **AC2.6**: When the CLI is run with an invalid mode name, it should display an appropriate error message.
- **AC2.7**: When no modes are available for a workflow, the CLI should display an appropriate error message.

### 3. Mode Definition Copying

- **AC3.1**: The CLI should create a `.roomodes` file in the target project with the selected modes.
- **AC3.2**: The `.roomodes` file should contain valid JSON with a `customModes` array.
- **AC3.3**: Each mode in the `customModes` array should have the required properties: `slug`, `name`, `roleDefinition`, `customInstructions`, `groups`, and `source`.
- **AC3.4**: If a `.roomodes` file already exists in the target project, the CLI should not overwrite it unless the `--force` option is used.
- **AC3.5**: The CLI should display a success message after copying the mode definitions.

### 4. Rule Copying

- **AC4.1**: The CLI should create a `.roo` directory in the target project if it doesn't exist.
- **AC4.2**: The CLI should copy generic workflow rules to the `.roo/rules` directory.
- **AC4.3**: The CLI should copy mode-specific rules to the `.roo/rules-[mode_slug]` directories.
- **AC4.4**: The CLI should preserve the directory structure of the rules when copying.
- **AC4.5**: If rule files already exist in the target project, the CLI should not overwrite them unless the `--force` option is used.
- **AC4.6**: The CLI should display a success message after copying the rule files.
- **AC4.7**: If a source rules directory doesn't exist, the CLI should display a warning but continue with the operation.

### 5. Extensibility

- **AC5.1**: The CLI should be able to load configuration from a file in one of the default locations.
- **AC5.2**: The CLI should be able to load configuration from environment variables.
- **AC5.3**: The CLI should be able to discover workflows in the configured workflows path.
- **AC5.4**: The CLI should validate the configuration before using it.
- **AC5.5**: The CLI should be able to export the configuration to a file.
- **AC5.6**: A developer should be able to add a new workflow by creating a directory with the required structure in the workflows path.
- **AC5.7**: A developer should be able to add new modes to an existing workflow by updating the `.roomodes` file and adding rule files.

### 6. CLI Interface

- **AC6.1**: The CLI should provide a clear command structure with options and arguments.
- **AC6.2**: The CLI should display help text when the `--help` option is used.
- **AC6.3**: The CLI should display version information when the `--version` option is used.
- **AC6.4**: The CLI should provide feedback on the progress and success/failure of operations.
- **AC6.5**: The CLI should support both interactive and non-interactive modes.
- **AC6.6**: The CLI should handle errors gracefully and display appropriate error messages.
- **AC6.7**: The CLI should suggest solutions for common errors.
- **AC6.8**: The CLI should display debug information when the `DEBUG` environment variable is set.

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
- **AC8.2**: The CLI should handle large workflows with many modes and rules efficiently.
- **AC8.3**: The CLI should minimize memory usage during operation.
- **AC8.4**: The CLI should provide progress indicators for long-running operations.

### 9. Security

- **AC9.1**: The CLI should not modify files outside the target project directory without explicit permission.
- **AC9.2**: The CLI should validate all user inputs to prevent injection attacks.
- **AC9.3**: The CLI should not include sensitive information in logs or error messages.
- **AC9.4**: The CLI should create backups of existing files before overwriting them.