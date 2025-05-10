# Roo Init CLI Tool - Workflow Module Pseudocode

This module handles workflow management, including loading workflow definitions, validating workflows, and selecting workflows based on user input.

## Workflow Management

```
// Load workflow definitions from configuration
function loadWorkflowDefinitions(config):
    // TEST: Should load workflow definitions from configuration
    workflowDefinitions = {}
    
    // TEST: Should handle missing workflows gracefully
    if !config.workflows:
        return workflowDefinitions
    
    // TEST: Should process each workflow definition correctly
    for workflowId, workflowConfig in config.workflows:
        // TEST: Should validate each workflow definition
        if isValidWorkflowDefinition(workflowConfig):
            workflowDefinitions[workflowId] = {
                id: workflowId,
                name: workflowConfig.name,
                description: workflowConfig.description,
                coreModes: workflowConfig.coreModes || [],
                recommendedModes: workflowConfig.recommendedModes || [],
                sourcePath: workflowConfig.sourcePath,
                modesPath: workflowConfig.modesPath || `${workflowConfig.sourcePath}/.roomodes`,
                rulesPath: workflowConfig.rulesPath || `${workflowConfig.sourcePath}/.roo`
            }
    
    // TEST: Should return populated workflow definitions
    return workflowDefinitions

// Validate a workflow definition
function isValidWorkflowDefinition(workflowConfig):
    // TEST: Should require name property
    if !workflowConfig.name:
        return false
    
    // TEST: Should require sourcePath property
    if !workflowConfig.sourcePath:
        return false
    
    // TEST: Should validate sourcePath exists
    if !fileSystem.directoryExists(workflowConfig.sourcePath):
        return false
    
    // TEST: Should validate modesPath if provided
    if workflowConfig.modesPath and !fileSystem.fileExists(workflowConfig.modesPath):
        return false
    
    // TEST: Should validate rulesPath if provided
    if workflowConfig.rulesPath and !fileSystem.directoryExists(workflowConfig.rulesPath):
        return false
    
    return true

// Get list of available workflows
function getAvailableWorkflows(workflowDefinitions):
    // TEST: Should return array of workflow objects
    return Object.values(workflowDefinitions)

// Select a workflow based on user input or configuration
function selectWorkflow(workflowId, config, isInteractive):
    // TEST: Should load workflow definitions
    workflowDefinitions = loadWorkflowDefinitions(config)
    
    // TEST: Should handle no available workflows
    if Object.keys(workflowDefinitions).length === 0:
        throw new Error("No workflows available. Please check your configuration.")
    
    // TEST: Should use provided workflow ID if valid
    if workflowId and workflowDefinitions[workflowId]:
        return workflowDefinitions[workflowId]
    
    // TEST: Should use default workflow if available and no specific ID provided
    if !workflowId and config.defaultWorkflow and workflowDefinitions[config.defaultWorkflow]:
        return workflowDefinitions[config.defaultWorkflow]
    
    // TEST: Should prompt for workflow selection in interactive mode
    if isInteractive:
        return promptForWorkflowSelection(workflowDefinitions)
    
    // TEST: Should throw error if workflow not found in non-interactive mode
    if workflowId:
        throw new Error(`Workflow '${workflowId}' not found. Available workflows: ${Object.keys(workflowDefinitions).join(", ")}`)
    else:
        throw new Error(`No workflow specified. Available workflows: ${Object.keys(workflowDefinitions).join(", ")}`)

// Prompt user to select a workflow interactively
function promptForWorkflowSelection(workflowDefinitions):
    // TEST: Should display available workflows
    console.log("Available workflows:")
    
    availableWorkflows = getAvailableWorkflows(workflowDefinitions)
    
    // TEST: Should format workflow list with numbers
    for i, workflow in availableWorkflows:
        console.log(`${i + 1}. ${workflow.name} - ${workflow.description || "No description"}`)
    
    // TEST: Should prompt for selection
    selectedIndex = promptForNumber("Select a workflow:", 1, availableWorkflows.length)
    
    // TEST: Should return selected workflow
    return availableWorkflows[selectedIndex - 1]

// Load workflow details including available modes
function loadWorkflowDetails(workflow):
    // TEST: Should load modes file
    modesFile = loadModesFile(workflow.modesPath)
    
    // TEST: Should extract available modes
    availableModes = extractAvailableModes(modesFile)
    
    // TEST: Should validate core modes exist
    validateCoreModes(workflow.coreModes, availableModes)
    
    // TEST: Should validate recommended modes exist
    validateRecommendedModes(workflow.recommendedModes, availableModes)
    
    // TEST: Should return workflow with available modes
    return {
        ...workflow,
        availableModes: availableModes
    }

// Load modes file for a workflow
function loadModesFile(modesPath):
    // TEST: Should handle file not found
    if !fileSystem.fileExists(modesPath):
        throw new Error(`Modes file not found at ${modesPath}`)
    
    try:
        // TEST: Should parse JSON file correctly
        fileContent = fileSystem.readFile(modesPath)
        return JSON.parse(fileContent)
    catch error:
        // TEST: Should handle JSON parsing errors
        throw new Error(`Failed to parse modes file at ${modesPath}: ${error.message}`)

// Extract available modes from modes file
function extractAvailableModes(modesFile):
    // TEST: Should handle missing customModes property
    if !modesFile.customModes:
        return []
    
    // TEST: Should extract mode objects with required properties
    return modesFile.customModes.map(mode => ({
        slug: mode.slug,
        name: mode.name,
        roleDefinition: mode.roleDefinition,
        customInstructions: mode.customInstructions,
        groups: mode.groups,
        source: mode.source
    }))

// Validate that core modes exist in available modes
function validateCoreModes(coreModes, availableModes):
    // TEST: Should handle empty core modes
    if !coreModes or coreModes.length === 0:
        return true
    
    // TEST: Should validate each core mode exists
    availableSlugs = availableModes.map(mode => mode.slug)
    
    for coreMode in coreModes:
        // TEST: Should throw error if core mode not found
        if !availableSlugs.includes(coreMode):
            throw new Error(`Core mode '${coreMode}' not found in available modes`)
    
    return true

// Validate that recommended modes exist in available modes
function validateRecommendedModes(recommendedModes, availableModes):
    // TEST: Should handle empty recommended modes
    if !recommendedModes or recommendedModes.length === 0:
        return true
    
    // TEST: Should validate each recommended mode exists
    availableSlugs = availableModes.map(mode => mode.slug)
    
    for recommendedMode in recommendedModes:
        // TEST: Should throw error if recommended mode not found
        if !availableSlugs.includes(recommendedMode):
            throw new Error(`Recommended mode '${recommendedMode}' not found in available modes`)
    
    return true
```

## Workflow Configuration Validation

```
// Validate the workflow configuration
function validateWorkflowConfiguration(config):
    // TEST: Should validate workflows property exists
    if !config.workflows:
        throw new Error("No workflows defined in configuration")
    
    // TEST: Should validate workflows is an object
    if typeof config.workflows !== "object":
        throw new Error("Workflows configuration must be an object")
    
    // TEST: Should validate at least one workflow is defined
    if Object.keys(config.workflows).length === 0:
        throw new Error("No workflows defined in configuration")
    
    // TEST: Should validate each workflow
    for workflowId, workflowConfig in config.workflows:
        validateWorkflowConfig(workflowId, workflowConfig)
    
    // TEST: Should validate defaultWorkflow if specified
    if config.defaultWorkflow:
        if !config.workflows[config.defaultWorkflow]:
            throw new Error(`Default workflow '${config.defaultWorkflow}' not found in configuration`)
    
    return true

// Validate an individual workflow configuration
function validateWorkflowConfig(workflowId, workflowConfig):
    // TEST: Should validate required properties
    requiredProps = ["name", "sourcePath"]
    
    for prop in requiredProps:
        if !workflowConfig[prop]:
            throw new Error(`Workflow '${workflowId}' is missing required property: ${prop}`)
    
    // TEST: Should validate sourcePath exists
    if !fileSystem.directoryExists(workflowConfig.sourcePath):
        throw new Error(`Source path for workflow '${workflowId}' does not exist: ${workflowConfig.sourcePath}`)
    
    // TEST: Should validate modesPath if provided
    if workflowConfig.modesPath and !fileSystem.fileExists(workflowConfig.modesPath):
        throw new Error(`Modes path for workflow '${workflowId}' does not exist: ${workflowConfig.modesPath}`)
    
    // TEST: Should validate rulesPath if provided
    if workflowConfig.rulesPath and !fileSystem.directoryExists(workflowConfig.rulesPath):
        throw new Error(`Rules path for workflow '${workflowId}' does not exist: ${workflowConfig.rulesPath}`)
    
    // TEST: Should validate coreModes is an array if provided
    if workflowConfig.coreModes and !Array.isArray(workflowConfig.coreModes):
        throw new Error(`Core modes for workflow '${workflowId}' must be an array`)
    
    // TEST: Should validate recommendedModes is an array if provided
    if workflowConfig.recommendedModes and !Array.isArray(workflowConfig.recommendedModes):
        throw new Error(`Recommended modes for workflow '${workflowId}' must be an array`)
    
    return true