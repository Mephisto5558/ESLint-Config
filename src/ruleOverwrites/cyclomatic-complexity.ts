import sonarjsPlugin from 'eslint-plugin-sonarjs';
import type { Rule } from 'eslint';

/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
const baseRuleModule = sonarjsPlugin.rules!['cyclomatic-complexity']!;

export default {
  ...baseRuleModule,
  create(context): Rule.RuleListener {
    const newContext = Object.create(context, {
      report: {
        value(descriptor) {
          if ('message' in descriptor) {
            let data;
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
            try { data = JSON.parse(descriptor.message) as JSONObject | undefined; }
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