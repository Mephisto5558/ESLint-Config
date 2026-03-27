import sonarjsPlugin from 'eslint-plugin-sonarjs';

/* eslint-disable-next-line @limegrass/import-alias/import-alias -- false positive */
import type { Rule } from 'eslint';

const baseRuleModule = sonarjsPlugin.rules['no-async-constructor'];


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

  create(context: Rule.RuleContext & { options: [{ allowVoid: boolean }, ...unknown[]] }): Rule.RuleListener {
    const baseRule = baseRuleModule.create(context);

    if (!context.options[0].allowVoid) return baseRule;

    return {
      ...baseRule,
      CallExpression(node): void {
        if (node.parent.type === 'UnaryExpression' && node.parent.operator === 'void') return;

        /* eslint-disable-next-line new-cap */
        baseRule.CallExpression?.(node);
      }
    };
  }
} as Rule.RuleModule;