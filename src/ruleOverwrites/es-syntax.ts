import nodePlugin from 'eslint-plugin-n';
import { createVersionCheckerFixedRule } from './utils/index.ts';

const baseRuleModule = nodePlugin.rules?.['no-unsupported-features/es-syntax'];
if (!baseRuleModule) throw new Error('baseRule for no-unsupported-features/es-syntax not found');

export default createVersionCheckerFixedRule(baseRuleModule);