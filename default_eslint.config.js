/* eslint-disable unicorn/filename-case */

/* eslint-disable import-x/order -- manually grouped by kind */
/* eslint-disable @stylistic/multiline-comment-style, @stylistic/lines-around-comment -- for easy enabling and disabling */

/** @import { Linter } from 'eslint' */

import { resolve } from 'node:path';

import { includeIgnoreFile } from '@eslint/compat';
import globals from 'globals';
import { globals as betterTypesGlobals } from '@mephisto5558/better-types/eslint';

import typescriptParser from '@typescript-eslint/parser';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

import { getModifiedRule } from './utils.js';
import { importJsonC, pluginNames, rules, jsGlob, tsGlob, plugins, filetypeSpecificPlugins } from './data.js';

export * from './utils.js';
export { plugins, pluginNames, globals, tsGlob, jsGlob };

rules[`${pluginNames.unicorn}/no-instanceof-builtins`] = getModifiedRule(
  { rules }, `${pluginNames.unicorn}/no-instanceof-builtins`, {
    /* eslint-disable-next-line @typescript-eslint/no-magic-numbers
    -- see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/isError#browser_compatibility */
    useErrorIsError: Number(process.versions.node.split('.', 1)[0]) >= 24
  }
);

let gitIgnore;
try { gitIgnore = includeIgnoreFile(resolve('.', '.gitignore'), 'eslint-config:cwd-gitignore'); }
catch (err) { if (err.code != 'ENOENT') throw err; }

/**
 * @type {Linter.Config[]}
 * This config lists all rules from every plugin it uses. */
export default [
  gitIgnore,
  {
    name: 'eslint-config:common-ignores',
    ignores: [
      '.sonarlint/**/*.json{,c,5}', // use SonarLint default order
      'package-lock.json' // generated file
    ]
  },
  {
    name: 'eslint-config:all',
    files: [`**/*${tsGlob}`, `**/*${jsGlob}`, '**/*.html'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: undefined,
        extraFileExtensions: ['.html'],
        warnOnUnsupportedTypeScriptVersion: true
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.builtin,
        ...globals.node,
        ...globals.es2024,
        ...betterTypesGlobals,
        NodeJS: 'readonly' // @types/node
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
      reportUnusedInlineConfigs: 'warn'
    },
    settings: {
      [pluginNames.jsdoc]: {
        skipInvokedExpressionsForCommentFinding: true
      },
      react: { version: 'detect' },
      [pluginNames.import]: {
        'resolver-next': [
          createTypeScriptImportResolver({
            alwaysTryTypes: true,
            bun: true
          })
        ]
      },
      ...importJsonC('configs/html.jsonc')
    },
    plugins, rules
  },
  {
    name: 'eslint-config:all-json',
    files: ['**/*.json{,c,5}'],
    ignores: ['package-lock.json'],
    plugins: {
      [pluginNames.json]: filetypeSpecificPlugins[pluginNames.json],
      [pluginNames.jsonc]: filetypeSpecificPlugins[pluginNames.jsonc]
    },
    rules: {
      ...importJsonC('configs/eslint-json.jsonc'),
      ...importJsonC('configs/jsonc.jsonc'),
      'no-warning-comments': rules['no-warning-comments']
    }
  },
  {
    name: 'eslint-config:package-json',
    files: ['**/package.json'],
    language: `${pluginNames.jsonc}/x`,
    plugins: {
      [pluginNames.packageJSON]: filetypeSpecificPlugins[pluginNames.packageJSON]
    },
    rules: {
      ...importJsonC('configs/package-json.jsonc'),
      [`${pluginNames.jsonc}/sort-keys`]: 'off' // Handled by `package-json/order-properties`
    }
  },
  {
    name: 'eslint-config:json',
    files: ['**/*.json'],
    ignores: ['**/package.json', '**/.vscode/**/*.json'],
    language: `${pluginNames.json}/json`
  },
  {
    name: 'eslint-config:jsonc',
    files: ['**/*.jsonc', '**/.vscode/**/*.json'],
    language: `${pluginNames.json}/jsonc`
  },
  {
    name: 'eslint-config:json5',
    files: ['**/*.json5'],
    language: `${pluginNames.json}/json5`
  },
  {
    name: 'eslint-config:tsconfig.json',
    files: ['**/tsconfig.json'],
    rules: {
      [`${pluginNames.jsonc}/sort-keys`]: [
        'warn',
        {
          pathPattern: '.*',
          order: [
            'extends',
            'files',
            'include',
            'exclude',
            'compilerOptions',
            'module',
            'moduleResolution',
            'target',
            'lib',
            'paths',
            'libreplacement',
            {
              order: {
                type: 'asc',
                caseSensitive: true,
                natural: true
              }
            }
          ],
          minKeys: 2,
          allowLineSeparatedGroups: true
        }
      ]
    }
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
      [`${pluginNames.sonar}/no-table-as-layout`]: 'warn',
      [`${pluginNames.sonar}/object-alt-content`]: 'warn',
      [`${pluginNames.sonar}/table-header`]: 'warn',
      [`${pluginNames.sonar}/table-header-reference`]: 'warn',
      [`${pluginNames.stylistic}/no-multiple-empty-lines`]: [
        'error',
        {
          max: 2,
          // "maxEOF": 0 // Handled by `@stylistic/eol-last`
          maxBOF: 1 // <script> tag should be on its own line
        }
      ],
      [`${pluginNames.stylistic}/eol-last`]: 'off' // </script> tag should be on the next line
    }
  },
  {
    name: 'eslint-config:css',
    files: ['**/*.css'],
    language: `${pluginNames.css}/css`,
    plugins: {
      [pluginNames.css]: filetypeSpecificPlugins[pluginNames.css]
    },
    rules: {
      ...importJsonC('configs/eslint-css.jsonc')
    }
  },
  {
    name: 'eslint-config:ts',
    files: [`**/*${tsGlob}`],
    rules: {
      // TS-Only rules
      'no-undef': 'off',
      'no-shadow': 'off',
      'no-use-before-define': 'off',
      'class-methods-use-this': 'off',
      [`${pluginNames.jsdoc}/check-tag-names`]: getModifiedRule({ rules }, `${pluginNames.jsdoc}/check-tag-names`, { typed: true }),
      [`${pluginNames.jsdoc}/require-param-type`]: 'off',
      [`${pluginNames.jsdoc}/require-param`]: 'off',
      [`${pluginNames.jsdoc}/require-returns-type`]: 'off',
      [`${pluginNames.jsdoc}/check-param-names`]: 'off',
      [`${pluginNames.jsdoc}/no-types`]: [
        'warn',
        {
          // contexts:
        }
      ],
      [`${pluginNames.jsdoc}/no-defaults`]: 'off', // cannot be set in ts function declarations
      [`${pluginNames.typescript}/adjacent-overload-signatures`]: 'warn',
      [`${pluginNames.typescript}/explicit-function-return-type`]: [
        'warn',
        {
          /* eslint-disable-next-line id-length */
          allowConciseArrowFunctionExpressionsStartingWithVoid: false,
          /* eslint-disable-next-line id-length */
          allowDirectConstAssertionInArrowFunctions: true,
          allowExpressions: false,
          allowFunctionsWithoutTypeParameters: false,
          allowHigherOrderFunctions: true,
          allowIIFEs: false,
          allowTypedFunctionExpressions: true,
          allowedNames: []
        }
      ],
      [`${pluginNames.typescript}/explicit-member-accessibility`]: [
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
      [`${pluginNames.typescript}/explicit-module-boundary-types`]: [
        'warn', // Overlap with `@typescript-eslint/explicit-function-return-type` on exported functions, but not fixable
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
      [`${pluginNames.typescript}/prefer-readonly`]: [
        'warn',
        {
          onlyInlineLambdas: false
        }
      ],
      [`${pluginNames.typescript}/prefer-readonly-parameter-types`]: 'off', // Doesn't seem to work well
      // [
      //   'warn',
      //   {
      //     allow: [],
      //     checkParameterProperties: true,
      //     ignoreInferredTypes: false,
      //     treatMethodsAsReadonly: false
      //   }
      // ],
      [`${pluginNames.typescript}/use-unknown-in-catch-callback-variable`]: 'warn',
      [`${pluginNames.import}/no-relative-parent-imports`]: 'off',
      [`${pluginNames.import}/extentions`]: 'off',
      [`${pluginNames.sonar}/public-static-readonly`]: 'warn'
    }
  }
].filter(Boolean);