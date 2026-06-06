import semver from 'semver';

import type { ESLint, Rule } from 'eslint';

/**
 * eslint-plugin-n has a bug where it considers a use safe if any of the versions set match,
 * e.g. a node 15 feature with engines.node being "14 || 15" */
/* eslint-disable-next-line import-x/prefer-default-export -- easier loading in ./index.ts */
export const createVersionCheckerFixedRule = (baseRuleModule: NonNullable<ESLint.Plugin['rules']>[string]): Rule.RuleModule => ({
  ...baseRuleModule,
  create(context: Rule.RuleContext & { options: [{ allowExperimental?: boolean } | undefined, ...unknown[]] }): Rule.RuleListener {
    const
      allowExperimental = context.options[0]?.allowExperimental,
      newContext = Object.create(context, {
        report: {
          value(descriptor: Rule.ReportDescriptor) {
            const supportedVersion = (descriptor.data?.supported ?? (allowExperimental ? descriptor.data?.experimental : undefined))
              ?.toString().replaceAll(/ \(backported: |, /gi, '||').replace(')', '');

            if (descriptor.data?.version && supportedVersion) {
              const
                minConfigured = semver.minVersion(descriptor.data.version.toString()),
                minSupported = semver.minVersion(supportedVersion);

              if (minConfigured && minSupported && semver.gte(minConfigured, minSupported)) return;
            }

            return context.report(descriptor);
          }
        }
      });

    return baseRuleModule.create(newContext);
  }
});