import tsPlugin from '@typescript-eslint/eslint-plugin';

const
  { rules } = tsPlugin,
  baseRuleModule = rules['unbound-method'];

/** @type {import('eslint').Rule.RuleModule} */
export default {
  ...baseRuleModule,
  create(context) {
    const baseRule = baseRuleModule.create(context);

    return {
      ...baseRule,

      ObjectPattern: node => {
        if (
          /* eslint-disable-next-line sonarjs/expression-complexity */
          node.parent.type === 'VariableDeclarator'
          && node.parent.init?.type === 'CallExpression'
          && node.parent.init.callee.type === 'Identifier'
          && node.parent.init.callee.name === 'require'
          && node.parent.init.arguments[0]?.type === 'Literal'
          && typeof node.parent.init.arguments[0].value === 'string'
          && node.parent.init.arguments[0].value.startsWith('node:')
        ) return;

        /* eslint-disable-next-line new-cap */
        baseRule.ObjectPattern?.(node);
      }
    };
  }
};