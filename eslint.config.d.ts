import type { ESLint, Linter } from 'eslint';

declare const defaultExport: Linter.Config[];

export default defaultExport;
export const plugins: Record<string, ESLint.Plugin>;