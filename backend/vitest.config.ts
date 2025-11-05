import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/services/__tests__/utils/test-setup.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/migrations/',
        'src/seeds/',
      ],
    },
  },
  resolve: {
    alias: {
      mongodb: 'mongodb',
    },
  },
  optimizeDeps: {
    exclude: ['mongodb'],
  },
});
