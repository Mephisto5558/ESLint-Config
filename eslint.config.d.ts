import type { Linter, ESLint } from 'eslint';

declare const defaultExport: Linter.Config[];

export default defaultExport;
export const plugins: Record<string, ESLint.Plugin>;