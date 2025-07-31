/* eslint-disable @stylistic/multiline-comment-style, @stylistic/lines-around-comment -- for easy enabling and disabling */

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

/**
 * @param {string} path Removes comments
 * @returns {Record<string, string | [string | number | Record<string, unknown>, unknown[]][]>} */
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
  /** @type {ReturnType<importJsonC> & {'jsdoc/check-tag-names': [string, Record<string, boolean>]}} */
  rules = {
    ...importJsonC('configs/eslint.jsonc'),
    ...importJsonC('configs/@stylistic.jsonc'),
    ...importJsonC('configs/@typescript-eslint.jsonc'),
    ...importJsonC('configs/jsdoc.jsonc'),
    ...importJsonC('configs/regexp.jsonc'),
    ...importJsonC('configs/sonarjs.jsonc'),
    ...importJsonC('configs/unicorn.jsonc'),
    ...importJsonC('configs/custom.jsonc')
  };

/**
 * @type {import('eslint').Linter.Config[]}
 * This config lists all rules from every plugin it uses. */
export default [
  {
    name: 'eslint-config:all',
    files: ['**/*.js', '**/*.mjs', '**/*.ts', '**/*.html'],
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
      'sonarjs/no-table-as-layout': 'warn',
      'sonarjs/object-alt-content': 'warn',
      'sonarjs/table-header': 'warn',
      'sonarjs/table-header-reference': 'warn',
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
      'jsdoc/check-tag-names': [
        rules['jsdoc/check-tag-names']?.[0] ?? 'off',
        {
          ...rules['jsdoc/check-tag-names']?.[1],
          typed: true
        },
        ...rules['jsdoc/check-tag-names']?.slice(2) ?? []
      ],
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns-type': 'off',
      'jsdoc/check-param-names': 'off',
      'jsdoc/no-types': 'warn',
      'jsdoc/no-defaults': 'off', // cannot set them in ts function declarations
      '@typescript-eslint/adjacent-overload-signatures': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-member-accessibility': [
        'warn',
        {
          accessibility: 'no-public',
          // ignoredMethodNames:
          overrides: {
            // accessors:
            // constructors:
            // methods:
            // parameterProperties:
            // properties:
          }
        }
      ],
      '@typescript-eslint/explicit-module-boundary-types': [
        'warn',
        {
          allowArgumentsExplicitlyTypedAsAny: true,
          /* eslint-disable-next-line id-length */
          allowDirectConstAssertionInArrowFunctions: true,
          allowHigherOrderFunctions: true,
          allowOverloadFunctions: false,
          allowTypedFunctionExpressions: true,
          allowedNames: []
        }
      ],
      '@typescript-eslint/prefer-readonly': [
        'warn',
        {
          onlyInlineLambdas: false
        }
      ],
      '@typescript-eslint/prefer-readonly-parameter-types': [
        'warn',
        {
          allow: [],
          checkParameterProperties: true,
          ignoreInferredTypes: false,
          treatMethodsAsReadonly: false
        }
      ],
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'warn',
      'sonarjs/public-static-readonly': 'warn'
    }
  }
];