import sonarjsPlugin from 'eslint-plugin-sonarjs';

const baseRuleModule = sonarjsPlugin.rules['cognitive-complexity'];


/** @type {import('eslint').Rule.RuleModule} */
export default {
  ...baseRuleModule,


};