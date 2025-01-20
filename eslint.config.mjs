import  configurations from 'eslint-config-canonical/configurations/index.js';
// import sql from 'eslint-plugin-sql';

export default [
  {
    plugins: {
      ...configurations.canonical.recommended.plugins,
      ...configurations.typescript.recommended.plugins,
      ...configurations.regexp.recommended.plugins,
      ...configurations.jsdoc.recommended.plugins,
      ...configurations.node.recommended.plugins,
      ...configurations.react.recommended.plugins,
      ...configurations.prettier.recommended.plugins,
    },
    rules: {
      ...configurations.canonical.recommended.rules,
      ...configurations.typescript.recommended.rules,
      ...configurations.regexp.recommended.rules,
      ...configurations.jsdoc.recommended.rules,
      ...configurations.node.recommended.rules,
      ...configurations.react.recommended.rules,
      ...configurations.prettier.recommended.rules,
      // Disabled due to a bug
      // https://github.com/import-js/eslint-plugin-import/issues/1247
      'import/no-self-import': 0,
      '@typescript-eslint/consistent-type-imports': 0,
      // ignorePackages is disabled because there are too many false-positives
      // when attempting to identify if a package import requires .js extension or not.
      // We need to consider that the resolved path can be @types/.
      // We need to consider that the package.json might have package.json#exports rules.
      'canonical/require-extension': [2, { ignorePackages: true }],
      'import/no-useless-path-segments': 0,
      'import/no-named-as-default': 0,
      // Needed only during the rollout of NodeNext
      'import/extensions': 0,
      'import/no-named-default': 0,
      'jsdoc/require-property-type': 0,
    },
    files: [
      '**/*.js',
      '**/*.cjs',
      '**/*.ts',
      '**/*.tsx',
    ],
    languageOptions: {
      globals: {
        ...configurations.node.recommended.languageOptions.globals,
        ...configurations.browser.recommended.languageOptions.globals,
      },
      parser: configurations.typescript.recommended.languageOptions.parser,
      parserOptions: {
        ...configurations.typescript.recommended.languageOptions.parserOptions,
        ecmaVersion: "latest",
        // Enabling this option will make ESLint use the TypeScript linter (even if none of the TypeScript rules are enabled).
        project: true,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      'import/extensions': ['.js', '.jsx', '.mjs', '.ts', '.tsx'],
      react: {
        version: '18',
      },
    },
  },
  // {
  //   files: ['**/*.ts', '**/*.tsx'],
  //   plugins: { sql },
  //   rules: {
  //     'sql/format': [
  //       2,
  //       {},
  //       {
  //         language: 'postgresql',
  //         keywordCase: 'upper',
  //         functionCase: 'lower',
  //         dataTypeCase: 'lower'
  //       }
  //     ],
  //   },
  // },
  {
    files: ['**/*.js', '**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 0,
      '@typescript-eslint/no-var-requires': 0,
    },
  },
  {
    plugins: {
      ...configurations.vitest.recommended.plugins,
    },
    rules: {
      ...configurations.vitest.recommended.rules,
      'vitest/expect-expect': 0,
      'vitest/no-conditional-tests': 0,
      'vitest/no-disabled-tests': 0,
    },
    files: ['**/*.test.ts', '**/*.test.tsx'],
  },
  {
    ignores: [
      '**/dist/**',
      '**/__generated__/**',
      '**/pnpm-lock.yaml',
      '**/vite.config.ts.*',
      // We ignore `package.json` because we have certain keys that MUST be in a specific order.
      // Namely `exports` always wants `default` to be last or else you get an error.
      // https://contra-work.slack.com/archives/C016ND05C2Z/p1674520150630079
      '**/package.json',
      'src/tests/test.d.ts',
    ],
  }

];
