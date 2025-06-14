import tsPlugin from '@typescript-eslint/eslint-plugin';
const { rules } = tsPlugin;

const baseRuleModule = rules['unbound-method'];

export default {
  ...baseRuleModule,
  create(context) {
    const baseRule = baseRuleModule.create(context);

    return {
      ...baseRule,

      /** @param {import('eslint').Rule.Node}node */
      ObjectPattern: node => {
        if (
          /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- I believe this prevents an error */
          node.parent?.init?.type === 'CallExpression'
          && node.parent.init.callee?.name === 'require'
          && node.parent.init.arguments[0]?.value?.startsWith('node:')
        ) return;

        /* eslint-disable-next-line new-cap */
        baseRule.ObjectPattern(node);
      }
    };
  }
};