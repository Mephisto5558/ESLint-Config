import type { ESLint, Linter } from 'eslint';
import type Globals from 'globals';

declare const defaultExport: Linter.Config[];

export default defaultExport;
export const plugins: Record<string, ESLint.Plugin>;
export const globals: typeof Globals;