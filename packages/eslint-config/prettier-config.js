import prettier from 'eslint-plugin-prettier/recommended';

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
