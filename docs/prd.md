# Roo Init CLI Tool Product Requirements Document (PRD)

## Intro

The Roo Init CLI tool aims to solve the common problem of manual, error-prone, and time-consuming project setup. It provides a streamlined and standardized way for developers to initialize new or existing software projects by selecting predefined 'modes' (which bundle configurations and custom instructions) and associated 'rules' (markdown guideline files). The tool will automate the copying of selected mode definitions into a `.roomodes` JSON file and their corresponding rule files into a standardized `.roo` directory structure within the target project. This empowers developers with a rapid, reliable method for bootstrapping projects with best-practice configurations, reducing setup overhead and promoting consistency.

## Goals and Context

- **Project Objectives:**
    - Enable users to discover and select predefined 'modes' (and their associated 'rules') via a CLI.
    - Reliably copy selected mode definitions into a `.roomodes` JSON file in the target project.
    - Accurately copy all rules associated with selected modes into the correct `.roo/rules-[mode_slug]/` and `.roo/rules/` directory structure.
    - Support interactive (user-prompted) mode of operation.
    - Allow modes to be organized and selected via categories.
- **Measurable Outcomes:**
    - Number of successful project initializations via the CLI.
    - Average time saved for project initialization compared to manual setup.
    - User satisfaction ratings.
    - Number and variety of unique modes/categories utilized.
    - Reduction in project setup-related support requests or configuration errors.
- **Success Criteria:**
    - All MVP functional requirements are implemented, tested, and operational.
    - The CLI tool is demonstrably faster and more reliable than manual project setup for defined use cases.
    - Positive user feedback indicates ease of use and value.
    - Consistent adoption by the target audience.
- **Key Performance Indicators (KPIs):**
    - Weekly/monthly project initializations.
    - Average project setup time using CLI.
    - User satisfaction score (e.g., from an optional survey).
    - Count of distinct modes/categories used over time.
    - Percentage decrease in setup-related errors/support tickets.

## Scope and Requirements (MVP / Current Version)

### Functional Requirements (High-Level)

- **Mode Discovery & Selection:**
    - List all available modes, grouped by category.
    - Allow selection of individual modes by their unique slug.
    - Allow selection of all modes within one or more specified categories.
- **File Generation & Copying:**
    - Create or update a `.roomodes` JSON file in the target project directory with the definitions of selected modes.
    - Create the `.roo` directory structure (e.g., `.roo/rules/`, `.roo/rules-[mode_slug]/`) in the target project if it doesn't exist.
    - Copy mode-specific rule files (e.g., `*.md`) to the corresponding `.roo/rules-[mode_slug]/` directory.
    - Copy generic rule files (e.g., `*.md`) to the `.roo/rules/` directory.
- **CLI Operations:**
    - Interactive mode: Guide users through mode discovery and selection via prompts.
    - Standard CLI commands: `--help` (usage instructions) and `--version` (CLI version).
    - Overwrite protection: `--force` option to allow overwriting of existing files/configurations.
- **Feedback & Error Handling:**
    - Provide clear progress messages during initialization.
    - Display informative error messages for invalid selections, file system issues, missing mode/rule definitions, or configuration problems.

### Non-Functional Requirements (NFRs)

- **Performance:** Project initialization should complete within 30 seconds for typical projects with a moderate number of modes/rules.
- **Scalability:** The CLI should be designed to efficiently handle a growing number of modes, categories, and rule files without significant performance degradation.
- **Reliability/Availability:** The tool must reliably perform file operations and handle predefined modes/rules consistently. Robust error handling for file system operations and invalid configurations is required.
- **Security:** While primarily a local development tool, ensure secure file handling practices (e.g., path validation). No sensitive data is processed beyond mode/rule definitions.
- **Maintainability:**
    - Code should be well-structured, documented, and easy to understand.
    - Strive for minimal external dependencies.
    - The system for defining and managing modes, categories, and rules (internal to the CLI package) should be clear and extensible.
- **Usability/Accessibility:**
    - The CLI must be intuitive for developers.
    - Interactive mode should be user-friendly with clear prompts.
    - Error messages and feedback must be clear and actionable.
- **Other Constraints:**
    - **Implementation Language:** Node.js.
    - **Node.js Version:** Compatible with Node.js v20.x and above.
    - **Platform Compatibility:** Cross-platform (Windows, macOS, Linux).

### User Experience (UX) Requirements (High-Level)

- The CLI should provide a smooth and efficient experience for developers.
- Interactive mode should make mode discovery and selection easy for new users.
- Users should receive clear confirmation of successful operations and understandable guidance when errors occur.

### Integration Requirements (High-Level)

- The tool primarily interacts with the local file system of the target project directory.
- No external service integrations are required for the MVP.

### Testing Requirements (High-Level)

- Comprehensive unit tests for individual modules (argument parsing, mode loading, file operations).
- Integration tests for CLI command execution with various flag combinations.
- End-to-end tests simulating user scenarios and verifying file system state changes in a controlled environment.
- _(Detailed testing strategy to be documented in [`docs/testing-strategy.md`](docs/testing-strategy.md))_

## Epic Overview (MVP / Current Version)

- **Epic 1: Core CLI Framework & Mode/Rule Definition Loading.**
  - Goal: Establish the basic CLI application structure, command-line argument parsing (for help, version), and the internal mechanisms for loading and accessing predefined mode and rule definitions.
- **Epic 2: Interactive Mode Operations & Core File Generation.**
  - Goal: Implement the interactive user prompting system for discovering and selecting modes (individually and by category), and the core logic to generate the `.roomodes` file and copy associated rule files to the target project's `.roo` directory structure.

## Key Reference Documents

- [`docs/project-brief-roo-init-cli.md`](docs/project-brief-roo-init-cli.md)
- [`docs/architecture.md`](docs/architecture.md) (to be created)
- [`docs/epic1.md`](docs/epic1.md) (to be created)
- [`docs/epic2.md`](docs/epic2.md) (to be created)
- [`docs/tech-stack.md`](docs/tech-stack.md) (to be created)
- [`docs/testing-strategy.md`](docs/testing-strategy.md) (to be created)
- [`specs/consolidated_domain_model.md`](../specs/consolidated_domain_model.md)
- [`specs/consolidated_requirements_and_criteria.md`](../specs/consolidated_requirements_and_criteria.md)

## Post-MVP / Future Enhancements

- Support for mode dependencies (where one mode might require another).
- A plugin system for users or teams to define and use custom modes and rules.
- "Dry-run" mode to preview changes before applying them.
- Functionality to update an existing project with new or changed modes/rules.
- Integration with version control systems (e.g., perform an initial commit after setup).
- More sophisticated state management if the tool evolves to manage ongoing project configurations.

## Change Log

| Change        | Date       | Version | Description                  | Author         |
| ------------- | ---------- | ------- | ---------------------------- | -------------- |
| Initial Draft | 2025-05-12 | 0.1.0   | First draft of PRD based on Project Brief. | Product Manager |
| Scope Update  | 2025-05-12 | 0.1.1   | Removed non-interactive mode from MVP scope. | Product Manager |

## Initial Architect Prompt

### Technical Infrastructure

- **Starter Project/Template:** To be determined; consider standard Node.js CLI project scaffolding if available, otherwise create from scratch.
- **Hosting/Cloud Provider:** N/A (local CLI tool).
- **Frontend Platform:** N/A (CLI tool).
- **Backend Platform:** Node.js.
- **Database Requirements:** N/A. Mode and rule definitions will be packaged with the CLI (e.g., as JSON or other structured files) and read from the file system.

### Technical Constraints

- Must be implemented in Node.js (v20.x+).
- Must be cross-platform (Windows, macOS, Linux).
- Strive for minimal external dependencies. Choose well-maintained and lightweight libraries for argument parsing (e.g., `commander`, `commander`) and interactive prompts (e.g., `inquirer`).
- The internal data structures for modes, rules, and categories must be compatible with the definitions in [`specs/consolidated_domain_model.md`](../specs/consolidated_domain_model.md).
- File system operations must be robust, handling path resolutions, permissions gracefully (where possible), and providing clear errors.

### Deployment Considerations

- The CLI tool will likely be distributed as an npm package for easy installation (`npm install -g roo-init` or similar).
- Semantic versioning should be used for releases.
- Consider a build process if transpilation (e.g., TypeScript to JavaScript) is involved.

### Local Development & Testing Requirements

- The development environment for the CLI tool itself should be easy to set up.
- A comprehensive test suite is required, including unit, integration, and end-to-end tests.
- Mocking of file system interactions or using temporary directories will be necessary for reliable testing of file generation and copying logic.
- Enable easy local execution of the CLI for development and testing (e.g., via `npm link` or direct script execution).

### Other Technical Considerations

- **Performance:** Ensure initialization completes within 30 seconds for typical scenarios. Optimize file reading and writing.
- **Scalability:** Design data structures and loading mechanisms for modes/rules to perform well even with a large number of definitions.
- **Error Handling:** Implement a centralized error handling strategy. User-facing errors should be clear and actionable. Log more detailed errors for debugging.
- **File System Interaction:** Carefully manage file paths, especially cross-platform. Handle cases like existing files/directories (with/without `--force`), and permissions issues.
- **Configuration Management (Internal):** How will the CLI locate and load its predefined modes and rules? They will be bundled with the application.
- **Modularity:** Structure the codebase into logical modules (e.g., command parsing, mode selection logic, file operations, interactive prompts).