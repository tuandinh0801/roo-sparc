# 9 · Contributing Guide

Thank you for your interest in contributing to the Roo Init CLI project! Your help is appreciated. This guide provides information on how to get started with development, our coding standards, and the process for submitting contributions.

## Getting Started with Development

1.  **Prerequisites:**
    *   Ensure you have **Node.js** (version 14.x or higher) installed.
    *   Ensure you have **PNPM** installed (version specified in [`package.json`](../package.json)).
    *   Familiarize yourself with TypeScript, as the project is written in it.

2.  **Fork and Clone the Repository:**
    *   Fork the official repository on the hosting platform (e.g., GitHub).
    *   Clone your fork to your local machine:
        ```bash
        git clone <your-fork-repository-url>
        cd roo-init-cli
        ```

3.  **Install Dependencies:**
    *   Install project dependencies using PNPM:
        ```bash
        pnpm install
        ```

4.  **Branching:**
    *   Create a new branch for your feature or bug fix. Use a descriptive name, e.g., `feature/add-new-command` or `fix/resolve-mode-selection-bug`.
        ```bash
        git checkout -b your-branch-name
        ```

5.  **Build the Project:**
    *   Before running or testing, build the project:
        ```bash
        pnpm build
        ```
    This compiles TypeScript to JavaScript in the `build/` directory.

6.  **Running Locally:**
    *   You can run your local version of the CLI using:
        ```bash
        node build/bin/roo-init.js <command> [options]
        ```
    *   For convenience during development, you can link your local version globally:
        ```bash
        pnpm link --global
        # Now you can use 'roo-init' directly in your terminal
        roo-init <command> [options]
        ```

## Development Workflow

-   **Code:** Make your changes in the `src/` directory.
-   **Test:**
    -   Add unit tests for new functionality or bug fixes in the `tests/` directory, mirroring the `src/` structure.
    -   Run tests using:
        ```bash
        pnpm test
        ```
    -   Ensure all tests pass before submitting a contribution.
-   **Lint & Format:**
    -   The project uses ESLint for linting and formatting (via `@stylistic/eslint-plugin-ts`).
    -   Run the linter:
        ```bash
        pnpm lint
        ```
    -   Format your code:
        ```bash
        pnpm format
        ```
    -   Ensure there are no linting errors.

## Coding Standards

Please adhere to the coding standards outlined in the following documents:
-   [`docs/coding-standards.md`](./coding-standards.md): General coding conventions, naming, and style.
-   TypeScript best practices (e.g., strong typing, clear interfaces).
-   Comments should be used to explain complex logic.

Key principles:
-   **Clarity and Readability:** Write code that is easy to understand and maintain.
-   **Modularity:** Keep components and functions focused on a single responsibility.
-   **Dependency Injection:** Core services are designed to be injectable. Follow this pattern when appropriate.
-   **Error Handling:** Implement robust error handling and provide user-friendly messages.

## Submitting Contributions (Pull Request Process)

1.  **Commit Your Changes:**
    *   Make small, logical commits with clear and descriptive messages.
        ```bash
        git add .
        git commit -m "feat: Add feature X" -m "Detailed description of changes."
        # or
        git commit -m "fix: Resolve issue Y with Z"
        ```

2.  **Push to Your Fork:**
    *   Push your changes to your branch on your forked repository.
        ```bash
        git push origin your-branch-name
        ```

3.  **Open a Pull Request (PR):**
    *   Navigate to the original repository on the hosting platform.
    *   Open a new Pull Request from your branch to the main development branch of the original repository (e.g., `main` or `develop`).
    *   **PR Title:** Use a clear and concise title that summarizes your changes (e.g., "Feat: Add support for custom rule repositories").
    *   **PR Description:**
        *   Provide a detailed description of the changes you've made.
        *   Explain the "why" behind your changes.
        *   If your PR addresses an existing issue, link to it (e.g., "Closes #123").
        *   Describe any testing you've done.

4.  **Code Review:**
    *   Project maintainers will review your PR.
    *   Be prepared to discuss your changes and make adjustments based on feedback.
    *   Respond to comments and questions promptly.

5.  **Merging:**
    *   Once your PR is approved and passes any automated checks (CI), a maintainer will merge it.

## Issue Tracker

-   If you find a bug or have a feature request, please check the project's issue tracker first to see if it has already been reported.
-   If not, feel free to open a new issue, providing as much detail as possible.

Thank you for contributing to Roo Init CLI!