import sonarjsPlugin from 'eslint-plugin-sonarjs';

/* eslint-disable-next-line @limegrass/import-alias/import-alias -- false positive */
import type { Rule } from 'eslint';

const baseRuleModule = sonarjsPlugin.rules['cyclomatic-complexity'];

export default {
  ...baseRuleModule,
  create(context): Rule.RuleListener {
    const newContext = Object.create(context, {
      report: {
        value(descriptor) {
          if ('message' in descriptor) {
            let data;
            try {
              data = JSON.parse(descriptor.message);
              if (typeof data != 'object' || Array.isArray(data)) throw new Error('Message is valid');
            }
            catch { return context.report(descriptor); }

            if (data && 'message' in data && typeof data.message === 'string')
              return context.report({ ...descriptor, message: data.message });
          }

          return context.report(descriptor);
        }
      } as { value: Rule.RuleContext['report'] }
    });

    return baseRuleModule.create(newContext);
  }
} as Rule.RuleModule;