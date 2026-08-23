import nodePlugin from 'eslint-plugin-n';
import { createVersionCheckerFixedRule } from './utils/index.ts';


const baseRuleModule = nodePlugin.rules?.['prefer-process-get-builtin-module'];
if (!baseRuleModule) throw new Error('baseRule for prefer-process-get-builtin-module not found');

export default createVersionCheckerFixedRule(baseRuleModule);