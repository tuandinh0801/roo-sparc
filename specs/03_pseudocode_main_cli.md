# Roo Init CLI Tool - Main CLI Module Pseudocode

This module serves as the entry point for the CLI tool and handles command-line argument parsing, workflow coordination, and the main execution flow.

## Main CLI Module

```
// Main entry point for the CLI tool
function main(args):
    // TEST: Should parse command-line arguments correctly
    options = parseCommandLineArguments(args)
    
    // TEST: Should display help text when --help flag is provided
    if options.help:
        displayHelpText()
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
        isInteractive = determineOperationMode(options, config)
        
        // TEST: Should execute the init command successfully
        if options.command === "init":
            executeInitCommand(options, config, isInteractive)
        // TEST: Should handle unknown commands with appropriate error
        else:
            throw new Error(`Unknown command: ${options.command}`)
        
        // TEST: Should display success message on completion
        displaySuccessMessage()
        return 0
    catch error:
        // TEST: Should handle errors gracefully and display appropriate error message
        handleError(error)
        return 1
```

## Command-Line Argument Parsing

```
// Parse command-line arguments into structured options
function parseCommandLineArguments(args):
    // TEST: Should parse command correctly
    command = args[0] || "init"
    
    // TEST: Should parse options with values correctly
    options = {
        command: command,
        workflow: null,
        modes: [],
        targetDir: process.cwd(),
        interactive: null,
        force: false,
        help: false,
        version: false
    }
    
    // TEST: Should handle --help flag
    if args.includes("--help") or args.includes("-h"):
        options.help = true
        return options
    
    // TEST: Should handle --version flag
    if args.includes("--version") or args.includes("-v"):
        options.version = true
        return options
    
    // TEST: Should parse --workflow option correctly
    workflowIndex = args.indexOf("--workflow")
    if workflowIndex !== -1 and workflowIndex < args.length - 1:
        options.workflow = args[workflowIndex + 1]
    
    // TEST: Should parse --modes option correctly
    modesIndex = args.indexOf("--modes")
    if modesIndex !== -1 and modesIndex < args.length - 1:
        options.modes = args[modesIndex + 1].split(",")
    
    // TEST: Should parse --target-dir option correctly
    targetDirIndex = args.indexOf("--target-dir")
    if targetDirIndex !== -1 and targetDirIndex < args.length - 1:
        options.targetDir = args[targetDirIndex + 1]
    
    // TEST: Should parse --interactive flag correctly
    if args.includes("--interactive") or args.includes("-i"):
        options.interactive = true
    
    // TEST: Should parse --non-interactive flag correctly
    if args.includes("--non-interactive"):
        options.interactive = false
    
    // TEST: Should parse --force flag correctly
    if args.includes("--force") or args.includes("-f"):
        options.force = true
    
    return options
```

## Help and Version Display

```
// Display help text with usage examples
function displayHelpText():
    // TEST: Should display command structure and options
    console.log("Usage: roo-init [command] [options]")
    console.log("")
    console.log("Commands:")
    console.log("  init                Initialize a project with selected workflow and modes (default)")
    console.log("")
    console.log("Options:")
    console.log("  --workflow <name>   Specify the workflow to use")
    console.log("  --modes <list>      Comma-separated list of modes to include")
    console.log("  --target-dir <path> Target directory for initialization (default: current directory)")
    console.log("  --interactive, -i   Use interactive mode with prompts (default)")
    console.log("  --non-interactive   Use non-interactive mode without prompts")
    console.log("  --force, -f         Force overwrite of existing files")
    console.log("  --help, -h          Display this help text")
    console.log("  --version, -v       Display version information")
    console.log("")
    console.log("Examples:")
    console.log("  roo-init                                  Initialize interactively in current directory")
    console.log("  roo-init --workflow sparc                 Initialize with SPARC workflow interactively")
    console.log("  roo-init --workflow sparc --modes code,tdd,architect  Initialize with specific modes")
    console.log("  roo-init --target-dir ./my-project        Initialize in ./my-project directory")

// Display version information
function displayVersion():
    // TEST: Should display correct version from package.json
    console.log("roo-init v1.0.0")
```

## Operation Mode Determination

```
// Determine whether to use interactive or non-interactive mode
function determineOperationMode(options, config):
    // TEST: Should use explicit option if provided
    if options.interactive !== null:
        return options.interactive
    
    // TEST: Should fall back to configuration default
    return config.interactiveMode !== false
```

## Init Command Execution

```
// Execute the init command
function executeInitCommand(options, config, isInteractive):
    // TEST: Should handle workflow selection correctly
    workflow = selectWorkflow(options.workflow, config, isInteractive)
    
    // TEST: Should handle mode selection correctly
    modes = selectModes(workflow, options.modes, isInteractive, options.force)
    
    // TEST: Should validate target directory
    validateTargetDirectory(options.targetDir)
    
    // TEST: Should copy mode definitions successfully
    copyModeDefinitions(workflow, modes, options.targetDir, options.force)
    
    // TEST: Should copy rule files successfully
    copyRuleFiles(workflow, modes, options.targetDir, options.force)
```

## Error Handling

```
// Handle errors and display appropriate messages
function handleError(error):
    // TEST: Should display error message with appropriate formatting
    console.error(`Error: ${error.message}`)
    
    // TEST: Should display additional details if available
    if error.details:
        console.error(error.details)
    
    // TEST: Should suggest solutions for common errors
    if error.code:
        suggestSolution(error.code)
    
    // TEST: Should display debug information in verbose mode
    if process.env.DEBUG:
        console.error(error.stack)

// Suggest solutions for common error codes
function suggestSolution(errorCode):
    // TEST: Should provide helpful suggestions for known error codes
    switch errorCode:
        case "WORKFLOW_NOT_FOUND":
            console.error("Suggestion: Use --workflow with a valid workflow name or run without arguments for interactive selection.")
            break
        case "MODE_NOT_FOUND":
            console.error("Suggestion: Use --modes with valid mode names or run without arguments for interactive selection.")
            break
        case "TARGET_DIR_NOT_WRITABLE":
            console.error("Suggestion: Ensure you have write permissions to the target directory or specify a different directory with --target-dir.")
            break
        case "FILES_ALREADY_EXIST":
            console.error("Suggestion: Use --force to overwrite existing files or specify a different target directory.")
            break
```

## Success Message Display

```
// Display success message after completion
function displaySuccessMessage():
    // TEST: Should display appropriate success message
    console.log("Initialization completed successfully!")
    console.log("Your project is now set up with the selected workflow and modes.")
    console.log("You can start using the modes by opening the project in VS Code.")