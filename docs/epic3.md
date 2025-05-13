# Epic 3: Non-Interactive Mode, Advanced Options, and Robustness

**Goal:** Implement the non-interactive mode using command-line flags (e.g., `--modes`, `--category`), add the `--force` option for overwriting files, and implement comprehensive error handling and user feedback mechanisms. This epic completes the core MVP functionality by adding automation support and making the tool more robust and user-friendly.

**Deployability:** This epic builds upon the core framework (Epic 1) and the interactive file generation logic (Epic 2). Upon completion, the CLI tool will support both interactive and non-interactive workflows, handle existing files gracefully (with `--force`), and provide better feedback, making the MVP feature-complete and ready for initial user testing or release.

## Epic-Specific Technical Context

- **Dependency:** Builds upon Epic 1 and Epic 2.
- **Argument Parsing:** Extend the argument parsing logic (from Story 1.2) to handle new flags:
    - `--modes <slug1>,<slug2>,...`: Specify modes directly.
    - `--category <cat1>,<cat2>,...`: Specify categories directly.
    - `--force`: Boolean flag to enable overwriting.
    - Potentially `--target-dir <path>`: Specify a target directory other than CWD (Consider if this is MVP or post-MVP based on refinement).
- **Workflow Logic:** Adapt the core mode selection and file generation logic (from Epic 2) to work based on flags instead of interactive prompts when in non-interactive mode.
- **File System Logic:** Enhance file system operations (from Story 2.3 & 2.4) to check for existing files/directories and respect the `--force` flag.
- **Error Handling:** Implement more specific error handling for various scenarios (invalid mode/category slugs provided via flags, file system permission issues, definition loading errors) and provide clear, user-facing error messages.
- **User Feedback:** Implement clear success messages and progress indicators for both interactive and non-interactive modes.

## Local Testability & Command-Line Access

- **Local Development:** Developers can run the CLI with the new flags (e.g., `node ./bin/roo-init.js --modes mode-a,mode-b`, `node ./bin/roo-init.js --category cat-x --force`) to test non-interactive flows and options.
- **Command-Line Testing:**
    - Execute `roo-init` with various combinations of `--modes` and `--category` flags, verifying the correct files (`.roomodes`, rules) are generated in a test target directory.
    - Test behavior with and without the `--force` flag when target files/directories already exist.
    - Test invalid inputs (non-existent mode/category slugs) provided via flags, verifying appropriate error messages.
    - Test file system permission errors (if feasible in the test environment) to verify error handling.
    - Integration tests should cover these non-interactive scenarios, checking command exit codes and the state of the target directory.
- **Environment Testing:** N/A for this epic.
- **Testing Prerequisites:** Completion of Epics 1 & 2. Node.js environment. Writable temporary directories for testing file operations, including pre-populating them to test `--force` behavior.

## Story List

### Story 3.1: Implement Non-Interactive Mode Flags (`--modes`, `--category`)

- **User Story / Goal:** As a CLI User, I want to specify modes or categories directly via command-line flags (`--modes`, `--category`) so that I can automate project initialization in scripts.
- **Detailed Requirements:**
    - Add `--modes` flag to the argument parser, accepting a comma-separated list of mode slugs.
    - Add `--category` flag to the argument parser, accepting a comma-separated list of category slugs.
    - Update the main CLI logic to detect these flags. If present, bypass the interactive prompts (from Epic 2).
    - Validate the provided slugs against the loaded definitions (from Story 1.3). Report errors for invalid/unknown slugs.
    - Resolve the provided mode/category slugs to the final list of `ModeDefinition` objects to be processed. Handle potential duplicates if a mode is specified directly and also belongs to a specified category.
- **Acceptance Criteria (ACs):**
    - AC1: Running `roo-init --modes <slug1>,<slug2>` executes the initialization process for the specified modes without interactive prompts.
    - AC2: Running `roo-init --category <cat1>` executes the initialization process for all modes within that category without interactive prompts.
    - AC3: Running `roo-init --modes <slug1> --category <cat1>` correctly resolves and processes all unique modes from both the direct slug and the category.
    - AC4: Running with an invalid slug (e.g., `roo-init --modes non-existent-mode`) produces a clear error message listing the invalid slug(s) and exits non-zero.
    - AC5: Running with valid flags correctly triggers the file generation steps (Story 2.3, 2.4) using the resolved modes.
- **Tasks (Optional Initial Breakdown):**
    - [ ] Add `--modes` and `--category` flag definitions to the argument parser.
    - [ ] Implement logic to detect non-interactive mode trigger based on flags.
    - [ ] Implement slug validation against loaded definitions.
    - [ ] Implement logic to resolve flags to a final list of modes.
    - [ ] Integrate resolved modes with existing file generation logic.
- **Dependencies:** Epic 1, Epic 2.

---

### Story 3.2: Implement Overwrite Protection (`--force` Flag)

- **User Story / Goal:** As a CLI User, I want the tool to prevent accidental overwriting of existing `.roomodes` or rule files, unless I explicitly use a `--force` flag.
- **Detailed Requirements:**
    - Add a `--force` boolean flag to the argument parser.
    - Modify the file writing logic (Story 2.3 for `.roomodes`) and file copying logic (Story 2.4 for rules) to check if the target file already exists *before* writing/copying.
    - If a target file exists and `--force` is *not* provided:
        - Report an error message indicating which file(s) would be overwritten.
        - Prevent the write/copy operation for that specific file.
        - Potentially halt the entire process or continue with non-conflicting files (TBD - simpler to halt on first conflict for MVP).
    - If a target file exists and `--force` *is* provided, proceed with overwriting as implemented in Epic 2.
- **Acceptance Criteria (ACs):**
    - AC1: Running `roo-init` (interactive or non-interactive) targeting a directory with an existing `.roomodes` file fails with an error message mentioning the file, unless `--force` is used.
    - AC2: Running `roo-init` targeting a directory with existing rule files in `.roo/` fails with an error message mentioning the conflicting files, unless `--force` is used.
    - AC3: Running `roo-init --force` successfully overwrites existing `.roomodes` and rule files in the target directory.
    - AC4: If only some files conflict, the error message clearly indicates all conflicts found before halting (or lists files skipped if choosing to continue).
- **Tasks (Optional Initial Breakdown):**
    - [ ] Add `--force` flag definition to the argument parser.
    - [ ] Add file existence checks before writing `.roomodes`.
    - [ ] Add file existence checks before copying rule files.
    - [ ] Implement conditional logic based on `--force` flag.
    - [ ] Define and implement clear error messages for overwrite conflicts.
- **Dependencies:** Story 2.3, Story 2.4, Story 3.1 (for testing non-interactive).

---

### Story 3.3: Implement Comprehensive Error Handling & User Feedback

- **User Story / Goal:** As a CLI User, I want clear feedback about the process, including success messages and informative error messages when things go wrong (like invalid input, file permission issues, or missing definitions).
- **Detailed Requirements:**
    - Implement clear success messages upon completion (e.g., "Project initialized successfully with modes: [list of modes]. Files created/updated in [target directory].").
    - Implement specific error handling and user-friendly messages for:
        - Invalid mode/category slugs provided via flags (refine from Story 3.1).
        - Failure to load/parse internal mode/rule definitions.
        - File system errors (e.g., lack of write permissions in the target directory, disk full - where detectable).
        - Overwrite conflicts (refine from Story 3.2).
    - Ensure consistent exit codes (e.g., 0 for success, non-zero for errors).
    - Add progress indicators, especially for potentially longer operations (though MVP operations should be fast). Simple console logs like "Creating .roomodes...", "Copying rule files..." are sufficient for MVP.
- **Acceptance Criteria (ACs):**
    - AC1: Successful execution (interactive or non-interactive) prints a clear confirmation message listing applied modes and target directory.
    - AC2: Providing invalid slugs via flags results in a specific error message and non-zero exit code.
    - AC3: Attempting to write to a non-writable directory results in a permission-related error message and non-zero exit code.
    - AC4: Internal errors (like failing to load definitions) result in an informative error message and non-zero exit code.
    - AC5: Simple progress messages are logged to the console during file operations.
    - AC6: All error conditions result in a non-zero exit code. Successful completion results in a zero exit code.
- **Tasks (Optional Initial Breakdown):**
    - [ ] Define standard success message format.
    - [ ] Implement centralized error handling mechanism/utility.
    - [ ] Add specific error handlers/messages for identified error conditions (invalid input, FS errors, definition errors).
    - [ ] Ensure non-zero exit codes on all errors.
    - [ ] Add console logging for progress indication.
    - [ ] Refine existing error messages (from previous stories) for clarity and consistency.
- **Dependencies:** Story 3.1, Story 3.2.

---

## Change Log

| Change        | Date       | Version | Description                               | Author         |
| ------------- | ---------- | ------- | ----------------------------------------- | -------------- |
| Initial Draft | 2025-05-12 | 0.1.0   | First draft of Epic 3 based on PRD & Epics 1/2. | Product Manager |