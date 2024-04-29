import prettier from 'eslint-plugin-prettier/recommended';

// Runs Prettier as an ESLint rule and reports differences as individual
// ESLint issues
export default {
  ...prettier,
  rules: {
    ...prettier.rules,
    'prettier/prettier': [
      'error',
      {
        // prettier options
        singleQuote: true,
        jsxSingleQuote: true,
      },
    ],
  },
};
