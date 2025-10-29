/** @import { getModifiedRule as getModifiedRuleT } from './default_eslint.config.ts' */

/**
 * @template T
 * @param {T | undefined} original
 * @param {T | undefined} update
 * @returns {T} */
function mergeObjects(original, update) {
  if (update === undefined) return original;
  if (
    !original || typeof original != typeof update || Array.isArray(original) != Array.isArray(update)
    || ['string', 'number', 'boolean'].includes(typeof original)
  ) return update;

  if (Array.isArray(original) && Array.isArray(update)) return [...original, ...update];

  const data = {};
  if (typeof original == 'object') {
    for (const [k, v] of Object.entries(original))
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
      data[k] = k in update ? mergeObjects(original[k], update[k]) : v;

    for (const [k, v] of Object.entries(update))
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
      if (!(k in data)) data[k] = v;
  }

  return data;
}

/** @type {getModifiedRuleT} */
/* eslint-disable-next-line import-x/prefer-default-export -- may add more utils in the future */
export function getModifiedRule(config, name, ...newData) {
  const

    /** @type {[string | number, ...JSONValue[]]} */
    [severity, ...ruleConfig] = (Array.isArray(config) ? config : [config]).find(e => e.rules && name in e.rules)?.rules[name] ?? ['off'],
    mergedConfig = Array.from({ length: Math.max(ruleConfig.length, newData.length) }, (_, i) => mergeObjects(ruleConfig[i], newData[i]));

  return [severity, ...mergedConfig];
}