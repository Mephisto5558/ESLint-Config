import sonarjsPlugin from 'eslint-plugin-sonarjs';

import type { Rule } from 'eslint';

const baseRuleModule = sonarjsPlugin.rules['cyclomatic-complexity'];

/* eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- false positive, required by TS */
export default {
  ...baseRuleModule,
  create: (context): Rule.RuleListener => baseRuleModule.create(Object.create(context, {
    /* eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- false positive */
    report: {
      value(descriptor) {
        if ('message' in descriptor) {
          let data;
          try {
            data = JSON.parse(descriptor.message);
            if (typeof data !== 'object' || Array.isArray(data)) throw new Error('Message is valid');
          }
          catch { return context.report(descriptor); }

          if (data && 'message' in data && typeof data.message === 'string')
            return context.report({ ...descriptor, message: data.message });
        }

        return context.report(descriptor);
      }
    } as { value: Rule.RuleContext['report'] }
  }))
} as Rule.RuleModule;