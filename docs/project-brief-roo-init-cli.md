# Project Brief: Roo Init CLI Tool

## Introduction / Problem Statement

The Roo Init CLI tool is designed to streamline and standardize the initialization of new software projects. Currently, setting up projects with specific configurations, modes (representing roles or functions), and associated rules can be a manual, error-prone, and time-consuming process. This tool addresses the need for a consistent and efficient way for developers to select predefined modes and have their definitions and corresponding rules automatically copied into a new or existing project structure. All modes and rules are pre-defined within the CLI's ecosystem, and users select from these available options.

## Vision & Goals

- **Vision:** To empower developers with a rapid, reliable, and standardized method for bootstrapping projects with best-practice configurations, thereby reducing setup overhead and promoting consistency across development environments.
- **Primary Goals (MVP):**
  - Goal 1: Enable users to easily discover and select one or more predefined 'modes' (and implicitly their associated 'rules') for project initialization through a command-line interface.
  - Goal 2: Reliably copy the definitions of all selected modes into a `.roomodes` JSON file within the target project directory.
  - Goal 3: Accurately copy all rules associated with the selected modes into the correct `.roo/rules-[mode_slug]/` and `.roo/rules/` (for generic rules) directory structure within the target project.
  - Goal 4: Support both interactive (user-prompted) and non-interactive (command-line argument driven) modes of operation for mode selection and project initialization.
  - Goal 5: Allow modes to be organized and selected via categories, providing users with a structured way to browse and choose relevant configurations.
- **Success Metrics (Initial Ideas):**
  - Number of successful project initializations via the CLI per week/month.
  - Average time taken for a user to initialize a project using the CLI compared to manual setup.
  - User satisfaction rating (e.g., via optional feedback survey).
  - Number of unique modes/categories utilized.
  - Reduction in project setup-related support requests or configuration errors.

## Target Audience / Users

- **Primary Users:** Software developers and development teams who frequently start new projects or need to apply standardized configurations to existing ones.
- **Key Characteristics/Needs:**
    - Need for rapid project scaffolding.
    - Desire for consistency in project structure and tooling across multiple projects or team members.
    - Value clear, discoverable options for configurations.
    - May work in environments requiring adherence to specific sets of rules or practices defined by modes.

## Key Features / Scope (High-Level Ideas for MVP)

- **Mode Discovery & Selection:**
    - List all available modes, grouped by category.
    - Allow selection of individual modes by slug.
    - Allow selection of all modes within one or more specified categories.
- **File Generation & Copying:**
    - Create/update `.roomodes` file in the target project with selected mode definitions.
    - Create `.roo` directory structure in the target project.
    - Copy mode-specific rule files (`*.md`) to `.roo/rules-[mode_slug]/`.
    - Copy generic rule files (`*.md`) to `.roo/rules/`.
- **CLI Operations:**
    - Interactive mode for guided selection.
    - Non-interactive mode for scripted/automated use (e.g., via `--modes` or `--category` flags).
    - `--help` command for usage instructions.
    - `--version` command to display CLI version.
    - `--force` option to overwrite existing files.
- **Feedback & Error Handling:**
    - Clear progress messages during operations.
    - Informative error messages for invalid selections, file system issues, or configuration problems.

## Known Technical Constraints or Preferences

- **Constraints:**
  - **Implementation Language:** Must be implemented in Node.js. ([TC1.1](specs/consolidated_requirements_and_criteria.md:94))
  - **Node.js Version:** Must be compatible with Node.js version 14.x and above. ([TC1.2](specs/consolidated_requirements_and_criteria.md:95))
  - **Platform Compatibility:** Must be cross-platform (Windows, macOS, Linux). ([TC1.3](specs/consolidated_requirements_and_criteria.md:96))
  - **Dependencies:** Strive for minimal external dependencies to ensure easy installation and maintenance. ([TC1.4](specs/consolidated_requirements_and_criteria.md:97))
  - **Performance:** Initialization should complete within a reasonable timeframe (e.g., < 30 seconds for typical projects with a moderate number of modes/rules). ([PC1.1](specs/consolidated_requirements_and_criteria.md:101))
- **Risks:**
  - **Scalability:** Efficiently handling a very large number of modes, categories, and rule files. ([PC1.2](specs/consolidated_requirements_and_criteria.md:102))
  - **Dependency Management (Future):** If modes develop dependencies on other modes, resolving these correctly could become complex. ([FR1.7](specs/consolidated_requirements_and_criteria.md:18))
  - **Configuration Complexity:** Ensuring the system for defining modes, categories, and their associated rules remains manageable and extensible. ([FR4.1](specs/consolidated_requirements_and_criteria.md:36))
  - **User Experience:** Balancing the richness of options with ease of use, especially in interactive mode.

## Relevant Research (Optional)

The primary inputs for this brief are the existing detailed specification documents:
- [`specs/consolidated_domain_model.md`](specs/consolidated_domain_model.md)
- [`specs/consolidated_requirements_and_criteria.md`](specs/consolidated_requirements_and_criteria.md)

## PM Prompt

**To the Product Manager:**

Please use this Project Brief to initiate the creation of a detailed Product Requirements Document (PRD) for the "Roo Init CLI Tool."

**Core Objective:** Develop an MVP for a Node.js CLI tool that enables developers to initialize projects by selecting predefined 'modes' (which bundle configurations and custom instructions) and 'rules' (markdown guideline files). The tool should copy these selected mode definitions into a `.roomodes` file and their associated rule files into a `.roo` directory structure within the target project.

**Key Areas for PRD Elaboration:**

1.  **User Stories & Flows:** Detail the user journey for both interactive and non-interactive CLI usage, covering mode discovery, selection (by individual slug and by category), and project initialization.
2.  **MVP Feature Prioritization:** Confirm the MVP scope based on the "Key Features" listed above and the Functional Requirements ([FR sections in `specs/consolidated_requirements_and_criteria.md`](specs/consolidated_requirements_and_criteria.md:7)).
3.  **Mode & Rule Management:** While modes/rules are pre-defined for the MVP, consider the underlying structure for how these are stored and accessed by the CLI (refer to `ModeDefinition`, `Rule`, `CategoryDefinition` in [`specs/consolidated_domain_model.md`](specs/consolidated_domain_model.md)).
4.  **Error Handling & User Feedback:** Specify user-facing messages for common success, warning, and error scenarios (refer to Edge Cases and Acceptance Criteria for error handling).
5.  **Extensibility Considerations:** While focusing on MVP, keep in mind the requirement for future extensibility ([FR4.1](specs/consolidated_requirements_and_criteria.md:36)).
6.  **Acceptance Criteria:** Leverage and refine the detailed Acceptance Criteria provided in [`specs/consolidated_requirements_and_criteria.md`](specs/consolidated_requirements_and_criteria.md:134) for each functional requirement.

**Context & Constraints:**
- The tool must be built with Node.js (v20.x+).
- Refer to [`specs/consolidated_domain_model.md`](specs/consolidated_domain_model.md) for entity definitions and relationships.
- Refer to [`specs/consolidated_requirements_and_criteria.md`](specs/consolidated_requirements_and_criteria.md) for detailed requirements, edge cases, and constraints.

The goal is to provide developers with a simple, efficient, and standardized way to bootstrap their projects.