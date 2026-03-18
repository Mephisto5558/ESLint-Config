/** @import { Node, IfStatement } from 'estree'; */
/** @import { Rule } from 'eslint'; */

import unicornPlugin from 'eslint-plugin-unicorn';

const
  DEFAULT_MAX_LENGTH = 120,
  baseRuleModule = unicornPlugin.rules['prefer-ternary'],

  /** @type {Rule.RuleFixer} */
  dummyFixer = {
    replaceTextRange: (range, text) => ({ range, text }),
    insertTextAfter: (node, text) => ({ range: [node.range[1], node.range[1]], text }),
    insertTextBefore: (node, text) => ({ range: [node.range[0], node.range[0]], text }),
    replaceText: (node, text) => ({ range: node.range, text }),
    remove: node => ({ range: node.range, text: '' }),
    removeRange: range => ({ range, text: '' })
  };

/**
 * @param {Node | undefined} node
 * @param {Rule.RuleContext['sourceCode']} sourceCode
 */
function hasTernary(node, sourceCode) {
  if (!node) return false;
  if (node.type === 'ConditionalExpression') return true;

  /** @type {(keyof Node)[]} */
  const keys = sourceCode.visitorKeys[node.type] ?? [];
  for (const key of keys) {
    const value = node[key];
    if (Array.isArray(value)) {
      if (value.some(e => hasTernary(e, sourceCode))) return true;
    }
    else if (hasTernary(value, sourceCode)) return true;
  }
  return false;
}

/** @type {Rule.RuleModule} */
export default {
  meta: {
    ...baseRuleModule.meta,
    schema: [
      baseRuleModule.meta.schema[0],
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

  /** @param {Rule.RuleContext & { options: [any, { maxLength?: number, preventNestedTernary?: boolean }?] }} context */
  create(context) {
    // Object.create to modify `report`
    return baseRuleModule.create(Object.create(
      context,
      {
        options: {
          value: context.options[0] ? [context.options[0]] : [],
          writable: true,
          configurable: true,
          enumerable: true
        },
        report: {
          /** @type {Rule.RuleContext['report']} */
          value: function (descriptor) {
            if (!descriptor.fix || !('node' in descriptor) || descriptor.node.type !== 'IfStatement' || !descriptor.node.loc)
              return context.report(descriptor);

            /** @type {{ node: IfStatement }} */
            const { node } = descriptor;

            if (
              context.options[1]?.preventNestedTernary
              && (hasTernary(node.consequent, context.sourceCode) || hasTernary(node.alternate, context.sourceCode))
            ) return; // Suppress the error

            const
              /** @type {Rule.Fix | Rule.Fix[]} */ fixes = descriptor.fix(dummyFixer),
              fix = Array.isArray(fixes) ? fixes[0] : fixes;
            if (typeof fix?.text !== 'string') return context.report(descriptor);

            const indentation = context.sourceCode.lines[node.loc.start.line - 1].slice(0, node.loc.start.column);
            if (indentation.length + fix.text.length > (context.options[1]?.maxLength ?? DEFAULT_MAX_LENGTH)) return; // Suppress the error

            context.report(descriptor); // Report normally
          },
          writable: true,
          configurable: true,
          enumerable: true
        }
      }
    ));
  }
};