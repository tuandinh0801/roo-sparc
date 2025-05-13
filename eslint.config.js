import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    // Base configuration for all TypeScript files
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.eslint.json',
        tsconfigRootDir: '.',
      },
      globals: {
        // Add Node.js globals
        'console': 'readonly',
        'process': 'readonly',
        '__dirname': 'readonly',
        'module': 'readonly',
        'require': 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      '@stylistic/ts': stylisticTs,
    },
    rules: {
      // Enforce consistent spacing
      '@stylistic/ts/indent': ['error', 2],
      '@stylistic/ts/quotes': ['error', 'single'],
      '@stylistic/ts/semi': ['error', 'always'],
      '@stylistic/ts/comma-spacing': ['error', { before: false, after: true }],
      '@stylistic/ts/key-spacing': ['error', { beforeColon: false, afterColon: true }],
      '@stylistic/ts/object-curly-spacing': ['error', 'always'],
      '@stylistic/ts/space-infix-ops': 'error',
      '@stylistic/ts/keyword-spacing': ['error', { before: true, after: true }],
      '@stylistic/ts/space-before-blocks': 'error',
      '@stylistic/ts/space-before-function-paren': ['error', 'never'],
      '@stylistic/ts/member-delimiter-style': ['error', {
        multiline: {
          delimiter: 'semi',
          requireLast: true,
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
      }],
      // TypeScript specific rules
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // General ESLint rules
      'no-console': 'off',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-trailing-spaces': 'error',
      // Disable no-undef since TypeScript already handles this
      'no-undef': 'off',
      // Disable duplicate unused vars rule since TypeScript handles it
      'no-unused-vars': 'off',
    },
  },
  // Special configuration for test files
  {
    files: ['**/tests/**/*.ts', '**/*.spec.ts', '**/*.test.ts', 'vitest.config.ts'],
    rules: {
      // Relax some rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  // Configuration for JavaScript files (e.g., build scripts)
  {
    files: ['**/*.js'], // Apply to all .js files, or be more specific like 'scripts/**/*.js'
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module', // Assuming build scripts are also ES modules
      globals: {
        // Add Node.js globals
        'console': 'readonly',
        'process': 'readonly',
        '__dirname': 'readonly',
        'module': 'readonly',
        'require': 'readonly',
        // Add any other Node.js globals your scripts might use
      },
    },
    rules: {
      // Add any JS-specific rules or overrides here if needed
      // For example, if you use a different indent style for JS vs TS
    }
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
    ],
  },
];
