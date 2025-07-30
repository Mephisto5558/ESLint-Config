import unicornPlugin from 'eslint-plugin-unicorn';

const
  DEFAULT_MAX_LENGTH = 120,
  baseRuleModule = unicornPlugin.rules['prefer-ternary'],

  /** @type {import('eslint').Rule.RuleFixer} */
  dummyFixer = {
    replaceTextRange: (range, text) => ({ range, text }),
    insertTextAfter: (node, text) => ({ range: [node.range[1], node.range[1]], text }),
    insertTextBefore: (node, text) => ({ range: [node.range[0], node.range[0]], text }),
    replaceText: (node, text) => ({ range: node.range, text }),
    remove: node => ({ range: node.range, text: '' }),
    removeRange: range => ({ range, text: '' })
  };

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    ...baseRuleModule.meta,
    schema: [
      baseRuleModule.meta.schema[0],
      {
        type: 'number',
        minimum: 0
      }
    ]
  },

  create(context) {
    // Object.create to modify `report`
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
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
          /** @type {import('eslint').Rule.RuleContext['report']} */
          value: function (descriptor) {
            if (!descriptor.fix || !('node' in descriptor) || descriptor.node.type !== 'IfStatement' || !descriptor.node.loc)
              return context.report(descriptor);

            /** @type {import('eslint').Rule.Fix | import('eslint').Rule.Fix[]} */
            const
              fixes = descriptor.fix(dummyFixer),
              fix = Array.isArray(fixes) ? fixes[0] : fixes;
            if (typeof fix?.text !== 'string') return context.report(descriptor);

            const indentation = context.sourceCode.lines[descriptor.node.loc.start.line - 1].slice(0, descriptor.node.loc.start.column);
            if (indentation.length + fix.text.length > (context.options[1] ?? DEFAULT_MAX_LENGTH)) return; // Suppress the error

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