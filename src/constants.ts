/* eslint-disable import-x/max-dependencies -- all needed */

import cssPlugin from '@eslint/css';
import jsonPlugin from '@eslint/json';
import markdownPlugin from '@eslint/markdown';
import eslintCommentsPlugin from '@eslint-community/eslint-plugin-eslint-comments';
import htmlPlugin from '@html-eslint/eslint-plugin';
import importAliasPlugin from '@limegrass/eslint-plugin-import-alias';
import stylisticPlugin from '@stylistic/eslint-plugin';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';

// @ts-expect-error -- eslint-plugin-html cannot be augmented
import _htmlJSPlugin from 'eslint-plugin-html';
import importPlugin from 'eslint-plugin-import-x';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import jsoncPlugin from 'eslint-plugin-jsonc';
import nodePlugin from 'eslint-plugin-n';

// @ts-expect-error -- eslint-plugin-no-unsanitized cannot be augmented
import _unsanitizedPlugin from 'eslint-plugin-no-unsanitized';
import packageJSONPlugin from 'eslint-plugin-package-json';
import regExPlugin from 'eslint-plugin-regexp';
import securityPlugin from 'eslint-plugin-security';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';
/* eslint-disable-next-line import-x/no-unresolved -- required for .js extension in ts files */
import customPlugin from './ruleOverwrites/index.js';

import type { ESLint } from 'eslint';

const
  /* eslint-disable @typescript-eslint/no-unsafe-type-assertion -- these plugins cannot be augmented */
  htmlJSPlugin = _htmlJSPlugin as ESLint.Plugin,
  unsanitizedPlugin = _unsanitizedPlugin as ESLint.Plugin,
  /* eslint-enable @typescript-eslint/no-unsafe-type-assertion */

  getNamespace = <T extends ESLint.Plugin>(
    plugin: T, defaultNamespace: string
  ): T['meta'] extends { namespace: string } ? T['meta']['namespace'] : string => plugin.meta?.namespace ?? defaultNamespace,

  extensions = ['{}', '{}x', 'm{}', 'c{}'];

export const
  tsExtensions = extensions.map(e => `.${e.replace('{}', 'ts')}`),
  jsExtensions = extensions.map(e => `.${e.replace('{}', 'js')}`),
  tsGlob = `.{${tsExtensions.map(e => e.slice(1)).join(',')}}`,
  jsGlob = `.{${jsExtensions.map(e => e.slice(1)).join(',')}}`,
  allFilesGlob = '**/*',
  pluginNames = {
    css: getNamespace(cssPlugin, 'css'),
    eslintComments: getNamespace(eslintCommentsPlugin, '@eslint-community/eslint-comments'),
    htmlJS: getNamespace(htmlJSPlugin, 'html'),
    html: getNamespace(htmlPlugin, '@html-eslint'),
    import: getNamespace(importPlugin, 'import-x'),
    importAlias: getNamespace(importAliasPlugin, '@limegrass/import-alias'),
    jsdoc: getNamespace(jsdocPlugin, 'jsdoc'),
    json: getNamespace(jsonPlugin, 'json'),
    jsonc: getNamespace(jsoncPlugin, 'jsonc'),
    markdown: getNamespace(markdownPlugin, 'markdown'),
    node: getNamespace(nodePlugin, 'n'),
    packageJSON: getNamespace(packageJSONPlugin, 'package-json'),
    noUnsanitized: getNamespace(unsanitizedPlugin, 'nounsanitized'),
    regex: getNamespace(regExPlugin, 'regexp'),
    security: getNamespace(securityPlugin, 'security'),
    sonar: getNamespace(sonarjsPlugin, 'sonarjs'),
    stylistic: getNamespace(stylisticPlugin, '@stylistic'),
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- typeScriptPlugin does not extend or implement ESLint.Plugin */
    typescript: getNamespace(typescriptPlugin as unknown as ESLint.Plugin, '@typescript-eslint'),
    unicorn: getNamespace(unicornPlugin, 'unicorn'),

    custom: getNamespace(customPlugin, 'custom')
  } as const,
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- being less specific */
  plugins = {
    [pluginNames.eslintComments]: eslintCommentsPlugin,
    [pluginNames.html]: htmlPlugin,
    [pluginNames.htmlJS]: htmlJSPlugin,
    [pluginNames.import]: importPlugin,
    [pluginNames.importAlias]: importAliasPlugin,
    [pluginNames.jsdoc]: jsdocPlugin,
    [pluginNames.node]: nodePlugin,
    [pluginNames.noUnsanitized]: unsanitizedPlugin,
    [pluginNames.regex]: regExPlugin,
    [pluginNames.security]: securityPlugin,
    [pluginNames.sonar]: sonarjsPlugin,
    [pluginNames.stylistic]: stylisticPlugin,
    [pluginNames.typescript]: typescriptPlugin,
    [pluginNames.unicorn]: unicornPlugin,

    [pluginNames.custom]: customPlugin
  } as Record<keyof typeof pluginNames, ESLint.Plugin>,
  filetypeSpecificPlugins = {
    [pluginNames.css]: cssPlugin,
    [pluginNames.json]: jsonPlugin,
    [pluginNames.jsonc]: jsoncPlugin,
    [pluginNames.packageJSON]: packageJSONPlugin,
    [pluginNames.markdown]: markdownPlugin
  } as Record<(typeof pluginNames)['css' | 'json' | 'jsonc' | 'packageJSON' | 'markdown'], ESLint.Plugin>;


/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- this is fine here */
let disableTypedCheckedConfig = plugins[pluginNames.typescript as keyof typeof plugins].configs?.['disable-type-checked'];
if (Array.isArray(disableTypedCheckedConfig)) disableTypedCheckedConfig = disableTypedCheckedConfig[0];

if (disableTypedCheckedConfig?.rules) {
  disableTypedCheckedConfig.rules[`${pluginNames.typescript}/consistent-type-imports`] = 'off'; // this one is missing in the config
  disableTypedCheckedConfig.rules[`${pluginNames.custom}/unbound-method`] = 'off';
}

export const disableTypedChecked = disableTypedCheckedConfig ?? {};