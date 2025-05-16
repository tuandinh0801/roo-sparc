# Roo Init CLI - Testing Strategy

This document outlines the strategy for testing the Roo Init CLI tool to ensure its correctness, reliability, and robustness.

## Guiding Principles

- **Confidence:** Tests should provide high confidence that the CLI works as expected for its core functionalities. Unit tests verify individual components, while E2E tests ensure overall application behavior and service orchestration.
- **Automation:** Prioritize automated tests that can be run easily and frequently (e.g., in CI).
- **Clarity:** Tests should be easy to understand, maintain, and debug. Test names should clearly describe the scenario being tested.
- **Isolation (Unit Tests):** Unit tests should focus on individual components, mocking dependencies.
- **Realism (E2E Tests):** End-to-end tests should simulate actual user workflows as closely as possible, verifying the complete application flow and interactions between services as orchestrated by command handlers.

## Testing Levels & Scope

The testing strategy will focus on two primary levels:

1.  **Unit Tests (`tests/unit/**/*.test.ts`)**
    - **Purpose:** Verify the logic of individual functions, methods, and classes in isolation, primarily focusing on core services and utilities.
    - **Scope:**
        - Core services ([`src/core/`](src/core/:0)): `DefinitionLoader` (parsing valid/invalid JSON, locating files), `ModeSelector` (logic for resolving modes from flags, handling interactive choices - `inquirer` interactions are tested more deeply at the `UIManager` level), `FileManager` (logic for determining target paths, checking force flag - `fs-extra` is globally mocked by `memfs`).
        - Utilities ([`src/utils/`](src/utils/:0)): `errorHandler` (with `handleError` globally mocked), `logger` formatting functions, `UIManager` methods (testing specific prompt configurations with `@inquirer/testing`).
        - Isolated helper functions or pure logic within command handlers ([`src/commands/`](src/commands/:0)) if they can be tested without extensive service mocking. The overall orchestration performed by command handlers is covered by E2E tests.
    - **Tools:** Vitest (`vi.fn`, `vi.mock`, `vi.spyOn`), `@inquirer/testing` for `UIManager` prompt tests.
    - **Location:** [`tests/unit/`](tests/unit/:0) mirroring `src/` structure (e.g., `tests/unit/core/DefinitionLoader.test.ts`, `tests/utils/uiManager.inquirer.test.ts`).
    - **Focus:** Logic correctness, edge cases, handling of different inputs, validation logic within individual components.

2.  **End-to-End (E2E) Tests (`tests/e2e/**/*.test.ts`)**
    - **Purpose:** Verify the complete user workflow by running the compiled CLI executable against a controlled environment, interacting with it as a user would. This level is also responsible for ensuring correct orchestration of services by command handlers.
    - **Scope:**
        - Running `node ./bin/roo-init.js --help` and `--version` and asserting console output.
        - Running `node ./dist/src/cli.js` (interactive mode using the centralized `runCli` helper from [`tests/utils/cliTestRunner.ts`](tests/utils/cliTestRunner.ts:0)): Simulating user input for `inquirer` prompts can be challenging in pure E2E; focus is on flows where prompts can be bypassed by flags or where default answers from mocked `UIManager` (if E2E uses a test-specific setup that doesn't fully isolate from global mocks) are sufficient. For deep interactive testing, `UIManager` unit tests with `@inquirer/testing` are preferred. Assert final console output and the state of a temporary target directory (created via `tmpdir-fixture.ts`).
        - Running `node ./dist/src/cli.js --modes <...>` / `--category <...>` (non-interactive using `runCli`): Execute with various flags. Assert console output and state of the temporary target directory. These tests will implicitly cover the correct orchestration of `DefinitionLoader`, `ModeSelector`, and `FileManager` by the `init` command handler.
        - Testing `--force` flag: Use `runCli` targeting a pre-populated temporary directory.
        - Testing error conditions: Use `runCli` for commands designed to fail. Assert error messages and non-zero exit codes.
        - Testing `manage` subcommands: Similar to the `init` command, E2E tests will cover the full flow of `manage` commands (e.g., `manage add mode`, `manage list categories`), thereby testing the orchestration of services by their respective command handlers. This includes verifying interactions with the user's global configuration directory.
    - **Tools:** Vitest (as test runner). Centralized `runCli` helper ([`tests/utils/cliTestRunner.ts`](tests/utils/cliTestRunner.ts:0)) using `execa`. `tmpdir-fixture.ts` for isolated temporary directories. `memfs` (via `vol`) for asserting file system state within the temporary directory.
    - **Location:** [`tests/e2e/`](tests/e2e/:0).
    - **Focus:** Simulating real user interaction via the command line, verifying final file system state changes, checking console output (stdout/stderr) and exit codes. **Critically, E2E tests ensure that command handlers correctly orchestrate interactions between core services (e.g., `DefinitionLoader`, `ModeSelector`, `FileManager`, `UiManager`) to produce the expected outcome.**

## Testing Environment & Infrastructure

- **Test Runner:** Vitest ([`vitest.config.ts`](vitest.config.ts:0)).
  - Configured with `pool: 'forks'` for better isolation.
  - Discovers tests in `tests/unit` and `tests/e2e`.
  - Utilizes `setupFiles` (e.g., [`tests/setup/memfs-setup.ts`](tests/setup/memfs-setup.ts:0), [`tests/setup/globalUtilityMocks.ts`](tests/setup/globalUtilityMocks.ts:0)) for global test environment initialization, including in-memory file system and common utility mocks valuable for both unit and E2E test setup.
- **CI/CD:** Tests (unit and E2E) are executed automatically in a CI pipeline. The build step (`tsc` and asset copying) must run before E2E tests.
- **Mocking:**
  - **Global File System Mock:** `memfs` is used via [`tests/setup/memfs-setup.ts`](tests/setup/memfs-setup.ts:0) to mock `node:fs` and `fs-extra` globally. Tests interact with the in-memory file system via `vol` or by using application code that internally uses the mocked FS modules.
  - **Global Utility Mocks:** Common utilities like `UIManager` and `errorHandler.handleError` are mocked globally via [`tests/setup/globalUtilityMocks.ts`](tests/setup/globalUtilityMocks.ts:0), providing default mock behaviors and exported spies for test-specific assertions or overrides. These are primarily leveraged by unit tests.
  - **Local Mocks:** Vitest's `vi.mock`, `vi.spyOn` are used for specific dependencies in unit tests not covered by global mocks or when a test needs unique behavior.
  - **Interactive Prompts:** `@inquirer/testing` is used for detailed unit testing of `UIManager` methods that involve `inquirer` prompts.
- **Temporary Directories & Fixtures:**
  - E2E tests leverage `tmpdir-fixture.ts` ([`tests/fixtures/tmpdir-fixture.ts`](tests/fixtures/tmpdir-fixture.ts:0)) which uses Vitest's `test.extend` to provide an isolated temporary directory for each test.
- **Shared Test Utilities:**
  - **CLI Runner:** A centralized `runCli` function in [`tests/utils/cliTestRunner.ts`](tests/utils/cliTestRunner.ts:0) using `execa` for executing the CLI in E2E tests.
  - **Test Data Factories:** Reusable functions in [`tests/fixtures/test-data-factory.ts`](tests/fixtures/test-data-factory.ts:0) (or `tests/utils/testDataFactories.ts`) for creating mock domain objects (modes, categories, rules), useful for both unit test setup and preparing state for E2E tests.
- **Coverage Reports:** Vitest is configured to generate coverage reports (LCOV, text summary). Thresholds are set in [`vitest.config.ts`](vitest.config.ts:0).

## Key Scenarios to Cover (Examples)

- **Epic 1:**
    - Unit: `DefinitionLoader` parses valid/invalid `modes.json`/`categories.json`.
    - Unit: `DefinitionLoader` correctly identifies generic vs. specific rule paths.
    - E2E: `roo-init --help` shows usage text containing command description.
    - E2E: `roo-init --version` shows version from `package.json`.
    - E2E: `roo-init --invalid-flag` shows error and suggests help.
- **Epic 2:**
    - Unit: `ModeSelector` correctly processes mocked `inquirer` answers for category/mode selection.
    - Unit: `FileManager` calculates correct target paths for generic/specific rules.
    - Unit: `FileManager` respects `--force` flag logic (mocking `fs.existsSync`).
    - E2E: `init` command (non-interactive and interactive flows) correctly calls and orchestrates `ModeSelector`, `DefinitionLoader`, and `FileManager` to produce the correct `.roomodes` and rule files in a temp dir.
    - E2E: Interactive flow (simulated input or flag-driven) creates correct `.roomodes` and rule files in a temp dir.
    - E2E: Interactive flow fails with specific error message if `.roomodes` exists without `--force`.
    - E2E: Interactive flow fails with specific error message listing conflicting rule files without `--force`.
    - E2E: Interactive flow overwrites existing files when `--force` is used.
    - E2E: Handling user abort (Ctrl+C during prompts) results in non-zero exit code and message.
    - E2E: Handling file system permission errors (if simulatable) results in error message and non-zero exit code.
    - E2E: Successful run prints confirmation message.

- **Epic 4: User-Defined Custom Mode & Category Management**
    - Unit: `DefinitionLoader` correctly loads and merges system definitions with user-global definitions from `~/.config/roo-init/user-definitions.json`.
    - Unit: `DefinitionLoader` correctly applies precedence (user-global over system) for conflicting slugs.
    - Unit: `FileManager` correctly calculates paths and performs CRUD operations on files within `~/.config/roo-init/` (both `user-definitions.json` and rule files in `~/.config/roo-init/rules/[custom_mode_slug]/`).
    - Unit: Validation logic within `manage` command handlers for unique custom slugs, field requirements (if this logic is isolated and testable at unit level).
    - E2E: `manage add mode` command correctly interacts with `UiManager`, `DefinitionLoader`, and `FileManager` (orchestration testing). This includes verifying prompts (where feasible via flags or limited interaction) and the creation/update of global user configuration files.
    - E2E: `manage add category` command similar to above, testing service orchestration.
    - E2E: `manage list modes/categories` commands correctly use `DefinitionLoader` and `UiManager` to display system, custom, or all definitions, verifying the orchestration.
    - E2E: `manage edit mode/category` commands correctly load existing custom defs, prompt for changes, and save updates via `FileManager`, verifying orchestration.
    - E2E: `manage delete mode/category` commands correctly remove definitions from `user-definitions.json` and associated rule files/directories via `FileManager`, verifying orchestration.
    - E2E: Full interactive flow for `roo-init manage add mode` (simulated `inquirer` input, including editor, or flag-driven variations):
        - Verify prompts for all fields (to the extent possible in E2E, with detailed prompt testing at `UIManager` unit level).
        - Verify `user-definitions.json` is created/updated correctly in a temporary global config dir.
        - Verify rule files are created with correct content in the temporary global config dir.
    - E2E: Full interactive flow for `roo-init manage add category`.
    - E2E: `roo-init manage list modes --source=custom/system/all` displays correct output.
    - E2E: `roo-init manage list categories --source=custom/system/all` displays correct output.
    - E2E: Full interactive flow for `roo-init manage edit mode <slug>` including adding, editing (content and metadata), and deleting rules. Verify changes in temporary global config.
    - E2E: Full interactive flow for `roo-init manage edit category <slug>`.
    - E2E: `roo-init manage delete mode <slug>` (with confirmation) removes mode and its rules from temporary global config.
    - E2E: `roo-init manage delete category <slug>` (with confirmation) removes category and updates referencing modes in temporary global config.
    - E2E: Error handling for `manage` commands (e.g., non-existent slug for edit/delete, attempting to add duplicate custom slug, invalid input during prompts).
    - E2E: `roo-init` (main init command) correctly lists and allows selection of merged system + custom modes (respecting precedence) when a temporary global config with custom modes is present. This verifies the orchestration involving merged definitions.
    - E2E: `roo-init` correctly copies rule files from both system bundle and temporary global custom rule locations to the target project (verified using `memfs` and `tmpdir-fixture.ts`). This also verifies orchestration.

## Test Setup Enhancements

The testing strategy has been significantly enhanced by incorporating several advanced practices, supporting a robust Unit + E2E approach:

- **Centralized In-Memory File System:** `memfs` is globally configured via `setupFiles` ([`tests/setup/memfs-setup.ts`](tests/setup/memfs-setup.ts:0)) to mock all `node:fs` and `fs-extra` operations. This provides fast, isolated, and reliable file system testing without actual disk I/O. Tests interact with this via `vol` or through the application's file operations.
- **Global Utility Mocks:** Commonly used utilities like `UIManager` and `errorHandler.handleError` are mocked globally in `setupFiles` ([`tests/setup/globalUtilityMocks.ts`](tests/setup/globalUtilityMocks.ts:0)). This reduces boilerplate in individual tests and ensures consistent mock behavior. Spies are exported for per-test assertions and overrides.
- **Interactive Prompt Testing:** `@inquirer/testing` is employed for robust testing of `UIManager` methods that directly use `inquirer`, allowing for simulation of user inputs and verification of prompt behavior.
- **Reusable Test Fixtures:** Vitest's `test.extend` is used to create fixtures like `tmpdir-fixture.ts` ([`tests/fixtures/tmpdir-fixture.ts`](tests/fixtures/tmpdir-fixture.ts:0)), which automatically sets up and tears down isolated temporary directories for E2E tests.
- **Shared Test Utilities:**
    - A CLI execution helper (`runCli` in [`tests/utils/cliTestRunner.ts`](tests/utils/cliTestRunner.ts:0)) standardizes how E2E tests invoke the CLI.
    - Test data factories (e.g., in [`tests/fixtures/test-data-factory.ts`](tests/fixtures/test-data-factory.ts:0)) provide reusable functions for generating mock domain objects.
- **Optimized Vitest Configuration:** The [`vitest.config.ts`](vitest.config.ts:0) is configured with `pool: 'forks'` for better test isolation suitable for CLI applications.

These enhancements aim to make the test suite more maintainable, reliable, and easier to write, providing higher confidence in the CLI's functionality.

## Change Log

| Change        | Date       | Version | Description                                                                                                | Author          |
|---------------|------------|---------|------------------------------------------------------------------------------------------------------------|-----------------|
| Initial draft | 2025-05-12 | 0.1     | Initial testing strategy.                                                                                  | Architect Agent |
| Revision      | 2025-05-12 | 0.2     | Added test locations, refined tools and scope.                                                             | Architect Agent |
| Test Infra Update | 2025-05-15 | 0.3     | Updated to reflect use of `memfs`, `@inquirer/testing`, global mocks, fixtures, and other enhancements. | Architect Agent |