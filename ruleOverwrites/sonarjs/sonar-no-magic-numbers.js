/* SonarQube JavaScript Plugin
   Copyright (C) 2011-2024 SonarSource SA
   mailto:info AT sonarsource DOT com

   This program is free software; you can redistribute it and/or
   modify it under the terms of the GNU Lesser General Public
   License as published by the Free Software Foundation; either
   version 3 of the License, or (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
   Lesser General Public License for more details.

   You should have received a copy of the GNU Lesser General Public License
   along with this program; if not, write to the Free Software Foundation,
   Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA. */
// https://sonarsource.github.io/rspec/#/rspec/S109/javascript

// CHANGES: Allow `-1`

/* eslint-disable sonarjs/sonar-no-magic-numbers */
/** @typedef {Parameters<import('eslint').Rule.RuleListener['Literal']>[0]}node*/

import { tsEslintRules } from 'eslint-plugin-sonarjs/cjs/typescript-eslint/index.js';
import { getNodeParent, isMethodInvocation } from 'eslint-plugin-sonarjs/cjs/helpers/index.js';

const baseRuleModule = tsEslintRules['no-magic-numbers'];

/** @type {import('eslint').Rule.RuleModule['create']}*/
export default function sonarNoMagicNumber(context) {
  const baseRule = baseRuleModule.create(context);
  return {
    Literal: node => {
      if (!isNumericLiteral(node))
        return;

      const numericLiteral = getNumericLiteral(node);
      if (!numericLiteral)
        return;

      const { value, parent } = numericLiteral;
      if (
        isException(value)
        || isPower(value)
        || isJSX(context, node)
        || isBitwiseOperator(parent)
        || isJsonStringify(parent))
        return;


      /* eslint-disable-next-line new-cap *//* @ts-expect-error -- Delegate to the typescript-eslint rule*/
      baseRule.Literal(node);
    }
  };
}

/** @param {node}node*/
function getNumericLiteral(node) {
  // Literal or UnaryExpression
  let numberNode;
  let raw;
  let value = numericLiteralValue(node);
  let parent = getNodeParent?.(node);
  if (!parent || value === 0 || value == undefined)
    return;


  // Treat unary minus as a part of the number
  if (parent.type === 'UnaryExpression' && parent.operator === '-') {
    numberNode = parent;
    parent = getNodeParent?.(parent);
    value = -value;
    raw = `-${node.raw}`;
  }
  else {
    numberNode = node;
    raw = node.raw ?? '';
  }
  return { numberNode, raw, value, parent };
}

/** @param {node}node*/
function numericLiteralValue(node) {
  if (typeof node.value === 'number')
    return node.value;
}

/** @param {import('eslint').Rule.NodeParentExtension}node*/
function isNumericLiteral(node) {
  return node.type === 'Literal' && (typeof node.value === 'number' || typeof node.value === 'bigint');
}

/** @param {number}value*/
function isPower(value) {
  return Number.isInteger(Math.log10(value)) || Number.isInteger(Math.log2(value));
}

/**
 * @param {import('eslint').Rule.RuleContext}context
 * @param {node}node*/
function isJSX(context, node) {
  return context.sourceCode.getAncestors(node).some(ancestor => ancestor.type.startsWith('JSX'));
}

/** @param {import('eslint').Rule.NodeParentExtension}node*/
function isBitwiseOperator(node) {
  return node.type === 'BinaryExpression' && ['&', '|', '^', '<<', '>>', '>>>'].includes(node.operator);
}

/** @param {import('eslint').Rule.NodeParentExtension}node*/
function isJsonStringify(node) {
  return node.type === 'CallExpression' && isMethodInvocation?.(node, 'JSON', 'stringify', 3);
}

/** @param {number}value*/
function isException(value) {
  return value === -1;
}