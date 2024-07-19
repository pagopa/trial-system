import eslintrules from 'eslint-config-rules';

export default [
  ...eslintrules,
  {
    // Disable no-expression-statements on all files because this project uses
    // 3rd libraries with many method with side effect.
    files: ['src/**'],
    rules: {
      'functional/no-expression-statements': 'off',
    },
  },
  {
    // Ignore webpack.config.js
    ignores: ['webpack.config.js'],
  },
];
