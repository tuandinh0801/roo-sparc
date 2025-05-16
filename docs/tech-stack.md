# Roo Init CLI - Tech Stack

This document outlines the technology stack chosen for the Roo Init CLI tool, focusing on meeting the project requirements for performance, maintainability, cross-platform compatibility, and developer experience.

## Core Platform

- **Runtime:** Node.js
  - **Version:** `^20.12.0` (LTS as of May 2025)
  - **Justification:** Explicitly required by the PRD ([`docs/prd.md:69`](docs/prd.md:69)). Provides a robust, cross-platform environment with a vast ecosystem via npm, suitable for CLI development.

- **Language:** TypeScript
  - **Version:** `^5.4.5` (Latest stable as of May 2025)
  - **Justification:** Offers static typing for improved code quality, maintainability, and developer productivity, especially beneficial for AI agent implementation. Compiles to JavaScript compatible with the target Node.js version.

- **Package Manager:** pnpm
  - **Version:** `^9.1.0` (Latest stable as of May 2025)
  - **Justification:** Efficient disk space usage and faster installs compared to npm/yarn. Enforces stricter dependency management.

## Key Libraries & Frameworks

- **Command-Line Argument Parsing:** `commander`
  - **Version:** `^17.7.2` (Latest stable as of May 2025)
  - **Justification:** Recommended in PRD ([`docs/prd.md:139`](docs/prd.md:139)). Powerful and flexible library for building complex CLI interfaces with commands, options, validation, and help generation.

- **Interactive Prompts:** `inquirer`
  - **Version:** `^9.2.20` (Latest stable as of May 2025, or verify latest)
  - **Justification:** User-friendly, intuitive, and highly customizable prompt system for CLIs. Offers robust features, including an `editor` prompt type suitable for multi-line input, and a good developer experience for complex interactive flows.

- **CLI UI/UX Enhancements:**
  - **`chalk`**:
    - **Version:** `^4.1.2` (Latest stable as of May 2025)
    - **Justification:** Colorful console output for better readability and visual appeal.  
  - **`ora`**:
    - **Version:** `^8.0.1` (Latest stable as of May 2025)
    - **Justification:** Elegant terminal spinners for indicating progress of long-running operations.
  - **`boxen`**:
    - **Version:** `^7.1.1` (Latest stable as of May 2025)
    - **Justification:** Create boxes in the terminal for visually distinct messages (e.g., success, warnings).
  - **`cli-table3`**:
    - **Version:** `^0.6.5` (Latest stable as of May 2025)
    - **Justification:** Render Unicode-based tables on the command line for structured data display (e.g., listing modes).
  - **`gradient-string`**:
    - **Version:** `^2.0.2` (Latest stable as of May 2025)
    - **Justification:** Apply beautiful gradients to terminal text for enhanced visual appeal.

- **File System Operations:** `fs-extra`
  - **Version:** `^11.2.0` (Latest stable as of May 2025)
  - **Justification:** Provides promise-based, robust file system methods (like `ensureDir`, `copy`, `writeJson`) that simplify common tasks like creating directories recursively and handling file copying/writing more reliably than the native `fs` module alone. Helps ensure cross-platform compatibility and error handling.

## Development & Build Tools

- **Linter:** ESLint
  - **Version:** `^9.3.0` (Latest stable as of May 2025)
  - **Configuration:** To be defined in `eslint.config.js`. Will use recommended rulesets for TypeScript (`typescript-eslint`).
  - **Justification:** Enforces code style and identifies potential errors, crucial for maintainability and consistency, especially with AI agent collaboration.

- **Formatter:** @stylistic/eslint-plugin
  - **Version:** `^4.2.0` 
  - **Configuration:** Configured in `eslint.config.js`
  - **Justification:** Ensures consistent code formatting across the project, reducing cognitive load and preventing style debates. Integrates well with ESLint.

- **Testing Framework:** Vitest
  - **Version:** `^1.6.0` [Fixed version]
  - **Configuration:** Utilizes `pool: 'forks'` for better test isolation in an I/O-heavy CLI environment. Global setup files (`setupFiles`) are used for mocks (e.g., in-memory file system with `memfs`, utility mocks).
  - **Justification:** Modern, fast testing framework compatible with TypeScript projects. Offers a Jest-compatible API. Suitable for unit, integration, and E2E tests.
  - **Key Supporting Libraries for Testing:**
    - **`memfs`**: Used for creating a global in-memory file system mock, enabling faster and more reliable file system tests by avoiding actual disk I/O.
    - **`@inquirer/testing`**: Official library for testing Inquirer-based interactive prompts, allowing for realistic simulation of user interactions.

- **TypeScript Compiler:** `tsc` (via TypeScript package)
  - **Justification:** Standard compiler for TypeScript projects. Used to transpile TS source code to JavaScript for execution.

## Internal Data Format

- **Mode/Category/Rule Definitions:** JSON
  - **Justification:** Required by the domain model ([`specs/consolidated_domain_model.md`](../specs/consolidated_domain_model.md)). Easily parsable by Node.js, human-readable, and suitable for bundling within the CLI package.

## Change Log

| Change        | Date       | Version | Description                  | Author         |
| ------------- | ---------- | ------- | ---------------------------- | -------------- |
| Initial draft | 2025-05-12 | 0.1     | Initial tech stack selection | Architect Agent |
| Test Enhancements | 2025-05-15 | 0.2     | Added `memfs` and `@inquirer/testing` to testing tools, noted Vitest `pool: 'forks'` config. | Architect Agent |