/** @import { Linter } from 'eslint' */

import config from './default_eslint.config.js';

const
  sortKeysRule = config.find(e => e.rules && 'jsonc/sort-keys' in e.rules).rules['jsonc/sort-keys'],
  keyNameCasingRule = config.find(e => e.rules && 'jsonc/key-name-casing' in e.rules).rules['jsonc/key-name-casing'];

/** @type {Linter.Config[]} */
export default [
  ...config,
  {
    files: ['**/test.*'],
    rules: {
      'unicorn/no-empty-file': 'off'
    }
  },
  {
    files: ['configs/*.jsonc'],
    rules: {
      ...Array.isArray(keyNameCasingRule)
        ? {
            'jsonc/key-name-casing': [
              keyNameCasingRule[0],
              {
                ...keyNameCasingRule[1],
                /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
                ignores: [...'ignores' in keyNameCasingRule[1] ? keyNameCasingRule[1].ignores : [], '^(require|valid)-.*']
              }
            ]
          }
        : {},
      'jsonc/sort-array-values': 'off', // config array order is important
      ...Array.isArray(sortKeysRule)
        ? {
            'jsonc/sort-keys': [
              sortKeysRule[0],
              {
                ...sortKeysRule[1],
                pathPattern: '^$' // anything below top-level is manually ordered according to the plugin docs
              }
            ]
          }
        : {}
    }
  }
];