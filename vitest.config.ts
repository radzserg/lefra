import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '#': path.resolve(__dirname, './src/tests'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    deps: {
      interopDefault: true,
    },
    mockReset: true,
    outputFile: './src/__generated__/vitest/results.xml',
    reporters: 'verbose',
    setupFiles: path.resolve(__dirname, './src/tests/vitest.setup.ts'),
    testTimeout: 10_000,
  },
});
