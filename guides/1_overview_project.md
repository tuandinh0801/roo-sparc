# 1 · Project Overview

## Introduction

The Roo Init CLI tool is designed to streamline and standardize the initialization of new software projects. It provides a consistent and efficient way for developers to select predefined modes (representing roles or functions) and have their definitions and corresponding rules automatically copied into a new or existing project structure. All modes and rules are pre-defined within the CLI's ecosystem, and users select from these available options.

## Purpose and Goals

The primary goal is to empower developers with a rapid, reliable, and standardized method for bootstrapping projects with best-practice configurations, thereby reducing setup overhead and promoting consistency across development environments.

Key goals include:
- Enabling users to easily discover and select predefined modes and their associated rules.
- Reliably copying selected mode definitions into a `.roomodes` JSON file.
- Accurately copying associated rule files into the `.roo` directory structure.
- Supporting both interactive and non-interactive modes of operation.
- Allowing modes to be organized and selected via categories.

## Features

- **Mode Discovery & Selection:** Easily discover and select predefined modes and their associated rules via interactive prompts or command-line arguments.
- **Category-based Selection:** Select all modes within one or more specified categories.
- **File Generation & Copying:** Automatically create/update the `.roomodes` file and copy rule files into the `.roo` directory structure in the target project.
- **Interactive & Non-interactive Modes:** Support for both guided user interaction and automated scripting.
- **Robust File Operations:** Handles file system interactions with options for overwriting existing files.
- **Enhanced User Experience:** Provides clear progress messages, styled output, and informative error handling.
- TypeScript support
- ESLint and code formatting
- Vitest for testing
- Pre-configured development files (`tsconfig.json`, `.eslintrc.js`, `vitest.config.ts`)
- Standardized directory structure

## Architecture Overview

The Roo Init CLI follows a Modular Monolith architectural style. It is a single executable Node.js application built with TypeScript, internally structured into distinct, loosely coupled modules.

Key components include:
- **CLI Entry Point (`src/cli.ts`):** Initializes the application and handles command routing.
- **Command Handlers (`src/commands/`):** Contain logic for specific CLI commands, receiving dependencies via Dependency Injection.
- **Core Services (`src/core/`):** Encapsulate core business logic like definition loading, mode selection, and file management. These are designed to be injectable for testability.
- **Utilities (`src/utils/`):** Provide common functions for logging, error handling, and managing the enhanced CLI user interface.
- **Type Definitions (`src/types/`):** Define shared TypeScript interfaces and the domain model.

The architecture emphasizes modularity, Dependency Injection, and clear separation of concerns to enhance maintainability and testability.

## Project Structure

The project follows a standardized directory structure:

```
roo-init-cli/
├── build/                  # Compiled JavaScript output
├── definitions/            # Bundled Mode/Category/Rule definitions (source)
│   ├── categories.json
│   ├── modes.json
│   └── rules/
│       ├── generic/        # Generic rules
│       └── mode-slug-1/    # Mode-specific rules
├── docs/                   # Project documentation
├── src/                    # TypeScript source code
│   ├── cli.ts              # Main CLI application setup
│   ├── commands/           # Command handlers
│   ├── core/               # Core business logic and services
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── tests/                  # Unit and integration tests
├── .eslint.config.js       # ESLint configuration
├── .gitignore
├── LICENSE
├── package.json            # Project manifest
├── pnpm-lock.yaml          # PNPM lock file
├── README.md               # Project overview and setup
├── tsconfig.json           # TypeScript compiler options
└── vitest.config.ts        # Vitest configuration
```

This structure promotes clarity, maintainability, and organization.