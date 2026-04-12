import { readFileSync, writeFileSync } from 'node:fs';

import config from './dist/index.js';

const enabledRules = new Set<string>();
for (const block of config) {
  if (!block.rules) continue;

  for (const [name, value] of Object.entries(block.rules)) {
    const severity = Array.isArray(value) ? value[0] : value;

    if (!severity || severity == 'off') enabledRules.delete(name);
    else enabledRules.add(name);
  }
}

const updated = readFileSync('README.md', 'utf8')
  .replaceAll(/(?<=<!-- RULE_COUNT -->).*?(?=<!--)/g, enabledRules.size.toString());

writeFileSync('README.md', updated);
console.log(`Updated README.md with ${enabledRules.size} rules.`);