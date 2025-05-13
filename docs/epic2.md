# Epic 2: Interactive Mode, Robustness & MVP Completion

**Goal:** Implement the interactive user prompting system for discovering and selecting modes, generate the `.roomodes` file, copy rule files, handle existing files via a `--force` flag, and provide robust error handling and user feedback. This epic delivers the complete interactive MVP workflow.

**Deployability:** This epic builds directly on Epic 1 (Core Framework & Definition Loading). Upon completion, the CLI tool will be capable of guiding a user through selecting modes interactively, performing the core file operations robustly (handling existing files and errors), and providing clear feedback. This represents the complete, deployable MVP.

## Epic-Specific Technical Context

- **Dependency:** Builds upon the CLI framework, argument parsing, and definition loading established in Epic 1.
- **New Dependencies:** Requires an interactive prompt library (e.g., `inquirer`) to handle user interaction.
- **Core Logic:** Introduces modules/services for:
    - Presenting modes/categories to the user.
    - Handling user selections (multi-select for modes, category selection).
    - Resolving selected modes/categories to specific mode definitions and associated rule files.
    - Performing file system operations: creating `.roo` directories, writing the `.roomodes` JSON file, copying rule files.
- **File System Interaction:** Logic to safely interact with the target project directory, including creating directories, writing/copying files, checking for existing files, and respecting the `--force` flag.
- **Error Handling & Feedback:** Implementation of comprehensive error handling and clear user feedback mechanisms.
- **Argument Parsing:** Extend argument parsing to include the `--force` flag.

## Local Testability & Command-Line Access

- **Local Development:** Developers can run the CLI in interactive mode (e.g., `node ./bin/roo-init.js` or `roo-init` if linked) to test the prompting and file generation flow.
- **Command-Line Testing:**
    - Manual execution of the interactive flow, verifying prompts and outputs.
    - Integration tests are crucial here, potentially mocking the interactive prompts (`inquirer` often supports this) and verifying the state of a temporary target directory after execution (checking for `.roomodes` content, rule files, handling of existing files with/without `--force`, and correct error messages/exit codes for various scenarios).
- **Environment Testing:** N/A for this epic.
- **Testing Prerequisites:** Completion of Epic 1. Node.js environment set up. A temporary, writable directory is needed for integration tests to act as the target project.

## Story List

### Story 2.1: Implement Interactive Mode Trigger and Basic Flow

- **User Story / Goal:** As a Developer, when I run `roo-init`, I want the CLI to enter an interactive mode to guide me through the setup process, while also allowing a `--force` flag to overwrite existing files.
- **Detailed Requirements:**
    - Modify the argument parsing logic (from Epic 1) to handle the `--force` flag and trigger interactive mode by default unless `--help` or `--version` is specified.
    - When interactive mode is triggered, initiate the prompting sequence (starting with category/mode selection).
    - Integrate an interactive prompt library (e.g., `inquirer`).
    - Make the state of the `--force` flag available to subsequent file operation steps.
- **Acceptance Criteria (ACs):**
    - AC1: Running `roo-init` triggers the interactive prompt sequence.
    - AC2: Running `roo-init --help` or `roo-init --version` does *not* trigger the interactive mode.
    - AC3: Running `roo-init --force` triggers the interactive prompt sequence and registers the force flag internally.
    - AC4: The chosen interactive prompt library is added as a dependency and integrated.
- **Tasks (Optional Initial Breakdown):**
    - [ ] Update argument parsing logic to handle `--force` and identify interactive trigger.
    - [ ] Add `inquirer` (or similar) dependency.
    - [ ] Implement the initial call to the interactive prompt flow.
- **Dependencies:** Epic 1 (specifically Story 1.2).

---

### Story 2.2: Interactive Mode Discovery & Selection (Categories & Modes)

- **User Story / Goal:** As a CLI User in interactive mode, I want to be presented with a list of available modes, grouped by category, and be able to select one or more modes for my project.
- **Detailed Requirements:**
    - Utilize the loaded definitions (from Story 1.3).
    - Present users with a list of categories first (using checkbox prompt for multi-select).
    - Based on selected categories (or an option like "Show all modes"), present a list of corresponding modes (using checkbox prompt for multi-select), displaying mode name and description.
    - Allow users to confirm their final selection of modes.
    - Handle the case where no modes are selected.
- **Acceptance Criteria (ACs):**
    - AC1: User is prompted to select categories from the available list.
    - AC2: User is prompted to select modes based on chosen categories (or all modes). Mode names and descriptions are displayed.
    - AC3: User can select multiple modes using the interactive prompt (e.g., spacebar with `inquirer` checkboxes).
    - AC4: The CLI correctly captures the list of selected mode slugs based on user interaction.
    - AC5: If the user selects no modes, the process informs them and potentially exits gracefully or re-prompts (TBD final behavior).
- **Tasks (Optional Initial Breakdown):**
    - [ ] Implement category selection prompt.
    - [ ] Implement mode selection prompt, filtering by category if applicable.
    - [ ] Implement logic to map user prompt choices back to mode slugs.
    - [ ] Handle display formatting for prompts.
    - [ ] Handle "no selection" case.
- **Dependencies:** Story 1.3, Story 2.1.

---

### Story 2.3: Generate `.roomodes` File

- **User Story / Goal:** As a Developer using the interactive mode, after selecting modes, I want the CLI to create or update a `.roomodes` file in my target project directory containing the definitions of the selected modes.
- **Detailed Requirements:**
    - Identify the target project directory (defaults to the current working directory, but may need future configuration).
    - Retrieve the full `ModeDefinition` objects for the modes selected in Story 2.2.
    - Format the selected mode definitions into the specified JSON structure for `.roomodes`.
    - Write the JSON content to a file named `.roomodes` in the root of the target project directory.
    - Before writing, check if `.roomodes` already exists.
    - If it exists and the `--force` flag (from Story 2.1) was *not* provided, report an error and halt.
    - If it exists and `--force` *was* provided, overwrite the file.
    - If it does not exist, create it.
- **Acceptance Criteria (ACs):**
    - AC1: After mode selection, a `.roomodes` file is created in the target directory if it doesn't exist.
    - AC2: The content of the created `.roomodes` file is valid JSON.
    - AC3: The JSON structure contains an array of `ModeDefinition` objects corresponding exactly to the selected modes.
    - AC4: If `.roomodes` exists and `--force` is not used, the command fails with an error message indicating the conflict.
    - AC5: If `.roomodes` exists and `--force` is used, its content is replaced with the new JSON based on the current selection.
- **Tasks (Optional Initial Breakdown):**
    - [ ] Implement logic to get target directory path.
    - [ ] Implement logic to retrieve full definitions for selected mode slugs.
    - [ ] Implement JSON formatting for `.roomodes`.
    - [ ] Implement file existence check for `.roomodes`.
    - [ ] Implement conditional file writing logic for `.roomodes` based on `--force`.
- **Dependencies:** Story 1.3, Story 2.2.

---

### Story 2.4: Copy Rule Files to `.roo` Directory Structure

- **User Story / Goal:** As a Developer using the interactive mode, after selecting modes, I want the CLI to copy the associated rule files (`.md`) into the correct `.roo/rules/` and `.roo/rules-[mode_slug]/` structure within my target project directory.
- **Detailed Requirements:**
    - For each selected mode, identify its associated rule files (both generic and mode-specific) based on the loaded definitions (Story 1.3).
    - Determine the source path of these rule files within the CLI's bundled assets.
    - Determine the target path within the target project directory:
        - Generic rules go into `.roo/rules/`.
        - Mode-specific rules go into `.roo/rules-[mode_slug]/`.
    - Create the `.roo` directory and necessary subdirectories (`rules`, `rules-[mode_slug]`) if they don't exist.
    - Copy the rule files from the source to the target locations.
    - Before copying each rule file, check if the target file already exists.
    - If a target file exists and the `--force` flag (from Story 2.1) was *not* provided, report an error (listing all conflicting files found) and halt the process before copying any files.
    - If target files exist and `--force` *was* provided, proceed with overwriting them.
    - If target files do not exist, copy them normally.
- **Acceptance Criteria (ACs):**
    - AC1: The `.roo` directory is created in the target project if it doesn't exist.
    - AC2: For each selected mode, its associated `rules-[mode_slug]` directory is created under `.roo` if it doesn't exist.
    - AC3: All generic rule files associated with *any* selected mode are copied to `.roo/rules/`.
    - AC4: All mode-specific rule files for *each* selected mode are copied to the corresponding `.roo/rules-[mode_slug]/` directory.
    - AC5: File content of copied rules matches the source rule files.
    - AC6: If any rule file conflicts exist in the target directories and `--force` is not used, the command fails with an error message listing all conflicts.
    - AC7: If rule file conflicts exist and `--force` is used, the existing files are overwritten by the copied files.
- **Tasks (Optional Initial Breakdown):**
    - [ ] Implement logic to resolve rule file paths (source and target) based on selected modes.
    - [ ] Implement directory creation logic (`mkdir -p` equivalent).
    - [ ] Implement file existence checks for rule files.
    - [ ] Implement conditional file copying logic based on `--force`.
    - [ ] Refine error reporting for multiple conflicts.
- **Dependencies:** Story 1.3, Story 2.2.

---

## Change Log

| Change        | Date       | Version | Description                  | Author         |
| ------------- | ---------- | ------- | ---------------------------- | -------------- |
| Initial Draft | 2025-05-12 | 0.1.0   | First draft of Epic 2 based on PRD. | Product Manager |
| Scope Update  | 2025-05-12 | 0.2.0   | Merged --force, error handling, and feedback from removed Epic 3. Updated goal and deployability. | Product Manager |

---

### Story 2.5: Implement Comprehensive Error Handling & User Feedback

- **User Story / Goal:** As a CLI User, I want clear feedback about the process, including success messages and informative error messages when things go wrong (like invalid input, file permission issues, or missing definitions).
- **Detailed Requirements:**
    - Implement clear success messages upon completion (e.g., "Project initialized successfully with modes: [list of modes]. Files created/updated in [target directory].").
    - Implement specific error handling and user-friendly messages for:
        - Failure to load/parse internal mode/rule definitions (from Story 1.3).
        - File system errors (e.g., lack of write permissions in the target directory, disk full - where detectable).
        - Overwrite conflicts when `--force` is not used (refine from Story 2.3 & 2.4).
        - User aborting interactive prompts (e.g., Ctrl+C).
    - Ensure consistent exit codes (e.g., 0 for success, non-zero for errors).
    - Add progress indicators during file operations. Simple console logs like "Creating .roomodes...", "Copying rule files..." are sufficient for MVP.
- **Acceptance Criteria (ACs):**
    - AC1: Successful execution prints a clear confirmation message listing applied modes and target directory.
    - AC2: Attempting to write to a non-writable directory results in a permission-related error message and non-zero exit code.
    - AC3: Internal errors (like failing to load definitions) result in an informative error message and non-zero exit code.
    - AC4: Overwrite conflicts without `--force` result in specific error messages listing conflicting files and a non-zero exit code.
    - AC5: Simple progress messages are logged to the console during file operations.
    - AC6: All error conditions result in a non-zero exit code. Successful completion results in a zero exit code.
    - AC7: Aborting interactive prompts results in a clear message and non-zero exit code.
- **Tasks (Optional Initial Breakdown):**
    - [ ] Define standard success message format.
    - [ ] Implement centralized error handling mechanism/utility if not already done.
    - [ ] Add specific error handlers/messages for identified error conditions (FS errors, definition errors, user abort).
    - [ ] Ensure non-zero exit codes on all errors.
    - [ ] Add console logging for progress indication.
    - [ ] Refine existing error messages (from previous stories) for clarity and consistency.
- **Dependencies:** Story 2.1, 2.2, 2.3, 2.4.