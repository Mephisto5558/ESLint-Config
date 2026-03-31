import tsPlugin from '@typescript-eslint/eslint-plugin';
import { pluginNames } from '../data.ts';

/* eslint-disable-next-line @limegrass/import-alias/import-alias -- false positive */
import type { Rule } from 'eslint';

const
  { rules } = tsPlugin,
  baseRuleModule = rules['unbound-method'];

if (!baseRuleModule) throw new Error(`${pluginNames.typescript}/prefer-ternary not found`);

export default {
  ...baseRuleModule,
  create(context): Rule.RuleListener {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The base rule does not export the needed interface. */
    const baseRule = baseRuleModule.create(context as never) as Rule.RuleListener;

    return {
      ...baseRule,

      ObjectPattern(node): void {
        if (
          /* eslint-disable-next-line sonarjs/expression-complexity -- all needed */
          node.parent.type === 'VariableDeclarator'
          && node.parent.init?.type === 'CallExpression'
          && node.parent.init.callee.type === 'Identifier'
          && node.parent.init.callee.name === 'require'
          && node.parent.init.arguments[0]?.type === 'Literal'
          && typeof node.parent.init.arguments[0].value === 'string'
          && node.parent.init.arguments[0].value.startsWith('node:')
        ) return;

        /* eslint-disable-next-line new-cap -- eslint wants it this way */
        baseRule.ObjectPattern?.(node);
      }
    };
  }
} as Rule.RuleModule;