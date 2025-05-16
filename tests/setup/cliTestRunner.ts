import { execa } from 'execa';
import path from 'path';

// Define the SCRIPT_PATH relative to this file's new location
// The cliTestRunner.ts is in tests/utils/, so dist/src/cli.js is ../../dist/src/cli.js
const SCRIPT_PATH = path.resolve(__dirname, '../../dist/src/cli.js');

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export const runCli = async(args: string[], cwd: string): Promise<CliResult> => {
  try {
    const result = await execa('node', [SCRIPT_PATH, ...args], {
      cwd: cwd,
      env: { ...process.env, NODE_ENV: 'test' },
      reject: false, // Don't throw on non-zero exit codes, inspect result instead
    });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode ?? 1, // Default to 1 if undefined
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
