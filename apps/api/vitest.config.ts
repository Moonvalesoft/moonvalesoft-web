import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/helpers/global-setup.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
