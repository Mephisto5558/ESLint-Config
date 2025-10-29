/** @import { Linter } from 'eslint' */

import config, { getModifiedRule } from './default_eslint.config.js';

/** @type {Linter.Config[]} */
export default [
  ...config.filter(e => e.name != 'eslint-config:cwd-gitignore'),
  {
    files: ['**/test.*'],
    rules: {
      'unicorn/no-empty-file': 'off'
    }
  },
  {
    files: ['configs/*.jsonc'],
    rules: {
      'jsonc/key-name-spacing': getModifiedRule(config,'jsonc/key-name-spacing', {
        ignores: ['^(require|valid)-.*']
      }),
      'jsonc/sort-array-values': 'off', // config array order is important
      'jsonc/sort-keys': getModifiedRule(config, 'jsonc/sort-keys', {
        pathPattern: '^$' // anything below top-level is manually ordered according to the plugin docs
      })
    }
  }
];