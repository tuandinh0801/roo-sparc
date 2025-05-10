# Roo Init CLI Tool - Mode Categorization

This document defines how modes should be categorized into functional groups to improve organization, discoverability, and selection experience.

## Mode Category System

### Category Definition

Mode categories represent functional groupings that help organize modes by their purpose, technology focus, or domain. Categories provide a hierarchical structure that makes mode discovery and selection more intuitive.

**Key attributes of the category system:**
- Each mode belongs to at least one category
- Categories can contain subcategories (hierarchical structure)
- Categories are consistent across workflows
- Categories help with filtering and selection

### Core Categories

The system will include these predefined categories:

1. **Specification** - Modes focused on requirements, documentation, and planning
   - spec-writer
   - document-writer
   - pseudocode-generator
   - requirements-analyzer

2. **Architecture** - Modes related to architectural design and infrastructure
   - architect
   - cloud-aws
   - cloud-azure
   - framework-nextjs
   - database-design

3. **Code** - Modes that implement functionality
   - auto-coder
   - dev-react
   - dev-flutter
   - dev-node
   - refactor-specialist

4. **Design** - Modes focused on UI/UX and styling
   - design-tailwind
   - design-shadcn
   - design-material
   - ui-prototyper

5. **Testing** - Modes that create and run tests
   - tdd
   - test-generator
   - qa-specialist
   - performance-tester

6. **Security** - Modes that handle security aspects
   - security-reviewer
   - penetration-tester
   - compliance-checker

7. **DevOps** - Modes that handle deployment and operations
   - deployment-manager
   - ci-cd-specialist
   - infrastructure-automation

8. **Data** - Modes focused on data processing and management
   - data-engineer
   - ml-specialist
   - analytics-expert

9. **Management** - Meta-modes that coordinate other modes
   - orchestrator
   - project-manager
   - product-manager

## Domain Model Updates

### Entity: Category

A new entity to represent a mode category:

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

### Entity: Mode

Update the Mode entity with:

**New Attributes:**
- `categories`: Array<String> - IDs of categories this mode belongs to
- `primaryCategory`: String - ID of the primary category for this mode

## Configuration Structure

### Category Configuration

```json
{
  "categories": [
    {
      "id": "specification",
      "name": "Specification",
      "description": "Modes focused on requirements, documentation, and planning",
      "icon": "📝"
    },
    {
      "id": "architecture",
      "name": "Architecture",
      "description": "Modes related to architectural design and infrastructure",
      "icon": "🏗️"
    },
    {
      "id": "code",
      "name": "Code",
      "description": "Modes that implement functionality",
      "icon": "🧠"
    },
    // Additional categories...
  ]
}
```

### Mode with Categories

```json
{
  "slug": "spec-pseudocode",
  "name": "📋 Specification Writer",
  "roleDefinition": "You capture full project context—functional requirements, edge cases, constraints—and translate that into modular pseudocode with TDD anchors.",
  "customInstructions": "Write pseudocode as a series of md files...",
  "groups": ["read", "edit", "mcp"],
  "source": "project",
  "categories": ["specification", "planning"],
  "primaryCategory": "specification"
}
```

## Updated Pseudocode

### Category Loading and Management

```
// Load category definitions
function loadCategories(config):
    // TEST: Should load categories from configuration
    categoryDefinitions = config.categories || getDefaultCategories()
    
    // TEST: Should validate category structure
    for category in categoryDefinitions:
        validateCategoryDefinition(category)
    
    // TEST: Should build category hierarchy
    categoryHierarchy = buildCategoryHierarchy(categoryDefinitions)
    
    // TEST: Should return category registry
    return {
        definitions: categoryDefinitions,
        hierarchy: categoryHierarchy,
        byId: indexCategoriesById(categoryDefinitions)
    }

// Build category hierarchy from flat list
function buildCategoryHierarchy(categories):
    // TEST: Should create root level for categories without parents
    result = {
        root: [],
        children: {}
    }
    
    // TEST: Should identify root categories
    for category in categories:
        if !category.parentId:
            result.root.push(category.id)
            
    // TEST: Should build child relationships
    for category in categories:
        if category.parentId:
            if !result.children[category.parentId]:
                result.children[category.parentId] = []
            
            result.children[category.parentId].push(category.id)
    
    // TEST: Should return complete hierarchy
    return result

// Index categories by ID for quick lookup
function indexCategoriesById(categories):
    // TEST: Should create map of id to category
    categoryMap = {}
    
    for category in categories:
        categoryMap[category.id] = category
    
    return categoryMap

// Get default categories
function getDefaultCategories():
    // TEST: Should return predefined category structure
    return [
        {
            id: "specification",
            name: "Specification",
            description: "Modes focused on requirements, documentation, and planning",
            icon: "📝"
        },
        {
            id: "architecture",
            name: "Architecture",
            description: "Modes related to architectural design and infrastructure",
            icon: "🏗️"
        },
        // Other default categories...
    ]
```

### Mode Registry with Categories

```
// Initialize global mode registry with categories
function initializeModeRegistry(config):
    // TEST: Should create empty registry with categories
    registry = {
        modes: {},
        workflowModes: {},
        categories: loadCategories(config),
        modesByCategory: {}
    }
    
    // TEST: Should load modes from all workflows
    for workflowId, workflow in config.workflows:
        // TEST: Should load workflow details
        workflowWithModes = loadWorkflowDetails(workflow)
        
        // TEST: Should store workflow-to-modes mapping
        registry.workflowModes[workflowId] = []
        
        // TEST: Should process each mode in the workflow
        for mode in workflowWithModes.availableModes:
            // TEST: Should add origin workflow info to mode
            mode.originWorkflow = workflowId
            
            // Add default category if not specified
            if !mode.categories or mode.categories.length === 0:
                mode.categories = ["uncategorized"]
                mode.primaryCategory = "uncategorized"
            
            // TEST: Should initialize mode's categories in registry
            for categoryId in mode.categories:
                if !registry.modesByCategory[categoryId]:
                    registry.modesByCategory[categoryId] = []
                
                registry.modesByCategory[categoryId].push(mode.slug)
            
            // TEST: Should initialize array if this is first mode with this slug
            if !registry.modes[mode.slug]:
                registry.modes[mode.slug] = []
            
            // TEST: Should add mode to registry
            registry.modes[mode.slug].push(mode)
            
            // TEST: Should add mode slug to workflow's modes list
            registry.workflowModes[workflowId].push(mode.slug)
    
    // TEST: Should return populated registry
    return registry

// Get modes by category
function getModesByCategory(registry, categoryId):
    // TEST: Should return array of modes in the category
    if !registry.modesByCategory[categoryId]:
        return []
    
    // TEST: Should retrieve mode objects for all modes in category
    return registry.modesByCategory[categoryId].map(slug => 
        getModeBySlug(registry, slug)
    )
```

### Grouped Mode Selection Display

```
// Display modes grouped by category
function displayModesGroupedByCategory(registry, selectedWorkflowId = null):
    // TEST: Should display categorized modes
    console.log("Available Modes:")
    
    // For sorted display of categories
    sortedCategories = [...registry.categories.definitions].sort((a, b) => 
        a.name.localeCompare(b.name)
    )
    
    // TEST: Should display each category
    for category in sortedCategories:
        // Get modes in this category, filtered by workflow if specified
        categoryModes = getModesByCategory(registry, category.id)
        
        // Filter by workflow if specified
        if selectedWorkflowId:
            categoryModes = categoryModes.filter(mode => 
                mode.originWorkflow === selectedWorkflowId
            )
        
        // Only show categories with available modes
        if categoryModes.length > 0:
            console.log(`\n${category.icon || ""} ${category.name}:`)
            
            // TEST: Should display modes in category
            for mode in categoryModes:
                // Determine indicators
                workflowIndicator = ""
                if !selectedWorkflowId and mode.originWorkflow:
                    workflowIndicator = `[${getWorkflowName(mode.originWorkflow)}] `
                
                coreIndicator = ""
                if isCoreModeInWorkflow(mode.slug, mode.originWorkflow):
                    coreIndicator = "[CORE] "
                
                console.log(`  - ${mode.slug}: ${workflowIndicator}${coreIndicator}${mode.name} - ${mode.roleDefinition}`)
```

### Interactive Category-Based Mode Selection

```
// Prompt for mode selection with category support
function promptForModesWithCategories(registry, preSelectedModes, selectedWorkflowId = null):
    // TEST: Should display modes by category
    displayModesGroupedByCategory(registry, selectedWorkflowId)
    
    // TEST: Should show pre-selected modes
    preSelectedSlugs = preSelectedModes.map(mode => mode.slug)
    console.log(`\nPre-selected modes: ${preSelectedSlugs.join(", ")}`)
    
    // TEST: Should offer category-based filtering
    console.log("\nYou can select by category or individual modes.")
    console.log("To select all modes in a category, use: category:category_id")
    console.log("To select individual modes, list them separated by commas.")
    
    // TEST: Should prompt for selection
    input = readUserInput("Enter your selections: ")
    
    // TEST: Should handle empty input (use pre-selected)
    if !input or input.trim() === "":
        return preSelectedModes
    
    // TEST: Should parse input with special handling for categories
    selectedSlugs = []
    inputParts = input.split(",").map(part => part.trim())
    
    // Process each input part
    for part in inputParts:
        // TEST: Should handle category selection syntax
        if part.startsWith("category:"):
            categoryId = part.substring(9)
            categoryModes = getModesByCategory(registry, categoryId)
            
            // Filter by workflow if necessary
            if selectedWorkflowId:
                categoryModes = categoryModes.filter(mode => 
                    mode.originWorkflow === selectedWorkflowId
                )
            
            // Add all category modes
            selectedSlugs = [...selectedSlugs, ...categoryModes.map(mode => mode.slug)]
        else:
            // Regular mode selection
            selectedSlugs.push(part)
    
    // Validate selections
    validatedSlugs = validateModeSlugs(registry, selectedSlugs)
    
    // TEST: Should combine pre-selected and user-selected modes
    finalModes = [...preSelectedModes]
    
    // Add user-selected modes that aren't already pre-selected
    for slug in validatedSlugs:
        if !preSelectedSlugs.includes(slug):
            mode = getModeBySlug(registry, slug, selectedWorkflowId)
            if mode:
                finalModes.push(mode)
    
    // TEST: Should return combined mode objects
    return finalModes
```

## UI/UX Considerations

### Command Line Interface

The CLI should offer category-based filtering and selection:

```
# List modes by category
roo-init list-modes --by-category

# Select modes by category
roo-init --workflow sparc --category code --category architecture

# Select all modes in a category
roo-init --workflow sparc --all-in-category code
```

### Interactive Mode

In interactive mode, the CLI should:

1. Display modes grouped by category
2. Allow selection of all modes in a category
3. Allow filtering by category before selecting individual modes
4. Show category icons for visual identification
5. Maintain color-coding for categories

## Acceptance Criteria

- **AC-CAT-1**: Mode definitions can be assigned to one or more categories
- **AC-CAT-2**: Modes display correctly grouped by category in the CLI
- **AC-CAT-3**: Users can select all modes in a specific category with a single command
- **AC-CAT-4**: Categories are consistent across different workflows
- **AC-CAT-5**: The CLI properly handles modes without category assignments
- **AC-CAT-6**: Category hierarchy (parent/child relationships) displays correctly
- **AC-CAT-7**: Category filtering works in both interactive and non-interactive modes
- **AC-CAT-8**: Category definitions are extensible to support custom categories