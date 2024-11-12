import { rules } from 'eslint-plugin-sonarjs';

const baseRuleModule = rules['sonar-no-magic-numbers'];

export default {
  ...baseRuleModule,
  create(context) {
    const baseRule = baseRuleModule.create(context);

    return {
      ...baseRule,
      Literal: node => {
        if (getNumericLiteral(node) === -1) return;

        /* eslint-disable-next-line new-cap */
        baseRule.Literal(node);
      }
    };
  }
};

function getNumericLiteral(node) {
  if (node.parent && typeof node.value == 'number')
    return node.parent.type === 'UnaryExpression' && node.parent.operator === '-' ? -node.value : node.value;
}