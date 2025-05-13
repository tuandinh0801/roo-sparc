# 2 · Installation & Setup

This document provides instructions for installing and setting up the Roo Init CLI tool.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js:** Version 14.x or higher. You can check your Node.js version by running `node -v`. If you need to install or manage Node.js versions, consider using a version manager like [nvm](https://github.com/nvm-sh/nvm).
- **PNPM:** The project uses PNPM as its package manager. The required version is specified in the [`package.json`](../package.json) file under the `packageManager` field. You can install PNPM by following the instructions on the [official PNPM website](https://pnpm.io/installation).

## Installation from Repository (for Development or Contribution)

If you are contributing to the CLI or want to run it from the source:

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url> # Replace <repository-url> with the actual URL
    cd roo-init-cli
    ```

2.  **Install Dependencies:**
    Navigate to the cloned directory and install the project dependencies using PNPM:
    ```bash
    pnpm install
    ```
    This command will download and install all necessary packages defined in [`pnpm-lock.yaml`](../pnpm-lock.yaml).

## Global Installation (for End Users)

Once the CLI is published to a package registry (e.g., npmjs.com), users can install it globally using PNPM (or npm):

```bash
pnpm add -g roo-init
```
or
```bash
npm install -g roo-init
```

This will make the `roo-init` command available system-wide.

## Building the Project

To build the project from the TypeScript source code:

```bash
pnpm build
```
This command executes the `tsc` compiler, which transpiles the TypeScript files from the [`src/`](../src/) directory into JavaScript files in the `build/` directory. It also copies the definition files from [`definitions/`](../definitions/) to `build/definitions/`. The main executable will be available at `build/bin/roo-init.js`.

## Running the CLI

### After Building from Source:
You can run the CLI directly using Node.js:
```bash
node build/bin/roo-init.js <command> [options]
```
Alternatively, you can link the project locally to use the `roo-init` command:
```bash
pnpm link --global
roo-init <command> [options]
```

### After Global Installation:
If you installed the CLI globally, you can run it directly:
```bash
roo-init <command> [options]
```

Replace `<command>` with the desired command (e.g., `init`) and `[options]` with any applicable flags (e.g., `--modes`, `--category`, `--force`).

## Verifying the Installation

To verify that the CLI is installed and working correctly, you can run the help or version command:

```bash
roo-init --help
```
This should display the help menu with available commands and options.

```bash
roo-init --version
```
This should display the current version of the Roo Init CLI.