import jseslint from '@eslint/js';
import tseslint from './tseslint-config.js';
import fneslint from './fneslint-config.js';
import prettier from './prettier-config.js';

export default [
  // Load js rules
  jseslint.configs.recommended,
  // Load ts strict and stylistic config
  ...tseslint,
  // Define rules to enforce functional paradigm
  fneslint,
  // Runs Prettier as an ESLint rule and reports differences as individual
  // ESLint issues
  prettier,
  {
    // Ignore everything under any dist/ directory
    ignores: ['**/dist/'],
  },
  {
    /**
     * Test files are allowed to use expression statements
     * (like `describe()`, `test()`, and so on).
     * The `no-return-void` allow us to write
     * `describe(() => {})`.
     **/
    files: ['**/__tests__/**'],
    rules: {
      'functional/no-expression-statements': 'off',
      'functional/no-return-void': 'off',
    },
  },
];
