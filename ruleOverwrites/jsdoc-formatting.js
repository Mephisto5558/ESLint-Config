/**
 * Normalizes the spacing within a JSDoc type definition string
 * @param {string} tagName
 * @param {string} content */
function getCorrectedType(tagName, content) {
  const /** @type {string[]} */ placeholders = [];
  let tempContent = content;

  /* STAGE 1 MASKING: Protect `${...}` expressions FIRST. */
  tempContent = tempContent.replaceAll(/\$\{[^{}]*\}/g, match => {
    placeholders.push(match);
    return `__JSDOC_PLACEHOLDER_${placeholders.length - 1}__`;
  });

  /* STAGE 2 MASKING: Protect all other literals (`...`, '...', "...", <...>). */
  /* eslint-disable regexp/no-super-linear-move */
  tempContent = tempContent.replaceAll(/`[^`]*`|'[^']*'|"[^"]*"|<[^>]*>/g, match => {
    placeholders.push(match);
    return `__JSDOC_PLACEHOLDER_${placeholders.length - 1}__`;
  });

  // FORMATTING: Apply all rules to the fully masked string.
  const formattedMaskedContent = tempContent

    // Unify operator spacing
    .replaceAll(/\s*(?<char>[&|])\s*/g, ' $<char> ')
    .replaceAll(/\s*=\s*(?!>)/g, ' = ')
    .replaceAll(/\s*=>\s*/g, ' => ')

    // Object and separator spacing
    .replaceAll(/\s*(?<char>[,:])\s*/g, '$<char> ')
    .replaceAll(/\{\s*/g, '{ ')

    // 1. Aggressively add a space before EVERY closing brace. This fixes `}}` -> ` } }`.
    .replaceAll(/\s*\}/g, ' }')
    .replaceAll('{ }', '{}') // 2. Correct the one case where this is wrong: empty objects.

    // Cleanup brackets/generics
    .replaceAll(/<\s+/g, '<')
    .replaceAll(/\s+>/g, '>')
    .replaceAll(/\[\s+/g, '[')
    .replaceAll(/\s+\]/g, ']')

    // Final polish
    .replaceAll(/\s{2,}/g, ' ')
    .trim();


  // FIX #2: UNMASKING must be recursive to handle nested placeholders.
  let finalContent = formattedMaskedContent;
  while (/__JSDOC_PLACEHOLDER_\d+__/.test(finalContent))
    finalContent = finalContent.replaceAll(/__JSDOC_PLACEHOLDER_(?<i>\d+)__/g, (_, i) => placeholders[Number.parseInt(i)]);

  // Wrap the final result in a single pair of braces for the linter rule.
  return tagName == 'import' ? `{ ${finalContent} }` : `{${finalContent}}`;

  /* eslint-enable regexp/no-super-linear-move */
}

const typeStartRegex = /@(?<tagName>extends|implements|import|param|property|returns|this|throws|type|typedef)\s*\{/g;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforce consistent formatting in comments, such as spacing and JSDoc type formats.',
      recommended: true
    },
    fixable: 'whitespace',
    messages: {
      missingSpaceAfter: 'Missing space or newline after comment.',
      missingSpaceAfterType: 'Missing space or newline after JSDoc type.',
      badTypeFormatting: 'JSDoc type is not formatted correctly. Expected: {{expected}}'
    }
  },

  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (comment.type !== 'Block') continue;

          const
            commentText = context.sourceCode.getText(comment),

            // Rule: Space after the entire comment block
            nextToken = context.sourceCode.getTokenAfter(comment);

          if (nextToken && !context.sourceCode.isSpaceBetween(comment, nextToken)) {
            context.report({
              node: comment,
              messageId: 'missingSpaceAfter',
              fix: fixer => fixer.insertTextAfter(comment, ' ')
            });
          }

          // JSDoc type formatting using a brace-counting parser
          let match;

          // Reset regex for each comment
          const localTypeStartRegex = new RegExp(typeStartRegex);
          while ((match = localTypeStartRegex.exec(commentText)) !== null) {
            const typeStartIndexInComment = match.index + match[0].lastIndexOf('{');

            let braceLevel = 1, typeEndIndexInComment = -1;
            for (let i = typeStartIndexInComment + 1; i < commentText.length; i++) {
              if (commentText[i] === '{') braceLevel++;
              else if (commentText[i] === '}') braceLevel--;
              if (!braceLevel) {
                typeEndIndexInComment = i + 1;
                break;
              }
            }

            if (typeEndIndexInComment === -1) continue;

            const
              typeDefStartIndex = comment.range[0] + typeStartIndexInComment,
              typeDefEndIndex = comment.range[0] + typeEndIndexInComment,
              originalTypeDef = commentText.slice(typeStartIndexInComment, typeEndIndexInComment),
              correctedTypeDef = getCorrectedType(match.groups.tagName, originalTypeDef.slice(1, -1));

            if (originalTypeDef !== correctedTypeDef) {
              context.report({
                loc: {
                  start: context.sourceCode.getLocFromIndex(typeDefStartIndex),
                  end: context.sourceCode.getLocFromIndex(typeDefEndIndex)
                },
                messageId: 'badTypeFormatting',
                data: { expected: correctedTypeDef },
                fix: fixer => fixer.replaceTextRange([typeDefStartIndex, typeDefEndIndex], correctedTypeDef)
              });
            }

            // Check for space *after* the type definition
            const charAfterType = commentText[typeEndIndexInComment];
            if (charAfterType && !/[\s*\]]/.test(charAfterType)) { // Allow ']' to follow a type
              context.report({
                loc: {
                  start: context.sourceCode.getLocFromIndex(typeDefEndIndex),
                  end: context.sourceCode.getLocFromIndex(typeDefEndIndex + 1)
                },
                messageId: 'missingSpaceAfterType',
                fix: fixer => fixer.insertTextAfterRange([typeDefEndIndex - 1, typeDefEndIndex], ' ')
              });
            }
          }
        }
      }
    };
  }
};