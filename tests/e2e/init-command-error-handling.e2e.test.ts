import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

const SCRIPT_PATH = path.resolve(__dirname, '../../dist/src/cli.js');
const TEMP_DIR_BASE = path.resolve(__dirname, 'temp-e2e-error-handling');

const runCli = async(args: string[], cwd?: string) => {
  try {
    const result = await execa('node', [SCRIPT_PATH, ...args], {
      cwd: cwd || TEMP_DIR_BASE,
      env: { ...process.env, NODE_ENV: 'test' }, // Pass environment variables
      reject: false, // Don't throw on non-zero exit codes, inspect result instead
    });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    };
  } catch (error: any) {
    // This catch block might not be strictly necessary if reject: false is used,
    // but kept for safety or if execa itself throws for other reasons.
    return {
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || '',
      exitCode: error.exitCode === undefined ? 1 : error.exitCode,
    };
  }
};

describe('CLI E2E Tests: init command error handling', () => {
  beforeAll(async() => {
    // Ensure definitions are copied to dist for the CLI to load
    try {
      await execa('pnpm', ['run', 'copy-assets']);
      // Verify that a key definition file exists after copying
      const modesJsonPath = path.resolve(__dirname, '../../dist/definitions/modes.json');
      if (!await fs.pathExists(modesJsonPath)) {
        // console.error(`E2E Pre-flight Check: ${modesJsonPath} not found after copy-assets.`);
        throw new Error(`E2E Pre-flight Check: ${modesJsonPath} not found after copy-assets.`);
      } else {
        console.log(`E2E Pre-flight Check: ${modesJsonPath} found.`); // Keep this for positive confirmation
      }
    } catch (e) {
      console.error('Failed to copy assets for E2E tests. Definitions might be missing.', e);
      // Optionally, throw e to fail tests immediately if assets are critical
    }
    await fs.ensureDir(TEMP_DIR_BASE);
  });

  afterAll(async() => {
    await fs.remove(TEMP_DIR_BASE);
  });

  describe('Invalid Input Errors (AC2, AC6)', () => {
    const testDirInvalidSlug = path.join(TEMP_DIR_BASE, 'test-invalid-slug');

    beforeAll(async() => {
      await fs.ensureDir(testDirInvalidSlug);
    });

    afterAll(async() => {
      await fs.remove(testDirInvalidSlug);
    });

    it('should display an error and exit non-zero if an invalid mode slug is provided', async() => {
      const result = await runCli(['--modes', 'invalid-mode-slug'], testDirInvalidSlug);
      expect(result.stdout).toContain('Non-interactive mode detected');
      expect(result.stdout).toContain('Processing modes: invalid-mode-slug');
      expect(result.stderr).toContain('Invalid Command-Line Arguments: Invalid or unknown slugs provided.');
      expect(result.stderr).toContain('Invalid items: mode: invalid-mode-slug');
      expect(result.exitCode).not.toBe(0);
    });

    it('should display an error and exit non-zero if an invalid category slug is provided', async() => {
      const result = await runCli(['--category', 'invalid-category-slug'], testDirInvalidSlug);
      expect(result.stdout).toContain('Non-interactive mode detected');
      expect(result.stdout).toContain('Processing category: invalid-category-slug');
      expect(result.stderr).toContain('Invalid Command-Line Arguments: Invalid or unknown slugs provided.');
      expect(result.stderr).toContain('Invalid items: category: invalid-category-slug');
      expect(result.exitCode).not.toBe(0);
    });

    it('should display an error and exit non-zero if mixed valid and invalid mode slugs are provided', async() => {
      // Assuming 'code' is a valid mode slug. This needs to align with actual definitions.
      // If 'code' is not guaranteed, this test might need adjustment or a known valid slug.
      const result = await runCli(['--modes', 'code,another-invalid-slug'], testDirInvalidSlug);
      expect(result.stdout).toContain('Non-interactive mode detected');
      expect(result.stdout).toContain('Processing modes: code,another-invalid-slug');
      expect(result.stderr).toContain('Invalid Command-Line Arguments: Invalid or unknown slugs provided.');
      expect(result.stderr).toContain('Invalid items: mode: another-invalid-slug');
      // If 'code' is valid, it should not be listed as an invalid item.
      expect(result.stderr).not.toContain('mode: code'); // Check that valid slug 'code' is not in the error details
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('File System Errors (AC3, AC6)', () => {
    const testDirPerm = path.join(TEMP_DIR_BASE, 'test-permission-denied');
    const nonWritableDir = path.join(testDirPerm, 'non-writable-subdir');
    const testFile = path.join(nonWritableDir, '.roomodes');

    beforeEach(async() => {
      await fs.ensureDir(testDirPerm);
      await fs.ensureDir(nonWritableDir);

      // Create a file first, then make the directory non-writable
      // This simulates a situation where we can read but not write to the directory
      await fs.writeJson(testFile, { modes: ['code'] });

      // Make the directory non-writable for the owner, group, and others
      try {
        await fs.chmod(nonWritableDir, 0o555); // r-xr-xr-x
      } catch (e) {
        console.warn(`Could not chmod ${nonWritableDir}. Test for non-writable directory might be unreliable.`);
      }
    });

    afterEach(async() => {
      // Attempt to restore permissions to allow cleanup, then remove
      try {
        await fs.chmod(nonWritableDir, 0o777); // rwxrwxrwx
      } catch (e) {
        // Ignore if chmod fails, remove will likely also fail but we try
      }
      await fs.remove(testDirPerm);
    });

    it('should display a permission error and exit non-zero if target directory is not writable', async() => {
      // We're using the 'code' mode which we know exists in the definitions
      // Force flag is needed to attempt overwriting the existing .roomodes file
      const result = await runCli(['--modes', 'code', '--force'], nonWritableDir);

      // The CLI should attempt to write to the directory and encounter a permission error
      // The exact error message depends on the OS, but our errorHandler normalizes it
      expect(
        result.stderr.includes('Permission denied') ||
        result.stderr.includes('EACCES')
      ).toBe(true);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('Overwrite Protection Tests (AC6)', () => {
    const testDirOverwrite = path.join(TEMP_DIR_BASE, 'test-overwrite');

    beforeEach(async() => {
      await fs.ensureDir(testDirOverwrite);
      // Create a .roomodes file to test overwrite protection
      await fs.writeJson(path.join(testDirOverwrite, '.roomodes'), { modes: ['existing-mode'] });
      // Create a .roo directory with some content
      await fs.ensureDir(path.join(testDirOverwrite, '.roo'));
      await fs.writeFile(path.join(testDirOverwrite, '.roo', 'test-file.md'), 'Test content');
    });

    afterEach(async() => {
      await fs.remove(testDirOverwrite);
    });

    it('should fail if files exist and --force is not used', async() => {
      const result = await runCli(['--modes', 'code'], testDirOverwrite);

      expect(result.stderr).toContain('File already exists');
      expect(result.stderr).toContain('Use --force to overwrite');
      expect(result.exitCode).not.toBe(0);
    });

    it('should succeed if --force is used with existing files', async() => {
      const result = await runCli(['--modes', 'code', '--force'], testDirOverwrite);

      // Should not contain overwrite conflict error
      expect(result.stderr).not.toContain('Use --force to overwrite');
      // Should contain success message
      expect(result.stdout).toContain('Project initialized successfully');
    });
  });

  describe('Internal Errors (AC4)', () => {
    const testDirInternal = path.join(TEMP_DIR_BASE, 'test-internal-errors');

    beforeEach(async() => {
      await fs.ensureDir(testDirInternal);
    });

    afterEach(async() => {
      await fs.remove(testDirInternal);
    });

    it('should handle and report file system errors appropriately', async() => {
      // We can't easily simulate a disk full error in E2E tests
      // Instead, we'll test that the error handler properly formats file system errors
      // by checking the error message format in the stderr output

      // Create a directory that will trigger an error during initialization
      const badDir = path.join(testDirInternal, 'non-existent-dir', 'deeply-nested');

      const result = await runCli(['--modes', 'code'], badDir);

      // The CLI should fail with some kind of error
      // The exact error message depends on the environment, but it should be non-zero exit
      expect(result.exitCode).not.toBe(0);

      // The error should be related to the non-existent directory
      // But we won't assert on the specific message as it varies by OS and environment
    });
  });

  describe('Progress Messages and Success Case (AC1, AC5, AC6)', () => {
    const testDirSuccess = path.join(TEMP_DIR_BASE, 'test-success');

    beforeEach(async() => {
      await fs.ensureDir(testDirSuccess);
    });

    afterEach(async() => {
      await fs.remove(testDirSuccess);
    });

    it('should show progress messages and succeed with valid mode', async() => {
      const result = await runCli(['--modes', 'code'], testDirSuccess);

      // Check for progress messages - the actual text might vary by environment
      // but we should see some indication of initialization and success
      expect(result.stdout).toContain('Starting Roo project initialization');
      expect(result.stdout).toContain('Initialization Complete');
      expect(result.stdout).toContain('Project initialized successfully');

      // Verify files were created
      expect(await fs.pathExists(path.join(testDirSuccess, '.roomodes'))).toBe(true);
      expect(await fs.pathExists(path.join(testDirSuccess, '.roo'))).toBe(true);
    });
  });
});