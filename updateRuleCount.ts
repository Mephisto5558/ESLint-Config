import { readFileSync, writeFileSync } from 'node:fs';

/* eslint-disable-line @typescript-eslint/ban-ts-comment -- sometimes this does not error */// @ts-ignore
import config from './dist/index.js';
import type srcConfig from './src/index.ts';

const enabledRules = new Set<string>();
for (const block of config as typeof srcConfig) {
  if (!block.rules) continue;

  for (const [name, value] of Object.entries(block.rules)) {
    const severity = Array.isArray(value) ? value[0] : value;

    if (!severity || severity == 'off') enabledRules.delete(name);
    else enabledRules.add(name);
  }
}

const updated = readFileSync('README.md', 'utf8')
  .replaceAll(/(?<=<!-- RULE_COUNT -->).*?(?=<!--)/g, () => enabledRules.size.toString());

writeFileSync('README.md', updated);
console.log(`Updated README.md with ${enabledRules.size} rules.`);