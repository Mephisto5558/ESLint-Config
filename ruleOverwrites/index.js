import { readdirSync } from 'node:fs';

const EXT_LENGTH = 3;

export default {
  rules: Object.fromEntries(await Promise.all(
    readdirSync(import.meta.dirname)
      .filter(e => e !== 'index.js')
      .map(async e => [e.slice(0, -EXT_LENGTH), (await import('./' + e)).default])
  ))
};