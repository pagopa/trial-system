import tseslint from 'typescript-eslint';

export default [
  ...tseslint.config(
    ...tseslint.configs.strict,
    ...tseslint.configs.stylistic,
    {
      languageOptions: {
        parserOptions: {
          project: true,
          tsconfigDirName: import.meta.dirname,
        },
      },
    },
  ),
];
