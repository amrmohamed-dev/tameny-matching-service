import globals from 'globals';
import { FlatCompat } from '@eslint/eslintrc';
import nodePlugin from 'eslint-plugin-n';
import prettierPlugin from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';

const compat = new FlatCompat({
  baseDirectory: process.cwd(),
});

export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },

  ...compat.extends('airbnb-base'),
  ...compat.extends('plugin:n/recommended'),
  ...compat.extends('prettier'),

  {
    plugins: {
      import: importPlugin,
      n: nodePlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'always',
          jsx: 'always',
          ts: 'never',
          tsx: 'never',
        },
      ],
      'prettier/prettier': ['warn', { endOfLine: 'auto' }],

      'spaced-comment': 'off',
      'no-plusplus': 'off',
      'no-console': 'warn',
      'consistent-return': 'off',
      'func-names': 'off',
      'object-shorthand': 'off',
      'no-process-exit': 'off',
      'no-param-reassign': 'off',
      'no-return-await': 'off',
      'no-underscore-dangle': 'off',
      'class-methods-use-this': 'off',
      "n/no-process-exit": "off",

      'prefer-destructuring': ['error', { object: true, array: false }],

      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: 'req|res|next|val',
        },
      ],
    },
  },
];
