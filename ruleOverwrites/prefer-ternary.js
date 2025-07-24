import unicornPlugin from 'eslint-plugin-unicorn';

const DEFAULT_MAX_LENGTH = 120;
const baseRuleModule = unicornPlugin.rules['prefer-ternary'];

const dummyFixer = {
  replaceTextRange: (range, text) => ({ range, text }),
  insertTextAfter: (node, text) => ({ range: [node.range[1], node.range[1]], text }),
  insertTextBefore: (node, text) => ({ range: [node.range[0], node.range[0]], text }),
  replaceText: (node, text) => ({ range: node.range, text }),
  remove: node => ({ range: node.range, text: '' }),
  removeRange: range => ({ range, text: '' })
};

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
    const sourceCode = context.getSourceCode();

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
          value: function (descriptor) {
            const fix = descriptor.fix?.(dummyFixer)?.[0];
            if (typeof fix?.text !== 'string') return void context.report(descriptor);

            const indentation = sourceCode.lines[descriptor.node.loc.start.line - 1].slice(0, descriptor.node.loc.start.column);
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