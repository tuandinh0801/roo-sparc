import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest';
import fs from 'fs-extra';
import path from 'path';

// Unmock UIManager to use actual implementation
vi.unmock('../../src/utils/uiManager.js');

import { FileManager } from '../../src/core/FileManager.js';
import { UIManager } from '../../src/utils/uiManager.js';
import { OverwriteConflictError, FileSystemError } from '../../src/utils/errorHandler.js';
import { mockHandleError } from '../setup/globalUtilityMocks.js';


vi.mock('fs-extra');
// errorHandler.ts is globally mocked to use mockHandleError via globalUtilityMocks.ts

describe('FileManager', () => {
  let fileManager: FileManager;
  let testUiManager: UIManager;
  let spyStartSpinner: MockInstance;
  let spySucceedSpinner: MockInstance;
  let spyFailSpinner: MockInstance;
  let spyPrintSuccess: MockInstance;
  let spyPrintWarning: MockInstance;
  let spyPrintInfo: MockInstance;
  let spyUpdateSpinnerText: MockInstance;


  const projectRoot = '/fake/project/root';

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a real UIManager instance for testing FileManager
    testUiManager = new UIManager(); // Uses real chalk due to unmocking

    // Spy on the methods of this specific instance
    spyStartSpinner = vi.spyOn(testUiManager, 'startSpinner');
    spySucceedSpinner = vi.spyOn(testUiManager, 'succeedSpinner');
    spyFailSpinner = vi.spyOn(testUiManager, 'failSpinner');
    spyPrintSuccess = vi.spyOn(testUiManager, 'printSuccess');
    spyPrintWarning = vi.spyOn(testUiManager, 'printWarning');
    spyPrintInfo = vi.spyOn(testUiManager, 'printInfo');
    spyUpdateSpinnerText = vi.spyOn(testUiManager, 'updateSpinnerText');


    // Inject this instance into FileManager
    fileManager = new FileManager(testUiManager);

    // Reset global mock for handleError (which FileManager uses directly)
    mockHandleError.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDirectoryIfNotExists', () => {
    const testDirPath = path.join(projectRoot, 'test-dir');

    it('should call fs.ensureDir for the specified path', async() => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      await fileManager.createDirectoryIfNotExists(testDirPath);
      expect(fs.ensureDir).toHaveBeenCalledWith(testDirPath);
      expect(spyStartSpinner).toHaveBeenCalledWith(expect.stringContaining('Ensuring directory exists'));
      expect(spySucceedSpinner).toHaveBeenCalledWith(expect.stringContaining('Directory ensured'));
      expect(spyFailSpinner).not.toHaveBeenCalled();
      expect(mockHandleError).not.toHaveBeenCalled();
    });

    it('should handle errors during directory creation and call handleError', async() => {
      const error = new Error('FS EnsureDir Error');
      vi.mocked(fs.ensureDir).mockRejectedValue(error);
      await expect(fileManager.createDirectoryIfNotExists(testDirPath)).rejects.toThrow(error);
      expect(fs.ensureDir).toHaveBeenCalledWith(testDirPath);
      expect(spyStartSpinner).toHaveBeenCalledWith(expect.stringContaining('Ensuring directory exists'));
      expect(spyFailSpinner).toHaveBeenCalledWith(expect.stringContaining('Failed to ensure directory'));
      expect(spySucceedSpinner).not.toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(error, expect.objectContaining({ context: 'ensuring directory' }));
    });
  });

  describe('copyFile', () => {
    const sourceFilePath = path.join(projectRoot, 'source', 'rule.md');
    const destinationFilePath = path.join(projectRoot, 'dest', 'rule.md');
    const destinationDir = path.dirname(destinationFilePath);

    it('should copy a file if destination does not exist', async() => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.copy).mockResolvedValue(undefined);
      await fileManager.copyFile(sourceFilePath, destinationFilePath, false);
      expect(fs.pathExists).toHaveBeenCalledWith(destinationFilePath);
      expect(fs.ensureDir).toHaveBeenCalledWith(destinationDir);
      expect(fs.copy).toHaveBeenCalledWith(sourceFilePath, destinationFilePath, { overwrite: false });
      expect(spySucceedSpinner).toHaveBeenCalledWith(expect.stringContaining('File successfully copied'));
      expect(spyPrintSuccess).toHaveBeenCalled();
      expect(mockHandleError).not.toHaveBeenCalled();
    });

    it('should not copy a file if destination exists and force is false', async() => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      await expect(
        fileManager.copyFile(sourceFilePath, destinationFilePath, false),
      ).rejects.toThrow(OverwriteConflictError); // Expecting OverwriteConflictError
      expect(fs.pathExists).toHaveBeenCalledWith(destinationFilePath);
      expect(fs.ensureDir).not.toHaveBeenCalled();
      expect(fs.copy).not.toHaveBeenCalled();
      expect(spyFailSpinner).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(OverwriteConflictError),
        expect.objectContaining({ exit: false }),
      );
    });

    it('should copy a file if destination exists and force is true', async() => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.copy).mockResolvedValue(undefined);
      await fileManager.copyFile(sourceFilePath, destinationFilePath, true);
      expect(fs.pathExists).toHaveBeenCalledWith(destinationFilePath);
      expect(fs.ensureDir).toHaveBeenCalledWith(destinationDir);
      expect(fs.copy).toHaveBeenCalledWith(sourceFilePath, destinationFilePath, { overwrite: true });
      expect(spySucceedSpinner).toHaveBeenCalledWith(expect.stringContaining('File successfully copied'));
      expect(mockHandleError).not.toHaveBeenCalled();
    });

    it('should handle errors during destination existence check', async() => {
      const error = new Error('FS Check Error');
      vi.mocked(fs.pathExists).mockRejectedValue(error);
      await expect(
        fileManager.copyFile(sourceFilePath, destinationFilePath, false),
      ).rejects.toThrow(FileSystemError); // Expecting FileSystemError (wrapped)
      expect(fs.pathExists).toHaveBeenCalledWith(destinationFilePath);
      expect(spyFailSpinner).toHaveBeenCalledWith(expect.stringContaining('Failed to copy file'));
      expect(mockHandleError).toHaveBeenCalledWith(expect.any(FileSystemError), expect.objectContaining({ context: 'copying file' }));
    });

    it('should handle errors during destination directory creation', async() => {
      const error = new Error('FS EnsureDir Error');
      vi.mocked(fs.pathExists).mockResolvedValue(false as never);
      vi.mocked(fs.ensureDir).mockRejectedValue(error);
      await expect(
        fileManager.copyFile(sourceFilePath, destinationFilePath, false),
      ).rejects.toThrow(FileSystemError); // Expecting FileSystemError (wrapped)
      expect(spyFailSpinner).toHaveBeenCalledWith(expect.stringContaining('Failed to copy file'));
      expect(mockHandleError).toHaveBeenCalledWith(expect.any(FileSystemError), expect.objectContaining({ context: 'copying file' }));
    });

    it('should handle errors during file copy', async() => {
      const error = new Error('FS Copy Error');
      vi.mocked(fs.pathExists).mockResolvedValue(false as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.copy).mockRejectedValue(error);
      await expect(
        fileManager.copyFile(sourceFilePath, destinationFilePath, false),
      ).rejects.toThrow(FileSystemError); // Expecting FileSystemError (wrapped)
      expect(spyFailSpinner).toHaveBeenCalledWith(expect.stringContaining('Failed to copy file'));
      expect(mockHandleError).toHaveBeenCalledWith(expect.any(FileSystemError), expect.objectContaining({ context: 'copying file' }));
    });

    it('should handle errors during forced file copy', async() => {
      const error = new Error('FS Force Copy Error');
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.copy).mockRejectedValue(error);
      await expect(
        fileManager.copyFile(sourceFilePath, destinationFilePath, true),
      ).rejects.toThrow(FileSystemError); // Expecting FileSystemError (wrapped)
      expect(spyFailSpinner).toHaveBeenCalledWith(expect.stringContaining('Failed to copy file'));
      expect(mockHandleError).toHaveBeenCalledWith(expect.any(FileSystemError), expect.objectContaining({ context: 'copying file' }));
    });
  });

  describe('ensureRuleSpecificDirectories', () => {
    const mode = 'test-mode';
    const expectedBaseRooPath = path.join(projectRoot, '.roo');
    const expectedRulesPath = path.join(expectedBaseRooPath, 'rules');
    const expectedModePath = path.join(expectedRulesPath, mode);

    it('should ensure .roo, .roo/rules, and .roo/rules/<mode> directories are created', async() => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      await fileManager.ensureRuleSpecificDirectories(projectRoot, mode);
      expect(fs.ensureDir).toHaveBeenCalledWith(expectedBaseRooPath);
      expect(fs.ensureDir).toHaveBeenCalledWith(expectedRulesPath);
      expect(fs.ensureDir).toHaveBeenCalledWith(expectedModePath);
      expect(spySucceedSpinner).toHaveBeenCalledWith(expect.stringContaining('Rule directory structure ensured'));
    });

    it('should call handleError if any directory creation fails', async() => {
      const error = new Error('Dir creation failed');
      vi.mocked(fs.ensureDir).mockRejectedValueOnce(error);
      const expectedContext = `ensuring rule directory structure for mode '${mode}'`;
      await expect(fileManager.ensureRuleSpecificDirectories(projectRoot, mode)).rejects.toThrow(error);
      // Check the context passed to handleError, it should match the one from ensureRuleSpecificDirectories
      expect(mockHandleError).toHaveBeenCalledWith(error, expect.objectContaining({ context: expect.stringContaining(expectedContext) }));
    });
  });

  describe('copyRuleFilesForMode', () => {
    const mode = 'example-mode';
    const ruleFiles = ['rule1.md', 'rule2.txt'];
    const definitionsBasePath = path.join(projectRoot, 'definitions', 'rules'); // Adjusted to match source
    const targetModePath = path.join(projectRoot, '.roo', 'rules', mode);

    beforeEach(() => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      // Mock the internal call to ensureRuleSpecificDirectories to prevent its own spinner logic from interfering
      // or ensure its spies are different if it also uses testUiManager
      vi.spyOn(fileManager, 'ensureRuleSpecificDirectories').mockResolvedValue(undefined);
    });

    it('should copy specified rule files to the target mode directory', async() => {
      const sourceRule1Path = path.join(definitionsBasePath, mode, ruleFiles[0]);
      const targetRule1Path = path.join(targetModePath, ruleFiles[0]);
      const sourceRule2Path = path.join(definitionsBasePath, mode, ruleFiles[1]);
      const targetRule2Path = path.join(targetModePath, ruleFiles[1]);

      vi.mocked(fs.pathExists).mockResolvedValue(false as never);
      vi.mocked(fs.copy).mockResolvedValue(undefined);

      // Spy on copyFile for this specific test to check its calls
      const copyFileSpy = vi.spyOn(fileManager, 'copyFile').mockResolvedValue(undefined);

      await fileManager.copyRuleFilesForMode(projectRoot, mode, ruleFiles, false);

      expect(fileManager.ensureRuleSpecificDirectories).toHaveBeenCalledWith(projectRoot, mode);
      expect(copyFileSpy).toHaveBeenCalledWith(sourceRule1Path, targetRule1Path, false);
      expect(copyFileSpy).toHaveBeenCalledWith(sourceRule2Path, targetRule2Path, false);
      expect(spySucceedSpinner).toHaveBeenCalledWith(expect.stringContaining('Rule file copying complete. Copied: 2, Skipped: 0.'));
      copyFileSpy.mockRestore();
    });

    it('should respect the force flag when copying files', async() => {
      const sourceRule1Path = path.join(definitionsBasePath, mode, ruleFiles[0]);
      const targetRule1Path = path.join(targetModePath, ruleFiles[0]);
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(fs.copy).mockResolvedValue(undefined);
      const copyFileSpy = vi.spyOn(fileManager, 'copyFile').mockResolvedValue(undefined);


      await fileManager.copyRuleFilesForMode(projectRoot, mode, [ruleFiles[0]], true);
      expect(copyFileSpy).toHaveBeenCalledWith(sourceRule1Path, targetRule1Path, true);
      copyFileSpy.mockRestore();
    });

    it('should not copy if file exists and force is false, and call UIManager.printWarning', async() => {
      const sourceRule1Path = path.join(definitionsBasePath, mode, ruleFiles[0]);
      const targetRule1Path = path.join(targetModePath, ruleFiles[0]);

      // Make copyFile throw OverwriteConflictError when called for this specific file
      const copyFileSpy = vi.spyOn(fileManager, 'copyFile').mockImplementation(async(source, dest, force) => {
        if (dest === targetRule1Path && !force) {
          throw new OverwriteConflictError('File already exists', dest);
        }
      });

      await fileManager.copyRuleFilesForMode(projectRoot, mode, [ruleFiles[0]], false);

      expect(copyFileSpy).toHaveBeenCalledWith(sourceRule1Path, targetRule1Path, false);
      // The printWarning is now inside copyFile, which handleError then calls.
      // handleError will be called with OverwriteConflictError
      expect(mockHandleError).toHaveBeenCalledWith(expect.any(OverwriteConflictError), expect.anything());
      // Check that the overall operation still "succeeds" from copyRuleFilesForMode's perspective
      expect(spySucceedSpinner).toHaveBeenCalledWith(expect.stringContaining('Rule file copying complete. Copied: 0, Skipped: 1.'));
      copyFileSpy.mockRestore();
    });


    it('should call handleError if fs.copy fails for a rule file (via copyFile)', async() => {
      const error = new Error('Copy failed');
      const sourceRule1Path = path.join(definitionsBasePath, mode, ruleFiles[0]);
      // Make copyFile reject for this specific file
      const copyFileSpy = vi.spyOn(fileManager, 'copyFile').mockImplementation(async(source, dest) => {
        if (source === sourceRule1Path) {
          // Simulate the FileSystemError that would be thrown by the actual copyFile
          throw new FileSystemError('Simulated copy error from copyFile', dest, source);
        }
      });

      await expect(fileManager.copyRuleFilesForMode(projectRoot, mode, [ruleFiles[0]], false)).rejects.toThrow(FileSystemError);

      expect(spyFailSpinner).toHaveBeenCalledWith(expect.stringContaining('Failed to copy rule files'));
      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(FileSystemError), // This will be the FileSystemError from copyFile
        expect.objectContaining({ context: 'copying rule files for mode operation' })
      );
      copyFileSpy.mockRestore();
    });
  });

  describe('writeJson', () => {
    const testFilePath = path.join(projectRoot, 'test-data.json');
    const testFileDir = path.dirname(testFilePath);
    const jsonData = { key: 'value' };

    it('should write JSON to a file if destination does not exist', async() => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      await fileManager.writeJson(testFilePath, jsonData, false);
      expect(fs.pathExists).toHaveBeenCalledWith(testFilePath);
      expect(fs.ensureDir).toHaveBeenCalledWith(testFileDir);
      expect(fs.writeJson).toHaveBeenCalledWith(testFilePath, jsonData, { spaces: 2 });
      expect(spyPrintInfo).toHaveBeenCalledWith(expect.stringContaining('JSON file written:'));
      expect(mockHandleError).not.toHaveBeenCalled();
    });

    it('should not write JSON if destination exists and force is false', async() => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      await expect(
        fileManager.writeJson(testFilePath, jsonData, false),
      ).rejects.toThrow(OverwriteConflictError);
      expect(fs.pathExists).toHaveBeenCalledWith(testFilePath);
      expect(fs.ensureDir).not.toHaveBeenCalled();
      expect(fs.writeJson).not.toHaveBeenCalled();
      expect(spyFailSpinner).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(OverwriteConflictError),
        expect.objectContaining({ context: 'writing JSON file' })
      );
    });

    it('should write JSON if destination exists and force is true', async() => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      await fileManager.writeJson(testFilePath, jsonData, true);
      expect(fs.pathExists).toHaveBeenCalledWith(testFilePath);
      expect(fs.ensureDir).toHaveBeenCalledWith(testFileDir);
      expect(fs.writeJson).toHaveBeenCalledWith(testFilePath, jsonData, { spaces: 2 });
      expect(spyPrintInfo).toHaveBeenCalledWith(expect.stringContaining('JSON file written:'));
      expect(mockHandleError).not.toHaveBeenCalled();
    });

    it('should handle errors during destination existence check for writeJson', async() => {
      const error = new Error('FS Check Error for writeJson');
      vi.mocked(fs.pathExists).mockRejectedValue(error);
      await expect(
        fileManager.writeJson(testFilePath, jsonData, false),
      ).rejects.toThrow(FileSystemError);
      expect(spyFailSpinner).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(expect.any(FileSystemError), expect.objectContaining({ context: 'writing JSON file' }));
    });

    it('should handle errors during destination directory creation for writeJson', async() => {
      const error = new Error('FS EnsureDir Error for writeJson');
      vi.mocked(fs.pathExists).mockResolvedValue(false as never);
      vi.mocked(fs.ensureDir).mockRejectedValue(error);
      await expect(
        fileManager.writeJson(testFilePath, jsonData, false),
      ).rejects.toThrow(FileSystemError);
      expect(spyFailSpinner).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(expect.any(FileSystemError), expect.objectContaining({ context: 'writing JSON file' }));
    });

    it('should handle errors during file write for writeJson', async() => {
      const error = new Error('FS WriteJson Error');
      vi.mocked(fs.pathExists).mockResolvedValue(false as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockRejectedValue(error);
      await expect(
        fileManager.writeJson(testFilePath, jsonData, false),
      ).rejects.toThrow(FileSystemError);
      expect(spyFailSpinner).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(expect.any(FileSystemError), expect.objectContaining({ context: 'writing JSON file' }));
    });

    it('should handle errors during forced file write for writeJson', async() => {
      const error = new Error('FS Force WriteJson Error');
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockRejectedValue(error);
      await expect(
        fileManager.writeJson(testFilePath, jsonData, true),
      ).rejects.toThrow(FileSystemError);
      expect(spyFailSpinner).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(expect.any(FileSystemError), expect.objectContaining({ context: 'writing JSON file' }));
    });
  });
});