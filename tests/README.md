# Test Setup Documentation

## Overview

This document provides an overview of the testing infrastructure for the `roo-sparc` project. The test setup has been enhanced to centralize mocks, utilities, and test data generation, reducing boilerplate code and improving consistency across tests.

## Test Structure

The test suite is organized into two primary levels:

-   **Unit Tests**: Focus on testing individual components (core services, utilities) in isolation with mocked dependencies. Located primarily in `tests/core/` and `tests/utils/`. Some isolated logic within `tests/commands/` may also be unit tested.
-   **E2E Tests**: Test the CLI application from the user's perspective, simulating real-world scenarios and verifying the overall command execution and orchestration of services. Located in `tests/e2e/`.

## Key Components

### 1. Centralized Mocks

Located in `tests/setup/mocks/`:

-   [`uiManager.mock.ts`](tests/setup/mocks/uiManager.mock.ts): Centralized mock for the `UIManager` class. Exports `mockUIManager` (an object containing spies for all `UIManager` methods), `resetUIManagerMocks` (to clear/reset all spies), and `configureUIManagerPrompts` (a helper to set default return values for prompt methods).
-   [`errorHandler.mock.ts`](tests/setup/mocks/errorHandler.mock.ts): Centralized mock for error handling. Exports `mockHandleErrorSpy` (a spy on the main `handleError` function), `mockErrorHandler` (an object containing `mockHandleErrorSpy` and spies for UI methods called by the mock `handleError` implementation), and `resetErrorHandlerMocks`.
-   [`definitionLoader.mock.ts`](tests/setup/mocks/definitionLoader.mock.ts): Centralized mock for the `DefinitionLoader` class. Exports `mockDefinitionLoaderInstance` (the object returned when `new DefinitionLoader()` is called, containing spies for its methods like `loadModeDefinitions`, `getModeDefinition`, etc.), `resetDefinitionLoaderMocks`, and `configureDefinitionLoader` (a helper to set up mock return values for the loader's methods). Individual method spies like `mockLoadModeDefinitions` are also exported.

These mocks are automatically loaded and applied globally via [`tests/setup/globalUtilityMocks.ts`](tests/setup/globalUtilityMocks.ts), which is configured in `vitest.config.ts` under the `setupFiles` option. This means that for most tests, these core utilities are already mocked, and you can directly import their mock control functions and instances from their respective `*.mock.ts` files.

### 2. Test Data Factory

Located in [`tests/fixtures/test-data-factory.ts`](tests/fixtures/test-data-factory.ts):

This factory provides functions to create consistent and typed test data for `ModeDefinition`, `CategoryDefinition`, and `Rule` objects, aligning with the domain types in [`src/types/domain.ts`](src/types/domain.ts).

**Key features**:
-   Uses actual domain types.
-   Includes an internal `idCounter` (reset via `resetTestDataFactoryIds()`) to help generate unique slugs/IDs by default.
-   Provides `createTestMode`, `createTestModes`, `createTestCategory`, `createTestCategories`, `createTestRule`, `createTestRules`.
-   Offers `predefinedModes` and `predefinedCategories` for common scenarios.
-   Includes helper functions like `createModesJsonContent` and `createCategoriesJsonContent` for generating JSON strings, useful for `memfs` setup in tests.

### 3. Shared Test Utilities

-   [`tests/utils/cliTestRunner.ts`](tests/utils/cliTestRunner.ts): Provides the `runCli` function for executing CLI commands within tests. It captures `stdout`, `stderr`, and `exitCode`.
-   [`tests/fixtures/tmpdir-fixture.ts`](tests/fixtures/tmpdir-fixture.ts): Extends Vitest's `test` object to provide a `tmpDir` fixture. This fixture creates a unique temporary directory before each test that uses it and cleans it up afterwards, ideal for E2E tests involving file system operations.

## Usage Examples

### Using the Test Data Factory

```typescript
import { 
  createTestMode, 
  createTestCategory, 
  createTestRule,
  createTestModes, // Example for multiple items
  predefinedModes,
  // predefinedCategories, // Already shown in file content
  resetTestDataFactoryIds
} from '../fixtures/test-data-factory.js'; // Adjust path as needed
import type { ModeDefinition } from '../../src/types/domain.js'; // For type usage

describe('My Component using Test Data', () => {
  beforeEach(() => {
    resetTestDataFactoryIds(); // Optional: for deterministic IDs
  });

  it('should use a custom mode', () => {
    const myRule = createTestRule({ id: 'custom-rule-1', name: 'My Custom Rule' });
    const myMode: ModeDefinition = createTestMode({ 
      slug: 'custom-mode', 
      name: 'My Custom Mode',
      categorySlugs: ['core', 'custom'],
      associatedRuleFiles: [myRule]
    });
    // ... use myMode in your test
    expect(myMode.slug).toBe('custom-mode');
    expect(myMode.associatedRuleFiles).toContain(myRule);
  });

  it('should use predefined modes', () => {
    const basicMode = predefinedModes.basic;
    // ... use basicMode
    expect(basicMode.name).toBe('Basic Mode');
  });

  it('should create multiple categories', () => {
    const categories = createTestCategories(3, { source: 'user' });
    expect(categories).toHaveLength(3);
    expect(categories[0].source).toBe('user');
  });
});
```

### Using UIManager Mock

```typescript
import { 
  mockUIManager, 
  resetUIManagerMocks, 
  configureUIManagerPrompts 
} from '../setup/mocks/uiManager.mock.js'; // Adjust path as needed
// import { UIManager } from '../../src/utils/uiManager.js'; // Actual class for type casting if needed

describe('My Test Suite Interacting with UI', () => {
  beforeEach(() => {
    resetUIManagerMocks();
  });

  it('should prompt for confirmation and print success', async () => {
    // Configure specific prompt for this test if needed, or rely on defaults from reset
    mockUIManager.promptConfirm.mockResolvedValueOnce(true); 

    // Example: Simulate a function that asks for confirmation then prints a message
    // await someFunctionThatUsesUIManager(); 
    // For demonstration:
    // const decision = await new UIManager().promptConfirm({ message: 'Are you sure?' });
    // if (decision) { new UIManager().printSuccess('Operation successful!'); }


    // Assert that UI methods were called (assuming someFunctionThatUsesUIManager calls them)
    // expect(mockUIManager.promptConfirm).toHaveBeenCalledWith(
    //   expect.objectContaining({ message: expect.stringContaining('Are you sure') })
    // );
    // expect(mockUIManager.printSuccess).toHaveBeenCalledWith('Operation successful!');
  });

  it('should allow configuring default prompt values for a suite', async () => {
    configureUIManagerPrompts({
      listSelection: 'chosen-option',
      confirmSelection: false,
    });

    // const listVal = await new UIManager().promptList({ message: 'Choose', choices: ['a']});
    // expect(listVal).toBe('chosen-option');
    // const confirmVal = await new UIManager().promptConfirm({ message: 'Confirm?' });
    // expect(confirmVal).toBe(false);

    // Assertions on mockUIManager.promptList and mockUIManager.promptConfirm would verify calls
  });
});
```

### Using ErrorHandler Mock

```typescript
import { 
  mockHandleErrorSpy, // Spy on the handleError function
  resetErrorHandlerMocks,
  // mockErrorHandler, // Object containing the spy and other UI spies if needed for complex scenarios
} from '../setup/mocks/errorHandler.mock.js'; // Adjust path as needed
import { FileSystemError } from '../../src/utils/errorHandler.js'; // Import custom error type

// Assume someFunctionThatMightFail calls the global handleError
// import { handleError } from '../../src/utils/errorHandler.js' // SUT would use this
// const someFunctionThatMightFail = (shouldFail: boolean) => {
//   if (shouldFail) {
//     handleError(new FileSystemError('FS fail', '/path/to/file.txt'), { exit: false });
//   }
// };

describe('Error Handling Scenarios', () => {
  beforeEach(() => {
    resetErrorHandlerMocks();
  });

  it('should call handleError when an error occurs', () => {
    const testError = new FileSystemError('FS fail test', '/path/to/file.txt');
    // Simulate a function call that is expected to trigger handleError
    // someFunctionThatMightFail(true); 
    
    // For demonstration, directly call the (mocked) handleError if it's globally available
    // handleError(testError, { exit: false, context: 'Test Context' });


    // Assert that handleErrorSpy was called (assuming SUT calls the global handleError)
    // expect(mockHandleErrorSpy).toHaveBeenCalledWith(
    //   testError,
    //   expect.objectContaining({ exit: false, context: 'Test Context' })
    // );
  });
});
```

### Using DefinitionLoader Mock

```typescript
import {
  mockDefinitionLoaderInstance, // The object representing the mocked instance
  resetDefinitionLoaderMocks,
  configureDefinitionLoader, // Helper to set up mock return values
  mockLoadModeDefinitions, // Example of an individual method spy
} from '../setup/mocks/definitionLoader.mock.js'; // Adjust path as needed
import { createTestMode, createTestCategory } from '../fixtures/test-data-factory.js';
// import { DefinitionLoader } from '../../src/core/DefinitionLoader.js'; // Actual class for type casting

describe('Component Relying on Definitions', () => {
  beforeEach(() => {
    resetDefinitionLoaderMocks();
  });

  it('should load and use mode definitions via configured mock', async () => {
    const modes = [createTestMode({ slug: 'test-mode-1' })];
    const categories = [createTestCategory({ slug: 'test-cat-1' })];
    
    configureDefinitionLoader({
      modes: modes, // Mocks what (new DefinitionLoader()).loadModeDefinitions() would return
      categories: categories,
    });

    // Example: a function in your SUT that instantiates and uses DefinitionLoader
    // async function someFunctionThatUsesDefinitionLoader() {
    //   const loader = new DefinitionLoader(mockFileManagerInstance, 'path'); // Path might also be mocked/irrelevant
    //   const loadedModes = await loader.loadModeDefinitions();
    //   const loadedCategories = await loader.loadCategoryDefinitions();
    //   return { loadedModes, loadedCategories };
    // }
    // const { loadedModes, loadedCategories } = await someFunctionThatUsesDefinitionLoader();

    // Assert that DefinitionLoader methods were called on the instance
    // expect(mockDefinitionLoaderInstance.loadModeDefinitions).toHaveBeenCalled();
    // expect(loadedModes).toEqual(modes);
    // expect(loadedCategories).toEqual(categories);
  });

  it('should allow mocking a specific method like getModeBySlug', async () => {
    const specificMode = createTestMode({ slug: 'specific-slug', name: 'Specific Mode' });
    // Configure the spy directly or via configureDefinitionLoader
    mockDefinitionLoaderInstance.getModeBySlug.mockResolvedValue(specificMode);

    // const loader = new DefinitionLoader(mockFileManagerInstance, 'path');
    // const mode = await loader.getModeBySlug('specific-slug');
    // expect(mode).toEqual(specificMode);
    // expect(mockDefinitionLoaderInstance.getModeBySlug).toHaveBeenCalledWith('specific-slug');
  });
});
```

### Running CLI Commands (E2E Tests)

```typescript
import { runCli } from '../setup/cliTestRunner.js'; // Adjust path
import { test, expect } from '../fixtures/tmpdir-fixture.js'; // Adjust path
import * as fs from 'fs-extra';
import path from 'path';

describe('CLI Command Tests', () => {
  test('should execute the --help command successfully', async ({ tmpDir }) => {
    // tmpDir is automatically created and cleaned up
    const result = await runCli(['--help'], tmpDir); 
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage: roo'); // Or more specific help output
  });

  test('should initialize a project in a temporary directory', async ({ tmpDir }) => {
    // You can prepare files in tmpDir before running the CLI if needed
    // For example, using fs.writeFileSync(path.join(tmpDir, 'some-config.json'), 'content');

    // Assuming 'code' is a valid mode slug for non-interactive init
    const result = await runCli(['init', '--modes', 'code', '--non-interactive'], tmpDir);
    
    expect(result.exitCode).toBe(0);
    // Check for a success message if applicable, or file creation
    // expect(result.stdout).toContain('Project initialized successfully');
    
    // Add assertions to check for created files/directories in tmpDir
    const roomodesPath = path.join(tmpDir, '.roo', '.roomodes');
    expect(await fs.pathExists(roomodesPath)).toBe(true);
  });
});
```

## Best Practices

1.  **Reset Mocks**: Always call the `reset<Name>Mocks()` function in `beforeEach` to ensure a clean state for each test and avoid interference between tests. Also call `resetTestDataFactoryIds()` if deterministic IDs are needed.
2.  **Isolation**: Keep tests isolated. Each test should set up its own required state and not depend on the side effects of other tests.
3.  **Specific Assertions**: Use specific assertions to verify behavior (e.g., `toHaveBeenCalledWith(...)`, checking return values) rather than just `toHaveBeenCalled()`.
4.  **Test Data**: Utilize the [`tests/fixtures/test-data-factory.ts`](tests/fixtures/test-data-factory.ts) to create consistent and typed test data.
5.  **`tmpdir-fixture`**: For tests involving file system operations (especially E2E tests), use the `test` object extended from [`tests/fixtures/tmpdir-fixture.ts`](tests/fixtures/tmpdir-fixture.ts) to get an isolated temporary directory.

## Running Tests

-   `pnpm test`: Run all tests (Unit and E2E).
-   `pnpm test:unit`: Run unit tests only.
-   `pnpm test:e2e`: Run E2E tests only.
-   `pnpm test:watch`: Run tests in watch mode.
-   `pnpm test:coverage`: Run tests with coverage reporting.

## Further Enhancements

Future enhancements to the test setup may include:

1.  More specialized test fixtures for specific testing needs (e.g., pre-configured `memfs` instances).
2.  Streamlining the setup for testing different CLI command handlers.
3.  Performance optimizations for faster test execution, especially for E2E tests.
