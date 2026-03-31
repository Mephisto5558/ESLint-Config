/* eslint-disable-next-line @limegrass/import-alias/import-alias -- false positive */
import type { Linter } from 'eslint';

function mergeObjects<T>(original: T, update: T | undefined): T {
  if (update === undefined) return original;
  if (
    !original || typeof original != typeof update || Array.isArray(original) != Array.isArray(update)
    || ['string', 'number', 'boolean'].includes(typeof original)
  ) return update;

  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- generics do not work well */
  if (Array.isArray(original) && Array.isArray(update)) return [...original, ...update] as T;

  const data: Record<string, unknown> = {};
  if (typeof original == 'object') {
    for (const [k, v] of Object.entries(original))
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- generics do not work well */
      data[k] = k in (update as object) ? mergeObjects((original as Record<string, unknown>)[k], (update as Record<string, unknown>)[k]) : v;

    for (const [k, v] of Object.entries(update))
      if (!(k in data)) data[k] = v;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- generics do not work well */
  return data as T;
}

/** Merge old and new config for a rule, returning the new rule */
/* eslint-disable-next-line import-x/prefer-default-export -- may add more utils in the future */
export function getModifiedRule<NAME extends string, RULE_ONLY extends boolean = false>(
  config: Linter.Config | Linter.Config[], name: NAME, newData: JSONValue[], returnRuleOnly?: RULE_ONLY
): RULE_ONLY extends true ? Linter.RuleEntry : Record<NAME, Linter.RuleEntry> {
  const
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- generics do not work well */
    [severity, ...ruleConfig] = (Array.isArray(config) ? config : [config])
      .find(e => 'rules' in e && name in e.rules)?.rules?.[name] as [string | number, ...JSONValue[]] | undefined ?? ['off'],
    mergedConfig = Array.from({ length: Math.max(ruleConfig.length, newData.length) }, (_, i) => mergeObjects(ruleConfig[i], newData[i]));

  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- generics do not work well */
  return (
    returnRuleOnly ? [severity, ...mergedConfig] : { [name]: [severity, ...mergedConfig] }
  ) as RULE_ONLY extends true ? Linter.RuleEntry : Record<NAME, Linter.RuleEntry>;
}