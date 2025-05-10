# Roo Init CLI Tool - Cross-Workflow Mode Selection

This document updates the specification to support selecting modes from different workflows, allowing users to combine any modes regardless of their original workflow.

## Updated Requirements

### Mode Selection Across Workflows

- **FR2.6**: Users must be able to select modes from any workflow, not just the initially selected workflow.
- **FR2.7**: The CLI must provide a consolidated list of all available modes across all workflows.
- **FR2.8**: The CLI must resolve any conflicts or dependencies between modes from different workflows.

### Edge Cases and Error Handling

- **EC2.5**: Modes with the same slug but from different workflows.
- **EC2.6**: Modes with dependencies on other modes from their original workflow.
- **EC2.7**: Conflicting custom instructions between modes from different workflows.

## Updated Domain Model

### Entity: Mode

Add a new attribute:

- `originWorkflow`: String - The ID of the workflow where the mode was originally defined

### Entity: AllModesRegistry

A new entity to track all available modes across workflows:

**Attributes:**
- `modes`: Map<String, ModeDefinition[]> - Map of mode slug to array of mode definitions (potentially from different workflows)
- `workflowModes`: Map<String, String[]> - Map of workflow ID to array of mode slugs defined in that workflow

**Relationships:**
- Contains many Modes
- Referenced by many Workflows

## Updated Pseudocode

### Mode Registry Management

```
// Initialize global mode registry
function initializeModeRegistry(config):
    // TEST: Should create empty registry
    registry = {
        modes: {},
        workflowModes: {}
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
            
            // TEST: Should initialize array if this is first mode with this slug
            if !registry.modes[mode.slug]:
                registry.modes[mode.slug] = []
            
            // TEST: Should add mode to registry
            registry.modes[mode.slug].push(mode)
            
            // TEST: Should add mode slug to workflow's modes list
            registry.workflowModes[workflowId].push(mode.slug)
    
    // TEST: Should return populated registry
    return registry

// Get all available modes across workflows
function getAllAvailableModes(registry):
    // TEST: Should return array of unique modes
    allModes = []
    
    // TEST: Should handle potential duplicates correctly
    for slug, modeVersions in registry.modes:
        // Use first version as primary if multiple exist
        allModes.push({
            ...modeVersions[0],
            hasDuplicates: modeVersions.length > 1,
            originWorkflows: modeVersions.map(m => m.originWorkflow)
        })
    
    // TEST: Should return sorted array
    return allModes.sort((a, b) => a.slug.localeCompare(b.slug))

// Get mode by slug, handling potential duplicates
function getModeBySlug(registry, slug, preferredWorkflow = null):
    // TEST: Should return null for non-existent mode
    if !registry.modes[slug]:
        return null
    
    // TEST: Should handle simple case with only one mode version
    if registry.modes[slug].length === 1:
        return registry.modes[slug][0]
    
    // TEST: Should prefer mode from specified workflow if provided
    if preferredWorkflow:
        workflowMode = registry.modes[slug].find(m => m.originWorkflow === preferredWorkflow)
        if workflowMode:
            return workflowMode
    
    // TEST: Should default to first version if no preference specified
    return registry.modes[slug][0]
```

### Enhanced Mode Selection

```
// Select modes across all workflows
function selectModesAcrossWorkflows(registry, selectedWorkflowId, selectedModeSlugs, isInteractive, force):
    // TEST: Should handle empty registry
    if !registry or !registry.modes or Object.keys(registry.modes).length === 0:
        throw new Error("No modes available in registry")
    
    // TEST: Should get all available modes
    allAvailableModes = getAllAvailableModes(registry)
    
    // TEST: Should handle no available modes
    if allAvailableModes.length === 0:
        throw new Error("No modes available")
    
    // TEST: Should pre-select core modes from selected workflow if any
    selectedWorkflow = config.workflows[selectedWorkflowId]
    preSelectedModes = []
    
    // TEST: Should include core modes from selected workflow
    if selectedWorkflow and selectedWorkflow.coreModes:
        for coreSlug in selectedWorkflow.coreModes:
            coreMode = getModeBySlug(registry, coreSlug, selectedWorkflowId)
            if coreMode:
                preSelectedModes.push(coreMode)
    
    // TEST: Should include recommended modes from selected workflow
    if selectedWorkflow and selectedWorkflow.recommendedModes:
        for recSlug in selectedWorkflow.recommendedModes:
            recMode = getModeBySlug(registry, recSlug, selectedWorkflowId)
            if recMode and !preSelectedModes.some(m => m.slug === recSlug):
                preSelectedModes.push(recMode)
    
    // TEST: Should validate user-provided mode slugs if any
    if selectedModeSlugs and selectedModeSlugs.length > 0:
        // TEST: Should validate each provided mode slug
        selectedModes = []
        for slug in selectedModeSlugs:
            mode = getModeBySlug(registry, slug)
            if !mode:
                throw new Error(`Mode '${slug}' not found. Available modes: ${Object.keys(registry.modes).join(", ")}`)
            selectedModes.push(mode)
        
        // TEST: Should ensure core modes from selected workflow are included
        if selectedWorkflow and selectedWorkflow.coreModes:
            ensureCoreModesIncluded(selectedModeSlugs, selectedWorkflow.coreModes, force)
        
        // TEST: Should return selected modes
        return selectedModes
    
    // TEST: Should prompt for mode selection in interactive mode
    if isInteractive:
        return promptForCrossWorkflowModeSelection(registry, allAvailableModes, preSelectedModes, selectedWorkflowId)
    
    // TEST: Should return pre-selected modes in non-interactive mode
    return preSelectedModes

// Prompt for mode selection across workflows
function promptForCrossWorkflowModeSelection(registry, allAvailableModes, preSelectedModes, selectedWorkflowId):
    // TEST: Should display all available modes with workflow info
    console.log(`\nSelect modes (from any workflow):`)
    console.log("Available modes:")
    
    // TEST: Should group modes by workflow
    workflowGroups = {}
    for mode in allAvailableModes:
        for workflowId in mode.originWorkflows:
            if !workflowGroups[workflowId]:
                workflowGroups[workflowId] = []
            workflowGroups[workflowId].push(mode)
    
    // TEST: Should display modes by workflow
    for workflowId, modes in workflowGroups:
        workflow = config.workflows[workflowId]
        console.log(`\n${workflow.name} workflow:`)
        
        for mode in modes:
            // Determine indicators
            coreIndicator = ""
            if workflow.coreModes and workflow.coreModes.includes(mode.slug):
                coreIndicator = "[CORE] "
            
            recommendedIndicator = ""
            if workflow.recommendedModes and workflow.recommendedModes.includes(mode.slug):
                recommendedIndicator = "[RECOMMENDED] "
            
            duplicateIndicator = ""
            if mode.hasDuplicates:
                duplicateIndicator = "[MULTIPLE VERSIONS] "
            
            console.log(`- ${mode.slug}: ${coreIndicator}${recommendedIndicator}${duplicateIndicator}${mode.name} - ${mode.roleDefinition}`)
    
    // TEST: Should show pre-selected modes
    preSelectedSlugs = preSelectedModes.map(mode => mode.slug)
    console.log(`\nPre-selected modes: ${preSelectedSlugs.join(", ")}`)
    
    // TEST: Should prompt for additional modes
    allAvailableSlugs = allAvailableModes.map(mode => mode.slug)
    selectedSlugs = promptForMultipleSelection("Select modes (comma-separated, empty to use pre-selected):", 
                                             allAvailableSlugs)
    
    // TEST: Should combine pre-selected and user-selected modes
    finalModes = [...preSelectedModes]
    
    if selectedSlugs.length > 0:
        // Add user-selected modes that aren't already pre-selected
        for slug in selectedSlugs:
            if !preSelectedSlugs.includes(slug):
                mode = getModeBySlug(registry, slug, selectedWorkflowId)
                finalModes.push(mode)
    
    // TEST: Should resolve any mode conflicts or dependencies
    finalModes = resolveModeConflicts(finalModes, registry)
    
    // TEST: Should return combined mode objects
    return finalModes

// Resolve conflicts between modes from different workflows
function resolveModeConflicts(selectedModes, registry):
    // TEST: Should resolve duplicate modes
    uniqueModes = {}
    
    // TEST: Should keep track of selected workflows for prioritization
    selectedWorkflows = new Set(selectedModes.map(mode => mode.originWorkflow))
    
    // TEST: Should handle collisions by preferring the selected workflow
    for mode in selectedModes:
        if !uniqueModes[mode.slug] or uniqueModes[mode.slug].originWorkflow !== Array.from(selectedWorkflows)[0]:
            uniqueModes[mode.slug] = mode
    
    // TEST: Should resolve dependencies across workflows
    resolvedModes = Object.values(uniqueModes)
    
    // TEST: Should add missing dependencies
    dependencies = findMissingDependenciesAcrossWorkflows(resolvedModes, registry)
    
    // TEST: Should add dependencies to resolved modes
    for dependency in dependencies:
        if !uniqueModes[dependency.slug]:
            resolvedModes.push(dependency)
            uniqueModes[dependency.slug] = dependency
    
    // TEST: Should return modes with resolved conflicts
    return resolvedModes

// Find missing dependencies across workflows
function findMissingDependenciesAcrossWorkflows(selectedModes, registry):
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
                            dependency = getModeBySlug(registry, slug, mode.originWorkflow)
                            if dependency:
                                dependencies.push(dependency)
    
    // TEST: Should return array of dependency mode objects
    return dependencies
```

### Updated Init Command Execution

```
// Execute the init command with cross-workflow support
function executeInitCommand(options, config, isInteractive):
    // TEST: Should initialize mode registry with all workflows
    modeRegistry = initializeModeRegistry(config)
    
    // TEST: Should handle workflow selection correctly
    workflow = selectWorkflow(options.workflow, config, isInteractive)
    
    // TEST: Should handle mode selection across workflows
    modes = selectModesAcrossWorkflows(modeRegistry, workflow.id, options.modes, isInteractive, options.force)
    
    // TEST: Should validate target directory
    validateTargetDirectory(options.targetDir)
    
    // TEST: Should copy mode definitions successfully
    copyModeDefinitions(workflow, modes, options.targetDir, options.force)
    
    // TEST: Should copy rule files from each mode's origin workflow
    copyRuleFilesAcrossWorkflows(modes, options.targetDir, options.force, config.workflows)
```

### Updated Rule Copying

```
// Copy rule files from multiple workflows
function copyRuleFilesAcrossWorkflows(modes, targetDir, force, workflows):
    // TEST: Should create target .roo directory
    targetRooDir = path.join(targetDir, ".roo")
    
    // TEST: Should create target .roo directory if it doesn't exist
    if !fileSystem.directoryExists(targetRooDir):
        fileSystem.createDirectory(targetRooDir)
    
    // TEST: Should copy generic rules from each workflow once
    processedWorkflows = {}
    
    // TEST: Should track original workflow for each mode
    for mode in modes:
        workflowId = mode.originWorkflow
        workflow = workflows[workflowId]
        
        // TEST: Should copy generic workflow rules once per workflow
        if !processedWorkflows[workflowId]:
            copyGenericRules(workflow, targetRooDir, force)
            processedWorkflows[workflowId] = true
        
        // TEST: Should copy mode-specific rules for each mode
        copyModeSpecificRules(workflow, mode, targetRooDir, force)
    
    // TEST: Should log success message
    console.log(`Rule files copied to ${targetRooDir}`)
    
    return true
```

## Updated Acceptance Criteria

### Cross-Workflow Mode Selection

- **AC2.8**: Users should be able to view a complete list of all available modes from all workflows.
- **AC2.9**: The CLI should display the origin workflow for each mode when listing available modes.
- **AC2.10**: Users should be able to select any combination of modes from different workflows.
- **AC2.11**: Core modes from the initially selected workflow should still be pre-selected.
- **AC2.12**: When a mode exists in multiple workflows, the CLI should select the version from the initially selected workflow if available.
- **AC2.13**: The CLI should resolve dependencies across workflows when selecting modes.
- **AC2.14**: The CLI should copy rules from all selected modes' origin workflows.