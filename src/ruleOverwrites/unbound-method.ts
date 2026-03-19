import tsPlugin from '@typescript-eslint/eslint-plugin';
import type { Rule } from 'eslint';

const
  { rules } = tsPlugin,
  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
  baseRuleModule = rules['unbound-method']!;

export default {
  ...baseRuleModule,
  create(context): Rule.RuleListener {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
    const baseRule = baseRuleModule.create(context as never) as Rule.RuleListener;

    return {
      ...baseRule,

      ObjectPattern(node): void {
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
} as Rule.RuleModule;