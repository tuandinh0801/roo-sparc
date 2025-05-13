# Roo Init CLI Tool - Consolidated Pseudocode

This document consolidates all pseudocode modules for the Roo Init CLI tool, structured by logical component areas.

## 1. Main CLI Module

```
// Main entry point for the CLI
function main(args):
    // TEST: Should parse command-line arguments correctly
    options = parseArguments(args)
    
    // TEST: Should display help text when --help flag is provided
    if options.help:
        displayHelp()
        return 0
    
    // TEST: Should display version when --version flag is provided
    if options.version:
        displayVersion()
        return 0
    
    try:
        // TEST: Should load configuration successfully
        config = loadConfiguration()
        
        // TEST: Should validate configuration
        validateConfiguration(config)
        
        // TEST: Should determine operation mode correctly
        isInteractive = determineInteractiveMode(options, config)
        
        // TEST: Should execute the init command successfully
        if !options.command or options.command === "init":
            executeInitCommand(options, config, isInteractive)
        // TEST: Should handle list-modes command
        else if options.command === "list-modes":
            executeListModesCommand(options, config)
        // TEST: Should handle unknown commands with appropriate error
        else:
            console.error(`Unknown command: ${options.command}`)
            displayHelp()
            return 1
        
        // TEST: Should display success message on completion (for init)
        if !options.command or options.command === "init":
            console.log("Operation completed successfully!")
        return 0
    catch error:
        // TEST: Should handle errors gracefully and display appropriate error message
        handleError(error)
        return 1

// Parse command-line arguments
function parseArguments(args):
    // TEST: Should parse command correctly
    options = {
        command: null,
        modes: [],
        targetDir: process.cwd(),
        interactive: null,
        force: false,
        help: false,
        version: false,
        category: [],
        allInCategory: [],
        byCategory: false // for list-modes
    }
    
    // TEST: Should parse options with values correctly
    for i = 0; i < args.length; i++:
        arg = args[i]
        
        // TEST: Should handle --help flag
        if arg === "--help" or arg === "-h":
            options.help = true
        
        // TEST: Should handle --version flag
        else if arg === "--version" or arg === "-v":
            options.version = true
        
        // TEST: Should parse --modes option correctly
        else if arg === "--modes" or arg === "-m":
            options.modes = args[++i].split(",")
        
        // TEST: Should parse --target-dir option correctly
        else if arg === "--target-dir" or arg === "-t":
            options.targetDir = args[++i]
        
        // TEST: Should parse --interactive flag correctly
        else if arg === "--interactive" or arg === "-i":
            options.interactive = true
        
        // TEST: Should parse --non-interactive flag correctly
        else if arg === "--non-interactive" or arg === "-n":
            options.interactive = false
        
        // TEST: Should parse --force flag correctly
        else if arg === "--force" or arg === "-f":
            options.force = true
        
        // TEST: Should parse --category flag correctly
        else if arg === "--category" or arg === "-c":
            options.category.push(args[++i])
        
        // TEST: Should parse --all-in-category flag correctly
        else if arg === "--all-in-category" or arg === "-a":
            options.allInCategory.push(args[++i])
        
        // TEST: Should parse --by-category flag for list-modes
        else if arg === "--by-category":
            options.byCategory = true
            
        // First non-option argument is the command
        else if !options.command and !arg.startsWith("-"):
            options.command = arg
    
    return options

// Display help text
function displayHelp():
    // TEST: Should display command structure and options
    console.log("Usage: roo-init [command] [options]")
    console.log("\nCommands:")
    console.log("  init        Initialize a project with modes and rules (default)")
    console.log("  list-modes  List available modes (use --by-category to group)")
    console.log("\nOptions for 'init':")
    console.log("  --modes, -m <names>        Comma-separated list of modes to include")
    console.log("  --target-dir, -t <path>    Target directory (default: current directory)")
    console.log("  --interactive, -i          Use interactive mode")
    console.log("  --non-interactive, -n      Use non-interactive mode")
    console.log("  --force, -f                Overwrite existing files")
    console.log("  --category, -c <name>      Select modes from this category (can be used multiple times)")
    console.log("  --all-in-category, -a <name> Select all modes in this category (can be used multiple times)")
    console.log("\nOptions for 'list-modes':")
    console.log("  --by-category              Group modes by category")
    console.log("\nGeneral Options:")
    console.log("  --help, -h                 Display this help text")
    console.log("  --version, -v              Display version information")
    
    console.log("\nExamples:")
    console.log("  roo-init --modes architect,code,tdd")
    console.log("  roo-init --category code --category architecture")
    console.log("  roo-init list-modes --by-category")

// Display version information
function displayVersion():
    // TEST: Should display correct version from package.json
    const packageJson = require("./package.json") // Assuming package.json is in the CLI's root
    console.log(`roo-init v${packageJson.version}`)

// Determine if interactive mode should be used
function determineInteractiveMode(options, config):
    // TEST: Should use explicit option if provided
    if options.interactive !== null:
        return options.interactive
    
    // TEST: Should fall back to configuration default
    return config.interactiveMode !== undefined ? config.interactiveMode : true


// Execute the init command
function executeInitCommand(options, config, isInteractive):
    // TEST: Should initialize mode registry with all modes and categories
    modeRegistry = initializeModeRegistry(config)
    
    // TEST: Should handle categories if specified for mode selection
    finalModeSlugs = options.modes ? [...options.modes] : []
    
    if options.category.length > 0 or options.allInCategory.length > 0:
        categorySelectedSlugs = []
        
        combinedCategoryOptions = [...options.category, ...options.allInCategory]
        
        for categoryId in combinedCategoryOptions:
            // TEST: Should get mode slugs for the given category ID
            slugsFromCategory = getModeSlugsByCategory(modeRegistry, categoryId)
            categorySelectedSlugs = [...categorySelectedSlugs, ...slugsFromCategory]
        
        // Add unique slugs from categories to finalModeSlugs
        for slug in categorySelectedSlugs:
            if !finalModeSlugs.includes(slug):
                finalModeSlugs.push(slug)
    
    // TEST: Should handle mode selection
    modes = selectModes(modeRegistry, finalModeSlugs, isInteractive, options.force)
    
    // TEST: Should validate target directory
    validateTargetDirectory(options.targetDir)
    
    // TEST: Should copy mode definitions successfully
    copyModeDefinitions(modes, options.targetDir, options.force)
    
    // TEST: Should copy rule files
    copyRuleFiles(modes, options.targetDir, options.force, config)

// Execute the list-modes command
function executeListModesCommand(options, config):
    // TEST: Should initialize mode registry
    modeRegistry = initializeModeRegistry(config)
    
    // TEST: Should display modes, optionally grouped by category
    if options.byCategory:
        displayModesGroupedByCategory(modeRegistry)
    else:
        displayAllModesFlat(modeRegistry)

// Handle errors
function handleError(error):
    // TEST: Should display error message with appropriate formatting
    console.error(`Error: ${error.message}`)
    
    // TEST: Should display additional details if available
    if error.details:
        console.error(`Details: ${error.details}`)
    
    // TEST: Should suggest solutions for common errors
    if error.code:
        suggestSolutionForError(error.code)
    
    // TEST: Should display debug information in verbose mode
    if process.env.DEBUG: // Or a specific CLI flag for verbose/debug
        console.error(`Stack trace: ${error.stack}`)

// Suggest solutions for common errors
function suggestSolutionForError(errorCode):
    // TEST: Should provide helpful suggestions for known error codes
    switch errorCode:
        case "MODE_NOT_FOUND":
            console.error("Suggestion: Use --modes option with valid mode names, separated by commas. Run 'roo-init list-modes' to see available modes.")
            break
        case "TARGET_NOT_WRITABLE":
            console.error("Suggestion: Ensure you have write permissions for the target directory.")
            break
        case "CONFIG_ERROR":
            console.error("Suggestion: Check the configuration file for syntax errors or missing required fields.")
            break
        case "CATEGORY_NOT_FOUND":
            console.error("Suggestion: Ensure the category ID is correct. Run 'roo-init list-modes --by-category' to see available categories and their modes.")
            break
        default:
            // No specific suggestion for this error code
            break
```

## 2. Configuration Module

```
// Load configuration from file or environment
function loadConfiguration():
    // TEST: Should try to load from default locations
    const defaultLocations = [
        "./roo-init.config.js",
        "./roo-init.config.json",
        path.join(os.homedir(), ".roo-init", "config.js"),
        path.join(os.homedir(), ".roo-init", "config.json")
    ]
    
    let loadedConfig = null
    // TEST: Should try each path in order
    for loc_path in defaultLocations:
        try:
            // TEST: Should load and parse configuration file
            if fileExists(loc_path):
                 loadedConfig = loadConfigFromFile(loc_path)
                 if loadedConfig: break
        catch error:
            // console.warn(`Warning: Could not load config from ${loc_path}: ${error.message}`)
            continue
    
    // TEST: Should use default configuration if no file found
    if !loadedConfig:
        loadedConfig = getDefaultConfig()
        
    resolvedConfig = resolveConfigPaths(loadedConfig) // Resolve paths after loading/defaulting
    finalConfig = overrideConfigWithEnv(resolvedConfig) // Override with ENV vars last
    return finalConfig


// Load configuration from a file
function loadConfigFromFile(filePath):
    // TEST: Should handle different file extensions
    resolvedFilePath = resolvePath(filePath)
    if !fileExists(resolvedFilePath):
        return null

    if resolvedFilePath.endsWith(".js"):
        // TEST: Should load JavaScript module
        return require(resolvedFilePath)
    else if resolvedFilePath.endsWith(".json"):
        // TEST: Should load and parse JSON file
        const fs =require("fs")
        return JSON.parse(fs.readFileSync(resolvedFilePath, "utf8"))
    else:
        throw new Error(`Unsupported file extension: ${resolvedFilePath}`)

// Get default configuration
function getDefaultConfig():
    // TEST: Should provide sensible defaults
    return {
        modesSourcePath: "./.roo-modes-source", // Default path for discovering modes
        rulesBasePath: "./.roo-rules-source", // Default path for discovering rule files
        interactiveMode: true,
        categories: getDefaultCategories() // Load default categories
    }

// Validate configuration
function validateConfiguration(config):
    // TEST: Should validate configuration structure
    if !config:
        throw new Error("CONFIG_ERROR: Configuration object is required")
    
    // TEST: Should validate modesSourcePath
    if !config.modesSourcePath or typeof config.modesSourcePath !== "string":
        throw new Error("CONFIG_ERROR: 'modesSourcePath' property must be a string")

    // TEST: Should validate rulesBasePath
    if !config.rulesBasePath or typeof config.rulesBasePath !== "string":
        throw new Error("CONFIG_ERROR: 'rulesBasePath' property must be a string")

    // TEST: Should validate categories if present
    if config.categories and !Array.isArray(config.categories):
        throw new Error("CONFIG_ERROR: 'categories' property, if present, must be an array")
    if config.categories:
        for category_def in config.categories:
            validateCategoryDefinition(category_def)

    return true

// Override configuration with environment variables
function overrideConfigWithEnv(config_obj):
    // TEST: Should handle ROO_INIT_INTERACTIVE_MODE
    if process.env.ROO_INIT_INTERACTIVE_MODE:
        config_obj.interactiveMode = process.env.ROO_INIT_INTERACTIVE_MODE === "true"
    
    // TEST: Should handle ROO_INIT_MODES_SOURCE_PATH
    if process.env.ROO_INIT_MODES_SOURCE_PATH:
        config_obj.modesSourcePath = process.env.ROO_INIT_MODES_SOURCE_PATH

    // TEST: Should handle ROO_INIT_RULES_BASE_PATH
    if process.env.ROO_INIT_RULES_BASE_PATH:
        config_obj.rulesBasePath = process.env.ROO_INIT_RULES_BASE_PATH
    
    return config_obj

// Resolve paths in configuration
function resolveConfigPaths(config_obj):
    // TEST: Should resolve modesSourcePath if provided
    if config_obj.modesSourcePath:
        config_obj.modesSourcePath = resolvePath(config_obj.modesSourcePath)
    
    // TEST: Should resolve rulesBasePath if provided
    if config_obj.rulesBasePath:
        config_obj.rulesBasePath = resolvePath(config_obj.rulesBasePath)
    
    // Future: Resolve paths within individual mode definitions if they contain relative paths
    // for their specific rule files or templates.
    
    return config_obj

// Resolve a path to absolute, optionally relative to a base path
function resolvePath(filePath, basePath = process.cwd()):
    // TEST: Should return absolute path unchanged
    if path.isAbsolute(filePath):
        return filePath
    
    // TEST: Should resolve ~ to home directory
    if filePath.startsWith("~/"):
        return path.join(os.homedir(), filePath.substring(2))
    
    // TEST: Should resolve relative path to basePath
    return path.resolve(basePath, filePath)

// Get directories in a path
function getDirectories(dirPath):
    // TEST: Should return only directories
    const fs = require("fs")
    try {
        return fs.readdirSync(dirPath)
            .filter(f => fs.statSync(path.join(dirPath, f)).isDirectory())
    } catch (error) {
        // console.warn(`Could not read directories from ${dirPath}: ${error.message}`)
        return []
    }


// Export configuration to a file
function exportConfiguration(config_obj, outputPath):
    // TEST: Should validate configuration before export
    validateConfiguration(config_obj)
    
    // TEST: Should format configuration as JSON
    const configJson = JSON.stringify(config_obj, null, 2)
    
    // TEST: Should write to specified file
    const fs = require("fs")
    fs.writeFileSync(outputPath, configJson)
    console.log(`Configuration exported to ${outputPath}`)
    return true
```

## 3. Mode Module
```
// Load modes from the configured modesSourcePath
function loadModesFromPath(modesSourcePath_param):
    // TEST: Should load modes from .roomodes file or individual .json/.js files in modesSourcePath_param
    
    if !modesSourcePath_param or !directoryExists(modesSourcePath_param):
        // console.warn(`Warning: Modes source path ${modesSourcePath_param} not found or not a directory.`)
        return []

    let loadedModes = []
    const fs = require("fs")
    
    // Option 1: Check for a single .roomodes file at the root of modesSourcePath_param
    const rootRoomodesFile = path.join(modesSourcePath_param, ".roomodes")
    if (fileExists(rootRoomodesFile)) {
        try {
            const roomodesContent = fs.readFileSync(rootRoomodesFile, "utf8")
            const roomodes = JSON.parse(roomodesContent)
            if (roomodes.customModes && Array.isArray(roomodes.customModes)) {
                loadedModes = roomodes.customModes.map(mode_def => ({
                    ...mode_def,
                    categories: mode_def.categories || ["uncategorized"],
                    primaryCategory: mode_def.primaryCategory || (mode_def.categories && mode_def.categories[0]) || "uncategorized",
                    // mode_def itself might specify a relative path to its rules, e.g., mode_def.rulesPath = "./rules"
                }))
            }
        } catch (error) {
            // console.warn(`Warning: Could not load/parse modes from ${rootRoomodesFile}: ${error.message}`)
        }
    } else {
        // Option 2: Scan for individual mode definition files (e.g., *.mode.json)
        const files = fs.readdirSync(modesSourcePath_param)
        for (const file_name of files) {
            if (file_name.endsWith(".mode.json") || file_name.endsWith(".mode.js")) { // Convention for mode files
                const modeFilePath = path.join(modesSourcePath_param, file_name)
                try {
                    let mode_def
                    if (file_name.endsWith(".js")) {
                        mode_def = require(modeFilePath) // For .js mode files
                    } else {
                        const modeContent = fs.readFileSync(modeFilePath, "utf8")
                        mode_def = JSON.parse(modeContent) // For .json mode files
                    }
                    
                    // Basic validation for a mode definition
                    if (mode_def && mode_def.slug && mode_def.name) {
                         loadedModes.push({
                            ...mode_def,
                            categories: mode_def.categories || ["uncategorized"],
                            primaryCategory: mode_def.primaryCategory || (mode_def.categories && mode_def.categories[0]) || "uncategorized",
                            // Store the path from where it was loaded, could be useful for resolving relative paths within mode_def
                            definitionPath: modeFilePath 
                        })
                    } else {
                        // console.warn(`Warning: Invalid mode definition in ${modeFilePath}. Missing slug or name.`)
                    }
                } catch (error) {
                    // console.warn(`Warning: Could not load/parse mode from ${modeFilePath}: ${error.message}`)
                }
            }
        }
    }
    
    // TEST: Should return array of mode definitions
    return loadedModes

// Select modes
function selectModes(registry, selectedModeSlugs_param, isInteractive, force):
    // TEST: Should handle empty registry
    if !registry or !registry.modes or Object.keys(registry.modes).length === 0:
        throw new Error("MODE_NOT_FOUND: No modes available in registry")
    
    // TEST: Should get all available modes from the registry
    allAvailableModes = getAllAvailableModes(registry)
    
    // TEST: Should handle no available modes
    if allAvailableModes.length === 0:
        throw new Error("MODE_NOT_FOUND: No modes available")
    
    // Pre-selected modes (e.g. from a global default in config, if implemented)
    preSelectedModeObjects = [] 
    // Example: if config.defaultModeSlugs, populate preSelectedModeObjects
    // for slug in (config.defaultModeSlugs || []):
    //    modeObj = getModeBySlug(registry, slug)
    //    if modeObj: preSelectedModeObjects.push(modeObj)

    // TEST: Should validate user-provided mode slugs if any
    if selectedModeSlugs_param and selectedModeSlugs_param.length > 0:
        // TEST: Should validate each provided mode slug against the global registry
        validatedUserSelectedModes = []
        for slug_str in selectedModeSlugs_param:
            modeObj = getModeBySlug(registry, slug_str)
            if !modeObj:
                throw new Error(`MODE_NOT_FOUND: Mode '${slug_str}' not found. Available: ${Object.keys(registry.modes).join(", ")}`)
            validatedUserSelectedModes.push(modeObj)
        
        // TEST: Should return selected modes (user-provided takes precedence over interactive prompt)
        finalSelectedModes = [...preSelectedModeObjects]
        for modeObj in validatedUserSelectedModes:
            if !finalSelectedModes.some(m => m.slug === modeObj.slug):
                finalSelectedModes.push(modeObj)
        
        return resolveModeDependencies(finalSelectedModes, registry)

    // TEST: Should prompt for mode selection in interactive mode
    if isInteractive:
        return promptForModesWithCategories(registry, preSelectedModeObjects, force)
    
    // TEST: Should return pre-selected modes in non-interactive mode (if no slugs provided)
    return resolveModeDependencies(preSelectedModeObjects, registry)


// (promptForModeSelection is replaced by promptForModesWithCategories)
```

## 4. File Operations Module

```
// Validate target directory
function validateTargetDirectory(targetDir_path):
    // TEST: Should check if directory exists
    if !directoryExists(targetDir_path):
        // Try to create it? Or error out? For now, error out.
        throw new Error(`TARGET_NOT_FOUND: Target directory '${targetDir_path}' does not exist. Please create it first.`)
    
    // TEST: Should check if directory is writable
    if !isDirectoryWritable(targetDir_path):
        throw new Error(`TARGET_NOT_WRITABLE: Target directory '${targetDir_path}' is not writable.`)
    
    return true

// Check if a directory exists
function directoryExists(dirPath_str):
    const fs = require("fs")
    try:
        return fs.existsSync(dirPath_str) and fs.statSync(dirPath_str).isDirectory()
    catch error:
        return false

// Check if a file exists
function fileExists(filePath_str):
    const fs = require("fs")
    try:
        return fs.existsSync(filePath_str) and fs.statSync(filePath_str).isFile()
    catch error:
        return false

// Check if a directory is writable
function isDirectoryWritable(dirPath_str):
    const fs = require("fs")
    const testFileName = `.roo-init-test-${Date.now()}`
    try:
        const testFile = path.join(dirPath_str, testFileName)
        fs.writeFileSync(testFile, "test")
        fs.unlinkSync(testFile)
        return true
    catch error:
        return false

// Copy mode definitions to target project
function copyModeDefinitions(modes_array, targetDir_path, force_flag):
    // TEST: Should create target .roomodes file path
    const targetRoomodesPath = path.join(targetDir_path, ".roomodes")
    
    // TEST: Should check if .roomodes file already exists
    if fileExists(targetRoomodesPath) and !force_flag:
        throw new Error(`FILE_EXISTS: ".roomodes" file already exists in ${targetDir_path}. Use --force to overwrite.`)
    else if fileExists(targetRoomodesPath) and force_flag:
        console.warn(`Warning: Overwriting existing ".roomodes" file at ${targetRoomodesPath} due to --force flag.`)
        backupFile(targetRoomodesPath)

    // TEST: Should create .roomodes content with selected modes
    const roomodesContent = createRoomodesContent(modes_array)
    
    // TEST: Should write .roomodes file
    const fs = require("fs")
    fs.writeFileSync(targetRoomodesPath, roomodesContent)
    
    // TEST: Should log success message
    console.log(`Mode definitions copied to ${targetRoomodesPath}`)
    
    return true

// Create .roomodes file content
function createRoomodesContent(modes_array):
    // TEST: Should create valid JSON structure
    const roomodes_obj = {
        customModes: []
    }
    
    // TEST: Should add each mode to customModes array
    for mode_data in modes_array:
        roomodes_obj.customModes.push({
            slug: mode_data.slug,
            name: mode_data.name,
            roleDefinition: mode_data.roleDefinition,
            customInstructions: mode_data.customInstructions,
            groups: mode_data.groups,
            source: "project", // All modes copied to project become "project" source
            categories: mode_data.categories && mode_data.categories.length > 0 ? mode_data.categories : ["uncategorized"],
            primaryCategory: mode_data.primaryCategory || (mode_data.categories && mode_data.categories[0]) || "uncategorized",
            // Retain other mode-specific properties like 'rulesPath' if they exist on mode_data
            rulesPath: mode_data.rulesPath // if mode definition specifies its own rules location
        })
    
    // TEST: Should return formatted JSON string
    return JSON.stringify(roomodes_obj, null, 2)


// Copy rule files
function copyRuleFiles(modes_array, targetDir_path, force_flag, config):
    // TEST: Should create target .roo directory path
    const targetRooDir = path.join(targetDir_path, ".roo")
    
    // TEST: Should create target .roo directory if it doesn't exist
    const fs = require("fs")
    if !directoryExists(targetRooDir):
        fs.mkdirSync(targetRooDir, { recursive: true })
    
    // Copy global rules (if any) from config.rulesBasePath
    // TEST: Should copy global rules once
    copyGlobalRules(config.rulesBasePath, targetRooDir, force_flag)
        
    // TEST: Should copy mode-specific rules for each mode
    for mode_data in modes_array:
        copyModeSpecificRules(mode_data, config.rulesBasePath, targetRooDir, force_flag)
    
    // TEST: Should log success message
    console.log(`Rule files copied to ${targetRooDir}`)
    
    return true


// Copy global rules
function copyGlobalRules(globalRulesSourcePath, targetRooDir_path, force_flag):
    // Global rules are typically in a 'rules' subdirectory of the globalRulesSourcePath
    const sourceGenericRulesPath = path.join(globalRulesSourcePath, "rules") 
    
    // TEST: Should check if source global rules directory exists
    if !directoryExists(sourceGenericRulesPath):
        // console.warn(`Warning: No global rules found at ${sourceGenericRulesPath}`)
        return
    
    // TEST: Should create target rules directory (e.g., .roo/rules)
    const targetGenericRulesDir = path.join(targetRooDir_path, "rules")
    
    // TEST: Should create target rules directory if it doesn't exist
    const fs = require("fs")
    if !directoryExists(targetGenericRulesDir):
        fs.mkdirSync(targetGenericRulesDir, { recursive: true })
    
    // TEST: Should copy all files from source to target
    copyDirectory(sourceGenericRulesPath, targetGenericRulesDir, force_flag)

// Copy mode-specific rules
function copyModeSpecificRules(mode_data, globalRulesBasePath, targetRooDir_path, force_flag):
    // Determine source path for mode-specific rules.
    // Priority:
    // 1. mode_data.rulesPath (if absolute or resolvable relative to its definitionPath)
    // 2. Conventional path: globalRulesBasePath/rules-[mode_slug]
    // 3. Conventional path: globalRulesBasePath/[mode_slug]/rules
    
    let sourceModeRulesPath = null

    if (mode_data.rulesPath) { // Mode definition explicitly specifies its rules location
        if (path.isAbsolute(mode_data.rulesPath)) {
            sourceModeRulesPath = mode_data.rulesPath
        } else if (mode_data.definitionPath) { // If mode_data.rulesPath is relative, resolve from where mode was defined
            sourceModeRulesPath = resolvePath(mode_data.rulesPath, path.dirname(mode_data.definitionPath))
        }
    }

    if (!sourceModeRulesPath || !directoryExists(sourceModeRulesPath)) {
        // Fallback to convention 1: globalRulesBasePath/rules-[mode_slug]
        sourceModeRulesPath = path.join(globalRulesBasePath, `rules-${mode_data.slug}`)
    }

    if (!directoryExists(sourceModeRulesPath)) {
        // Fallback to convention 2: globalRulesBasePath/[mode_slug]/rules
        sourceModeRulesPath = path.join(globalRulesBasePath, mode_data.slug, "rules")
    }
    
    // TEST: Should check if source mode-specific rules directory exists
    if !directoryExists(sourceModeRulesPath):
        // console.warn(`Warning: No specific rules found for mode ${mode_data.slug} at any conventional path.`)
        return
    
    // TEST: Should create target mode-specific rules directory (e.g., .roo/rules-mode_slug)
    const targetModeRulesDir = path.join(targetRooDir_path, `rules-${mode_data.slug}`)
    
    // TEST: Should create target mode-specific rules directory if it doesn't exist
    const fs = require("fs")
    if !directoryExists(targetModeRulesDir):
        fs.mkdirSync(targetModeRulesDir, { recursive: true })
    
    // TEST: Should copy all files from source to target
    copyDirectory(sourceModeRulesPath, targetModeRulesDir, force_flag)

// Copy directory with all contents
function copyDirectory(source_path, target_path, force_flag):
    // TEST: Should get list of files/dirs in source directory
    const fs = require("fs")
    const items = fs.readdirSync(source_path)
    
    // TEST: Should copy each item
    for item_name in items:
        const sourceItemPath = path.join(source_path, item_name)
        const targetItemPath = path.join(target_path, item_name)
        
        const stats = fs.statSync(sourceItemPath)
        
        if stats.isDirectory():
            // TEST: Should handle directories recursively: create target dir if not exists
            if !directoryExists(targetItemPath):
                fs.mkdirSync(targetItemPath, { recursive: true })
            
            // TEST: Should copy directory contents recursively
            copyDirectory(sourceItemPath, targetItemPath, force_flag)
        else: // It's a file
            // TEST: Should check if target file already exists
            if fileExists(targetItemPath) and !force_flag:
                // console.warn(`Warning: File ${targetItemPath} already exists. Use --force to overwrite.`)
                continue
            else if fileExists(targetItemPath) and force_flag:
                // console.warn(`Warning: Overwriting ${targetItemPath} due to --force.`)
                backupFile(targetItemPath)

            // TEST: Should copy file
            fs.copyFileSync(sourceItemPath, targetItemPath)
```

## 5. Utilities Module

```
// Read user input from command line (basic synchronous stub for pseudocode)
// In real Node.js, this would use readline.createInterface with async/await or Promises
function readUserInput(prompt_str):
    // This is a simplified stub. Real implementation is more complex.
    // For pseudocode purposes, assume it blocks and returns user input.
    // console.log(prompt_str) // Display prompt
    // return MOCK_USER_INPUT // Replace with actual input mechanism in real code
    // Example:
    // const promptSync = require('prompt-sync')();
    // return promptSync(prompt_str);
    throw new Error("readUserInput needs to be implemented with a real input mechanism.")


// Prompt for multiple selection (simplified for pseudocode)
function promptForMultipleSelection(prompt_str, options_array):
    console.log(prompt_str)
    
    for i, option_val in options_array.map((opt, idx) => [idx, opt]):
        console.log(`${i+1}. ${option_val}`)
    
    const input_str = readUserInput("Enter numbers or names (comma-separated, e.g., 1,3,another-name): ")
    
    // Parse input
    const selections = []
    if (!input_str || input_str.trim() === "") return selections

    const parts = input_str.split(",").map(p => p.trim().toLowerCase())
    
    for part_val in parts:
        // Handle numeric input
        if /^\d+$/.test(part_val):
            const index = parseInt(part_val) - 1
            if index >= 0 and index < options_array.length:
                if !selections.includes(options_array[index]):
                     selections.push(options_array[index])
        // Handle direct name input (case-insensitive)
        else {
            const matchedOption = options_array.find(opt => opt.toLowerCase() === part_val)
            if (matchedOption && !selections.includes(matchedOption)) {
                selections.push(matchedOption)
            }
        }
    
    return selections

// Create backup of a file
function backupFile(filePath_str):
    if !fileExists(filePath_str):
        // console.warn(`Backup not created: File ${filePath_str} does not exist.`)
        return null
    
    const fs = require("fs")
    const backupPath = `${filePath_str}.backup-${Date.now()}`
    try {
        fs.copyFileSync(filePath_str, backupPath)
        console.log(`Backed up ${filePath_str} to ${backupPath}`)
        return backupPath
    } catch (error) {
        // console.error(`Error creating backup for ${filePath_str}: ${error.message}`)
        return null
    }

```

## 6. Mode Registry Management

```
// Initialize global mode registry
function initializeModeRegistry(config_obj):
    // TEST: Should create empty registry with categories
    const registry = {
        modes: {}, // slug -> modeDef
        categories: loadCategories(config_obj), // Load category definitions and hierarchy
        modesByCategory: {}, // categoryId -> [slug, slug, ...]
        config: config_obj // Store original config for reference
    }
    
    // TEST: Should load modes from the configured modesSourcePath
    const allLoadedModes = loadModesFromPath(config_obj.modesSourcePath)
    
    // TEST: Should process each loaded mode
    for mode_def in allLoadedModes:
        // TEST: Should populate modesByCategory registry
        for categoryId_str in mode_def.categories:
            if !registry.modesByCategory[categoryId_str]:
                registry.modesByCategory[categoryId_str] = []
            if (!registry.modesByCategory[categoryId_str].includes(mode_def.slug)) {
                registry.modesByCategory[categoryId_str].push(mode_def.slug)
            }
        
        // TEST: Should add mode to registry. If duplicate slug, log warning or overwrite.
        if (registry.modes[mode_def.slug]) {
            // console.warn(`Warning: Duplicate mode slug '${mode_def.slug}' found. Overwriting with definition from ${mode_def.definitionPath || 'unknown source'}.`)
        }
        registry.modes[mode_def.slug] = mode_def
            
    // TEST: Should return populated registry
    return registry

// Get all available modes (unique by slug)
function getAllAvailableModes(registry):
    // TEST: Should return array of unique mode definitions (one per slug)
    allModesList = Object.values(registry.modes)
    
    // TEST: Should return sorted array by slug
    return allModesList.sort((a, b) => a.slug.localeCompare(b.slug))

// Get a specific mode definition by slug
function getModeBySlug(registry, slug_str):
    // TEST: Should return mode definition for existing slug
    if registry.modes[slug_str]:
        return registry.modes[slug_str]
    
    // TEST: Should return null for non-existent mode slug
    return null


// Resolve dependencies among selected modes.
function resolveModeDependencies(selectedModes_array, registry):
    // TEST: Should resolve dependencies
    let finalModes = [...selectedModes_array]
    let newDependenciesFound = true
    const MAX_DEP_ITERATIONS = 5 // Prevent infinite loops
    let iterations = 0

    while (newDependenciesFound && iterations < MAX_DEP_ITERATIONS) {
        newDependenciesFound = false
        iterations++
        
        currentSlugs = finalModes.map(m => m.slug)
        dependenciesToAdd = []

        for mode_data in finalModes:
            // Example: "requires: slug1,slug2" in customInstructions or a dedicated 'dependencies' array in mode_def
            const modeDependencies = (mode_data.dependencies || []).concat(
                (mode_data.customInstructions || "").match(/requires:\s*([\w,-]+)/i)?.[1].split(',').map(s => s.trim()) || []
            )

            for depSlug_str in modeDependencies:
                if (!currentSlugs.includes(depSlug_str)) {
                    const depMode = getModeBySlug(registry, depSlug_str)
                    if (depMode && !dependenciesToAdd.some(d => d.slug === depSlug_str)) {
                        dependenciesToAdd.push(depMode)
                        newDependenciesFound = true
                    } else if (!depMode) {
                        // console.warn(`Warning: Dependency '${depSlug_str}' for mode '${mode_data.slug}' not found in registry.`)
                    }
                }
        
        if (newDependenciesFound) {
            for dep in dependenciesToAdd:
                 if (!finalModes.some(fm => fm.slug === dep.slug)) {
                     finalModes.push(dep)
                 }
        }
    }
    if (iterations === MAX_DEP_ITERATIONS && newDependenciesFound) {
        // console.warn("Max dependency resolution iterations reached. There might be circular dependencies.")
    }
    
    // TEST: Should return modes with resolved dependencies
    return finalModes
```

## 7. Category Management

```
// Load category definitions from configuration
function loadCategories(config_obj):
    // TEST: Should load categories from configuration or use defaults
    categoryDefinitions_array = config_obj.categories || getDefaultCategories()
    
    // TEST: Should validate category structure for each definition
    for category_def in categoryDefinitions_array:
        validateCategoryDefinition(category_def)
    
    // TEST: Should build category hierarchy
    categoryHierarchy_obj = buildCategoryHierarchy(categoryDefinitions_array)
    
    // TEST: Should return category registry object
    return {
        definitions: categoryDefinitions_array,
        hierarchy: categoryHierarchy_obj,
        byId: indexCategoriesById(categoryDefinitions_array)
    }

// Validate a single category definition
function validateCategoryDefinition(category_def):
    // TEST: Should ensure ID and Name are present
    if !category_def.id || typeof category_def.id !== 'string':
        throw new Error("CATEGORY_ERROR: Category 'id' is required and must be a string.")
    if !category_def.name || typeof category_def.name !== 'string':
        throw new Error("CATEGORY_ERROR: Category 'name' is required and must be a string.")
    // TEST: Should ensure parentId, if present, is a string
    if category_def.parentId !== undefined && typeof category_def.parentId !== 'string':
        throw new Error("CATEGORY_ERROR: Category 'parentId' if present, must be a string.")
    return true


// Build category hierarchy from flat list
function buildCategoryHierarchy(categories_array):
    // TEST: Should create root level for categories without parents
    const result_obj = {
        root: [], // Array of root category IDs
        children: {} // Map of parentId -> [childId, childId]
    }
    const categoryIds = new Set(categories_array.map(c => c.id))

    // TEST: Should identify root categories
    for category_data in categories_array:
        if !category_data.parentId || !categoryIds.has(category_data.parentId):
            result_obj.root.push(category_data.id)
            
    // TEST: Should build child relationships
    for category_data in categories_array:
        if category_data.parentId && categoryIds.has(category_data.parentId):
            if !result_obj.children[category_data.parentId]:
                result_obj.children[category_data.parentId] = []
            
            result_obj.children[category_data.parentId].push(category_data.id)
    
    // TEST: Should return complete hierarchy object
    return result_obj

// Index categories by ID for quick lookup
function indexCategoriesById(categories_array):
    // TEST: Should create map of id to category definition object
    const categoryMap = {}
    
    for category_data in categories_array:
        categoryMap[category_data.id] = category_data
    
    return categoryMap

// Get default categories if not provided in config
function getDefaultCategories():
    // TEST: Should return predefined category structure
    return [
        { id: "specification", name: "Specification", description: "Requirements, documentation, planning", icon: "📝" },
        { id: "architecture", name: "Architecture", description: "Design and infrastructure", icon: "🏗️" },
        { id: "code", name: "Code", description: "Implementation and development", icon: "💻" },
        { id: "test", name: "Testing", description: "QA, TDD, test generation", icon: "🧪" },
        { id: "devops", name: "DevOps", description: "Deployment, CI/CD, operations", icon: "🚀" },
        { id: "management", name: "Management", description: "Orchestration, project management", icon: "⚙️" },
        { id: "uncategorized", name: "Uncategorized", description: "Modes without a specific category", icon: "❓" }
    ]

// Get modes by category ID from the registry
function getModesByCategory(registry, categoryId_str):
    // TEST: Should return array of mode objects in the category
    if !registry.modesByCategory[categoryId_str]:
        return [] 
    
    const modeSlugsInCategory = registry.modesByCategory[categoryId_str]
    
    // TEST: Should retrieve mode objects for all mode slugs in category
    let modes_list = modeSlugsInCategory.map(slug_str =>
        getModeBySlug(registry, slug_str) 
    ).filter(mode_obj => mode_obj !== null)
    
    return modes_list

// Get mode slugs by category ID (useful for command-line selection)
function getModeSlugsByCategory(registry, categoryId_str):
    // TEST: Should return array of mode slugs
    const modesInCategory = getModesByCategory(registry, categoryId_str)
    return modesInCategory.map(m => m.slug)


// Display modes grouped by category
function displayModesGroupedByCategory(registry):
    // TEST: Should display categorized modes
    console.log("\nAvailable Modes (Grouped by Category):")
    
    const sortedCategories = [...registry.categories.definitions].sort((a, b) => 
        a.name.localeCompare(b.name)
    )
    
    let modesDisplayed = false
    // TEST: Should display each category that has modes
    for category_data in sortedCategories:
        const categoryModes = getModesByCategory(registry, category_data.id)
        
        if (categoryModes.length > 0) {
            modesDisplayed = true
            console.log(`\n${category_data.icon || ""} ${category_data.name} (${category_data.id}):`)
            
            // TEST: Should display modes in category
            for mode_data in categoryModes.sort((a,b) => a.name.localeCompare(b.name)):
                console.log(`  - ${mode_data.slug}: ${mode_data.name}`)
        }
    }
    if (!modesDisplayed) {
        console.log("No modes found in any category.")
    }


// Display all modes in a flat list
function displayAllModesFlat(registry):
    console.log("\nAvailable Modes:")
    let allModes = getAllAvailableModes(registry)

    if (allModes.length === 0) {
        console.log("No modes available.")
        return
    }

    for mode_data in allModes.sort((a,b) => a.name.localeCompare(b.name)):
        let primaryCatDisplay = ""
        if (mode_data.primaryCategory) {
            const catName = registry.categories.byId[mode_data.primaryCategory]?.name || mode_data.primaryCategory
            primaryCatDisplay = ` (Category: ${catName})`
        }
        console.log(`- ${mode_data.slug}: ${mode_data.name}${primaryCatDisplay}`)
    }


// Prompt for mode selection with category support
function promptForModesWithCategories(registry, preSelectedModeObjects_param, force_flag):
    // TEST: Should display modes by category
    displayModesGroupedByCategory(registry)
    
    // TEST: Should show pre-selected modes (slugs)
    const preSelectedSlugs = preSelectedModeObjects_param.map(mode_obj => mode_obj.slug)
    if (preSelectedSlugs.length > 0) {
        console.log(`\nPre-selected modes: ${preSelectedSlugs.join(", ")}`)
    } else {
        console.log("\nNo modes pre-selected.")
    }
    
    // TEST: Should offer category-based filtering and individual mode selection
    console.log("\nYou can select by category ID (e.g., 'category:code'), individual mode slugs (e.g., 'auto-coder,tdd'), or a mix.")
    console.log("Separate multiple selections with commas. Enter nothing to accept pre-selected modes (if any).")
    
    // TEST: Should prompt for selection
    const userInput_str = readUserInput("Enter your selections: ")
    
    // TEST: Should handle empty input (use pre-selected)
    if (!userInput_str || userInput_str.trim() === "") {
        // If global required modes exist and not forced, ensure they are included.
        // Example: if config.requiredModeSlugs and !force_flag:
        //   for reqSlug in config.requiredModeSlugs:
        //     if !preSelectedSlugs.includes(reqSlug):
        //       coreModeObj = getModeBySlug(registry, reqSlug)
        //       if coreModeObj: preSelectedModeObjects_param.push(coreModeObj)
        return resolveModeDependencies(preSelectedModeObjects_param, registry)
    }
    
    // TEST: Should parse input with special handling for categories
    let desiredModeSlugs = []
    const inputParts = userInput_str.split(",").map(part => part.trim().toLowerCase())
    
    // Process each input part
    for part_val in inputParts:
        // TEST: Should handle category selection syntax "category:id"
        if part_val.startsWith("category:"):
            const categoryId = part_val.substring(9)
            if (registry.categories.byId[categoryId]) {
                const slugsFromCategory = getModeSlugsByCategory(registry, categoryId)
                for slug_val in slugsFromCategory:
                    if (!desiredModeSlugs.includes(slug_val)) desiredModeSlugs.push(slug_val)
            } else {
                console.warn(`Warning: Category ID '${categoryId}' not found. Ignoring.`)
            }
        else if (part_val) { // Regular mode slug
            if (!desiredModeSlugs.includes(part_val)) desiredModeSlugs.push(part_val)
        }
    
    // Combine with pre-selected slugs (unique)
    let finalSlugsToProcess = [...preSelectedSlugs]
    for slug_val in desiredModeSlugs:
        if (!finalSlugsToProcess.includes(slug_val)) finalSlugsToProcess.push(slug_val)

    // Validate all slugs and get mode objects
    let finalModeObjects = []
    for slug_str_val in finalSlugsToProcess:
        const modeObj = getModeBySlug(registry, slug_str_val)
        if (modeObj) {
            if (!finalModeObjects.some(m => m.slug === modeObj.slug)) {
                finalModeObjects.push(modeObj)
            }
        } else {
            console.warn(`Warning: Mode slug '${slug_str_val}' not found or invalid. Ignoring.`)
        }

    // If a concept of "globally required modes" exists (not tied to workflows):
    // if (config.requiredModeSlugs && !force_flag) {
    //     const currentFinalSlugs = finalModeObjects.map(m => m.slug)
    //     for reqSlug in config.requiredModeSlugs:
    //         if (!currentFinalSlugs.includes(reqSlug)) {
    //             const reqModeObj = getModeBySlug(registry, reqSlug)
    //             if (reqModeObj && !finalModeObjects.some(m => m.slug === reqModeObj.slug)) {
    //                 finalModeObjects.push(reqModeObj)
    //             }
    //         }
    // }
    
    // TEST: Should return combined mode objects after resolving dependencies
    return resolveModeDependencies(finalModeObjects, registry)