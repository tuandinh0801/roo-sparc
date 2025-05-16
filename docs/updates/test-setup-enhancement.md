# Test Setup Enhancement Plan: Centralizing Mocks & Utilities

**Date:** May 15, 2025
**Project:** roo-init
**Author:** 3-Architect (AI)

## 1. Introduction

This plan details the next phase of enhancing the `roo-init` testing setup. Having implemented global file system mocking (`memfs-setup.ts`) and E2E temporary directory fixtures (`tmpdir-fixture.ts`), we now focus on centralizing mocks for commonly used utility and core modules, and creating shared test helper functions. This aims to further reduce boilerplate, improve consistency, and enhance the maintainability of the test suite.

## 2. Current Status (Post-Initial Refactor)

* Global file system mocking is in place via `tests/setup/memfs-setup.ts`.
* E2E tests are using `tests/fixtures/tmpdir-fixture.ts`.
* `UIManager` and `errorHandler` are still primarily mocked locally within individual test files (e.g., `manageAddCategory.test.ts`, `errorHandler.test.ts`).
* Core modules like `DefinitionLoader` and `FileManager` are also mocked locally in command tests.
* Test data (mock modes, categories) is often defined within specific test files.
* CLI runner helpers (`runCli`) are defined locally in E2E test files.

## 3. Goals for This Phase

* Centralize mock implementations for `UIManager` and `errorHandler.handleError` via `setupFiles`.
* Optionally, provide a basic centralized mock for `DefinitionLoader` for tests where it's a simple dependency.
* Create shared test data factories.
* Centralize the CLI execution helper (`runCli`).

## 4. Detailed Plan

### Step 1: Centralize `UIManager` Mock

**Objective:** Provide a global, default mock for `UIManager` to simplify tests for commands and other components that use it for UI interactions.

**Tasks:**

1.  **Create/Update Global Mocks File:**
    * **Action:** If `tests/setup/globalUtilityMocks.ts` doesn't exist, create it. Otherwise, update it.
    * **Rationale:** This file will host global mocks loaded via `setupFiles`.
2.  **Define `UIManager` Mock and Spies:**
    * **Action:** Add a `vi.mock` for `../../src/utils/uiManager.js` within `globalUtilityMocks.ts`. Export the spies for its methods so they can be imported and controlled in individual tests.
    * **Rationale:** Makes a consistent `UIManager` mock available globally. Spies allow tests to assert calls and customize behavior per test.
    * **Code (`tests/setup/globalUtilityMocks.ts` - UIManager section):**
        ```typescript
        import { vi } from 'vitest';
        import actualChalk from 'chalk'; // Or your preferred way to handle chalk in mocks

        // --- UIManager Mock ---
        export const mockUiPrintBanner = vi.fn();
        export const mockUiStartSpinner = vi.fn();
        export const mockUiStopSpinner = vi.fn();
        export const mockUiSucceedSpinner = vi.fn();
        export const mockUiFailSpinner = vi.fn();
        export const mockUiUpdateSpinnerText = vi.fn();
        export const mockUiInfoSpinner = vi.fn();
        export const mockUiWarnSpinner = vi.fn();
        export const mockUiPrintSuccess = vi.fn();
        export const mockUiPrintError = vi.fn();
        export const mockUiPrintWarning = vi.fn();
        export const mockUiPrintInfo = vi.fn();
        export const mockUiPrintAbortMessage = vi.fn();
        export const mockUiPromptInput = vi.fn();
        export const mockUiPromptList = vi.fn();
        export const mockUiPromptCheckbox = vi.fn();
        export const mockUiPromptConfirm = vi.fn().mockResolvedValue(true); // Default confirm
        export const mockUiPromptEditor = vi.fn();
        export const mockUiDisplayTable = vi.fn(); // For manageListModes/Categories
        export const mockUiShowMessage = vi.fn(); // For manageListModes/Categories

        vi.mock('../../src/utils/uiManager.js', () => ({
          __esModule: true,
          UIManager: vi.fn().mockImplementation(() => ({
            chalk: actualChalk, // Or a simplified mock chalk instance
            printBanner: mockUiPrintBanner,
            startSpinner: mockUiStartSpinner,
            stopSpinner: mockUiStopSpinner,
            succeedSpinner: mockUiSucceedSpinner,
            failSpinner: mockUiFailSpinner,
            updateSpinnerText: mockUiUpdateSpinnerText,
            infoSpinner: mockUiInfoSpinner,
            warnSpinner: mockUiWarnSpinner,
            printSuccess: mockUiPrintSuccess,
            printError: mockUiPrintError,
            printWarning: mockUiPrintWarning,
            printInfo: mockUiPrintInfo,
            printAbortMessage: mockUiPrintAbortMessage,
            promptInput: mockUiPromptInput,
            promptList: mockUiPromptList,
            promptCheckbox: mockUiPromptCheckbox,
            promptConfirm: mockUiPromptConfirm,
            promptEditor: mockUiPromptEditor,
            displayTable: mockUiDisplayTable,
            showMessage: mockUiShowMessage,
          })),
          // If your application code imports the singleton `uiManager` directly:
          uiManager: {
            chalk: actualChalk,
            printBanner: mockUiPrintBanner,
            startSpinner: mockUiStartSpinner,
            stopSpinner: mockUiStopSpinner,
            // ... (mirror all spies and methods for the singleton)
            promptConfirm: mockUiPromptConfirm,
            displayTable: mockUiDisplayTable,
            showMessage: mockUiShowMessage,
          }
        }));
        ```
3.  **Register in `vitest.config.ts`:**
    * **Action:** Ensure `globalUtilityMocks.ts` is listed in `setupFiles`.
        ```typescript
        // vitest.config.ts
        export default defineConfig({
          test: {
            // ...
            setupFiles: [
              './tests/setup/memfs-setup.ts',
              './tests/setup/globalUtilityMocks.ts' // Add this
            ],
          },
        });
        ```
4.  **Refactor Test Files:**
    * **Action:** Remove local `vi.mock` for `UIManager` in unit tests (e.g., `manageAddCategory.test.ts`, `ModeSelector.test.ts`). E2E tests generally shouldn't rely on these specific UI mocks but rather test the CLI's output or use `@inquirer/testing` for detailed prompt interactions at the `UIManager` unit test level. Import necessary spies from `globalUtilityMocks.ts` for assertions or per-test behavior changes in unit tests.
    * **Example (in `manageAddCategory.test.ts`):**
        ```typescript
        // Remove the local vi.mock for UIManager
        // Import spies:
        import {
          mockUiPromptInput,
          mockUiPrintError,
          mockUiPrintSuccess
        } from '../setup/globalUtilityMocks'; // Adjust path as needed

        beforeEach(() => {
          // Reset imported spies
          mockUiPromptInput.mockReset();
          mockUiPrintError.mockReset();
          mockUiPrintSuccess.mockReset();
          // Set default behaviors for this test suite if needed
          mockUiPromptInput.mockResolvedValueOnce('default-slug') //...
        });
        ```

### Step 2: Centralize `errorHandler.handleError` Mock

**Objective:** Globally mock the `handleError` function to prevent tests from exiting unexpectedly and allow assertion of its calls.

**Tasks:**

1.  **Update `globalUtilityMocks.ts`:**
    * **Action:** Add a `vi.mock` for `../../src/utils/errorHandler.js`, mocking only the `handleError` function. Export the `mockHandleError` spy.
    * **Rationale:** Keeps original error classes for `instanceof` checks while controlling the `handleError` side effects.
    * **Code (`tests/setup/globalUtilityMocks.ts` - errorHandler section):**
        ```typescript
        // ... (UIManager mock from above)

        // --- errorHandler Mock ---
        export const mockHandleError = vi.fn();

        vi.mock('../../src/utils/errorHandler.js', async (importOriginal) => {
          const originalModule = await importOriginal() as any; // Cast to any
          return {
            ...originalModule, // Spread to keep original error classes (BaseError, etc.)
            handleError: mockHandleError,
          };
        });
        ```
2.  **Refactor Test Files:**
    * **Action:** In unit tests where `handleError` might be called (e.g., `FileManager.test.ts`), remove any local mocks for it. Import `mockHandleError` from `globalUtilityMocks.ts` for assertions. E2E tests will verify error handling by checking exit codes and stderr.
    * **Example (in `FileManager.test.ts`):**
        ```typescript
        // Remove local mock for handleError if any
        // Import the spy:
        import { mockHandleError } from '../setup/globalUtilityMocks'; // Adjust path

        beforeEach(() => {
          mockHandleError.mockReset();
          // ...
        });

        it('should call handleError on failure', async () => {
          // ... (setup code that causes FileManager to call handleError) ...
          vol.writeFileSync('/fake/project/root/source/rule.md', 'content'); // Source file
          // Simulate a condition that makes fs.copy (via memfs) throw, e.g. invalid destination
          vi.spyOn(require('fs'), 'copyFileSync').mockImplementationOnce(() => { // Mock underlying fs method used by memfs copy
             throw new Error('Disk full simulation');
          });


          await expect(fileManager.copyFile('/fake/project/root/source/rule.md', '/invalid/dest/rule.md', false))
            .rejects.toThrow('Disk full simulation');

          expect(mockHandleError).toHaveBeenCalledWith(
            expect.any(Error), // Or a more specific error type if applicable
            expect.objectContaining({ context: 'copying file' })
          );
        });
        ```

### Step 3: Centralize `DefinitionLoader` Mock (Optional Basic Mock)

**Objective:** Provide a default global mock for `DefinitionLoader` for tests where it's a simple dependency and doesn't need complex per-test variations.

**Tasks:**

1.  **Update `globalUtilityMocks.ts` (or new `coreMocks.ts`):**
    * **Action:** Add a `vi.mock` for `DefinitionLoader`. Provide default resolved values for its common methods like `loadDefinitions`. Export method spies.
    * **Rationale:** Simplifies tests that need `DefinitionLoader` to succeed with basic data without detailed setup.
    * **Code (`tests/setup/globalUtilityMocks.ts` - DefinitionLoader section):**
        ```typescript
        // ... (previous mocks)
        import type { ModeDefinition, CategoryDefinition } from '../../src/types/domain'; // Adjust path

        // --- DefinitionLoader Mock ---
        export const mockDefaultModes: ModeDefinition[] = [
          { slug: 'global-mock-mode', name: 'Global Mock Mode', description: 'Provided by global mock', categorySlugs: ['global-mock-cat'], associatedRuleFiles: [], source: 'system' },
        ];
        export const mockDefaultCategories: CategoryDefinition[] = [
          { slug: 'global-mock-cat', name: 'Global Mock Category', description: 'Provided by global mock', source: 'system' },
        ];

        export const mockLoadDefinitions = vi.fn().mockResolvedValue({
          modes: mockDefaultModes,
          categories: mockDefaultCategories,
        });
        // Add spies for other methods if needed
        export const mockGetSystemModes = vi.fn().mockResolvedValue(mockDefaultModes);


        vi.mock('../../src/core/DefinitionLoader.js', () => ({ // Adjust path
          __esModule: true,
          DefinitionLoader: vi.fn().mockImplementation(() => ({
            loadDefinitions: mockLoadDefinitions,
            getSystemDefinitionsPath: vi.fn().mockReturnValue('/mock/system/definitions/path'),
            getSystemModes: mockGetSystemModes,
            // Add other methods with default mocks if frequently used
          })),
          // If your app directly imports a singleton instance:
          definitionLoader: {
             loadDefinitions: mockLoadDefinitions,
             getSystemDefinitionsPath: vi.fn().mockReturnValue('/mock/system/definitions/path'),
             getSystemModes: mockGetSystemModes,
          }
        }));
        ```
2.  **Refactor Test Files (e.g., command tests):**
    * **Action:** Remove local mocks for `DefinitionLoader` if the default global behavior is sufficient. Import spies like `mockLoadDefinitions` if specific assertions or one-off behavior changes are needed.
    * **Note:** `DefinitionLoader.test.ts` itself should *not* use this global mock; it tests the actual implementation.

### Step 4: Create Shared Test Data Factories

**Objective:** Centralize the creation of mock data objects like modes and categories.

**Tasks:**

1.  **Create `testDataFactories.ts`:**
    * **Action:** Create `tests/utils/testDataFactories.ts`.
    * **Rationale:** Provides reusable functions to generate consistent test data, reducing duplication.
    * **Code (`tests/utils/testDataFactories.ts`):**
        ```typescript
        import type { ModeDefinition, CategoryDefinition, Rule } from '../../src/types/domain'; // Adjust path

        let idCounter = 0;

        export function createMockRule(overrides: Partial<Rule> = {}): Rule {
          idCounter++;
          return {
            id: `rule-${idCounter}`,
            name: `Test Rule ${idCounter}`,
            description: `Description for rule ${idCounter}`,
            sourcePath: `generic/rule-${idCounter}.md`,
            isGeneric: true,
            ...overrides,
          };
        }

        export function createMockMode(overrides: Partial<ModeDefinition> = {}): ModeDefinition {
          idCounter++;
          return {
            slug: `test-mode-${idCounter}`,
            name: `Test Mode ${idCounter}`,
            description: `Description for test mode ${idCounter}`,
            categorySlugs: [`test-cat-${idCounter}`],
            associatedRuleFiles: [createMockRule()],
            source: 'system',
            customInstructions: `Custom instructions for mode ${idCounter}`,
            groups: ['common'],
            ...overrides,
          };
        }

        export function createMockCategory(overrides: Partial<CategoryDefinition> = {}): CategoryDefinition {
          idCounter++;
          return {
            slug: `test-cat-${idCounter}`,
            name: `Test Category ${idCounter}`,
            description: `Description for test category ${idCounter}`,
            source: 'system',
            ...overrides,
          };
        }
        ```
2.  **Use Factories in Tests:**
    * **Action:** Import and use these factories in tests like `ModeSelector.test.ts`, `DefinitionLoader.test.ts`, etc., instead of defining large mock data objects inline.
    * **Example:**
        ```typescript
        import { createMockMode, createMockCategory } from '../utils/testDataFactories'; // Adjust path

        const mockCategories = [createMockCategory({ slug: 'cat1' }), createMockCategory({ slug: 'cat2' })];
        const mockModes = [createMockMode({ slug: 'mode1', categorySlugs: ['cat1'] })];
        ```

### Step 5: Centralize CLI Execution Helper (`runCli`)

**Objective:** Make the `runCli` function from E2E tests reusable.

**Tasks:**

1.  **Create `cliTestRunner.ts`:**
    * **Action:** Move the `runCli` function (and its `CliResult` interface) from an E2E test file to `tests/utils/cliTestRunner.ts`.
    * **Rationale:** Allows any E2E test to execute the CLI in a consistent manner.
    * **Code (`tests/utils/cliTestRunner.ts` - ensure SCRIPT_PATH is correct):**
        ```typescript
        import { execa, type ExecaError, type ExecaReturnValue } from 'execa';
        import path from 'node:path';
        import { fileURLToPath } from 'node:url';

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        // Path to the compiled CLI entry point
        const SCRIPT_PATH = path.resolve(__dirname, '../../dist/src/cli.js');

        export interface CliResult {
          stdout: string;
          stderr: string;
          exitCode: number;
          failed: boolean;
          timedOut: boolean;
          isCanceled: boolean;
          originalError?: ExecaError;
          all?: string; // Include 'all' if you use it for combined output
        }

        export const runCli = async (args: string[], cwd: string, envVars: Record<string, string> = {}): Promise<CliResult> => {
          console.log(`[Test Runner] Executing: node ${SCRIPT_PATH} ${args.join(' ')} in ${cwd}`);
          const defaultEnv = {
            NODE_ENV: 'test', // Critical for disabling/enabling test-specific logic
            VITEST: 'true',   // If your CLI checks this
            ...process.env,   // Inherit current env
            ...envVars,       // Override with specific test env vars
          };

          try {
            const result = await execa(
              'node',
              [SCRIPT_PATH, ...args],
              {
                cwd,
                reject: false,
                timeout: 30000,
                env: defaultEnv,
                all: true, // Capture combined stdout/stderr, useful for interleaved output
              }
            );
            // Process 'all' to split stdout/stderr if needed, or use result.stdout/stderr directly
            // This example prioritizes result.all if available for combined output.
            return {
              stdout: result.stdout?.trim() ?? '',
              stderr: result.stderr?.trim() ?? '',
              all: result.all?.trim() ?? '',
              exitCode: result.exitCode ?? 1,
              failed: result.failed,
              timedOut: result.timedOut,
              isCanceled: result.isCanceled,
            };
          } catch (error) {
            const execaError = error as ExecaError;
            console.error(`[Test Runner] Execa execution error:`, execaError);
            return {
              stdout: (execaError.stdout as string)?.trim() ?? '',
              stderr: (execaError.stderr as string)?.trim() ?? '',
              all: (execaError.all as string)?.trim() ?? '',
              exitCode: execaError.exitCode ?? 1,
              failed: true,
              timedOut: execaError.timedOut ?? false,
              isCanceled: execaError.isCanceled ?? false,
              originalError: execaError,
            };
          }
        };
        ```
2.  **Update E2E Tests:**
    * **Action:** Import `runCli` from `cliTestRunner.ts` in your E2E test files.
    * Your E2E tests like `init-command-error-handling.e2e.test.ts` [cite: 119] and `non-interactive-init.e2e.test.ts` [cite: 161] are already well-structured to use such a helper with the `tmpDir` fixture.

### Step 6: Review and Test

* **Action:** After these changes, thoroughly run all test suites (`pnpm test`, `pnpm test:unit`, `pnpm test:e2e`).
* **Action:** Debug any issues arising from the new global mocks or centralized utilities. Pay attention to mock hoisting and the order of execution in `setupFiles`.
* **Action:** Ensure that unit tests which need specific mock behaviors can still override the global defaults effectively.

## 5. Expected Outcome

* Reduced code duplication in test mock setups.
* More consistent mocking behavior across the test suite.
* Improved maintainability of tests, especially when interfaces of mocked modules change.
* Cleaner and more focused individual test files.
* Reusable utilities for common testing tasks like CLI execution and data generation.

This phased approach allows for incremental improvements to your testing infrastructure, making it more powerful and easier to work with.