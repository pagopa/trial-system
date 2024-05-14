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
  ...fneslint,
  // Runs Prettier as an ESLint rule and reports differences as individual
  // ESLint issues
  prettier,
  {
    // Ignore everything under any dist/ directory
    ignores: ['**/dist/'],
  },
];
