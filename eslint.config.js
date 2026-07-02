import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';

export default tseslint.config(
  // Base ESLint recommended settings
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Global settings and ignorable paths
  {
    ignores: ['**/dist/**', '**/build/**', '**/coverage/**', 'node_modules/**', '**/.husky/**'],
  },

  // Base JS/TS configuration
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off', // turned off in favor of unused-imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // React & React Hooks configuration
  {
    files: ['client/src/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // react-in-jsx-scope is no longer required in modern React
      'react/prop-types': 'off',
    },
  }
);
