# Test Refactoring and Enhancement Plan for roo-init CLI

**Date:** May 14, 2025
**Project:** roo-init
**Author:** 3-Architect (AI)

## 1. Introduction

This document outlines a plan to refactor and enhance the testing setup for the `roo-init` CLI application. The goal is to improve test robustness, maintainability, developer experience, and alignment with best practices for testing Node.js CLI applications, as informed by our discussion and the "Advanced Testing Strategies for Node.js CLI Applications with Vitest" research.

## 2. Current State Analysis

Based on the `vitest.config.ts`:

* **Framework:** Vitest is in use.
* **Configuration:** `globals: true`, `environment: 'node'`, basic coverage.
* **Structure:** Tests are under a top-level `tests/` directory, with subdirectories for `commands`, `core`, `e2e`, and `utils`. (The `integration` directory will be removed or repurposed).
* **Mocking:** `vi.mock`, `vi.spyOn` are used; `fs-extra` is manually mocked in `FileManager.test.ts`.
* **CLI Testing:** E2E tests execute the CLI, likely using `execa`, and are responsible for covering command handler orchestration.
* **Interactivity:** `inquirer` is used for prompts, primarily via `UIManager`. Unit tests for `UIManager` methods will leverage `@inquirer/testing`.

## 3. Goals of Refactoring

* Standardize and enhance Vitest configuration.
* Improve file system testing with a centralized in-memory solution (`memfs`).
* Introduce robust testing for interactive prompts using `@inquirer/testing`.
* Streamline test execution and organization.
* Improve clarity and reduce boilerplate in test files using fixtures.

## 4. Detailed Migration and Setup Plan

### Step 1: Enhance `vitest.config.ts`

**Objective:** Optimize Vitest configuration for CLI testing stability and clarity.

**Tasks:**

1.  **Set Execution Pool:**
    * **Action:** Modify `vitest.config.ts` to use `pool: 'forks'`.
    * **Rationale:** Improves test isolation for I/O-heavy CLI applications, reducing potential conflicts with native modules or shared resources, as recommended by the research.
    * **Code:**
        ```typescript
        // vitest.config.ts
        import { defineConfig } from 'vitest/config';

        export default defineConfig({
          test: {
            globals: true,
            environment: 'node',
            pool: 'forks', // Add this line
            coverage: {
              provider: 'v8',
              reporter: ['text', 'json', 'html'],
            },
            include: [/* existing include patterns */],
            // Optional: Increase default timeout if needed for longer tests
            // testTimeout: 10000, // Default is 5000ms
          },
        });
        ```

2.  **Path Alias Configuration (If Applicable):**
    * **Action:** If you introduce more specific path aliases in `tsconfig.json` (e.g., `@/core/*`) beyond the current `baseUrl` and `paths: {"*": [...]}` setup, ensure they are resolvable by Vitest.
    * **Rationale:** Prevents module resolution errors in tests.
    * **How:** Install `vite-tsconfig-paths` (`pnpm add -D vite-tsconfig-paths`) and add it to `vitest.config.ts` plugins if more complex aliases are used.
        ```typescript
        // Example if using vite-tsconfig-paths
        // import tsconfigPaths from 'vite-tsconfig-paths';
        // export default defineConfig({
        //   plugins: [tsconfigPaths()],
        //   test: { /* ... */ },
        // });
        ```
        *Current status: Your existing `tsconfig.json` `paths` might be sufficient for now. Revisit if new, more specific aliases are added.*

### Step 2: Global Test Setup (`setupFiles`)

**Objective:** Centralize global mocks and setup logic, particularly for the in-memory file system.

**Tasks:**

1.  **Install `memfs`:**
    * **Action:** `pnpm add -D memfs`
    * **Rationale:** Provides a comprehensive in-memory file system mock.

2.  **Create `memfs` Setup File:**
    * **Action:** Create `tests/setup/memfs-setup.ts`.
    * **Rationale:** This file will mock `node:fs` and `fs-extra` globally for all tests, directing file system operations to `memfs`.
    * **Code (`tests/setup/memfs-setup.ts`):**
        ```typescript
        import { vol, fs as memfsReal } from 'memfs'; // Import memfs's fs as memfsReal
        import { vi, beforeEach } from 'vitest'; // Import beforeEach

        // Mock 'node:fs'
        vi.mock('node:fs', async () => {
          const memfsModule = await vi.importActual<typeof import('memfs')>('memfs');
          return memfsModule.fs;
        });

        // Mock 'fs-extra'
        vi.mock('fs-extra', async () => {
          const memfsModule = await vi.importActual<typeof import('memfs')>('memfs');
          const actualFsExtra = await vi.importActual<typeof import('fs-extra')>('fs-extra');

          // Start with all exports from memfs.fs
          const mockFsExtra: any = { ...memfsModule.fs };

          // Selectively override or add fs-extra specific methods
          // Ensure keys from actualFsExtra are considered to provide a more complete mock.
          for (const key in actualFsExtra) {
            if (typeof (actualFsExtra as any)[key] === 'function' && !(memfsModule.fs as any)[key]) {
                // If function in actualFsExtra is not in memfs.fs, provide a specific mock or map
                // This is a placeholder; specific implementations are needed for complex fs-extra functions
                // For now, we will ensure basic functions are covered.
            }
          }

          // Specific implementations for commonly used fs-extra methods:
          mockFsExtra.ensureDir = async (path: string) => {
            memfsModule.fs.mkdirSync(path, { recursive: true });
          };
          mockFsExtra.readJson = async (path: string, options?: any) => {
            const content = memfsModule.fs.readFileSync(path, options?.encoding || 'utf8');
            return JSON.parse(content as string);
          };
          mockFsExtra.writeJson = async (path: string, data: any, options?: any) => {
            memfsModule.fs.writeFileSync(path, JSON.stringify(data, null, options?.spaces === undefined ? 2 : options.spaces), options);
          };
          mockFsExtra.pathExists = async (path: string) => { // Changed to async to match fs-extra
            return memfsModule.fs.existsSync(path);
          };
          mockFsExtra.copy = async (src: string, dest: string, options?: import('fs-extra').CopyOptions) => {
            // A more robust copy would handle options like 'overwrite', 'filter', etc.
            // For basic copy, ensure parent directory of dest exists
            const destParent = require('path').dirname(dest);
            if (!memfsModule.fs.existsSync(destParent)) {
                memfsModule.fs.mkdirSync(destParent, { recursive: true });
            }
            const data = memfsModule.fs.readFileSync(src);
            memfsModule.fs.writeFileSync(dest, data);
          };
          mockFsExtra.remove = async (pathToRemove: string) => { // Changed to async
            try {
              const stats = memfsModule.fs.lstatSync(pathToRemove);
              if (stats.isDirectory()) {
                memfsModule.fs.rmdirSync(pathToRemove, { recursive: true });
              } else {
                memfsModule.fs.unlinkSync(pathToRemove);
              }
            } catch (e: any) {
              if (e.code !== 'ENOENT') { // Ignore if path doesn't exist, similar to fs-extra's force
                throw e;
              }
            }
          };
          // Important: Return the mocked object as default and as __esModule
          return {
            default: mockFsExtra,
            __esModule: true,
            ...mockFsExtra // Spread members for named imports
          };
        });

        // Reset the volume before each test to ensure isolation
        beforeEach(() => {
          vol.reset();
        });
        ```

3.  **Update `vitest.config.ts` for `setupFiles`:**
    * **Action:** Add the `setupFiles` option to `vitest.config.ts`.
    * **Code:**
        ```typescript
        // vitest.config.ts
        export default defineConfig({
          test: {
            // ... other options
            pool: 'forks',
            setupFiles: ['./tests/setup/memfs-setup.ts'], // Add this
          },
        });
        ```

### Step 3: Refactor Tests Using File System Operations

**Objective:** Adapt existing tests (especially `FileManager.test.ts`) to use the globally mocked `memfs` via `vol` for setup and verification, removing local `vi.mock('fs-extra')`.

**Tasks:**

1.  **Modify `FileManager.test.ts` (and other similar tests):**
    * **Action:**
        * Remove `vi.mock('fs-extra')` from the top of `FileManager.test.ts`.
        * Use `vol.fromJSON()` to set up the in-memory file system state in `beforeEach` or per test.
        * Use `vol.readFileSync()`, `vol.existsSync()`, `vol.toJSON()` for assertions, or assert against the results of `FileManager` methods that internally use the now-mocked `fs` or `fs-extra`.
    * **Rationale:** Simplifies test setup and relies on the consistent global `memfs` mock.
    * **Example Snippet for `FileManager.test.ts`:**
        ```typescript
        // tests/core/FileManager.test.ts
        import { describe, it, expect, vi, beforeEach } from 'vitest';
        import { vol } from 'memfs'; // Import vol for direct manipulation
        import path from 'node:path';
        import { FileManager } from '../../src/core/FileManager.js';
        import { UIManager } from '../../src/utils/uiManager.js';
        // handleError might still be needed for testing error paths of FileManager
        import { handleError, OverwriteConflictError, FileSystemError } from '../../src/utils/errorHandler.js';

        // UIManager is still mocked as it's a dependency of FileManager
        vi.mock('../../src/utils/uiManager.js');
        vi.mock('../../src/utils/errorHandler.js', async (importOriginal) => {
            const originalModule = await importOriginal() as any;
            return {
                ...originalModule,
                handleError: vi.fn(),
            };
        });


        describe('FileManager (with memfs)', () => {
          let fileManager: FileManager;
          let mockUiManager: UIManager;
          const projectRoot = '/fake/project/root';

          beforeEach(() => {
            vol.reset(); // memfs-setup.ts also does this, but good for clarity here too
            mockUiManager = new (vi.mocked(UIManager))() as any;
            vi.mocked(mockUiManager.printSuccess).mockClear();
            vi.mocked(mockUiManager.printWarning).mockClear();
            vi.mocked(mockUiManager.printInfo).mockClear();
            vi.mocked(mockUiManager.failSpinner).mockClear();
            vi.mocked(mockUiManager.succeedSpinner).mockClear();
            vi.mocked(mockUiManager.startSpinner).mockClear();
             // Re-initialize chalk mocks on the instance if needed by tests
            mockUiManager.chalk = {
                cyan: vi.fn((str: string) => str),
                yellow: vi.fn((str: string) => str),
                green: vi.fn((str: string) => str),
                red: vi.fn((str: string) => str),
                bold: vi.fn((str: string) => str),
            } as any;

            fileManager = new FileManager(mockUiManager);
            vi.mocked(handleError).mockClear();
          });

          describe('writeJson', () => {
            const testFilePath = path.join(projectRoot, 'data.json');
            const jsonData = { key: 'value' };

            it('should write JSON to a file using memfs', async () => {
              // No need to mock fs.pathExists or fs.writeJson here, memfs handles it.
              // Optional: vol.fromJSON({ [projectRoot]: null }); // Ensure parent dir for testFilePath if strict

              await fileManager.writeJson(testFilePath, jsonData, false);

              expect(vol.existsSync(testFilePath)).toBe(true);
              const content = JSON.parse(vol.readFileSync(testFilePath, 'utf-8') as string);
              expect(content).toEqual(jsonData);
              expect(mockUiManager.printInfo).toHaveBeenCalledWith(expect.stringContaining('JSON file written:'));
            });

            it('should not write if file exists and force is false (memfs)', async () => {
              vol.fromJSON({ [testFilePath]: '{"original":"data"}' }); // Pre-populate

              await expect(
                fileManager.writeJson(testFilePath, jsonData, false)
              ).rejects.toThrow(OverwriteConflictError);

              // Verify original content is unchanged
              const content = JSON.parse(vol.readFileSync(testFilePath, 'utf-8') as string);
              expect(content).toEqual({ original: "data" });
              expect(mockUiManager.failSpinner).toHaveBeenCalled();
              expect(handleError).toHaveBeenCalledWith(expect.any(OverwriteConflictError), expect.anything());
            });
             // ... other FileManager tests adapted similarly
          });
          // ... other test suites for copyFile, createDirectoryIfNotExists, etc.
        });
        ```

### Step 4: Implement Testing for Interactive Prompts

**Objective:** Reliably test CLI commands that use `inquirer` prompts.

**Tasks:**

1.  **Install `@inquirer/testing`:**
    * **Action:** `pnpm add -D @inquirer/testing`
    * **Rationale:** Official library for testing Inquirer prompts, providing realistic interaction simulation.

2.  **Refactor Tests for Commands/UIManager Methods Using Inquirer:**
    * **Action:** Identify methods in `UIManager` that directly use `inquirer.prompt` (e.g., `promptInput`, `promptList`, `promptCheckbox`). Create new tests or refactor existing ones for these `UIManager` methods using `@inquirer/testing`'s `render` function.
    * **Rationale:** Directly tests the prompt's behavior, including messages, validation, and user interactions.
    * **Example (Conceptual test for a `UIManager.promptInput` method):**
        ```typescript
        // tests/utils/uiManager.inquirer.test.ts
        import { test, expect, vi } from 'vitest';
        import { render } from '@inquirer/testing';
        import { UIManager } // Assuming UIManager directly uses inquirer.prompt
        // or the specific prompt function definition if it's separate.

        // This test assumes your UIManager.promptInput (or a similar method)
        // internally constructs and uses an Inquirer question object.
        // For simplicity, let's assume we are testing a function that *returns*
        // an Inquirer question configuration.

        // Example: Your UIManager might have:
        // public getSlugQuestionConfig(existingSlugs: Set<string>): InputQuestionOptions {
        //   return {
        //     type: 'input',
        //     name: 'slug',
        //     message: 'Enter slug:',
        //     validate: (input: string) => !existingSlugs.has(input) || 'Slug taken.'
        //   };
        // }

        // const uiManager = new UIManager(); // Real UIManager for this test

        // Test a specific prompt configuration
        const getTestSlugPrompt = (message: string, validateFunc: (input: string) => boolean | string) => {
            // This function mimics how UIManager might call inquirer.prompt
            const question = {
                type: 'input',
                name: 'testInput',
                message,
                validate: validateFunc,
            };
            // In a real UIManager test, you'd call the UIManager method that invokes inquirer.prompt
            // For now, we simulate calling render with the question object itself
            return uiManager.inquirer.prompt([question]).then(answers => answers.testInput);
        };


        test('UIManager.promptInput (via @inquirer/testing) should accept valid input', async () => {
          const promptConfig = { // This is the config your UIManager.promptInput would pass to Inquirer
            type: 'input',
            name: 'slug',
            message: 'Enter your category slug:',
            validate: (input: string) => input.trim() !== '' || 'Slug cannot be empty.',
          };

          // Use `render` with a function that invokes the prompt
          const { answer, events, getScreen } = await render(
            () => new UIManager().inquirer.prompt([promptConfig]) // Simulate UIManager calling inquirer
          );

          expect(getScreen()).toContain('Enter your category slug:');
          events.type('my-new-category');
          expect(getScreen()).toContain('my-new-category');
          events.keypress('enter');

          const result = await answer;
          expect(result.slug).toBe('my-new-category');
        });

        test('UIManager.promptInput (via @inquirer/testing) should show validation error and allow retry', async () => {
          const promptConfig = {
            type: 'input',
            name: 'slug',
            message: 'Enter unique slug:',
            validate: (input: string) => input === 'valid' || 'Invalid slug. Try "valid".',
          };

          const { answer, events, getScreen } = await render(
            () => new UIManager().inquirer.prompt([promptConfig])
          );

          expect(getScreen()).toContain('Enter unique slug:');
          events.type('wrong');
          events.keypress('enter');
          // Wait for re-render after validation
          await vi.waitFor(() => {
            expect(getScreen()).toContain('Invalid slug. Try "valid".');
            expect(getScreen()).toContain('wrong'); // Previous input often shown
          });

          // Clear previous input (some prompts do this, others might require backspace events)
          // For basic input, typing new chars might overwrite.
          // Simulating backspaces: events.keypress(null, { name: 'backspace', ctrl: false, meta: false }, { count: 5 });
          for(let i=0; i < 'wrong'.length; i++) events.keypress('backspace');

          events.type('valid');
          expect(getScreen()).toContain('valid');
          events.keypress('enter');

          const result = await answer;
          expect(result.slug).toBe('valid');
        });
        ```
    * **For Commands like `manageAddCategory`:**
        * The existing unit tests for `manageAddCategory.ts` mock `uiManager.promptInput`. This is acceptable for testing the command's orchestration logic.
        * The actual Inquirer interaction testing should happen at the `UIManager` method level (e.g., testing `UIManager.promptInput`, `UIManager.promptList`) using `@inquirer/testing`.

### Step 5: Reusable Test Fixtures (`test.extend`)

**Objective:** Reduce boilerplate in E2E tests for managing temporary directories.

**Tasks:**

1.  **Create `tmpdir-fixture.ts`:**
    * **Action:** Create `tests/fixtures/tmpdir-fixture.ts` as detailed in the previous response.
    * **Rationale:** Provides an isolated temporary directory for each E2E test that needs one.
    * **Code (`tests/fixtures/tmpdir-fixture.ts`):**
        ```typescript
        import { test as baseTest } from 'vitest';
        import fs from 'node:fs/promises';
        import os from 'node:os';
        import path from 'node:path';

        interface TmpDirContext {
          tmpDir: string;
        }

        export const test = baseTest.extend<TmpDirContext>({
          tmpDir: async ({}, use) => {
            const baseTmpPath = path.join(os.tmpdir(), 'roo-init-e2e-');
            const createdTmpDir = await fs.mkdtemp(baseTmpPath);
            await use(createdTmpDir);
            try {
              await fs.rm(createdTmpDir, { recursive: true, force: true });
            } catch (cleanupError) {
              console.error(`Failed to clean up temporary directory: ${createdTmpDir}`, cleanupError);
            }
          },
        });

        export { expect } from 'vitest';
        ```

2.  **Refactor E2E Tests:**
    * **Action:** Modify `tests/e2e/*.e2e.test.ts` files.
        * Import `test` and `expect` from your new fixture file.
        * Remove manual `beforeAll/afterAll` or `beforeEach/afterEach` hooks that manage temporary directories.
        * Accept `tmpDir` from the test function argument.
        * Pass `tmpDir` to your `runCli` helper as the `cwd`.
    * **Rationale:** Cleaner, more maintainable E2E tests with automatic temp dir management.

### Step 6: Refine `package.json` Test Scripts

**Objective:** Provide convenient scripts for running different types of tests.

**Tasks:**

1.  **Update `package.json`:**
    * **Action:** Add more specific scripts for unit, integration, and E2E tests.
    * **Rationale:** Faster feedback loops by running only relevant tests.
    * **Code (`package.json` scripts section):**
        ```json
        "scripts": {
          "clean": "rimraf ./dist",
          "copy-assets": "node scripts/copy-assets.js",
          "build": "pnpm run clean && tsc && pnpm run copy-assets",
          "build:watch": "pnpm run clean && pnpm run copy-assets && tsc --watch",
          "test": "vitest run",
          "test:watch": "vitest watch",
          "test:unit": "vitest run tests/core tests/utils tests/commands src", // Keep specific unit test paths
          "test:e2e": "vitest run tests/e2e",
          "coverage": "vitest run --coverage",
          "lint": "eslint . --ext .ts,.tsx",
          "format": "eslint . --ext .ts,.tsx --fix"
        },
        ```
        *Note: The paths in `test:unit` need to accurately reflect your unit test organization. For unit tests, you might also include `src/**/*.test.ts` if you co-locate unit tests with source files (which you are not currently doing based on the structure). The `test:integration` script is removed.*

### Step 7: Review and Finalize

* **Action:** After implementing these changes, run all test suites (`pnpm test`, `pnpm test:unit`, `pnpm test:e2e`) to ensure everything works as expected.
* **Action:** Review code coverage (`pnpm coverage`) and identify any critical gaps, paying particular attention to ensuring E2E tests adequately cover command handler orchestration.
* **Action:** Update any relevant project documentation regarding testing setup.

## 5. Expected Outcome

* A more robust, maintainable, and efficient testing environment for `roo-init`.
* Faster and more reliable file system tests using `memfs`.
* Accurate testing of interactive prompts.
* Cleaner E2E tests with reusable fixtures.
* Improved developer experience when running and writing tests.

This plan provides a structured approach. Remember to commit changes incrementally and test thoroughly at each stage.