import fneslint from 'eslint-plugin-functional';

export default [
  {
    plugins: {
      functional: fneslint,
    },
    rules: {
      // No exceptions
      'functional/no-promise-reject': 'error',
      'functional/no-throw-statements': 'error',
      'functional/no-try-statements': 'error',
      // No mutations
      'functional/immutable-data': 'error',
      'functional/no-let': 'error',
      'functional/prefer-readonly-type': 'error',
      // No other paradigms
      'functional/no-this-expressions': 'error',
      // No statements
      'functional/no-expression-statements': 'error',
      'functional/no-loop-statements': 'error',
      'functional/no-return-void': 'error',
      // Stylistic
      'functional/prefer-property-signatures': 'warn',
      'functional/prefer-tacit': 'warn',
      // Vanilla
      'no-var': 'error',
      'no-param-reassign': 'error',
    },
  },
  {
    // Disables some rules that would raise errors
    // in the files where the tests are defined
    files: ['**/*.test.ts'],
    rules: {
      'functional/no-expression-statements': 'off',
      'functional/no-return-void': 'off',
    },
  },
];
