/** @import { Linter } from 'eslint' */

import config, { getModifiedRule, pluginNames } from './default_eslint.config.js';

/** @type {Linter.Config[]} */
export default [
  ...config.filter(e => e.name != 'eslint-config:cwd-gitignore'),
  {
    files: ['**/test.*'],
    linterOptions: {
      reportUnusedDisableDirectives: false
    },
    rules: {
      [`${pluginNames.unicorn}/no-empty-file`]: 'off',
      [`${pluginNames.css}/no-empty-blocks`]: 'off'
    }
  },
  {
    files: ['configs/*.jsonc'],
    rules: {
      [`${pluginNames.jsonc}/key-name-casing`]: getModifiedRule(config, `${pluginNames.jsonc}/key-name-casing`, {
        ignores: ['^(require|valid)-.*']
      }),
      [`${pluginNames.jsonc}/sort-array-values`]: 'off', // config array order is important
      [`${pluginNames.jsonc}/sort-keys`]: getModifiedRule(config, `${pluginNames.jsonc}/sort-keys`, {
        pathPattern: '^$' // anything below top-level is manually ordered according to the plugin docs
      })
    }
  },
  {
    files: ['ruleOverwrites/*.js'],
    rules: {
      [`${pluginNames.unicorn}/filename-case`]: 'off' // prefer consistency with rule names
    }
  }
];