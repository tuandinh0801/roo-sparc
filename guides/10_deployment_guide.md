# 10 · Deployment Guide

This document outlines the deployment strategy for the Roo Init CLI tool, covering how it's packaged, published, and made available to end-users.

## Packaging

The Roo Init CLI is a Node.js application written in TypeScript. The packaging process involves:

1.  **Compilation:**
    TypeScript source code from the [`src/`](../src/) directory is compiled into JavaScript using the `tsc` (TypeScript Compiler). The output is placed in the `build/src/` directory.

2.  **Bundling Definitions:**
    The predefined mode, category, and rule definitions located in the [`definitions/`](../definitions/) directory (source) are copied into the `build/definitions/` directory. This ensures these crucial files are included with the distributable package.

3.  **Executable Script:**
    A main executable script, typically `build/bin/roo-init.js`, is generated or designated. This script is the entry point that Node.js runs when the `roo-init` command is invoked.

4.  **`package.json` Configuration:**
    The [`package.json`](../package.json) file is configured to support deployment:
    *   **`bin` field:** This field maps the command name (e.g., `roo-init`) to the path of the executable JavaScript file within the package (e.g., `build/bin/roo-init.js`). This allows package managers like npm and pnpm to create the necessary symlinks for global command-line access.
        ```json
        {
          "name": "roo-init",
          "version": "1.0.0",
          "bin": {
            "roo-init": "build/bin/roo-init.js"
          },
          // ... other package.json fields
        }
        ```
    *   **`files` field:** This field specifies which files and directories should be included when the package is published. It's important to include the `build/` directory (containing compiled code and definitions) and other essential files like `README.md` and `LICENSE`.
        ```json
        {
          "files": [
            "build/",
            "README.md",
            "LICENSE"
          ],
          // ...
        }
        ```
    *   **`main` field:** Typically points to the main entry JavaScript file if the package were to be `require()`'d as a module, though for a CLI, the `bin` field is more critical for command execution.

## Publishing

Once packaged, the Roo Init CLI is intended to be published to a public npm registry (e.g., [npmjs.com](https://www.npmjs.com/)) or a private registry if applicable.

The general steps for publishing (usually performed by maintainers) are:
1.  Ensure the version number in [`package.json`](../package.json) is updated according to semantic versioning.
2.  Log in to the npm registry via the CLI: `npm login` or `pnpm login`.
3.  Publish the package: `npm publish` or `pnpm publish`.

## End-User Deployment (Installation)

End-users deploy (install) the Roo Init CLI onto their systems using a Node.js package manager. The recommended method for a CLI tool is global installation:

-   **Using PNPM:**
    ```bash
    pnpm add -g roo-init
    ```

-   **Using NPM:**
    ```bash
    npm install -g roo-init
    ```

-   **Using Yarn:**
    ```bash
    yarn global add roo-init
    ```

Global installation makes the `roo-init` command accessible from any directory in the user's terminal.

## Environments

-   **Development Environment:**
    -   Developers clone the repository, install dependencies locally using `pnpm install`, and build the project using `pnpm build`.
    -   They can run the CLI locally using `node build/bin/roo-init.js` or by linking it globally (`pnpm link --global`).

-   **Production Environment (End-User System):**
    -   End-users install the published package globally from an npm registry.
    -   The installed package contains the compiled JavaScript code and bundled definitions, ready for execution.

The Roo Init CLI is designed as a local tool and does not involve cloud providers or traditional server deployment infrastructure. Its deployment is centered around Node.js package management.