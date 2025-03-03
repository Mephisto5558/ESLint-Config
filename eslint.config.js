import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import globals from 'globals';

import parser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import stylisticPlugin from '@stylistic/eslint-plugin';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';
import regExPlugin from 'eslint-plugin-regexp';
import htmlPlugin from 'eslint-plugin-html';
import customPlugin from './ruleOverwrites/index.js';

export { plugins };

/** @param {string}path Removes comments */
function importJsonC(path) {
  const rules = JSON.parse(readFileSync(resolve(import.meta.dirname, path), 'utf8').replaceAll(/\/\/.*/g, ''));

  let filename = basename(path, '.jsonc');
  if (filename.startsWith('sonarjs')) filename = 'sonarjs/';
  else filename = filename == 'eslint' ? '' : `${filename}/`;

  return Object.fromEntries(Object.entries(rules).filter(([, v]) => v !== '').map(([k, v]) => [`${filename}${k}`, v]));
}

const
  plugins = {
    '@typescript-eslint': typescriptPlugin,
    '@stylistic': stylisticPlugin,
    jsdoc: jsdocPlugin,
    sonarjs: sonarjsPlugin,
    unicorn: unicornPlugin,
    regexp: regExPlugin,
    html: htmlPlugin,
    custom: customPlugin
  },
  rules = {
    ...importJsonC('configs/eslint.jsonc'),
    ...importJsonC('configs/@typescript-eslint.jsonc'),
    ...importJsonC('configs/@stylistic.jsonc'),
    ...importJsonC('configs/jsdoc.jsonc'),
    ...importJsonC('configs/sonarjs.jsonc'),
    ...importJsonC('configs/unicorn.jsonc'),
    ...importJsonC('configs/regexp.jsonc'),
    ...importJsonC('configs/custom.jsonc')
  };

/**
 * @type { import('eslint').Linter.Config[] }
 * This config lists all rules from every plugin it uses. */
export default [
  {
    name: 'eslint-config:all',
    files: ['**/*.js', '**/*.ts', '**/*.html'],
    languageOptions: {
      parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: '.',
        extraFileExtensions: ['.html'],
        warnOnUnsupportedTypeScriptVersion: true
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.builtin,
        ...globals.node,
        ...globals.es2024,
        NodeJS: 'readonly'
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
      reportUnusedInlineConfigs: 'warn'
    },
    settings: {
      react: { version: 'detect' },
      ...importJsonC('configs/html.jsonc')
    },
    plugins, rules
  },
  {
    name: 'eslint-config:react',
    files: ['**/*.jsx'],
    rules: importJsonC('configs/sonarjs-react.jsonc')
  },
  {
    name: 'eslint-config:html',
    files: ['**/*.html'],
    languageOptions: {
      globals: globals.browser
    },
    rules: {
      ...importJsonC('configs/sonarjs-html.jsonc'),
      '@stylistic/no-multiple-empty-lines': [
        'error',
        {
          max: 2,
          maxBOF: 1 // <script> tag should be on its own line
        }
      ],
      '@stylistic/eol-last': 'off' // </script> tag should be on the next line
    }
  },
  {
    name: 'eslint-config:ts',
    files: ['**/*.ts'],
    rules: {
      // TS-Only rules
      'no-undef': 'off',
      'no-shadow': 'off',
      'no-use-before-define': 'off',
      'class-methods-use-this': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns-type': 'off',
      'jsdoc/check-param-names': 'off',
      'jsdoc/no-defaults': 'off', // cannot set them in ts function declarations
      '@typescript-eslint/adjacent-overload-signatures': 'warn',
      '@typescript-eslint/no-unsafe-return': 'error', // Doesn't work in js due to all returns showing as `any`
      '@typescript-eslint/no-unsafe-call': 'error', // Doesn't work in js with .bind/.call
      '@typescript-eslint/no-unsafe-argument': 'error', // Doesn't work in js with .bind/.call
      '@typescript-eslint/no-unsafe-assignment': 'error', // Doesn't work in js with .bind/.call
      '@typescript-eslint/no-unsafe-member-access': 'error', // Doesn't work in js
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'no-public'
        }
      ],
      '@typescript-eslint/explicit-module-boundary-types': [
        'error',
        {
          allowArgumentsExplicitlyTypedAsAny: true,
          /* eslint-disable-next-line id-length */
          allowDirectConstAssertionInArrowFunctions: true,
          allowHigherOrderFunctions: true,
          allowTypedFunctionExpressions: true
        }
      ],
      '@stylistic/member-delimiter-style': [
        'error',
        {
          multiline: {
            delimiter: 'semi',
            requireLast: true
          },
          singleline: {
            delimiter: 'semi',
            requireLast: false
          },
          multilineDetection: 'brackets'
        }
      ],
      '@stylistic/type-annotation-spacing': [
        'error',
        {
          before: false,
          after: true,
          overrides: {
            arrow: {
              before: true,
              after: true
            }
          }
        }
      ],
      '@stylistic/type-generic-spacing': 'error',
      '@stylistic/type-named-tuple-spacing': 'error',
      'jsdoc/no-types': 'error',
      'sonarjs/public-static-readonly': 'warn'
    }
  }
];