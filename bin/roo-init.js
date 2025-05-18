#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Attempt to run from 'dist' (compiled)
const distPath = path.resolve(__dirname, '../dist/src/cli.js');

async function start() {
  if (!fs.existsSync(distPath)) {
    console.error('Failed to start the application.');
    console.error(`Entry point not found: ${distPath}`);
    console.error('Please ensure the project is built (output in dist/).');
    process.exit(1);
  }

  try {
    // Import the CLI module
    const { default: cli } = await import(`file://${distPath}`);
    
    // Ensure the CLI is properly initialized
    if (typeof cli === 'function') {
      await cli();
    }
    await import(distPath);
  } catch (err) {
    console.error('Failed to start the application from dist.');
    console.error(err);
    process.exit(1);
  }
}

start();