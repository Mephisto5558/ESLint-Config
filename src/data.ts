/* eslint-disable import-x/max-dependencies -- all needed here */

import { readFileSync } from 'node:fs';
import { basename, parse, resolve } from 'node:path';

import cssPlugin from '@eslint/css';
import jsonPlugin from '@eslint/json';
import importAliasPlugin from '@limegrass/eslint-plugin-import-alias';
import stylisticPlugin from '@stylistic/eslint-plugin';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';

// @ts-expect-error not important
import htmlPlugin from 'eslint-plugin-html';
import importPlugin from 'eslint-plugin-import-x';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import jsoncPlugin from 'eslint-plugin-jsonc';
import packageJSONPlugin from 'eslint-plugin-package-json';
import regExPlugin from 'eslint-plugin-regexp';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';
/* eslint-disable-next-line import-x/no-unresolved -- required for .js extension in ts files */
import customPlugin from './ruleOverwrites/index.js';

import type { ESLint } from 'eslint';

const getNamespace = <T extends ESLint.Plugin>(
  plugin: T, defaultNamespace: string
): T['meta'] extends { namespace: string } ? T['meta']['namespace'] : string => plugin.meta?.namespace ?? defaultNamespace;

export const
  tsGlob = '.{m,c,}ts{,x}',
  jsGlob = '.{m,c,}js{,x}',
  pluginNames = {
    css: getNamespace(cssPlugin, 'css'),
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
    html: getNamespace(htmlPlugin as ESLint.Plugin, 'html'),
    import: getNamespace(importPlugin, 'import-x'),
    importAlias: getNamespace(importAliasPlugin, '@limegrass/import-alias'),
    jsdoc: getNamespace(jsdocPlugin, 'jsdoc'),
    json: getNamespace(jsonPlugin, 'json'),
    jsonc: getNamespace(jsoncPlugin, 'jsonc'),
    packageJSON: getNamespace(packageJSONPlugin, 'package-json'),
    regex: getNamespace(regExPlugin, 'regexp'),
    sonar: getNamespace(sonarjsPlugin, 'sonarjs'),
    stylistic: getNamespace(stylisticPlugin, '@stylistic'),
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
    typescript: getNamespace(typescriptPlugin as unknown as ESLint.Plugin, '@typescript-eslint'),
    unicorn: getNamespace(unicornPlugin, 'unicorn'),

    custom: getNamespace(customPlugin, 'custom')
  } as const,
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
  plugins = {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
    [pluginNames.html]: htmlPlugin as ESLint.Plugin,
    [pluginNames.import]: importPlugin,
    [pluginNames.importAlias]: importAliasPlugin,
    [pluginNames.jsdoc]: jsdocPlugin,
    [pluginNames.regex]: regExPlugin,
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
    [pluginNames.packageJSON]: packageJSONPlugin
  } as Record<(typeof pluginNames)['css' | 'json' | 'jsonc' | 'packageJSON'], ESLint.Plugin>;

/** @param path relative to import.meta.dirname */
export function importRules(path: string): ESLint.ConfigData['rules'] {
  const
    fullPath = resolve(import.meta.dirname, '..', path),
    parsedPath = parse(fullPath),
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
    rules = JSON.parse(
      readFileSync(fullPath, 'utf8')
        .replaceAll(/\/\*.*?\*\//gs, '') // remove block comments
        .replaceAll(/\/\/.*/g, '') // remove line comments
    ) as NonNullable<ESLint.ConfigData['rules']>;

  let namespace = basename(parsedPath.dir);
  namespace = namespace.startsWith('@') ? `${namespace}/` : '';

  let filename = parsedPath.name;
  if (filename.startsWith(pluginNames.sonar)) filename = `${pluginNames.sonar}/`;
  else if (filename.startsWith('eslint-')) filename = filename.slice('eslint-'.length) + '/';
  else filename = filename == 'eslint' ? '' : `${filename}/`;

  /* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- support for empty strings */
  return Object.fromEntries(Object.entries(rules).map(([k, v]) => [`${namespace}${filename}${k}`, v || 'off']));
}

export const rules: ReturnType<typeof importRules>
  & { 'jsdoc/check-tag-names'?: [string, Record<string, boolean> | undefined] | undefined } = {
    ...importRules('configs/eslint.jsonc'),
    ...importRules('configs/@stylistic.jsonc'),
    ...importRules('configs/@typescript-eslint.jsonc'),
    ...importRules('configs/jsdoc.jsonc'),
    ...importRules('configs/regexp.jsonc'),
    ...importRules('configs/sonarjs.jsonc'),
    ...importRules('configs/unicorn.jsonc'),
    ...importRules('configs/import-x.jsonc'),
    ...importRules('configs/@limegrass/import-alias.jsonc'),
    ...importRules('configs/custom.jsonc')
  };