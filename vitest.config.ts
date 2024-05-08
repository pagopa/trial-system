import { defineConfig } from 'vitest/config';

/**
 * We are updating the coverage configuration to exclude some paths from the
 * coverage report, so the coverage report only consider out code.
 *
 * We tried to define the vitest.config.ts file within the functions-subscription
 * application, but it didn't work as expected.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      exclude: [
        '**/generated/**',
        '**/coverage/**',
        '.yarn',
        'vitest.workspace.ts',
      ]
    },
  },
});
