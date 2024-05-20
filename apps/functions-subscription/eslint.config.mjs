import eslintrules from 'eslint-config-rules';

export default [
  ...eslintrules,
  {
    // Disable no-expression-statements only in the
    // main file containing the endpoint mapping.
    files: ['src/main.ts'],
    rules: {
      'functional/no-expression-statements': 'off',
    },
  },
];
