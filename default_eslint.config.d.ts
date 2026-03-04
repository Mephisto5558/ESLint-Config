/* eslint-disable unicorn/filename-case */
import type * as __ from '@mephisto5558/better-types'; /* eslint-disable-line import-x/no-namespace -- load in global definitions */

import type { ESLint, Linter } from 'eslint';
import type Globals from 'globals';

declare const defaultExport: Linter.Config[];

export default defaultExport;
export const pluginNames: Record<
  'css' | 'html' | 'import' | 'jsdoc' | 'json' | 'jsonc' | 'packageJSON'
  | 'regex' | 'sonar' | 'stylistic' | 'typescript' | 'unicorn' | 'custom',
  string
>;
export const plugins: Record<string, ESLint.Plugin>;
export const globals: typeof Globals;
export const tsGlob: '.{m,c,}ts{,x}';
export const jsGlob: '.{m,c,}js{,x}';

/** Merge old and new config for a rule, returning the new rule */
export function getModifiedRule<NAME extends string, RULE_ONLY extends boolean = false>(
  config: Linter.Config | Linter.Config[], name: NAME, newData: JSONValue[], returnRuleOnly?: RULE_ONLY
): RULE_ONLY extends true ? Linter.RuleEntry : Record<NAME, Linter.RuleEntry>;