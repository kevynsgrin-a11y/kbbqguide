import eslint from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import astro from 'eslint-plugin-astro';

export default [
  {
    ignores: [
      '.astro/**',
      'dist/**',
      'node_modules/**',
      'scratchpad/**',
      'review/**',
    ],
  },
  eslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: 'module' },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // Node scripts, including Playwright evaluate() callbacks that run in the browser.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
        structuredClone: 'readonly',
        document: 'readonly',
        window: 'readonly',
        getComputedStyle: 'readonly',
      },
    },
  },
];
