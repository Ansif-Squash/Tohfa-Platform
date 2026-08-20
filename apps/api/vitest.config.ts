import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Alias workspace packages to SOURCE so `pnpm test` works without a build.
      '@tohfa/shared-types': fileURLToPath(
        new URL('../../packages/shared-types/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    root: here,
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts', 'src/**/*.e2e.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    // Integration tests share one Postgres schema; keep files serial.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/test/**'],
    },
  },
});
