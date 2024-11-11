/* Copyright (c) 2019 typescript-eslint and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */

// CHANGES: Allow imports prefixed with `node:`

/* eslint-disable sonarjs/expression-complexity */
/* eslint-disable sonarjs/switch-without-default */

/* eslint-disable sonarjs/no-implicit-dependencies -- this should throw if the original rule got changed, so we can expect the deps to always exist */
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { unionTypeParts, intersectionTypeParts, includesModifier } from 'ts-api-utils';
import { SyntaxKind } from 'typescript';
/* eslint-enable sonarjs/no-implicit-dependencies */

import {
  createRule,
  getModifiers,
  getParserServices,
  isBuiltinSymbolLike,
  isSymbolFromDefaultLibrary
} from '../../node_modules/@typescript-eslint/eslint-plugin/dist/util/index.js';
import rule from '../../node_modules/@typescript-eslint/eslint-plugin/dist/rules/unbound-method.js';

/** @typedef {Parameters<import('eslint').Rule.RuleListener['Literal']>[0]}node*/

const SUPPORTED_GLOBALS = [
  'Number',
  'Object',
  'String',
  'RegExp',
  'Symbol',
  'Array',
  'Proxy',
  'Date',
  'Atomics',
  'Reflect',
  'console',
  'Math',
  'JSON',
  'Intl'
];
const nativelyBoundMembers = new Set(SUPPORTED_GLOBALS.flatMap(namespace => {
  if (!(namespace in globalThis)) return [];

  const object = global[namespace];
  return Object.getOwnPropertyNames(object)
    .filter(name => !name.startsWith('_') && typeof object[name] === 'function')
    .map(name => `${namespace}.${name}`);
}));

const SUPPORTED_GLOBAL_TYPES = [
  'NumberConstructor',
  'ObjectConstructor',
  'StringConstructor',
  'SymbolConstructor',
  'ArrayConstructor',
  'Array',
  'ProxyConstructor',
  'Console',
  'DateConstructor',
  'Atomics',
  'Math',
  'JSON'
];

const isNotImported = (symbol, currentSourceFile) => {
  const { valueDeclaration } = symbol;
  if (!valueDeclaration) return false;

  return (
    !!currentSourceFile
    && currentSourceFile !== valueDeclaration.getSourceFile()
  );
};

/** @type {import('eslint').Rule.RuleModule['create']}*/
export default createRule({
  ...rule.default,
  create(context, [{ ignoreStatic }]) {
    const services = getParserServices(context);
    const currentSourceFile = services.program.getSourceFile(context.filename);

    function checkIfMethodAndReport(node, symbol) {
      if (!symbol) return false;

      const { dangerous, firstParamIsThis } = checkIfMethod(symbol, ignoreStatic);

      if (dangerous) {
        context.report({
          node,
          messageId: firstParamIsThis === false
            ? 'unboundWithoutThisAnnotation'
            : 'unbound'
        });
        return true;
      }
      return false;
    }

    function isNativelyBound(object, property) {
      if (
        object.type === AST_NODE_TYPES.Identifier
        && property.type === AST_NODE_TYPES.Identifier
      ) {
        const objectSymbol = services.getSymbolAtLocation(object);
        const notImported = objectSymbol != undefined && isNotImported(objectSymbol, currentSourceFile);

        if (notImported && nativelyBoundMembers.has(`${object.name}.${property.name}`))
          return true;
      }

      return (
        isBuiltinSymbolLike(
          services.program,
          services.getTypeAtLocation(object),
          SUPPORTED_GLOBAL_TYPES
        )
        && isSymbolFromDefaultLibrary(
          services.program,
          services.getTypeAtLocation(property).getSymbol()
        )
      );
    }

    return {
      MemberExpression(node) {
        if (isSafeUse(node) || isNativelyBound(node.object, node.property)) return;
        checkIfMethodAndReport(node, services.getSymbolAtLocation(node));
      },
      ObjectPattern(node) {
        if (isException(node) || isNodeInsideTypeDeclaration(node)) return;

        let initNode;
        if (node.parent.type === AST_NODE_TYPES.VariableDeclarator)
          initNode = node.parent.init;
        else if (
          node.parent.type === AST_NODE_TYPES.AssignmentPattern
          || node.parent.type === AST_NODE_TYPES.AssignmentExpression
        )
          initNode = node.parent.right;

        for (const property of node.properties) {
          if (
            property.type !== AST_NODE_TYPES.Property
            || property.key.type !== AST_NODE_TYPES.Identifier
          )
            continue;


          if (initNode) {
            if (!isNativelyBound(initNode, property.key)) {
              const reported = checkIfMethodAndReport(
                property.key,
                services
                  .getTypeAtLocation(initNode)
                  .getProperty(property.key.name)
              );
              if (reported) continue;
            }
            else if (node.parent.type !== AST_NODE_TYPES.AssignmentPattern)
              continue;
          }

          for (const intersectionPart of unionTypeParts(services.getTypeAtLocation(node)).flatMap(unionPart => intersectionTypeParts(unionPart))) {
            const reported = checkIfMethodAndReport(property.key, intersectionPart.getProperty(property.key.name));
            if (reported) break;
          }
        }
      }
    };
  }
}).create;

/** @param {import('eslint').Rule.NodeParentExtension}node*/
function isNodeInsideTypeDeclaration(node) {
  let parent = node;
  /* eslint-disable-next-line no-cond-assign, @typescript-eslint/prefer-destructuring, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions */
  while (parent = parent.parent) {
    if (
      (parent.type === AST_NODE_TYPES.ClassDeclaration && parent.declare)
      || parent.type === AST_NODE_TYPES.TSAbstractMethodDefinition
      || parent.type === AST_NODE_TYPES.TSDeclareFunction
      || parent.type === AST_NODE_TYPES.TSFunctionType
      || parent.type === AST_NODE_TYPES.TSInterfaceDeclaration
      || parent.type === AST_NODE_TYPES.TSTypeAliasDeclaration
      || (parent.type === AST_NODE_TYPES.VariableDeclaration && parent.declare)
    )
      return true;
  }
  return false;
}

function checkIfMethod(symbol, ignoreStatic) {
  const { valueDeclaration } = symbol;
  if (!valueDeclaration) return { dangerous: false };

  switch (valueDeclaration.kind) {
    case SyntaxKind.PropertyDeclaration:
      return { dangerous: valueDeclaration.initializer?.kind === SyntaxKind.FunctionExpression };
    case SyntaxKind.PropertyAssignment: {
      const assignee = valueDeclaration.initializer;
      if (assignee.kind !== SyntaxKind.FunctionExpression)
        return { dangerous: false };
      return checkMethod(assignee, ignoreStatic);
    }
    case SyntaxKind.MethodDeclaration:
    case SyntaxKind.MethodSignature:
      return checkMethod(valueDeclaration, ignoreStatic);
  }

  return { dangerous: false };
}

function checkMethod(valueDeclaration, ignoreStatic) {
  const firstParam = valueDeclaration.parameters.at(0);
  const firstParamIsThis = firstParam?.name.kind === SyntaxKind.Identifier && firstParam.name.escapedText === 'this';
  const thisArgIsVoid = firstParamIsThis && firstParam.type?.kind === SyntaxKind.VoidKeyword;

  return {
    dangerous: !thisArgIsVoid
      && !(ignoreStatic && includesModifier(getModifiers(valueDeclaration), SyntaxKind.StaticKeyword)),
    firstParamIsThis
  };
}

function isSafeUse(node) {
  const parent = node.parent;
  switch (parent?.type) {
    case AST_NODE_TYPES.IfStatement:
    case AST_NODE_TYPES.ForStatement:
    case AST_NODE_TYPES.MemberExpression:
    case AST_NODE_TYPES.SwitchStatement:
    case AST_NODE_TYPES.UpdateExpression:
    case AST_NODE_TYPES.WhileStatement:
      return true;

    case AST_NODE_TYPES.CallExpression:
      return parent.callee === node;

    case AST_NODE_TYPES.ConditionalExpression:
      return parent.test === node;

    case AST_NODE_TYPES.TaggedTemplateExpression:
      return parent.tag === node;

    case AST_NODE_TYPES.UnaryExpression:
      return ['!', 'delete', 'typeof', 'void'].includes(parent.operator);

    case AST_NODE_TYPES.BinaryExpression:
      return ['!=', '!==', '==', '===', 'instanceof'].includes(parent.operator);

    case AST_NODE_TYPES.AssignmentExpression:
      return (
        parent.operator === '='
        && (node === parent.left
          || (node.type === AST_NODE_TYPES.MemberExpression
            && node.object.type === AST_NODE_TYPES.Super
            && parent.left.type === AST_NODE_TYPES.MemberExpression
            && parent.left.object.type === AST_NODE_TYPES.ThisExpression))
      );

    case AST_NODE_TYPES.ChainExpression:
    case AST_NODE_TYPES.TSNonNullExpression:
    case AST_NODE_TYPES.TSAsExpression:
    case AST_NODE_TYPES.TSTypeAssertion:
      return isSafeUse(parent);

    case AST_NODE_TYPES.LogicalExpression:
      if (parent.operator === '&&' && parent.left === node)
        return true;

      return isSafeUse(parent);
  }

  return false;
}

/** @param {node}node*/
function isException(node) {
  return (
    node.parent.init?.type === AST_NODE_TYPES.CallExpression
    && node.parent.init.callee.name === 'require'
    && node.parent.init.arguments[0].value.startsWith('node:')
  );
}