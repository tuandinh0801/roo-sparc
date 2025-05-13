# roo-init CLI

This project is a command-line interface (CLI) tool for initializing Roo projects.

## Overview

The Roo Init CLI tool is designed to streamline and standardize the initialization of new software projects. It addresses the need for a consistent and efficient way for developers to select predefined modes (representing roles or functions) and have their definitions and corresponding rules automatically copied into a new or existing project structure. All modes and rules are pre-defined within the CLI's ecosystem, and users select from these available options.

Built with Node.js and TypeScript, the CLI utilizes libraries like `commander` for argument parsing, `enquirer` for interactive prompts, and `fs-extra` for file system operations. Core services handle definition loading, mode selection, and file management, promoting modularity and testability.

## Features

- **Mode Discovery & Selection:** Easily discover and select predefined modes and their associated rules via interactive prompts or command-line arguments.
- **Category-based Selection:** Select all modes within one or more specified categories.
- **File Generation & Copying:** Automatically create/update the `.roomodes` file and copy rule files into the `.roo` directory structure in the target project.
- **Interactive & Non-interactive Modes:** Support for both guided user interaction and automated scripting.
- **Robust File Operations:** Handles file system interactions with options for overwriting existing files.
- **Enhanced User Experience:** Provides clear progress messages, styled output, and informative error handling.
- TypeScript support
- ESLint and code formatting (using `@stylistic/eslint-plugin-ts`)
- Vitest for testing
- Pre-configured `tsconfig.json`, `.eslintrc.js`, and `vitest.config.ts`
- Standardized directory structure

## Getting Started

### Prerequisites

- Node.js (version specified in `.nvmrc` or project documentation)
- PNPM (version specified in `package.json` `packageManager` field)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd roo-init
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Usage

To build the project:
```bash
pnpm build
```

To run tests:
```bash
pnpm test
```

To run the CLI (after building):
```bash
node dist/index.js <command> [options]
```
Or, if you link it globally or use `pnpm link --global`:
```bash
roo-init <command> [options]
```

## Development

### Scripts

- `pnpm build`: Compiles TypeScript to JavaScript.
- `pnpm test`: Runs tests using Vitest.
- `pnpm lint`: Lints the codebase using ESLint.
- `pnpm format`: Formats the codebase using ESLint with `@stylistic/eslint-plugin-ts`.

(Further development details will be added as the project progresses)

## Contributing

Please refer to the main project's contributing guidelines.

## Documentation

For more detailed documentation, including installation, usage, core concepts, and architecture, please see the [guides/](guides/) directory.

## License

This project is licensed under the [ISC License](LICENSE).