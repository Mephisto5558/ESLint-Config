import { readdirSync } from 'node:fs';

const EXT_LENGTH = 3;

/** @type {import('eslint').ESLint.Plugin} */
export default {
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
  rules: Object.fromEntries(await Promise.all(
    readdirSync(import.meta.dirname)
      .filter(e => e !== 'index.js')
      .map(

        /**
         * @inheritdoc
         * @returns {[string, import('eslint').Rule.RuleModule]} */
        async file => {
          /** @type {{ default: import('eslint').Rule.RuleModule }} */
          const module = await import('./' + file); /* eslint-disable-line @typescript-eslint/no-unsafe-assignment -- import cannot be typed */
          return [file.slice(0, -EXT_LENGTH), module.default];
        }
      )
  ))
};