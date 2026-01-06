import type * as __ from '@mephisto5558/better-types'; /* eslint-disable-line import-x/no-namespace -- load in global definitions */

import type { ESLint, Linter } from 'eslint';
import type Globals from 'globals';

declare const defaultExport: Linter.Config[];

export default defaultExport;
export const plugins: Record<string, ESLint.Plugin>;
export const globals: typeof Globals;
export const tsGlob: '.{m,c,}ts{,x}';
export const jsGlob: '.{m,c,}js{,x}';

/** Merge old and new config for a rule, returning the new rule */
export function getModifiedRule(
  config: Linter.Config | Linter.Config[], name: string, ...newData: JSONValue[]
): Linter.RuleEntry;