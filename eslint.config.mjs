import * as configurations from 'eslint-config-canonical';
import sql from 'eslint-plugin-sql';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  configurations.jsdoc.recommended,
  configurations.canonical.recommended,
  configurations.typescript.recommended,
  configurations.regexp.recommended,
  configurations.node.recommended,
  configurations.react.recommended,
  configurations.prettier.recommended,
  {
    files: ['**/*.js', '**/*.cjs', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        // Enabling this option will make ESLint use the TypeScript linter (even if none of the TypeScript rules are enabled).
        project: true,
      },
    },
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
      // Disabled due to a bug
      // https://github.com/import-js/eslint-plugin-import/issues/1247
      'import/no-self-import': 0,
      'import/no-useless-path-segments': 0,
      'jsdoc/require-property-type': 0,
    },
    settings: {
      'import/extensions': ['.js', '.jsx', '.mjs', '.ts', '.tsx'],
      react: {
        version: '18',
      },
    },
  },
  {
    files: ['**/*.ts'],
    plugins: { sql },
    rules: {
      'sql/format': [
        2,
        {},
        {
          dataTypeCase: 'lower',
          functionCase: 'lower',
          keywordCase: 'upper',
          language: 'postgresql',
        },
      ],
    },
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 0,
      '@typescript-eslint/no-var-requires': 0,
    },
  },
  [
    // The vitest configuration is not scoped to test files on its own.
    ...configurations.vitest.recommended.map((configuration) => {
      return {
        ...configuration,
        files: ['**/*.test.ts', '**/*.test.tsx'],
      };
    }),
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'vitest/expect-expect': 0,
        'vitest/no-conditional-tests': 0,
        'vitest/no-disabled-tests': 0,
      },
    },
  ],
  {
    ignores: [
      '**/dist/**',
      '**/__generated__/**',
      '**/pnpm-lock.yaml',
      '**/vitest.config.ts',
      // We ignore `package.json` because we have certain keys that MUST be in a specific order.
      // Namely `exports` always wants `default` to be last or else you get an error.
      // https://contra-work.slack.com/archives/C016ND05C2Z/p1674520150630079
      '**/package.json',
      'src/tests/test.d.ts',
    ],
  },
);
