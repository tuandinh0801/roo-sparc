# Roo Init CLI Tool - Consolidated Domain Model

## Core Entities and Relationships

### Entity: Mode

A mode represents a specific role or function, grouped by categories.

**Attributes:**
- `slug`: String - Unique identifier for the mode
- `name`: String - Display name of the mode
- `roleDefinition`: String - Description of the mode's role
- `customInstructions`: String - Custom instructions for the mode
- `groups`: Array<String|Object> - Permissions and capabilities of the mode
- `source`: String - Source of the mode (always "project" for now)
- `categories`: Array<String> - IDs of categories this mode belongs to
- `primaryCategory`: String - ID of the primary category for this mode

**Relationships:**
- Has many Rules
- Belongs to one or more Categories

### Entity: Rule

A rule represents a guideline or constraint that applies to a specific mode or globally.

**Attributes:**
- `path`: String - Path to the rule file
- `content`: String - Content of the rule file
- `type`: String - Type of rule (generic or mode-specific)

**Relationships:**
- May belong to a specific Mode

### Entity: Project

A project represents the target directory where the selected modes and rules will be copied.

**Attributes:**
- `path`: String - Path to the project directory
- `name`: String - Name of the project (derived from path)

**Relationships:**
- Has many selected Modes
- Has many copied Rules

### Entity: Configuration

Configuration represents the settings and options for the CLI tool.

**Attributes:**
- `interactiveMode`: Boolean - Whether to use interactive prompts by default

### Entity: Category

A category represents a functional grouping of modes.

**Attributes:**
- `id`: String - Unique identifier for the category
- `name`: String - Display name of the category
- `description`: String - Description of the category
- `parentId`: String (optional) - ID of parent category if this is a subcategory
- `icon`: String (optional) - Icon identifier for visual representation

**Relationships:**
- May have one parent Category
- May have many child Categories
- Contains many Modes

## Data Structures

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
  categories?: string[];
  primaryCategory?: string;
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
  modes?: string[];
  targetDir?: string;
  interactive?: boolean;
  force?: boolean;
  help?: boolean;
  version?: boolean;
  category?: string[];
  allInCategory?: string[];
}
```

### Structure: CategoryDefinition

```typescript
interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  icon?: string;
}
```

### Structure: CategoryRegistry

```typescript
interface CategoryRegistry {
  definitions: CategoryDefinition[];
  hierarchy: {
    root: string[];
    children: {
      [parentId: string]: string[];
    };
  };
  byId: {
    [id: string]: CategoryDefinition;
  };
}
```

## State Transitions and Processes

### Process: CLI Initialization

1. Parse command-line arguments
2. Load configuration
3. Validate inputs
4. Determine operation mode (interactive or non-interactive)

### Process: Mode Selection

1. Initialize mode registry with all modes and categories
2. List available modes
3. Group modes by category for display
4. Prompt user to select additional modes (if interactive)
5. Allow selection by category or individual mode slugs
6. Validate selected modes

### Process: File Operations

1. Validate target directory
2. Create `.roomodes` file with selected modes
3. Create `.roo` directory structure
4. Copy mode-specific rules for selected modes
5. Copy generic rules (if any applicable to selected modes/categories or global)

## Validation Rules

### Mode Validation

- Mode slugs must be non-empty and match existing modes
- Selected modes must not have conflicts

### Path Validation

- Source paths must exist and be readable
- Target paths must be writable
- Target directory must exist

### Category Validation

- Category IDs must be unique
- Category hierarchy must not contain circular references
- Category references in modes must exist in the category registry

## Events and Event Flows

### Event: ModesSelected

- Triggered when modes are selected
- Data: Array of selected mode slugs
- Effect: Validates mode selection and prepares for file operations

### Event: CategorySelected

- Triggered when a category is selected
- Data: Selected category ID
- Effect: Selects all modes in the category

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

- **Mode**: A specific role or function, grouped by categories.
- **Rule**: A guideline or constraint that applies to a specific mode or globally.
- **Slug**: A unique identifier for a mode, typically a lowercase, hyphenated version of the name.
- **Target Project**: The directory where the selected modes and rules will be copied.
- **Category**: A functional grouping of modes by their purpose, technology focus, or domain.
- **Primary Category**: The main category a mode belongs to, for organizational purposes.
- **Mode Registry**: A centralized collection of all available modes.