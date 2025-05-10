# Roo Init CLI Tool - Configuration Module Pseudocode

This module handles loading and validating the CLI tool's configuration, which defines available workflows, their modes, and rule locations.

## Configuration Loading

```
// Load configuration from file or default
function loadConfiguration():
    // TEST: Should try to load from default locations
    configPaths = [
        "./roo-init.config.js",
        "./roo-init.config.json",
        "./config/roo-init.config.js",
        "./config/roo-init.config.json",
        path.join(os.homedir(), ".roo-init/config.js"),
        path.join(os.homedir(), ".roo-init/config.json")
    ]
    
    // TEST: Should try each path in order
    for configPath in configPaths:
        if fileSystem.fileExists(configPath):
            try:
                // TEST: Should load and parse configuration file
                return loadConfigurationFile(configPath)
            catch error:
                console.warn(`Failed to load configuration from ${configPath}: ${error.message}`)
    
    // TEST: Should use default configuration if no file found
    return getDefaultConfiguration()

// Load configuration from specific file
function loadConfigurationFile(configPath):
    // TEST: Should handle different file extensions
    if configPath.endsWith(".js"):
        // TEST: Should load JavaScript module
        return require(path.resolve(configPath))
    else if configPath.endsWith(".json"):
        // TEST: Should load and parse JSON file
        fileContent = fileSystem.readFile(configPath)
        return JSON.parse(fileContent)
    else:
        throw new Error(`Unsupported configuration file format: ${configPath}`)

// Get default configuration
function getDefaultConfiguration():
    // TEST: Should provide sensible defaults
    return {
        workflowsPath: path.resolve("./workflows"),
        workflows: {
            "sparc": {
                name: "SPARC",
                description: "SPARC Agentic Development Workflow",
                coreModes: ["orchestrator", "spec-pseudocode", "code"],
                recommendedModes: ["architect", "tdd"],
                sourcePath: path.resolve("./workflows/sparc")
            }
        },
        defaultWorkflow: "sparc",
        interactiveMode: true
    }
```

## Configuration Validation

```
// Validate configuration
function validateConfiguration(config):
    // TEST: Should validate configuration structure
    if !config:
        throw new Error("Configuration is empty or invalid")
    
    // TEST: Should validate workflows property
    if !config.workflows or typeof config.workflows !== "object":
        throw new Error("Configuration must include 'workflows' object")
    
    // TEST: Should validate at least one workflow exists
    if Object.keys(config.workflows).length === 0:
        throw new Error("Configuration must define at least one workflow")
    
    // TEST: Should validate each workflow
    for workflowId, workflow in config.workflows:
        validateWorkflowConfig(workflowId, workflow)
    
    // TEST: Should validate defaultWorkflow if specified
    if config.defaultWorkflow and !config.workflows[config.defaultWorkflow]:
        throw new Error(`Default workflow '${config.defaultWorkflow}' not defined in configuration`)
    
    return true

// Validate workflow configuration
function validateWorkflowConfig(workflowId, workflow):
    // TEST: Should validate required properties
    requiredProps = ["name", "sourcePath"]
    
    for prop in requiredProps:
        if !workflow[prop]:
            throw new Error(`Workflow '${workflowId}' is missing required property: ${prop}`)
    
    // TEST: Should validate sourcePath exists
    sourcePath = resolvePath(workflow.sourcePath)
    if !fileSystem.directoryExists(sourcePath):
        throw new Error(`Source path for workflow '${workflowId}' does not exist: ${sourcePath}`)
    
    // TEST: Should validate modesPath if provided
    if workflow.modesPath:
        modesPath = resolvePath(workflow.modesPath)
        if !fileSystem.fileExists(modesPath):
            throw new Error(`Modes path for workflow '${workflowId}' does not exist: ${modesPath}`)
    
    // TEST: Should validate rulesPath if provided
    if workflow.rulesPath:
        rulesPath = resolvePath(workflow.rulesPath)
        if !fileSystem.directoryExists(rulesPath):
            throw new Error(`Rules path for workflow '${workflowId}' does not exist: ${rulesPath}`)
    
    // TEST: Should validate coreModes is an array if provided
    if workflow.coreModes and !Array.isArray(workflow.coreModes):
        throw new Error(`Core modes for workflow '${workflowId}' must be an array`)
    
    // TEST: Should validate recommendedModes is an array if provided
    if workflow.recommendedModes and !Array.isArray(workflow.recommendedModes):
        throw new Error(`Recommended modes for workflow '${workflowId}' must be an array`)
    
    return true
```

## Path Resolution

```
// Resolve relative paths in configuration
function resolveConfigurationPaths(config):
    // TEST: Should resolve workflowsPath if provided
    if config.workflowsPath:
        config.workflowsPath = resolvePath(config.workflowsPath)
    
    // TEST: Should resolve paths for each workflow
    for workflowId, workflow in config.workflows:
        // TEST: Should resolve sourcePath
        workflow.sourcePath = resolvePath(workflow.sourcePath)
        
        // TEST: Should resolve modesPath if provided
        if workflow.modesPath:
            workflow.modesPath = resolvePath(workflow.modesPath)
        else:
            // TEST: Should set default modesPath based on sourcePath
            workflow.modesPath = path.join(workflow.sourcePath, ".roomodes")
        
        // TEST: Should resolve rulesPath if provided
        if workflow.rulesPath:
            workflow.rulesPath = resolvePath(workflow.rulesPath)
        else:
            // TEST: Should set default rulesPath based on sourcePath
            workflow.rulesPath = path.join(workflow.sourcePath, ".roo")
    
    return config

// Resolve path (absolute or relative to current directory)
function resolvePath(pathStr):
    // TEST: Should return absolute path unchanged
    if path.isAbsolute(pathStr):
        return pathStr
    
    // TEST: Should resolve relative path to absolute
    return path.resolve(process.cwd(), pathStr)
```

## Environment Variables

```
// Load configuration from environment variables
function loadEnvironmentVariables(config):
    // TEST: Should override config with environment variables
    
    // TEST: Should handle ROO_INIT_DEFAULT_WORKFLOW
    if process.env.ROO_INIT_DEFAULT_WORKFLOW:
        config.defaultWorkflow = process.env.ROO_INIT_DEFAULT_WORKFLOW
    
    // TEST: Should handle ROO_INIT_INTERACTIVE_MODE
    if process.env.ROO_INIT_INTERACTIVE_MODE:
        config.interactiveMode = process.env.ROO_INIT_INTERACTIVE_MODE.toLowerCase() === "true"
    
    // TEST: Should handle ROO_INIT_WORKFLOWS_PATH
    if process.env.ROO_INIT_WORKFLOWS_PATH:
        config.workflowsPath = process.env.ROO_INIT_WORKFLOWS_PATH
    
    return config
```

## Configuration Discovery

```
// Discover workflows in workflowsPath
function discoverWorkflows(config):
    // TEST: Should check if workflowsPath exists
    if !config.workflowsPath or !fileSystem.directoryExists(config.workflowsPath):
        return config
    
    // TEST: Should scan directories in workflowsPath
    directories = fileSystem.listDirectories(config.workflowsPath)
    
    // TEST: Should check each directory for workflow structure
    for directory in directories:
        dirPath = path.join(config.workflowsPath, directory)
        
        // Skip if already defined in config
        if config.workflows[directory]:
            continue
        
        // TEST: Should check for .roomodes file
        modesPath = path.join(dirPath, ".roomodes")
        if !fileSystem.fileExists(modesPath):
            continue
        
        // TEST: Should check for .roo directory
        rulesPath = path.join(dirPath, ".roo")
        if !fileSystem.directoryExists(rulesPath):
            continue
        
        // TEST: Should add discovered workflow to config
        config.workflows[directory] = {
            name: directory.charAt(0).toUpperCase() + directory.slice(1),
            description: `Discovered ${directory} workflow`,
            sourcePath: dirPath,
            modesPath: modesPath,
            rulesPath: rulesPath
        }
    
    return config

// List directories in a directory
function listDirectories(dirPath):
    // TEST: Should return only directories
    try:
        files = fs.readdirSync(dirPath)
        return files.filter(file => {
            return fs.statSync(path.join(dirPath, file)).isDirectory()
        })
    catch error:
        return []
```

## Configuration Export

```
// Export configuration to file
function exportConfiguration(config, filePath):
    // TEST: Should validate configuration before export
    validateConfiguration(config)
    
    // TEST: Should format configuration as JSON
    configJson = JSON.stringify(config, null, 2)
    
    // TEST: Should write to specified file
    try:
        fileSystem.writeFile(filePath, configJson)
        return true
    catch error:
        throw new Error(`Failed to export configuration to ${filePath}: ${error.message}`)