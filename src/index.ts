/* eslint-disable max-lines, @stylistic/multiline-comment-style, @stylistic/lines-around-comment -- for easy enabling and disabling */
/* eslint-disable @typescript-eslint/no-non-null-assertion -- only used and needed for `filetypeSpecificPlugins` */
/* eslint-disable import-x/max-dependencies -- all needed */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { includeIgnoreFile } from 'eslint/config';
import htmlParser from '@html-eslint/parser';
import { globals as betterTypesGlobals } from '@mephisto5558/better-types/eslint';

import typescriptParser from '@typescript-eslint/parser';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

import globals from 'globals';
import { minVersion } from 'semver';

import {
  allFilesGlob, disableTypedChecked, filetypeSpecificPlugins, jsExtensions,
  jsGlob, pluginNames, plugins, tsExtensions, tsGlob
} from './constants.ts';
import { getModifiedRule, importRules } from './utils.ts';

import type { ParserOptions } from '@typescript-eslint/parser';

/* eslint-disable-next-line @limegrass/import-alias/import-alias -- false positive */
import type { Linter } from 'eslint';

export * from './constants.ts';
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

const rules = ['eslint/eslint', ...Object.keys(plugins)].reduce<
  ReturnType<typeof importRules> & { 'jsdoc/check-tag-names'?: [string, Record<string, boolean> | undefined] | undefined }
  // skip htmlJS due to it using settings instead of rules
>((acc, e) => e == pluginNames.htmlJS ? acc : { ...acc, ...importRules(e) }, {});

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
      'package-lock.json', // generated file
      'dist/**' // generated code
    ]
  },
  {
    name: 'eslint-config:all',
    files: [tsGlob, jsGlob, '.html'].map(e => allFilesGlob + e),
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
      react: { version: 'detect' },
      [pluginNames.jsdoc]: {
        skipInvokedExpressionsForCommentFinding: true
      },
      [pluginNames.import]: {
        'resolver-next': [
          createTypeScriptImportResolver({
            alwaysTryTypes: true,
            bun: true
          })
        ]
      },
      [pluginNames.htmlJS]: {
        indent: '+2',
        ...importRules(pluginNames.htmlJS)
      },
      [pluginNames.node]: {
        tryExtentions: [...tsExtensions, ...jsExtensions]
      }
    },
    plugins, rules
  },
  {
    name: 'eslint-config:all-json',
    files: [`${allFilesGlob}.json{,c,5}`],
    ignores: ['package-lock.json'],
    plugins: {
      [pluginNames.json]: filetypeSpecificPlugins[pluginNames.json]!,
      [pluginNames.jsonc]: filetypeSpecificPlugins[pluginNames.jsonc]!,
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- false positive */
      [pluginNames.eslintComments]: plugins[pluginNames.eslintComments as keyof typeof pluginNames]
    },
    rules: {
      ...importRules(`eslint/${pluginNames.json}`),
      ...importRules(pluginNames.jsonc),
      ...importRules(pluginNames.eslintComments),
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
      ...importRules(pluginNames.packageJSON),
      [`${pluginNames.jsonc}/sort-keys`]: 'off', // Handled by `package-json/order-properties`
      [`${pluginNames.jsonc}/key-name-casing`]: 'off'
    }
  },
  {
    name: 'eslint-config:json',
    files: [`${allFilesGlob}.json`],
    ignores: ['**/package.json', `**/.vscode/${allFilesGlob}.json`],
    language: `${pluginNames.json}/json`
  },
  {
    name: 'eslint-config:jsonc',
    files: [`${allFilesGlob}.jsonc`],
    language: `${pluginNames.json}/jsonc`
  },
  {
    name: 'eslint-config:vscode-json',
    files: [`**/.vscode/${allFilesGlob}.json`],
    language: `${pluginNames.json}/jsonc`,
    rules: {
      [`${pluginNames.jsonc}/sort-keys`]: 'off', // use VSCode default order
      [`${pluginNames.jsonc}/key-name-casing`]: 'off'
    }
  },
  {
    name: 'eslint-config:json5',
    files: [`${allFilesGlob}.json5`],
    language: `${pluginNames.json}/json5`
  },
  {
    name: 'eslint-config:tsconfig.json',
    files: [`${allFilesGlob}tsconfig*.json`],
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
    files: [`${allFilesGlob}.jsx`],
    rules: {
      ...importRules(`${pluginNames.sonar}-react`)
    }
  },
  {
    name: 'eslint-config:html',
    files: [`${allFilesGlob}.html`],
    // language: `${pluginNames.html}/html`, // This crashes many rules without having any positive difference
    languageOptions: {
      parser: htmlParser,
      globals: globals.browser
    },
    rules: {
      ...disableTypedChecked.rules,
      ...importRules(`${pluginNames.sonar}-html`),

      // some rules crash
      'capitalized-comments': 'off',
      [`${pluginNames.stylistic}/spaced-comment`]: 'off',


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
    files: [`${allFilesGlob}.css`],
    language: `${pluginNames.css}/css`,
    plugins: {
      [pluginNames.css]: filetypeSpecificPlugins[pluginNames.css]!,
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- false positive */
      [pluginNames.eslintComments]: plugins[pluginNames.eslintComments as keyof typeof pluginNames]

    },
    rules: {
      ...importRules(pluginNames.eslintComments),
      ...importRules(`eslint/${pluginNames.css}`)
    }
  },
  {
    name: 'eslint-config:ts',
    files: [allFilesGlob + tsGlob],
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
          /* eslint-disable id-length -- depends on the plugin */
          allowConciseArrowFunctionExpressionsStartingWithVoid: false,
          allowDirectConstAssertionInArrowFunctions: true,
          /* eslint-enable id-length  */
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
          /* eslint-disable-next-line id-length -- depends on the plugin */
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
      [pluginNames.markdown]: filetypeSpecificPlugins[pluginNames.markdown]!,
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- false positive */
      [pluginNames.eslintComments]: plugins[pluginNames.eslintComments as keyof typeof pluginNames]

    },
    rules: {
      ...importRules(pluginNames.eslintComments),
      ...importRules(`eslint/${pluginNames.markdown}`)
    }
  }
];

if (gitIgnore) eslintConfig.unshift(gitIgnore);

export default eslintConfig;