// tests/fixtures/tmpdir-fixture.ts
import { test as baseTest } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

interface TmpDirContext {
  tmpDir: string;
}

export const test = baseTest.extend<TmpDirContext>({
  tmpDir: async({}, use) => { // eslint-disable-line no-empty-pattern -- Vitest fixture syntax
    const baseTmpPath = path.join(os.tmpdir(), 'roo-init-e2e-');
    const createdTmpDir = await fs.mkdtemp(baseTmpPath);
    await use(createdTmpDir);
    try {
      await fs.rm(createdTmpDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error(`Failed to clean up temporary directory: ${createdTmpDir}`, cleanupError);
    }
  },
});

export { expect } from 'vitest';