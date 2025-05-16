// tests/setup/memfs-setup.ts
import { vol, fs } from 'memfs'; // Import memfs's fs as memfsReal
import { vi, beforeEach } from 'vitest'; // Import beforeEach
import nodePath from 'node:path'; // Import the standard path module

// Mock 'node:fs'
vi.mock('node:fs', async() => {
  const memfsModule = await vi.importActual<typeof import('memfs')>('memfs');
  return memfsModule.fs;
});

// Mock 'fs-extra'
vi.mock('fs-extra', async() => {
  const memfsModule = await vi.importActual<typeof import('memfs')>('memfs');
  const actualFsExtra = await vi.importActual<typeof import('fs-extra')>('fs-extra');

  // Start with all exports from memfs.fs
  const mockFsExtra: any = { ...memfsModule.fs };

  // Selectively override or add fs-extra specific methods
  // Ensure keys from actualFsExtra are considered to provide a more complete mock.
  for (const key in actualFsExtra) {
    if (typeof (actualFsExtra as any)[key] === 'function' && !(memfsModule.fs as any)[key]) {
      // If function in actualFsExtra is not in memfs.fs, provide a specific mock or map
      // This is a placeholder; specific implementations are needed for complex fs-extra functions
      // For now, we will ensure basic functions are covered.
    }
  }

  // Specific implementations for commonly used fs-extra methods:
  mockFsExtra.ensureDir = async(path: string) => {
    memfsModule.fs.mkdirSync(path, { recursive: true });
  };
  mockFsExtra.readJson = async(path: string, options?: any) => {
    const content = memfsModule.fs.readFileSync(path, options?.encoding || 'utf8');
    return JSON.parse(content as string);
  };
  mockFsExtra.writeJson = async(path: string, data: any, options?: any) => {
    memfsModule.fs.writeFileSync(path, JSON.stringify(data, null, options?.spaces === undefined ? 2 : options.spaces), options);
  };
  mockFsExtra.pathExists = async(path: string) => { // Changed to async to match fs-extra
    return memfsModule.fs.existsSync(path);
  };
  mockFsExtra.copy = async(src: string, dest: string, options?: import('fs-extra').CopyOptions) => {
    // A more robust copy would handle options like 'overwrite', 'filter', etc.
    // For basic copy, ensure parent directory of dest exists
    const destParent = nodePath.dirname(dest); // Use the standard path module
    if (!memfsModule.fs.existsSync(destParent)) {
      memfsModule.fs.mkdirSync(destParent, { recursive: true });
    }

    const srcExists = memfsModule.fs.existsSync(src);
    if (!srcExists) {
      // Replicate fs-extra's behavior: copy throws if src doesn't exist.
      const err: NodeJS.ErrnoException = new Error(`ENOENT: no such file or directory, open '${src}'`);
      err.code = 'ENOENT';
      err.path = src;
      return Promise.reject(err);
    }

    const destExists = memfsModule.fs.existsSync(dest);
    if (destExists && !options?.overwrite) { // If dest exists and we are NOT overwriting
      const err: NodeJS.ErrnoException = new Error(`EEXIST: file already exists, copyfile '${src}' -> '${dest}'`);
      err.code = 'EEXIST';
      return Promise.reject(err);
    }

    // If we reach here, either dest doesn't exist, or it does and overwrite is true.
    // In both cases, we should write/overwrite.
    // fs-extra's copy preserves file mode by default. Our mock doesn't.
    // For basic functionality, just read/write content.
    // Ensure 'options' passed to read/write are valid for those functions, not fs-extra's copy options.
    const encoding = (options as any)?.encoding || 'utf8';
    const data = memfsModule.fs.readFileSync(src, { encoding });
    memfsModule.fs.writeFileSync(dest, data, { encoding }); // writeFileSync overwrites by default
    return Promise.resolve();
  };
  mockFsExtra.remove = async(pathToRemove: string) => { // Changed to async
    try {
      const stats = memfsModule.fs.lstatSync(pathToRemove);
      if (stats.isDirectory()) {
        memfsModule.fs.rmdirSync(pathToRemove, { recursive: true });
      } else {
        memfsModule.fs.unlinkSync(pathToRemove);
      }
    } catch (e: any) {
      if (e.code !== 'ENOENT') { // Ignore if path doesn't exist, similar to fs-extra's force
        throw e;
      }
    }
  };

  mockFsExtra.mkdtemp = async(prefix: string): Promise<string> => {
    // memfs's mkdtempSync is simpler to adapt for a Promise-based mock
    // It typically creates a directory like /tmp/prefixXXXXXX
    try {
      // Ensure the prefix path exists if it's more than just a basename prefix
      // For example, if prefix is /tmp/somedir/foo-, /tmp/somedir must exist.
      // However, fs.mkdtemp typically handles creating the final directory itself
      // based on the prefix in a temporary location.
      // memfs.fs.mkdtempSync should handle this correctly.
      const dirPath = memfsModule.fs.mkdtempSync(prefix);
      return String(dirPath); // Ensure the path is a string
    } catch (e: any) {
      // Convert synchronous error to a rejected promise
      return Promise.reject(e);
    }
  };

  mockFsExtra.writeFile = async(filePath: string, data: any, options?: any): Promise<void> => {
    try {
      memfsModule.fs.writeFileSync(filePath, data, options);
      return Promise.resolve();
    } catch (e: any) {
      return Promise.reject(e);
    }
  };

  // Important: Return the mocked object as default and as __esModule
  mockFsExtra.readFile = async(filePath: string, options?: any): Promise<string | Buffer> => {
    try {
      const data = memfsModule.fs.readFileSync(filePath, options);
      return Promise.resolve(data);
    } catch (e: any) {
      return Promise.reject(e);
    }
  };

  mockFsExtra.readdir = async(p: string, options?: any): Promise<string[]> => {
    try {
      const files = memfsModule.fs.readdirSync(p, options);
      // Ensure files is string[] as readdirSync can return Buffer[]
      return Promise.resolve(files.map(f => String(f)));
    } catch (e: any) {
      return Promise.reject(e);
    }
  };

  mockFsExtra.stat = async(p: string): Promise<import('fs').Stats> => {
    try {
      const stats = memfsModule.fs.statSync(p);
      return Promise.resolve(stats);
    } catch (e: any) {
      return Promise.reject(e);
    }
  };

  return {
    default: mockFsExtra,
    __esModule: true,
    ...mockFsExtra // Spread members for named imports
  };
});

// Reset the volume before each test to ensure isolation
beforeEach(() => {
  vol.reset();
});