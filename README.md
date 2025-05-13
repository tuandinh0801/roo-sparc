# roo-init CLI

This project is a command-line interface (CLI) tool for initializing Roo projects.

## Overview

The `roo-init` CLI streamlines the setup of new Roo projects by providing a standardized structure, configuration, and necessary boilerplate code. This ensures consistency and best practices across all Roo projects.

## Features

- Interactive project setup
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

## License

This project is licensed under the [ISC License](LICENSE).