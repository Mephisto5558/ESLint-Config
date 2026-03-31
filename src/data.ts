/* eslint-disable import-x/max-dependencies -- all needed here */

import { readFileSync } from 'node:fs';
import { basename, parse, resolve } from 'node:path';

import cssPlugin from '@eslint/css';
import jsonPlugin from '@eslint/json';
import markdownPlugin from '@eslint/markdown';
import eslintCommentsPlugin from '@eslint-community/eslint-plugin-eslint-comments';
import importAliasPlugin from '@limegrass/eslint-plugin-import-alias';
import stylisticPlugin from '@stylistic/eslint-plugin';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';

// @ts-expect-error not important
import _htmlPlugin from 'eslint-plugin-html';
import importPlugin from 'eslint-plugin-import-x';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import jsoncPlugin from 'eslint-plugin-jsonc';
import packageJSONPlugin from 'eslint-plugin-package-json';
import regExPlugin from 'eslint-plugin-regexp';
import securityPlugin from 'eslint-plugin-security';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';
/* eslint-disable-next-line import-x/no-unresolved -- required for .js extension in ts files */
import customPlugin from './ruleOverwrites/index.js';

/* eslint-disable-next-line @limegrass/import-alias/import-alias -- false positive */
import type { ESLint } from 'eslint';

const
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- eslint-plugin-html cannot be augmented */
  htmlPlugin = _htmlPlugin as ESLint.Plugin,
  getNamespace = <T extends ESLint.Plugin>(
    plugin: T, defaultNamespace: string
  ): T['meta'] extends { namespace: string } ? T['meta']['namespace'] : string => plugin.meta?.namespace ?? defaultNamespace;

export const
  tsGlob = '.{m,c,}ts{,x}',
  jsGlob = '.{m,c,}js{,x}',
  pluginNames = {
    css: getNamespace(cssPlugin, 'css'),
    eslintComments: getNamespace(eslintCommentsPlugin, '@eslint-community/eslint-comments'),
    html: getNamespace(htmlPlugin, 'html'),
    import: getNamespace(importPlugin, 'import-x'),
    importAlias: getNamespace(importAliasPlugin, '@limegrass/import-alias'),
    jsdoc: getNamespace(jsdocPlugin, 'jsdoc'),
    json: getNamespace(jsonPlugin, 'json'),
    jsonc: getNamespace(jsoncPlugin, 'jsonc'),
    markdown: getNamespace(markdownPlugin, 'markdown'),
    packageJSON: getNamespace(packageJSONPlugin, 'package-json'),
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
    [pluginNames.import]: importPlugin,
    [pluginNames.importAlias]: importAliasPlugin,
    [pluginNames.jsdoc]: jsdocPlugin,
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

/** @param path relative to import.meta.dirname */
export function importRules(path: string): ESLint.ConfigData['rules'] {
  const
    fullPath = resolve(import.meta.dirname, '..', path),
    parsedPath = parse(fullPath),
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- this cannot be typeguarded easily */
    rules = JSON.parse(
      readFileSync(fullPath, 'utf8')
        .replaceAll(/\/\*.*?\*\//gs, '') // remove block comments
        .replaceAll(/\/\/.*/g, '') // remove line comments
    ) as NonNullable<ESLint.ConfigData['rules']>;

  let namespace = basename(parsedPath.dir);
  namespace = namespace.startsWith('@') ? `${namespace}/` : '';

  let filename = parsedPath.name;
  if (filename.startsWith(pluginNames.sonar)) filename = `${pluginNames.sonar}/`;
  else filename = filename == 'eslint' ? '' : `${filename}/`;

  /* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- support for empty strings */
  return Object.fromEntries(Object.entries(rules).map(([k, v]) => [`${namespace}${filename}${k}`, v || 'off']));
}

export const rules: ReturnType<typeof importRules>
  & { 'jsdoc/check-tag-names'?: [string, Record<string, boolean> | undefined] | undefined } = {
    ...importRules('configs/@eslint-community/eslint-comments.jsonc'),
    ...importRules('configs/eslint/eslint.jsonc'),
    ...importRules('configs/@stylistic.jsonc'),
    ...importRules('configs/@typescript-eslint.jsonc'),
    ...importRules('configs/jsdoc.jsonc'),
    ...importRules('configs/regexp.jsonc'),
    ...importRules('configs/security.jsonc'),
    ...importRules('configs/sonarjs.jsonc'),
    ...importRules('configs/unicorn.jsonc'),
    ...importRules('configs/import-x.jsonc'),
    ...importRules('configs/@limegrass/import-alias.jsonc'),
    ...importRules('configs/custom.jsonc')
  };