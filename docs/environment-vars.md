# Roo Init CLI - Environment Variables

This document outlines any environment variables used by the Roo Init CLI tool.

## Core Functionality (MVP)

For the Minimum Viable Product (MVP), the Roo Init CLI tool **does not require any environment variables** to function.

- **Mode/Category/Rule Definitions:** These are bundled directly within the distributable package (in the `build/definitions/` directory) and loaded from the file system relative to the running script. See [`docs/project-structure.md`](docs/project-structure.md:0) and [`docs/architecture.md`](docs/architecture.md:0).
- **Target Directory:** By default, the CLI operates on the current working directory (`process.cwd()`). A `--target-dir` flag might be considered post-MVP if needed.
- **Configuration:** All necessary configurations (like library settings) are handled internally or through standard configuration files (e.g., `package.json`).

## Future Considerations

If future enhancements require external configuration or integration (e.g., connecting to a central mode registry, API keys for plugins), environment variables might be introduced. Potential future variables could include:

- `ROO_REGISTRY_URL`: URL for a central mode/rule registry.
- `ROO_API_KEY`: API key for accessing external services.
- `ROO_LOG_LEVEL`: To control logging verbosity (e.g., `debug`, `info`, `warn`, `error`).

These will be documented here if and when they are implemented.

## Change Log

| Change        | Date       | Version | Description                                  | Author         |
| ------------- | ---------- | ------- | -------------------------------------------- | -------------- |
| Initial draft | 2025-05-12 | 0.1     | Initial document, confirming no ENV vars for MVP. | Architect Agent |