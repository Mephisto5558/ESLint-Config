/* eslint-disable import-x/max-dependencies -- all needed here */

/**
 * @import { ESLint } from 'eslint'
 * @import { pluginNames as pluginNamesT } from './default_eslint.config.d.ts' */

import { readFileSync } from 'node:fs';
import { basename, parse, resolve } from 'node:path';

import cssPlugin from '@eslint/css';
import jsonPlugin from '@eslint/json';
import stylisticPlugin from '@stylistic/eslint-plugin';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import htmlPluginRaw from 'eslint-plugin-html';
import importPlugin from 'eslint-plugin-import-x';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import jsoncPlugin from 'eslint-plugin-jsonc';
import packageJSONPlugin from 'eslint-plugin-package-json';
import regExPlugin from 'eslint-plugin-regexp';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';
import customPlugin from './ruleOverwrites/index.js';

/** @type {ESLint.Plugin} */
/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- this plugin does not export types */
const htmlPlugin = htmlPluginRaw;

export const
  tsGlob = '.{m,c,}ts{,x}',
  jsGlob = '.{m,c,}js{,x}',
  /** @type {pluginNamesT} */ pluginNames = {
    /* eslint-disable import-x/no-named-as-default-member, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      -- consitency and future-proofing */
    css: cssPlugin.meta.namespace ?? 'css',
    html: htmlPlugin.meta?.namespace ?? 'html',
    import: importPlugin.meta.namespace ?? 'import-x',
    jsdoc: jsdocPlugin.meta?.namespace ?? 'jsdoc',
    json: jsonPlugin.meta.namespace ?? 'json',
    jsonc: jsoncPlugin.meta.namespace ?? 'jsonc',
    packageJSON: packageJSONPlugin.meta.namespace ?? 'package-json',
    regex: regExPlugin.meta.namespace ?? 'regexp',
    sonar: sonarjsPlugin.meta.namespace ?? 'sonarjs',
    stylistic: stylisticPlugin.meta?.namespace ?? '@stylistic',
    typescript: typescriptPlugin.meta.namespace ?? '@typescript-eslint',
    unicorn: unicornPlugin.meta?.namespace ?? 'unicorn',

    custom: customPlugin.meta.namespace
    /* eslint-enable import-x/no-named-as-default-member, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  },
  plugins = {
    [pluginNames.html]: htmlPlugin,
    [pluginNames.import]: importPlugin,
    [pluginNames.jsdoc]: jsdocPlugin,
    [pluginNames.regex]: regExPlugin,
    [pluginNames.sonar]: sonarjsPlugin,
    [pluginNames.stylistic]: stylisticPlugin,
    [pluginNames.typescript]: typescriptPlugin,
    [pluginNames.unicorn]: unicornPlugin,

    [pluginNames.custom]: customPlugin
  },
  filetypeSpecificPlugins = {
    [pluginNames.css]: cssPlugin,
    [pluginNames.json]: jsonPlugin,
    [pluginNames.jsonc]: jsoncPlugin,
    [pluginNames.packageJSON]: packageJSONPlugin
  };

/**
 * @param {string} path relative to import.meta.dirname
 * @returns {JSONObject} */
export function importJsonC(path) {
  const
    fullPath = resolve(import.meta.dirname, path),
    parsedPath = parse(fullPath),
    /** @type {JSONObject} */ rules = JSON.parse(
      readFileSync(fullPath, 'utf8')
        .replaceAll(/\/\*.*?\*\//gs, '') // remove block comments
        .replaceAll(/\/\/.*/g, '') // remove line comments
    );

  let namespace = basename(parsedPath.dir);
  namespace = namespace.startsWith('@') ? `${namespace}/` : '';

  let filename = parsedPath.name;
  if (filename.startsWith(pluginNames.sonar)) filename = `${pluginNames.sonar}/`;
  else if (filename.startsWith('eslint-')) filename = filename.slice('eslint-'.length) + '/';
  else filename = filename == 'eslint' ? '' : `${filename}/`;

  return Object.fromEntries(Object.entries(rules).filter(([, v]) => v !== '').map(([k, v]) => [`${namespace}${filename}${k}`, v]));
}

/** @type {ReturnType<importJsonC> & { 'jsdoc/check-tag-names'?: [string, Record<string, boolean> | undefined] | undefined }} */
export const rules = {
  ...importJsonC('configs/eslint.jsonc'),
  ...importJsonC('configs/@stylistic.jsonc'),
  ...importJsonC('configs/@typescript-eslint.jsonc'),
  ...importJsonC('configs/jsdoc.jsonc'),
  ...importJsonC('configs/regexp.jsonc'),
  ...importJsonC('configs/sonarjs.jsonc'),
  ...importJsonC('configs/unicorn.jsonc'),
  ...importJsonC('configs/import-x.jsonc'),
  ...importJsonC('configs/custom.jsonc')
};