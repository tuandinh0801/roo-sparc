# Epic 1: Core CLI Framework & Mode/Rule Definition Loading

**Goal:** Establish the basic CLI application structure, command-line argument parsing (for help, version), and the internal mechanisms for loading and accessing predefined mode and rule definitions. This epic lays the groundwork for all subsequent CLI functionality.

**Deployability:** This epic establishes the foundational CLI executable and its core data loading capabilities. While not providing the primary user-facing initialization features, it results in a runnable CLI that can parse basic arguments (`--help`, `--version`) and internally validate its access to the mode/rule definitions. It is the necessary first step upon which all other epics depend.

## Epic-Specific Technical Context

- **Project Scaffolding:** A standard Node.js project structure suitable for a CLI tool needs to be established (e.g., using `npm init`, setting up `package.json` with a `bin` entry, potentially using TypeScript with compilation).
- **Core Dependencies:** Selection and integration of a command-line argument parsing library (e.g., `commander` or `commander`) as suggested in the PRD's Architect Prompt.
- **Mode/Rule Definition Storage:** Define the internal structure and location within the packaged CLI tool where predefined `ModeDefinition`, `CategoryDefinition`, and `Rule` data will be stored (e.g., bundled JSON files, potentially organized in a dedicated directory). Refer to [`specs/consolidated_domain_model.md`](../specs/consolidated_domain_model.md).
- **Loading Mechanism:** Implement the initial logic to locate and load these bundled definitions into memory when the CLI starts.

## Local Testability & Command-Line Access

- **Local Development:** Developers should be able to run the CLI directly from the source code (e.g., using `node ./bin/roo-init.js --help` or via `npm link`). The setup should support easy debugging.
- **Command-Line Testing:**
    - Execute `roo-init --help` to verify help output.
    - Execute `roo-init --version` to verify version output.
    - Internal tests (unit/integration) should verify the successful loading and parsing of the bundled mode/rule definitions.
- **Environment Testing:** N/A for this epic (focus is on local execution).
- **Testing Prerequisites:** Node.js (v20.x+) and npm/pnpm installed. The project dependencies (`npm install`) must be installed. Bundled mode/rule definition files must exist in the expected location within the source structure.

## Story List

### Story 1.1: Basic CLI Project Setup & Entry Point

- **User Story / Goal:** As a Developer, I want a basic Node.js project structure for the CLI tool so that I can start building the core functionality.
- **Detailed Requirements:**
    - Initialize a Node.js project (`package.json`).
    - Configure `package.json` to define a binary executable (e.g., `roo-init`).
    - Create the main entry point script (e.g., `bin/roo-init.js`).
    - Set up basic linting and formatting (e.g., ESLint, Prettier).
    - If using TypeScript, configure `tsconfig.json` and build process.
- **Acceptance Criteria (ACs):**
    - AC1: `npm install` runs successfully.
    - AC2: A basic executable script exists and can be run with `node`.
    - AC3: `npm link` (or equivalent) allows the `roo-init` command to be run globally in the local environment.
    - AC4: Basic linting/formatting checks pass.
- **Tasks (Optional Initial Breakdown):**
    - [ ] Initialize npm project.
    - [ ] Configure `package.json` (`bin`, `scripts`).
    - [ ] Create entry script `bin/roo-init.js`.
    - [ ] Setup ESLint/Prettier.
    - [ ] (If TS) Setup `tsconfig.json` and build script.
- **Dependencies:** None.

---

### Story 1.2: Implement Basic Argument Parsing (`--help`, `--version`)

- **User Story / Goal:** As a CLI User, I want to be able to run `roo-init --help` and `roo-init --version` so that I can get usage instructions and check the installed version.
- **Detailed Requirements:**
    - Integrate a command-line argument parsing library (e.g., `commander`).
    - Implement the handler for the `--help` flag to display basic usage information (even if commands are not yet implemented).
    - Implement the handler for the `--version` flag to display the version from `package.json`.
    - Ensure unrecognized arguments result in helpful feedback (e.g., suggesting `--help`).
- **Acceptance Criteria (ACs):**
    - AC1: Running `roo-init --help` displays usage information including the application name and description.
    - AC2: Running `roo-init --version` displays the correct version string from `package.json`.
    - AC3: Running `roo-init --invalid-flag` produces an error message indicating the flag is not recognized and suggests using `--help`.
- **Tasks (Optional Initial Breakdown):**
    - [ ] Add argument parsing library dependency.
    - [ ] Configure parser for `help` and `version` options.
    - [ ] Implement logic to display help text.
    - [ ] Implement logic to display version from `package.json`.
    - [ ] Configure handling for unknown options.
- **Dependencies:** Story 1.1.

---

### Story 1.3: Define and Load Mode/Category/Rule Definitions

- **User Story / Goal:** As a Developer, I need the CLI to load predefined mode, category, and rule definitions from its internal bundled data so that this information is available for subsequent processing.
- **Detailed Requirements:**
    - Define the file format and structure for storing mode, category, and rule definitions internally within the CLI package (e.g., JSON files in a `definitions/` directory). Structure should align with [`specs/consolidated_domain_model.md`](../specs/consolidated_domain_model.md).
    - Create sample definition files (at least 2-3 modes, 1-2 categories, a few rules including generic and mode-specific).
    - Implement a module/service responsible for locating, reading, parsing, and validating these definition files upon CLI startup.
    - Make the loaded definitions accessible internally within the application.
    - Implement basic validation (e.g., check for required fields in definitions).
- **Acceptance Criteria (ACs):**
    - AC1: The CLI successfully locates and parses the bundled definition files without errors during startup.
    - AC2: Loaded data structures in memory accurately reflect the content of the definition files and match the domain model.
    - AC3: Basic validation checks on the definitions pass (or fail informatively if definitions are intentionally invalid for testing).
    - AC4: Unit tests verify the loading, parsing, and validation logic for various valid and invalid definition file scenarios.
- **Tasks (Optional Initial Breakdown):**
    - [ ] Design internal storage format/structure for definitions.
    - [ ] Create sample definition files (modes.json, categories.json, rules/*).
    - [ ] Implement definition loading module (`DefinitionLoader.js` or similar).
    - [ ] Implement reading and parsing logic.
    - [ ] Implement basic validation logic.
    - [ ] Write unit tests for the loader.
- **Dependencies:** Story 1.1.

---

## Change Log

| Change        | Date       | Version | Description                  | Author         |
| ------------- | ---------- | ------- | ---------------------------- | -------------- |
| Initial Draft | 2025-05-12 | 0.1.0   | First draft of Epic 1 based on PRD. | Product Manager |