import sonarjsPlugin from 'eslint-plugin-sonarjs';

const baseRuleModule = sonarjsPlugin.rules['no-async-constructor'];


/** @type {import('eslint').Rule.RuleModule} */
export default {
  ...baseRuleModule,
  meta: {
    ...baseRuleModule.meta,
    schema: [
      {
        type: 'object',
        properties: {
          allowVoid: {
            type: 'boolean',
            default: false
          }
        },
        additionalProperties: false
      }
    ]
  },

  /** @param {import('eslint').Rule.RuleContext & { options: [{ allowVoid: boolean }, ...any] }} context */
  create(context) {
    const baseRule = baseRuleModule.create(context);

    if (!context.options[0].allowVoid || !('awaitExpression' in baseRule)) return baseRule;

    return {
      ...baseRule,
      AwaitExpression(node) {
        if (node.parent.type === 'UnaryExpression' && node.parent.operator === 'void') return;

        /* eslint-disable-next-line new-cap */
        baseRule.AwaitExpression?.(node);
      }
    };
  }
};