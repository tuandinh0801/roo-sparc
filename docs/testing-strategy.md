# Roo Init CLI - Testing Strategy

This document outlines the strategy for testing the Roo Init CLI tool to ensure its correctness, reliability, and robustness.

## Guiding Principles

- **Confidence:** Tests should provide high confidence that the CLI works as expected for its core functionalities.
- **Automation:** Prioritize automated tests that can be run easily and frequently (e.g., in CI).
- **Clarity:** Tests should be easy to understand, maintain, and debug. Test names should clearly describe the scenario being tested.
- **Isolation:** Unit tests should focus on individual components, mocking dependencies.
- **Integration:** Integration tests should verify the collaboration between different components.
- **Realism:** End-to-end tests should simulate actual user workflows as closely as possible.

## Testing Levels & Scope

1.  **Unit Tests (`tests/unit/**/*.test.ts`)**
    - **Purpose:** Verify the logic of individual functions, methods, and classes in isolation.
    - **Scope:**
        - Core services ([`src/core/`](src/core/:0)): `DefinitionLoader` (parsing valid/invalid JSON, locating files), `ModeSelector` (resolving modes from flags, handling interactive choices - mocking `inquirer`), `FileManager` (logic for determining target paths, checking force flag - mocking `fs-extra`).
        - Utilities ([`src/utils/`](src/utils/:0)): `errorHandler`, `logger` formatting functions.
        - Command helpers/logic within [`src/commands/`](src/commands/:0) that can be isolated (e.g., input validation functions).
    - **Tools:** Vitest (`vi.fn`, `vi.mock`).
    - **Location:** [`tests/unit/`](tests/unit/:0) mirroring `src/` structure (e.g., `tests/unit/core/DefinitionLoader.test.ts`).
    - **Focus:** Logic correctness, edge cases, handling of different inputs, validation logic.

2.  **Integration Tests (`tests/integration/**/*.test.ts`)**
    - **Purpose:** Verify the interaction and collaboration between different internal components of the CLI, potentially including limited interaction with external libraries or mocked file systems.
    - **Scope:**
        - Test the `init` command handler ([`src/commands/init.ts`](src/commands/init.ts:0)) by invoking it programmatically and verifying its interaction with mocked core services (`DefinitionLoader`, `ModeSelector`, `FileManager`).
        - Test the integration between `ModeSelector` and `DefinitionLoader`.
        - Test the integration between `FileManager` and `fs-extra` (potentially using a temporary, mocked file system like `memfs` or Vitest's built-in capabilities if suitable, or carefully managed temporary directories).
    - **Tools:** Vitest. Mocking libraries (`memfs` if needed for FS). Temporary directory management.
    - **Location:** [`tests/integration/`](tests/integration/:0).
    - **Focus:** Correct data flow between modules, handling of shared state (like loaded definitions), ensuring services are called with correct arguments, basic file system interaction verification (if using temp dirs).

3.  **End-to-End (E2E) Tests (`tests/e2e/**/*.test.ts`)**
    - **Purpose:** Verify the complete user workflow by running the compiled CLI executable (`bin/roo-init.js`) against a controlled environment, interacting with it as a user would.
    - **Scope:**
        - Running `node ./bin/roo-init.js --help` and `--version` and asserting console output.
        - Running `node ./bin/roo-init.js` (interactive mode): Requires a way to simulate user input for `inquirer` prompts (e.g., using `stdin` manipulation or libraries designed for testing interactive CLIs). Assert final console output and the state of a temporary target directory (presence and content of `.roomodes`, `.roo/` structure, and rule files).
        - Running `node ./bin/roo-init.js --modes <...>` / `--category <...>` (non-interactive): Execute the command with various flag combinations. Assert console output and the state of a temporary target directory.
        - Testing `--force` flag: Run commands targeting a pre-populated temporary directory both with and without the flag, asserting the correct behavior (error or overwrite) and final file state.
        - Testing error conditions: Run commands designed to fail (invalid slugs, non-writable target directory - if permissions can be simulated) and assert the correct error messages and non-zero exit codes.
    - **Tools:** Vitest (as test runner), Node.js `child_process` (`execa` preferred for better process management/output handling), file system utilities (`fs-extra`) to set up/tear down/assert temporary directories. Libraries/techniques for interactive CLI testing (e.g., `execa` with input streaming, potentially exploring `node-pty`).
    - **Location:** [`tests/e2e/`](tests/e2e/:0).
    - **Focus:** Simulating real user interaction via the command line, verifying final file system state changes, checking console output (stdout/stderr) and exit codes.

## Testing Environment & Infrastructure

- **Test Runner:** Vitest ([`vitest.config.ts`](vitest.config.ts:0)). Configured to discover tests in `tests/unit`, `tests/integration`, and `tests/e2e`.
- **CI/CD:** Tests (unit, integration, E2E) should be executed automatically in a CI pipeline (e.g., GitHub Actions, GitLab CI) on every push/merge request. The build step (`tsc` and definition copying) must run before E2E tests.
- **Mocking:** Use Vitest's built-in mocking features (`vi.mock`, `vi.spyOn`). Consider `memfs` or `mock-fs` for file system mocking in integration tests if needed, but prefer temporary directories for E2E tests.
- **Temporary Directories:** E2E and some integration tests will require creating temporary directories during test setup and removing them during teardown to test file operations safely. Use standard Node.js `os.tmpdir()` and `fs-extra` within test setup/teardown hooks (`beforeEach`, `afterEach`). Ensure unique directory names per test run if parallel execution is enabled.
- **Coverage Reports:** Configure Vitest to generate coverage reports (e.g., LCOV for integration with tools like SonarQube/Codecov, text summary for console output). Set reasonable coverage thresholds in `vitest.config.ts`.

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
    - Integration: `init` command calls `ModeSelector` and `FileManager` correctly when run programmatically (mocked services).
    - E2E: Interactive flow (simulated input) creates correct `.roomodes` and rule files in a temp dir.
    - E2E: Interactive flow fails with specific error message if `.roomodes` exists without `--force`.
    - E2E: Interactive flow fails with specific error message listing conflicting rule files without `--force`.
    - E2E: Interactive flow overwrites existing files when `--force` is used.
    - E2E: Handling user abort (Ctrl+C during prompts) results in non-zero exit code and message.
    - E2E: Handling file system permission errors (if simulatable) results in error message and non-zero exit code.
    - E2E: Successful run prints confirmation message.

## Change Log

| Change        | Date       | Version | Description                                      | Author         |
| ------------- | ---------- | ------- | ------------------------------------------------ | -------------- |
| Initial draft | 2025-05-12 | 0.1     | Initial testing strategy.                        | Architect Agent |
| Revision      | 2025-05-12 | 0.2     | Added test locations, refined tools and scope. | Architect Agent |