import { defineConfig } from 'vitest/config';

/**
 * We are updating the coverage configuration to exclude some paths from the
 * coverage report, so the coverage report only consider out code.
 *
 * We tried to define the vitest.config.ts file within the functions-subscription
 * application, but it didn't work as expected: the execution of the test:coverage
 * script still show the coverage of the excluded files.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      exclude: [
        '**/__tests__/data.ts',
        '**/__tests__/mocks.ts',
        '**/generated/**',
        '**/coverage/**',
        '.yarn',
        'vitest.workspace.ts',
        'infra/**',
        'packages/eslint-config/**',
        'scripts/**',
      ]
    },
  },
});
