/** @import { Rule } from 'eslint' */

import sonarjsPlugin from 'eslint-plugin-sonarjs';

const baseRuleModule = sonarjsPlugin.rules['cyclomatic-complexity'];


/** @type {Rule.RuleModule} */
export default {
  ...baseRuleModule,
  create(context) {
    const newContext = Object.create(context, {
      report: {

        /** @type {Rule.RuleContext['report']} */
        value(descriptor) {
          if ('message' in descriptor) {
            let data;
            try { data = JSON.parse(descriptor.message); }
            catch { return context.report(descriptor); }

            if (data && 'message' in data && typeof data.message === 'string')
              return context.report({ ...descriptor, message: data.message });
          }

          return context.report(descriptor);
        }
      }
    });

    return baseRuleModule.create(newContext);
  }
};