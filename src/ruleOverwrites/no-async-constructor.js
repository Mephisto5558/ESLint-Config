/** @import { Rule } from 'eslint' */

import sonarjsPlugin from 'eslint-plugin-sonarjs';

const baseRuleModule = sonarjsPlugin.rules['no-async-constructor'];


/** @type {Rule.RuleModule} */
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

  /** @param {Rule.RuleContext & { options: [{ allowVoid: boolean }, ...any] }} context */
  create(context) {
    const baseRule = baseRuleModule.create(context);

    if (!context.options[0].allowVoid) return baseRule;

    return {
      ...baseRule,
      CallExpression(node) {
        if (node.parent.type === 'UnaryExpression' && node.parent.operator === 'void') return;

        /* eslint-disable-next-line new-cap */
        baseRule.CallExpression?.(node);
      }
    };
  }
};