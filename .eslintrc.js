const
  { readFileSync } = require('node:fs'),
  { join, basename } = require('node:path');

/** @param {string}path Removes comments*/
function importJsonC(path) {
  const rules = JSON.parse(readFileSync(join(__dirname, path), 'utf8').replaceAll(/\/\/.*/g, ''));
  let filename = basename(path, '.jsonc');
  filename = filename == 'eslint' ? '' : `${filename}/`;

  return Object.fromEntries(Object.entries(rules).map(([k, v]) => [`${filename}${k}`, v]));
}

// This config lists all rules from every plugin it uses.
module.exports = {
  root: true,
  env: {
    node: true,
    es2024: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    '@stylistic',
    '@typescript-eslint',
    'jsdoc',
    'sonarjs',
    'unicorn'
  ],
  parser: '@typescript-eslint/parser',
  reportUnusedDisableDirectives: true,
  rules: {
    ...importJsonC('configs/eslint.jsonc'),
    ...importJsonC('configs/@stylistic.jsonc'),
    ...importJsonC('configs/@typescript-eslint.jsonc'),
    ...importJsonC('configs/jsdoc.jsonc'),
    ...importJsonC('configs/sonarjs.jsonc'),
    ...importJsonC('configs/unicorn.jsonc')
  },
  overrides: [
    {
      files: '*.d.ts',
      extends: 'plugin:@typescript-eslint/recommended',
      rules: {
        // TS-Only rules
        'no-shadow': 'off',
        'no-use-before-define': 'off',
        '@stylistic/member-delimiter-style': [
          'error',
          {
            multiline: {
              delimiter: 'semi',
              requireLast: true
            },
            singleline: {
              delimiter: 'semi',
              requireLast: false
            },
            multilineDetection: 'brackets'
          }
        ],
        '@stylistic/type-annotation-spacing': [
          'error',
          {
            before: false,
            after: true,
            overrides: {
              arrow: {
                before: true,
                after: true
              }
            }
          }
        ],
        '@stylistic/type-generic-spacing': 'error',
        '@stylistic/type-named-tuple-spacing': 'error',
        'jsdoc/no-types': 'error'
      }
    }
  ]
};