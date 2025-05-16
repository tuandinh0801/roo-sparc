import { describe, expect, vi } from 'vitest';
import { runCli } from '../setup/cliTestRunner.js';
import { test as itWithTmpDir } from '../fixtures/tmpdir-fixture.js';
import fs from 'fs-extra';
import path from 'path';
import { UserDefinitions } from '../../src/types/domain.js';

vi.mock('../../src/utils/uiManager.js', async(importOriginal) => {
  const originalModules = await importOriginal() as any;
  return {
    ...originalModules,
    uiManager: {
      ...originalModules.uiManager,
      printBanner: vi.fn(),
    },
  };
});

describe('E2E: roo-init manage list commands', () => {
  let userDefinitionsPath: string; // Will be set within each test using tmpDir

  const systemModes = [
    { slug: 'code', name: 'Auto-Coder', description: 'Implement, refactor, and self-test modular code based on specs and prompts.' },
    { slug: 'architect', name: 'Architect', description: 'Seasoned technical leader focused on deep exploration and optimal planning.' },
  ];
  const systemCategories = [
    { slug: 'core-ai', name: 'Core AI', description: 'Core AI functionalities.' },
    { slug: 'development', name: 'Development', description: 'Development process and workflows.' },
  ];

  const writeUserDefinitionsToFile = async(filePath: string, data: UserDefinitions) => {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, data, { spaces: 2 });
  };

  const expectTableOutput = (output: string, headers: string[], expectedRows: string[][]) => {
    headers.forEach(header => expect(output).toContain(header));
    expectedRows.forEach(row => {
      // Check that each cell in the row is present in the output line for that row
      // This is a bit more robust than just checking if the cell string is anywhere in the output
      const rowRegex = new RegExp(row.map(cell => escapeRegExp(cell.substring(0, 50))).join('.*'), 'm');
      expect(output).toMatch(rowRegex);
    });
  };

  // Helper to escape regex special characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  describe('roo-init manage list modes', () => {
    itWithTmpDir('No user-definitions.json --source=custom: should show "No custom modes found"', async({ tmpDir }) => {
      process.env.XDG_CONFIG_HOME = tmpDir;
      const { stdout } = await runCli(['manage', 'list', 'modes', '--source=custom'], tmpDir);
      expect(stdout).toContain('No custom modes found.');
      delete process.env.XDG_CONFIG_HOME;
    });

    itWithTmpDir('No user-definitions.json --source=system: should list system modes', async({ tmpDir }) => {
      process.env.XDG_CONFIG_HOME = tmpDir;
      const { stdout } = await runCli(['manage', 'list', 'modes', '--source=system'], tmpDir);
      expectTableOutput(stdout, ['Slug', 'Name', 'Description', 'Source'],
        systemModes.map(m => [m.slug, m.name, m.description, 'system'])
      );
      delete process.env.XDG_CONFIG_HOME;
    });

    itWithTmpDir('No user-definitions.json --source=all: should list system modes', async({ tmpDir }) => {
      process.env.XDG_CONFIG_HOME = tmpDir;
      const { stdout } = await runCli(['manage', 'list', 'modes', '--source=all'], tmpDir);
      expectTableOutput(stdout, ['Slug', 'Name', 'Description', 'Source'],
        systemModes.map(m => [m.slug, m.name, m.description, 'system'])
      );
      delete process.env.XDG_CONFIG_HOME;
    });

    itWithTmpDir('Empty customModes --source=custom: should show "No custom modes found"', async({ tmpDir }) => {
      process.env.XDG_CONFIG_HOME = tmpDir;
      userDefinitionsPath = path.join(tmpDir, 'roo-init', 'user-definitions.json');
      await writeUserDefinitionsToFile(userDefinitionsPath, { customModes: [], customCategories: [] });
      const { stdout } = await runCli(['manage', 'list', 'modes', '--source=custom'], tmpDir);
      expect(stdout).toContain('No custom modes found.');
      delete process.env.XDG_CONFIG_HOME;
    });

    itWithTmpDir('Unique custom modes --source=custom: should list custom modes', async({ tmpDir }) => {
      process.env.XDG_CONFIG_HOME = tmpDir;
      userDefinitionsPath = path.join(tmpDir, 'roo-init', 'user-definitions.json');
      const custom = [{ slug: 'my-mode', name: 'My Mode', description: 'My Desc', categorySlugs: [], associatedRuleFiles: [] }];
      await writeUserDefinitionsToFile(userDefinitionsPath, { customModes: custom, customCategories: [] });
      const { stdout } = await runCli(['manage', 'list', 'modes', '--source=custom'], tmpDir);
      expectTableOutput(stdout, ['Slug', 'Name', 'Description', 'Source'],
        custom.map(m => [m.slug, m.name, m.description, 'custom'])
      );
      delete process.env.XDG_CONFIG_HOME;
    });

    itWithTmpDir('Unique custom modes --source=all: should list system and custom modes', async({ tmpDir }) => {
      process.env.XDG_CONFIG_HOME = tmpDir;
      userDefinitionsPath = path.join(tmpDir, 'roo-init', 'user-definitions.json');
      const custom = [{ slug: 'my-mode', name: 'My Mode', description: 'My Desc', categorySlugs: [], associatedRuleFiles: [] }];
      await writeUserDefinitionsToFile(userDefinitionsPath, { customModes: custom, customCategories: [] });
      const { stdout } = await runCli(['manage', 'list', 'modes', '--source=all'], tmpDir);
      const expectedSystemRows = systemModes.map(m => [m.slug, m.name, m.description, 'system']);
      const expectedCustomRows = custom.map(m => [m.slug, m.name, m.description, 'custom']);

      expectTableOutput(stdout, ['Slug', 'Name', 'Description', 'Source'], [...expectedSystemRows, ...expectedCustomRows]);
      delete process.env.XDG_CONFIG_HOME;
    });

    itWithTmpDir('Overriding custom modes --source=all: should list merged modes with correct source tags', async({ tmpDir }) => {
      process.env.XDG_CONFIG_HOME = tmpDir;
      userDefinitionsPath = path.join(tmpDir, 'roo-init', 'user-definitions.json');
      const customOverride = [{ slug: 'code', name: 'My Coder', description: 'Override', categorySlugs: [], associatedRuleFiles: [] }];
      await writeUserDefinitionsToFile(userDefinitionsPath, { customModes: customOverride, customCategories: [] });
      const { stdout } = await runCli(['manage', 'list', 'modes', '--source=all'], tmpDir);

      expect(stdout).toContain('My Coder');
      expect(stdout).toContain('custom (overrides system)');
      expect(stdout).not.toContain('Auto-Coder');

      const architectMode = systemModes.find(m => m.slug === 'architect');
      expect(stdout).toContain(architectMode!.name);
      expect(stdout).toContain(architectMode!.slug);
      expect(stdout).toMatch(/architect.*system/);
      delete process.env.XDG_CONFIG_HOME;
    });
  });

  describe('roo-init manage list categories', () => {
    itWithTmpDir('No user-definitions.json --source=custom: should show "No custom categories found"', async({ tmpDir }) => {
      process.env.XDG_CONFIG_HOME = tmpDir;
      const { stdout } = await runCli(['manage', 'list', 'categories', '--source=custom'], tmpDir);
      expect(stdout).toContain('No custom categories found.');
      delete process.env.XDG_CONFIG_HOME;
    });

    itWithTmpDir('No user-definitions.json --source=system: should list system categories', async({ tmpDir }) => {
      process.env.XDG_CONFIG_HOME = tmpDir;
      const { stdout } = await runCli(['manage', 'list', 'categories', '--source=system'], tmpDir);
      expectTableOutput(stdout, ['Slug', 'Name', 'Description', 'Source'],
        systemCategories.map(c => [c.slug, c.name, c.description, 'system'])
      );
      delete process.env.XDG_CONFIG_HOME;
    });

    itWithTmpDir('Unique custom categories --source=all: should list system and custom categories', async({ tmpDir }) => {
      process.env.XDG_CONFIG_HOME = tmpDir;
      userDefinitionsPath = path.join(tmpDir, 'roo-init', 'user-definitions.json');
      const custom = [{ slug: 'my-cat', name: 'My Cat', description: 'My Cat Desc' }];
      await writeUserDefinitionsToFile(userDefinitionsPath, { customModes: [], customCategories: custom });
      const { stdout } = await runCli(['manage', 'list', 'categories', '--source=all'], tmpDir);
      const expectedSystemRows = systemCategories.map(c => [c.slug, c.name, c.description, 'system']);
      const expectedCustomRows = custom.map(c => [c.slug, c.name, c.description, 'custom']);
      expectTableOutput(stdout, ['Slug', 'Name', 'Description', 'Source'], [...expectedSystemRows, ...expectedCustomRows]);
      delete process.env.XDG_CONFIG_HOME;
    });

    itWithTmpDir('Overriding custom categories --source=all: should list merged categories with correct source tags', async({ tmpDir }) => {
      process.env.XDG_CONFIG_HOME = tmpDir;
      userDefinitionsPath = path.join(tmpDir, 'roo-init', 'user-definitions.json');
      const customOverride = [{ slug: 'core-ai', name: 'My Core AI', description: 'Override Cat' }];
      await writeUserDefinitionsToFile(userDefinitionsPath, { customModes: [], customCategories: customOverride });
      const { stdout } = await runCli(['manage', 'list', 'categories', '--source=all'], tmpDir);

      expect(stdout).toContain('My Core AI');
      expect(stdout).toContain('custom (overrides system)');
      expect(stdout).not.toContain('Core AI');

      const devCategory = systemCategories.find(c => c.slug === 'development');
      expect(stdout).toContain(devCategory!.name);
      expect(stdout).toContain(devCategory!.slug);
      expect(stdout).toMatch(/development.*system/);
      delete process.env.XDG_CONFIG_HOME;
    });
  });
});