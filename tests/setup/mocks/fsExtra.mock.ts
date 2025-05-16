import { vi } from 'vitest';

// Spy on individual fs-extra methods
export const ensureDirMock = vi.fn(() => Promise.resolve());
export const ensureFileMock = vi.fn(() => Promise.resolve());
export const readFileMock = vi.fn(() => Promise.resolve('mock file content'));
export const writeFileMock = vi.fn(() => Promise.resolve());
export const copyMock = vi.fn(() => Promise.resolve());
export const pathExistsMock = vi.fn(() => Promise.resolve(false));
export const removeMock = vi.fn(() => Promise.resolve());
export const readJsonMock = vi.fn(() => Promise.resolve({ mockKey: 'mockValue' }));
export const writeJsonMock = vi.fn(() => Promise.resolve());
export const emptyDirMock = vi.fn(() => Promise.resolve());
export const readdirMock = vi.fn(() => Promise.resolve([]));
export const statMock = vi.fn(() => Promise.resolve({ isFile: () => true, isDirectory: () => false } as any));

vi.mock('fs-extra', async(importOriginal) => {
  const actual = await importOriginal(); // Get the actual module
  return {
    ...(actual as any), // Spread actual module to allow unmocked functions to pass through
    ensureDir: ensureDirMock,
    ensureFile: ensureFileMock,
    readFile: readFileMock,
    writeFile: writeFileMock,
    copy: copyMock,
    pathExists: pathExistsMock,
    remove: removeMock,
    readJSON: readJsonMock, // fs-extra uses readJSON
    writeJSON: writeJsonMock, // fs-extra uses writeJSON
    emptyDir: emptyDirMock,
    readdir: readdirMock, // Add readdir to the mock
    stat: statMock,       // Add stat to the mock
    // Add other fs-extra functions here if they need to be mocked globally
    // and export their corresponding spy variables above.
  };
});

export function resetFsExtraMocks() {
  ensureDirMock.mockClear().mockResolvedValue(undefined);
  ensureFileMock.mockClear().mockResolvedValue(undefined);
  readFileMock.mockClear().mockResolvedValue('mock file content');
  writeFileMock.mockClear().mockResolvedValue(undefined);
  copyMock.mockClear().mockResolvedValue(undefined);
  pathExistsMock.mockClear().mockResolvedValue(false);
  removeMock.mockClear().mockResolvedValue(undefined);
  readJsonMock.mockClear().mockResolvedValue({ mockKey: 'mockValue' });
  writeJsonMock.mockClear().mockResolvedValue(undefined);
  emptyDirMock.mockClear().mockResolvedValue(undefined);
  readdirMock.mockClear().mockResolvedValue([]);
  statMock.mockClear().mockResolvedValue({ isFile: () => true, isDirectory: () => false } as any);
}