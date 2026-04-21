import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    reporters: ['verbose', 'json'],
    outputFile: 'test-results/unit-results.json',
    coverage: {
      provider: 'v8',
      include: [
        'src/services/**/*.ts',
        'src/utils/**/*.ts',
      ],
      reporter: ['text', 'json'],
      reportsDirectory: 'test-results/coverage',
    },
  },
});
