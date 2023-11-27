const path = require('node:path');

module.exports = {
  ignorePatterns: [
    'dist',
    '/pnpm-lock.yaml',
    '!.github'
  ],
  overrides: [
    {
      extends: ['canonical/json'],
      files: '*.json',
    },
    {
      extends: ['canonical/yaml'],
      files: '*.yaml',
    },
    {
      extends: ['canonical', 'canonical/node', 'canonical/prettier'],
      files: '*.js',
    },
  ],
  root: true,
  settings: {
    'import/resolver': {
      typescript: {
        project: path.resolve(__dirname, 'tsconfig.json'),
      },
    },
  },
};
