# Roo Init CLI Tool - File Operations Module Pseudocode

This module handles file system operations, including copying mode definitions and rules to the target project.

## Target Directory Validation

```
// Validate target directory
function validateTargetDirectory(targetDir):
    // TEST: Should check if directory exists
    if !fileSystem.directoryExists(targetDir):
        throw new Error(`Target directory does not exist: ${targetDir}`)
    
    // TEST: Should check if directory is writable
    if !fileSystem.isDirectoryWritable(targetDir):
        throw new Error(`Target directory is not writable: ${targetDir}`)
    
    return true
```

## Mode Definition Copying

```
// Copy mode definitions to target project
function copyModeDefinitions(workflow, selectedModes, targetDir, force):
    // TEST: Should create target .roomodes file path
    targetModesPath = path.join(targetDir, ".roomodes")
    
    // TEST: Should check if .roomodes file already exists
    if fileSystem.fileExists(targetModesPath) and !force:
        throw new Error("'.roomodes' file already exists in target directory. Use --force to overwrite.")
    
    // TEST: Should create .roomodes content with selected modes
    modesContent = createModesFileContent(selectedModes)
    
    // TEST: Should write .roomodes file
    fileSystem.writeFile(targetModesPath, modesContent)
    
    // TEST: Should log success message
    console.log(`Mode definitions copied to ${targetModesPath}`)
    
    return true

// Create content for .roomodes file
function createModesFileContent(modes):
    // TEST: Should create valid JSON structure
    content = {
        "customModes": []
    }
    
    // TEST: Should add each mode to customModes array
    for mode in modes:
        content.customModes.push({
            "slug": mode.slug,
            "name": mode.name,
            "roleDefinition": mode.roleDefinition,
            "customInstructions": mode.customInstructions,
            "groups": mode.groups,
            "source": mode.source
        })
    
    // TEST: Should return formatted JSON string
    return JSON.stringify(content, null, 2)
```

## Rule Copying

```
// Copy rule files to target project
function copyRuleFiles(workflow, selectedModes, targetDir, force):
    // TEST: Should create target .roo directory
    targetRooDir = path.join(targetDir, ".roo")
    
    // TEST: Should create target .roo directory if it doesn't exist
    if !fileSystem.directoryExists(targetRooDir):
        fileSystem.createDirectory(targetRooDir)
    
    // TEST: Should copy generic workflow rules
    copyGenericRules(workflow, targetRooDir, force)
    
    // TEST: Should copy mode-specific rules for each selected mode
    for mode in selectedModes:
        copyModeSpecificRules(workflow, mode, targetRooDir, force)
    
    // TEST: Should log success message
    console.log(`Rule files copied to ${targetRooDir}`)
    
    return true

// Copy generic workflow rules
function copyGenericRules(workflow, targetRooDir, force):
    // TEST: Should create source rules path
    sourceRulesDir = path.join(workflow.rulesPath, "rules")
    
    // TEST: Should check if source rules directory exists
    if !fileSystem.directoryExists(sourceRulesDir):
        console.warn(`Generic rules directory not found: ${sourceRulesDir}`)
        return false
    
    // TEST: Should create target rules directory
    targetRulesDir = path.join(targetRooDir, "rules")
    
    // TEST: Should create target rules directory if it doesn't exist
    if !fileSystem.directoryExists(targetRulesDir):
        fileSystem.createDirectory(targetRulesDir)
    
    // TEST: Should copy all files from source to target
    copyDirectory(sourceRulesDir, targetRulesDir, force)
    
    return true

// Copy mode-specific rules
function copyModeSpecificRules(workflow, mode, targetRooDir, force):
    // TEST: Should create source mode-specific rules path
    sourceModesRulesDir = path.join(workflow.rulesPath, `rules-${mode.slug}`)
    
    // TEST: Should check if source mode-specific rules directory exists
    if !fileSystem.directoryExists(sourceModesRulesDir):
        console.warn(`Mode-specific rules directory not found for mode '${mode.slug}': ${sourceModesRulesDir}`)
        return false
    
    // TEST: Should create target mode-specific rules directory
    targetModeRulesDir = path.join(targetRooDir, `rules-${mode.slug}`)
    
    // TEST: Should create target mode-specific rules directory if it doesn't exist
    if !fileSystem.directoryExists(targetModeRulesDir):
        fileSystem.createDirectory(targetModeRulesDir)
    
    // TEST: Should copy all files from source to target
    copyDirectory(sourceModesRulesDir, targetModeRulesDir, force)
    
    return true

// Copy directory recursively
function copyDirectory(sourceDir, targetDir, force):
    // TEST: Should get list of files in source directory
    files = fileSystem.listFiles(sourceDir)
    
    // TEST: Should copy each file
    for file in files:
        sourcePath = path.join(sourceDir, file)
        targetPath = path.join(targetDir, file)
        
        // TEST: Should handle directories recursively
        if fileSystem.isDirectory(sourcePath):
            // TEST: Should create target directory if it doesn't exist
            if !fileSystem.directoryExists(targetPath):
                fileSystem.createDirectory(targetPath)
            
            // TEST: Should copy directory contents recursively
            copyDirectory(sourcePath, targetPath, force)
        else:
            // TEST: Should check if target file already exists
            if fileSystem.fileExists(targetPath) and !force:
                throw new Error(`File already exists: ${targetPath}. Use --force to overwrite.`)
            
            // TEST: Should copy file
            fileSystem.copyFile(sourcePath, targetPath)
    
    return true
```

## File System Utilities

```
// Check if directory exists
function directoryExists(dirPath):
    // TEST: Should return true if directory exists
    try:
        stats = fs.statSync(dirPath)
        return stats.isDirectory()
    catch error:
        return false

// Check if file exists
function fileExists(filePath):
    // TEST: Should return true if file exists
    try:
        stats = fs.statSync(filePath)
        return stats.isFile()
    catch error:
        return false

// Check if directory is writable
function isDirectoryWritable(dirPath):
    // TEST: Should check write permissions
    try:
        testFile = path.join(dirPath, ".write-test-" + Date.now())
        fs.writeFileSync(testFile, "test")
        fs.unlinkSync(testFile)
        return true
    catch error:
        return false

// Create directory (and parent directories if needed)
function createDirectory(dirPath):
    // TEST: Should create directory and parent directories
    try:
        fs.mkdirSync(dirPath, { recursive: true })
        return true
    catch error:
        throw new Error(`Failed to create directory: ${dirPath}. ${error.message}`)

// Read file
function readFile(filePath):
    // TEST: Should read file content
    try:
        return fs.readFileSync(filePath, "utf8")
    catch error:
        throw new Error(`Failed to read file: ${filePath}. ${error.message}`)

// Write file
function writeFile(filePath, content):
    // TEST: Should write content to file
    try:
        fs.writeFileSync(filePath, content, "utf8")
        return true
    catch error:
        throw new Error(`Failed to write file: ${filePath}. ${error.message}`)

// Copy file
function copyFile(sourcePath, targetPath):
    // TEST: Should copy file from source to target
    try:
        fs.copyFileSync(sourcePath, targetPath)
        return true
    catch error:
        throw new Error(`Failed to copy file from ${sourcePath} to ${targetPath}. ${error.message}`)

// List files in directory
function listFiles(dirPath):
    // TEST: Should return array of file names
    try:
        return fs.readdirSync(dirPath)
    catch error:
        throw new Error(`Failed to list files in directory: ${dirPath}. ${error.message}`)

// Check if path is a directory
function isDirectory(path):
    // TEST: Should return true if path is a directory
    try:
        stats = fs.statSync(path)
        return stats.isDirectory()
    catch error:
        return false
```

## Backup and Rollback

```
// Create backup of existing files
function createBackup(targetDir):
    // TEST: Should create backup directory
    backupDir = path.join(targetDir, ".roo-backup-" + Date.now())
    
    // TEST: Should check if .roomodes file exists and back it up
    roomodesPath = path.join(targetDir, ".roomodes")
    if fileSystem.fileExists(roomodesPath):
        fileSystem.createDirectory(backupDir)
        fileSystem.copyFile(roomodesPath, path.join(backupDir, ".roomodes"))
    
    // TEST: Should check if .roo directory exists and back it up
    rooDir = path.join(targetDir, ".roo")
    if fileSystem.directoryExists(rooDir):
        fileSystem.createDirectory(backupDir)
        copyDirectory(rooDir, path.join(backupDir, ".roo"), true)
    
    // TEST: Should return backup directory path if backup was created
    if fileSystem.directoryExists(backupDir):
        return backupDir
    
    return null

// Rollback changes from backup
function rollbackFromBackup(backupDir, targetDir):
    // TEST: Should check if backup directory exists
    if !fileSystem.directoryExists(backupDir):
        throw new Error(`Backup directory does not exist: ${backupDir}`)
    
    // TEST: Should restore .roomodes file if it exists in backup
    backupRoomodesPath = path.join(backupDir, ".roomodes")
    targetRoomodesPath = path.join(targetDir, ".roomodes")
    
    if fileSystem.fileExists(backupRoomodesPath):
        // TEST: Should delete target .roomodes file if it exists
        if fileSystem.fileExists(targetRoomodesPath):
            fs.unlinkSync(targetRoomodesPath)
        
        // TEST: Should copy backup .roomodes file to target
        fileSystem.copyFile(backupRoomodesPath, targetRoomodesPath)
    
    // TEST: Should restore .roo directory if it exists in backup
    backupRooDir = path.join(backupDir, ".roo")
    targetRooDir = path.join(targetDir, ".roo")
    
    if fileSystem.directoryExists(backupRooDir):
        // TEST: Should delete target .roo directory if it exists
        if fileSystem.directoryExists(targetRooDir):
            fs.rmSync(targetRooDir, { recursive: true, force: true })
        
        // TEST: Should copy backup .roo directory to target
        copyDirectory(backupRooDir, targetRooDir, true)
    
    // TEST: Should log success message
    console.log(`Rolled back changes from backup: ${backupDir}`)
    
    return true