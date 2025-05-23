import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
    },
    include: [
      'src/**/*.spec.ts',
      'src/**/*.test.ts',
      'tests/**/*.spec.ts',
      'tests/**/*.test.ts',
      'src/**/*.spec.mts',
      'src/**/*.test.mts',
      'tests/**/*.spec.mts',
      'tests/**/*.test.mts',
    ],
  },
});