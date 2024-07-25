import eslintrules from 'eslint-config-rules';

export default [
  ...eslintrules,
  {
    // Disable no-expression-statements on all files allowing side effect on
    // script files.
    files: ['src/**'],
    rules: {
      'functional/no-expression-statements': 'off',
    },
  },
  {
    // Ignore generated files
    ignores: ['src/generated/**'],
  },
];
