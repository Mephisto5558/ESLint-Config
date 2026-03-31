/* eslint-disable max-lines, @stylistic/multiline-comment-style, @stylistic/lines-around-comment -- for easy enabling and disabling */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { minVersion } from 'semver'; /* eslint-disable-line import-x/order */
import globals from 'globals'; /* eslint-disable-line import-x/order */
import { includeIgnoreFile } from '@eslint/compat';
import { globals as betterTypesGlobals } from '@mephisto5558/better-types/eslint';

import typescriptParser from '@typescript-eslint/parser';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

import { filetypeSpecificPlugins, importRules, jsGlob, pluginNames, plugins, rules, tsGlob } from './data.ts';
import { getModifiedRule } from './utils.ts';

import type { ParserOptions } from '@typescript-eslint/parser';

/* eslint-disable-next-line @limegrass/import-alias/import-alias -- false positive */
import type { Linter } from 'eslint';

export * from './utils.ts';
export { plugins, pluginNames, globals, tsGlob, jsGlob };
export type * from '@mephisto5558/better-types';

/** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/isError#browser_compatibility */
const ERROR_IS_ERROR_MIN_VERSION = 24;

let useErrorIsError = Number(process.versions.node.split('.', 1)[0]) >= ERROR_IS_ERROR_MIN_VERSION;
try {
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- catch handles invalid package.json */
  const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { engines?: { node?: string } };
  if ('engines' in packageJson && 'node' in packageJson.engines && packageJson.engines.node)
    useErrorIsError = (minVersion(packageJson.engines.node)?.major ?? 0) >= ERROR_IS_ERROR_MIN_VERSION;
}
catch { /* ignore */ }

rules[`${pluginNames.unicorn}/no-instanceof-builtins`] = getModifiedRule(
  { rules }, `${pluginNames.unicorn}/no-instanceof-builtins`, [{
    useErrorIsError
  }], true
);

let gitIgnore;
try { gitIgnore = includeIgnoreFile(resolve('.', '.gitignore'), 'eslint-config:cwd-gitignore'); }
catch (rawErr) {
  const err = rawErr instanceof Error ? rawErr : new Error(String(rawErr));
  if (!('code' in err) || err.code != 'ENOENT') throw err;
}

const eslintConfig: (Linter.Config & { languageOptions?: { parserOptions?: ParserOptions } })[] = [
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
      // @ts-expect-error `tsconfigRootDir: undefined` has some undocumented behavior that I need for some projects
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.html'],
        tsconfigRootDir: undefined,
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
      ...importRules('configs/html.jsonc')
    },
    plugins, rules
  },
  {
    name: 'eslint-config:all-json',
    files: ['**/*.json{,c,5}'],
    ignores: ['package-lock.json'],
    plugins: {
      [pluginNames.json]: filetypeSpecificPlugins[pluginNames.json]!,
      [pluginNames.jsonc]: filetypeSpecificPlugins[pluginNames.jsonc]!
    },
    rules: {
      ...importRules('configs/eslint-json.jsonc'),
      ...importRules('configs/jsonc.jsonc'),
      'no-warning-comments': rules['no-warning-comments']
    }
  },
  {
    name: 'eslint-config:package-json',
    files: ['**/package.json'],
    language: `${pluginNames.jsonc}/x`,
    plugins: {
      [pluginNames.packageJSON]: filetypeSpecificPlugins[pluginNames.packageJSON]!
    },
    rules: {
      ...importRules('configs/package-json.jsonc'),
      [`${pluginNames.jsonc}/sort-keys`]: 'off', // Handled by `package-json/order-properties`
      [`${pluginNames.jsonc}/key-name-casing`]: 'off'
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
    files: ['**/*.jsonc'],
    language: `${pluginNames.json}/jsonc`
  },
  {
    name: 'eslint-config:vscode-json',
    files: ['**/.vscode/**/*.json'],
    language: `${pluginNames.json}/jsonc`,
    rules: {
      [`${pluginNames.jsonc}/sort-keys`]: 'off', // use VSCode default order
      [`${pluginNames.jsonc}/key-name-casing`]: 'off'
    }
  },
  {
    name: 'eslint-config:json5',
    files: ['**/*.json5'],
    language: `${pluginNames.json}/json5`
  },
  {
    name: 'eslint-config:tsconfig.json',
    files: ['**/*tsconfig*.json'],
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
            'rootDir',
            'outDir',
            'paths',
            'libReplacement',
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
      ],
      [`${pluginNames.jsonc}/sort-array-values`]: [
        'warn',
        { // Exclude some properties because their order is important.
          pathPattern: '^(?!(extends|paths|rootDirs)).*$',
          order: {
            type: 'asc',
            caseSensitive: true,
            natural: true
          },
          minValues: 2
        }
      ]
    }
  },
  {
    name: 'eslint-config:react',
    files: ['**/*.jsx'],
    rules: importRules('configs/sonarjs-react.jsonc')!
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
      [pluginNames.css]: filetypeSpecificPlugins[pluginNames.css]!
    },
    rules: {
      ...importRules('configs/eslint-css.jsonc')
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
      ...getModifiedRule({ rules }, `${pluginNames.jsdoc}/check-tag-names`, [{ typed: true }]),
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
  },
  {
    name: 'eslint-config:markdown',
    files: ['**/*.md'],
    language: `${pluginNames.markdown}/gfm`,
    plugins: {
      [pluginNames.markdown]: filetypeSpecificPlugins[pluginNames.markdown]!
    },
    rules: {
      ...importRules('configs/eslint/markdown.jsonc')!
    }
  }
];

if (gitIgnore) eslintConfig.unshift(gitIgnore);

export default eslintConfig;