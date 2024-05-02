import jseslint from '@eslint/js';
import prettier from './prettier-config.js';

export default [
  jseslint.configs.recommended,
  // Runs Prettier as an ESLint rule and reports differences as individual
  // ESLint issues
  prettier,
];
