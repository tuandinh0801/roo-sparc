# Roo Init CLI Tool - Domain Model

## Core Entities and Relationships

### Entity: Workflow

A workflow represents a collection of modes and rules that define a specific development methodology (e.g., SPARC, BMAD).

**Attributes:**
- `id`: String - Unique identifier for the workflow
- `name`: String - Display name of the workflow
- `description`: String - Description of the workflow
- `coreModes`: Array<String> - List of mode slugs that are considered core/essential for this workflow
- `recommendedModes`: Array<String> - List of mode slugs that are recommended but not required
- `sourcePath`: String - Base path where the workflow's modes and rules are defined

**Relationships:**
- Has many Modes
- Has many Rules

### Entity: Mode

A mode represents a specific role or function within a workflow (e.g., architect, code, tdd).

**Attributes:**
- `slug`: String - Unique identifier for the mode
- `name`: String - Display name of the mode
- `roleDefinition`: String - Description of the mode's role
- `customInstructions`: String - Custom instructions for the mode
- `groups`: Array<String|Object> - Permissions and capabilities of the mode
- `source`: String - Source of the mode (always "project" for now)

**Relationships:**
- Belongs to one or more Workflows
- Has many Rules

### Entity: Rule

A rule represents a guideline or constraint that applies to a specific mode or workflow.

**Attributes:**
- `path`: String - Path to the rule file
- `content`: String - Content of the rule file
- `type`: String - Type of rule (generic or mode-specific)

**Relationships:**
- Belongs to a Workflow
- May belong to a specific Mode

### Entity: Project

A project represents the target directory where the selected modes and rules will be copied.

**Attributes:**
- `path`: String - Path to the project directory
- `name`: String - Name of the project (derived from path)

**Relationships:**
- Has one selected Workflow
- Has many selected Modes
- Has many copied Rules

### Entity: Configuration

Configuration represents the settings and options for the CLI tool.

**Attributes:**
- `workflowsPath`: String - Path to the directory containing workflow definitions
- `defaultWorkflow`: String - ID of the default workflow
- `interactiveMode`: Boolean - Whether to use interactive prompts by default

## Data Structures

### Structure: WorkflowDefinition

```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  coreModes: string[];
  recommendedModes: string[];
  sourcePath: string;
  modesPath: string;
  rulesPath: string;
}
```

### Structure: ModeDefinition

```typescript
interface ModeDefinition {
  slug: string;
  name: string;
  roleDefinition: string;
  customInstructions: string;
  groups: Array<string | {
    fileRegex?: string;
    description?: string;
  }>;
  source: string;
}
```

### Structure: RoomodeFile

```typescript
interface RoomodeFile {
  customModes: ModeDefinition[];
}
```

### Structure: CLIOptions

```typescript
interface CLIOptions {
  workflow?: string;
  modes?: string[];
  targetDir?: string;
  interactive?: boolean;
  force?: boolean;
  help?: boolean;
  version?: boolean;
}
```

### Structure: WorkflowConfig

```typescript
interface WorkflowConfig {
  workflows: {
    [id: string]: WorkflowDefinition;
  };
  defaultWorkflow: string;
}
```

## State Transitions and Processes

### Process: CLI Initialization

1. Parse command-line arguments
2. Load configuration
3. Validate inputs
4. Determine operation mode (interactive or non-interactive)

### Process: Workflow Selection

1. List available workflows
2. Prompt user to select a workflow (if interactive)
3. Validate selected workflow
4. Load workflow definition

### Process: Mode Selection

1. List available modes for the selected workflow
2. Pre-select core modes
3. Prompt user to select additional modes (if interactive)
4. Validate selected modes
5. Resolve mode dependencies

### Process: File Operations

1. Validate target directory
2. Create `.roomodes` file with selected modes
3. Create `.roo` directory structure
4. Copy mode-specific rules
5. Copy generic workflow rules

## Validation Rules

### Workflow Validation

- Workflow ID must be non-empty and match an existing workflow
- Workflow definition must include required fields (id, name, sourcePath)

### Mode Validation

- Mode slugs must be non-empty and match existing modes in the workflow
- Selected modes must not have conflicts
- Core modes cannot be deselected unless force option is used

### Path Validation

- Source paths must exist and be readable
- Target paths must be writable
- Target directory must exist

## Events and Event Flows

### Event: WorkflowSelected

- Triggered when a workflow is selected
- Data: Selected workflow ID
- Effect: Loads workflow definition and available modes

### Event: ModesSelected

- Triggered when modes are selected
- Data: Array of selected mode slugs
- Effect: Validates mode selection and prepares for file operations

### Event: FilesCreated

- Triggered when files are created in the target project
- Data: Paths of created files
- Effect: Logs success message and continues to next operation

### Event: OperationCompleted

- Triggered when all operations are completed
- Data: Summary of operations performed
- Effect: Displays success message and exits

### Event: ErrorOccurred

- Triggered when an error occurs
- Data: Error message and details
- Effect: Displays error message and exits with non-zero code

## Glossary of Domain-Specific Terminology

- **Workflow**: A collection of modes and rules that define a specific development methodology.
- **Mode**: A specific role or function within a workflow.
- **Rule**: A guideline or constraint that applies to a specific mode or workflow.
- **Slug**: A unique identifier for a mode, typically a lowercase, hyphenated version of the name.
- **Core Mode**: A mode that is essential for a workflow and should be pre-selected.
- **Recommended Mode**: A mode that is suggested but not required for a workflow.
- **Target Project**: The directory where the selected modes and rules will be copied.
- **Source Path**: The base path where a workflow's modes and rules are defined.