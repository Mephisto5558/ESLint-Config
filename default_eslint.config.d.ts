import type { ESLint, Linter } from 'eslint';
import type Globals from 'globals';

declare const defaultExport: Linter.Config[];

export default defaultExport;
export const plugins: Record<string, ESLint.Plugin>;
export const globals: typeof Globals;

/** Merge old and new config for a rule, returning the new rule */
export function getModifiedRule(
  config: Linter.Config | Linter.Config[], name: string, ...newData: JSONValue[]
): Linter.RuleEntry;