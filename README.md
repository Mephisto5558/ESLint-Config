# ESLint-Config

[![Activity](https://img.shields.io/github/commit-activity/m/Mephisto5558/ESLint-Config)](https://github.com/Mephisto5558/ESLint-Config/pulse)
[![License](https://img.shields.io/github/license/Mephisto5558/ESLint-Config)](https://github.com/Mephisto5558/ESLint-Config/blob/main/LICENSE)
[![wakatime](https://wakatime.com/badge/github/Mephisto5558/ESLint-Config.svg)](https://wakatime.com/badge/github/Mephisto5558/ESLint-Config)<br>
[![npm version](https://badge.fury.io/js/@mephisto5558%2Feslint-config.svg)](https://www.npmjs.com/package/@mephisto5558/eslint-config)
[![npm downloads](https://img.shields.io/npm/dm/%40mephisto5558%2Feslint-config)](https://www.npmjs.com/package/@mephisto5558/eslint-config)<br>
[![CodeQL](https://github.com/Mephisto5558/ESLint-Config/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/Mephisto5558/ESLint-Config/actions/workflows/github-code-scanning/codeql)
[![ESLint](https://github.com/Mephisto5558/ESLint-Config/actions/workflows/eslint.yml/badge.svg?branch=main)](https://github.com/Mephisto5558/ESLint-Config/actions/workflows/eslint.yml)

[![Discord Server](https://discord.com/api/guilds/1011956895529041950/widget.png?style=shield)](https://discord.com/invite/yWwGTeppjR)

This is a full opinionated eslint config using multiple plugins.

## Rule Severity

The rules are divided into three severity levels: `error`, `warn`, and `off`.

- <span style='color:red'>error</span>: Rules that indicate potential runtime errors, syntax errors, or unsafe behavior. These should **always** be fixed.<br>
Examples:
  - `@typescript-eslint/no-array-delete`: Disallows using `delete` on array elements, which creates sparse arrays and is often not the intended behavior.
  - `regexp/no-invalid-regexp`: Reports invalid regular expressions in `RegExp` constructors.
  - `eslint/no-const-assign`: Disallows reassigning constants.

- <span style='color:orange'>warn</span>: Rules that point to style issues, best practices, or potential typos, but do not cause runtime errors. These should generally be fixed to improve code quality.<br>
Examples:
  - `@stylistic/quotes`: Enforces the use of single (`'`) quotes.
  - `unicorn/no-for-loop`: Suggests using `for...of` instead of C-style `for` loops.
  - `jsdoc/check-syntax`: Ensures that the JSDoc syntax is valid.

- <span style='color:grey'>off</span>: Rules that are disabled. The reasons for this are:
  - **Covered by other rules**: The functionality is already handled by another, often more specific, rule.<br>
  Example:
    - `eslint/no-dupe-class-members` is disabled because `@typescript-eslint/no-dupe-class-members` handles this better for TypeScript code.
  - **Not (sufficiently) configurable**: The rule does not fit the desired coding style and cannot be adjusted accordingly.<br>
  Example:
    - `@stylistic/object-property-newline` is too restrictive in formatting objects.
  - **Personal preference**: The rule deliberately contradicts the coding style of my projects.<br>
  Example:
    - `unicorn/no-array-reduce` is disabled because I prefer `Array.prototype.reduce`.