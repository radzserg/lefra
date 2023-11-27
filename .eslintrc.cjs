module.exports = {
  env: {
    es6: true,
  },
  ignorePatterns: [
    '/dist',
    // We ignore `package.json` because we have certain keys that MUST be in a specific order.
    // Namely `exports` always wants `default` to be last or else you get an error.
    '/package.json',
  ],
  overrides: [
    {
      extends: [
        'canonical',
        'canonical/regexp',
        'canonical/jsdoc',
        'canonical/node',
        'canonical/prettier',
      ],
      files: ['*.js', '*.cjs'],
    },
    {
      extends: [
        'canonical',
        'canonical/regexp',
        'canonical/jsdoc',
        'canonical/node',
        'canonical/typescript',
        'canonical/prettier',
        'canonical/react',
      ],
      files: ['*.ts'],
      rules: {
        // Disabled due to a bug
        // https://github.com/import-js/eslint-plugin-import/issues/1247
        'import/no-self-import': 0,
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/consistent-type-imports': 0,
        // ignorePackages is disabled because there are too many false-positives
        // when attempting to identify if a package import requires .js extension or not.
        // We need to consider that the resolved path can be @types/.
        // We need to consider that the package.json might have package.json#exports rules.
        'canonical/require-extension': [2, { ignorePackages: true }],
        // Needed only during the rollout of NodeNext
        'import/extensions': 0,

        'import/no-named-as-default': 0,

        'import/no-named-default': 0,
        'import/no-useless-path-segments': 0,
      },
    },
    {
      extends: ['canonical/vitest'],
      files: ['*.test.{ts,tsx}'],
      rules: {
        'vitest/expect-expect': 0,
        'vitest/no-conditional-tests': 0,
        'vitest/no-skipped-tests': 0,
      },
    },
    {
      extends: ['canonical/json'],
      files: '*.json',
    },
    {
      extends: ['canonical/yaml'],
      files: '*.yaml',
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
};
