import eslintPluginPrettier from 'eslint-plugin-prettier';
import * as typescriptEslint from 'typescript-eslint';
import path from 'path';

export default [
  ...typescriptEslint.configs.recommended,

  {
    ignores: ['dist', 'node_modules', '.eslintrc.js'],

    languageOptions: {
      parser: typescriptEslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: path.resolve(),
        sourceType: 'module'
      },
      sourceType: 'module'
    },

    plugins: {
      '@typescript-eslint': typescriptEslint.plugin,
      prettier: eslintPluginPrettier
    },

    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'prettier/prettier': 'warn'
    }
  }
];
