/** @import { Node, IfStatement } from 'estree'; */

import unicornPlugin from 'eslint-plugin-unicorn';
import { pluginNames } from '../data.ts';

/* eslint-disable-next-line @limegrass/import-alias/import-alias -- false positive */
import type { JSSyntaxElement, Rule } from 'eslint';
import type { IfStatement, Node } from 'estree';

const
  DEFAULT_MAX_LENGTH = 120,
  baseRuleModule = unicornPlugin.rules?.['prefer-ternary'];

if (!baseRuleModule) throw new Error(`${pluginNames.unicorn}/prefer-ternary not found`);

const dummyFixer = {
  /* eslint-disable @typescript-eslint/no-non-null-assertion -- fine due to these being dummy fixes */
  replaceTextRange: (range, text): Rule.Fix => ({ range, text }),
  insertTextAfter: (node, text): Rule.Fix => ({ range: [node.range![1], node.range![1]], text }),
  insertTextBefore: (node, text): Rule.Fix => ({ range: [node.range![0], node.range![0]], text }),
  replaceText: (node, text): Rule.Fix => ({ range: node.range!, text }),
  remove: (node): Rule.Fix => ({ range: node.range!, text: '' }),
  removeRange: (range): Rule.Fix => ({ range, text: '' }),
  insertTextAfterRange: (range, text): Rule.Fix => ({ range: [range[1], range[1]], text }),
  insertTextBeforeRange: (range, text): Rule.Fix => ({ range: [range[0], range[0]], text })
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
} satisfies Partial<Rule.RuleFixer>;

function hasTernary(node: Node | null | undefined, sourceCode: Rule.RuleContext['sourceCode']): boolean {
  if (!node) return false;
  if (node.type === 'ConditionalExpression') return true;

  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- false positive */
  const keys = sourceCode.visitorKeys[node.type] as (keyof Node)[] | undefined ?? [];
  for (const key of keys) {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- false positive */
    const value = node[key] as Node | Node[] | undefined;
    if (Array.isArray(value)) {
      if (value.some(e => hasTernary(e, sourceCode))) return true;
    }
    else if (hasTernary(value, sourceCode)) return true;
  }
  return false;
}

function isIfStatement(node: JSSyntaxElement | undefined): node is IfStatement & { loc: NonNullable<IfStatement['loc']> } {
  return node?.type === 'IfStatement' && node.loc != undefined;
}

function isIterable<T>(obj: T | Iterable<T>): obj is Iterable<T> {
  return obj && typeof obj === 'object' && Symbol.iterator in obj;
}

export default {
  meta: {
    ...baseRuleModule.meta,
    schema: [
      Array.isArray(baseRuleModule.meta?.schema) ? baseRuleModule.meta.schema[0] : baseRuleModule.meta?.schema,
      {
        type: 'object',
        properties: {
          maxLength: { type: 'number', minimum: 0 },
          preventNestedTernary: { type: 'boolean' }
        },
        additionalProperties: false
      }
    ]
  },

  create(context: Rule.RuleContext & { options: [unknown, { maxLength?: number; preventNestedTernary?: boolean }?] }): Rule.RuleListener {
    // Object.create to modify `report`
    return baseRuleModule.create(Object.create(
      context,
      {
        options: {
          value: context.options[0] ? [context.options[0]] : []
        },
        report: {
          value: function (descriptor) {
            if (!descriptor.fix || !('node' in descriptor)) return context.report(descriptor);

            const { node } = descriptor;
            if (!isIfStatement(node)) return context.report(descriptor);

            if (
              context.options[1]?.preventNestedTernary
              && (hasTernary(node.consequent, context.sourceCode) || hasTernary(node.alternate, context.sourceCode))
            ) return; // Suppress the error

            const
              fixes = descriptor.fix(dummyFixer),
              fix = isIterable(fixes) ? [...fixes][0] : fixes;

            if (!fix || !('text' in fix) || typeof fix.text !== 'string') return context.report(descriptor);

            const indentation = context.sourceCode.lines[node.loc.start.line - 1]?.slice(0, node.loc.start.column);
            if (indentation && indentation.length + fix.text.length > (context.options[1]?.maxLength ?? DEFAULT_MAX_LENGTH))
              return; // Suppress the error

            context.report(descriptor); // Report normally
          }
        } as { value: Rule.RuleContext['report'] }
      }
    ));
  }
} as Rule.RuleModule;