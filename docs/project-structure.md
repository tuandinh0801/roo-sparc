# Roo Init CLI - Project Structure

This document outlines the proposed directory and file structure for the Roo Init CLI tool. The structure aims for clarity, maintainability, and optimal organization for development, especially considering AI agent implementation.

```
roo-init-cli/
├── build/                  # Compiled JavaScript output (from TypeScript)
│   ├── src/
│   └── definitions/
├── definitions/            # Bundled Mode/Category/Rule definitions (source)
│   ├── categories.json
│   ├── modes.json
│   └── rules/
│       ├── generic/        # Generic rules applicable to multiple modes
│       │   └── rule1.md
│       └── mode-slug-1/    # Rules specific to 'mode-slug-1'
│           └── rule2.md
├── docs/                   # Project documentation (PRD, Architecture, etc.)
│   ├── architecture.md
│   ├── coding-standards.md
│   ├── data-models.md
│   ├── environment-vars.md
│   ├── epic1.md
│   ├── epic2.md
│   ├── prd.md
│   ├── project-brief-roo-init-cli.md
│   ├── project-structure.md
│   ├── tech-stack.md
│   └── testing-strategy.md
├── src/                    # TypeScript source code
│   ├── cli.ts              # Main CLI application setup, command routing (commander)
│   ├── commands/           # Handlers for specific CLI commands/workflows
│   │   └── init.ts         # Logic for the main 'init' functionality (interactive/non-interactive)
│   ├── core/               # Core business logic and services
│   │   ├── DefinitionLoader.ts # Service to load/validate mode/rule definitions
│   │   ├── FileManager.ts    # Service for file system operations (.roomodes, rule copying)
│   │   └── ModeSelector.ts   # Service for interactive/non-interactive mode selection logic
│   ├── types/              # TypeScript type definitions and interfaces
│   │   └── domain.ts       # Core domain types (ModeDefinition, Rule, etc., potentially imported/generated)
│   │   └── index.ts        # Barrel file for exporting types
│   └── utils/              # Utility functions (error handling, logging, etc.)
│       ├── errorHandler.ts
│       └── logger.ts
├── tests/                  # Unit and integration tests
│   ├── commands/
│   │   └── init.test.ts
│   ├── core/
│   │   ├── DefinitionLoader.test.ts
│   │   └── FileManager.test.ts
│   └── utils/
│       └── errorHandler.test.ts
├── .eslint.config.js       # ESLint configuration
├── .gitignore
├── .prettierrc.json        # Prettier configuration (optional)
├── LICENSE
├── package.json            # Project manifest, dependencies, scripts
├── pnpm-lock.yaml          # PNPM lock file
├── README.md               # Project overview and setup instructions
├── tsconfig.json           # TypeScript compiler options
└── vitest.config.ts        # Vitest configuration
```

## Key Directory Explanations

- **`bin/`**: Contains the executable JavaScript file generated after the TypeScript build. This is referenced in `package.json`'s `bin` field.
- **`build/`**: Output directory for the compiled JavaScript code and copied definition files. This directory is typically gitignored.
- **`definitions/`**: Source location for the predefined mode, category, and rule definitions. These files will be copied into the `build/` directory during the build process so they can be bundled with the distributable package.
  - **`rules/generic/`**: Contains markdown rule files applicable across multiple modes.
  - **`rules/[mode-slug]/`**: Contains markdown rule files specific to a particular mode.
- **`docs/`**: All project documentation, including requirements, architecture, epics, and technical decisions.
- **`src/`**: Contains all the TypeScript source code for the CLI application.
  - **`cli.ts`**: Sets up `commander`, defines top-level commands (`init`, `--help`, `--version`), and delegates execution to command handlers.
  - **`commands/`**: Modules responsible for handling the logic of specific CLI commands. For MVP, this is primarily the `init` command.
  - **`core/`**: Contains the core business logic, decoupled from the CLI framework. These services handle definition loading, mode selection logic, and file system interactions. This promotes testability and separation of concerns.
  - **`types/`**: Shared TypeScript interfaces and type definitions, particularly the domain model entities.
  - **`utils/`**: Common utility functions used across the application, such as logging and error handling wrappers.
- **`tests/`**: Contains all test files, mirroring the `src/` structure for easy navigation.

## Rationale for AI Agent Implementation

- **Clear Separation:** The structure enforces a clear separation between CLI parsing (`cli.ts`, `commands/`), core logic (`core/`), and utilities (`utils/`). This makes it easier for an AI agent to understand the purpose of different code sections.
- **Modular Core:** Core functionalities are encapsulated in dedicated service classes (`DefinitionLoader`, `FileManager`, `ModeSelector`). Agents can be tasked with modifying or extending specific services with less risk of impacting unrelated areas.
- **Explicit Types:** Using TypeScript (`types/`) provides clear contracts for data structures, reducing ambiguity for AI agents.
- **Focused Commands:** Command handlers in `commands/` provide specific entry points for distinct user workflows.
- **Bundled Definitions:** Keeping source definitions separate (`definitions/`) and copying them during build (`build/definitions/`) clarifies the process of accessing bundled assets.

## Change Log

| Change        | Date       | Version | Description                     | Author         |
| ------------- | ---------- | ------- | ------------------------------- | -------------- |
| Initial draft | 2025-05-12 | 0.1     | Initial project structure draft | Architect Agent |