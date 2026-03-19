import config, { getModifiedRule, pluginNames } from './src/index.ts';
/* eslint-disable-next-line @limegrass/import-alias/import-alias -- false positive */
import type { Linter } from 'eslint';

export default [
  ...config.filter(e => e.name != 'eslint-config:cwd-gitignore'),
  {
    ignores: ['dist/**']
  },
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
      ...getModifiedRule(config, `${pluginNames.jsonc}/key-name-casing`, [{
        ignores: ['^(require|valid)-.*']
      }]),
      [`${pluginNames.jsonc}/sort-array-values`]: 'off', // config array order is important
      ...getModifiedRule(config, `${pluginNames.jsonc}/sort-keys`, [{
        pathPattern: '^$' // anything below top-level is manually ordered according to the plugin docs
      }])
    }
  },
  {
    files: ['src/ruleOverwrites/*'],
    rules: {
      [`${pluginNames.unicorn}/filename-case`]: 'off' // prefer consistency with rule names
    }
  }
] as Linter.Config[];