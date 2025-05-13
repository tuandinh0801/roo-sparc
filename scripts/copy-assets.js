/* eslint-env node */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'definitions');
const targetDir = path.join(projectRoot, 'dist', 'definitions');

async function copyAssets() {
  try {
    await fs.emptyDir(targetDir); // Clear target directory first
    await fs.copy(sourceDir, targetDir);
    console.log('Assets copied successfully to dist/definitions');
  } catch (err) {
    console.error('Error copying assets:', err);
    process.exit(1);
  }
}

copyAssets();