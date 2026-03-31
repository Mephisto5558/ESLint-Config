import eslintPluginPlugin_ from 'eslint-plugin-eslint-plugin';
import config, { getModifiedRule, pluginNames } from './src/index.ts';

const eslintPluginPlugin = eslintPluginPlugin_ as typeof eslintPluginPlugin_ & { meta: { namespace?: string } };
eslintPluginPlugin.meta.namespace ??= 'eslint-plugin';

export default [
  ...config.filter(e => e.name != 'eslint-config:cwd-gitignore'),
  {
    name: 'rule-overwrites:test',
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
    name: 'rule-overwrites:config-jsonc',
    files: ['configs/**/*.jsonc'],
    rules: {
      [`${pluginNames.jsonc}/key-name-casing`]: 'off', // depends on the plugins
      [`${pluginNames.jsonc}/sort-array-values`]: 'off', // config array order is important
      ...getModifiedRule(config, `${pluginNames.jsonc}/sort-keys`, [{
        pathPattern: '^$' // anything below top-level is manually ordered according to the plugin docs
      }])
    }
  },
  {
    name: 'rule-overwrites:ruleOverwrites',
    files: ['src/ruleOverwrites/**'],
    plugins: {
      [eslintPluginPlugin.meta.namespace]: eslintPluginPlugin
    },
    rules: {
      [`${pluginNames.unicorn}/filename-case`]: 'off', // prefer consistency with rule names
      [`${eslintPluginPlugin.meta.namespace}/fixer-return`]: 'error',
      [`${eslintPluginPlugin.meta.namespace}/meta-property-ordering`]: [
        'warn',
        ['type', 'docs', 'fixable', 'hasSuggestions', 'deprecated', 'replacedBy', 'schema', 'defaultOptions', 'messages'] // default
      ],
      [`${eslintPluginPlugin.meta.namespace}/no-deprecated-context-methods`]: 'off', // Handled by `@typescript-eslint/no-deprecated`
      [`${eslintPluginPlugin.meta.namespace}/no-deprecated-report-api`]: 'off', // Handled by `@typescript-eslint/no-deprecated`
      [`${eslintPluginPlugin.meta.namespace}/no-matching-violation-suggest-message-ids`]: 'warn',
      [`${eslintPluginPlugin.meta.namespace}/no-meta-replaced-by`]: 'off', // Handled by `@typescript-eslint/no-deprecated`
      [`${eslintPluginPlugin.meta.namespace}/no-meta-schema-default`]: 'warn',
      [`${eslintPluginPlugin.meta.namespace}/no-missing-message-ids`]: 'error',
      [`${eslintPluginPlugin.meta.namespace}/no-missing-placeholders`]: 'error',
      [`${eslintPluginPlugin.meta.namespace}/no-property-in-node`]: [
        'warn',
        {
          // additionalNodeTypeFiles: []
        }
      ],
      [`${eslintPluginPlugin.meta.namespace}/no-unused-message-ids`]: 'warn',
      [`${eslintPluginPlugin.meta.namespace}/no-unused-placeholders`]: 'warn',
      [`${eslintPluginPlugin.meta.namespace}/no-useless-token-range`]: 'warn',
      [`${eslintPluginPlugin.meta.namespace}/prefer-message-ids`]: 'warn',
      [`${eslintPluginPlugin.meta.namespace}/prefer-object-rule`]: 'off', // Handled by `@typescript-eslint/no-deprecated`
      [`${eslintPluginPlugin.meta.namespace}/prefer-placeholders`]: 'off',
      [`${eslintPluginPlugin.meta.namespace}/prefer-replace-text`]: 'warn',
      [`${eslintPluginPlugin.meta.namespace}/report-message-format`]: [
        'warn',
        String.raw`^[A-Z].*\.$`
      ],
      [`${eslintPluginPlugin.meta.namespace}/require-meta-default-options`]: 'warn',
      [`${eslintPluginPlugin.meta.namespace}/require-meta-docs-description`]: [
        'warn',
        {
          // pattern: ""
        }
      ],
      [`${eslintPluginPlugin.meta.namespace}/require-meta-docs-recommended`]: [
        'off',
        {
          allowNonBoolean: false
        }
      ],
      [`${eslintPluginPlugin.meta.namespace}/require-meta-docs-url`]: [
        'off',
        {
          // pattern: ""
        }
      ],
      [`${eslintPluginPlugin.meta.namespace}/require-meta-fixable`]: [
        'warn',
        {
          catchNoFixerButFixableProperty: true
        }
      ],
      [`${eslintPluginPlugin.meta.namespace}/require-meta-has-suggestions`]: 'error', // error because ESLint throws if it's missing
      [`${eslintPluginPlugin.meta.namespace}/require-meta-schema`]: 'off', // Handled by eslint internally
      [`${eslintPluginPlugin.meta.namespace}/require-meta-schema-description`]: 'warn',
      [`${eslintPluginPlugin.meta.namespace}/require-meta-type`]: 'warn'

      // [TESTS]
      /* [`${eslintPluginPlugin.meta.namespace}/consistent-output`]: '',
         [`${eslintPluginPlugin.meta.namespace}/no-identical-tests`]: '',
         [`${eslintPluginPlugin.meta.namespace}/no-only-tests`]: '',
         [`${eslintPluginPlugin.meta.namespace}/prefer-output-null`]: '',
         [`${eslintPluginPlugin.meta.namespace}/require-test-case-name`]: '',
         [`${eslintPluginPlugin.meta.namespace}/test-case-property-ordering`]: '',
         [`${eslintPluginPlugin.meta.namespace}/test-case-shorthand-strings`]: '',
         [`${eslintPluginPlugin.meta.namespace}/unique-test-case-names`]: '' */
    }
  }
] as typeof config;