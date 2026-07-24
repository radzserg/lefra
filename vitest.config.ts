import * as path from 'node:path';
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
    // vitest 4 no longer excludes dist/ by default
    exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    isolate: false,
    mockReset: true,
    outputFile: './src/__generated__/vitest/results.xml',
    fileParallelism: false,
    reporters: 'verbose',
    setupFiles: path.resolve(__dirname, './src/tests/vitest.setup.ts'),
    testTimeout: 10_000,
  },
});
