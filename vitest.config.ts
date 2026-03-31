import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/api/**/*.test.ts'],
    setupFiles: ['./tests/fixtures/setup.ts'],
  },
});
