// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Flat config. Deliberately small: the type checker is the primary safety net,
 * ESLint only covers what tsc cannot see.
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.angular/**',
      '**/*.d.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2022 },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      eqeqeq: ['error', 'smart'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Browser and React Native surfaces.
    files: ['apps/admin-web/**/*.ts', 'apps/*-mobile/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2022 },
    },
  },
  {
    // CLI-shaped code: scripts, the migrator, seeds and tests talk to stdout.
    // karma.conf.js is CommonJS by design (Karma loads it with require()).
    files: [
      'scripts/**/*.ts',
      'db/**/*.{js,ts}',
      'apps/api/src/db/migrate.ts',
      '**/*.test.ts',
      '**/test/**/*.ts',
      'apps/admin-web/karma.conf.js',
    ],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
