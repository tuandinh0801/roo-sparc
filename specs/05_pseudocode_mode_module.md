# Roo Init CLI Tool - Mode Module Pseudocode

This module handles mode management, including selecting modes for a workflow, validating mode selections, and handling core and recommended modes.

## Mode Selection and Management

```
// Select modes for a workflow
function selectModes(workflow, selectedModeSlugs, isInteractive, force):
    // TEST: Should load workflow details with available modes
    workflowWithModes = loadWorkflowDetails(workflow)
    
    // TEST: Should handle no available modes
    if !workflowWithModes.availableModes or workflowWithModes.availableModes.length === 0:
        throw new Error(`No modes available for workflow '${workflow.name}'`)
    
    // TEST: Should pre-select core modes
    preSelectedModes = preSelectCoreModes(workflowWithModes)
    
    // TEST: Should validate provided mode slugs if any
    if selectedModeSlugs and selectedModeSlugs.length > 0:
        // TEST: Should validate each provided mode slug
        validateModeSelection(selectedModeSlugs, workflowWithModes.availableModes)
        
        // TEST: Should ensure core modes are included
        ensureCoreModesIncluded(selectedModeSlugs, workflowWithModes.coreModes, force)
        
        // TEST: Should return selected modes
        return getSelectedModeObjects(selectedModeSlugs, workflowWithModes.availableModes)
    
    // TEST: Should prompt for mode selection in interactive mode
    if isInteractive:
        return promptForModeSelection(workflowWithModes, preSelectedModes)
    
    // TEST: Should return pre-selected modes in non-interactive mode
    return preSelectedModes

// Pre-select core and recommended modes
function preSelectCoreModes(workflow):
    // TEST: Should include all core modes
    preSelectedSlugs = [...workflow.coreModes]
    
    // TEST: Should include recommended modes
    if workflow.recommendedModes:
        preSelectedSlugs = [...preSelectedSlugs, ...workflow.recommendedModes]
    
    // TEST: Should return mode objects for pre-selected slugs
    return getSelectedModeObjects(preSelectedSlugs, workflow.availableModes)

// Validate mode selection
function validateModeSelection(selectedModeSlugs, availableModes):
    // TEST: Should validate each mode slug exists
    availableSlugs = availableModes.map(mode => mode.slug)
    
    for slug in selectedModeSlugs:
        // TEST: Should throw error if mode not found
        if !availableSlugs.includes(slug):
            throw new Error(`Mode '${slug}' not found. Available modes: ${availableSlugs.join(", ")}`)
    
    return true

// Ensure core modes are included in selection
function ensureCoreModesIncluded(selectedModeSlugs, coreModes, force):
    // TEST: Should handle empty core modes
    if !coreModes or coreModes.length === 0:
        return true
    
    // TEST: Should check each core mode is included
    for coreMode in coreModes:
        if !selectedModeSlugs.includes(coreMode):
            // TEST: Should throw error if core mode not included and force is false
            if !force:
                throw new Error(`Core mode '${coreMode}' must be included. Use --force to override.`)
            // TEST: Should log warning if force is true
            else:
                console.warn(`Warning: Core mode '${coreMode}' is not included in selection.`)
    
    return true

// Get mode objects for selected slugs
function getSelectedModeObjects(selectedModeSlugs, availableModes):
    // TEST: Should return array of mode objects
    selectedModes = []
    
    // TEST: Should maintain order of selection
    for slug in selectedModeSlugs:
        mode = availableModes.find(m => m.slug === slug)
        if mode:
            selectedModes.push(mode)
    
    return selectedModes

// Prompt user to select modes interactively
function promptForModeSelection(workflow, preSelectedModes):
    // TEST: Should display available modes with descriptions
    console.log(`\nSelect modes for workflow: ${workflow.name}`)
    console.log("Available modes:")
    
    // TEST: Should mark core modes
    for mode in workflow.availableModes:
        coreIndicator = workflow.coreModes.includes(mode.slug) ? "[CORE] " : ""
        recommendedIndicator = workflow.recommendedModes.includes(mode.slug) ? "[RECOMMENDED] " : ""
        console.log(`- ${mode.slug}: ${coreIndicator}${recommendedIndicator}${mode.name} - ${mode.roleDefinition}`)
    
    // TEST: Should show pre-selected modes
    preSelectedSlugs = preSelectedModes.map(mode => mode.slug)
    console.log(`\nPre-selected modes: ${preSelectedSlugs.join(", ")}`)
    
    // TEST: Should prompt for additional modes
    selectedSlugs = promptForMultipleSelection("Select additional modes (comma-separated, empty to use pre-selected):", 
                                              workflow.availableModes.map(mode => mode.slug))
    
    // TEST: Should combine pre-selected and user-selected modes
    if selectedSlugs.length > 0:
        // Add user-selected modes that aren't already pre-selected
        for slug in selectedSlugs:
            if !preSelectedSlugs.includes(slug):
                preSelectedSlugs.push(slug)
    
    // TEST: Should return combined mode objects
    return getSelectedModeObjects(preSelectedSlugs, workflow.availableModes)

// Prompt for multiple selection
function promptForMultipleSelection(message, options):
    // TEST: Should display prompt message
    console.log(message)
    
    // TEST: Should handle empty input
    input = readUserInput()
    if !input or input.trim() === "":
        return []
    
    // TEST: Should parse comma-separated values
    selectedOptions = input.split(",").map(option => option.trim())
    
    // TEST: Should validate each selected option
    for option in selectedOptions:
        if !options.includes(option):
            console.log(`Invalid option: ${option}. Please try again.`)
            return promptForMultipleSelection(message, options)
    
    // TEST: Should return validated selections
    return selectedOptions
```

## Mode Filtering and Grouping

```
// Filter modes by group
function filterModesByGroup(modes, group):
    // TEST: Should filter modes by group
    return modes.filter(mode => {
        // TEST: Should handle array of groups
        if Array.isArray(mode.groups):
            // TEST: Should check if group is in array
            return mode.groups.some(g => {
                // TEST: Should handle string groups
                if typeof g === "string":
                    return g === group
                // TEST: Should handle object groups
                else if typeof g === "object" and g !== null:
                    return g[0] === group
                return false
            })
        return false
    })

// Group modes by category
function groupModesByCategory(modes):
    // TEST: Should group modes by category
    categories = {
        "core": [],
        "development": [],
        "testing": [],
        "documentation": [],
        "deployment": [],
        "other": []
    }
    
    // TEST: Should categorize each mode
    for mode in modes:
        category = determineModeCategory(mode)
        categories[category].push(mode)
    
    // TEST: Should return categorized modes
    return categories

// Determine category for a mode
function determineModeCategory(mode):
    // TEST: Should categorize based on slug or name
    slug = mode.slug.toLowerCase()
    name = mode.name.toLowerCase()
    
    // TEST: Should identify core modes
    if slug.includes("code") or slug.includes("architect") or slug.includes("spec"):
        return "core"
    
    // TEST: Should identify development modes
    if slug.includes("debug") or slug.includes("refactor") or slug.includes("optimization"):
        return "development"
    
    // TEST: Should identify testing modes
    if slug.includes("test") or slug.includes("tdd") or slug.includes("security"):
        return "testing"
    
    // TEST: Should identify documentation modes
    if slug.includes("doc") or slug.includes("writer"):
        return "documentation"
    
    // TEST: Should identify deployment modes
    if slug.includes("deploy") or slug.includes("devops") or slug.includes("monitor"):
        return "deployment"
    
    // TEST: Should default to other
    return "other"
```

## Mode Dependency Resolution

```
// Resolve mode dependencies
function resolveModeDependencies(selectedModes, availableModes):
    // TEST: Should identify dependencies between modes
    resolvedModes = [...selectedModes]
    
    // TEST: Should handle no dependencies
    if !hasDependencies(selectedModes):
        return resolvedModes
    
    // TEST: Should add missing dependencies
    dependencies = findMissingDependencies(selectedModes, availableModes)
    
    // TEST: Should add dependencies to resolved modes
    for dependency in dependencies:
        if !resolvedModes.some(mode => mode.slug === dependency.slug):
            resolvedModes.push(dependency)
    
    // TEST: Should return modes with dependencies
    return resolvedModes

// Check if modes have dependencies
function hasDependencies(modes):
    // TEST: Should detect dependencies in customInstructions
    for mode in modes:
        // This is a simplified check - in a real implementation, 
        // dependencies would be explicitly defined in the mode definition
        if mode.customInstructions and mode.customInstructions.includes("requires:"):
            return true
    
    return false

// Find missing dependencies
function findMissingDependencies(selectedModes, availableModes):
    // TEST: Should identify missing dependencies
    dependencies = []
    selectedSlugs = selectedModes.map(mode => mode.slug)
    
    // This is a simplified implementation - in a real implementation,
    // dependencies would be explicitly defined in the mode definition
    for mode in selectedModes:
        if mode.customInstructions:
            // Extract dependency slugs from customInstructions
            matches = mode.customInstructions.match(/requires: ([\w,-]+)/g)
            
            if matches:
                for match in matches:
                    dependencySlugs = match.replace("requires: ", "").split(",")
                    
                    for slug in dependencySlugs:
                        // TEST: Should add dependency if not already selected
                        if !selectedSlugs.includes(slug):
                            dependency = availableModes.find(m => m.slug === slug)
                            if dependency:
                                dependencies.push(dependency)
    
    // TEST: Should return array of dependency mode objects
    return dependencies