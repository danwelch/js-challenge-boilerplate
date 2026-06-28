// @ts-check
import templatePlugin from '@angular-eslint/eslint-plugin-template';
import templateParser from '@angular-eslint/template-parser';

export default [
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: templateParser,
    },
    plugins: {
      '@angular-eslint/template': templatePlugin,
    },
    rules: {
      // Accessibility
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/no-positive-tabindex': 'error',
      // Best practice
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/prefer-control-flow': 'error',
    },
  },
];
