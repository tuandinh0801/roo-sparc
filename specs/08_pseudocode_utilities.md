# Roo Init CLI Tool - Utilities Module Pseudocode

This module contains helper functions that are used across the other modules, such as user input handling, logging, and other utility functions.

## User Input Handling

```
// Read user input from command line
function readUserInput(prompt = ""):
    // TEST: Should display prompt if provided
    if prompt:
        process.stdout.write(prompt + " ")
    
    // TEST: Should read input from stdin
    return readlineSync.question("")

// Prompt for a number within a range
function promptForNumber(message, min, max):
    // TEST: Should display message
    console.log(message)
    
    // TEST: Should read user input
    input = readUserInput()
    
    // TEST: Should validate input is a number
    number = parseInt(input, 10)
    if isNaN(number):
        console.log("Please enter a valid number.")
        return promptForNumber(message, min, max)
    
    // TEST: Should validate input is within range
    if number < min or number > max:
        console.log(`Please enter a number between ${min} and ${max}.`)
        return promptForNumber(message, min, max)
    
    // TEST: Should return validated number
    return number

// Prompt for yes/no confirmation
function promptForConfirmation(message):
    // TEST: Should display message with y/n options
    console.log(`${message} (y/n)`)
    
    // TEST: Should read user input
    input = readUserInput().toLowerCase()
    
    // TEST: Should validate input is y or n
    if input !== "y" and input !== "n":
        console.log("Please enter 'y' for yes or 'n' for no.")
        return promptForConfirmation(message)
    
    // TEST: Should return boolean based on input
    return input === "y"

// Prompt for selection from a list
function promptForSelection(message, options):
    // TEST: Should display message
    console.log(message)
    
    // TEST: Should display numbered options
    for i, option in options:
        console.log(`${i + 1}. ${option}`)
    
    // TEST: Should prompt for selection
    selectedIndex = promptForNumber("Enter selection:", 1, options.length)
    
    // TEST: Should return selected option
    return options[selectedIndex - 1]

// Prompt for multiple selections from a list
function promptForMultipleSelections(message, options, preSelected = []):
    // TEST: Should display message
    console.log(message)
    
    // TEST: Should display numbered options with pre-selected indicators
    for i, option in options:
        preSelectedIndicator = preSelected.includes(option) ? "[X] " : "[ ] "
        console.log(`${i + 1}. ${preSelectedIndicator}${option}`)
    
    // TEST: Should prompt for selections
    console.log("Enter numbers separated by commas, or press Enter to accept pre-selected options:")
    input = readUserInput()
    
    // TEST: Should handle empty input (use pre-selected)
    if !input or input.trim() === "":
        return preSelected
    
    // TEST: Should parse comma-separated numbers
    selectedIndices = input.split(",").map(num => parseInt(num.trim(), 10))
    
    // TEST: Should validate each index
    selected = []
    for index in selectedIndices:
        if isNaN(index) or index < 1 or index > options.length:
            console.log(`Invalid selection: ${index}. Please try again.`)
            return promptForMultipleSelections(message, options, preSelected)
        
        selected.push(options[index - 1])
    
    // TEST: Should return selected options
    return selected
```

## Logging and Output Formatting

```
// Log levels
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
}

// Current log level (can be set via environment variable)
let currentLogLevel = LOG_LEVELS.INFO

// Set log level
function setLogLevel(level):
    // TEST: Should set valid log level
    if level in LOG_LEVELS:
        currentLogLevel = LOG_LEVELS[level]
    else if typeof level === "number" and level >= 0 and level <= 3:
        currentLogLevel = level
    else:
        throw new Error(`Invalid log level: ${level}`)

// Log error message
function logError(message):
    // TEST: Should log error message regardless of log level
    console.error(chalk.red(`ERROR: ${message}`))

// Log warning message
function logWarning(message):
    // TEST: Should log warning if log level is WARN or higher
    if currentLogLevel >= LOG_LEVELS.WARN:
        console.warn(chalk.yellow(`WARNING: ${message}`))

// Log info message
function logInfo(message):
    // TEST: Should log info if log level is INFO or higher
    if currentLogLevel >= LOG_LEVELS.INFO:
        console.log(message)

// Log debug message
function logDebug(message):
    // TEST: Should log debug if log level is DEBUG
    if currentLogLevel >= LOG_LEVELS.DEBUG:
        console.log(chalk.gray(`DEBUG: ${message}`))

// Format success message
function formatSuccess(message):
    // TEST: Should format success message with green color and checkmark
    return chalk.green(`✓ ${message}`)

// Format error message
function formatError(message):
    // TEST: Should format error message with red color and X
    return chalk.red(`✗ ${message}`)

// Format warning message
function formatWarning(message):
    // TEST: Should format warning message with yellow color and !
    return chalk.yellow(`! ${message}`)

// Format header
function formatHeader(message):
    // TEST: Should format header with bold and underline
    return chalk.bold.underline(message)

// Format list item
function formatListItem(message, indent = 0):
    // TEST: Should format list item with bullet and indentation
    indentation = " ".repeat(indent * 2)
    return `${indentation}• ${message}`

// Display progress spinner
function startSpinner(message):
    // TEST: Should create and start spinner with message
    spinner = new Spinner(`${message} %s`)
    spinner.setSpinnerString("|/-\\")
    spinner.start()
    return spinner

// Update spinner message
function updateSpinner(spinner, message):
    // TEST: Should update spinner message
    spinner.setSpinnerTitle(`${message} %s`)

// Stop spinner with success
function stopSpinnerSuccess(spinner, message):
    // TEST: Should stop spinner and display success message
    spinner.stop(true)
    console.log(formatSuccess(message))

// Stop spinner with error
function stopSpinnerError(spinner, message):
    // TEST: Should stop spinner and display error message
    spinner.stop(true)
    console.log(formatError(message))
```

## Error Handling Utilities

```
// Create error with code and details
function createError(message, code, details = null):
    // TEST: Should create error with message, code, and details
    error = new Error(message)
    error.code = code
    error.details = details
    return error

// Handle error with appropriate logging and exit
function handleError(error, exitProcess = true):
    // TEST: Should log error message
    logError(error.message)
    
    // TEST: Should log error details if available
    if error.details:
        logError(error.details)
    
    // TEST: Should log error code if available
    if error.code:
        logError(`Error code: ${error.code}`)
        suggestSolutionForErrorCode(error.code)
    
    // TEST: Should log stack trace in debug mode
    if currentLogLevel >= LOG_LEVELS.DEBUG:
        logDebug(error.stack)
    
    // TEST: Should exit process if exitProcess is true
    if exitProcess:
        process.exit(1)

// Suggest solution for error code
function suggestSolutionForErrorCode(code):
    // TEST: Should provide helpful suggestions for known error codes
    solutions = {
        "CONFIG_NOT_FOUND": "Create a configuration file or use environment variables to configure the CLI.",
        "WORKFLOW_NOT_FOUND": "Use --workflow with a valid workflow name or run without arguments for interactive selection.",
        "MODE_NOT_FOUND": "Use --modes with valid mode names or run without arguments for interactive selection.",
        "TARGET_DIR_NOT_WRITABLE": "Ensure you have write permissions to the target directory or specify a different directory with --target-dir.",
        "FILES_ALREADY_EXIST": "Use --force to overwrite existing files or specify a different target directory.",
        "CORE_MODE_REQUIRED": "Include all core modes or use --force to override."
    }
    
    // TEST: Should log solution if available for the error code
    if solutions[code]:
        logInfo(`Suggestion: ${solutions[code]}`)
```

## Path and String Manipulation

```
// Ensure path has trailing slash
function ensureTrailingSlash(pathStr):
    // TEST: Should add trailing slash if not present
    if !pathStr.endsWith("/") and !pathStr.endsWith("\\"):
        return pathStr + path.sep
    
    // TEST: Should return path unchanged if already has trailing slash
    return pathStr

// Sanitize file name
function sanitizeFileName(fileName):
    // TEST: Should remove invalid characters from file name
    return fileName.replace(/[<>:"/\\|?*]/g, "_")

// Convert to slug
function toSlug(str):
    // TEST: Should convert string to lowercase
    result = str.toLowerCase()
    
    // TEST: Should replace spaces with hyphens
    result = result.replace(/\s+/g, "-")
    
    // TEST: Should remove special characters
    result = result.replace(/[^a-z0-9-]/g, "")
    
    // TEST: Should return slug
    return result

// Get relative path
function getRelativePath(from, to):
    // TEST: Should return relative path
    return path.relative(from, to)

// Join paths with proper separators
function joinPaths(...paths):
    // TEST: Should join paths with proper separators
    return path.join(...paths)
```

## Validation Utilities

```
// Validate string is not empty
function validateNonEmptyString(str, fieldName):
    // TEST: Should throw error if string is empty
    if !str or str.trim() === "":
        throw createError(`${fieldName} cannot be empty`, "VALIDATION_ERROR")
    
    // TEST: Should return true if string is not empty
    return true

// Validate array is not empty
function validateNonEmptyArray(arr, fieldName):
    // TEST: Should throw error if array is empty
    if !arr or !Array.isArray(arr) or arr.length === 0:
        throw createError(`${fieldName} cannot be empty`, "VALIDATION_ERROR")
    
    // TEST: Should return true if array is not empty
    return true

// Validate object has required properties
function validateRequiredProperties(obj, requiredProps, objName):
    // TEST: Should throw error if object is missing required properties
    for prop in requiredProps:
        if !obj.hasOwnProperty(prop) or obj[prop] === undefined or obj[prop] === null:
            throw createError(`${objName} is missing required property: ${prop}`, "VALIDATION_ERROR")
    
    // TEST: Should return true if object has all required properties
    return true

// Validate path exists
function validatePathExists(pathStr, pathType = "file"):
    // TEST: Should throw error if path doesn't exist
    if pathType === "file" and !fileSystem.fileExists(pathStr):
        throw createError(`File does not exist: ${pathStr}`, "FILE_NOT_FOUND")
    else if pathType === "directory" and !fileSystem.directoryExists(pathStr):
        throw createError(`Directory does not exist: ${pathStr}`, "DIRECTORY_NOT_FOUND")
    
    // TEST: Should return true if path exists
    return true