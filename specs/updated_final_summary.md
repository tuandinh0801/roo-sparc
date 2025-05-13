# Roo Init CLI Tool - Updated Final Specification Summary

## Project Overview

This specification defines the Roo Init CLI tool, a Node.js application designed to streamline the initialization of development projects. The tool enables users to choose specific modes, grouped by functional categories. It then copies the necessary mode definitions (as a `.roomodes` file) and associated rule files (into a `.roo` directory) to the target project.

A key clarification is that all modes and rules are pre-configured within the CLI's internal structure or discoverable via configured `modeSourcePaths`. End-users select from these available, pre-defined options. Extensibility refers to developers modifying the CLI's internal configurations or adding new mode definition directories, not end-users creating new definitions from scratch via the CLI itself.

## Core Components

The system architecture consists of these primary components:

1.  **CLI Interface Layer**: Handles command parsing, help documentation, interactive prompts, and user input.
2.  **Configuration Manager**: Loads, validates, and manages CLI configuration, including category definitions, and default settings. Supports discovery of modes from specified paths.
3.  **Mode Registry**: A central service that loads all modes from configured/discovered source paths, manages categories, and provides functions to query and retrieve mode information.
4.  **Mode Selection Module**: Enables users to select modes, with support for category-based selection and interactive prompting. Handles pre-selection of any globally recommended modes.
5.  **File Operations Module**: Manages the copying of selected mode definitions into the target project's `.roomodes` file and the copying of associated rule files (both generic and mode-specific) into the `.roo` directory structure. Rule sources are determined from mode definitions or global configuration.

## Key Functional Requirements

### 1. Mode Selection & Categorization
- Users can select modes from the available list.
- A consolidated list of all modes is available.
- Modes are organized and can be selected via functional categories (e.g., Specification, Code, Testing).
- The CLI displays modes grouped by category.
- Any globally recommended modes can be pre-selected.

### 2. Mode Definition & Rule Copying
- Selected modes' definitions are copied to a `.roomodes` file in the target project.
- Associated rules for each selected mode are copied into the target project's `.roo` directory, maintaining structure (`.roo/rules/` for generic, `.roo/rules-[mode_slug]/` for specific).

### 3. User Experience
- Interactive command prompts with clear guidance.
- Help documentation and usage examples.
- Feedback on operation progress and success/failure.

### 4. Configuration & Extensibility (Developer-Focused)
- CLI uses a configuration file (e.g., `roo-init.config.js` or JSON) for defining modes, categories, and paths.
- Supports discovery of additional modes from specified `modeSourcePaths`.
- Developers can add new pre-defined modes by adding them to the configuration or `modeSourcePaths`.

## Edge Cases & Constraints

### Edge Cases
- **Mode slug conflicts**: (if multiple sources define the same slug - this should be a validation error in config or a clear resolution strategy).
- **Missing Definitions**: Graceful handling if mode or rule files are missing from their defined source.
- **File Overwrites**: Requires `--force` flag to overwrite existing `.roomodes` or rule files, with backups created.

### Constraints
- **Node.js Environment**: Requires Node.js v14.x or higher.
- **Pre-defined Nature**: Users select from existing, pre-configured modes.
- **File System Access**: Needs read access to mode and rule source paths and write access to the target project directory.

## Error Handling Strategy
- Input validation for commands, options, and selections.
- Clear, actionable error messages.
- Graceful handling of missing files or malformed configurations.

## Performance Considerations
- Efficient loading and parsing of mode definitions.
- Responsive interactive prompts.

## Testing Strategy
- Unit tests for individual modules (config loading, mode registry, file operations).
- Integration tests for CLI command execution flows.
- E2E tests simulating user interaction for project initialization.
- Tests covering mode selection, categorization, and rule copying.

## Glossary
- **Mode**: A pre-defined role or function, with associated definitions and rules.
- **Rule**: A pre-defined guideline or constraint file associated with a mode.
- **Category**: A functional grouping for modes to aid discovery and selection.
- **Mode Registry**: An in-memory collection of all available modes, indexed for efficient lookup.

## Conclusion
This updated specification outlines a CLI tool focused on initializing projects by selecting from a rich set of pre-defined modes and rules, organized by categories. The introduction of mode selection and categorization enhances flexibility and user experience, allowing developers to precisely tailor their project setup from a curated collection of development patterns. The clear distinction that users *select* from pre-defined elements, rather than *create* them via the CLI, focuses the tool on efficient setup and configuration based on established best practices embedded within the provided mode definitions and rule sets.