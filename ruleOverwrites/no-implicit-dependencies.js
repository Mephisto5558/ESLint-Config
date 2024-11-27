import { rules } from 'eslint-plugin-sonarjs';

const baseRuleModule = rules['no-implicit-dependencies'];

export default {
  ...baseRuleModule,
  create(context) {
    const baseRule = baseRuleModule.create(context);

    return {
      ...baseRule,

      /** @param {import('eslint').Rule.Node}node*/
      CallExpression: node => {
        if (
          node.callee.type === 'Identifier'
          && node.callee.name === 'require'
          && node.arguments.length === 1
          && node.arguments[0].value?.startsWith('#')
        ) return;

        /* eslint-disable-next-line new-cap */
        baseRule.CallExpression(node);
      },

      /** @param {import('eslint').Rule.Node}node*/
      ImportDeclaration: node => {
        if (node.source?.value?.startsWith('#')) return;

        /* eslint-disable-next-line new-cap */
        baseRule.ImportDeclaration(node);
      }
    };
  }
};