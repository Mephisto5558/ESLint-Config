import { readdirSync } from 'node:fs';

/* eslint-disable-next-line @limegrass/import-alias/import-alias -- false positive */
import type { ESLint, Rule } from 'eslint';

const EXT_LENGTH = 3;

export default {
  meta: {
    name: 'custom',
    namespace: 'custom'
  } as const,
  rules: Object.fromEntries(await Promise.all(
    readdirSync(import.meta.dirname)

      // support loading from src or dist
      .filter(e => !e.endsWith('.d.ts') && !e.startsWith('index.'))
      .map<Promise<[string, Rule.RuleModule]>>(async file => {
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- import cannot be typed */
        const module = await import('./' + file) as { default: Rule.RuleModule };
        return [file.slice(0, -EXT_LENGTH), module.default];
      })
  ))
} satisfies ESLint.Plugin;