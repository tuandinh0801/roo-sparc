# Roo Init CLI - Coding Standards

This document outlines the coding standards and conventions to be followed for the Roo Init CLI project. Adhering to these standards ensures code consistency, readability, maintainability, and facilitates collaboration, especially with AI agents.

## General Principles

1.  **Clarity over Brevity:** Write code that is easy to understand, even if slightly more verbose. Prioritize readability for both humans and AI agents.
2.  **Consistency:** Apply these standards uniformly across the entire codebase.
3.  **Modularity:** Design components and functions with a single, well-defined responsibility (Single Responsibility Principle). Keep files focused and reasonably sized (aim for < 300 lines where practical).
4.  **DRY (Don't Repeat Yourself):** Avoid duplicating code. Use functions, classes, and modules to encapsulate reusable logic.
5.  **Simplicity (KISS - Keep It Simple, Stupid):** Avoid overly complex or clever solutions where a simpler approach suffices.

## Language: TypeScript

1.  **Strict Mode:** Enable strict mode (`"strict": true`) in [`tsconfig.json`](tsconfig.json:0) to leverage TypeScript's full type-checking capabilities.
2.  **Explicit Types:** Use explicit types for function parameters, return values, and variable declarations whenever the type cannot be easily inferred or when it enhances clarity. Avoid `any` unless absolutely necessary and document the reason.
    ```typescript
    // Good
    function calculateTotal(price: number, quantity: number): number {
      return price * quantity;
    }

    // Avoid (unless justified and documented)
    function processData(data: any): void {
      // Reason for using any: Interfacing with legacy untyped library X
      console.log(data);
    }
    ```
3.  **Interfaces vs. Types:** Use interfaces for defining the shape of objects or classes (`UserProfile`, `ModeDefinition`). Use type aliases (`type`) for defining unions, intersections, primitives, or more complex utility types (`Status`, `Result<T>`).
    ```typescript
    interface UserProfile {
      userId: string;
      displayName: string;
    }

    type Status = 'pending' | 'processing' | 'completed';
    ```
4.  **Readonly:** Use the `readonly` modifier for properties that should not be reassigned after object creation, enhancing immutability where appropriate (e.g., configuration objects, loaded definitions).
    ```typescript
    interface Config {
      readonly apiKey: string;
      readonly endpoint: string;
    }
    ```
5.  **Modules:** Use ES modules (`import`/`export`) syntax. Organize imports logically:
    *   Node.js built-ins (e.g., `import path from 'path';`)
    *   External libraries (e.g., `import commander from 'commander';`)
    *   Internal modules/types (e.g., `import { FileManager } from '../core/FileManager';`)
    Use named exports primarily; use default exports sparingly (e.g., for the main class in a file).
6.  **Async/Await:** Prefer `async`/`await` for handling asynchronous operations (like file system access using `fs-extra`, or prompts with `inquirer`) over raw Promises or callbacks for better readability and error handling flow.
7.  **JSDoc:** Add JSDoc comments to all exported functions, classes, interfaces, and complex internal logic to explain purpose, parameters (@param), return values (@returns), and potential errors (@throws). This is crucial for AI agent understanding and documentation generation.

## Formatting & Linting

1.  **Prettier:** Use Prettier for automatic code formatting. Configuration will be defined in `.prettierrc.json` (or `package.json`). Ensure Prettier is integrated into the development workflow (e.g., pre-commit hooks via husky/lint-staged, editor integration). Standard community settings are preferred unless a strong reason exists otherwise.
2.  **ESLint:** Use ESLint for identifying potential code errors and enforcing style rules beyond formatting. Configuration is in [`eslint.config.js`](eslint.config.js:0). Use recommended rulesets for TypeScript (`@typescript-eslint/recommended`, potentially stricter variants). Address all ESLint errors and warnings before committing code.

## Naming Conventions

1.  **Variables & Functions:** Use `camelCase` (e.g., `loadDefinitions`, `totalCount`).
2.  **Classes & Interfaces:** Use `PascalCase` (e.g., `DefinitionLoader`, `ModeDefinition`).
3.  **Type Aliases:** Use `PascalCase` (e.g., `Status`, `ResultType`).
4.  **Enums:** Use `PascalCase` for the enum name and `PascalCase` or `UPPER_SNAKE_CASE` for enum members (prefer `PascalCase` for consistency with types).
    ```typescript
    enum LogLevel {
      Debug,
      Info,
      Warn,
      Error
    }
    ```
5.  **Constants:** Use `UPPER_SNAKE_CASE` for true constants (values that never change at runtime), especially for configuration keys, action types, or magic strings/numbers. Define them at the top of the file or in a dedicated constants file if shared.
    ```typescript
    const DEFAULT_TARGET_DIR = '.';
    const MAX_RETRIES = 3;
    ```
6.  **Files:** Use `PascalCase` for files primarily exporting a class, interface, type, or enum (e.g., `DefinitionLoader.ts`, `ModeDefinition.ts`). Use `camelCase` for other utility/script files or command handlers (e.g., `cli.ts`, `init.ts`, `errorHandler.ts`). Test files should mirror the name of the file they test (e.g., `DefinitionLoader.test.ts`).
7.  **Private Members:** Use the `private` keyword for class members not intended for external use. Avoid underscore prefixes (`_`) for private members.
8.  **Booleans:** Prefix boolean variables/functions with `is`, `has`, `should`, `can` (e.g., `isValid`, `hasForceFlag`, `shouldOverwrite`).

## Error Handling

1.  **Use Custom Errors:** Define specific custom error classes extending the base `Error` class for distinct error conditions (e.g., `DefinitionNotFoundError`, `FileSystemError`, `InvalidSlugError`). Place these in a dedicated `errors.ts` file if they become numerous.
2.  **Throw Errors:** Throw errors for exceptional conditions that prevent the current operation from succeeding normally. Don't return error codes or nulls where an error is more appropriate.
3.  **Catch Specific Errors:** Catch specific custom errors (`catch (e if e instanceof InvalidSlugError)`) rather than generic `Error` when possible to handle different errors appropriately.
4.  **User-Friendly Messages:** Ensure errors that propagate to the user interface (console) are clear, concise, and actionable. Avoid exposing stack traces or overly technical details unless a verbose/debug flag is enabled. Use the [`src/utils/errorHandler.ts`](src/utils/errorHandler.ts:0) utility for consistent formatting and exit code management.
5.  **Async Errors:** Properly handle rejected promises in `async` functions using `try...catch` blocks. Ensure all promise chains have appropriate `.catch()` handlers or are awaited within a `try...catch`.

## Testing

1.  **Coverage:** Aim for high test coverage (>80%) for core logic (`src/core/`) and command handlers (`src/commands/`). Use coverage reports to identify gaps.
2.  **Clarity:** Write clear and descriptive test names using `describe` and `it` blocks (e.g., `describe('DefinitionLoader', () => { it('should load modes correctly from valid JSON', () => { ... }); });`).
3.  **Isolation:** Unit tests should test components in isolation. Use Vitest's mocking capabilities (`vi.mock`, `vi.fn`) to mock dependencies (like file system access, external libraries).
4.  **Integration Tests:** Verify interactions between components (e.g., ensure the `init` command correctly calls `ModeSelector` and `FileManager`). These may involve testing against temporary directories or mocked file systems.
5.  **Framework:** Use Vitest as defined in [`docs/tech-stack.md`](docs/tech-stack.md:0) and configured in [`vitest.config.ts`](vitest.config.ts:0).

## Documentation

1.  **Code Comments:** Use comments (`//` for single line, `/* */` for multi-line) sparingly to explain *why* something is done, not *what* is done (the code should explain the 'what'). Explain complex algorithms, workarounds, or non-obvious logic. Remove commented-out code before committing.
2.  **JSDoc:** Document all exported members (classes, functions, interfaces, types, enums) as mentioned in the TypeScript section. Use `@param`, `@returns`, `@throws`, `@example`.
3.  **README:** Keep [`README.md`](README.md:0) updated with project overview, installation instructions, basic usage examples, and contribution guidelines.
4.  **Architecture Docs:** Keep documents in [`docs/`](docs/:0) (like [`docs/architecture.md`](docs/architecture.md:0), [`docs/tech-stack.md`](docs/tech-stack.md:0), this document) up-to-date as the codebase evolves. Major architectural decisions should be recorded.

## Change Log

| Change        | Date       | Version | Description                     | Author         |
| ------------- | ---------- | ------- | ------------------------------- | -------------- |
| Initial draft | 2025-05-12 | 0.1     | Initial coding standards draft. | Architect Agent |
| Revision      | 2025-05-12 | 0.2     | Expanded sections, added detail. | Architect Agent |